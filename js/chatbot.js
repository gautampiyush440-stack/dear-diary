(function() {
  // 1. Inject Styles
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    /* Floating chat button */
    #dia-chat-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #C9A84C;
      color: #1A0A00;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      cursor: pointer;
      z-index: 999999;
      transition: transform 0.3s ease, background-color 0.3s ease;
      border: none;
      outline: none;
    }
    #dia-chat-button:hover {
      transform: scale(1.1);
      background-color: #FFD700;
    }

    /* Chat window */
    #dia-chat-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 350px;
      max-width: calc(100vw - 40px);
      height: 480px;
      max-height: calc(100vh - 120px);
      background-color: #1A0A00;
      border: 1px solid #C9A84C;
      border-radius: 15px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      font-family: 'Lato', system-ui, -apple-system, sans-serif;
    }
    #dia-chat-window.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* Chat header */
    .dia-chat-header {
      background: linear-gradient(135deg, #2E1905, #1C0A00);
      border-bottom: 1px solid #C9A84C;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .dia-chat-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .dia-chat-avatar {
      font-size: 24px;
    }
    .dia-chat-title {
      color: #C9A84C;
      font-weight: bold;
      font-size: 18px;
      margin: 0;
      font-family: 'Dancing Script', cursive, 'Playfair Display', serif;
    }
    .dia-chat-subtitle {
      color: #B8860B;
      font-size: 11px;
      margin: 2px 0 0 0;
    }
    .dia-chat-close {
      background: none;
      border: none;
      color: #C9A84C;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      outline: none;
      transition: color 0.2s ease;
      line-height: 1;
    }
    .dia-chat-close:hover {
      color: #FFD700;
    }

    /* Chat messages */
    .dia-chat-messages {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background-color: #100600;
    }
    .dia-chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    .dia-chat-messages::-webkit-scrollbar-thumb {
      background-color: #C9A84C;
      border-radius: 3px;
    }

    /* Message bubbles */
    .dia-message {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
      animation: dia-fade-in 0.25s ease-out;
    }
    .dia-message.user {
      align-self: flex-end;
      background-color: #C9A84C;
      color: #1A0A00;
      border-bottom-right-radius: 2px;
    }
    .dia-message.companion {
      align-self: flex-start;
      background-color: #1C0A00;
      color: #FFF;
      border: 1px solid #C9A84C;
      border-bottom-left-radius: 2px;
    }

    /* Typing indicator */
    .dia-typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      background-color: #1C0A00;
      border: 1px solid #C9A84C;
      border-radius: 12px;
      border-bottom-left-radius: 2px;
      align-self: flex-start;
      max-width: 80%;
      animation: dia-fade-in 0.25s ease-out;
    }
    .dia-dot {
      width: 6px;
      height: 6px;
      background-color: #C9A84C;
      border-radius: 50%;
      animation: dia-bounce 1.4s infinite ease-in-out both;
    }
    .dia-dot:nth-child(1) { animation-delay: -0.32s; }
    .dia-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes dia-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    @keyframes dia-fade-in {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Input area */
    .dia-chat-input-area {
      padding: 12px;
      background-color: #1A0A00;
      border-top: 1px solid #C9A84C;
      display: flex;
      gap: 8px;
    }
    .dia-chat-input {
      flex: 1;
      background-color: #2E1905;
      border: 1px solid #C9A84C;
      border-radius: 8px;
      padding: 8px 12px;
      color: #FFF;
      font-size: 14px;
      outline: none;
    }
    .dia-chat-input:focus {
      border-color: #FFD700;
    }
    .dia-chat-input::placeholder {
      color: #B8860B;
    }
    .dia-chat-send {
      background-color: #C9A84C;
      color: #1A0A00;
      border: none;
      border-radius: 8px;
      width: 40px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      outline: none;
      transition: background-color 0.2s ease;
    }
    .dia-chat-send:hover {
      background-color: #FFD700;
    }
  `;
  document.head.appendChild(styleEl);

  // 2. Inject Widget HTML
  const widgetContainer = document.createElement('div');
  widgetContainer.innerHTML = `
    <button id="dia-chat-button">💬</button>
    <div id="dia-chat-window">
      <div class="dia-chat-header">
        <div class="dia-chat-header-info">
          <span class="dia-chat-avatar">🦉</span>
          <div>
            <h4 class="dia-chat-title">Dia</h4>
            <p class="dia-chat-subtitle">Empathetic Companion</p>
          </div>
        </div>
        <button class="dia-chat-close">&times;</button>
      </div>
      <div class="dia-chat-messages" id="dia-chat-messages-container">
        <!-- Messages will be populated here -->
      </div>
      <div class="dia-chat-input-area">
        <input type="text" class="dia-chat-input" placeholder="Type a message..." id="dia-chat-input-field" />
        <button class="dia-chat-send" id="dia-chat-send-btn">➔</button>
      </div>
    </div>
  `;
  document.body.appendChild(widgetContainer);

  // 3. State and DOM Selectors
  const chatButton = document.getElementById('dia-chat-button');
  const chatWindow = document.getElementById('dia-chat-window');
  const closeBtn = chatWindow.querySelector('.dia-chat-close');
  const messagesContainer = document.getElementById('dia-chat-messages-container');
  const inputField = document.getElementById('dia-chat-input-field');
  const sendBtn = document.getElementById('dia-chat-send-btn');
  
  let welcomeSent = false;

  // 4. Toggle Chat Window
  chatButton.addEventListener('click', () => {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
      inputField.focus();
      if (!welcomeSent) {
        addMessage("Hello! I am Dia, your diary companion. I'm here to listen, reflect, and support you. How are you feeling today? 🤎", 'companion');
        welcomeSent = true;
      }
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('open');
  });

  // 5. Message Handling functions
  function addMessage(text, sender) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('dia-message', sender);
    messageEl.textContent = text;
    messagesContainer.appendChild(messageEl);
    scrollToBottom();
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // 6. Typing Indicator
  let typingIndicatorEl = null;

  function showTypingIndicator() {
    if (typingIndicatorEl) return;
    typingIndicatorEl = document.createElement('div');
    typingIndicatorEl.classList.add('dia-typing-indicator');
    typingIndicatorEl.innerHTML = `
      <div class="dia-dot"></div>
      <div class="dia-dot"></div>
      <div class="dia-dot"></div>
    `;
    messagesContainer.appendChild(typingIndicatorEl);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    if (typingIndicatorEl) {
      typingIndicatorEl.remove();
      typingIndicatorEl = null;
    }
  }

  // 7. Send Message Flow
  async function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    // Add User Message
    addMessage(text, 'user');
    inputField.value = '';

    // Show Typing Indicator
    showTypingIndicator();

    try {
      const response = await fetch('https://dear-diary-production.up.railway.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: text })
      });

      removeTypingIndicator();

      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      const data = await response.json();
      const reply = data.reply || "I'm listening. Please continue.";
      addMessage(reply, 'companion');
    } catch (err) {
      console.error(err);
      removeTypingIndicator();
      addMessage("Sorry, I'm having trouble connecting right now. I'm still here for you, though. 🤎", 'companion');
    }
  }

  // 8. Event listeners for sending
  sendBtn.addEventListener('click', sendMessage);
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

})();
