// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyChk85PHMlKF5SFGwXSITg0u2QoE2azkws",
    authDomain: "aditha-ca321.firebaseapp.com",
    databaseURL: "https://aditha-ca321.firebaseio.com",
    projectId: "aditha-ca321",
    storageBucket: "aditha-ca321.firebasestorage.app",
    messagingSenderId: "359615698823",
    appId: "1:359615698823:web:359465a9f94fdb3caee522",
    measurementId: "G-1QZQK8F8EZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

// Initialize Firestore
const db = getFirestore(app);

// Auto-load stats for the homepage
(async function loadHomepageStats() {
    try {
        const contestantsEl = document.getElementById("stat-contestants");
        const schoolsEl = document.getElementById("stat-schools");

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

// Export the instances
export { app, analytics, database, db };

