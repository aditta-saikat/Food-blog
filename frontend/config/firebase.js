// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAQDLE2dCPbWubSu-_Wa44gGPpTyH1_ZOA",
  authDomain: "foodblog-313a0.firebaseapp.com",
  projectId: "foodblog-313a0",
  storageBucket: "foodblog-313a0.firebasestorage.app",
  messagingSenderId: "674297023948",
  appId: "1:674297023948:web:1e7e823d0ff97a7948e169",
  measurementId: "G-ZCTFJM4C1M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


export { auth, googleProvider };