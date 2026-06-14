function showTab(tabId) {
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
            logo.textContent = "MCDS";
            logo.className = "logo";
            logo.setAttribute('onclick', "showTab('home'); return false;");
        }
    }

    // Close mobile menu on tab switch
    closeMobileMenu();

    // Scroll to top when switching tabs (unless handled by scrollToSection)
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function scrollToSection(sectionId) {
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

// Initialize: Show Home tab or previously requested tab
document.addEventListener('DOMContentLoaded', () => {
    const tabToOpen = sessionStorage.getItem('openTab') || 'home';
    sessionStorage.removeItem('openTab');
    showTab(tabToOpen);

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

        // Close menu when a dropdown link is clicked on mobile
        navLinks.querySelectorAll('.dropdown li a').forEach(link => {
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
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        revealObserver.observe(el);
    });
});
