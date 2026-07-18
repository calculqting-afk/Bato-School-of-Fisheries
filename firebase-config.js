import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyChLolR5aH0xUWUyZDyKlI1hGmvtlA0XCU",
  authDomain: "school-website-6fb38.firebaseapp.com",
  projectId: "school-website-6fb38",
  storageBucket: "school-website-6fb38.firebasestorage.app",
  messagingSenderId: "465449069759",
  appId: "1:465449069759:web:16246e322e244d26fbaa0a",
  measurementId: "G-ENKETDD734"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
