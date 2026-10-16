const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'family.db');

const db = new sqlite3.Database(DB_PATH);

// Helper for promise-based queries
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function initDB() {
  await run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT NOT NULL,
      color TEXT NOT NULL,
      highContrast INTEGER DEFAULT 0,
      fontSize TEXT DEFAULT 'normal'
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId TEXT NOT NULL,
      title TEXT NOT NULL,
      icon TEXT DEFAULT '✨',
      timeOfDay TEXT DEFAULT 'morning',
      targetDays TEXT DEFAULT 'daily',
      archived INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profileId) REFERENCES profiles(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habitId INTEGER NOT NULL,
      date TEXT NOT NULL,
      completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(habitId, date),
      FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS chores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      assigneeId TEXT DEFAULT 'all',
      createdById TEXT,
      dueDate TEXT,
      priority TEXT DEFAULT 'medium',
      isCompleted INTEGER DEFAULT 0,
      completedAt DATETIME,
      completedById TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS groceries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item TEXT NOT NULL,
      quantity TEXT,
      category TEXT DEFAULT 'Other',
      isBought INTEGER DEFAULT 0,
      addedById TEXT,
      boughtById TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS sticky_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      authorId TEXT NOT NULL,
      color TEXT DEFAULT 'yellow',
      isPinned INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS kudos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fromId TEXT NOT NULL,
      toId TEXT NOT NULL,
      emoji TEXT DEFAULT '❤️',
      message TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId TEXT,
      action TEXT NOT NULL,
      details TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check if profiles are seeded
  const existingProfiles = await all(`SELECT * FROM profiles`);
  if (existingProfiles.length === 0) {
    console.log('Seeding initial family members and habits...');
    await seedInitialData();
  }
}

