/**
 * Dear Diary - Centralized API Service Layer
 * Manages communication between frontend pages and backend server.
 */

const API_BASE_URL = 'http://localhost:5000';
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

  // --- Base HTTP Request Client ---
  async request(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle unauthorized session redirects
      if (response.status === 401 && path !== '/api/auth/login' && path !== '/api/auth/signup') {
        this.clearToken();
        // Redirect to onboarding/login screen if not on it already
        const currentPath = window.location.pathname;
        if (!currentPath.endsWith('index.html') && currentPath !== '/') {
          window.location.href = currentPath.includes('/pages/') ? '../index.html' : './index.html';
        }
        throw new Error('Session expired or unauthorized. Redirecting to login...');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP error! Status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${path}]:`, error);
      throw error;
    }
  },

  // --- Auth Route Calls ---
  async signup(username, password, diaryName, companionName, companionEmoji) {
    const data = await this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password, diaryName, companionName, companionEmoji })
    });
    if (data.token) this.setToken(data.token);
    return data;
  },

  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data.token) this.setToken(data.token);
    return data;
  },

  async getProfile() {
    return await this.request('/api/auth/me');
  },

  async updateSettingsPin(pin) {
    return await this.request('/api/auth/pin', {
      method: 'PUT',
      body: JSON.stringify({ pin })
    });
  },

  // --- Diary Entries CRUD Calls ---
  async getEntries() {
    return await this.request('/api/entries');
  },

  async createEntry(entryData) {
    return await this.request('/api/entries', {
      method: 'POST',
      body: JSON.stringify(entryData)
    });
  },

  async updateEntry(id, entryData) {
    return await this.request(`/api/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entryData)
    });
  },

  async deleteEntry(id) {
    return await this.request(`/api/entries/${id}`, {
      method: 'DELETE'
    });
  },

  // --- Memories Snaps Calls ---
  async getSnaps() {
    return await this.request('/api/snaps');
  },

  async uploadSnap(src, date) {
    return await this.request('/api/snaps', {
      method: 'POST',
      body: JSON.stringify({ src, date })
    });
  },

  async linkSnapToEntry(snapId, entryId) {
    return await this.request('/api/snaps/link', {
      method: 'POST',
      body: JSON.stringify({ snapId, entryId })
    });
  },

  // --- Game Verification Calls ---
  async getChallenge() {
    return await this.request('/api/games/challenge');
  },

  async claimReward(amount, source) {
    return await this.request('/api/games/reward', {
      method: 'POST',
      body: JSON.stringify({ amount, source })
    });
  },

  // --- Companion Studio Chat Calls ---
  async updateCompanion(companionName, companionEmoji) {
    return await this.request('/api/companion', {
      method: 'PUT',
      body: JSON.stringify({ name: companionName, emoji: companionEmoji, companionName, companionEmoji })
    });
  },

  async chatWithCompanion(message) {
    return await this.request('/api/companion/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  // --- Notifications Preferences Calls ---
  async getNotificationSettings() {
    return await this.request('/api/notifications/settings');
  },

  async saveNotificationSettings(settings) {
    return await this.request('/api/notifications/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },

  // --- Profile Settings ---
  async updateProfile(username, diaryName) {
    return await this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ username, diaryName })
    });
  },

  async deleteAccount() {
    return await this.request('/api/auth/delete', {
      method: 'DELETE'
    });
  },

  // --- Payments Gateway Simulator Calls ---
  async checkoutPremium() {
    return await this.request('/api/payments/checkout', {
      method: 'POST'
    });
  },

  async confirmPremium(sessionId) {
    return await this.request('/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
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
