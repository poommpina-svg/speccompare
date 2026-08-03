export const firebaseConfig = {
  apiKey: "AIzaSyBhQCMfpWAlXuIOJ-pBCy8y1kM74bthQ10",
  authDomain: "speccompare-fa173.firebaseapp.com",
  projectId: "speccompare-fa173",
  storageBucket: "speccompare-fa173.firebasestorage.app",
  messagingSenderId: "570959194372",
  appId: "1:570959194372:web:4cbbcf746c85531db88851",
  measurementId: "G-NS83NTTTFT"
};

export const firebaseConfigured = Object.values(firebaseConfig).every(
  (value) =>
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("PASTE_")
);
