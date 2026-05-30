/**
 * Dear Diary - Centralized API Service Layer (Standalone Local Storage Edition)
 * Manages data storage entirely within the browser using localStorage.
 */

const TOKEN_KEY = 'dear_diary_token';

const API = {
  // --- Token Management ---
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Stub request method (no-op since we don't connect to server)
  async request(path, options = {}) {
    throw new Error('Local backend mode. Server requests are disabled.');
  },

  // --- Auth Route Calls ---
  async signup(username, password, diaryName, companionName, companionEmoji) {
    this.setToken('firebase-local-token');
    localStorage.setItem('user_name', username);
    localStorage.setItem('diary_name', diaryName);
    localStorage.setItem('companion_name', companionName);
    localStorage.setItem('companion_emoji', companionEmoji);
    return { success: true, token: 'firebase-local-token' };
  },

  async login(username, password) {
    this.setToken('firebase-local-token');
    return { success: true, token: 'firebase-local-token' };
  },

  async getProfile() {
    return {
      id: 1,
      username: localStorage.getItem('user_name') || 'Friend',
      diaryName: localStorage.getItem('diary_name') || 'My Diary',
      companionName: localStorage.getItem('companion_name') || 'Ollie',
      companionEmoji: localStorage.getItem('companion_emoji') || '🦉',
      coins: parseInt(localStorage.getItem('coins'), 10) || 0,
      streak: parseInt(localStorage.getItem('writingStreak'), 10) || 1,
      isPremium: localStorage.getItem('premiumUpgrade') === 'true',
      settingsPin: localStorage.getItem('pin') || null,
      lastWrittenDate: localStorage.getItem('lastWrittenDate') || null
    };
  },

  async updateSettingsPin(pin) {
    if (pin) {
      localStorage.setItem('pin', pin);
      localStorage.setItem('diaryLocked', 'true');
    } else {
      localStorage.removeItem('pin');
      localStorage.setItem('diaryLocked', 'false');
    }
    return { success: true, settingsPin: pin };
  },

  // --- Diary Entries CRUD Calls ---
  async getEntries() {
    return JSON.parse(localStorage.getItem('diary_entries')) || [];
  },

  async createEntry(entryData) {
    const entries = JSON.parse(localStorage.getItem('diary_entries')) || [];
    const newEntry = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...entryData
    };
    entries.push(newEntry);
    localStorage.setItem('diary_entries', JSON.stringify(entries));
    
    // Auto increment streak
    let streak = parseInt(localStorage.getItem('writingStreak'), 10) || 1;
    localStorage.setItem('writingStreak', String(streak));
    
    return { success: true, entry: newEntry, streak: streak };
  },

  async updateEntry(id, entryData) {
    const entries = JSON.parse(localStorage.getItem('diary_entries')) || [];
    const index = entries.findIndex(e => e.id === Number(id));
    if (index !== -1) {
      entries[index] = {
        ...entries[index],
        ...entryData
      };
      localStorage.setItem('diary_entries', JSON.stringify(entries));
    }
    return { success: true };
  },

  async deleteEntry(id) {
    let entries = JSON.parse(localStorage.getItem('diary_entries')) || [];
    entries = entries.filter(e => e.id !== Number(id));
    localStorage.setItem('diary_entries', JSON.stringify(entries));
    return { success: true };
  },

  // --- Memories Snaps Calls ---
  async getSnaps() {
    return JSON.parse(localStorage.getItem('diary_snaps')) || [];
  },

  async uploadSnap(src, date) {
    const snaps = JSON.parse(localStorage.getItem('diary_snaps')) || [];
    const newSnap = {
      id: Date.now(),
      src,
      date
    };
    snaps.push(newSnap);
    localStorage.setItem('diary_snaps', JSON.stringify(snaps));
    return { success: true, snap: newSnap };
  },

  async linkSnapToEntry(snapId, entryId) {
    return { success: true };
  },

  // --- Game Verification Calls ---
  async getChallenge() {
    return {
      challenge: "What is one thing you appreciate about your companion today? 🦉",
      resetsIn: 86400
    };
  },

  async claimReward(amount, source) {
    let coins = parseInt(localStorage.getItem('coins'), 10) || 0;
    coins += Number(amount);
    localStorage.setItem('coins', String(coins));
    return { success: true, coins };
  },

  // --- Companion Studio Chat Calls ---
  async updateCompanion(companionName, companionEmoji) {
    localStorage.setItem('companion_name', companionName);
    localStorage.setItem('companion_emoji', companionEmoji);
    return { success: true, companionName, companionEmoji };
  },

  async chatWithCompanion(message) {
    const companionName = localStorage.getItem('companion_name') || 'Ollie';
    const companionEmoji = localStorage.getItem('companion_emoji') || '🦉';
    
    // Provide replies locally
    const replies = [
      `That sounds wonderful! Tell me more about it. ${companionEmoji}`,
      `I'm always here to listen. You are doing great! ${companionEmoji}`,
      `Remember, every moment is a piece of your journey. Write it down! ${companionEmoji}`,
      `Cozy days make the best stories. What are you writing next? ${companionEmoji}`
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    return { reply };
  },

  // --- Notifications Preferences Calls ---
  async getNotificationSettings() {
    return JSON.parse(localStorage.getItem('notification_settings')) || {
      emailDaily: true,
      popupReminders: true
    };
  },

  async saveNotificationSettings(settings) {
    localStorage.setItem('notification_settings', JSON.stringify(settings));
    return { success: true };
  },

  // --- Profile Settings ---
  async updateProfile(username, diaryName) {
    localStorage.setItem('user_name', username);
    localStorage.setItem('diary_name', diaryName);
    return { success: true, username, diaryName };
  },

  async deleteAccount() {
    localStorage.clear();
    return { success: true };
  },

  // --- Payments Gateway Simulator Calls ---
  async checkoutPremium() {
    return { sessionId: 'mock_session_' + Date.now() };
  },

  async confirmPremium(sessionId) {
    localStorage.setItem('premiumUpgrade', 'true');
    return { success: true, isPremium: true };
  }
};

// --- Global Theme Application Engine ---
(function() {
  function applyTheme(theme) {
    document.body.classList.remove('theme-vintage', 'theme-midnight');
    if (theme === 'vintage-warm') {
      document.body.classList.add('theme-vintage');
    } else if (theme === 'midnight-journal') {
      document.body.classList.add('theme-midnight');
    }
  }

  const selectedTheme = localStorage.getItem('selectedTheme') || 'premium-golden';
  if (document.body) {
    applyTheme(selectedTheme);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      applyTheme(selectedTheme);
    });
  }
})();
