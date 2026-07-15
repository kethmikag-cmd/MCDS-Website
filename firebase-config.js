// firebase-config.js — Single source of truth for Firebase initialization.
// Only initializes: Firebase App, Firebase Authentication, Firestore.
// Analytics and Realtime Database are NOT used in this project.

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyChk85PHMlKF5SFGwXSITg0u2QoE2azkws",
    authDomain: "aditha-ca321.firebaseapp.com",
    projectId: "aditha-ca321",
    storageBucket: "aditha-ca321.firebasestorage.app",
    messagingSenderId: "359615698823",
    appId: "1:359615698823:web:359465a9f94fdb3caee522"
};

// Guard against duplicate initialization (e.g. when multiple modules import this file)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Single instances — imported and shared across all pages
const db  = getFirestore(app);
const auth = getAuth(app);

// Auto-load stats for the homepage (only runs when the stat elements exist)
(async function loadHomepageStats() {
    try {
        const contestantsEl = document.getElementById("stat-contestants");
        const schoolsEl     = document.getElementById("stat-schools");

        if (contestantsEl || schoolsEl) {
            const statsDoc = await getDoc(doc(db, "stats", "overview"));
            if (statsDoc.exists()) {
                const data = statsDoc.data();
                if (contestantsEl && data.contestantCount !== undefined) {
                    contestantsEl.textContent = data.contestantCount + "+";
                }
                if (schoolsEl && data.schoolCount !== undefined) {
                    schoolsEl.textContent = data.schoolCount + "+";
                }
            }
        }
    } catch (err) {
        console.error("Error loading homepage stats:", err);
    }
})();

export { app, db, auth };
