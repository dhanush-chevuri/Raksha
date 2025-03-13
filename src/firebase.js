import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAYLX_rj_r5_E03vDM0ny7MC0d4tK4M_VI",
  authDomain: "greywater-testing-kit.firebaseapp.com",
  databaseURL: "https://greywater-testing-kit-default-rtdb.firebaseio.com",
  projectId: "greywater-testing-kit",
  storageBucket: "greywater-testing-kit.firebasestorage.app",
  messagingSenderId: "297626924603",
  appId: "1:297626924603:web:b59f691041dfa2860a4e1e",
  measurementId: "G-E1S4MN3M1K"
};

// Initialize Firebase app (only if it hasn't been initialized yet)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);  // Use the initialized app for auth
const googleProvider = new GoogleAuthProvider();

const database = getDatabase(app);  // Use the initialized app for database

export {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  database,
};