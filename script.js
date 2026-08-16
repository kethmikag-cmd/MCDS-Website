// ── Shared helper: is the current page index.html? ────────────────────────
function isIndexPage() {
    return window.location.pathname.endsWith('index.html') ||
        window.location.pathname.endsWith('/') ||
        (!window.location.pathname.endsWith('.html') &&
            !window.location.pathname.includes('ninnada') &&
            !window.location.pathname.includes('admin') &&
            !window.location.pathname.includes('registration'));
}

// ── Tab switching (Publications, Contact, Home, Ninnada) ──────────────────
function showTab(tabId) {
    // 'about' is now embedded in the Home page — delegate to goToAbout()
    if (tabId === 'about') {
        goToAbout();
        return;
    }

    if (!isIndexPage()) {
        sessionStorage.setItem('openTab', tabId);
        window.location.href = 'index.html';
        return;
    }

    // Hide all tab content
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('active');
    });

    // Show the selected tab content
    const selectedTab = document.getElementById(tabId + '-content');
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
        selectedTab.classList.add('active');
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Update logo text, styling, and behavior based on the active tab
    const logo = document.querySelector('.logo');
    if (logo) {
        if (tabId === 'ninnada') {
            logo.textContent = "Ninnada'26";
            logo.className = "logo logo-ninnada";
            logo.setAttribute('onclick', "showTab('ninnada'); return false;");
        } else {
            logo.textContent = "MCDSSC";
            logo.className = "logo";
            logo.setAttribute('onclick', "showTab('home'); return false;");
        }
    }

    // Close mobile menu on tab switch
    closeMobileMenu();

    // Scroll to top when switching tabs (unless handled by scrollToSection)
    window.scrollTo({ top: 0, behavior: 'instant' });
}

// ── About Us navigation: scroll on Home, or navigate then scroll ──────────
function goToAbout(sectionId) {
    const target = sectionId || 'about-us-anchor';

    if (!isIndexPage()) {
        // Store intent and navigate to index
        sessionStorage.setItem('openTab', 'home');
        sessionStorage.setItem('scrollToSection', target);
        window.location.href = 'index.html';
        return;
    }

    // Already on Home — ensure home tab is visible, then smooth-scroll
    showTab('home');
    setTimeout(() => {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
}

// ── Scroll to a section by ID (used by Publications dropdown etc.) ─────────
function scrollToSection(sectionId) {
    if (!isIndexPage()) {
        sessionStorage.setItem('scrollToSection', sectionId);
        return;
    }

    // Small delay to allow DOM update before scrolling
    setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }, 10);
    // Also close the mobile menu
    closeMobileMenu();
}

function closeMobileMenu() {
    const navLinks = document.getElementById('nav-links');
    const hamburger = document.getElementById('hamburger-btn');
    if (navLinks && hamburger) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
    }
}

// ── Initialize: Show Home tab or previously requested tab ─────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (isIndexPage()) {
        let tabToOpen = sessionStorage.getItem('openTab') || 'home';
        sessionStorage.removeItem('openTab');

        // 'about' is now part of Home — treat it as 'home' and scroll after
        if (tabToOpen === 'about') {
            tabToOpen = 'home';
            // Only set scroll target if none is already pending
            if (!sessionStorage.getItem('scrollToSection')) {
                sessionStorage.setItem('scrollToSection', 'about-us-anchor');
            }
        }

        showTab(tabToOpen);

        // Check if we need to scroll to a specific section
        const sectionToScroll = sessionStorage.getItem('scrollToSection');
        if (sectionToScroll) {
            sessionStorage.removeItem('scrollToSection');
            scrollToSection(sectionToScroll);
        }
    }

    // ── Hamburger menu toggle ──────────────────────────────────────────────
    const hamburger = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = navLinks.classList.toggle('open');
            hamburger.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close menu when clicking outside of it
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                closeMobileMenu();
            }
        });

        // Close menu when any link is clicked on mobile
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                // Small delay to let the onclick handler run first
                setTimeout(closeMobileMenu, 50);
            });
        });
    }

    // ── Scroll reveal observer for .reveal-on-scroll ───────────────────────
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.01, rootMargin: '0px 0px -80px 0px' });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        revealObserver.observe(el);
    });

    window.addEventListener("load", () => {

        const preloader = document.getElementById("preloader");

        // Wait a little so the animation completes
        setTimeout(() => {

            preloader.classList.add("hidden");

            setTimeout(() => {
                preloader.remove();
            }, 800);

        }, 2200);

    });
});
