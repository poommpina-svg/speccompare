import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig, firebaseConfigured } from "./firebase-config.js";

let app = null;
let auth = null;
let db = null;

if (firebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db, firebaseConfigured, onAuthStateChanged };

export function requireFirebase() {
  if (!firebaseConfigured || !app || !auth || !db) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า Firebase กรุณาตรวจไฟล์ frontend/js/firebase-config.js"
    );
  }
  return { app, auth, db };
}

export async function loginWithEmail(email, password) {
  const services = requireFirebase();
  return signInWithEmailAndPassword(services.auth, email, password);
}

export async function logout() {
  const services = requireFirebase();
  return signOut(services.auth);
}
