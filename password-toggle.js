/**
 * password-toggle.js — Reusable Password Visibility Toggle for NINNADA'26 System
 * Features:
 * - Toggles password input type between 'password' and 'text'.
 * - Swaps Eye and Eye-Slash icons dynamically.
 * - Updates aria-label for accessibility ('Show password' / 'Hide password').
 * - Supports keyboard navigation (Tab, Space, Enter).
 * - Independent execution for multiple password fields per page.
 */

function togglePasswordVisibility(targetInputId, btnElement) {
    // Resolve button element (handles child clicks like svg/path)
    const btn = btnElement ? (btnElement.closest('.password-toggle-btn') || btnElement) : null;
    let input = null;

    if (typeof targetInputId === 'string') {
        input = document.getElementById(targetInputId);
    } else if (targetInputId instanceof HTMLElement) {
        input = targetInputId;
    }

    if (!input && btn) {
        const wrapper = btn.closest('.password-toggle-wrapper');
        if (wrapper) {
            input = wrapper.querySelector('input');
        }
    }

    if (!input) return;

    const isPassword = (input.type === 'password');

    // Toggle input type
    input.type = isPassword ? 'text' : 'password';

    // Update button accessibility and icon states
    if (btn) {
        const newLabel = isPassword ? 'Hide password' : 'Show password';
        btn.setAttribute('aria-label', newLabel);
        btn.setAttribute('title', newLabel);

        const eyeIcon = btn.querySelector('.eye-icon');
        const eyeSlashIcon = btn.querySelector('.eye-slash-icon');

        if (eyeIcon && eyeSlashIcon) {
            if (isPassword) {
                eyeIcon.classList.add('hidden');
                eyeSlashIcon.classList.remove('hidden');
            } else {
                eyeIcon.classList.remove('hidden');
                eyeSlashIcon.classList.add('hidden');
            }
        }
    }
}

// Make function accessible globally for inline onclick handlers
window.togglePasswordVisibility = togglePasswordVisibility;

// Auto-initialize all .password-toggle-btn elements on page load
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtns = document.querySelectorAll('.password-toggle-btn');
    toggleBtns.forEach(btn => {
        // Ensure button never triggers form submission
        btn.setAttribute('type', 'button');

        // Only attach click listener if NOT using inline onclick handler and NOT already bound
        if (!btn.hasAttribute('onclick') && !btn.getAttribute('data-bound')) {
            btn.setAttribute('data-bound', 'true');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target-id');
                const wrapper = btn.closest('.password-toggle-wrapper');
                const input = targetId ? document.getElementById(targetId) : (wrapper ? wrapper.querySelector('input') : null);
                togglePasswordVisibility(input, btn);
            });
        }
    });
});
