const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');
const { initDB, run, get, all, calculateStreak } = require('./db');

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

// SSE endpoint
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  // Initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connected to Family Wi-Fi Hub' })}\n\n`);

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
    const { name, avatar, color, highContrast, fontSize } = req.body;
    await run(
      `UPDATE profiles SET name = COALESCE(?, name), avatar = COALESCE(?, avatar), color = COALESCE(?, color), 
       highContrast = COALESCE(?, highContrast), fontSize = COALESCE(?, fontSize) WHERE id = ?`,
      [name, avatar, color, highContrast !== undefined ? (highContrast ? 1 : 0) : null, fontSize, id]
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

// Serve frontend in production
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
