// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDN1zqnDrGqZ79L7wDEjglYDJhYDMuPFs4",
  authDomain: "dear-diary-ce151.firebaseapp.com",
  projectId: "dear-diary-ce151",
  storageBucket: "dear-diary-ce151.firebasestorage.app",
  messagingSenderId: "1091540975663",
  appId: "1:1091540975663:web:1b0224560f95fe6c4686da",
  measurementId: "G-GMWZ4GG2XY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Patch user object to support Namespaced User.updateProfile()
const wrapUser = (user) => {
  if (!user) return user;
  if (!user.updateProfile) {
    user.updateProfile = (profile) => updateProfile(user, profile);
  }
  return user;
};

// Global Firebase Namespaced Interface Wrapper
window.firebase = {
  app: () => app,
  analytics: () => analytics,
  auth: () => {
    return {
      get currentUser() {
        return wrapUser(auth.currentUser);
      },
      signInWithEmailAndPassword: (email, password) => 
        signInWithEmailAndPassword(auth, email, password).then((cred) => {
          if (cred.user) wrapUser(cred.user);
          return cred;
        }),
      createUserWithEmailAndPassword: (email, password) => 
        createUserWithEmailAndPassword(auth, email, password).then((cred) => {
          if (cred.user) wrapUser(cred.user);
          return cred;
        }),
      onAuthStateChanged: (callback) => 
        onAuthStateChanged(auth, (user) => {
          if (user) wrapUser(user);
          callback(user);
        }),
      sendPasswordResetEmail: (email) => sendPasswordResetEmail(auth, email),
      signOut: () => signOut(auth)
    };
  }
};
