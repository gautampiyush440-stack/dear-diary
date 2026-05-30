/**
 * Dear Diary - Memories Snap Workspace Controller
 */
// Protect page via Firebase Auth state
(function() {
  const checkFirebase = setInterval(() => {
    if (typeof window.firebase !== 'undefined') {
      clearInterval(checkFirebase);
      window.firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
          if (window.location.protocol === 'file:') {
            window.location.href = 'login.html';
          } else {
            window.location.href = '/pages/login.html';
          }
        }
      });
    }
  }, 50);
})();

document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------
  // PROFILE STATE & FALLBACK RETRIEVAL
  // ---------------------------------------------------------
  let userName = localStorage.getItem('user_name') || 'Friend';
  let companionEmoji = localStorage.getItem('companion_emoji') || '🦉';
  let companionName = localStorage.getItem('companion_name') || 'Ollie';

  let snaps = [];
  let entries = [];
  let snapStreak = 1;

  // Active snap state trackers
  let activeSnapId = null;
  let activeFilter = 'normal';
  let activeStickers = [];
  
  // Webcam streams
  let cameraStream = null;
  let useFrontCamera = true;
  
  // Month navigation trackers
  let todayDateObj = new Date();
  let currentYear = todayDateObj.getFullYear();
  let currentMonth = todayDateObj.getMonth(); // 0 is Jan, 11 is Dec

  // Dragging states
  let isDragging = false;
  let startX = 0, startY = 0;
  let downX = 0, downY = 0;
  let dragDistance = 0;

  // DOM Elements
  const snapStreakTitle = document.getElementById('snap-streak-title');
  const streakCircleFill = document.getElementById('progress-ring-circle');
  const streakPercentLabel = document.getElementById('progress-percent-label');
  
  const milestonePrev = document.getElementById('milestone-prev');
  const milestoneTarget = document.getElementById('milestone-target');
  const milestoneBarFill = document.getElementById('milestone-progress-bar');

  // Today Card states
  const todaySnapCard = document.getElementById('today-snap-card');
  const notSnappedState = document.getElementById('not-snapped-state');
  const snappedState = document.getElementById('snapped-state');
  const companionHappySpeech = document.getElementById('companion-happy-speech');
  const companionCelebrateEmoji = document.getElementById('companion-celebrate-emoji');
  
  // Gallery elements
  const monthYearLabel = document.getElementById('month-year-label');
  const calendarDaysContainer = document.getElementById('calendar-days-container');
  
  const btnPrevMonth = document.getElementById('btn-prev-month');
  const btnNextMonth = document.getElementById('btn-next-month');

  // Trigger buttons
  const btnSnapNow = document.getElementById('btn-snap-now');
  const cameraScreen = document.getElementById('camera-screen');
  const videoFeed = document.getElementById('camera-stream-video');
  const cameraPlaceholder = document.getElementById('camera-placeholder');
  const btnCloseCamera = document.getElementById('btn-close-camera');
  const btnSwitchCamera = document.getElementById('btn-switch-camera');
  const btnCapture = document.getElementById('btn-capture');
  const cameraFlash = document.getElementById('camera-flash');
  
  const cameraCompanion = document.getElementById('camera-companion');
  const cameraCompanionEmoji = document.getElementById('camera-companion-emoji');
  const cameraCompanionSpeech = document.getElementById('camera-companion-speech');

  // Review Elements
  const photoReviewScreen = document.getElementById('photo-review-screen');
  const reviewPhotoImg = document.getElementById('review-photo-img');
  const btnRetake = document.getElementById('btn-retake');
  const btnSaveSnap = document.getElementById('btn-save-snap');

  // Detail View Screen elements
  const snapDetailScreen = document.getElementById('snap-detail-screen');
  const detailPhotoImg = document.getElementById('detail-photo-img');
  const detailStickersWrapper = document.getElementById('detail-stickers-wrapper');
  const detailDateLabel = document.getElementById('detail-date-label');
  const detailCompanionEmoji = document.getElementById('detail-companion-emoji');
  
  const btnCloseDetail = document.getElementById('btn-close-detail');
  const btnDetailDecorate = document.getElementById('btn-detail-decorate');
  const btnDetailFavorite = document.getElementById('btn-detail-favorite');
  const btnDetailLink = document.getElementById('btn-detail-link');
  const btnDetailDelete = document.getElementById('btn-detail-delete');

  // Modal selector wrappers
  const stickerSelectorOverlay = document.getElementById('sticker-selector-overlay');
  const btnCloseStickers = document.getElementById('btn-close-stickers');
  const stickerSelectButtons = document.querySelectorAll('.sticker-select-btn');

  const linkEntryOverlay = document.getElementById('link-entry-overlay');
  const btnCloseLinks = document.getElementById('btn-close-links');
  const entriesChecklist = document.getElementById('entries-checklist');

  // Floating companion (Dashboard static)
  const floatingCompanion = document.getElementById('floating-companion');
  const floatingEmoji = document.getElementById('floating-companion-emoji');

  // ---------------------------------------------------------
  // Initialize snaps database
  async function initSnaps() {
    try {
      const profile = await API.getProfile();
      userName = profile.username || userName;
      companionEmoji = profile.companionEmoji || companionEmoji;
      companionName = profile.companionName || companionName;

      localStorage.setItem('user_name', userName);
      localStorage.setItem('companion_name', companionName);
      localStorage.setItem('companion_emoji', companionEmoji);

      const res = await API.getSnaps();
      snaps = res.snaps || [];
      snapStreak = res.streak || 0;
      snaps.forEach(s => {
        if (!s.imageData && s.src) s.imageData = s.src;
      });
      localStorage.setItem('diary_snaps', JSON.stringify(snaps));

      entries = await API.getEntries();
      localStorage.setItem('diary_entries', JSON.stringify(entries));
    } catch (err) {
      console.warn('API error loading snaps state fallback:', err);
      snaps = JSON.parse(localStorage.getItem('diary_snaps')) || [];
      entries = JSON.parse(localStorage.getItem('diary_entries')) || [];
      snapStreak = parseInt(localStorage.getItem('snapStreak'), 10) || 1;
    }

    if (floatingEmoji) floatingEmoji.textContent = companionEmoji;
    if (cameraCompanionEmoji) cameraCompanionEmoji.textContent = companionEmoji;
    if (companionCelebrateEmoji) companionCelebrateEmoji.textContent = companionEmoji;
    if (detailCompanionEmoji) detailCompanionEmoji.textContent = companionEmoji;

    renderSnapHome();
  }

  initSnaps();

  // ---------------------------------------------------------
  // SNAP FEED & PROGRESS LOGIC
  // ---------------------------------------------------------
  function renderSnapHome() {
    updateStreaksDisplay();
    updateTodayStatus();
    renderCalendarGrid(currentYear, currentMonth);
  }

  function updateStreaksDisplay() {
    // Milestones: 7, 14, 30 days
    const milestones = [7, 14, 30];
    let nextMilestone = 7;
    let prevMilestone = 0;
    
    for (let i = 0; i < milestones.length; i++) {
      if (snapStreak < milestones[i]) {
        nextMilestone = milestones[i];
        prevMilestone = i > 0 ? milestones[i-1] : 0;
        break;
      }
      nextMilestone = 30;
      prevMilestone = 14;
    }

    // SVG Circular progress
    let svgPercent = 0;
    if (snapStreak >= 30) {
      svgPercent = 100;
    } else {
      svgPercent = Math.round((snapStreak / nextMilestone) * 100);
    }

    const circumference = 2 * Math.PI * 21; // ~131.95
    if (streakCircleFill) {
      streakCircleFill.style.strokeDasharray = `${circumference} ${circumference}`;
      streakCircleFill.style.strokeDashoffset = circumference; // init empty
      
      setTimeout(() => {
        const offset = circumference - (svgPercent / 100) * circumference;
        streakCircleFill.style.strokeDashoffset = offset;
      }, 400);
    }
    if (streakPercentLabel) {
      streakPercentLabel.textContent = `${svgPercent}%`;
    }

    // Linear progress bar
    let barPercent = 0;
    if (snapStreak >= 30) {
      barPercent = 100;
    } else {
      const numerator = snapStreak - prevMilestone;
      const denominator = nextMilestone - prevMilestone;
      barPercent = Math.round((numerator / denominator) * 100);
    }

    if (milestoneBarFill) {
      milestoneBarFill.style.width = `${barPercent}%`;
    }
    if (milestonePrev) {
      milestonePrev.textContent = `${prevMilestone}d`;
    }
    if (milestoneTarget) {
      milestoneTarget.textContent = `Next: ${nextMilestone}d`;
    }

    // Stagger count-up
    setTimeout(() => {
      animateCountUp('snap-streak-title', snapStreak, snapStreak === 1 ? 'Day Snap Streak' : 'Day Snap Streaks');
    }, 250);
  }

  function animateCountUp(elementId, targetValue, suffix) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let start = 0;
    const duration = 1200; // 1.2s
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = progress * (2 - progress); // easeOutQuad
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

  function updateTodayStatus() {
    if (!todaySnapCard || !notSnappedState || !snappedState) return;

    const todayKey = formatDateKey(new Date());
    const snappedToday = snaps.some(s => {
      if (s.date === todayKey) return true;
      try {
        const dObj = new Date(s.id);
        if (!isNaN(dObj.getTime()) && formatDateKey(dObj) === todayKey) return true;
      } catch (e) {}
      return false;
    });

    if (snappedToday) {
      todaySnapCard.classList.add('snapped');
      notSnappedState.classList.remove('active');
      snappedState.classList.add('active');
      if (companionHappySpeech) {
        companionHappySpeech.textContent = `${companionName} is happy you showed up today!`;
      }
    } else {
      todaySnapCard.classList.remove('snapped');
      notSnappedState.classList.add('active');
      snappedState.classList.remove('active');
    }
  }

  // ---------------------------------------------------------
  // MONTH CALENDAR GRID BUILDER
  // ---------------------------------------------------------
  function renderCalendarGrid(year, month) {
    if (!calendarDaysContainer || !monthYearLabel) return;

    // Set month-year header text
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearLabel.textContent = `${monthNames[month]} ${year}`;

    calendarDaysContainer.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const numDays = new Date(year, month + 1, 0).getDate();

    // Calculate start offset day (convert Sun=0, Mon=1... to Mon=0... Sun=6)
    let startOffset = firstDay.getDay();
    startOffset = startOffset === 0 ? 6 : startOffset - 1;

    // 1. Create spacer empty elements for offset alignment
    for (let i = 0; i < startOffset; i++) {
      const spacer = document.createElement('div');
      spacer.classList.add('grid-day-cell', 'empty-day');
      spacer.style.visibility = 'hidden';
      calendarDaysContainer.appendChild(spacer);
    }

    // 2. Create monthly cells
    for (let d = 1; d <= numDays; d++) {
      const cellDate = new Date(year, month, d);
      const dateKey = formatDateKey(cellDate);

      // Search if a snap entry matches this cell date
      const snapOnDay = snaps.find(s => {
        if (s.date === dateKey) return true;
        try {
          const dObj = new Date(s.id);
          if (!isNaN(dObj.getTime()) && formatDateKey(dObj) === dateKey) return true;
        } catch (e) {}
        return false;
      });

      const cell = document.createElement('div');
      cell.classList.add('grid-day-cell');
      cell.style.animationDelay = `${(d % 10) * 0.04}s`; // progressive load wiggles

      // Check today selection
      if (isSameDayDate(cellDate, new Date())) {
        cell.classList.add('today');
      }

      if (snapOnDay) {
        // Snapped day cell displays thumbnail
        cell.classList.add('snapped-day');
        
        const thumb = document.createElement('img');
        thumb.classList.add('cell-thumbnail');
        thumb.src = snapOnDay.imageData;
        thumb.alt = 'Memory cell preview';
        cell.appendChild(thumb);

        // Date numbers indicators overlay
        const dayLabel = document.createElement('span');
        dayLabel.classList.add('cell-day-num');
        dayLabel.textContent = d;
        cell.appendChild(dayLabel);

        // Tap to open snap details
        cell.addEventListener('click', () => {
          openSnapDetail(snapOnDay.id);
        });
      } else {
        // Empty day cells
        cell.classList.add('empty-day');
        cell.textContent = d;

        // Clicking empty cell on today opens camera screen
        if (isSameDayDate(cellDate, new Date())) {
          cell.addEventListener('click', () => {
            openCamera();
          });
        }
      }

      calendarDaysContainer.appendChild(cell);
    }

    // Staggered slide up wrapper check
    setTimeout(() => {
      const wrapper = document.querySelector('.snap-wrapper');
      if (wrapper) wrapper.classList.add('animated');
    }, 100);
  }

  function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function isSameDayDate(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // Month navigation arrow clicks
  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendarGrid(currentYear, currentMonth);
    });
  }

  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendarGrid(currentYear, currentMonth);
    });
  }

  // ---------------------------------------------------------
  // FULL SCREEN CAMERA SYSTEM
  // ---------------------------------------------------------
  if (btnSnapNow) {
    btnSnapNow.addEventListener('click', () => {
      openCamera();
    });
  }

  if (btnCloseCamera) {
    btnCloseCamera.addEventListener('click', () => {
      closeCamera();
    });
  }

  function openCamera() {
    activeFilter = 'normal';
    updateFilterSelections('normal');
    
    // Toggle active screens
    cameraScreen.classList.add('active');
    startWebcam();
  }

  function closeCamera() {
    stopWebcam();
    cameraScreen.classList.remove('active');
  }

  async function startWebcam() {
    if (!videoFeed || !cameraPlaceholder) return;
    
    // Stop old stream
    stopWebcam();

    const constraints = {
      video: { facingMode: useFrontCamera ? 'user' : 'environment' },
      audio: false
    };

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoFeed.srcObject = cameraStream;
      videoFeed.style.display = 'block';
      cameraPlaceholder.style.display = 'none';
    } catch (err) {
      console.warn('Webcam getUserMedia blocked or unsupported:', err);
      videoFeed.style.display = 'none';
      cameraPlaceholder.style.display = 'flex';
      cameraPlaceholder.querySelector('.camera-placeholder-text').textContent = 'Camera Blocked / Unsupported';
    }
  }

  function stopWebcam() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
  }

  // Switch camera toggle
  if (btnSwitchCamera) {
    btnSwitchCamera.addEventListener('click', () => {
      useFrontCamera = !useFrontCamera;
      startWebcam();
    });
  }

  // Image Compression Utility
  function compressImage(dataUrl, maxWidth = 800, maxHeight = 600, quality = 0.7) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
      img.src = dataUrl;
    });
  }

  // File Upload Fallback
  const btnUploadTrigger = document.getElementById('btn-upload-file-trigger');
  const snapFileInput = document.getElementById('snap-file-input');

  if (btnUploadTrigger && snapFileInput) {
    btnUploadTrigger.addEventListener('click', () => {
      snapFileInput.click();
    });

    snapFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const imgDataUrl = event.target.result;
          
          // Clear camera stream
          stopWebcam();
          
          // Show spinner or feedback if helpful, then compress
          const compressed = await compressImage(imgDataUrl);
          
          // Load preview review screen
          reviewPhotoImg.src = compressed;
          photoReviewScreen.classList.add('active');
          
          // Reset file input
          snapFileInput.value = '';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Filter Selection scroller Click Triggers
  const filterOptions = document.querySelectorAll('.filter-option');
  filterOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      const filter = opt.getAttribute('data-filter');
      updateFilterSelections(filter);
    });
  });

  function updateFilterSelections(filter) {
    activeFilter = filter;
    
    // Clear and set filter classes on video and review
    videoFeed.className = `camera-video-feed filter-${filter}`;
    reviewPhotoImg.className = `review-photo filter-${filter}`;
    detailPhotoImg.className = `detail-photo filter-${filter}`;

    filterOptions.forEach(o => {
      o.classList.toggle('active', o.getAttribute('data-filter') === filter);
    });
  }

  // Camera floating companion tap
  if (cameraCompanion) {
    cameraCompanion.addEventListener('click', () => {
      if (cameraCompanionSpeech) {
        cameraCompanionSpeech.classList.add('show');
        setTimeout(() => {
          cameraCompanionSpeech.classList.remove('show');
        }, 2000);
      }
    });
  }

  // ---------------------------------------------------------
  // PHOTO CAPTURING AND PREVIEW REVIEW
  // ---------------------------------------------------------
  if (btnCapture) {
    btnCapture.addEventListener('click', () => {
      // 1. Play flash white overlay animation
      if (cameraFlash) {
        cameraFlash.classList.add('flash');
        setTimeout(() => cameraFlash.classList.remove('flash'), 300);
      }

      // 2. Extract canvas frame coordinates
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = videoFeed.videoWidth || 640;
      canvas.height = videoFeed.videoHeight || 480;

      // Draw feed context if camera runs, else draw stylized fallback vector
      if (cameraStream && videoFeed.readyState === videoFeed.HAVE_ENOUGH_DATA) {
        ctx.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#1A0A00';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px Dancing Script';
        ctx.textAlign = 'center';
        ctx.fillText("Memory Captured! 📸", canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.fillStyle = '#FFFAF0';
        ctx.font = '16px Lato';
        ctx.fillText("Diary Companion Photo Saved", canvas.width / 2, canvas.height / 2 + 30);
      }

      const imgDataUrl = canvas.toDataURL('image/jpeg');

      // 3. Show review screen
      compressImage(imgDataUrl).then(compressed => {
        reviewPhotoImg.src = compressed;
        photoReviewScreen.classList.add('active');
      });
    });
  }

  // Retake click
  if (btnRetake) {
    btnRetake.addEventListener('click', () => {
      photoReviewScreen.classList.remove('active');
    });
  }

  // Save Captured Snap to diary
  if (btnSaveSnap) {
    btnSaveSnap.addEventListener('click', async () => {
      const imgDataUrl = reviewPhotoImg.src;

      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      const todayFormatted = new Date().toLocaleDateString('en-US', options);
      const todayDateStr = new Date().toISOString().split('T')[0];

      try {
        const res = await API.uploadSnap(imgDataUrl, todayDateStr);
        if (res.streak) {
          snapStreak = res.streak;
          localStorage.setItem('snapStreak', String(snapStreak));
        }
        
        // Refresh local cache list
        const refreshed = await API.getSnaps();
        snaps = refreshed.snaps || [];
        snaps.forEach(s => {
          if (!s.imageData && s.src) s.imageData = s.src;
        });
        try {
          localStorage.setItem('diary_snaps', JSON.stringify(snaps));
        } catch (storageErr) {
          console.error('LocalStorage write failed:', storageErr);
        }
      } catch (err) {
        console.warn('API upload snap failed, running local fallback:', err);
        const newSnap = {
          id: Date.now(),
          date: todayFormatted,
          imageData: imgDataUrl,
          filtered: activeFilter,
          decorations: [],
          linkedEntry: null,
          favorite: false
        };
        snaps.push(newSnap);
        try {
          localStorage.setItem('diary_snaps', JSON.stringify(snaps));
        } catch (storageErr) {
          console.error('LocalStorage write failed:', storageErr);
          alert('Local storage is full! Please sign in to sync snaps to the cloud server instead. ☁️');
        }
        updateStreaksOnSave();
      }

      // Close camera overlays
      photoReviewScreen.classList.remove('active');
      closeCamera();
      
      // Update feeds
      renderSnapHome();

      // Confetti burst particles explosion!
      triggerConfetti();
    });
  }

  function updateStreaksOnSave() {
    let writingStreak = parseInt(localStorage.getItem('snapStreak'), 10) || 1;
    
    if (snaps.length > 1) {
      const sorted = [...snaps].sort((a, b) => b.id - a.id);
      const lastSnapDate = new Date(sorted[1].id);
      const today = new Date();

      const timeDiff = today.getTime() - lastSnapDate.getTime();
      const diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));

      if (diffDays === 1) {
        writingStreak++;
      } else if (diffDays > 1) {
        writingStreak = 1;
      }
      localStorage.setItem('snapStreak', String(writingStreak));
      snapStreak = writingStreak;
    }
  }

  // ---------------------------------------------------------
  // CONFETTI CANVAS PARTICLES CELEBRATION ENGINE
  // ---------------------------------------------------------
  function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FFD700', '#FFE875', '#B8860B', '#FFF8E7', '#FFFAF0'];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: 4 + Math.random() * 6,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    let animationFrameId = null;
    const startTime = Date.now();

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      // Run particles updates for 2.5s
      if (Date.now() - startTime < 2500) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    draw();
  }

  // ---------------------------------------------------------
  // SNAP DETAILED VIEW OVERLAYS
  // ---------------------------------------------------------
  function openSnapDetail(id) {
    activeSnapId = id;
    const snap = snaps.find(s => s.id == id);
    if (!snap) return;

    // Load detailed data
    detailPhotoImg.src = snap.imageData;
    detailDateLabel.textContent = snap.date;
    
    // Set appropriate filter class
    updateFilterSelections(snap.filtered || 'normal');

    // Pre-select Favorite status visual check
    const favIcon = document.getElementById('fav-icon');
    if (favIcon) {
      favIcon.textContent = snap.favorite ? '❤️' : '🤍';
    }

    // Render decorations static positions
    detailStickersWrapper.innerHTML = '';
    const tempStickers = snap.decorations || [];
    activeStickers = [];
    
    tempStickers.forEach(dec => {
      appendStickerToDetail(dec.type, dec.left, dec.top, false);
      activeStickers.push(dec);
    });

    snapDetailScreen.classList.add('active');
  }

  if (btnCloseDetail) {
    btnCloseDetail.addEventListener('click', () => {
      snapDetailScreen.classList.remove('active');
      activeSnapId = null;
    });
  }

  // Detailed Card Deletion confirm
  if (btnDetailDelete) {
    btnDetailDelete.addEventListener('click', () => {
      if (confirm('Remove this memory?')) {
        snaps = snaps.filter(s => s.id != activeSnapId);
        localStorage.setItem('diary_snaps', JSON.stringify(snaps));
        
        snapDetailScreen.classList.remove('active');
        activeSnapId = null;
        renderSnapHome();
      }
    });
  }

  // Detailed Favorite Click Toggles
  if (btnDetailFavorite) {
    btnDetailFavorite.addEventListener('click', () => {
      const snap = snaps.find(s => s.id == activeSnapId);
      if (!snap) return;

      snap.favorite = !snap.favorite;
      localStorage.setItem('diary_snaps', JSON.stringify(snaps));

      const favIcon = document.getElementById('fav-icon');
      if (favIcon) {
        favIcon.textContent = snap.favorite ? '❤️' : '🤍';
      }
    });
  }

  // ---------------------------------------------------------
  // DRAGGABLE STICKER DECORATIONS IN DETAILS
  // ---------------------------------------------------------
  if (btnDetailDecorate) {
    btnDetailDecorate.addEventListener('click', () => {
      stickerSelectorOverlay.classList.add('active');
    });
  }

  if (btnCloseStickers) {
    btnCloseStickers.addEventListener('click', () => {
      stickerSelectorOverlay.classList.remove('active');
    });
  }

  stickerSelectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const stickerEmoji = btn.getAttribute('data-sticker');
      const leftPercent = 40 + Math.random() * 20; // 40% - 60%
      const topPercent = 30 + Math.random() * 20;  // 30% - 50%
      
      appendStickerToDetail(stickerEmoji, `${leftPercent}%`, `${topPercent}%`);
      
      // Save sticker to snap array database
      const snap = snaps.find(s => s.id == activeSnapId);
      if (snap) {
        if (!snap.decorations) snap.decorations = [];
        snap.decorations = activeStickers;
        localStorage.setItem('diary_snaps', JSON.stringify(snaps));
      }

      stickerSelectorOverlay.classList.remove('active');
    });
  });

  function appendStickerToDetail(type, left = '50%', top = '40%', shouldSave = true) {
    const sticker = document.createElement('div');
    sticker.classList.add('sticker-item');
    sticker.style.left = left;
    sticker.style.top = top;
    sticker.textContent = type;

    const stickerObj = { type, left, top };
    if (shouldSave) {
      activeStickers.push(stickerObj);
    }

    // Tap sticker deletion triggers
    const delBtn = document.createElement('button');
    delBtn.classList.add('sticker-delete-btn');
    delBtn.textContent = 'Remove';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sticker.remove();
      activeStickers = activeStickers.filter(s => s !== stickerObj);
      
      const snap = snaps.find(s => s.id === activeSnapId);
      if (snap) {
        snap.decorations = activeStickers;
        localStorage.setItem('diary_snaps', JSON.stringify(snaps));
      }
    });
    sticker.appendChild(delBtn);

    // Setup dragging
    setupDragging(sticker, stickerObj);

    detailStickersWrapper.appendChild(sticker);
  }

  function setupDragging(element, saveObject) {
    let localDragging = false;
    let localStartX = 0;
    let localStartY = 0;

    // Prevent default browser dragging ghosts
    element.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });

    element.addEventListener('pointerdown', (e) => {
      // Don't drag if clicking delete button
      if (e.target.classList.contains('sticker-delete-btn') || e.target.classList.contains('sticker-delete-trigger')) {
        return;
      }

      localDragging = true;
      element.setPointerCapture(e.pointerId);
      
      e.stopPropagation();
      e.preventDefault();

      const rect = element.getBoundingClientRect();
      localStartX = e.clientX - rect.left;
      localStartY = e.clientY - rect.top;
    });

    element.addEventListener('pointermove', (e) => {
      if (!localDragging) return;

      const parentRect = element.parentElement.getBoundingClientRect();
      
      let x = e.clientX - parentRect.left - localStartX;
      let y = e.clientY - parentRect.top - localStartY;

      const maxX = parentRect.width - element.offsetWidth;
      const maxY = parentRect.height - element.offsetHeight;

      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));

      const leftPercent = (x / parentRect.width) * 100;
      const topPercent = (y / parentRect.height) * 100;

      element.style.left = `${leftPercent}%`;
      element.style.top = `${topPercent}%`;

      saveObject.left = `${leftPercent}%`;
      saveObject.top = `${topPercent}%`;
    });

    element.addEventListener('pointerup', (e) => {
      if (!localDragging) return;
      localDragging = false;
      element.releasePointerCapture(e.pointerId);

      // Save changes back to snaps array database
      const snap = snaps.find(s => s.id == activeSnapId);
      if (snap) {
        snap.decorations = activeStickers;
        localStorage.setItem('diary_snaps', JSON.stringify(snaps));
      }
    });

    element.addEventListener('pointercancel', (e) => {
      if (!localDragging) return;
      localDragging = false;
      element.releasePointerCapture(e.pointerId);
    });
  }

  // ---------------------------------------------------------
  // LINK TO DIARY ENTRY MODALS
  // ---------------------------------------------------------
  if (btnDetailLink) {
    btnDetailLink.addEventListener('click', () => {
      openLinkEntriesModal();
    });
  }

  if (btnCloseLinks) {
    btnCloseLinks.addEventListener('click', () => {
      linkEntryOverlay.classList.remove('active');
    });
  }

  function openLinkEntriesModal() {
    if (!entriesChecklist) return;
    entriesChecklist.innerHTML = '';

    const snap = snaps.find(s => s.id == activeSnapId);
    if (!snap) return;

    if (entries.length === 0) {
      entriesChecklist.innerHTML = '<p style="font-size: 11px; color:#8B7355; text-align:center;">No diary entries created yet 🕯️</p>';
      linkEntryOverlay.classList.add('active');
      return;
    }

    entries.forEach(entry => {
      const item = document.createElement('div');
      item.classList.add('checklist-item');
      if (snap.linkedEntry === entry.id) {
        item.classList.add('linked');
      }

      const label = document.createElement('div');
      label.classList.add('check-label');
      label.textContent = entry.date;
      
      const p = document.createElement('p');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = entry.content;
      p.textContent = tempDiv.textContent || tempDiv.innerText || '(No Text)';
      label.appendChild(p);

      item.appendChild(label);

      const check = document.createElement('span');
      check.classList.add('check-indicator');
      check.innerHTML = '&#10003;';
      item.appendChild(check);

      // Handle checklist link changes
      item.addEventListener('click', async () => {
        try {
          if (snap.linkedEntry === entry.id) {
            // unlink
            snap.linkedEntry = null;
            item.classList.remove('linked');
          } else {
            // link
            snap.linkedEntry = entry.id;
            // Unlink others
            const otherItems = entriesChecklist.querySelectorAll('.checklist-item');
            otherItems.forEach(i => i.classList.remove('linked'));
            item.classList.add('linked');
            // Server link
            await API.linkSnapToEntry(snap.id, entry.id);
          }
        } catch (err) {
          console.warn('API link snap failed, linking locally:', err);
        }
        
        localStorage.setItem('diary_snaps', JSON.stringify(snaps));
        
        // Brief delay before closing
        setTimeout(() => {
          linkEntryOverlay.classList.remove('active');
        }, 300);
      });

      entriesChecklist.appendChild(item);
    });

    linkEntryOverlay.classList.add('active');
  }

  // ---------------------------------------------------------
  // STATIC DRAGGABLE FLOATING COMPANION CONTROLLER
  // ---------------------------------------------------------
  let isFCDragging = false;
  let fcStartX = 0, fcStartY = 0;
  let fcDownX = 0, fcDownY = 0;
  let fcDragDistance = 0;
  let fcSpeechTimeout = null;

  function triggerCompanionSpeech() {
    const bubble = document.getElementById('floating-speech-bubble');
    if (!bubble) return;

    bubble.textContent = `Hi ${userName}! 📖`;
    bubble.classList.add('show');

    if (fcSpeechTimeout) clearTimeout(fcSpeechTimeout);
    fcSpeechTimeout = setTimeout(() => {
      bubble.classList.remove('show');
    }, 2000);
  }

  if (floatingCompanion) {
    floatingCompanion.addEventListener('pointerdown', (e) => {
      isFCDragging = true;
      floatingCompanion.setPointerCapture(e.pointerId);

      const rect = floatingCompanion.getBoundingClientRect();
      fcStartX = e.clientX - rect.left;
      fcStartY = e.clientY - rect.top;

      fcDownX = e.clientX;
      fcDownY = e.clientY;
      fcDragDistance = 0;

      const floatEmoji = document.getElementById('floating-companion-emoji');
      if (floatEmoji) floatEmoji.style.animationPlayState = 'paused';
    });

    floatingCompanion.addEventListener('pointermove', (e) => {
      if (!isFCDragging) return;

      const dx = e.clientX - fcDownX;
      const dy = e.clientY - fcDownY;
      fcDragDistance = Math.sqrt(dx * dx + dy * dy);

      let x = e.clientX - fcStartX;
      let y = e.clientY - fcStartY;

      const maxX = window.innerWidth - floatingCompanion.offsetWidth;
      const maxY = window.innerHeight - floatingCompanion.offsetHeight;

      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));

      floatingCompanion.style.right = 'auto';
      floatingCompanion.style.bottom = 'auto';
      floatingCompanion.style.left = `${x}px`;
      floatingCompanion.style.top = `${y}px`;
    });

    floatingCompanion.addEventListener('pointerup', (e) => {
      if (!isFCDragging) return;
      isFCDragging = false;
      floatingCompanion.releasePointerCapture(e.pointerId);

      const floatEmoji = document.getElementById('floating-companion-emoji');
      if (floatEmoji) floatEmoji.style.animationPlayState = 'running';

      if (fcDragDistance < 5) {
        triggerCompanionSpeech();
      }
    });

    floatingCompanion.addEventListener('pointercancel', (e) => {
      if (!isFCDragging) return;
      isFCDragging = false;
      floatingCompanion.releasePointerCapture(e.pointerId);

      const floatEmoji = document.getElementById('floating-companion-emoji');
      if (floatEmoji) floatEmoji.style.animationPlayState = 'running';
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
    const wrapper = document.querySelector('.snap-wrapper');
    if (wrapper) wrapper.classList.add('animated');
  }, 100);

  setTimeout(() => {
    if (floatingCompanion) floatingCompanion.classList.add('loaded');
  }, 300);
});
