/**
 * Dear Diary - Home Dashboard Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------
  // PULL FROM localStorage
  // ---------------------------------------------------------
  const userName = localStorage.getItem('user_name') || 'Friend';
  const diaryName = localStorage.getItem('diary_name') || 'My Diary';
  const companionName = localStorage.getItem('companion_name') || 'Ollie';
  const companionEmoji = localStorage.getItem('companion_emoji') || '🦉';
  
  // Streaks (default to 1 if not set)
  let writingStreak = parseInt(localStorage.getItem('writingStreak'), 10);
  if (isNaN(writingStreak)) {
    writingStreak = 1;
    localStorage.setItem('writingStreak', '1');
  }
  
  let snapStreak = parseInt(localStorage.getItem('snapStreak'), 10);
  if (isNaN(snapStreak)) {
    snapStreak = 1;
    localStorage.setItem('snapStreak', '1');
  }

  // ---------------------------------------------------------
  // INITIALIZE DYNAMIC LABELS
  // ---------------------------------------------------------
  // Inject companion emojis & labels
  const emojiDisplay = document.getElementById('companion-emoji');
  if (emojiDisplay) emojiDisplay.textContent = companionEmoji;

  const floatEmojiDisplay = document.getElementById('floating-companion-emoji');
  if (floatEmojiDisplay) floatEmojiDisplay.textContent = companionEmoji;

  const saysLabel = document.getElementById('companion-says-label');
  if (saysLabel) saysLabel.textContent = `${companionName} says:`;

  // Auto set current date on Anne Frank card
  const dateEl = document.getElementById('anne-frank-date');
  if (dateEl) {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('en-US', options);
  }

  // ---------------------------------------------------------
  // DYNAMIC HEADER GREETINGS & MESSAGES
  // ---------------------------------------------------------
  const timeGreeting = document.getElementById('time-greeting');
  const companionSpeech = document.getElementById('companion-speech');
  const hour = new Date().getHours();
  
  let greetingText = "";
  let companionText = "";

  // Greetings logic based on hours:
  // 5am-12pm: "Good Morning ☀️"
  // 12pm-5pm: "Good Afternoon 🌤️"
  // 5pm-9pm: "Good Evening 🌙"
  // 9pm-5am: "Good Night ⭐"
  if (hour >= 5 && hour < 12) {
    greetingText = `Good Morning, ${userName} ☀️`;
    companionText = `Good morning ${userName}! Ready to make a memory? 🌟`;
  } else if (hour >= 12 && hour < 17) {
    greetingText = `Good Afternoon, ${userName} 🌤️`;
    companionText = `How is your day going ${userName}? 🌤️`;
  } else if (hour >= 17 && hour < 21) {
    greetingText = `Good Evening, ${userName} 🌙`;
    companionText = `Tell me about your day ${userName} 🌙`;
  } else {
    greetingText = `Good Night, ${userName} ⭐`;
    companionText = `I am here to listen ${userName}. How are you? ⭐`;
  }

  if (timeGreeting) timeGreeting.textContent = greetingText;
  if (companionSpeech) companionSpeech.textContent = companionText;

  // ---------------------------------------------------------
  // STREAK COUNTERS & PROGRESS RINGS
  // ---------------------------------------------------------
  // Milestones: 7, 14, 30, 100 days
  const milestones = [7, 14, 30, 100];
  let nextMilestone = 7;
  for (let m of milestones) {
    if (writingStreak < m) {
      nextMilestone = m;
      break;
    }
    nextMilestone = 100;
  }

  let percent = 0;
  if (writingStreak >= 100) {
    percent = 100;
  } else {
    percent = Math.round((writingStreak / nextMilestone) * 100);
  }

  // Animate progress circle stroke
  const circle = document.getElementById('progress-ring-circle');
  const label = document.getElementById('progress-percent-label');
  if (circle) {
    const circumference = 2 * Math.PI * 21; // ~131.95
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference; // start empty
    
    // Smooth animate fill
    setTimeout(() => {
      const offset = circumference - (percent / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }, 400);
  }
  
  if (label) {
    label.textContent = `${percent}%`;
  }

  // ---------------------------------------------------------
  // ENTRANCE ANIMATIONS
  // ---------------------------------------------------------
  // Fade in overlay removal
  setTimeout(() => {
    const fadeOverlay = document.getElementById('fade-overlay');
    if (fadeOverlay) {
      fadeOverlay.classList.add('fade-out');
      setTimeout(() => fadeOverlay.remove(), 800);
    }
  }, 50);

  // Cards staggered slide up triggers
  setTimeout(() => {
    const wrapper = document.querySelector('.home-wrapper');
    if (wrapper) wrapper.classList.add('animated');
  }, 100);

  // Companion floats in from right
  setTimeout(() => {
    const fc = document.getElementById('floating-companion');
    if (fc) fc.classList.add('loaded');
  }, 300);

  // Animate number count-up transitions
  function animateCountUp(elementId, targetValue, suffix) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let start = 0;
    const duration = 1200; // 1.2s duration
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: easeOutQuad
      const easedProgress = progress * (2 - progress);
      const currentValue = Math.floor(easedProgress * targetValue);
      
      element.textContent = `${currentValue} ${suffix}`;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = `${targetValue} ${suffix}`;
      }
    }
    requestAnimationFrame(update);
  }

  // Start count-ups after layout animations begin
  setTimeout(() => {
    animateCountUp('streak-title', writingStreak, writingStreak === 1 ? 'Day Streak' : 'Day Streaks');
    animateCountUp('snap-streak-title', snapStreak, snapStreak === 1 ? 'Snap Streak' : 'Snap Streaks');
  }, 250);

  // ---------------------------------------------------------
  // NOTIFICATIONS PANEL TOGGLE
  // ---------------------------------------------------------
  const btnBell = document.getElementById('btn-bell');
  const notificationsPanel = document.getElementById('notifications-panel');
  
  if (btnBell && notificationsPanel) {
    btnBell.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationsPanel.classList.toggle('active');
    });

    // Close notifications panel on click outside
    document.addEventListener('click', (e) => {
      if (!notificationsPanel.contains(e.target) && e.target !== btnBell) {
        notificationsPanel.classList.remove('active');
      }
    });
  }

  // ---------------------------------------------------------
  // ANNE FRANK CARD EXPAND MODAL
  // ---------------------------------------------------------
  const anneFrankCard = document.getElementById('anne-frank-card');
  const quoteModal = document.getElementById('quote-expand-overlay');
  const btnCloseQuote = document.getElementById('btn-close-quote');

  if (anneFrankCard && quoteModal) {
    anneFrankCard.addEventListener('click', () => {
      quoteModal.classList.add('active');
    });
  }

  if (btnCloseQuote && quoteModal) {
    btnCloseQuote.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent card re-trigger
      quoteModal.classList.remove('active');
    });

    quoteModal.addEventListener('click', (e) => {
      if (e.target === quoteModal) {
        quoteModal.classList.remove('active');
      }
    });
  }

  // ---------------------------------------------------------
  // DAILY PROMPT CARD NAVIGATION
  // ---------------------------------------------------------
  const promptCard = document.getElementById('prompt-card');
  if (promptCard) {
    promptCard.addEventListener('click', () => {
      window.location.href = 'diary.html';
    });
  }

  // ---------------------------------------------------------
  // MOOD SELECTOR HIGHLIGHTS & SAVING
  // ---------------------------------------------------------
  const moodButtons = document.querySelectorAll('.mood-emoji-btn');
  
  // Pre-select mood if saved
  const savedMood = localStorage.getItem('selected_mood');
  if (savedMood) {
    const activeBtn = document.querySelector(`.mood-emoji-btn[data-mood="${savedMood}"]`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  moodButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      moodButtons.forEach(b => b.classList.remove('active'));
      
      btn.classList.add('active');
      const moodValue = btn.getAttribute('data-mood');
      localStorage.setItem('selected_mood', moodValue);
    });
  });

  // ---------------------------------------------------------
  // DRAGGABLE FLOATING COMPANION (POINTER EVENTS)
  // ---------------------------------------------------------
  const fc = document.getElementById('floating-companion');
  let isDragging = false;
  let startX = 0, startY = 0;
  let downX = 0, downY = 0;
  let dragDistance = 0;
  let speechTimeout = null;

  function triggerSpeechBubble() {
    const bubble = document.getElementById('floating-speech-bubble');
    if (!bubble) return;

    bubble.textContent = `Hi ${userName}! 📖`;
    bubble.classList.add('show');

    if (speechTimeout) clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => {
      bubble.classList.remove('show');
    }, 2000);
  }

  if (fc) {
    fc.addEventListener('pointerdown', (e) => {
      isDragging = true;
      fc.setPointerCapture(e.pointerId);
      
      const rect = fc.getBoundingClientRect();
      // Store offsets relative to element's bounding box
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      
      // Store raw mouse position for click distance verification
      downX = e.clientX;
      downY = e.clientY;
      dragDistance = 0;

      // Pause floating CSS animation during drags
      const floatEmoji = document.getElementById('floating-companion-emoji');
      if (floatEmoji) floatEmoji.style.animationPlayState = 'paused';
    });

    fc.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      dragDistance = Math.sqrt(dx * dx + dy * dy);

      // Desired position
      let x = e.clientX - startX;
      let y = e.clientY - startY;

      // Screen boundaries constraint
      const maxX = window.innerWidth - fc.offsetWidth;
      const maxY = window.innerHeight - fc.offsetHeight;
      
      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));

      // Overwrite style variables to place it absolutely where pointer sits
      fc.style.right = 'auto';
      fc.style.bottom = 'auto';
      fc.style.left = `${x}px`;
      fc.style.top = `${y}px`;
    });

    fc.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      fc.releasePointerCapture(e.pointerId);

      // Resume floating animation
      const floatEmoji = document.getElementById('floating-companion-emoji');
      if (floatEmoji) floatEmoji.style.animationPlayState = 'running';

      // Distinguish drag from click (tap checks)
      if (dragDistance < 5) {
        triggerSpeechBubble();
      }
    });

    fc.addEventListener('pointercancel', (e) => {
      if (!isDragging) return;
      isDragging = false;
      fc.releasePointerCapture(e.pointerId);
      
      const floatEmoji = document.getElementById('floating-companion-emoji');
      if (floatEmoji) floatEmoji.style.animationPlayState = 'running';
    });
  }
});