async function seedInitialData() {
  // Profiles
  const profiles = [
    { id: 'you', name: 'You (Mohit)', role: 'You', avatar: '⚡', color: 'blue', highContrast: 0, fontSize: 'normal' },
    { id: 'mom', name: 'Mom', role: 'Mom', avatar: '🌸', color: 'rose', highContrast: 1, fontSize: 'large' },
    { id: 'dad', name: 'Dad', role: 'Dad', avatar: '☕', color: 'amber', highContrast: 0, fontSize: 'normal' }
  ];

  for (const p of profiles) {
    await run(
      `INSERT INTO profiles (id, name, role, avatar, color, highContrast, fontSize) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.name, p.role, p.avatar, p.color, p.highContrast, p.fontSize]
    );
  }

  // Habits
  const habits = [
    // Mom
    { profileId: 'mom', title: 'Morning Walk (30 mins)', icon: '🌅', timeOfDay: 'morning' },
    { profileId: 'mom', title: 'Morning Blood Pressure & Sugar Tablets', icon: '💊', timeOfDay: 'morning' },
    { profileId: 'mom', title: 'Water Plants & Balcony Garden', icon: '🌿', timeOfDay: 'morning' },
    { profileId: 'mom', title: 'Evening Prayer / Bhajan & Meditation', icon: '🪔', timeOfDay: 'evening' },
    { profileId: 'mom', title: 'Night Calcium Tablet after Dinner', icon: '💊', timeOfDay: 'evening' },

    // Dad
    { profileId: 'dad', title: 'Morning Newspaper & Tea with Reading', icon: '📰', timeOfDay: 'morning' },
    { profileId: 'dad', title: 'Check Blood Pressure & Health Diary', icon: '🩺', timeOfDay: 'morning' },
    { profileId: 'dad', title: 'Evening Walk / Park Stroll (45 mins)', icon: '🚶', timeOfDay: 'evening' },
    { profileId: 'dad', title: 'Daily Multivitamin & Green Tea', icon: '💊', timeOfDay: 'evening' },
    { profileId: 'dad', title: 'Review Vehicle & House Maintenance Checklist', icon: '🔧', timeOfDay: 'anytime' },

    // You
    { profileId: 'you', title: 'Gym & Core Strength Workout', icon: '🏋️', timeOfDay: 'morning' },
    { profileId: 'you', title: '2-Hour Deep Work / Coding / Focus Block', icon: '💻', timeOfDay: 'morning' },
    { profileId: 'you', title: 'Drink 3 Litres of Water Daily', icon: '💧', timeOfDay: 'afternoon' },
    { profileId: 'you', title: 'Read 20 Pages of Book', icon: '📚', timeOfDay: 'evening' },
    { profileId: 'you', title: 'Plan Tomorrow & Review Today Priorities', icon: '🎯', timeOfDay: 'evening' }
  ];

  for (const h of habits) {
    await run(
      `INSERT INTO habits (profileId, title, icon, timeOfDay, targetDays) VALUES (?, ?, ?, ?, 'daily')`,
      [h.profileId, h.title, h.icon, h.timeOfDay]
    );
  }

  // Chores
  const chores = [
    {
      title: 'Pay Electricity & Wi-Fi Bill',
      description: 'Check meter reading and pay via UPI',
      assigneeId: 'dad',
      createdById: 'dad',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      priority: 'high',
      isCompleted: 0
    },
    {
      title: 'Service AC Filters before weekend',
      description: 'Clean dust mesh or schedule technician',
      assigneeId: 'all',
      createdById: 'dad',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      priority: 'medium',
      isCompleted: 0
    },
    {
      title: 'Organize kitchen spice bottles & pantry jars',
      description: 'Refill cumin, mustard and turmeric containers',
      assigneeId: 'mom',
      createdById: 'mom',
      dueDate: new Date().toISOString().slice(0, 10),
      priority: 'medium',
      isCompleted: 0
    },
    {
      title: 'Backup family photos to external SSD drive',
      description: 'Transfer recent trip albums from phones',
      assigneeId: 'you',
      createdById: 'you',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
      priority: 'low',
      isCompleted: 0
    }
  ];

  for (const c of chores) {
    await run(
      `INSERT INTO chores (title, description, assigneeId, createdById, dueDate, priority, isCompleted) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [c.title, c.description, c.assigneeId, c.createdById, c.dueDate, c.priority, c.isCompleted]
    );
  }

  // Groceries
  const groceries = [
    { item: 'Fresh Milk (2 packets)', quantity: '2L', category: 'Dairy & Milk', isBought: 0, addedById: 'mom' },
    { item: 'Tomatoes & Green Chillies', quantity: '1.5 kg', category: 'Vegetables & Fruits', isBought: 0, addedById: 'mom' },
    { item: 'Bananas & Seasonal Apples', quantity: '1 Dozen', category: 'Vegetables & Fruits', isBought: 0, addedById: 'dad' },
    { item: 'Brown Bread', quantity: '1 Loaf', category: 'Snacks & Bakery', isBought: 0, addedById: 'you' },
    { item: 'Dishwashing Liquid refill', quantity: '500 ml', category: 'Household & Chemist', isBought: 0, addedById: 'mom' },
    { item: 'Chai Patti / Assam Tea', quantity: '500g pack', category: 'Pantry & Spices', isBought: 1, addedById: 'dad' }
  ];

  for (const g of groceries) {
    await run(
      `INSERT INTO groceries (item, quantity, category, isBought, addedById) VALUES (?, ?, ?, ?, ?)`,
      [g.item, g.quantity, g.category, g.isBought, g.addedById]
    );
  }

  // Sticky Notes
  const notes = [
    {
      content: 'Dinner is prepared and in the fridge! Please warm it on medium before eating 🍲❤️',
      authorId: 'mom',
      color: 'yellow',
      isPinned: 1
    },
    {
      content: 'Car tyre pressure checked this morning. Air is 33 PSI in all four wheels 🚗👍',
      authorId: 'dad',
      color: 'blue',
      isPinned: 0
    },
    {
      content: 'Wi-Fi fiber router upgraded. Everyone can connect to the 5G band for faster speeds! ⚡📶',
      authorId: 'you',
      color: 'green',
      isPinned: 0
    }
  ];

  for (const n of notes) {
    await run(
      `INSERT INTO sticky_notes (content, authorId, color, isPinned) VALUES (?, ?, ?, ?)`,
      [n.content, n.authorId, n.color, n.isPinned]
    );
  }

  // Kudos
  const kudos = [
    {
      fromId: 'mom',
      toId: 'dad',
      emoji: '❤️',
      message: 'Thank you for picking up the fresh vegetables early today!'
    },
    {
      fromId: 'dad',
      toId: 'you',
      emoji: '🌟',
      message: 'Proud of your daily workout consistency! Keep it up.'
    },
    {
      fromId: 'you',
      toId: 'mom',
      emoji: '💐',
      message: 'Thank you for the delicious lunch and tea!'
    }
  ];

  for (const k of kudos) {
    await run(
      `INSERT INTO kudos (fromId, toId, emoji, message) VALUES (?, ?, ?, ?)`,
      [k.fromId, k.toId, k.emoji, k.message]
    );
  }

  // Seed completions for today & yesterday to display streaks nicely right out of the box!
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dayBefore = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10);

  const allHabits = await all(`SELECT id, profileId FROM habits`);
  for (const h of allHabits) {
    // Complete for yesterday and day before to give everyone a 2-day starting streak!
    await run(`INSERT OR IGNORE INTO habit_completions (habitId, date) VALUES (?, ?)`, [h.id, dayBefore]);
    await run(`INSERT OR IGNORE INTO habit_completions (habitId, date) VALUES (?, ?)`, [h.id, yesterday]);

    // Randomly mark a couple as completed today for demonstration
    if (h.id % 2 === 1) {
      await run(`INSERT OR IGNORE INTO habit_completions (habitId, date) VALUES (?, ?)`, [h.id, today]);
    }
  }

  console.log('Database initialized and seeded successfully.');
}

// Calculate streak for a habit as of today's date
async function calculateStreak(habitId, targetDate) {
  const completions = await all(
    `SELECT date FROM habit_completions WHERE habitId = ? ORDER BY date DESC`,
    [habitId]
  );
  if (!completions.length) return 0;

  const datesSet = new Set(completions.map(c => c.date));
  
  let checkDate = new Date(targetDate || new Date().toISOString().slice(0, 10));
  let streak = 0;

  const dateStr = checkDate.toISOString().slice(0, 10);
  if (datesSet.has(dateStr)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Check if yesterday was completed
    const yest = new Date(checkDate);
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().slice(0, 10);
    if (datesSet.has(yestStr)) {
      checkDate = yest;
    } else {
      return 0;
    }
  }

  while (true) {
    const currentStr = checkDate.toISOString().slice(0, 10);
    if (datesSet.has(currentStr)) {
      if (streak === 0) streak = 1; // if started from yesterday
      else if (streak > 0 && currentStr !== dateStr) streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

module.exports = {
  db,
  run,
  get,
  all,
  initDB,
  calculateStreak
};
