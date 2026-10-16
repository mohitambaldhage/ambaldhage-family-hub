# 🏡 Ambaldhage Family Hub — Home Wi-Fi Dashboard

A private, local network web dashboard accessible on your home Wi-Fi (`http://192.168.31.6:3000`) for **You (Mohit)**, **Mom**, and **Dad** to track daily habits, one-off chores, shared groceries, and household notes — with zero passwords, zero cloud dependencies, and zero friction.

---

## ⚡ Quick Start

### 1. Launch the Server
From the project folder, run:
```bash
npm start
```
*(Or double-click `start-family-hub.bat` on Windows)*

### 2. Access on Any Device
- **On this PC**: [http://localhost:3000](http://localhost:3000)
- **On Mom's & Dad's Phones (Home Wi-Fi)**: [http://192.168.31.6:3000](http://192.168.31.6:3000)
- **1-Tap QR Code**: Click **"QR Code"** or **"Connect Phone"** in the top navigation bar to scan the link directly with any smartphone camera!

> **Pro Tip (Add to Home Screen)**:  
> On iOS (Safari) or Android (Chrome), tap **Share / Menu → "Add to Home Screen"**. The app will behave like a native mobile app with an icon, full-screen mode, and fast loading.

---

## 🎯 Features Implemented

### 1. Zero-Friction Profile System
- **1-Tap Profile Switcher**: Switch instantly between **You (Mohit) ⚡**, **Mom 🌸**, and **Dad ☕**.
- **Device Memory**: Each phone remembers who is using it via `localStorage`.
- **Senior / Accessibility View**: Large checkboxes, high-contrast borders, and extra-large fonts tailored for Mom.

### 2. The Two-Track System
- **Track 1: Daily Habits (Auto-Resetting)**
  - Pre-seeded routines for Mom (walk, BP & sugar pills, plants, prayer), Dad (newspaper, BP diary, walk, multivitamin), and You (gym, deep work, 3L water, reading).
  - Time-of-day organization (🌅 Morning, ☀️ Afternoon, 🌙 Evening, ⏱️ Anytime).
  - Streak tracking (`🔥 3d streak`) calculated automatically from historical completion logs.
  - Satisfying Web Audio chime synthesis and celebratory confetti bursts on completion.
- **Track 2: One-Off Chores & Deadlines**
  - Actionable tasks with due dates, priority tags (High, Medium, Low), and assignments (Mom, Dad, You, or Anyone 🤝).
  - Filter by "All", "Assigned to Me", or individual members.
  - Quick "Say Thanks ❤️" shortcut upon completing chores.

### 3. The Shared Family Hub ("The Fridge Board")
- **Live Grocery & Errands List**:
  - Categorized chips: Vegetables & Fruits, Dairy, Pantry, Household, Snacks.
  - Real-time updates: When Dad or Mom picks up milk at the market, the item is struck through across all connected phones instantly via Server-Sent Events.
  - "Clear Bought" button to keep the board tidy.
- **Digital Sticky Notes**:
  - Corkboard notes with colors (Yellow, Pink, Blue, Green, Peach).
  - Pinned notes feature (`📌 Pin to Top`) for essential notices ("Dinner in fridge", "Electrician coming tomorrow").

### 4. Gentle Gamification & Positivity
- **Daily House Score**: Combined family progress percentage banner ("Ambaldhage Family: 82% Complete Today! 🔥").
- **1-Tap Kudos**: Send hearts ❤️, stars 🌟, applause 👏, flowers 💐, or tea ☕ to Mom, Dad, or Mohit with real-time celebratory popups and chime sounds.
- **Wall Display / Tablet Mode**: A 3-column overview ideal for an always-on kitchen tablet or TV screen.

---

## 🛠️ Architecture

- **Backend**: Node.js v24 + Express 5
- **Database**: SQLite3 (`data/family.db`) — persistent, zero cloud lock-in, portable file backup.
- **Real-Time Sync**: Server-Sent Events (SSE) `/api/events` broadcasting mutations across all connected devices.
- **Frontend**: React 19 + Tailwind CSS + Lucide Icons + Canvas Confetti + Web Audio API Synthesizer (100% offline).
- **Network Discovery**: Automatic Wi-Fi IPv4 detection and QR code generator (`qrcode`).

---

## 📁 Project Structure

```
ambaldhage app/
├── data/
│   └── family.db             # Persistent SQLite database
├── server/
│   ├── db.js                 # SQLite schema, queries, streaks & seed data
│   └── index.js              # Express API & Server-Sent Events hub
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Top bar, profile pills, Wi-Fi status
│   │   │   ├── HouseScoreBanner.jsx  # Daily team score & date switcher
│   │   │   ├── HabitsView.jsx        # Daily habits & streak tracker
│   │   │   ├── ChoresView.jsx        # One-off tasks, due dates & filters
│   │   │   ├── FridgeBoardView.jsx   # Live groceries & sticky notes
│   │   │   ├── FamilyWallView.jsx    # Tablet / TV wall display mode
│   │   │   ├── KudosModal.jsx        # 1-tap positivity & praise
│   │   │   ├── QrCodeModal.jsx       # QR code & Wi-Fi connection guide
│   │   │   └── NotificationToast.jsx # Live multi-device alerts
│   │   ├── utils/
│   │   │   ├── sound.js              # Web Audio API synthesizers
│   │   │   └── confetti.js           # Confetti animations
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
├── start-family-hub.bat       # 1-click Windows launcher
└── package.json
```
