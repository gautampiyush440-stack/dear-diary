/**
 * Dear Diary - Onboarding Controller (3D Page Flip Mechanics)
 */
// Protect page via Firebase Auth state
(function() {
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
})();

document.addEventListener('DOMContentLoaded', () => {
  // Navigation State
  let currentStep = 1;
  const maxSteps = 4;

  // Selected State
  let selectedCompanion = {
    name: 'Ollie',
    emoji: '🦉'
  };

  // DOM Elements
  const overlay = document.getElementById('transition-overlay');
  
  // Inputs
  const userNameInput = document.getElementById('user-name-input');
  const diaryNameInput = document.getElementById('diary-name-input');
  const firstEntryInput = document.getElementById('first-entry-input');
  const wordCounter = document.getElementById('word-counter');

  // Dynamic Texts
  const greetingNameText = document.getElementById('greeting-name-s2');
  const diaryReadyTitleText = document.getElementById('diary-ready-title');
  const companionBouncingEmoji = document.getElementById('companion-bouncing-emoji');
  const companionListeningText = document.getElementById('companion-listening-text');
  const companionFeedbackText = document.getElementById('companion-feedback-text');
  const quillIndicator = document.getElementById('quill-indicator');

  // Next Buttons
  const btnNext1 = document.getElementById('btn-next-1');
  const btnNext2 = document.getElementById('btn-next-2');
  const btnNext3 = document.getElementById('btn-next-3');
  const btnFinish = document.getElementById('btn-finish');

  // Back Buttons
  const btnBack2 = document.getElementById('btn-back-2');
  const btnBack3 = document.getElementById('btn-back-3');
  const btnBack4 = document.getElementById('btn-back-4');

  // Skip Buttons
  const btnSkip1 = document.getElementById('btn-skip-1');
  const btnSkip2 = document.getElementById('btn-skip-2');
  const btnSkip3 = document.getElementById('btn-skip-3');

  // Suggestion Chips (Screen 2)
  const chips = document.querySelectorAll('.suggestion-chip');

  // Character Cards (Screen 3)
  const charCards = document.querySelectorAll('.char-card-s3');

  // ==========================================================================
  // Navigation & Page Flip Controller
  // ==========================================================================

  /**
   * Refreshes page visibility and transform states based on currentStep
   */
  function updateStepView() {
    for (let i = 1; i <= maxSteps; i++) {
      const page = document.getElementById(`page-${i}`);
      const dot = document.querySelector(`.progress-dot[data-step="${i}"]`);

      if (i < currentStep) {
        // Flipped state (turned left)
        page.classList.add('flipped');
        page.classList.remove('active');
        if (dot) {
          dot.classList.add('completed');
          dot.classList.remove('active');
        }
      } else if (i === currentStep) {
        // Active state (facing viewer)
        page.classList.remove('flipped');
        page.classList.add('active');
        if (dot) {
          dot.classList.add('active');
          dot.classList.remove('completed');
        }

        // Trigger typewriter for Screen 2 question
        if (i === 2) {
          const typewriterQ2 = document.getElementById('typewriter-q2');
          if (typewriterQ2 && typewriterQ2.textContent === '') {
            setTimeout(() => {
              typeText(typewriterQ2, "What shall we call your diary?", 70);
            }, 850); // wait for page turn to finish
          }
        }
      } else {
        // Behind state (stacked below)
        page.classList.remove('flipped');
        page.classList.remove('active');
        if (dot) {
          dot.classList.remove('active');
          dot.classList.remove('completed');
        }
      }
    }
    
    // Toggle all-filled state on dots container at Step 4
    const dotsContainer = document.querySelector('.progress-dots-container');
    if (dotsContainer) {
      if (currentStep === 4) {
        dotsContainer.classList.add('all-filled');
      } else {
        dotsContainer.classList.remove('all-filled');
      }
    }

    // Reset bouncing-emoji entry animation on Screen 4 load
    if (currentStep === 4 && companionBouncingEmoji) {
      companionBouncingEmoji.style.animation = 'none';
      void companionBouncingEmoji.offsetHeight; // trigger reflow
      companionBouncingEmoji.style.animation = 'bounce-on-load 1.2s ease-out';
    }
  }

  function goToNextStep() {
    if (currentStep < maxSteps) {
      // Execute intermediate actions (data saves/screen prep)
      if (currentStep === 1) {
        saveNameData();
      } else if (currentStep === 2) {
        saveDiaryNameData();
      } else if (currentStep === 3) {
        saveCompanionData();
      }
      
      currentStep++;
      updateStepView();
    }
  }

  function goToPrevStep() {
    if (currentStep > 1) {
      currentStep--;
      updateStepView();
    }
  }

  // ==========================================================================
  // Screen 1 Custom Event Listeners & Effects
  // ==========================================================================

  // 1. Helper function for handwriting typewriter text effect
  function typeText(element, text, speed = 60) {
    element.textContent = '';
    let index = 0;
    function type() {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      }
    }
    type();
  }

  // Trigger typewriter for Screen 1 question after page transition is complete
  const typewriterQ1 = document.getElementById('typewriter-q1');
  if (typewriterQ1) {
    setTimeout(() => {
      typeText(typewriterQ1, "What shall I call you?", 70);
    }, 800); // Wait for page slide-up to finish
  }

  // 2. Generate random gold sparkles on keyboard inputs
  function triggerSparkles() {
    const wrapper = document.querySelector('.underline-input-wrapper-s1');
    if (!wrapper || !userNameInput) return;
    
    // Prevent DOM spam
    if (wrapper.querySelectorAll('.sparkle').length > 20) return;

    for (let i = 0; i < 4; i++) {
      const sparkle = document.createElement('div');
      sparkle.classList.add('sparkle');
      
      const inputWidth = userNameInput.offsetWidth || 200;
      const x = (Math.random() - 0.5) * (inputWidth * 0.7); // spread around cursor/underline
      sparkle.style.left = `calc(50% + ${x}px)`;
      sparkle.style.top = `40px`; // align near underline
      
      const dx = (Math.random() - 0.5) * 70;
      const dy = (Math.random() - 0.5) * 60 - 20; // fly upwards
      
      sparkle.style.setProperty('--dx', `${dx}px`);
      sparkle.style.setProperty('--dy', `${dy}px`);
      
      wrapper.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 800);
    }
  }

  // 3. User Name inputs checks
  if (userNameInput) {
    userNameInput.addEventListener('input', () => {
      const val = userNameInput.value.trim();
      if (val.length > 0) {
        if (btnNext1) btnNext1.classList.remove('disabled');
        triggerSparkles();
      } else {
        if (btnNext1) btnNext1.classList.add('disabled');
      }
    });
  }

  // Bind Standard Navigation Buttons
  if (btnNext1) {
    btnNext1.addEventListener('click', () => {
      // Prevent navigation if disabled
      if (btnNext1.classList.contains('disabled')) return;
      goToNextStep();
    });
  }
  if (btnNext2) {
    btnNext2.addEventListener('click', () => {
      if (btnNext2.classList.contains('disabled')) return;
      goToNextStep();
    });
  }
  if (btnNext3) {
    btnNext3.addEventListener('click', () => {
      if (btnNext3.classList.contains('disabled')) return;
      goToNextStep();
    });
  }
  
  if (btnBack2) btnBack2.addEventListener('click', goToPrevStep);
  if (btnBack3) btnBack3.addEventListener('click', goToPrevStep);
  if (btnBack4) btnBack4.addEventListener('click', goToPrevStep);

  // Bind Skip Link (Screen 1)
  if (btnSkip1) {
    btnSkip1.addEventListener('click', (e) => {
      e.preventDefault();
      userNameInput.value = 'Friend';
      // Temporarily enable button to pass step validation
      if (btnNext1) btnNext1.classList.remove('disabled');
      goToNextStep();
    });
  }

  // Bind Skip Link (Screen 2)
  if (btnSkip2) {
    btnSkip2.addEventListener('click', (e) => {
      e.preventDefault();
      diaryNameInput.value = 'Echo';
      if (btnNext2) btnNext2.classList.remove('disabled');
      goToNextStep();
    });
  }

  // Bind Skip Link (Screen 3)
  if (btnSkip3) {
    btnSkip3.addEventListener('click', (e) => {
      e.preventDefault();
      selectedCompanion.name = 'Ollie';
      selectedCompanion.emoji = '🦉';
      if (btnNext3) btnNext3.classList.remove('disabled');
      goToNextStep();
    });
  }

  // ==========================================================================
  // Screen Intermediate Data Actions
  // ==========================================================================

  // SCREEN 1 -> SCREEN 2 Transition: Save User Name
  function saveNameData() {
    let name = userNameInput.value.trim();
    if (!name) name = 'Friend';
    localStorage.setItem('user_name', name);
    
    // Inject name into Screen 2 greeting header
    if (greetingNameText) {
      greetingNameText.textContent = `Nice to meet you, ${name}! 🌟`;
    }
  }

  // SCREEN 2 -> SCREEN 3 Transition: Save Diary Name
  function saveDiaryNameData() {
    let diaryName = diaryNameInput.value.trim();
    if (!diaryName) diaryName = 'My Diary';
    localStorage.setItem('diary_name', diaryName);

    // Inject diary name into Screen 3 heading
    if (diaryReadyTitleText) {
      diaryReadyTitleText.textContent = `${diaryName} is ready!`;
    }
  }

  // SCREEN 3 -> SCREEN 4 Transition: Save Companion Info
  function saveCompanionData() {
    localStorage.setItem('companion_name', selectedCompanion.name);
    localStorage.setItem('companion_emoji', selectedCompanion.emoji);

    // Inject companion details into Screen 4 bouncing header
    if (companionBouncingEmoji) {
      companionBouncingEmoji.textContent = selectedCompanion.emoji;
    }
    if (companionListeningText) {
      companionListeningText.textContent = `${selectedCompanion.name} is listening 🥺`;
    }
  }

  // ==========================================================================
  // Screen 2 Custom Observers & Suggestion Chips
  // ==========================================================================
  
  function checkDiaryNameInput() {
    if (!diaryNameInput) return;
    const val = diaryNameInput.value.trim();
    if (val.length > 0) {
      if (btnNext2) btnNext2.classList.remove('disabled');
      if (quillIndicator) quillIndicator.classList.add('active');
    } else {
      if (btnNext2) btnNext2.classList.add('disabled');
      if (quillIndicator) quillIndicator.classList.remove('active');
    }
  }

  if (diaryNameInput) {
    diaryNameInput.addEventListener('input', checkDiaryNameInput);
    diaryNameInput.addEventListener('focus', () => {
      if (diaryNameInput.value.trim().length > 0 && quillIndicator) {
        quillIndicator.classList.add('active');
      }
    });
    diaryNameInput.addEventListener('blur', () => {
      if (quillIndicator) {
        quillIndicator.classList.remove('active');
      }
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (diaryNameInput) {
        diaryNameInput.value = chip.textContent;
        diaryNameInput.focus();
        checkDiaryNameInput();
      }
    });
  });

  // ==========================================================================
  // Screen 3 companion cards grid triggers
  // ==========================================================================
  charCards.forEach(card => {
    card.addEventListener('click', () => {
      // Clear selection on other cards
      charCards.forEach(c => c.classList.remove('selected'));
      
      // Select clicked card
      card.classList.add('selected');

      // Update state data variables
      selectedCompanion.name = card.getAttribute('data-name') || 'Ollie';
      selectedCompanion.emoji = card.getAttribute('data-emoji') || '🦉';

      // Save character name and emoji to localStorage immediately
      localStorage.setItem('companion_name', selectedCompanion.name);
      localStorage.setItem('companion_emoji', selectedCompanion.emoji);

      // Show confirmation text: "[character] will be your companion! 🥺"
      if (companionFeedbackText) {
        companionFeedbackText.textContent = `${selectedCompanion.name} will be your companion! 🥺`;
        companionFeedbackText.classList.add('visible');
      }

      // Enable Next button
      if (btnNext3) {
        btnNext3.classList.remove('disabled');
      }
    });
  });

  // ==========================================================================
  // Screen 4 Word counting, typing reactions & Final submit
  // ==========================================================================
  let typingBounceInterval = null;
  let lastTypingTime = 0;

  function triggerTypingBounce() {
    if (!companionBouncingEmoji) return;
    
    companionBouncingEmoji.classList.remove('typing-bounce');
    void companionBouncingEmoji.offsetWidth; // trigger reflow
    companionBouncingEmoji.classList.add('typing-bounce');
    
    setTimeout(() => {
      companionBouncingEmoji.classList.remove('typing-bounce');
    }, 800);
  }

  if (firstEntryInput && wordCounter) {
    firstEntryInput.addEventListener('input', () => {
      const text = firstEntryInput.value.trim();
      const words = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
      
      // Update word counter live as: "X / 50 words"
      wordCounter.textContent = `${words} / 50 words`;

      // Sparkle ✨ appears next to character at 10 words
      const sparkleEl = document.getElementById('emoji-sparkle');
      if (sparkleEl) {
        if (words >= 10) {
          sparkleEl.style.display = 'inline';
        } else {
          sparkleEl.style.display = 'none';
        }
      }

      // Record typing timestamp
      lastTypingTime = Date.now();

      // Start the 3-second interval check if not already running
      if (!typingBounceInterval && words > 0) {
        triggerTypingBounce(); // bounce immediately
        
        typingBounceInterval = setInterval(() => {
          const now = Date.now();
          if (now - lastTypingTime < 3000) {
            triggerTypingBounce();
          } else {
            clearInterval(typingBounceInterval);
            typingBounceInterval = null;
          }
        }, 3000);
      }
    });
  }

  // Hide password field if already authenticated (Firebase login flow)
  const passwordWrapper = document.querySelector('.password-signup-wrapper');
  if (passwordWrapper && typeof API !== 'undefined' && API.isAuthenticated()) {
    passwordWrapper.style.display = 'none';
  }

  if (btnFinish) {
    btnFinish.addEventListener('click', async () => {
      const isAuth = typeof API !== 'undefined' && API.isAuthenticated();
      const passwordInput = document.getElementById('user-password-input');
      const password = passwordInput ? passwordInput.value.trim() : '';
      
      if (!isAuth && !password) {
        alert('Please choose a password to secure your diary! 🔑');
        if (passwordInput) passwordInput.focus();
        return;
      }

      const username = userNameInput ? userNameInput.value.trim() : 'Friend';
      const diaryName = diaryNameInput ? diaryNameInput.value.trim() : 'My Diary';
      const compName = selectedCompanion.name || 'Ollie';
      const compEmoji = selectedCompanion.emoji || '🦉';
      const entryText = firstEntryInput ? firstEntryInput.value.trim() : '';

      try {
        btnFinish.disabled = true;
        btnFinish.textContent = 'Registering...';

        // 1. Authenticate / Signup with Backend
        if (isAuth) {
          // Update profile in Firebase
          const fbUser = window.firebase ? window.firebase.auth().currentUser : null;
          if (fbUser) {
            try {
              await fbUser.updateProfile({ displayName: username });
            } catch (fbErr) {
              console.error("Failed to update Firebase display name:", fbErr);
            }
          }
          // Update SQLite backend
          await API.updateProfile(username, diaryName);
          await API.updateCompanion(compName, compEmoji);
        } else {
          await API.signup(username, password, diaryName, compName, compEmoji);
        }

        // 2. Post first entry if any exists
        if (entryText) {
          const words = entryText.split(/\s+/).filter(w => w.length > 0).length;
          await API.createEntry({
            content: entryText,
            mood: '😄',
            pageStyle: 'classic',
            font: 'dancing',
            wordCount: words,
            photos: [],
            decorations: []
          });
        }

        // Sync local storage keys
        localStorage.setItem('user_name', username);
        localStorage.setItem('diary_name', diaryName);
        localStorage.setItem('companion_name', compName);
        localStorage.setItem('companion_emoji', compEmoji);
        localStorage.setItem('first_entry', entryText);

        // 3. Save User Profile and Streaks to Firestore
        const user = window.firebase ? window.firebase.auth().currentUser : null;
        if (user) {
          try {
            await window.firebase.firestore().collection("users").doc(user.uid).set({
              name: username,
              diaryName: diaryName,
              character: compName,
              characterEmoji: compEmoji,
              coins: 0,
              theme: "premium-golden",
              createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
              writingStreak: 1,
              snapStreak: 1
            });

            await window.firebase.firestore().collection("streaks").doc(user.uid).set({
              writingStreak: 1,
              lastWritten: window.firebase.firestore.FieldValue.serverTimestamp(),
              snapStreak: 1,
              lastSnap: window.firebase.firestore.FieldValue.serverTimestamp()
            });

            if (entryText) {
              const words = entryText.split(/\s+/).filter(w => w.length > 0).length;
              await window.firebase.firestore().collection("entries").add({
                userId: user.uid,
                content: entryText,
                mood: '😄',
                pageStyle: 'classic',
                font: 'dancing',
                date: window.firebase.firestore.FieldValue.serverTimestamp(),
                wordCount: words
              });
            }
          } catch (fsErr) {
            console.error("Failed to save profile/entry to Firestore:", fsErr);
          }
        }

        // Disable status
        btnFinish.disabled = false;
        btnFinish.textContent = 'Begin My Journey ✨';

        // 3. Trigger Full-screen Gold Flash (0.3s)
        const flashOverlay = document.getElementById('gold-flash-overlay');
        if (flashOverlay) {
          flashOverlay.classList.remove('flash');
          void flashOverlay.offsetWidth; // trigger reflow
          flashOverlay.classList.add('flash');
        }

        // 4. Show Dark Overlay Message
        const bornOverlay = document.getElementById('diary-born-overlay');
        const bornMessage = document.getElementById('diary-born-message');
        if (bornOverlay && bornMessage) {
          bornMessage.textContent = `${username}, your diary ${diaryName} is born 🥺`;
          bornOverlay.classList.add('active');
        }

        // 5. Wait 1.5s, then fade to black (transition overlay)
        setTimeout(() => {
          if (overlay) {
            overlay.classList.add('active');
          }

          // 6. Redirect after fade completes
          setTimeout(() => {
            window.location.href = 'home.html';
          }, 800);
        }, 1500);

      } catch (err) {
        alert(`Registration failed: ${err.message || err}`);
        btnFinish.disabled = false;
        btnFinish.textContent = 'Begin My Journey ✨';
      }
    });
  }

  // Pre-initialize steps visibility
  updateStepView();
});
