/**
 * Dear Diary - My Space Profile Controller
 */
document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // PULL FROM localStorage & CORE VARIABLES
  // ==========================================================================
  let userName = localStorage.getItem('user_name') || 'Friend';
  let diaryName = localStorage.getItem('diary_name') || 'My Diary';
  let companionName = localStorage.getItem('companion_name') || 'Ollie';
  let companionEmoji = localStorage.getItem('companion_emoji') || '🦉';

  let coins = parseInt(localStorage.getItem('coins'), 10) || 0;
  let writingStreak = parseInt(localStorage.getItem('writingStreak'), 10) || 1;
  let snapStreak = parseInt(localStorage.getItem('snapStreak'), 10) || 1;

  let diaryEntries = [];
  try {
    diaryEntries = JSON.parse(localStorage.getItem('diary_entries')) || [];
  } catch (e) {
    diaryEntries = [];
  }

  let snaps = [];
  try {
    snaps = JSON.parse(localStorage.getItem('diary_snaps')) || JSON.parse(localStorage.getItem('snaps')) || [];
  } catch (e) {
    snaps = [];
  }

  // Load selected Theme
  let selectedTheme = localStorage.getItem('selectedTheme') || 'premium-golden';
  applyThemeStyles(selectedTheme);

  // Initialize main labels
  updateMainProfileUI();

  // Statistics counters animation
  animateCounter('stat-entries-count', diaryEntries.length);
  animateCounter('stat-streak-count', writingStreak);
  animateCounter('stat-coins-count', coins);

  // Update navbar active state labels
  const floatEmoji = document.getElementById('floating-companion-emoji');
  if (floatEmoji) floatEmoji.textContent = companionEmoji;

  // ==========================================================================
  // FLOATING COMPANION DRAGGING (POINTER EVENTS)
  // ==========================================================================
  const fc = document.getElementById('floating-companion');
  let isDragging = false;
  let startX = 0, startY = 0;
  let downX = 0, downY = 0;
  let dragDistance = 0;
  let speechTimeout = null;

  function triggerSpeechBubble(text = null) {
    const bubble = document.getElementById('floating-speech-bubble');
    if (!bubble) return;

    bubble.textContent = text || `Need help, ${userName}? 👤`;
    bubble.classList.add('show');

    if (speechTimeout) clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => {
      bubble.classList.remove('show');
    }, 2000);
  }

  if (fc) {
    // Check ghost mode status
    const ghostMode = localStorage.getItem('ghostMode') === 'true';
    if (ghostMode) {
      fc.style.display = 'none'; // hide companion in ghost mode
    }

    fc.addEventListener('pointerdown', (e) => {
      isDragging = true;
      fc.setPointerCapture(e.pointerId);
      
      const rect = fc.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      downX = e.clientX;
      downY = e.clientY;
      dragDistance = 0;

      const emojiSpan = document.getElementById('floating-companion-emoji');
      if (emojiSpan) emojiSpan.style.animationPlayState = 'paused';
    });

    fc.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      dragDistance = Math.sqrt(dx * dx + dy * dy);

      let x = e.clientX - startX;
      let y = e.clientY - startY;

      const maxX = window.innerWidth - fc.offsetWidth;
      const maxY = window.innerHeight - fc.offsetHeight;
      
      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));

      fc.style.right = 'auto';
      fc.style.bottom = 'auto';
      fc.style.left = `${x}px`;
      fc.style.top = `${y}px`;
    });

    fc.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      fc.releasePointerCapture(e.pointerId);

      const emojiSpan = document.getElementById('floating-companion-emoji');
      if (emojiSpan) emojiSpan.style.animationPlayState = 'running';

      if (dragDistance < 5) {
        triggerSpeechBubble();
      }
    });

    fc.addEventListener('pointercancel', (e) => {
      if (!isDragging) return;
      isDragging = false;
      fc.releasePointerCapture(e.pointerId);
      
      const emojiSpan = document.getElementById('floating-companion-emoji');
      if (emojiSpan) emojiSpan.style.animationPlayState = 'running';
    });
  }

  // Entrance animations load
  setTimeout(() => {
    const fadeOverlay = document.getElementById('fade-overlay');
    if (fadeOverlay) {
      fadeOverlay.classList.add('fade-out');
      setTimeout(() => fadeOverlay.remove(), 800);
    }
  }, 50);

  setTimeout(() => {
    const wrapper = document.querySelector('.me-wrapper');
    if (wrapper) wrapper.classList.add('animated');
  }, 100);

  setTimeout(() => {
    if (fc && localStorage.getItem('ghostMode') !== 'true') fc.classList.add('loaded');
  }, 300);

  // Helper numbers counts animation
  function animateCounter(id, targetValue) {
    const el = document.getElementById(id);
    if (!el) return;
    
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = progress * (2 - progress);
      const current = Math.floor(easedProgress * targetValue);
      
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = targetValue;
    }
    requestAnimationFrame(update);
  }

  function updateMainProfileUI() {
    const userDisplay = document.getElementById('hero-user-display');
    const diaryDisplay = document.getElementById('hero-diary-display');
    const companionNameDisplay = document.getElementById('hero-companion-name');
    const companionEmojiDisplay = document.getElementById('hero-companion-emoji');

    if (userDisplay) userDisplay.textContent = `${userName}'s Diary`;
    if (diaryDisplay) diaryDisplay.textContent = diaryName;
    if (companionNameDisplay) companionNameDisplay.textContent = companionName;
    if (companionEmojiDisplay) companionEmojiDisplay.textContent = companionEmoji;

    // Update initial
    const userInitialLabel = document.getElementById('user-initial');
    if (userInitialLabel) userInitialLabel.textContent = userName.charAt(0).toUpperCase();

    // Badge Level logic (coins based)
    const relBadge = document.getElementById('relationship-label');
    if (relBadge) {
      let level = 1;
      let label = 'Stranger';
      if (coins >= 300) { level = 5; label = 'Soulmate 💜'; }
      else if (coins >= 150) { level = 4; label = 'Close Friend 🧡'; }
      else if (coins >= 50) { level = 3; label = 'Friend 💛'; }
      else if (coins >= 15) { level = 2; label = 'Companion 💙'; }
      
      relBadge.textContent = `${label} — Level ${level}`;
      localStorage.setItem('companion_level', level);
    }
  }

  // ==========================================================================
  // MENU BUTTONS & SCREEN OVERLAYS ACTIVE CONTROLS
  // ==========================================================================
  const menuButtons = document.querySelectorAll('.menu-item[data-overlay]');
  const backButtons = document.querySelectorAll('.btn-overlay-back');

  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Highlight active menu left border
      menuButtons.forEach(b => b.classList.remove('active-left'));
      btn.classList.add('active-left');

      const overlayTarget = btn.getAttribute('data-overlay');
      openOverlay(overlayTarget);
    });
  });

  backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      closeOverlay(target);
    });
  });

  function openOverlay(overlayId) {
    const overlay = document.getElementById(`overlay-${overlayId}`);
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Load screen specific metrics
      if (overlayId === 'character-studio') initCharacterStudio();
      if (overlayId === 'theme-gallery') initThemeGallery();
      if (overlayId === 'achievements') initAchievementsBoard();
      if (overlayId === 'monthly-mirror') initMonthlyMirror();
      if (overlayId === 'time-capsule') initTimeCapsule();
      if (overlayId === 'year-in-diary') initYearInDiary();
      if (overlayId === 'settings-notifications') initNotificationsSettings();
      if (overlayId === 'settings-privacy') initPrivacySettings();
    }
  }

  function closeOverlay(overlayId) {
    const overlay = document.getElementById(`overlay-${overlayId}`);
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = 'auto';

      // Reset menu button highlights
      menuButtons.forEach(b => b.classList.remove('active-left'));
    }
  }

  // Toast alerts
  function showToast(message) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.classList.add('toast-notification');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  // ==========================================================================
  // SUB-SCREEN 1: CHARACTER STUDIO CONTROLLER
  // ==========================================================================
  function initCharacterStudio() {
    const studioEmoji = document.getElementById('studio-companion-emoji');
    const inputName = document.getElementById('input-companion-name');
    const companionGrid = document.getElementById('companion-grid-container');

    if (studioEmoji) studioEmoji.textContent = companionEmoji;
    if (inputName) inputName.value = companionName;

    // Renaming listener
    inputName.oninput = () => {
      const newName = inputName.value.trim();
      if (newName) {
        companionName = newName;
        localStorage.setItem('companion_name', newName);
        updateMainProfileUI();
      }
    };

    // Unlock logic based on writingStreak >= 7
    const cards = companionGrid.querySelectorAll('.companion-card');
    cards.forEach(card => {
      const isLocked = card.classList.contains('locked');
      const cName = card.getAttribute('data-name');
      const cEmoji = card.getAttribute('data-emoji');

      // Ollie is free. Others unlocked at day 7 streak
      if (cName !== 'Ollie') {
        if (writingStreak >= 7) {
          card.className = 'companion-card unlocked';
          const lockOverlay = card.querySelector('.lock-overlay');
          if (lockOverlay) lockOverlay.remove();
        }
      }

      // Pre-select active companion
      if (cName === localStorage.getItem('companion_name') || cEmoji === companionEmoji) {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      }

      // Card click select companion
      card.onclick = () => {
        if (card.classList.contains('locked')) {
          alert('Maintain a 7-day writing streak to unlock this companion! 🔥');
          return;
        }

        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        companionEmoji = cEmoji;
        companionName = cName;
        localStorage.setItem('companion_name', cName);
        localStorage.setItem('companion_emoji', cEmoji);
        inputName.value = cName;

        if (studioEmoji) studioEmoji.textContent = cEmoji;
        updateMainProfileUI();

        // Update floating character everywhere
        if (floatEmoji) floatEmoji.textContent = cEmoji;
      };
    });
  }

  // ==========================================================================
  // SUB-SCREEN 2: THEME GALLERY CONTROLLER
  // ==========================================================================
  function initThemeGallery() {
    const themeCards = document.querySelectorAll('.theme-card');
    const currentThemeLabel = document.getElementById('current-theme-name');

    // Pre-select applied theme
    themeCards.forEach(card => {
      const themeVal = card.getAttribute('data-theme');
      if (themeVal === selectedTheme) {
        themeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        if (currentThemeLabel) currentThemeLabel.textContent = card.querySelector('.theme-card-name').textContent;
      }

      card.onclick = () => {
        if (card.classList.contains('locked')) {
          alert('This premium theme is available in Pro/Elite versions! 👑');
          return;
        }

        themeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        selectedTheme = themeVal;
        localStorage.setItem('selectedTheme', themeVal);
        if (currentThemeLabel) currentThemeLabel.textContent = card.querySelector('.theme-card-name').textContent;

        applyThemeStyles(themeVal);
        showToast('Theme applied! ✨');
      };
    });
  }

  function applyThemeStyles(theme) {
    document.body.className = ''; // Reset classes
    if (theme === 'vintage-warm') {
      document.body.classList.add('theme-vintage');
    } else if (theme === 'midnight-journal') {
      document.body.classList.add('theme-midnight');
    }
  }

  // ==========================================================================
  // SUB-SCREEN 3: ACHIEVEMENTS (BADGES) CONTROLLER
  // ==========================================================================
  const badgesList = [
    { id: 'badge_first_entry', emoji: '✍️', name: 'First Entry', desc: 'Write your first line to your diary', req: 'Create 1 journal entry' },
    { id: 'badge_first_snap', emoji: '📸', name: 'First Snap', desc: 'Capture a camera snap memory log', req: 'Create 1 snap photo log' },
    { id: 'badge_streak_7', emoji: '🔥', name: '7 Day Streak', desc: 'Maintain journal reflections for a week', req: 'Reach a writing streak of 7 days' },
    { id: 'badge_streak_30', emoji: '🔥', name: '30 Day Streak', desc: 'Journal daily for an entire month', req: 'Reach a writing streak of 30 days' },
    { id: 'badge_streak_100', emoji: '🔥', name: '100 Day Streak', desc: 'Achieve legendary status', req: 'Reach a writing streak of 100 days' },
    { id: 'badge_entries_10', emoji: '📖', name: '10 Entries', desc: 'Reflect 10 times in your private sheets', req: 'Write 10 diary entries' },
    { id: 'badge_entries_50', emoji: '📖', name: '50 Entries', desc: 'Build a beautiful record of reflections', req: 'Write 50 diary entries' },
    { id: 'badge_entries_100', emoji: '📖', name: '100 Entries', desc: 'A century of diary entries written', req: 'Write 100 diary entries' },
    { id: 'badge_first_game', emoji: '🎮', name: 'First Game', desc: 'Challenge your memory in the cabin', req: 'Play 1 play cabin mini-game' },
    { id: 'badge_game_master', emoji: '🏆', name: 'Game Master', desc: 'Show off your cognitive skills', req: 'Play at least 5 cabin mini-games' },
    { id: 'badge_coins_100', emoji: '🪙', name: '100 Coins', desc: 'Collect gold allowance coins', req: 'Acquire a coin balance of 100' },
    { id: 'badge_coins_500', emoji: '🪙', name: '500 Coins', desc: 'Become a top coins collector', req: 'Acquire a coin balance of 500' },
    { id: 'badge_level_2', emoji: '💛', name: 'Level 2 Friend', desc: 'Level up companion watchman', req: 'Reach bonding level 2 with companion' },
    { id: 'badge_level_5', emoji: '💜', name: 'Level 5 Soulmate', desc: 'Deepest relationship bond achieved', req: 'Reach bonding level 5 with companion' },
    { id: 'badge_anne_frank', emoji: '🕯️', name: 'Anne Frank Fan', desc: 'Inspired by historical diary quotes', req: 'Open quote expansion modal on dashboard' },
    { id: 'badge_story_builder', emoji: '🌟', name: 'Story Builder', desc: 'Complete a story builder reflection', req: 'Save a story builder entry' },
    { id: 'badge_challenge_champ', emoji: '🎯', name: 'Challenge Champion', desc: 'Complete a daily writing challenge', req: 'Save a daily challenge entry' },
    { id: 'badge_time_capsule', emoji: '💌', name: 'Time Capsule', desc: 'Send a sealed letter to future you', req: 'Create 1 time capsule log' },
    { id: 'badge_vulnerability', emoji: '🌸', name: 'Vulnerability', desc: 'Reflect honestly on sad/worried moods', req: 'Save 2 entries with sad or worried moods' },
    { id: 'badge_premium', emoji: '👑', name: 'Premium Member', desc: 'Joined the elite Golden Diary crew', req: 'Purchase or activate premium features' }
  ];

  function getEarnedBadges() {
    let earned = [];

    // Evaluate badge conditions
    if (diaryEntries.length >= 1) earned.push('badge_first_entry');
    if (snaps.length >= 1) earned.push('badge_first_snap');
    if (writingStreak >= 7) earned.push('badge_streak_7');
    if (writingStreak >= 30) earned.push('badge_streak_30');
    if (writingStreak >= 100) earned.push('badge_streak_100');
    if (diaryEntries.length >= 10) earned.push('badge_entries_10');
    if (diaryEntries.length >= 50) earned.push('badge_entries_50');
    if (diaryEntries.length >= 100) earned.push('badge_entries_100');
    
    // Coins
    if (coins >= 100) earned.push('badge_coins_100');
    if (coins >= 500) earned.push('badge_coins_500');

    // Level
    const bondingLevel = parseInt(localStorage.getItem('companion_level'), 10) || 1;
    if (bondingLevel >= 2) earned.push('badge_level_2');
    if (bondingLevel >= 5) earned.push('badge_level_5');

    // Extra games trackers check
    let gamesPlayed = [];
    try {
      gamesPlayed = JSON.parse(localStorage.getItem('gamesPlayed')) || [];
    } catch(e) {}
    if (gamesPlayed.length >= 1 || coins > 0) earned.push('badge_first_game');
    if (gamesPlayed.length >= 5) earned.push('badge_game_master');

    // Challenges checks
    const chalCount = diaryEntries.filter(e => e.text && e.text.includes('grateful')).length;
    if (chalCount >= 1) earned.push('badge_challenge_champ');
    
    const storyCount = diaryEntries.filter(e => e.text && e.text.includes('suddenly')).length;
    if (storyCount >= 1) earned.push('badge_story_builder');

    // Time capsules
    let caps = [];
    try {
      caps = JSON.parse(localStorage.getItem('capsules')) || [];
    } catch(e){}
    if (caps.length >= 1) earned.push('badge_time_capsule');

    // Vulnerability
    const vulnerableMoodsCount = diaryEntries.filter(e => e.mood === 'sad' || e.mood === 'worried').length;
    if (vulnerableMoodsCount >= 2) earned.push('badge_vulnerability');

    // Premium Member
    if (localStorage.getItem('premiumUpgrade') === 'true') earned.push('badge_premium');

    return earned;
  }

  function initAchievementsBoard() {
    const gridContainer = document.getElementById('badges-grid-container');
    const trackerLabel = document.getElementById('badges-earned-tracker');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    const earnedIds = getEarnedBadges();
    if (trackerLabel) trackerLabel.textContent = `${earnedIds.length} / 20 earned`;

    // Render badges preview row on Profile main screen too
    const previewRow = document.getElementById('badges-preview-row');
    const badgesCountLabel = document.getElementById('btn-view-badges');
    if (previewRow) {
      previewRow.innerHTML = '';
      earnedIds.slice(0, 3).forEach(id => {
        const badge = badgesList.find(b => b.id === id);
        if (badge) {
          const div = document.createElement('div');
          div.classList.add('small-badge-preview');
          div.textContent = badge.emoji;
          previewRow.appendChild(div);
        }
      });
    }
    if (badgesCountLabel) badgesCountLabel.textContent = `View all ${earnedIds.length} badges →`;

    // Build the grid
    badgesList.forEach(badge => {
      const isEarned = earnedIds.includes(badge.id);
      
      const item = document.createElement('div');
      item.className = `badge-item ${isEarned ? 'earned' : 'locked'}`;

      const circle = document.createElement('div');
      circle.classList.add('badge-circle');
      circle.textContent = badge.emoji;

      const nameLabel = document.createElement('span');
      nameLabel.classList.add('badge-name');
      nameLabel.textContent = badge.name;

      item.appendChild(circle);
      item.appendChild(nameLabel);
      gridContainer.appendChild(item);

      // Detail popup display on tap
      item.onclick = () => {
        showBadgeDetailPopup(badge, isEarned);
      };
    });
  }

  // Pre-load badges preview row
  initAchievementsBoard();

  // Detail popup sheets handlers
  const badgePopup = document.getElementById('badge-detail-popup');
  const btnClosePopup = document.getElementById('btn-close-badge-popup');

  function showBadgeDetailPopup(badge, isEarned) {
    if (!badgePopup) return;
    
    document.getElementById('popup-badge-emoji-box').textContent = badge.emoji;
    document.getElementById('popup-badge-title').textContent = badge.name;
    document.getElementById('popup-badge-desc').textContent = isEarned ? badge.desc : `Unlock requirement: ${badge.req}`;
    document.getElementById('popup-badge-status').textContent = isEarned ? `Unlocked on ${new Date().toLocaleDateString()}` : 'Locked 🔒';

    badgePopup.classList.add('active');
  }

  if (btnClosePopup && badgePopup) {
    btnClosePopup.onclick = () => badgePopup.classList.remove('active');
    badgePopup.onclick = (e) => {
      if (e.target === badgePopup) badgePopup.classList.remove('active');
    };
  }

  // Premium upgrade card handler
  const btnUpgrade = document.getElementById('btn-upgrade-premium');
  if (btnUpgrade) {
    // If already premium
    if (localStorage.getItem('premiumUpgrade') === 'true') {
      btnUpgrade.textContent = 'Active 👑';
      btnUpgrade.disabled = true;
    }

    btnUpgrade.onclick = () => {
      localStorage.setItem('premiumUpgrade', 'true');
      btnUpgrade.textContent = 'Active 👑';
      btnUpgrade.disabled = true;
      showToast('Premium Golden active! 👑');
      addBadge('badge_premium');
      initAchievementsBoard();
    };
  }

  function addBadge(id) {
    const earned = getEarnedBadges();
    if (!earned.includes(id)) {
      // Confetti cascade
      triggerConfetti('win-confetti-canvas');
    }
  }

  // ==========================================================================
  // SUB-SCREEN 4: MONTHLY MIRROR CONTROLLER
  // ==========================================================================
  let mirrorCurrentDate = new Date();

  function initMonthlyMirror() {
    renderMirrorHeader();
    renderMoodGraph();
    renderWordCloud();
    renderBestMemory();
    renderWritingHeatmap();
    renderRelationshipChart();
  }

  const btnPrevMonth = document.getElementById('btn-mirror-prev');
  const btnNextMonth = document.getElementById('btn-mirror-next');

  if (btnPrevMonth) {
    btnPrevMonth.onclick = () => {
      mirrorCurrentDate.setMonth(mirrorCurrentDate.getMonth() - 1);
      initMonthlyMirror();
    };
  }
  if (btnNextMonth) {
    btnNextMonth.onclick = () => {
      mirrorCurrentDate.setMonth(mirrorCurrentDate.getMonth() + 1);
      initMonthlyMirror();
    };
  }

  function renderMirrorHeader() {
    const label = document.getElementById('mirror-month-label');
    if (label) {
      const monthStr = mirrorCurrentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      label.textContent = monthStr;
    }
  }

  function renderMoodGraph() {
    const chart = document.getElementById('week-mood-chart');
    if (!chart) return;

    // Average mood per day of week (0=Sun, 1=Mon, etc.)
    let moodTallies = Array(7).fill(null).map(() => ({ total: 0, count: 0 }));
    const moodScores = { sad: 1, worried: 2, neutral: 3, happy: 4, joyful: 5 };

    // Get current month entries
    const curMonth = mirrorCurrentDate.getMonth();
    const curYear = mirrorCurrentDate.getFullYear();

    const monthEntries = diaryEntries.filter(entry => {
      const date = new Date(entry.date);
      return date.getMonth() === curMonth && date.getFullYear() === curYear;
    });

    monthEntries.forEach(entry => {
      const date = new Date(entry.date);
      const day = date.getDay(); // 0-6
      if (entry.mood && moodScores[entry.mood]) {
        moodTallies[day].total += moodScores[entry.mood];
        moodTallies[day].count++;
      }
    });

    // Reorder array Sunday-Saturday to Monday-Sunday (Mon=1, Tue=2... Sun=0)
    const weekdaysOrder = [1, 2, 3, 4, 5, 6, 0];
    const columns = chart.querySelectorAll('.mood-graph-col');

    weekdaysOrder.forEach((dayIndex, colIndex) => {
      const col = columns[colIndex];
      const bar = col.querySelector('.col-bar');
      
      const dayTally = moodTallies[dayIndex];
      if (dayTally.count > 0) {
        const avgScore = Math.round(dayTally.total / dayTally.count);
        bar.className = 'col-bar'; // reset class
        
        if (avgScore === 1) bar.classList.add('sad');
        else if (avgScore === 2) bar.classList.add('worried');
        else if (avgScore === 3) bar.classList.add('neutral');
        else if (avgScore === 4) bar.classList.add('happy');
        else if (avgScore === 5) bar.classList.add('joyful');
      } else {
        bar.className = 'col-bar empty';
      }
    });
  }

  function renderWordCloud() {
    const container = document.getElementById('word-cloud-container');
    if (!container) return;
    container.innerHTML = '';

    const curMonth = mirrorCurrentDate.getMonth();
    const curYear = mirrorCurrentDate.getFullYear();

    const monthEntries = diaryEntries.filter(entry => {
      const date = new Date(entry.date);
      return date.getMonth() === curMonth && date.getFullYear() === curYear;
    });

    let wordTally = {};
    const stopWords = ['THIS', 'THAT', 'WITH', 'FROM', 'ABOUT', 'THEY', 'YOUR', 'WENT', 'WERE', 'HAVE', 'SOME'];

    monthEntries.forEach(entry => {
      if (entry.text) {
        const cleanText = entry.text.replace(/<[^>]*>/g, '').toUpperCase();
        const matches = cleanText.match(/[A-Z]{4,10}/g); // Grab words length 4-10
        if (matches) {
          matches.forEach(w => {
            if (!stopWords.includes(w)) {
              wordTally[w] = (wordTally[w] || 0) + 1;
            }
          });
        }
      }
    });

    const sortedWords = Object.entries(wordTally).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (sortedWords.length === 0) {
      const p = document.createElement('p');
      p.className = 'best-memory-empty';
      p.textContent = 'Write more to see your words! ✍️';
      container.appendChild(p);
      return;
    }

    // Render words different sizes
    const sizeClasses = ['14px', '18px', '22px', '26px', '32px'];
    sortedWords.forEach(([word, count]) => {
      const span = document.createElement('span');
      span.classList.add('cloud-word');
      span.textContent = word.toLowerCase();

      // Determine size index
      const maxCount = sortedWords[0][1];
      const sizeIndex = Math.min(Math.floor((count / maxCount) * sizeClasses.length), sizeClasses.length - 1);
      span.style.fontSize = sizeClasses[sizeIndex];

      // Subtle random color shade
      const opacity = Math.random() * 0.4 + 0.6;
      span.style.color = `rgba(255, 215, 0, ${opacity})`;
      container.appendChild(span);
    });
  }

  function renderBestMemory() {
    const container = document.getElementById('best-memory-container');
    if (!container) return;

    const curMonth = mirrorCurrentDate.getMonth();
    const curYear = mirrorCurrentDate.getFullYear();

    const monthEntries = diaryEntries.filter(entry => {
      const date = new Date(entry.date);
      return date.getMonth() === curMonth && date.getFullYear() === curYear;
    });

    const moodScores = { joyful: 5, happy: 4, neutral: 3, worried: 2, sad: 1 };
    
    // Find entry with highest mood score and longest content
    let bestEntry = null;
    let highestScore = 0;

    monthEntries.forEach(entry => {
      const score = moodScores[entry.mood] || 0;
      if (score > highestScore) {
        highestScore = score;
        bestEntry = entry;
      } else if (score === highestScore && bestEntry) {
        if (entry.text.length > bestEntry.text.length) {
          bestEntry = entry;
        }
      }
    });

    if (!bestEntry) {
      container.innerHTML = `<p class="best-memory-empty">Write entries with happy moods to reveal your best memory card! 🕯️</p>`;
      return;
    }

    // Render Preview
    container.innerHTML = '';
    
    const dateSpan = document.createElement('span');
    dateSpan.classList.add('best-memory-date');
    dateSpan.textContent = bestEntry.date;

    const textPara = document.createElement('p');
    textPara.classList.add('best-memory-text');
    
    const rawText = bestEntry.text.replace(/<[^>]*>/g, '');
    textPara.textContent = rawText.substring(0, 110) + (rawText.length > 110 ? '...' : '');

    container.appendChild(dateSpan);
    container.appendChild(textPara);
  }

  function renderWritingHeatmap() {
    const container = document.getElementById('heatmap-grid-container');
    if (!container) return;
    container.innerHTML = '';

    // Render 35 cells (5 weeks)
    const curMonth = mirrorCurrentDate.getMonth();
    const curYear = mirrorCurrentDate.getFullYear();

    // Map month entries to days mapping
    let dayCounts = {};
    diaryEntries.forEach(entry => {
      const date = new Date(entry.date);
      if (date.getMonth() === curMonth && date.getFullYear() === curYear) {
        const day = date.getDate();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    });

    // Compute month offsets
    const firstDayIndex = new Date(curYear, curMonth, 1).getDay(); // 0=Sun, 1=Mon...
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();

    // Align cells. Mon=1, Sun=0. First padding offsets
    const padCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = 0; i < 35; i++) {
      const cell = document.createElement('div');
      cell.classList.add('heatmap-cell');

      const dateNum = i - padCount + 1;
      if (dateNum > 0 && dateNum <= daysInMonth) {
        const count = dayCounts[dateNum] || 0;
        cell.setAttribute('title', `${dateNum} ${mirrorCurrentDate.toLocaleString('en-US', {month: 'short'})}: ${count} entries`);
        
        if (count === 0) cell.classList.add('level-0');
        else if (count === 1) cell.classList.add('level-1');
        else if (count === 2) cell.classList.add('level-2');
        else cell.classList.add('level-3');
      } else {
        cell.style.opacity = '0'; // hide empty padding columns
      }

      container.appendChild(cell);
    }
  }

  function renderRelationshipChart() {
    const bar = document.getElementById('relationship-growth-fill');
    const marker = document.getElementById('growth-marker-point');
    
    // Map coin balances to growth meters
    let ratio = Math.min((coins / 500) * 100, 100);
    if (bar) bar.style.width = `${ratio}%`;
    if (marker) marker.style.left = `${ratio}%`;
  }

  // ==========================================================================
  // SUB-SCREEN 5: TIME CAPSULE CONTROLLER
  // ==========================================================================
  let capsulesArray = [];
  try {
    capsulesArray = JSON.parse(localStorage.getItem('capsules')) || [];
  } catch (e) {
    capsulesArray = [];
  }

  function initTimeCapsule() {
    const textarea = document.getElementById('capsule-writing-area');
    const datePicker = document.getElementById('input-capsule-date');
    const btnSeal = document.getElementById('btn-seal-capsule');

    if (textarea) textarea.value = '';

    // Set delivery date minimum: 1 month from today
    if (datePicker) {
      const minDate = new Date();
      minDate.setMonth(minDate.getMonth() + 1);
      const minDateStr = minDate.toISOString().split('T')[0];
      datePicker.setAttribute('min', minDateStr);
      datePicker.value = minDateStr;
    }

    // Seal Capsule Click
    if (btnSeal) {
      btnSeal.onclick = () => {
        const text = textarea ? textarea.value.trim() : '';
        const targetDate = datePicker ? datePicker.value : '';

        if (!text) {
          alert('Write something to your future self first! 🕰️');
          return;
        }

        // Wax seal bounce animation trigger
        btnSeal.classList.add('wax-seal-animation');
        
        setTimeout(() => {
          btnSeal.classList.remove('wax-seal-animation');
          
          const newCapsule = {
            id: 'cap_' + Date.now(),
            text: text,
            deliveryDate: targetDate,
            sealedDate: new Date().toLocaleDateString(),
            opened: false
          };

          capsulesArray.push(newCapsule);
          localStorage.setItem('capsules', JSON.stringify(capsulesArray));
          
          textarea.value = '';
          showToast('Time Capsule Sealed! 🕯️');
          addBadge('badge_time_capsule');

          renderCapsuleLists();
        }, 800);
      };
    }

    renderCapsuleLists();
  }

  function renderCapsuleLists() {
    const sealedList = document.getElementById('sealed-capsules-list');
    const deliveredList = document.getElementById('delivered-capsules-list');
    if (!sealedList || !deliveredList) return;

    sealedList.innerHTML = '';
    deliveredList.innerHTML = '';

    const todayTime = new Date().getTime();

    // Check delivery state dates
    capsulesArray.forEach(cap => {
      const delTime = new Date(cap.deliveryDate).getTime();
      if (delTime <= todayTime) {
        cap.opened = true;
      }
    });
    localStorage.setItem('capsules', JSON.stringify(capsulesArray));

    const sealedItems = capsulesArray.filter(c => !c.opened);
    const deliveredItems = capsulesArray.filter(c => c.opened);

    // Render Sealed List
    if (sealedItems.length === 0) {
      sealedList.innerHTML = `<p class="capsule-empty-msg">No sealed capsules. Seal one to reveal it here!</p>`;
    } else {
      sealedItems.forEach(cap => {
        const div = document.createElement('div');
        div.className = 'capsule-card';

        const seal = document.createElement('span');
        seal.className = 'wax-seal-icon';
        seal.textContent = '🔒';

        const info = document.createElement('div');
        info.className = 'capsule-meta-info';
        
        const heading = document.createElement('h4');
        heading.textContent = `Opens on: ${cap.deliveryDate}`;

        const sub = document.createElement('p');
        
        const diffDays = Math.ceil((new Date(cap.deliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        sub.textContent = `${diffDays} days remaining`;

        info.appendChild(heading);
        info.appendChild(sub);
        div.appendChild(seal);
        div.appendChild(info);
        sealedList.appendChild(div);
      });
    }

    // Render Delivered List
    if (deliveredItems.length === 0) {
      deliveredList.innerHTML = `<p class="capsule-empty-msg">No delivered capsules yet. Patience is a virtue...</p>`;
    } else {
      deliveredItems.forEach(cap => {
        const div = document.createElement('div');
        div.className = 'capsule-card unlocked-capsule';
        div.style.cursor = 'pointer';
        div.style.backgroundColor = 'var(--paper-bg)';
        div.style.color = 'var(--paper-text)';

        const seal = document.createElement('span');
        seal.className = 'wax-seal-icon';
        seal.textContent = '💌';

        const info = document.createElement('div');
        info.className = 'capsule-meta-info';
        
        const heading = document.createElement('h4');
        heading.textContent = `Capsule Opened!`;
        heading.style.color = 'var(--paper-text)';

        const sub = document.createElement('p');
        sub.textContent = cap.text.substring(0, 30) + '...';

        info.appendChild(heading);
        info.appendChild(sub);
        div.appendChild(seal);
        div.appendChild(info);
        deliveredList.appendChild(div);

        // Click delivered details
        div.onclick = () => {
          alert(`🕰️ Time Capsule from ${cap.sealedDate}:\n\n"${cap.text}"`);
        };
      });
    }
  }

  // ==========================================================================
  // SUB-SCREEN 6: YEAR IN DIARY CONTROLLER
  // ==========================================================================
  function initYearInDiary() {
    const totalEntries = document.getElementById('year-total-entries');
    const totalWords = document.getElementById('year-total-words');
    const totalSnaps = document.getElementById('year-total-snaps');
    const longestStreak = document.getElementById('year-longest-streak');
    const favMood = document.getElementById('year-fav-mood');
    const activeMonth = document.getElementById('year-active-month');
    const wordDisplay = document.getElementById('year-word-display');
    const entriesList = document.getElementById('year-best-entries-container');

    // Counts totals
    let wordCountSum = 0;
    diaryEntries.forEach(entry => {
      if (entry.text) {
        const clean = entry.text.replace(/<[^>]*>/g, '').trim();
        wordCountSum += clean ? clean.split(/\s+/).length : 0;
      }
    });

    if (totalEntries) totalEntries.textContent = diaryEntries.length;
    if (totalWords) totalWords.textContent = wordCountSum;
    if (totalSnaps) totalSnaps.textContent = snaps.length;
    if (longestStreak) longestStreak.textContent = writingStreak;

    // Mood tallies
    let moodTallies = { joyful: 0, happy: 0, neutral: 0, worried: 0, sad: 0 };
    diaryEntries.forEach(e => {
      if (e.mood && moodTallies.hasOwnProperty(e.mood)) moodTallies[e.mood]++;
    });
    const sortedMoods = Object.entries(moodTallies).sort((a,b) => b[1] - a[1]);
    if (favMood) favMood.textContent = sortedMoods[0][1] > 0 ? sortedMoods[0][0].toUpperCase() : 'Neutral';

    // Word of the year
    let globalWords = {};
    const stopWords = ['THIS', 'THAT', 'WITH', 'FROM', 'THEY', 'YOUR', 'WERE', 'HAVE'];
    diaryEntries.forEach(e => {
      if (e.text) {
        const text = e.text.replace(/<[^>]*>/g, '').toUpperCase();
        const matches = text.match(/[A-Z]{4,8}/g);
        if (matches) {
          matches.forEach(w => {
            if (!stopWords.includes(w)) globalWords[w] = (globalWords[w] || 0) + 1;
          });
        }
      }
    });
    const sortedGlobalWords = Object.entries(globalWords).sort((a,b) => b[1] - a[1]);
    if (wordDisplay) wordDisplay.textContent = sortedGlobalWords[0] ? sortedGlobalWords[0][0] : 'Reflection';

    // Top entries preview
    if (entriesList) {
      entriesList.innerHTML = '';
      const topEntries = diaryEntries.filter(e => e.mood === 'joyful' || e.mood === 'happy').slice(0, 3);
      
      if (topEntries.length === 0) {
        entriesList.innerHTML = `<p class="year-empty-text">No best memories found. Keep writing reflections!</p>`;
      } else {
        topEntries.forEach(entry => {
          const card = document.createElement('div');
          card.className = 'year-entry-preview-card';

          const h4 = document.createElement('h4');
          h4.textContent = entry.date;

          const p = document.createElement('p');
          const cleanText = entry.text.replace(/<[^>]*>/g, '');
          p.textContent = cleanText.substring(0, 60) + (cleanText.length > 60 ? '...' : '');

          card.appendChild(h4);
          card.appendChild(p);
          entriesList.appendChild(card);
        });
      }
    }

    // Share button
    const btnShare = document.getElementById('btn-share-year');
    if (btnShare) {
      btnShare.onclick = () => {
        alert('Shareable year card image compiled! ✨ Ready to share with your companion Ollie.');
      };
    }
  }

  // ==========================================================================
  // SUB-SCREEN 7: SETTINGS CONTROLLERS
  // ==========================================================================
  
  // 1. Notifications Screen
  function initNotificationsSettings() {
    const notifyWriting = document.getElementById('notify-writing');
    const notifySnaps = document.getElementById('notify-snaps');
    const notifyStreaks = document.getElementById('notify-streaks');
    const timeInput = document.getElementById('input-reminder-time');
    const btnSaveReminders = document.getElementById('btn-save-reminders');

    // Retrieve storage settings
    let settingsObj = { writing: true, snaps: true, streaks: true };
    try {
      settingsObj = JSON.parse(localStorage.getItem('notifications')) || settingsObj;
    } catch(e){}

    if (notifyWriting) notifyWriting.checked = settingsObj.writing;
    if (notifySnaps) notifySnaps.checked = settingsObj.snaps;
    if (notifyStreaks) notifyStreaks.checked = settingsObj.streaks;
    if (timeInput) timeInput.value = localStorage.getItem('reminderTime') || '21:00';

    if (btnSaveReminders) {
      btnSaveReminders.onclick = () => {
        const settings = {
          writing: notifyWriting ? notifyWriting.checked : true,
          snaps: notifySnaps ? notifySnaps.checked : true,
          streaks: notifyStreaks ? notifyStreaks.checked : true
        };
        localStorage.setItem('notifications', JSON.stringify(settings));
        localStorage.setItem('reminderTime', timeInput ? timeInput.value : '21:00');
        showToast('Settings saved!');
      };
    }
  }

  // 2. Privacy & Security Screen & PIN Pad Keypad
  let tempEnteredPin = '';
  let pinActionState = 'set'; // 'set' or 'verify' or 'disable'

  function initPrivacySettings() {
    const toggleLock = document.getElementById('pin-lock-toggle');
    const pinPadOverlay = document.getElementById('overlay-pin-pad');
    const btnClosePin = document.getElementById('btn-close-pinpad');
    const btnExport = document.getElementById('btn-export-diary');

    const isLocked = localStorage.getItem('diaryLocked') === 'true';
    if (toggleLock) toggleLock.checked = isLocked;

    if (toggleLock) {
      toggleLock.onchange = () => {
        if (toggleLock.checked) {
          // Open PIN Pad to Set
          pinActionState = 'set';
          document.getElementById('pin-pad-title').textContent = 'Set Lock PIN';
          document.getElementById('pin-pad-instructions').textContent = 'Enter a 4-digit PIN to secure your diary';
          openOverlay('pin-pad');
        } else {
          // Open PIN Pad to Disable
          pinActionState = 'disable';
          document.getElementById('pin-pad-title').textContent = 'Enter Lock PIN';
          document.getElementById('pin-pad-instructions').textContent = 'Confirm PIN code to disable lock settings';
          openOverlay('pin-pad');
        }
      };
    }

    if (btnClosePin) {
      btnClosePin.onclick = () => {
        // Reset checkbox to actual lock status
        if (toggleLock) toggleLock.checked = localStorage.getItem('diaryLocked') === 'true';
        closeOverlay('pin-pad');
      };
    }

    // Export diaries as Text blob
    if (btnExport) {
      btnExport.onclick = () => {
        let exportStr = `Dear Diary reflections export - ${userName}\n\n`;
        diaryEntries.forEach(e => {
          const plainText = e.text.replace(/<[^>]*>/g, '').trim();
          exportStr += `Date: ${e.date} ${e.time}\nMood: ${e.mood}\nText: ${plainText}\n\n--------------------\n\n`;
        });

        const blob = new Blob([exportStr], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${userName}_diary_reflections.txt`;
        link.click();
        showToast('Diary text backup exported! 🔒');
      };
    }
  }

  // PIN Pad key clicks logic
  const numButtons = document.querySelectorAll('.num-btn[data-val]');
  const pinDots = document.querySelectorAll('.pin-dot');

  numButtons.forEach(btn => {
    btn.onclick = () => {
      const val = btn.getAttribute('data-val');

      if (val === 'clear') {
        tempEnteredPin = '';
        updatePinDots();
      } else if (val === 'ok') {
        submitPIN();
      } else {
        if (tempEnteredPin.length < 4) {
          tempEnteredPin += val;
          updatePinDots();
        }
      }
    };
  });

  function updatePinDots() {
    pinDots.forEach((dot, index) => {
      if (index < tempEnteredPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  function submitPIN() {
    if (tempEnteredPin.length < 4) {
      alert('PIN must be 4 digits!');
      return;
    }

    const savedPin = localStorage.getItem('pin');

    if (pinActionState === 'set') {
      localStorage.setItem('pin', tempEnteredPin);
      localStorage.setItem('diaryLocked', 'true');
      const toggleLock = document.getElementById('pin-lock-toggle');
      if (toggleLock) toggleLock.checked = true;

      showToast('PIN set successfully! 🔑');
      tempEnteredPin = '';
      updatePinDots();
      closeOverlay('pin-pad');
      addBadge('badge_premium'); // trigger achievements check
    } else if (pinActionState === 'disable') {
      if (tempEnteredPin === savedPin) {
        localStorage.setItem('diaryLocked', 'false');
        localStorage.removeItem('pin');
        const toggleLock = document.getElementById('pin-lock-toggle');
        if (toggleLock) toggleLock.checked = false;

        showToast('Diary lock disabled!');
        tempEnteredPin = '';
        updatePinDots();
        closeOverlay('pin-pad');
      } else {
        alert('Invalid PIN code! Try again.');
        tempEnteredPin = '';
        updatePinDots();
      }
    }
  }

  // Ghost Mode toggle checkbox item click
  const ghostToggle = document.getElementById('ghost-mode-toggle');
  if (ghostToggle) {
    ghostToggle.checked = localStorage.getItem('ghostMode') === 'true';
    ghostToggle.onchange = () => {
      const active = ghostToggle.checked;
      localStorage.setItem('ghostMode', String(active));
      
      if (active) {
        if (fc) {
          fc.classList.remove('loaded');
          setTimeout(() => fc.style.display = 'none', 800);
        }
        showToast('Ghost Mode active. Companion hidden 👻');
      } else {
        if (fc) {
          fc.style.display = 'flex';
          setTimeout(() => fc.classList.add('loaded'), 100);
        }
        showToast('Ghost Mode disabled.');
      }
    };
  }

  // ==========================================================================
  // SIGN OUT WIPE LOCALSTORAGE OVERLAY MODAL
  // ==========================================================================
  const btnSignOut = document.getElementById('btn-sign-out');
  const signOutConfirmModal = document.getElementById('sign-out-confirm-modal');
  const btnCancelSignOut = document.getElementById('btn-cancel-signout');
  const btnConfirmSignOut = document.getElementById('btn-confirm-signout');

  if (btnSignOut && signOutConfirmModal) {
    btnSignOut.addEventListener('click', () => {
      signOutConfirmModal.classList.add('active');
    });
  }

  if (btnCancelSignOut && signOutConfirmModal) {
    btnCancelSignOut.addEventListener('click', () => {
      signOutConfirmModal.classList.remove('active');
    });
  }

  if (btnConfirmSignOut && signOutConfirmModal) {
    btnConfirmSignOut.addEventListener('click', () => {
      // WIPE LocalStorage completely
      localStorage.clear();

      // Black transition viewport overlay fade out
      const fadeOverlay = document.createElement('div');
      fadeOverlay.classList.add('fade-overlay');
      fadeOverlay.style.opacity = '0';
      document.body.appendChild(fadeOverlay);

      void fadeOverlay.offsetWidth;
      fadeOverlay.style.transition = 'opacity 0.8s ease-in-out';
      fadeOverlay.style.opacity = '1';

      setTimeout(() => {
        window.location.href = '../index.html'; // redirect index.html onboarding
      }, 800);
    });
  }

  // Confetti Particle Canvas Trigger (from play.js code)
  function triggerConfetti(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    const colors = ['#FFD700', '#FFA500', '#FFFAF0', '#B8860B'];
    const particles = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 4 + 2,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    let animationFrameId;
    function drawConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeParticles = 0;

      particles.forEach(p => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - activeParticles / 3) * 15;

        if (p.y <= canvas.height) activeParticles++;

        ctx.beginPath();
        ctx.lineWidth = p.r * 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(drawConfetti);
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    }
    drawConfetti();
  }

});
