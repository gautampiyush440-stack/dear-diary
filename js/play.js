/**
 * Dear Diary - Play Cabin Games Controller
 */
// Protect page & setup navigation behavior
(function() {
  const activePage = 'play.html';
  
  // 1. Auth Guard
  const checkFirebase = setInterval(() => {
    if (typeof window.firebase !== 'undefined') {
      clearInterval(checkFirebase);
      window.firebase.auth().onAuthStateChanged((user) => {
        if (window.firebase.auth().currentUser === null) {
          window.location.href = 'login.html';
        }
      });
    }
  }, 50);

  // 2. Navigation
  document.addEventListener('DOMContentLoaded', () => {
    const navTabs = document.querySelectorAll('.bottom-nav a');
    navTabs.forEach(tab => {
      const href = tab.getAttribute('href') || '';
      const pageName = href.substring(href.lastIndexOf('/') + 1);
      
      if (pageName === activePage) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }

      tab.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = pageName;
      });
    });
  });
})();

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // PROFILE STATE & FALLBACK RETRIEVAL
  // ==========================================================================
  let userName = 'Friend';
  let companionName = 'Ollie';
  let companionEmoji = '🦉';
  let coins = 0;
  let diaryEntries = [];
  let snaps = [];

  async function initPlayCabin() {
    try {
      const profile = await API.getProfile();
      userName = profile.username || userName;
      companionName = profile.companionName || companionName;
      companionEmoji = profile.companionEmoji || companionEmoji;
      coins = profile.coins || 0;

      // Sync local storage backups
      localStorage.setItem('user_name', userName);
      localStorage.setItem('companion_name', companionName);
      localStorage.setItem('companion_emoji', companionEmoji);
      localStorage.setItem('coins', String(coins));

      try {
        diaryEntries = await API.getEntries();
        localStorage.setItem('diary_entries', JSON.stringify(diaryEntries));
      } catch (e) {}

      try {
        const snapsRes = await API.getSnaps();
        snaps = snapsRes.snaps || [];
        localStorage.setItem('diary_snaps', JSON.stringify(snaps));
      } catch (e) {}
    } catch (err) {
      console.warn('API error loading play cabin configuration fallback:', err);
      userName = localStorage.getItem('user_name') || 'Friend';
      companionName = localStorage.getItem('companion_name') || 'Ollie';
      companionEmoji = localStorage.getItem('companion_emoji') || '🦉';
      coins = parseInt(localStorage.getItem('coins'), 10) || 0;
      
      try {
        diaryEntries = JSON.parse(localStorage.getItem('diary_entries')) || [];
      } catch (e) { diaryEntries = []; }
      
      try {
        snaps = JSON.parse(localStorage.getItem('diary_snaps')) || [];
      } catch (e) { snaps = []; }
    }

    // Update UI headers
    const headerCoinCount = document.getElementById('header-coin-count');
    if (headerCoinCount) headerCoinCount.textContent = coins;

    const floatEmoji = document.getElementById('floating-companion-emoji');
    if (floatEmoji) floatEmoji.textContent = companionEmoji;

    // Initialize Game companion emojis
    const gameCompanionIds = [
      'match-companion-emoji',
      'mood-companion-emoji',
      'puzzle-companion-emoji',
      'challenge-companion-emoji',
      'story-companion-emoji'
    ];
    gameCompanionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = companionEmoji;
    });

    const saysLabel = document.getElementById('companion-says-label');
    if (saysLabel) saysLabel.textContent = `${companionName} says:`;
  }

  // Trigger loading configurations
  initPlayCabin();

  // --------------------------------------------------------------------------
  // TIMER RESETS: MIDNIGHT COUNTDOWN
  // --------------------------------------------------------------------------
  const dailyChallengeTimer = document.getElementById('daily-challenge-timer');
  function updateMidnightTimer() {
    if (!dailyChallengeTimer) return;
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Next midnight
    const diff = midnight.getTime() - now.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num) => String(num).padStart(2, '0');
    dailyChallengeTimer.textContent = `Resets in: ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  setInterval(updateMidnightTimer, 1000);
  updateMidnightTimer();

  // --------------------------------------------------------------------------
  // COINS COUNT-UP ANIMATION
  // --------------------------------------------------------------------------
  function animateCoinBalance(targetAmount) {
    const startVal = parseInt(headerCoinCount.textContent, 10) || 0;
    const duration = 1200; // 1.2s duration
    const startTime = performance.now();

    function updateCoins(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = progress * (2 - progress); // easeOutQuad
      const currentVal = Math.floor(startVal + easedProgress * (targetAmount - startVal));

      if (headerCoinCount) headerCoinCount.textContent = currentVal;
      const rewardBalanceLabel = document.getElementById('rewards-coin-balance');
      if (rewardBalanceLabel) rewardBalanceLabel.textContent = `🪙 ${currentVal}`;

      if (progress < 1) {
        requestAnimationFrame(updateCoins);
      } else {
        if (headerCoinCount) headerCoinCount.textContent = targetAmount;
        if (rewardBalanceLabel) rewardBalanceLabel.textContent = `🪙 ${targetAmount}`;
      }
    }
    requestAnimationFrame(updateCoins);
  }

  async function addCoins(amount) {
    try {
      const res = await API.claimReward(amount, 'Mini Games');
      coins = res.coins;
      localStorage.setItem('coins', String(coins));
    } catch (err) {
      console.warn('API coins award failed, adding locally:', err);
      coins += amount;
      localStorage.setItem('coins', String(coins));
    }
    animateCoinBalance(coins);
  }

  // ==========================================================================
  // FLOATING COMPANION DRAGGING (POINTER EVENTS)
  // ==========================================================================
  const fc = document.getElementById('floating-companion');
  let isDragging = false;
  let startX = 0, startY = 0;
  let downX = 0, downY = 0;
  let dragDistance = 0;
  let speechTimeout = null;

  function triggerSpeechBubble(customText = null) {
    const bubble = document.getElementById('floating-speech-bubble');
    if (!bubble) return;

    bubble.textContent = customText || `Let's play! 🎮`;
    bubble.classList.add('show');

    if (speechTimeout) clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => {
      bubble.classList.remove('show');
    }, 2500);
  }

  if (fc) {
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
    const wrapper = document.querySelector('.play-wrapper');
    if (wrapper) wrapper.classList.add('animated');
  }, 100);

  setTimeout(() => {
    if (fc) fc.classList.add('loaded');
  }, 300);

  // ==========================================================================
  // NAVIGATION SCREEN TRIGGER MANAGEMENT
  // ==========================================================================
  const gameButtons = document.querySelectorAll('.btn-game-play');
  const btnPlayDaily = document.getElementById('btn-play-daily');
  const btnLeaderboard = document.getElementById('btn-leaderboard');
  const btnOverlayRewards = document.getElementById('btn-overlay-rewards');
  const backButtons = document.querySelectorAll('.btn-overlay-back');

  // Open Overlays mapping
  function openOverlay(overlayId) {
    const overlay = document.getElementById(`overlay-${overlayId}`);
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // lock background scroll

      // Trigger Game Init logic on slide up
      if (overlayId === 'memory-match') initMemoryGame();
      if (overlayId === 'mood-guesser') initMoodGuesser();
      if (overlayId === 'word-puzzle') initWordPuzzle();
      if (overlayId === 'daily-challenge') initDailyChallenge();
      if (overlayId === 'story-builder') initStoryBuilder();
      if (overlayId === 'leaderboard') initLeaderboardData();
      if (overlayId === 'rewards') initRewardsData();
    }
  }

  function closeOverlay(overlayId) {
    const overlay = document.getElementById(`overlay-${overlayId}`);
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = 'auto'; // restore scroll
      
      // Stop active game timers/loops
      clearInterval(gameTimerInterval);
    }
  }

  gameButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const gameTarget = btn.getAttribute('data-game');
      openOverlay(gameTarget);
      
      // Dynamic companion expressions
      const expressions = {
        'memory-match': `Match pairs, ${userName}! 🧠`,
        'mood-guesser': `Hmm, guess how you felt 😊`,
        'word-puzzle': `Find words in the grid 📝`,
        'daily-challenge': `Let's write a reflection! 🎯`,
        'story-builder': `Once upon a time... 🌟`
      };
      triggerSpeechBubble(expressions[gameTarget]);
    });
  });

  if (btnPlayDaily) {
    btnPlayDaily.addEventListener('click', () => {
      openOverlay('daily-challenge');
    });
  }

  if (btnLeaderboard) {
    btnLeaderboard.addEventListener('click', () => {
      openOverlay('leaderboard');
    });
  }

  if (btnOverlayRewards) {
    btnOverlayRewards.addEventListener('click', () => {
      openOverlay('rewards');
    });
  }

  backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      closeOverlay(target);
    });
  });

  // ==========================================================================
  // CONFETTI CASCADE PARTICLE ENGINE
  // ==========================================================================
  let confettiInterval = null;
  function triggerConfetti(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    const colors = ['#FFD700', '#FFA500', '#FFFAF0', '#B8860B', '#F2E0BC'];
    const particles = [];

    // Instantiate 80 particles
    for (let i = 0; i < 80; i++) {
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

        if (p.y <= canvas.height) {
          activeParticles++;
        }

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

  // ==========================================================================
  // GLOBAL GAME WIN SCREEN MODAL
  // ==========================================================================
  const winModal = document.getElementById('global-win-overlay');
  const btnWinReplay = document.getElementById('btn-win-replay');
  const btnWinBack = document.getElementById('btn-win-back');

  let activeReplayCallback = null;
  let activeBackCallback = null;

  function showWinScreen(title, scoreText, coinReward, replayCallback, backCallback) {
    document.getElementById('win-heading').textContent = title;
    document.getElementById('win-score-label').textContent = scoreText;
    document.getElementById('win-coins-earned').textContent = `+${coinReward} 🪙 earned!`;

    winModal.classList.add('active');
    triggerConfetti('win-confetti-canvas');
    addCoins(coinReward);

    activeReplayCallback = replayCallback;
    activeBackCallback = backCallback;
  }

  if (btnWinReplay) {
    btnWinReplay.addEventListener('click', () => {
      winModal.classList.remove('active');
      if (activeReplayCallback) activeReplayCallback();
    });
  }

  if (btnWinBack) {
    btnWinBack.addEventListener('click', () => {
      winModal.classList.remove('active');
      if (activeBackCallback) activeBackCallback();
    });
  }

  // Active Game States
  let gameTimerInterval = null;

  // ==========================================================================
  // GAME 1: MEMORY MATCH LOGIC
  // ==========================================================================
  let firstFlippedCard = null;
  let secondFlippedCard = null;
  let canFlipMatch = true;
  let matchPairsFound = 0;
  let matchTimerVal = 45;
  let matchScore = 0;

  function initMemoryGame() {
    const gridContainer = document.getElementById('memory-grid-container');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    firstFlippedCard = null;
    secondFlippedCard = null;
    canFlipMatch = true;
    matchPairsFound = 0;
    matchTimerVal = 45;
    matchScore = 0;

    const timerBadge = document.getElementById('match-timer');
    const scoreBadge = document.getElementById('match-score-badge');
    const coinBadge = document.getElementById('game-match-coins');
    if (timerBadge) timerBadge.textContent = '⏱️ 00:45';
    if (scoreBadge) scoreBadge.textContent = 'Score: 0';
    if (coinBadge) coinBadge.textContent = '0';

    // Companion reaction resets
    setCompanionReaction('match-companion-emoji', 'match-companion-speech', '🦉', `Find the pairs, ${userName}! 🔍`);

    // Prepare 8 pairs
    // Default emojis
    const defaultPairs = ['📖', '✍️', '🕯️', '🌟', '💛', '🎭', '🦋', '🌸'];
    let finalDeck = [];

    // Filter snap photos from localStorage
    const snapPhotos = snaps.filter(s => s.photo).map(s => s.photo);
    
    // Choose up to 8 cards
    for (let i = 0; i < 8; i++) {
      if (snapPhotos[i]) {
        finalDeck.push({ type: 'image', value: snapPhotos[i] });
      } else {
        finalDeck.push({ type: 'emoji', value: defaultPairs[i % defaultPairs.length] });
      }
    }

    // Duplicate deck to create pairs
    let gameCards = [...finalDeck, ...finalDeck];

    // Shuffle cards
    gameCards.sort(() => Math.random() - 0.5);

    // Create DOM structure
    gameCards.forEach((card, index) => {
      const cardBox = document.createElement('div');
      cardBox.classList.add('memory-card-box');
      cardBox.setAttribute('data-id', index);
      cardBox.setAttribute('data-val', card.value);

      const inner = document.createElement('div');
      inner.classList.add('memory-card-inner');

      const front = document.createElement('div');
      front.classList.add('memory-card-front');

      const back = document.createElement('div');
      back.classList.add('memory-card-back');

      if (card.type === 'image') {
        const img = document.createElement('img');
        img.src = card.value;
        img.classList.add('card-image');
        back.appendChild(img);
      } else {
        const span = document.createElement('span');
        span.textContent = card.value;
        span.classList.add('card-emoji');
        back.appendChild(span);
      }

      inner.appendChild(front);
      inner.appendChild(back);
      cardBox.appendChild(inner);
      gridContainer.appendChild(cardBox);

      // Tap event listener
      cardBox.addEventListener('click', () => {
        flipMemoryCard(cardBox);
      });
    });

    // Start Timer
    clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
      matchTimerVal--;
      if (timerBadge) {
        timerBadge.textContent = `⏱️ 00:${String(matchTimerVal).padStart(2, '0')}`;
      }

      if (matchTimerVal <= 0) {
        clearInterval(gameTimerInterval);
        triggerMemoryLose();
      }
    }, 1000);
  }

  function flipMemoryCard(card) {
    if (!canFlipMatch) return;
    if (card.classList.contains('flipped') || card.classList.contains('found')) return;

    card.classList.add('flipped');

    if (!firstFlippedCard) {
      firstFlippedCard = card;
    } else {
      secondFlippedCard = card;
      canFlipMatch = false;
      checkMemoryMatch();
    }
  }

  function checkMemoryMatch() {
    const val1 = firstFlippedCard.getAttribute('data-val');
    const val2 = secondFlippedCard.getAttribute('data-val');

    if (val1 === val2) {
      // Correct Match
      setTimeout(() => {
        firstFlippedCard.classList.add('found');
        secondFlippedCard.classList.add('found');
        matchPairsFound++;
        matchScore += 2;

        const scoreBadge = document.getElementById('match-score-badge');
        if (scoreBadge) scoreBadge.textContent = `Score: ${matchScore}`;
        
        // Show point label floating up
        triggerPointsLabel(secondFlippedCard, '+2 points');

        // Ollie jump reaction
        animateCompanionReaction('match-companion-emoji', 'match-companion-speech', 'jump', `Yay! Match found! 🎉`);

        resetFlippedTrack();

        if (matchPairsFound === 8) {
          clearInterval(gameTimerInterval);
          setTimeout(() => {
            showWinScreen(
              'You remembered! 🥺',
              `Score: ${matchScore} points`,
              15,
              () => openOverlay('memory-match'),
              () => closeOverlay('memory-match')
            );
          }, 800);
        }
      }, 500);
    } else {
      // Incorrect Match
      setTimeout(() => {
        firstFlippedCard.classList.remove('flipped');
        secondFlippedCard.classList.remove('flipped');

        animateCompanionReaction('match-companion-emoji', 'match-companion-speech', 'facepalm', `Oops, try again! 😅`);

        resetFlippedTrack();
      }, 1000); // flip back after 1s
    }
  }

  function resetFlippedTrack() {
    firstFlippedCard = null;
    secondFlippedCard = null;
    canFlipMatch = true;
  }

  function triggerPointsLabel(targetEl, text) {
    const rect = targetEl.getBoundingClientRect();
    const tag = document.createElement('span');
    tag.classList.add('points-floating-tag');
    tag.textContent = text;
    tag.style.left = `${rect.left + rect.width / 2 - 25}px`;
    tag.style.top = `${rect.top - 15}px`;

    document.body.appendChild(tag);
    setTimeout(() => tag.remove(), 1000);
  }

  function triggerMemoryLose() {
    // Show game over alert
    alert('Time is up! ⏱️ Play again to collect coins.');
    closeOverlay('memory-match');
  }

  // Companion animation triggers
  function animateCompanionReaction(emojiId, speechId, animationClass, text) {
    const emojiEl = document.getElementById(emojiId);
    const speechEl = document.getElementById(speechId);
    if (emojiEl) {
      emojiEl.classList.remove('jump', 'facepalm', 'droop');
      void emojiEl.offsetWidth; // reflow
      emojiEl.classList.add(animationClass);
    }
    if (speechEl) speechEl.textContent = text;
  }

  function setCompanionReaction(emojiId, speechId, emoji, text) {
    const emojiEl = document.getElementById(emojiId);
    const speechEl = document.getElementById(speechId);
    if (emojiEl) {
      emojiEl.textContent = companionEmoji;
      emojiEl.classList.remove('jump', 'facepalm', 'droop');
    }
    if (speechEl) speechEl.textContent = text;
  }

  // ==========================================================================
  // GAME 2: MOOD GUESSER LOGIC
  // ==========================================================================
  let moodQuestionIndex = 0;
  let moodCorrectCount = 0;
  let activeQuestionsDeck = [];

  const defaultMockReflections = [
    { text: "I saw a beautiful shooting star tonight. It made me feel like anything is possible! 🌟", mood: "joyful", date: "May 24, 2026" },
    { text: "Spent the evening sipping hot tea and listening to the rain. Cozy vibes. ☕", mood: "neutral", date: "May 25, 2026" },
    { text: "Today was a bit overwhelming, my thoughts are running in circles. 🌀", mood: "worried", date: "May 26, 2026" },
    { text: "Felt a bit lonely today, missing my friends back home... 🥺", mood: "sad", date: "May 27, 2026" },
    { text: "Had an amazing reflection session under the oak tree. Found some peace. 🌳", mood: "happy", date: "May 28, 2026" }
  ];

  function initMoodGuesser() {
    moodQuestionIndex = 0;
    moodCorrectCount = 0;
    activeQuestionsDeck = [];

    // Sync score tracking UI
    const tracker = document.getElementById('mood-score-tracker');
    const bar = document.getElementById('mood-progress-bar');
    if (tracker) tracker.textContent = '0/5';
    if (bar) bar.style.width = '0%';

    // Build the questions deck using actual entries or fallbacks
    let entrySource = [...diaryEntries];
    // Map entries to conform to game shape
    let actualQuestions = entrySource.filter(e => e.text && e.mood).map(e => {
      return {
        text: e.text.replace(/<[^>]*>/g, '').substring(0, 140) + (e.text.length > 140 ? '...' : ''),
        mood: e.mood,
        date: e.date || 'Past reflection'
      };
    });

    // Shuffle actual entries
    actualQuestions.sort(() => Math.random() - 0.5);

    // Pad with fallbacks if less than 5
    let padIndex = 0;
    while (actualQuestions.length < 5 && padIndex < defaultMockReflections.length) {
      // Check if duplicate text exists
      if (!actualQuestions.some(q => q.text === defaultMockReflections[padIndex].text)) {
        actualQuestions.push(defaultMockReflections[padIndex]);
      }
      padIndex++;
    }

    // Keep top 5
    activeQuestionsDeck = actualQuestions.slice(0, 5);

    // Unselect buttons styling
    const optionBtns = document.querySelectorAll('.mood-option-btn');
    optionBtns.forEach(btn => btn.className = 'mood-option-btn');

    // Load first question
    loadMoodQuestion();
  }

  function loadMoodQuestion() {
    if (moodQuestionIndex >= 5) {
      // End game
      setTimeout(() => {
        showWinScreen(
          'Mood Guess Complete! 🎉',
          `Correct Guesses: ${moodCorrectCount}/5 questions`,
          15,
          () => openOverlay('mood-guesser'),
          () => closeOverlay('mood-guesser')
        );
      }, 500);
      return;
    }

    const currentQ = activeQuestionsDeck[moodQuestionIndex];
    const dateEl = document.getElementById('mood-entry-date');
    const textEl = document.getElementById('mood-entry-text');
    if (dateEl) dateEl.textContent = currentQ.date;
    if (textEl) textEl.textContent = `"${currentQ.text}"`;

    // Companion acts out mood
    const characterEmoji = document.getElementById('mood-companion-emoji');
    const characterSpeech = document.getElementById('mood-companion-speech');
    if (characterEmoji) {
      characterEmoji.className = 'companion-reaction-emoji'; // reset animation classes
      if (currentQ.mood === 'sad' || currentQ.mood === 'worried') {
        characterEmoji.classList.add('droop');
        if (characterSpeech) characterSpeech.textContent = `Sigh... how did I feel? 🥺`;
      } else {
        if (characterSpeech) characterSpeech.textContent = `How was I feeling? 🤔`;
      }
    }

    // Reset option buttons
    const optionBtns = document.querySelectorAll('.mood-option-btn');
    optionBtns.forEach(btn => {
      btn.className = 'mood-option-btn';
      btn.style.pointerEvents = 'auto';
    });

    // Progress bar updates
    const bar = document.getElementById('mood-progress-bar');
    if (bar) {
      bar.style.width = `${(moodQuestionIndex / 5) * 100}%`;
    }
  }

  // Handle Mood Guesser Button Option Clicks
  const moodOptionButtons = document.querySelectorAll('.mood-option-btn');
  moodOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedMood = btn.getAttribute('data-mood');
      const correctMood = activeQuestionsDeck[moodQuestionIndex].mood;

      // Lock buttons
      moodOptionButtons.forEach(b => b.style.pointerEvents = 'none');

      if (selectedMood === correctMood) {
        btn.classList.add('correct');
        moodCorrectCount++;
        const tracker = document.getElementById('mood-score-tracker');
        if (tracker) tracker.textContent = `${moodCorrectCount}/5`;

        animateCompanionReaction('mood-companion-emoji', 'mood-companion-speech', 'jump', `Spot on! Correct! 🎉`);
      } else {
        btn.classList.add('wrong');
        // Find correct button and flash it green slightly
        const correctBtn = document.querySelector(`.mood-option-btn[data-mood="${correctMood}"]`);
        if (correctBtn) correctBtn.classList.add('correct');

        animateCompanionReaction('mood-companion-emoji', 'mood-companion-speech', 'facepalm', `Not quite, but close! 😅`);
      }

      // Next question
      moodQuestionIndex++;
      setTimeout(loadMoodQuestion, 1800);
    });
  });

  // ==========================================================================
  // GAME 3: WORD PUZZLE LOGIC
  // ==========================================================================
  let puzzleTimerVal = 60;
  let wordsToFind = [];
  let wordsFoundCount = 0;
  let wordPuzzleSelectedCells = [];

  function initWordPuzzle() {
    const grid = document.getElementById('puzzle-grid-container');
    const wordListUl = document.getElementById('puzzle-word-list');
    if (!grid || !wordListUl) return;

    grid.innerHTML = '';
    wordListUl.innerHTML = '';

    puzzleTimerVal = 60;
    wordsFoundCount = 0;
    wordPuzzleSelectedCells = [];

    const timerBadge = document.getElementById('puzzle-timer');
    if (timerBadge) timerBadge.textContent = '⏱️ 01:00';

    // Prepare Word Database
    const defaultWords = ['DIARY', 'MEMORY', 'STORY', 'FRIEND', 'TODAY'];
    wordsToFind = [];

    // Parse words from real reflections if they exist
    let collectedReflectionsWords = [];
    diaryEntries.forEach(entry => {
      if (entry.text) {
        const text = entry.text.replace(/<[^>]*>/g, '').toUpperCase();
        // Grab alphabetical words of length 3-6
        const matches = text.match(/[A-Z]{3,6}/g);
        if (matches) collectedReflectionsWords.push(...matches);
      }
    });

    // Unique filter and exclude common stop words if desired
    collectedReflectionsWords = [...new Set(collectedReflectionsWords)].filter(w => w.length >= 4 && w.length <= 6);

    // Pick words
    for (let i = 0; i < 5; i++) {
      if (collectedReflectionsWords[i]) {
        wordsToFind.push(collectedReflectionsWords[i]);
      } else {
        wordsToFind.push(defaultWords[i % defaultWords.length]);
      }
    }

    // Populate words checklist in UI
    wordsToFind.forEach(word => {
      const li = document.createElement('li');
      li.classList.add('word-search-item');
      li.setAttribute('data-word', word);
      li.textContent = word;
      wordListUl.appendChild(li);
    });

    // 6x6 Grid constructor
    const size = 6;
    let gridMatrix = Array(size).fill(null).map(() => Array(size).fill(''));

    // Place words in grid random alignment (horizontal or vertical)
    wordsToFind.forEach(word => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        attempts++;
        const isHorizontal = Math.random() > 0.5;
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);

        if (isHorizontal) {
          if (col + word.length <= size) {
            // Check collision
            let collision = false;
            for (let i = 0; i < word.length; i++) {
              if (gridMatrix[row][col + i] !== '' && gridMatrix[row][col + i] !== word.charAt(i)) {
                collision = true;
                break;
              }
            }
            if (!collision) {
              for (let i = 0; i < word.length; i++) {
                gridMatrix[row][col + i] = word.charAt(i);
              }
              placed = true;
            }
          }
        } else {
          // Vertical
          if (row + word.length <= size) {
            let collision = false;
            for (let i = 0; i < word.length; i++) {
              if (gridMatrix[row + i][col] !== '' && gridMatrix[row + i][col] !== word.charAt(i)) {
                collision = true;
                break;
              }
            }
            if (!collision) {
              for (let i = 0; i < word.length; i++) {
                gridMatrix[row + i][col] = word.charAt(i);
              }
              placed = true;
            }
          }
        }
      }
    });

    // Fill remaining grids with random alphabets
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (gridMatrix[r][c] === '') {
          gridMatrix[r][c] = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
      }
    }

    // Build grid DOM
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = document.createElement('div');
        cell.classList.add('puzzle-cell');
        cell.setAttribute('data-row', r);
        cell.setAttribute('data-col', c);
        cell.textContent = gridMatrix[r][c];
        grid.appendChild(cell);

        // Click selection handles
        cell.addEventListener('mousedown', () => startSelection(cell));
        cell.addEventListener('touchstart', (e) => {
          e.preventDefault();
          startSelection(cell);
        });

        cell.addEventListener('mouseenter', () => handleCellDrag(cell));
      }
    }

    // Global drag end
    document.addEventListener('mouseup', endSelection);
    document.addEventListener('touchend', endSelection);

    // Initial companion label
    setCompanionReaction('puzzle-companion-emoji', 'puzzle-companion-speech', '🦉', `Help me find the hidden diary words! 🔎`);

    // Puzzle Timer count
    clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
      puzzleTimerVal--;
      if (timerBadge) {
        timerBadge.textContent = `⏱️ 00:${String(puzzleTimerVal).padStart(2, '0')}`;
      }

      if (puzzleTimerVal <= 0) {
        clearInterval(gameTimerInterval);
        triggerPuzzleLose();
      }
    }, 1000);
  }

  let isPuzzleSelecting = false;
  function startSelection(cell) {
    if (cell.classList.contains('found')) return;
    isPuzzleSelecting = true;
    wordPuzzleSelectedCells = [cell];
    cell.classList.add('selected');
  }

  function handleCellDrag(cell) {
    if (!isPuzzleSelecting) return;
    if (cell.classList.contains('found') || cell.classList.contains('selected')) return;
    
    // Allow dragging adjacent lines only (simple distance logic)
    const lastCell = wordPuzzleSelectedCells[wordPuzzleSelectedCells.length - 1];
    const r1 = parseInt(lastCell.getAttribute('data-row'), 10);
    const c1 = parseInt(lastCell.getAttribute('data-col'), 10);
    const r2 = parseInt(cell.getAttribute('data-row'), 10);
    const c2 = parseInt(cell.getAttribute('data-col'), 10);

    const diffRow = Math.abs(r1 - r2);
    const diffCol = Math.abs(c1 - c2);

    if (diffRow <= 1 && diffCol <= 1) {
      cell.classList.add('selected');
      wordPuzzleSelectedCells.push(cell);
    }
  }

  function endSelection() {
    if (!isPuzzleSelecting) return;
    isPuzzleSelecting = false;

    // Build word from selections
    let word = wordPuzzleSelectedCells.map(c => c.textContent).join('');
    let reversedWord = word.split('').reverse().join('');

    let matchWord = '';
    if (wordsToFind.includes(word)) {
      matchWord = word;
    } else if (wordsToFind.includes(reversedWord)) {
      matchWord = reversedWord;
    }

    if (matchWord !== '') {
      // Found Word
      wordPuzzleSelectedCells.forEach(c => {
        c.classList.remove('selected');
        c.classList.add('found');
      });

      // Strike word checklist item
      const listEl = document.querySelector(`.word-search-item[data-word="${matchWord}"]`);
      if (listEl && !listEl.classList.contains('crossed')) {
        listEl.classList.add('crossed');
        wordsFoundCount++;
        animateCompanionReaction('puzzle-companion-emoji', 'puzzle-companion-speech', 'jump', `Yes! Found "${matchWord}"! 🎉`);
      }

      // Check win Condition
      if (wordsFoundCount === 5) {
        clearInterval(gameTimerInterval);
        setTimeout(() => {
          showWinScreen(
            'Word Puzzle Solved! 🎉',
            `Words Found: 5/5 reflections words`,
            15,
            () => openOverlay('word-puzzle'),
            () => closeOverlay('word-puzzle')
          );
        }, 800);
      }
    } else {
      // Missed Word
      wordPuzzleSelectedCells.forEach(c => {
        c.classList.remove('selected');
      });
    }

    wordPuzzleSelectedCells = [];
  }

  function triggerPuzzleLose() {
    alert('Word search time is up! ⏱️ Replay to earn more.');
    closeOverlay('word-puzzle');
  }

  // ==========================================================================
  // GAME 4: DAILY CHALLENGE WRITING LOGIC
  // ==========================================================================
  let challengeTimerVal = 60;
  let challengeSubmitted = false;

  async function initDailyChallenge() {
    challengeTimerVal = 60;
    challengeSubmitted = false;

    const timerBadge = document.getElementById('challenge-timer');
    const writingArea = document.getElementById('challenge-writing-area');
    const counter = document.getElementById('challenge-word-counter');
    const btnSubmit = document.getElementById('btn-submit-challenge');

    // Fetch dynamic daily challenge prompt from backend
    try {
      const data = await API.getChallenge();
      const promptTitle = document.querySelector('.challenge-prompt-title');
      if (promptTitle && data.challenge) {
        promptTitle.textContent = data.challenge;
      }
    } catch (err) {
      console.warn('API error fetching daily challenge prompt:', err);
    }

    if (timerBadge) {
      timerBadge.textContent = '⏱️ 00:60';
      timerBadge.className = 'gold-timer';
    }
    if (writingArea) {
      writingArea.textContent = '';
      writingArea.setAttribute('placeholder', 'Start writing here...');
    }
    if (counter) counter.textContent = '0 words';
    if (btnSubmit) btnSubmit.classList.add('disabled');

    setCompanionReaction('challenge-companion-emoji', 'challenge-companion-speech', '🦉', `Write quickly, you have 60 seconds! 💪`);

    // Input tracker
    if (writingArea && counter && btnSubmit) {
      writingArea.oninput = () => {
        const text = writingArea.textContent.trim();
        const words = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
        counter.textContent = `${words} word${words !== 1 ? 's' : ''}`;

        // Activates after 10 words
        if (words >= 10) {
          btnSubmit.classList.remove('disabled');
        } else {
          btnSubmit.classList.add('disabled');
        }
      };
    }

    // Submit handler trigger
    if (btnSubmit) {
      btnSubmit.onclick = () => {
        submitDailyChallenge();
      };
    }

    // Challenge Timer
    clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
      challengeTimerVal--;
      if (timerBadge) {
        timerBadge.textContent = `⏱️ 00:${String(challengeTimerVal).padStart(2, '0')}`;
        
        // Turns red under 10 seconds
        if (challengeTimerVal <= 10) {
          timerBadge.className = 'challenge-timer-red';
        }
      }

      if (challengeTimerVal <= 0) {
        clearInterval(gameTimerInterval);
        submitDailyChallenge();
      }
    }, 1000);
  }

  async function submitDailyChallenge() {
    if (challengeSubmitted) return;
    challengeSubmitted = true;
    clearInterval(gameTimerInterval);

    const writingArea = document.getElementById('challenge-writing-area');
    const text = writingArea ? writingArea.textContent.trim() : '';
    const wordCount = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;

    if (wordCount >= 10) {
      // Save entry check option
      const saveOption = confirm('Challenge complete! 🎉 Do you want to save this daily challenge entry to your diary logs?');
      if (saveOption) {
        await saveChallengeToDiary(text);
      }

      showWinScreen(
        'Challenge Complete! 🎯',
        `Reflected words count: ${wordCount} words`,
        50, // earns 50 coins!
        () => openOverlay('daily-challenge'),
        () => closeOverlay('daily-challenge')
      );
    } else {
      alert(`Oops, you only wrote ${wordCount} words. Try writing at least 10 words next time to complete the challenge! 💪`);
      closeOverlay('daily-challenge');
    }
  }

  async function saveChallengeToDiary(text) {
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    try {
      await API.createEntry({
        content: `<p>${text}</p>`,
        mood: 'joyful',
        pageStyle: 'ruled',
        font: 'dancing',
        wordCount: wordCount,
        photos: [],
        decorations: []
      });
    } catch (err) {
      console.warn('API error saving challenge to diary, saving locally:', err);
      const newEntry = {
        id: 'entry_' + Date.now(),
        date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        text: `<p>${text}</p>`,
        mood: 'joyful',
        style: 'ruled',
        attachments: []
      };
      diaryEntries.unshift(newEntry);
      localStorage.setItem('diary_entries', JSON.stringify(diaryEntries));
    }
  }

  // ==========================================================================
  // GAME 5: STORY BUILDER LOGIC
  // ==========================================================================
  const mockStoryStarters = [
    "It was a quiet evening when suddenly a strange tapping sound came from inside the grandfather clock...",
    "Under a blanket of golden stars, my companion pointed to a glowing silhouette hidden in the trees...",
    "While cleaning the dusty attic, I stumbled upon a handwritten journal entry dated exactly 100 years ago...",
    "My companion Ollie woke me up early today with a mysterious key in their hand and a wink...",
    "Just as I dipped my pen into the inkpot, the paper began to glow with a soft magical pulse..."
  ];

  function initStoryBuilder() {
    const starterText = document.getElementById('story-starter-text');
    const writingArea = document.getElementById('story-writing-area');
    const counter = document.getElementById('story-word-counter');
    const btnSave = document.getElementById('btn-save-story');

    if (starterText) {
      // Choose random starter
      const rIndex = Math.floor(Math.random() * mockStoryStarters.length);
      starterText.textContent = `"${mockStoryStarters[rIndex]}"`;
    }

    if (writingArea) {
      writingArea.textContent = '';
      writingArea.setAttribute('placeholder', 'Dear Diary, continue the story here...');
    }
    if (counter) counter.textContent = '0 / 50 words';
    if (btnSave) btnSave.classList.add('disabled');

    setCompanionReaction('story-companion-emoji', 'story-companion-speech', '🦉', `Help me finish the tail! Let's write. 📝`);

    if (writingArea && counter && btnSave) {
      writingArea.oninput = () => {
        const text = writingArea.textContent.trim();
        const words = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
        
        counter.textContent = `${words} / 50 words`;

        // Activates after 50 words
        if (words >= 50) {
          btnSave.classList.remove('disabled');
          setCompanionReaction('story-companion-emoji', 'story-companion-speech', 'jump', `This story is getting amazing! Keep going! 🌟`);
        } else {
          btnSave.classList.add('disabled');
        }
      };
    }

    if (btnSave) {
      btnSave.onclick = () => {
        const text = writingArea ? writingArea.textContent.trim() : '';
        const starter = starterText ? starterText.textContent : '';
        
        saveStoryToDiary(starter + "\n\n" + text);

        showWinScreen(
          'Story Saved! 🌟',
          `Story complete! 📖 Saved to diary entries log.`,
          20, // +20 coins earned
          () => openOverlay('story-builder'),
          () => closeOverlay('story-builder')
        );
      };
    }
  }

  function saveStoryToDiary(fullStory) {
    const newEntry = {
      id: 'entry_' + Date.now(),
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      text: `<p>${fullStory.replace(/\n/g, '<br>')}</p>`,
      mood: 'joyful',
      style: 'ruled',
      attachments: []
    };

    diaryEntries.unshift(newEntry);
    localStorage.setItem('diary_entries', JSON.stringify(diaryEntries));
  }

  // ==========================================================================
  // 6. LEADERBOARD SCREEN CONTROLLERS
  // ==========================================================================
  function initLeaderboardData() {
    // Inject dynamic streak counts
    let streakCount = parseInt(localStorage.getItem('writingStreak'), 10) || 1;
    let entriesCount = diaryEntries.length;

    const streakEl = document.getElementById('leaderboard-user-streak');
    const summaryStreakEl = document.getElementById('summary-user-streak');
    if (streakEl) streakEl.textContent = `${streakCount} day${streakCount !== 1 ? 's' : ''}`;
    if (summaryStreakEl) summaryStreakEl.textContent = `${streakCount}d`;

    // Inject entries count
    const entriesEl = document.getElementById('leaderboard-user-entries');
    const summaryEntriesEl = document.getElementById('summary-user-entries');
    if (entriesEl) entriesEl.textContent = `${entriesCount} reflection${entriesCount !== 1 ? 's' : ''}`;
    if (summaryEntriesEl) summaryEntriesEl.textContent = String(entriesCount);

    // Inject coins count
    const coinsEl = document.getElementById('leaderboard-user-coins');
    const summaryCoinsEl = document.getElementById('summary-user-coins');
    if (coinsEl) coinsEl.textContent = `${coins} 🪙`;
    if (summaryCoinsEl) summaryCoinsEl.textContent = String(coins);
  }

  // ==========================================================================
  // 7. REWARDS SCREEN CONTROLLERS
  // ==========================================================================
  function initRewardsData() {
    const balanceVal = document.getElementById('rewards-coin-balance');
    if (balanceVal) balanceVal.textContent = `🪙 ${coins}`;

    const btnBonus = document.getElementById('btn-claim-daily-bonus');
    const dailyBonusCard = btnBonus ? btnBonus.parentElement : null;
    
    // Check if claimed today
    const lastClaimed = localStorage.getItem('last_claimed_rewards_date');
    const today = new Date().toDateString();

    if (btnBonus) {
      if (lastClaimed === today) {
        btnBonus.textContent = 'Claimed';
        btnBonus.disabled = true;
        if (dailyBonusCard) dailyBonusCard.classList.add('claimed');
      } else {
        btnBonus.textContent = '+10 🪙';
        btnBonus.disabled = false;
        if (dailyBonusCard) dailyBonusCard.classList.remove('claimed');

        btnBonus.onclick = () => {
          localStorage.setItem('last_claimed_rewards_date', today);
          btnBonus.textContent = 'Claimed';
          btnBonus.disabled = true;
          if (dailyBonusCard) dailyBonusCard.classList.add('claimed');
          
          // Reward coins
          addCoins(10);
          
          // Confetti explosion
          triggerConfetti('win-confetti-canvas');
        };
      }
    }
  }

});
