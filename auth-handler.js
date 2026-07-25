import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

document.addEventListener("DOMContentLoaded", () => {
    const authContainer = document.getElementById("header-auth");
    if (!authContainer) return;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in. Retrieve metadata from cache or firestore.
            let schoolName = sessionStorage.getItem("cached_school_name");
            let coordinatorName = sessionStorage.getItem("cached_coordinator_name");

            if (!schoolName || !coordinatorName) {
                try {
                    // Query schools collection to find the coordinator's school
                    const q = query(collection(db, "schools"), where("firebaseUID", "==", user.uid));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const schoolDoc = querySnapshot.docs[0];
                        const schoolData = schoolDoc.data();
                        schoolName = schoolData.schoolName;
                        coordinatorName = schoolData.coordinatorName;
                        
                        // Save in sessionStorage to prevent reads on next page loads
                        sessionStorage.setItem("cached_school_name", schoolName);
                        sessionStorage.setItem("cached_coordinator_name", coordinatorName);
                    }
                } catch (err) {
                    console.error("Error fetching school details for header:", err);
                }
            }

            const initial = schoolName ? schoolName[0].toUpperCase() : "S";

            // Render profile circle and dropdown with school name only
            authContainer.innerHTML = `
                <div class="profile-container" id="profile-container">
                    <button class="profile-circle" id="profile-btn" aria-label="Toggle profile menu">
                        ${initial}
                    </button>
                    <div class="profile-dropdown" id="profile-dropdown">
                        <div class="profile-dropdown-info">
                            <div class="profile-school-name" title="${schoolName || 'School'}">${schoolName || "My School"}</div>
                        </div>
                        <div class="profile-dropdown-divider"></div>
                        <a href="dashboard.html" class="profile-dropdown-item">Dashboard</a>
                        <button id="header-signout-btn" class="profile-dropdown-item signout-btn">Sign Out</button>
                    </div>
                </div>
            `;

            // Setup profile menu toggle
            const profileBtn = document.getElementById("profile-btn");
            const profileDropdown = document.getElementById("profile-dropdown");

            if (profileBtn && profileDropdown) {
                profileBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    profileDropdown.classList.toggle("open");
                });

                // Close on click outside
                document.addEventListener("click", (e) => {
                    if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
                        profileDropdown.classList.remove("open");
                    }
                });
            }

            // Setup signout
            const signoutBtn = document.getElementById("header-signout-btn");
            if (signoutBtn) {
                signoutBtn.addEventListener("click", async () => {
                    try {
                        await signOut(auth);
                        // Clear session storage on sign out
                        sessionStorage.removeItem("cached_school_name");
                        sessionStorage.removeItem("cached_coordinator_name");
                        window.location.href = "index.html";
                    } catch (err) {
                        console.error("Error signing out:", err);
                    }
                });
            }
        } else {
            // User is signed out. Clear cache and show Sign In button
            sessionStorage.removeItem("cached_school_name");
            sessionStorage.removeItem("cached_coordinator_name");

            authContainer.innerHTML = `
                <a href="login.html" class="header-signin-btn">Sign In</a>
            `;
        }
    });
});
