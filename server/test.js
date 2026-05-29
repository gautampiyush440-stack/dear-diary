const { fork } = require('child_process');
const path = require('path');

// 1. Spin up the Express server as a child process
const serverPath = path.join(__dirname, 'server.js');
console.log('🔄 Starting local server process for verification testing...');
const serverProcess = fork(serverPath, [], { silent: true });

let serverOutput = '';
serverProcess.stdout.on('data', (data) => {
  serverOutput += data.toString();
  console.log(`[Server]: ${data.toString().trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[Server Error]: ${data.toString().trim()}`);
});

// Wait 2.5 seconds for the database and server listener to initialize
setTimeout(async () => {
  try {
    console.log('\n🧪 Beginning API Route Validation Tests...');
    await runTests();
    console.log('\n✔ All tests passed successfully! Closing server process.');
    serverProcess.kill();
    process.exit(0);
  } catch (err) {
    console.error('\n✘ Verification test suite failed:', err);
    serverProcess.kill();
    process.exit(1);
  }
}, 2500);

// Helper base url
const BASE_URL = 'http://localhost:5000';

async function runTests() {
  const testUsername = `user_${Date.now()}`;
  const testPassword = 'super-secure-password-123';
  let jwtToken = '';
  let entryId = null;

  // TEST 1: User Signup
  console.log('\nTEST 1: User Signup...');
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: testPassword,
      diaryName: 'My Secret Journal',
      companionName: 'Ollie',
      companionEmoji: '🦉'
    })
  });
  const signupData = await signupRes.json();
  if (signupRes.status !== 201 || !signupData.token) {
    throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);
  }
  console.log('✔ Signup successful. Received user context.');

  // TEST 2: User Login
  console.log('\nTEST 2: User Login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: testPassword
    })
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  jwtToken = loginData.token;
  console.log('✔ Login successful. JWT token extracted.');

  const authHeaders = {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  };

  // TEST 3: Fetch Current User Profile
  console.log('\nTEST 3: Get User profile...');
  const profileRes = await fetch(`${BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: authHeaders
  });
  const profileData = await profileRes.json();
  if (profileRes.status !== 200 || profileData.username !== testUsername) {
    throw new Error(`Fetch profile failed: ${JSON.stringify(profileData)}`);
  }
  console.log(`✔ Profile loaded. Username: ${profileData.username}, Coins: ${profileData.coins}, Streak: ${profileData.streak}`);

  // TEST 4: Create Diary Entry with Attachments
  console.log('\nTEST 4: Creating Diary Entry with Polaroid and Sticker...');
  const entryRes = await fetch(`${BASE_URL}/api/entries`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      content: 'Today was an outstanding day. I spent it learning backend development.',
      mood: '😄',
      pageStyle: 'classic',
      font: 'dancing',
      wordCount: 11,
      photos: [
        {
          src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // mock 1x1 black pixel base64
          caption: 'Local server testing!',
          left: '35%',
          top: '20%',
          tilt: '-3deg'
        }
      ],
      decorations: [
        {
          type: '📌',
          left: '42%',
          top: '38%'
        }
      ]
    })
  });
  const entryData = await entryRes.json();
  if (entryRes.status !== 201 || !entryData.entry.id) {
    throw new Error(`Creating entry failed: ${JSON.stringify(entryData)}`);
  }
  entryId = entryData.entry.id;
  console.log(`✔ Diary entry saved. ID: ${entryId}, WordCount: ${entryData.entry.wordCount}, Streak: ${entryData.streak}`);

  // TEST 5: Fetch Diary Entries (CRUD Read)
  console.log('\nTEST 5: Retrieving Entries...');
  const listRes = await fetch(`${BASE_URL}/api/entries`, {
    method: 'GET',
    headers: authHeaders
  });
  const listData = await listRes.json();
  if (listRes.status !== 200 || listData.length === 0) {
    throw new Error(`Retrieving entries failed: ${JSON.stringify(listData)}`);
  }
  const verifiedEntry = listData.find(e => e.id === entryId);
  if (!verifiedEntry || verifiedEntry.Polaroids.length !== 1 || verifiedEntry.Stickers.length !== 1) {
    throw new Error('Nested Polaroid/Sticker attachments check failed.');
  }
  console.log(`✔ Retrieval complete. Loaded ${listData.length} entries, successfully verified nested attachments.`);

  // TEST 6: Get Daily Challenge and timer
  console.log('\nTEST 6: Retrieving Daily Challenge...');
  const challengeRes = await fetch(`${BASE_URL}/api/games/challenge`, {
    method: 'GET',
    headers: authHeaders
  });
  const challengeData = await challengeRes.json();
  if (challengeRes.status !== 200 || !challengeData.challenge) {
    throw new Error(`Challenge loading failed: ${JSON.stringify(challengeData)}`);
  }
  console.log(`✔ Challenge loaded: "${challengeData.challenge}", Resets in: ${challengeData.resetsInSeconds}s`);

  // TEST 7: Post Game reward coins
  console.log('\nTEST 7: Awarding Game coins...');
  const rewardRes = await fetch(`${BASE_URL}/api/games/reward`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      amount: 15,
      source: 'Memory Match'
    })
  });
  const rewardData = await rewardRes.json();
  if (rewardRes.status !== 200 || rewardData.coins !== 15) {
    throw new Error(`Rewarding coins failed: ${JSON.stringify(rewardData)}`);
  }
  console.log(`✔ Rewarded 15 coins for Memory Match. New Balance: ${rewardData.coins}`);

  // TEST 8: Upload Memory Snap and Check Streak
  console.log('\nTEST 8: Uploading snap snapshot...');
  const snapRes = await fetch(`${BASE_URL}/api/snaps`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      date: new Date().toISOString().split('T')[0]
    })
  });
  const snapData = await snapRes.json();
  if (snapRes.status !== 201 || !snapData.snap.id) {
    throw new Error(`Uploading snap failed: ${JSON.stringify(snapData)}`);
  }
  console.log(`✔ Snapshot uploaded. Date: ${snapData.snap.date}, Snap Streak calculated: ${snapData.streak}`);

  // TEST 9: Companion Chat AI simulator
  console.log('\nTEST 9: Sending chat prompt to owl Ollie companion...');
  const chatRes = await fetch(`${BASE_URL}/api/companion/chat`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      message: 'I had an awesome and happy day today!'
    })
  });
  const chatData = await chatRes.json();
  if (chatRes.status !== 200 || !chatData.reply) {
    throw new Error(`Companion chat failed: ${JSON.stringify(chatData)}`);
  }
  console.log(`✔ Companion Reply: "${chatData.reply}"`);

  // TEST 10: Mock Payment Checkout & Upgrade Premium
  console.log('\nTEST 10: Simulating Premium billing upgrade...');
  const checkoutRes = await fetch(`${BASE_URL}/api/payments/checkout`, {
    method: 'POST',
    headers: authHeaders
  });
  const checkoutData = await checkoutRes.json();
  if (checkoutRes.status !== 200 || !checkoutData.sessionId) {
    throw new Error(`Checkout session failed: ${JSON.stringify(checkoutData)}`);
  }
  console.log(`✔ Checkout session initialized: ${checkoutData.sessionId}`);

  const confirmRes = await fetch(`${BASE_URL}/api/payments/confirm`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sessionId: checkoutData.sessionId
    })
  });
  const confirmData = await confirmRes.json();
  if (confirmRes.status !== 200 || confirmData.user.isPremium !== true) {
    throw new Error(`Upgrade confirmation failed: ${JSON.stringify(confirmData)}`);
  }
  console.log(`✔ Payment confirmed. User account upgraded: isPremium = ${confirmData.user.isPremium}`);
}
