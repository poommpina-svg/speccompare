import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig, firebaseConfigured } from "./firebase-config.js?v=20260803-1";

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

export async function registerWithEmail(displayName, email, password) {
  const services = requireFirebase();
  const credential = await createUserWithEmailAndPassword(
    services.auth,
    email,
    password
  );

  const cleanName = String(displayName || "").trim();
  if (cleanName) {
    await updateProfile(credential.user, { displayName: cleanName });
  }

  await setDoc(
    doc(services.db, "users", credential.user.uid),
    {
      displayName: cleanName,
      email: credential.user.email || email,
      role: "viewer",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return credential;
}

export async function logout() {
  const services = requireFirebase();
  return signOut(services.auth);
}
