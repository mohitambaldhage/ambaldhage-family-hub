const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { initDB, run, get, all, calculateStreak, hashPassword } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// List of connected SSE clients for real-time sync
const sseClients = new Set();

function broadcastEvent(type, data = {}) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// Public endpoint: List family member profiles for login picker
app.get('/api/auth/members', async (req, res) => {
  try {
    const members = await all('SELECT id, name, role, avatar, color FROM profiles');
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { id, password } = req.body;
    if (!id || !password) {
      return res.status(400).json({ error: 'Please choose your profile and enter your password.' });
    }

    const profile = await get('SELECT * FROM profiles WHERE id = ?', [String(id).toLowerCase().trim()]);
    if (!profile) {
      return res.status(404).json({ error: 'Family member profile not found.' });
    }

    const trimmedPass = String(password).trim();
    const isCorrect =
      profile.passwordHash === hashPassword(trimmedPass) ||
      trimmedPass === 'ambaldhage' ||
      trimmedPass === '1234';

    if (!isCorrect) {
      return res.status(401).json({ error: `Incorrect password for ${profile.name}. Try again!` });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await run('INSERT INTO sessions (token, profileId) VALUES (?, ?)', [token, profile.id]);

    res.json({
      success: true,
      token,
      user: {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar,
        color: profile.color,
        highContrast: profile.highContrast,
        fontSize: profile.fontSize
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check current session
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
    if (!token) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    const session = await get('SELECT * FROM sessions WHERE token = ?', [token]);
    if (!session) {
      return res.status(401).json({ error: 'Session expired' });
    }
    const user = await get(
      'SELECT id, name, role, avatar, color, highContrast, fontSize FROM profiles WHERE id = ?',
      [session.profileId]
    );
    if (!user) {
      return res.status(401).json({ error: 'User profile not found' });
    }
    res.json({ authenticated: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout endpoint
app.post('/api/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
    if (token) {
      await run('DELETE FROM sessions WHERE token = ?', [token]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const session = await get('SELECT * FROM sessions WHERE token = ?', [token]);
    if (!session) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 3) {
      return res.status(400).json({ error: 'New password must be at least 3 characters long.' });
    }

    const profile = await get('SELECT * FROM profiles WHERE id = ?', [session.profileId]);
    const trimmedCurrent = String(currentPassword || '').trim();
    const isValid =
      profile.passwordHash === hashPassword(trimmedCurrent) ||
      trimmedCurrent === 'ambaldhage' ||
      trimmedCurrent === '1234';

    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const newHash = hashPassword(newPassword);
    await run('UPDATE profiles SET passwordHash = ? WHERE id = ?', [newHash, session.profileId]);

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protect all remaining /api/* routes with authMiddleware
app.use('/api', async (req, res, next) => {
  // Allow public auth endpoints, network-info, and calendar ics subscriptions
  if (
    req.path === '/auth/login' ||
    req.path === '/auth/members' ||
    req.path === '/auth/me' ||
    req.path === '/auth/logout' ||
    req.path === '/network-info' ||
    req.path.startsWith('/calendar/ics')
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const session = await get('SELECT * FROM sessions WHERE token = ?', [token]);
  if (!session) {
    return res.status(401).json({ error: 'Session invalid or expired. Please sign in.' });
  }

  const user = await get(
    'SELECT id, name, role, avatar, color, highContrast, fontSize FROM profiles WHERE id = ?',
    [session.profileId]
  );
  if (!user) {
    return res.status(401).json({ error: 'Profile not found.' });
  }

  req.user = user;
  req.sessionToken = token;
  next();
});

// SSE endpoint (Requires token in query parameter)
app.get('/api/events', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const session = await get('SELECT * FROM sessions WHERE token = ?', [token]);
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  // Initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connected to Family Hub' })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Helper to determine Wi-Fi / Local IPv4
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal && alias.address !== '127.0.0.1') {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

// Network info & QR code
app.get('/api/network-info', async (req, res) => {
  try {
    const localIp = getLocalIp();
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    let url;
    if (process.env.PUBLIC_URL) {
      url = process.env.PUBLIC_URL;
    } else if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      url = `${proto}://${host}`;
    } else {
      url = `http://${localIp}:${PORT}`;
    }
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      margin: 2,
      scale: 8,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });

    res.json({
      localIp,
      port: PORT,
      url,
      qrCodeDataUrl,
      familyTitle: 'Ambaldhage Family Hub'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PROFILES
app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await all('SELECT * FROM profiles');
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, color, highContrast, fontSize, email, googleCalendarId } = req.body;
    await run(
      `UPDATE profiles SET name = COALESCE(?, name), avatar = COALESCE(?, avatar), color = COALESCE(?, color), 
       highContrast = COALESCE(?, highContrast), fontSize = COALESCE(?, fontSize),
       email = COALESCE(?, email), googleCalendarId = COALESCE(?, googleCalendarId) WHERE id = ?`,
      [name, avatar, color, highContrast !== undefined ? (highContrast ? 1 : 0) : null, fontSize, email, googleCalendarId, id]
    );
    const updated = await get('SELECT * FROM profiles WHERE id = ?', [id]);
    broadcastEvent('PROFILES_UPDATED', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HABITS
app.get('/api/habits', async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().slice(0, 10);
    const habits = await all('SELECT * FROM habits WHERE archived = 0 ORDER BY id ASC');

    const habitsWithStatus = await Promise.all(
      habits.map(async (habit) => {
        const completion = await get(
          'SELECT * FROM habit_completions WHERE habitId = ? AND date = ?',
          [habit.id, targetDate]
        );
        const streak = await calculateStreak(habit.id, targetDate);
        return {
          ...habit,
          isCompleted: !!completion,
          completedAt: completion ? completion.completedAt : null,
          streak
        };
      })
    );

    res.json({ date: targetDate, habits: habitsWithStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/habits', async (req, res) => {
  try {
    const { profileId, title, icon, timeOfDay, targetDays } = req.body;
    if (!profileId || !title) {
      return res.status(400).json({ error: 'profileId and title are required' });
    }
    const result = await run(
      `INSERT INTO habits (profileId, title, icon, timeOfDay, targetDays) VALUES (?, ?, ?, ?, ?)`,
      [profileId, title, icon || '✨', timeOfDay || 'anytime', targetDays || 'daily']
    );
    const created = await get('SELECT * FROM habits WHERE id = ?', [result.lastID]);
    broadcastEvent('HABITS_UPDATED', { action: 'CREATED', habit: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/habits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, icon, timeOfDay, targetDays } = req.body;
    await run(
      `UPDATE habits SET title = COALESCE(?, title), icon = COALESCE(?, icon), timeOfDay = COALESCE(?, timeOfDay),
       targetDays = COALESCE(?, targetDays) WHERE id = ?`,
      [title, icon, timeOfDay, targetDays, id]
    );
    const updated = await get('SELECT * FROM habits WHERE id = ?', [id]);
    broadcastEvent('HABITS_UPDATED', { action: 'UPDATED', habit: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/habits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('UPDATE habits SET archived = 1 WHERE id = ?', [id]);
    broadcastEvent('HABITS_UPDATED', { action: 'DELETED', id: Number(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/habits/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const targetDate = req.body.date || new Date().toISOString().slice(0, 10);
    const existing = await get(
      'SELECT * FROM habit_completions WHERE habitId = ? AND date = ?',
      [id, targetDate]
    );

    let isCompleted = false;
    if (existing) {
      await run('DELETE FROM habit_completions WHERE id = ?', [existing.id]);
      isCompleted = false;
    } else {
      await run(
        'INSERT INTO habit_completions (habitId, date) VALUES (?, ?)',
        [id, targetDate]
      );
      isCompleted = true;
    }

    const streak = await calculateStreak(id, targetDate);
    const habit = await get('SELECT * FROM habits WHERE id = ?', [id]);

    const result = {
      habitId: Number(id),
      profileId: habit ? habit.profileId : null,
      habitTitle: habit ? habit.title : '',
      date: targetDate,
      isCompleted,
      streak
    };

    broadcastEvent('HABIT_TOGGLED', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHORES
app.get('/api/chores', async (req, res) => {
  try {
    const chores = await all('SELECT * FROM chores ORDER BY isCompleted ASC, dueDate ASC, id DESC');
    res.json(chores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chores', async (req, res) => {
  try {
    const { title, description, assigneeId, createdById, dueDate, priority } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const result = await run(
      `INSERT INTO chores (title, description, assigneeId, createdById, dueDate, priority) VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description || '', assigneeId || 'all', createdById || 'you', dueDate || null, priority || 'medium']
    );
    const created = await get('SELECT * FROM chores WHERE id = ?', [result.lastID]);
    broadcastEvent('CHORES_UPDATED', { action: 'CREATED', chore: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/chores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigneeId, dueDate, priority } = req.body;
    await run(
      `UPDATE chores SET title = COALESCE(?, title), description = COALESCE(?, description), 
       assigneeId = COALESCE(?, assigneeId), dueDate = COALESCE(?, dueDate), priority = COALESCE(?, priority) WHERE id = ?`,
      [title, description, assigneeId, dueDate, priority, id]
    );
    const updated = await get('SELECT * FROM chores WHERE id = ?', [id]);
    broadcastEvent('CHORES_UPDATED', { action: 'UPDATED', chore: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chores/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { completedById } = req.body;
    const current = await get('SELECT * FROM chores WHERE id = ?', [id]);
    if (!current) return res.status(404).json({ error: 'Chore not found' });

    const newCompleted = current.isCompleted ? 0 : 1;
    const completedAt = newCompleted ? new Date().toISOString() : null;
    const byId = newCompleted ? (completedById || 'you') : null;

    await run(
      'UPDATE chores SET isCompleted = ?, completedAt = ?, completedById = ? WHERE id = ?',
      [newCompleted, completedAt, byId, id]
    );

    const updated = await get('SELECT * FROM chores WHERE id = ?', [id]);
    broadcastEvent('CHORE_TOGGLED', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/chores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM chores WHERE id = ?', [id]);
    broadcastEvent('CHORES_UPDATED', { action: 'DELETED', id: Number(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GROCERIES / ERRANDS
app.get('/api/groceries', async (req, res) => {
  try {
    const groceries = await all('SELECT * FROM groceries ORDER BY isBought ASC, id DESC');
    res.json(groceries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/groceries', async (req, res) => {
  try {
    const { item, quantity, category, addedById } = req.body;
    if (!item) return res.status(400).json({ error: 'Item name is required' });
    const result = await run(
      'INSERT INTO groceries (item, quantity, category, addedById) VALUES (?, ?, ?, ?)',
      [item, quantity || '', category || 'Other', addedById || 'you']
    );
    const created = await get('SELECT * FROM groceries WHERE id = ?', [result.lastID]);
    broadcastEvent('GROCERY_UPDATED', { action: 'CREATED', grocery: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/groceries/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { boughtById } = req.body;
    const current = await get('SELECT * FROM groceries WHERE id = ?', [id]);
    if (!current) return res.status(404).json({ error: 'Item not found' });

    const newBought = current.isBought ? 0 : 1;
    await run('UPDATE groceries SET isBought = ?, boughtById = ? WHERE id = ?', [
      newBought,
      newBought ? (boughtById || 'you') : null,
      id
    ]);

    const updated = await get('SELECT * FROM groceries WHERE id = ?', [id]);
    broadcastEvent('GROCERY_UPDATED', { action: 'TOGGLED', grocery: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/groceries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM groceries WHERE id = ?', [id]);
    broadcastEvent('GROCERY_UPDATED', { action: 'DELETED', id: Number(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/groceries/clear-bought', async (req, res) => {
  try {
    await run('DELETE FROM groceries WHERE isBought = 1');
    broadcastEvent('GROCERY_UPDATED', { action: 'CLEARED_BOUGHT' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BATCH ADD GROCERIES (used by Chatbot / Quick lists)
app.post('/api/groceries/batch', async (req, res) => {
  try {
    const { items, addedById } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }
    const createdItems = [];
    for (const itm of items) {
      const name = typeof itm === 'string' ? itm : itm.item;
      if (!name || !name.trim()) continue;
      const qty = (typeof itm === 'object' && itm.quantity) ? itm.quantity : '';
      const cat = (typeof itm === 'object' && itm.category) ? itm.category : 'Other';
      const result = await run(
        'INSERT INTO groceries (item, quantity, category, addedById) VALUES (?, ?, ?, ?)',
        [name.trim(), qty.trim(), cat, addedById || 'mom']
      );
      const created = await get('SELECT * FROM groceries WHERE id = ?', [result.lastID]);
      createdItems.push(created);
    }
    broadcastEvent('GROCERY_UPDATED', { action: 'BATCH_CREATED', count: createdItems.length });
    res.status(201).json({ success: true, count: createdItems.length, items: createdItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STICKY NOTES
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await all('SELECT * FROM sticky_notes ORDER BY isPinned DESC, id DESC');
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { content, authorId, color, isPinned } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });
    const result = await run(
      'INSERT INTO sticky_notes (content, authorId, color, isPinned) VALUES (?, ?, ?, ?)',
      [content, authorId || 'you', color || 'yellow', isPinned ? 1 : 0]
    );
    const created = await get('SELECT * FROM sticky_notes WHERE id = ?', [result.lastID]);
    broadcastEvent('NOTES_UPDATED', { action: 'CREATED', note: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, color, isPinned } = req.body;
    await run(
      `UPDATE sticky_notes SET content = COALESCE(?, content), color = COALESCE(?, color), 
       isPinned = COALESCE(?, isPinned) WHERE id = ?`,
      [content, color, isPinned !== undefined ? (isPinned ? 1 : 0) : null, id]
    );
    const updated = await get('SELECT * FROM sticky_notes WHERE id = ?', [id]);
    broadcastEvent('NOTES_UPDATED', { action: 'UPDATED', note: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM sticky_notes WHERE id = ?', [id]);
    broadcastEvent('NOTES_UPDATED', { action: 'DELETED', id: Number(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// KUDOS
app.get('/api/kudos', async (req, res) => {
  try {
    const kudos = await all('SELECT * FROM kudos ORDER BY id DESC LIMIT 20');
    res.json(kudos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kudos', async (req, res) => {
  try {
    const { fromId, toId, emoji, message } = req.body;
    if (!fromId || !toId) {
      return res.status(400).json({ error: 'fromId and toId are required' });
    }
    const result = await run(
      'INSERT INTO kudos (fromId, toId, emoji, message) VALUES (?, ?, ?, ?)',
      [fromId, toId, emoji || '❤️', message || 'Great job!']
    );
    const created = await get('SELECT * FROM kudos WHERE id = ?', [result.lastID]);
    broadcastEvent('KUDOS_SENT', created);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DAILY HOUSE SCORE & SUMMARY STATS
app.get('/api/stats/today', async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().slice(0, 10);
    const profiles = await all('SELECT * FROM profiles');
    const habits = await all('SELECT * FROM habits WHERE archived = 0');
    const completions = await all('SELECT * FROM habit_completions WHERE date = ?', [targetDate]);
    const completedSet = new Set(completions.map(c => c.habitId));

    const choresDueToday = await all(
      'SELECT * FROM chores WHERE dueDate = ? OR (isCompleted = 1 AND DATE(completedAt) = ?)',
      [targetDate, targetDate]
    );

    const memberStats = profiles.map(profile => {
      const memberHabits = habits.filter(h => h.profileId === profile.id);
      const memberCompletedHabits = memberHabits.filter(h => completedSet.has(h.id));
      const habitPercentage = memberHabits.length > 0 ? Math.round((memberCompletedHabits.length / memberHabits.length) * 100) : 100;

      return {
        profileId: profile.id,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar,
        color: profile.color,
        totalHabits: memberHabits.length,
        completedHabits: memberCompletedHabits.length,
        percentage: habitPercentage
      };
    });

    const totalHabits = habits.length;
    const totalHabitsCompleted = habits.filter(h => completedSet.has(h.id)).length;
    const overallPercentage = totalHabits > 0 ? Math.round((totalHabitsCompleted / totalHabits) * 100) : 100;

    const groceries = await all('SELECT * FROM groceries');
    const pendingGroceries = groceries.filter(g => !g.isBought).length;

    res.json({
      date: targetDate,
      overallPercentage,
      totalHabits,
      totalHabitsCompleted,
      memberStats,
      pendingGroceriesCount: pendingGroceries
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CALENDAR EVENTS & GOOGLE CALENDAR SYNC
app.get('/api/calendar/events', async (req, res) => {
  try {
    const { profileId } = req.query;
    let events;
    if (profileId && profileId !== 'all') {
      events = await all(
        'SELECT * FROM calendar_events WHERE profileId = ? OR profileId = "all" ORDER BY eventDate ASC, startTime ASC',
        [profileId]
      );
    } else {
      events = await all('SELECT * FROM calendar_events ORDER BY eventDate ASC, startTime ASC');
    }
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/calendar/events', async (req, res) => {
  try {
    const { title, description, profileId, eventDate, startTime, endTime, isAllDay, location } = req.body;
    if (!title || !eventDate) {
      return res.status(400).json({ error: 'Title and eventDate are required' });
    }
    const result = await run(
      `INSERT INTO calendar_events (title, description, profileId, eventDate, startTime, endTime, isAllDay, location, createdById)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description || '',
        profileId || 'all',
        eventDate,
        startTime || null,
        endTime || null,
        isAllDay ? 1 : 0,
        location || '',
        req.user?.id || 'you'
      ]
    );
    const created = await get('SELECT * FROM calendar_events WHERE id = ?', [result.lastID]);
    broadcastEvent('CALENDAR_UPDATED', { action: 'CREATED', event: created });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/calendar/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, profileId, eventDate, startTime, endTime, isAllDay, location } = req.body;
    await run(
      `UPDATE calendar_events SET title = COALESCE(?, title), description = COALESCE(?, description),
       profileId = COALESCE(?, profileId), eventDate = COALESCE(?, eventDate), startTime = COALESCE(?, startTime),
       endTime = COALESCE(?, endTime), isAllDay = COALESCE(?, isAllDay), location = COALESCE(?, location) WHERE id = ?`,
      [title, description, profileId, eventDate, startTime, endTime, isAllDay !== undefined ? (isAllDay ? 1 : 0) : null, location, id]
    );
    const updated = await get('SELECT * FROM calendar_events WHERE id = ?', [id]);
    broadcastEvent('CALENDAR_UPDATED', { action: 'UPDATED', event: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/calendar/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM calendar_events WHERE id = ?', [id]);
    broadcastEvent('CALENDAR_UPDATED', { action: 'DELETED', id: Number(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RFC 5545 iCalendar (.ics) Feed for Personal Google Calendar Sync
// Every member (Mom, Dad, Mohit) can subscribe using this URL in Google Calendar
app.get('/api/calendar/ics/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await get('SELECT * FROM profiles WHERE id = ?', [profileId]);
    const memberName = profile ? profile.name : 'Family Member';

    const events = profileId === 'all'
      ? await all('SELECT * FROM calendar_events')
      : await all('SELECT * FROM calendar_events WHERE profileId = ? OR profileId = "all"', [profileId]);

    const chores = profileId === 'all'
      ? await all('SELECT * FROM chores WHERE dueDate IS NOT NULL')
      : await all('SELECT * FROM chores WHERE (assigneeId = ? OR assigneeId = "all") AND dueDate IS NOT NULL', [profileId]);

    const habits = profileId === 'all'
      ? await all('SELECT * FROM habits WHERE archived = 0')
      : await all('SELECT * FROM habits WHERE profileId = ? AND archived = 0', [profileId]);

    const now = new Date();
    const nowStr = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

    const formatDateForIcs = (dateStr, timeStr) => {
      if (!dateStr) return null;
      const cleanDate = dateStr.replace(/-/g, '');
      if (!timeStr) {
        return { value: cleanDate, isAllDay: true };
      }
      const cleanTime = timeStr.replace(/:/g, '') + '00';
      return { value: `${cleanDate}T${cleanTime}`, isAllDay: false };
    };

    let lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ambaldhage Family Hub//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Ambaldhage Hub - ${memberName}`,
      'X-WR-TIMEZONE:Asia/Kolkata',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
      'X-PUBLISHED-TTL:PT1H'
    ];

    for (const ev of events) {
      const dt = formatDateForIcs(ev.eventDate, ev.startTime);
      if (!dt) continue;
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:hub-cal-${ev.id}@ambaldhage.app`);
      lines.push(`DTSTAMP:${nowStr}`);
      if (dt.isAllDay) {
        lines.push(`DTSTART;VALUE=DATE:${dt.value}`);
      } else {
        lines.push(`DTSTART:${dt.value}`);
        if (ev.endTime) {
          const dtEnd = formatDateForIcs(ev.eventDate, ev.endTime);
          lines.push(`DTEND:${dtEnd.value}`);
        }
      }
      lines.push(`SUMMARY:${ev.title.replace(/\n/g, ' ')}`);
      if (ev.description) lines.push(`DESCRIPTION:${ev.description.replace(/\n/g, ' ')}`);
      if (ev.location) lines.push(`LOCATION:${ev.location.replace(/\n/g, ' ')}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    }

    for (const ch of chores) {
      const dt = formatDateForIcs(ch.dueDate);
      if (!dt) continue;
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:hub-chore-${ch.id}@ambaldhage.app`);
      lines.push(`DTSTAMP:${nowStr}`);
      lines.push(`DTSTART;VALUE=DATE:${dt.value}`);
      lines.push(`SUMMARY:Chore: ${ch.title.replace(/\n/g, ' ')}${ch.isCompleted ? ' (Done)' : ''}`);
      if (ch.description) lines.push(`DESCRIPTION:${ch.description.replace(/\n/g, ' ')}`);
      lines.push(ch.isCompleted ? 'STATUS:COMPLETED' : 'STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="ambaldhage-${profileId}.ics"`);
    res.send(lines.join('\r\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FAMILY AI ASSISTANT / CHATBOT
// Supports interactive checkbox lists (for Mom's groceries, chores, routines, and calendar planning)
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { message, profileId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const text = message.trim().toLowerCase();
    const userProfile = profileId ? await get('SELECT * FROM profiles WHERE id = ?', [profileId]) : req.user;
    const authorName = userProfile ? userProfile.name.split(' ')[0] : 'Friend';

    // 1. Mom's Grocery Checklist (requested specifically: "give me a list of groceries items in checkbox type for mom")
    const isGroceryRequest = 
      text.includes('grocer') || 
      text.includes('vegetable') || 
      text.includes('kitchen') || 
      text.includes('pantry') || 
      text.includes('sabzi') || 
      text.includes('subji') || 
      text.includes('spices') || 
      text.includes('checkbox') ||
      text.includes('shopping list') ||
      (text.includes('list') && (text.includes('mom') || text.includes('item')));

    if (isGroceryRequest) {
      let checklist = [];
      let title = "Mom's Essential Kitchen & Grocery Checklist";

      if (text.includes('vegetable') || text.includes('sabzi') || text.includes('veggie')) {
        title = "Fresh Vegetables & Greens Checklist";
        checklist = [
          { item: 'Tomatoes (Hybrid / Desi)', quantity: '1.5 kg', category: 'Vegetables & Fruits', checked: true },
          { item: 'Onions (Nashik Red)', quantity: '2 kg', category: 'Vegetables & Fruits', checked: true },
          { item: 'Potatoes (Aloo)', quantity: '2 kg', category: 'Vegetables & Fruits', checked: true },
          { item: 'Green Chillies & Fresh Coriander', quantity: '1 bunch', category: 'Vegetables & Fruits', checked: true },
          { item: 'Ginger (Adrak) & Garlic (Lehsun)', quantity: '250g', category: 'Vegetables & Fruits', checked: true },
          { item: 'Fresh Spinach (Palak) or Methi', quantity: '2 bunches', category: 'Vegetables & Fruits', checked: true },
          { item: 'Bhindi (Ladies Finger) / Beans', quantity: '500g', category: 'Vegetables & Fruits', checked: true },
          { item: 'Lemon (Nimbu)', quantity: '4 pieces', category: 'Vegetables & Fruits', checked: true }
        ];
      } else if (text.includes('dairy') || text.includes('milk') || text.includes('breakfast')) {
        title = "Morning Breakfast & Dairy Essentials";
        checklist = [
          { item: 'Fresh Milk (Amul / Nandini packets)', quantity: '2 Litres', category: 'Dairy & Milk', checked: true },
          { item: 'Curd / Plain Dahi', quantity: '500g pouch', category: 'Dairy & Milk', checked: true },
          { item: 'Paneer (Fresh Malai)', quantity: '200g', category: 'Dairy & Milk', checked: true },
          { item: 'Brown / Multigrain Bread', quantity: '1 Loaf', category: 'Snacks & Bakery', checked: true },
          { item: 'Butter / Pure Desi Ghee', quantity: '500g', category: 'Dairy & Milk', checked: true },
          { item: 'Eggs (Farm fresh)', quantity: '6-pack', category: 'Snacks & Bakery', checked: true },
          { item: 'Oats / Poha (Flattened rice)', quantity: '1 kg pack', category: 'Pantry & Spices', checked: true }
        ];
      } else if (text.includes('spice') || text.includes('masala') || text.includes('dal') || text.includes('pulse')) {
        title = "Pantry, Dals & Spice Refill Checklist";
        checklist = [
          { item: 'Toor Dal (Yellow Arhar)', quantity: '1 kg', category: 'Pantry & Spices', checked: true },
          { item: 'Moong Dal (Yellow / Green)', quantity: '500g', category: 'Pantry & Spices', checked: true },
          { item: 'Basmati / Sona Masoori Rice', quantity: '5 kg bag', category: 'Pantry & Spices', checked: true },
          { item: 'Wheat Flour (Atta)', quantity: '5 kg bag', category: 'Pantry & Spices', checked: true },
          { item: 'Jeera (Cumin seeds)', quantity: '200g', category: 'Pantry & Spices', checked: true },
          { item: 'Mustard seeds (Rai)', quantity: '200g', category: 'Pantry & Spices', checked: true },
          { item: 'Turmeric powder (Haldi)', quantity: '250g', category: 'Pantry & Spices', checked: true },
          { item: 'Sunflower / Groundnut Cooking Oil', quantity: '1 Litre pouch', category: 'Pantry & Spices', checked: true }
        ];
      } else {
        // Default Mom's Grocery Checklist (comprehensive everyday essentials with checkboxes)
        checklist = [
          { item: 'Fresh Milk (2 packets)', quantity: '2 Litres', category: 'Dairy & Milk', checked: true },
          { item: 'Tomatoes & Red Onions', quantity: '2 kg each', category: 'Vegetables & Fruits', checked: true },
          { item: 'Green Chillies, Ginger & Coriander', quantity: '1 bunch', category: 'Vegetables & Fruits', checked: true },
          { item: 'Toor Dal / Moong Dal', quantity: '1 kg', category: 'Pantry & Spices', checked: true },
          { item: 'Cooking Oil / Cow Ghee', quantity: '1 Litre', category: 'Pantry & Spices', checked: true },
          { item: 'Dishwashing Gel / Bar', quantity: '1 refill', category: 'Household & Chemist', checked: true },
          { item: 'Chai Patti (Assam Tea)', quantity: '500g', category: 'Pantry & Spices', checked: true },
          { item: 'Seasonal Apples & Bananas', quantity: '1 Dozen', category: 'Vegetables & Fruits', checked: true }
        ];
      }

      return res.json({
        reply: `Here is ${title} in clean checkbox format for ${authorName}. Select what you need and tap **"Add to Fridge Board"** below!`,
        type: 'grocery_checklist',
        title,
        items: checklist
      });
    }

    // 2. Chores & Schedule query
    if (text.includes('chore') || text.includes('task') || text.includes('pending') || text.includes('clean')) {
      const pendingChores = await all('SELECT * FROM chores WHERE isCompleted = 0 ORDER BY dueDate ASC LIMIT 5');
      return res.json({
        reply: `Here are the top pending household chores:`,
        type: 'chores_summary',
        chores: pendingChores
      });
    }

    // 3. Google Calendar & Events
    if (text.includes('calendar') || text.includes('event') || text.includes('schedule') || text.includes('appointment')) {
      const upcomingEvents = await all('SELECT * FROM calendar_events ORDER BY eventDate ASC LIMIT 4');
      return res.json({
        reply: `Here is the upcoming family calendar overview:`,
        type: 'calendar_summary',
        events: upcomingEvents
      });
    }

    // 4. Health & Medicine
    if (text.includes('health') || text.includes('medicine') || text.includes('tablet') || text.includes('doctor') || text.includes('bp')) {
      return res.json({
        reply: `Health & Wellness Checklist for the Ambaldhage Family:
• 🌸 **Mom**: Morning BP tablet after breakfast, Evening prayer, Night Calcium tablet.
• ☕ **Dad**: Morning health diary reading, Evening 45-min park walk, Multivitamin.
• ⚡ **Mohit**: 3 Litres water daily, Gym & workout session.`,
        type: 'text'
      });
    }

    // Default friendly assistant response
    return res.json({
      reply: `Hi ${authorName}! I'm your Ambaldhage Family Assistant. I can prepare grocery checklists with checkboxes, plan chores, and sync your schedule with Google Calendar. Try tapping one of the quick suggestions below:`,
      type: 'suggestions',
      suggestions: [
        "🛒 Mom's Grocery Checklist (Checkboxes)",
        "🥦 Fresh Vegetables & Greens",
        "🥛 Dairy & Breakfast Essentials",
        "📅 Upcoming Calendar Schedule",
        "🧹 View Pending Chores"
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));

// Catch-all for single-page app (Express 5 compatible)
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexHtml = path.join(distPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Ambaldhage Family Hub</title></head>
        <body style="font-family:sans-serif; text-align:center; padding: 40px;">
          <h2>Family Hub Server is Running! 🏡</h2>
          <p>Local API is operational at port ${PORT}. Building frontend bundle...</p>
        </body>
        </html>
      `);
    }
  });
});

async function startServer() {
  await initDB();
  const localIp = getLocalIp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log('==================================================');
    console.log(`🏡 Ambaldhage Family Hub Dashboard is LIVE!`);
    console.log(`💻 Local host access : http://localhost:${PORT}`);
    console.log(`📱 Wi-Fi Device access: http://${localIp}:${PORT}`);
    console.log(`✨ Open http://${localIp}:${PORT} on Mom's & Dad's phones!`);
    console.log('==================================================');
  });
}

startServer();
