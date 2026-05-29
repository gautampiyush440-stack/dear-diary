/**
 * Dear Diary - Diary Workspace Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------
  // LOCALSTORAGE PROFILE RETRIEVAL
  // ---------------------------------------------------------
  const userName = localStorage.getItem('user_name') || 'Friend';
  const diaryName = localStorage.getItem('diary_name') || 'My Diary';
  const companionEmoji = localStorage.getItem('companion_emoji') || '🦉';
  const companionName = localStorage.getItem('companion_name') || 'Ollie';

  // State elements
  let entries = JSON.parse(localStorage.getItem('diary_entries')) || [];
  let editingEntryId = null; // tracking whether editing or creating
  
  // Placed polaroids & decorations list for active editor
  let activePhotos = [];
  let activeDecorations = [];
  
  // Dragging states
  let dragElement = null;
  let dragStartX = 0;
  let dragStartY = 0;

  // DOM Elements
  const diaryHomeView = document.getElementById('diary-home-view');
  const diaryTitle = document.getElementById('diary-title');
  const entriesList = document.getElementById('entries-list');
  const emptyState = document.getElementById('empty-state');
  const calendarStrip = document.getElementById('calendar-strip');

  // Floating companion
  const floatingCompanion = document.getElementById('floating-companion');
  const floatingEmoji = document.getElementById('floating-companion-emoji');
  
  // Editor View
  const newEntryScreen = document.getElementById('new-entry-screen');
  const editorDateLabel = document.getElementById('editor-date-label');
  const textEditor = document.getElementById('text-editor');
  const diaryCanvas = document.getElementById('diary-page-canvas');
  const attachmentsCanvas = document.getElementById('attachments-canvas');
  const decorationsCanvas = document.getElementById('decorations-canvas');
  const wordCountLabel = document.getElementById('editor-word-count');

  // Buttons & Overlays
  const btnAddEntry = document.getElementById('btn-add-entry');
  const btnCloseEditor = document.getElementById('btn-close-editor');
  const btnSaveEntry = document.getElementById('btn-save-entry');
  const fileUploadInput = document.getElementById('photo-upload-input');
  
  // Formatting & Tool Sheets
  const fontSheet = document.getElementById('font-selector-sheet');
  const btnFontSelector = document.getElementById('btn-font-selector');
  const btnCloseFontSheet = document.getElementById('btn-close-font-sheet');
  const fontOptions = document.querySelectorAll('.font-option-btn');

  const stickerSheet = document.getElementById('sticker-selector-sheet');
  const btnCloseStickerSheet = document.getElementById('btn-close-sticker-sheet');
  const stickerButtons = document.querySelectorAll('.sticker-btn');

  const voiceOverlay = document.getElementById('voice-overlay');
  const btnMicRecord = document.getElementById('btn-mic-record');
  const btnStopVoice = document.getElementById('btn-stop-voice');
  const transcriptionText = document.getElementById('transcription-text');
  
  const saveMoodOverlay = document.getElementById('save-mood-overlay');
  
  // Detail View Screen
  const entryDetailScreen = document.getElementById('entry-detail-screen');
  const detailDateLabel = document.getElementById('detail-date-label');
  const btnCloseDetail = document.getElementById('btn-close-detail');
  const btnEditEntry = document.getElementById('btn-edit-entry');
  const detailCanvas = document.getElementById('detail-page-canvas');
  const detailAttachments = document.getElementById('detail-attachments-canvas');
  const detailDecorations = document.getElementById('detail-decorations-canvas');
  const detailTextViewer = document.getElementById('detail-text-viewer');
  const detailMoodDisplay = document.getElementById('detail-mood-display');
  const detailWordCount = document.getElementById('detail-word-count');

  // ---------------------------------------------------------
  // INITIAL LOAD SETUPS
  // ---------------------------------------------------------
  // Set main title
  if (diaryTitle) diaryTitle.textContent = diaryName;
  if (floatingEmoji) floatingEmoji.textContent = companionEmoji;

  // Fade overlay entry removal
  setTimeout(() => {
    const fadeOverlay = document.getElementById('fade-overlay');
    if (fadeOverlay) {
      fadeOverlay.classList.add('fade-out');
      setTimeout(() => fadeOverlay.remove(), 800);
    }
  }, 50);

  // Load companion wiggle entries
  setTimeout(() => {
    if (floatingCompanion) floatingCompanion.classList.add('loaded');
  }, 300);

  // Initialize view
  renderDiaryHome();

  // ---------------------------------------------------------
  // CALENDAR STRIP GENERATOR
  // ---------------------------------------------------------
  function renderCalendarStrip() {
    if (!calendarStrip) return;
    calendarStrip.innerHTML = '';

    const today = new Date();
    const currentDay = today.getDay(); // 0 Sunday, 1 Monday...
    const distance = currentDay === 0 ? -6 : 1 - currentDay; // distance to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + distance);

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      
      const dayNameStr = daysOfWeek[i];
      const dateNum = date.getDate();
      const dateKey = formatDateKey(date);

      // Check if entry exists on this day
      const entryOnDay = entries.find(e => {
        const entryDate = new Date(e.id);
        return formatDateKey(entryDate) === dateKey;
      });

      const dateItem = document.createElement('div');
      dateItem.classList.add('date-item');
      if (isSameDay(date, today)) {
        dateItem.classList.add('today');
      }

      // Day name label
      const nameEl = document.createElement('span');
      nameEl.classList.add('day-name');
      nameEl.textContent = dayNameStr;
      dateItem.appendChild(nameEl);

      // Number circle
      const numEl = document.createElement('span');
      numEl.classList.add('date-num');
      numEl.textContent = dateNum;
      dateItem.appendChild(numEl);

      // Flag container
      const flagEl = document.createElement('div');
      if (entryOnDay) {
        if (entryOnDay.mood) {
          flagEl.classList.add('date-mood-flag');
          flagEl.textContent = entryOnDay.mood;
        } else {
          flagEl.classList.add('date-dot-flag');
        }
      } else {
        flagEl.style.minHeight = '14px'; // placeholder to align spacing
      }
      dateItem.appendChild(flagEl);

      // Scroll to active today
      calendarStrip.appendChild(dateItem);
    }
  }

  function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // ---------------------------------------------------------
  // DIARY HOME FEED LOGIC
  // ---------------------------------------------------------
  function renderDiaryHome() {
    renderCalendarStrip();
    if (!entriesList || !emptyState) return;
    
    // Sort entries descending (newest first)
    entries.sort((a, b) => b.id - a.id);
    
    if (entries.length === 0) {
      entriesList.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    entriesList.style.display = 'flex';
    emptyState.style.display = 'none';
    entriesList.innerHTML = '';

    entries.forEach(entry => {
      const card = document.createElement('article');
      card.classList.add('entry-card');
      card.setAttribute('data-id', entry.id);

      // Card Top Row
      const topRow = document.createElement('div');
      topRow.classList.add('entry-card-top');
      
      const dateLabel = document.createElement('span');
      dateLabel.classList.add('entry-date-label');
      dateLabel.textContent = entry.date;
      topRow.appendChild(dateLabel);

      const moodEmoji = document.createElement('span');
      moodEmoji.classList.add('entry-card-mood');
      moodEmoji.textContent = entry.mood || '📝';
      topRow.appendChild(moodEmoji);
      
      card.appendChild(topRow);

      // Card Middle Content Preview
      const preview = document.createElement('p');
      preview.classList.add('entry-preview');
      // strip html to text for preview
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = entry.content;
      const textPreview = tempDiv.textContent || tempDiv.innerText || "";
      preview.textContent = textPreview.trim() || "(Empty Entry)";
      card.appendChild(preview);

      // Card Bottom Row
      const bottomRow = document.createElement('div');
      bottomRow.classList.add('entry-card-bottom');

      const styleBadge = document.createElement('span');
      styleBadge.classList.add('page-style-badge');
      styleBadge.textContent = entry.pageStyle || 'classic';
      bottomRow.appendChild(styleBadge);

      if (entry.photos && entry.photos.length > 0) {
        const photoBadge = document.createElement('span');
        photoBadge.classList.add('attachments-badge');
        photoBadge.textContent = `📷 x${entry.photos.length}`;
        bottomRow.appendChild(photoBadge);
      }

      card.appendChild(bottomRow);

      // ---------------------------------------------------------
      // SELECTION AND HOLD DELETION LOGIC
      // ---------------------------------------------------------
      let pressTimer = null;
      
      // Tap events
      card.addEventListener('pointerdown', (e) => {
        pressTimer = setTimeout(() => {
          // Long press delete
          deleteEntryAlert(entry.id);
          pressTimer = null;
        }, 800); // 800ms hold
      });

      card.addEventListener('pointerup', (e) => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
          // Open detail screen
          openDetailView(entry.id);
        }
      });

      card.addEventListener('pointercancel', () => {
        if (pressTimer) clearTimeout(pressTimer);
      });

      entriesList.appendChild(card);
    });
  }

  function deleteEntryAlert(id) {
    if (confirm('Delete this diary entry permanently? 🕯️')) {
      entries = entries.filter(e => e.id !== id);
      localStorage.setItem('diary_entries', JSON.stringify(entries));
      renderDiaryHome();
    }
  }

  // ---------------------------------------------------------
  // SLIDE-UP EDITOR TOGGLES
  // ---------------------------------------------------------
  if (btnAddEntry) {
    btnAddEntry.addEventListener('click', () => {
      openEditor();
    });
  }

  if (btnCloseEditor) {
    btnCloseEditor.addEventListener('click', () => {
      closeEditor();
    });
  }

  function openEditor(editId = null) {
    editingEntryId = editId;
    
    // Clear elements
    textEditor.innerHTML = '';
    attachmentsCanvas.innerHTML = '';
    decorationsCanvas.innerHTML = '';
    activePhotos = [];
    activeDecorations = [];
    wordCountLabel.textContent = '0 words';

    // Set Default Fonts & Styles
    setPageStyle('classic');
    setFontStyle('dancing');

    if (editId) {
      // Load saved parameters
      const entry = entries.find(e => e.id === editId);
      if (entry) {
        editorDateLabel.textContent = entry.date;
        textEditor.innerHTML = entry.content;
        setPageStyle(entry.pageStyle || 'classic');
        setFontStyle(entry.font || 'dancing');
        
        // Re-append photos
        if (entry.photos) {
          entry.photos.forEach(photo => {
            appendPolaroid(photo.src, photo.caption, photo.left, photo.top, photo.tilt);
          });
        }

        // Re-append decorations
        if (entry.decorations) {
          entry.decorations.forEach(dec => {
            appendSticker(dec.type, dec.left, dec.top);
          });
        }
        
        updateWordCount();
      }
    } else {
      // Create new setup
      const options = { month: 'long', day: 'numeric', year: 'numeric' };
      editorDateLabel.textContent = new Date().toLocaleDateString('en-US', options);
      
      // Default placeholder text helper
      textEditor.setAttribute('placeholder', `Dear ${diaryName},\n\nToday...`);
    }

    newEntryScreen.classList.remove('page-flip-close');
    newEntryScreen.classList.add('active');
    textEditor.focus();
  }

  function closeEditor() {
    newEntryScreen.classList.remove('active');
    editingEntryId = null;
  }

  // ---------------------------------------------------------
  // PAGE STYLE & FONT CONTROLS
  // ---------------------------------------------------------
  const styleButtons = document.querySelectorAll('.style-option-btn');
  styleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      styleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const style = btn.getAttribute('data-style');
      setPageStyle(style);
    });
  });

  function setPageStyle(style) {
    // Clear old styles
    diaryCanvas.classList.remove('classic-style', 'vintage-style', 'ruled-style', 'blank-style', 'dotted-style');
    diaryCanvas.classList.add(`${style}-style`);
    
    // Check style button active
    styleButtons.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-style') === style);
    });
  }

  // Font Bottom Sheet Toggles
  if (btnFontSelector) {
    btnFontSelector.addEventListener('click', () => {
      fontSheet.classList.add('active');
    });
  }

  if (btnCloseFontSheet) {
    btnCloseFontSheet.addEventListener('click', () => {
      fontSheet.classList.remove('active');
    });
  }

  fontOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      fontOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const font = opt.getAttribute('data-font');
      setFontStyle(font);
      fontSheet.classList.remove('active');
    });
  });

  function setFontStyle(font) {
    textEditor.classList.remove('font-dancing', 'font-playfair', 'font-lato', 'font-courier');
    textEditor.classList.add(`font-${font}`);

    fontOptions.forEach(o => {
      o.classList.toggle('active', o.getAttribute('data-font') === font);
    });
  }

  // Formatting buttons bold, italic, underline
  const formatButtons = document.querySelectorAll('.format-btn');
  formatButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const command = btn.getAttribute('data-command');
      document.execCommand(command, false, null);
      textEditor.focus();
    });
  });

  // Word count dynamic increments
  textEditor.addEventListener('input', () => {
    updateWordCount();
  });

  function updateWordCount() {
    const text = textEditor.innerText || textEditor.textContent;
    const cleanText = text.replace(/Dear\s[a-zA-Z0-9\s]+,?\s*Today.../i, '').trim(); // ignore placeholder string if any
    const words = cleanText ? cleanText.split(/\s+/).filter(w => w.length > 0).length : 0;
    wordCountLabel.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  }

  // ---------------------------------------------------------
  // PHOTO UPLOADS (Polaroid creations)
  // ---------------------------------------------------------
  const toolPhoto = document.getElementById('tool-photo');
  if (toolPhoto && fileUploadInput) {
    toolPhoto.addEventListener('click', () => {
      fileUploadInput.click();
    });
  }

  if (fileUploadInput) {
    fileUploadInput.addEventListener('change', () => {
      const file = fileUploadInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imgUrl = e.target.result;
          // Random offset top/left
          const leftPercent = 15 + Math.random() * 30; // 15% - 45%
          const topPercent = 20 + Math.random() * 30;  // 20% - 50%
          const tiltDeg = (Math.random() - 0.5) * 6;   // -3deg to +3deg
          
          appendPolaroid(imgUrl, '', `${leftPercent}%`, `${topPercent}%`, `${tiltDeg}deg`);
        };
        reader.readAsDataURL(file);
      }
      fileUploadInput.value = ''; // Reset input selection
    });
  }

  function appendPolaroid(src, caption = '', left = '30%', top = '25%', tilt = '2deg') {
    const card = document.createElement('div');
    card.classList.add('polaroid-card');
    card.style.left = left;
    card.style.top = top;
    card.style.setProperty('--tilt', tilt);

    // Save in active photo object array
    const photoObj = { src, caption, left, top, tilt };
    activePhotos.push(photoObj);

    // Delete Trigger
    const delBtn = document.createElement('button');
    delBtn.classList.add('polaroid-delete-btn');
    delBtn.innerHTML = '&times;';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      card.remove();
      activePhotos = activePhotos.filter(p => p !== photoObj);
    });
    card.appendChild(delBtn);

    // Photo element
    const img = document.createElement('img');
    img.classList.add('polaroid-image');
    img.src = src;
    img.alt = 'Uploaded log image';
    card.appendChild(img);

    // Caption Input
    const captionInp = document.createElement('input');
    captionInp.classList.add('polaroid-caption-input');
    captionInp.type = 'text';
    captionInp.placeholder = 'Add a caption...';
    captionInp.value = caption;
    captionInp.addEventListener('input', () => {
      photoObj.caption = captionInp.value;
    });
    card.appendChild(captionInp);

    // Attach drag pointer event
    setupDragging(card, photoObj);

    attachmentsCanvas.appendChild(card);
  }

  // ---------------------------------------------------------
  // DECORATION STICKERS PLACEMENT
  // ---------------------------------------------------------
  const toolSticker = document.getElementById('tool-sticker');
  if (toolSticker) {
    toolSticker.addEventListener('click', () => {
      stickerSheet.classList.add('active');
    });
  }

  if (btnCloseStickerSheet) {
    btnCloseStickerSheet.addEventListener('click', () => {
      stickerSheet.classList.remove('active');
    });
  }

  stickerButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const stickerEmoji = btn.getAttribute('data-sticker');
      const leftPercent = 40 + Math.random() * 20; // 40% - 60%
      const topPercent = 30 + Math.random() * 20;  // 30% - 50%
      appendSticker(stickerEmoji, `${leftPercent}%`, `${topPercent}%`);
      stickerSheet.classList.remove('active');
    });
  });

  function appendSticker(type, left = '50%', top = '40%') {
    const sticker = document.createElement('div');
    sticker.classList.add('sticker-item');
    sticker.style.left = left;
    sticker.style.top = top;
    sticker.textContent = type;

    const stickerObj = { type, left, top };
    activeDecorations.push(stickerObj);

    // Tap sticker deletion trigger
    const delBtn = document.createElement('button');
    delBtn.classList.add('sticker-delete-trigger');
    delBtn.textContent = 'Remove';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sticker.remove();
      activeDecorations = activeDecorations.filter(d => d !== stickerObj);
    });
    sticker.appendChild(delBtn);

    // Setup dragging
    setupDragging(sticker, stickerObj);

    decorationsCanvas.appendChild(sticker);
  }

  // ---------------------------------------------------------
  // DRAG INTERACTIVE SYSTEM (Pointer Events)
  // ---------------------------------------------------------
  function setupDragging(element, saveObject) {
    let localDragging = false;
    let localStartX = 0;
    let localStartY = 0;

    element.addEventListener('pointerdown', (e) => {
      localDragging = true;
      element.setPointerCapture(e.pointerId);
      
      // Stop keyboard edits click propagation
      e.stopPropagation();

      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement.getBoundingClientRect();
      
      // Calculate coordinates relative to parent canvas
      localStartX = e.clientX - rect.left;
      localStartY = e.clientY - rect.top;
    });

    element.addEventListener('pointermove', (e) => {
      if (!localDragging) return;

      const parentRect = element.parentElement.getBoundingClientRect();
      
      // Move within boundaries
      let x = e.clientX - parentRect.left - localStartX;
      let y = e.clientY - parentRect.top - localStartY;

      const maxX = parentRect.width - element.offsetWidth;
      const maxY = parentRect.height - element.offsetHeight;

      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));

      // Calculate percentage coords to maintain responsiveness
      const leftPercent = (x / parentRect.width) * 100;
      const topPercent = (y / parentRect.height) * 100;

      element.style.left = `${leftPercent}%`;
      element.style.top = `${topPercent}%`;

      // Save updated positions in serializable objects
      saveObject.left = `${leftPercent}%`;
      saveObject.top = `${topPercent}%`;
    });

    element.addEventListener('pointerup', (e) => {
      if (!localDragging) return;
      localDragging = false;
      element.releasePointerCapture(e.pointerId);
    });

    element.addEventListener('pointercancel', (e) => {
      if (!localDragging) return;
      localDragging = false;
      element.releasePointerCapture(e.pointerId);
    });
  }

  // ---------------------------------------------------------
  // VOICE WRITING TRANSCRIPTION MECHANICS
  // ---------------------------------------------------------
  const toolVoice = document.getElementById('tool-voice');
  if (toolVoice) {
    toolVoice.addEventListener('click', () => {
      openVoiceOverlay();
    });
  }

  if (btnStopVoice) {
    btnStopVoice.addEventListener('click', () => {
      closeVoiceOverlay();
    });
  }

  // Setup companion emoji inside mic speech
  const voiceAvatar = document.getElementById('voice-companion-avatar');
  if (voiceAvatar) voiceAvatar.textContent = companionEmoji;

  // Web Speech API setups
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isRecording = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        transcriptionText.textContent = finalTranscript;
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      transcriptionText.textContent = `Speech error occurred: ${event.error}. Please type manually.`;
    };
  }

  function openVoiceOverlay() {
    transcriptionText.textContent = 'Tap the microphone button to start recording. I am listening...';
    voiceOverlay.classList.add('active');
  }

  function closeVoiceOverlay() {
    stopRecording();
    
    // Insert transcribed text into editor if text was recognized
    const textToInsert = transcriptionText.textContent;
    if (textToInsert && textToInsert !== 'Speak now. Your words will appear here...' && !textToInsert.startsWith('Tap the microphone') && !textToInsert.startsWith('Speech error')) {
      textEditor.focus();
      // Simple insert text at end or cursor position
      document.execCommand('insertText', false, '\n' + textToInsert + ' ');
      updateWordCount();
    }

    voiceOverlay.classList.remove('active');
  }

  if (btnMicRecord) {
    btnMicRecord.addEventListener('click', () => {
      if (!isRecording) {
        startRecording();
      } else {
        stopRecording();
      }
    });
  }

  function startRecording() {
    if (!SpeechRecognition) {
      transcriptionText.textContent = 'Voice transcription is not supported by your browser. Please type directly in the editor.';
      return;
    }

    try {
      recognition.start();
      isRecording = true;
      voiceOverlay.classList.add('recording');
      transcriptionText.textContent = 'Listening closely...';
    } catch (e) {
      console.error(e);
    }
  }

  function stopRecording() {
    if (recognition && isRecording) {
      recognition.stop();
      isRecording = false;
      voiceOverlay.classList.remove('recording');
    }
  }

  // ---------------------------------------------------------
  // PRE-SAVE MOOD SELECTION & SAVING DATA
  // ---------------------------------------------------------
  if (btnSaveEntry) {
    btnSaveEntry.addEventListener('click', () => {
      const text = textEditor.innerText || textEditor.textContent;
      const cleanText = text.replace(/Dear\s[a-zA-Z0-9\s]+,?\s*Today.../i, '').trim();
      
      if (!cleanText && activePhotos.length === 0) {
        alert('Please write something or attach a photo before saving!');
        return;
      }

      // Slide up mood before saving popup
      saveMoodOverlay.classList.add('active');
    });
  }

  const popupMoodButtons = document.querySelectorAll('.popup-mood-btn');
  popupMoodButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const moodEmoji = btn.getAttribute('data-mood');
      saveMoodOverlay.classList.remove('active');
      executeSaveEntry(moodEmoji);
    });
  });

  // Overlap close clicks
  if (saveMoodOverlay) {
    saveMoodOverlay.addEventListener('click', (e) => {
      if (e.target === saveMoodOverlay) {
        saveMoodOverlay.classList.remove('active');
      }
    });
  }

  function executeSaveEntry(moodEmoji) {
    const contentHtml = textEditor.innerHTML;
    const pageStyle = document.querySelector('.style-option-btn.active').getAttribute('data-style') || 'classic';
    const fontStyle = document.querySelector('.font-option-btn.active').getAttribute('data-font') || 'dancing';
    
    const textVal = textEditor.innerText || textEditor.textContent;
    const wordCount = textVal.split(/\s+/).filter(w => w.length > 0).length;

    // Date formatting string
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const todayStr = new Date().toLocaleDateString('en-US', options);

    if (editingEntryId) {
      // Find and update existing
      const entry = entries.find(e => e.id === editingEntryId);
      if (entry) {
        entry.content = contentHtml;
        entry.mood = moodEmoji;
        entry.pageStyle = pageStyle;
        entry.font = fontStyle;
        entry.photos = activePhotos;
        entry.decorations = activeDecorations;
        entry.wordCount = wordCount;
      }
    } else {
      // Create new entry
      const newEntry = {
        id: Date.now(),
        content: contentHtml,
        mood: moodEmoji,
        pageStyle: pageStyle,
        font: fontStyle,
        photos: activePhotos,
        decorations: activeDecorations,
        date: todayStr,
        wordCount: wordCount
      };
      entries.push(newEntry);
      
      // ---------------------------------------------------------
      // DYNAMIC STREAKS UPDATE
      // ---------------------------------------------------------
      updateStreaksOnSave();
    }

    // Save back to localStorage
    localStorage.setItem('diary_entries', JSON.stringify(entries));

    // Play Page-Flip Transition Close
    newEntryScreen.classList.add('page-flip-close');
    
    setTimeout(() => {
      closeEditor();
      renderDiaryHome();
    }, 850);
  }

  function updateStreaksOnSave() {
    let writingStreak = parseInt(localStorage.getItem('writingStreak'), 10) || 1;
    
    // Read the date of the last saved entry prior to this one
    if (entries.length > 1) {
      // Sort entries descending to find previous newest
      const sorted = [...entries].sort((a, b) => b.id - a.id);
      const lastEntryDate = new Date(sorted[1].id); // second newest is the previous one
      const today = new Date();

      const timeDiff = today.getTime() - lastEntryDate.getTime();
      const diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));

      if (diffDays === 1) {
        // Increment streak if writing on consecutive days
        writingStreak++;
      } else if (diffDays > 1) {
        // Reset streak to 1 if streak is broken
        writingStreak = 1;
      }
      localStorage.setItem('writingStreak', String(writingStreak));
    }
  }

  // ---------------------------------------------------------
  // ENTRY DETAILED VIEW OVERLAYS
  // ---------------------------------------------------------
  function openDetailView(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    // Load static values
    detailDateLabel.textContent = entry.date;
    detailTextViewer.innerHTML = entry.content;
    detailMoodDisplay.textContent = `Feeling: ${entry.mood || '📝'}`;
    detailWordCount.textContent = `${entry.wordCount || 0} words`;

    // Reset styles
    detailCanvas.className = 'diary-page-canvas'; // Clear old styling classes
    detailCanvas.classList.add(`${entry.pageStyle || 'classic'}-style`);
    
    // Clear and set fonts
    detailTextViewer.className = 'text-editor';
    detailTextViewer.classList.add(`font-${entry.font || 'dancing'}`);

    // Render attachments and stickers static position
    detailAttachments.innerHTML = '';
    if (entry.photos) {
      entry.photos.forEach(photo => {
        const card = document.createElement('div');
        card.classList.add('polaroid-card');
        card.style.left = photo.left;
        card.style.top = photo.top;
        card.style.setProperty('--tilt', photo.tilt);
        card.style.pointerEvents = 'none'; // read-only detail view

        const img = document.createElement('img');
        img.classList.add('polaroid-image');
        img.src = photo.src;
        card.appendChild(img);

        if (photo.caption) {
          const caption = document.createElement('p');
          caption.classList.add('polaroid-caption-input');
          caption.textContent = photo.caption;
          caption.style.border = 'none';
          card.appendChild(caption);
        }

        detailAttachments.appendChild(card);
      });
    }

    detailDecorations.innerHTML = '';
    if (entry.decorations) {
      entry.decorations.forEach(dec => {
        const sticker = document.createElement('div');
        sticker.classList.add('sticker-item');
        sticker.style.left = dec.left;
        sticker.style.top = dec.top;
        sticker.textContent = dec.type;
        sticker.style.pointerEvents = 'none'; // read-only

        detailDecorations.appendChild(sticker);
      });
    }

    // Save dynamic editing tracking id
    btnEditEntry.onclick = () => {
      entryDetailScreen.classList.remove('active');
      openEditor(entry.id);
    };

    entryDetailScreen.classList.add('active');
  }

  if (btnCloseDetail) {
    btnCloseDetail.addEventListener('click', () => {
      entryDetailScreen.classList.remove('active');
    });
  }

  // ---------------------------------------------------------
  // FLOATING DRAGGABLE COMPANION (POINTER EVENTS - COPY FROM HOME)
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
});
