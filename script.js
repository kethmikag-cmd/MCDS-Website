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

    // Close mobile menu on tab switch
    const navLinks = document.getElementById('nav-links');
    const hamburger = document.getElementById('hamburger-btn');
    if (navLinks && hamburger) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
    }

    // Scroll to top when switching tabs (unless handled by scrollToSection)
    window.scrollTo(0, 0);
}

function scrollToSection(sectionId) {
    // Ensure the tab is switched before scrolling
    // (Handled by the onclick handler calling showTab first)

    // Small delay to allow DOM update before scrolling
    setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }, 10);
}

// Initialize: Show Home tab by default
document.addEventListener('DOMContentLoaded', () => {
    showTab('home');

    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            hamburger.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }
});
