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
});
