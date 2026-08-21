// contacts.js — Logic for NINNADA'26 Contacts Portal

import { db, auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

// ── Application State ─────────────────────────────────────────────────────
let allSchoolsData = []; // Cached in-memory full list of schools from Firestore
let filteredSchoolsData = []; // Active filtered and sorted dataset
let currentPage = 1;
const pageSize = 25;

let currentSortKey = 'schoolName'; // Default initial sort column
let currentSortOrder = 'asc';        // Default sort direction: ascending

// Header checkboxes dictate which columns are included in exports (all enabled by default)
const exportColumnConfig = [
    { key: 'schoolName', label: 'School', sortable: true },
    { key: 'ticName', label: 'Teacher-in-Charge', sortable: true },
    { key: 'ticPhone', label: 'TIC Contact', sortable: false },
    { key: 'coordinatorName', label: 'Coordinator', sortable: true },
    { key: 'coordinatorPhone', label: 'Coordinator Contact', sortable: false },
    { key: 'coordinatorEmail', label: 'Coordinator Email', sortable: true },
    { key: 'requiresInvitation', label: 'Invitation Required?', sortable: false }
];

let selectedExportColumns = {
    schoolName: true,
    ticName: true,
    ticPhone: true,
    coordinatorName: true,
    coordinatorPhone: true,
    coordinatorEmail: true,
    requiresInvitation: true
};

// ── DOM Element References ────────────────────────────────────────────────
let loginContainer, dashboardContainer, logoutBtn;
let loginForm, loginEmail, loginPassword, loginError, loginSubmitBtn;
let filterSearchInput, btnClearSearch, btnRefresh, btnOpenExport;
let dateOrderFilter
let contactsTbody, contactsMobileCards;
let currentPageNum, paginationInfo, btnPrev, btnNext, pageIndicator;
let metricTotalSchools, metricFilteredSchools;
let exportModal, btnCloseExport, btnCancelExport, btnExecuteExport, exportScope, exportFormat, exportColumnsCount;

// ── Initialization ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    bindDOM();
    setupEventListeners();
    setupAuthWatcher();
});

function bindDOM() {
    loginContainer = document.getElementById('login-container');
    dashboardContainer = document.getElementById('dashboard-container');
    logoutBtn = document.getElementById('logout-btn');

    loginForm = document.getElementById('login-form');
    loginEmail = document.getElementById('login-email');
    loginPassword = document.getElementById('login-password');
    loginError = document.getElementById('login-error');
    loginSubmitBtn = document.getElementById('login-submit-btn');

    filterSearchInput = document.getElementById('filter-search');
    dateOrderFilter = document.getElementById('filter-date-order');
    btnClearSearch = document.getElementById('btn-clear-search');
    btnRefresh = document.getElementById('btn-refresh');
    btnOpenExport = document.getElementById('btn-open-export');

    contactsTbody = document.getElementById('contacts-tbody');
    contactsMobileCards = document.getElementById('contacts-mobile-cards');

    currentPageNum = document.getElementById('current-page-num');
    paginationInfo = document.getElementById('pagination-info');
    btnPrev = document.getElementById('btn-prev');
    btnNext = document.getElementById('btn-next');
    pageIndicator = document.getElementById('page-indicator');

    metricTotalSchools = document.getElementById('metric-total-schools');
    metricFilteredSchools = document.getElementById('metric-filtered-schools');

    exportModal = document.getElementById('export-modal');
    btnCloseExport = document.getElementById('btn-close-export');
    btnCancelExport = document.getElementById('btn-cancel-export');
    btnExecuteExport = document.getElementById('btn-execute-export');
    exportScope = document.getElementById('export-scope');
    exportFormat = document.getElementById('export-format');
    exportColumnsCount = document.getElementById('export-columns-count');
}

// ── Event Listeners ───────────────────────────────────────────────────────
function setupEventListeners() {
    // Auth login form submit
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleAdminLogout);
    }

    // Search input & clear button
    if (filterSearchInput) {
        filterSearchInput.addEventListener('input', () => {
            if (filterSearchInput.value.trim().length > 0) {
                btnClearSearch.classList.remove('hidden');
            } else {
                btnClearSearch.classList.add('hidden');
            }
            currentPage = 1;
            applyFiltersAndRender();
        });
    }

    if (dateOrderFilter) {
        dateOrderFilter.addEventListener('change', () => {
            console.log("Date filter:", dateOrderFilter.value);
            currentPage = 1;

            if (dateOrderFilter.value === "none") {
                currentSortKey = "schoolName";
                currentSortOrder = "asc";
            } else {
                currentSortKey = "createdAt";
            }

            updateSortIcons();
            applyFiltersAndRender();
        });
    }

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            filterSearchInput.value = '';
            btnClearSearch.classList.add('hidden');
            currentPage = 1;
            applyFiltersAndRender();
        });
    }

    // Refresh database button
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => fetchSchoolsData(true));
    }

    // Table header sorting handlers
    document.querySelectorAll('.sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort-key');
            if (!sortKey) return;

            if (currentSortKey === sortKey) {
                currentSortOrder = (currentSortOrder === 'asc') ? 'desc' : 'asc';
            } else {
                currentSortKey = sortKey;
                currentSortOrder = 'asc';
            }

            updateSortIcons();
            applyFiltersAndRender();
        });
    });

    // Export header checkboxes change listeners
    exportColumnConfig.forEach(col => {
        const chk = document.getElementById(`export-col-${col.key}`);
        if (chk) {
            chk.addEventListener('change', (e) => {
                selectedExportColumns[col.key] = e.target.checked;
                updateExportColumnsCountLabel();
            });
        }
    });

    // Pagination buttons
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderPageData();
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredSchoolsData.length / pageSize) || 1;
            if (currentPage < totalPages) {
                currentPage++;
                renderPageData();
            }
        });
    }

    // Export Modal handlers
    if (btnOpenExport) {
        btnOpenExport.addEventListener('click', openExportModal);
    }
    if (btnCloseExport) {
        btnCloseExport.addEventListener('click', closeExportModal);
    }
    if (btnCancelExport) {
        btnCancelExport.addEventListener('click', closeExportModal);
    }
    if (btnExecuteExport) {
        btnExecuteExport.addEventListener('click', executeExport);
    }
}

// ── Auth Watcher with RBAC ────────────────────────────────────────────────
function setupAuthWatcher() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            showLoginView();
            return;
        }

        // Verify admin role in Firestore admins collection
        try {
            const adminDocSnap = await getDoc(doc(db, 'admins', user.uid));
            if (!adminDocSnap.exists()) {
                console.warn('[Contacts] Access Denied: User UID not found in admins collection.');
                await signOut(auth);
                showLoginError('Access Denied: Your account is not authorized to access this portal.');
                showLoginView();
                return;
            }

            // User is authorized admin
            showDashboardView();
            fetchSchoolsData(false);

        } catch (err) {
            console.error('[Contacts] Error during admin authorization check:', err);
            await signOut(auth);
            showLoginError('Access Denied. Authorization error occurred.');
            showLoginView();
        }
    });
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    loginSubmitBtn.textContent = 'Authenticating…';
    loginSubmitBtn.disabled = true;
    hideLoginError();

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        console.error('[Contacts] Login failure:', err);
        showLoginError('Access Denied: Invalid administrator credentials.');
        loginSubmitBtn.textContent = 'Sign In';
        loginSubmitBtn.disabled = false;
    }
}

async function handleAdminLogout() {
    try {
        await signOut(auth);
    } catch (err) {
        console.error('[Contacts] Logout failure:', err);
    }
}

function showLoginView() {
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (dashboardContainer) dashboardContainer.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
}

function showDashboardView() {
    if (loginContainer) loginContainer.classList.add('hidden');
    if (dashboardContainer) dashboardContainer.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
}

function showLoginError(msg) {
    if (loginError) {
        loginError.textContent = msg;
        loginError.classList.remove('hidden');
    }
}

function hideLoginError() {
    if (loginError) {
        loginError.classList.add('hidden');
    }
}

// ── Primary Data Fetching & Caching ───────────────────────────────────────
async function fetchSchoolsData(isRefresh = false) {
    showLoadingSpinner();

    try {
        const querySnap = await getDocs(collection(db, 'schools'));
        const list = [];

        querySnap.forEach(docSnap => {
            const data = docSnap.data();
            list.push({
                docId: docSnap.id,
                schoolName: (data.schoolName || '').trim(),
                ticName: (data.ticName || '').trim(),
                ticPhone: (data.ticPhone || '').trim(),
                coordinatorName: (data.coordinatorName || '').trim(),
                coordinatorPhone: (data.coordinatorPhone || '').trim(),
                coordinatorEmail: (data.coordinatorEmail || '').trim(),
                requiresInvitation: data.requiresInvitation ? "Yes" : "No",
                createdAt: data.createdAt
            });
        });

        allSchoolsData = list;
        metricTotalSchools.textContent = allSchoolsData.length;

        // Apply filtering & sorting (preserves query & page if valid)
        applyFiltersAndRender(isRefresh);

    } catch (err) {
        console.error('[Contacts] Error fetching schools:', err);
        showTableError(`Failed to load school contacts from database: ${err.message}`);
    }
}

function showLoadingSpinner() {
    const spinnerHtml = `
        <div class="spinner-container">
            <div class="spinner"></div>
            <span class="text-sm font-bold text-gray-300">Loading school contact records…</span>
        </div>
    `;
    contactsTbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center">${spinnerHtml}</td></tr>`;
    contactsMobileCards.innerHTML = spinnerHtml;
}

function showTableError(msg) {
    contactsTbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-red-400 font-bold font-[Montserrat]">${escapeHtml(msg)}</td></tr>`;
    contactsMobileCards.innerHTML = `<p class="text-center text-red-400 font-bold py-12 font-[Montserrat]">${escapeHtml(msg)}</p>`;
}

// ── Filtering & Sorting Engine ────────────────────────────────────────────
function applyFiltersAndRender(isRefresh = false) {
    const query = filterSearchInput.value.trim().toLowerCase();

    // 1. Search Filter (case-insensitive across all displayed fields)
    if (!query) {
        filteredSchoolsData = [...allSchoolsData];
    } else {
        filteredSchoolsData = allSchoolsData.filter(item => {
            return (
                item.schoolName.toLowerCase().includes(query) ||
                item.ticName.toLowerCase().includes(query) ||
                item.ticPhone.toLowerCase().includes(query) ||
                item.coordinatorName.toLowerCase().includes(query) ||
                item.coordinatorPhone.toLowerCase().includes(query) ||
                item.coordinatorEmail.toLowerCase().includes(query)
            );
        });
    }

    // Update Filtered Metric
    metricFilteredSchools.textContent = filteredSchoolsData.length;

    // 2. Sorting
    sortFilteredData();

    // 3. Pagination Handling
    const totalPages = Math.ceil(filteredSchoolsData.length / pageSize) || 1;
    if (!isRefresh) {
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
    } else {
        // On Refresh, preserve page if valid, else adjust to max page
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
    }

    renderPageData();
}

function sortFilteredData() {

    // 1. Date dropdown takes priority
    const dateMode = dateOrderFilter?.value || "";

    if (dateMode === "newest" || dateMode === "oldest") {

        filteredSchoolsData.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;

            return dateMode === "newest"
                ? bTime - aTime
                : aTime - bTime;
        });

        return;
    }

    // 2. Otherwise use the selected table header
    filteredSchoolsData.sort((a, b) => {

        let valA = a[currentSortKey];
        let valB = b[currentSortKey];

        // Handle empty values
        if (valA == null) valA = "";
        if (valB == null) valB = "";

        // Case-insensitive string sorting
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return currentSortOrder === "asc" ? -1 : 1;
        if (valA > valB) return currentSortOrder === "asc" ? 1 : -1;

        return 0;
    });
}

function updateSortIcons() {
    exportColumnConfig.forEach(col => {
        if (!col.sortable) return;
        const iconEl = document.getElementById(`sort-icon-${col.key}`);
        if (!iconEl) return;

        if (col.key === currentSortKey) {
            iconEl.textContent = (currentSortOrder === 'asc') ? '▲' : '▼';
            iconEl.classList.add('active');
        } else {
            iconEl.textContent = '↕';
            iconEl.classList.remove('active');
        }
    });
}

// ── Rendering Engine ──────────────────────────────────────────────────────
function renderPageData() {
    const total = filteredSchoolsData.length;

    // Handle Empty States
    if (allSchoolsData.length === 0) {
        const msg = 'No schools registered yet.';
        contactsTbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-gray-400 font-bold font-[Montserrat]">${msg}</td></tr>`;
        contactsMobileCards.innerHTML = `<p class="text-center text-gray-400 font-bold py-12 font-[Montserrat]">${msg}</p>`;
        updatePaginationUI(0, 1);
        return;
    }

    if (total === 0) {
        const msg = 'No matching records found.';
        contactsTbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-gray-400 font-bold font-[Montserrat]">${msg}</td></tr>`;
        contactsMobileCards.innerHTML = `<p class="text-center text-gray-400 font-bold py-12 font-[Montserrat]">${msg}</p>`;
        updatePaginationUI(0, 1);
        return;
    }

    const totalPages = Math.ceil(total / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * pageSize;
    const pageItems = filteredSchoolsData.slice(startIdx, startIdx + pageSize);

    // Render Desktop Table Rows
    contactsTbody.innerHTML = '';
    pageItems.forEach((item) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-white/5 hover:bg-yellow-500/5 transition-colors';

        tr.innerHTML = `
    <td class="py-3 px-4 font-bold text-white">${escapeHtml(item.schoolName || '—')}</td>
    <td class="py-3 px-4 text-gray-200">${escapeHtml(item.ticName || '—')}</td>
    <td class="py-3 px-4">${renderPhoneLink(item.ticPhone)}</td>
    <td class="py-3 px-4 text-yellow-400 font-medium">${escapeHtml(item.coordinatorName || '—')}</td>
    <td class="py-3 px-4">${renderPhoneLink(item.coordinatorPhone)}</td>
    <td class="py-3 px-4">${renderEmailLink(item.coordinatorEmail)}</td>
    <td class="py-3 px-4 text-center">${escapeHtml(item.requiresInvitation)}</td>
`;
        contactsTbody.appendChild(tr);
    });

    // Render Mobile Cards
    contactsMobileCards.innerHTML = '';
    pageItems.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'glass-card p-4 flex flex-col gap-2 text-sm font-[Lato]';

        card.innerHTML = `
            <div class="text-base font-bold text-yellow-400 font-[Montserrat] border-b border-yellow-500/20 pb-2">
                ${escapeHtml(item.schoolName || '—')}
            </div>
            
            <div class="grid grid-cols-1 gap-2 pt-1">
                <div>
                    <span class="text-[0.65rem] uppercase font-bold text-yellow-500/80 font-[Montserrat] block">Teacher-in-Charge</span>
                    <span class="text-white font-medium">${escapeHtml(item.ticName || '—')}</span>
                    <div class="mt-0.5">${renderPhoneLink(item.ticPhone)}</div>
                </div>

                <div class="pt-2 border-t border-white/10">
                    <span class="text-[0.65rem] uppercase font-bold text-yellow-500/80 font-[Montserrat] block">Coordinator</span>
                    <span class="text-white font-medium">${escapeHtml(item.coordinatorName || '—')}</span>
                    <div class="mt-0.5 flex flex-wrap items-center gap-2">
                        ${renderPhoneLink(item.coordinatorPhone)}
                        ${renderEmailLink(item.coordinatorEmail)}
                    </div>
                    <div class="pt-2">
                        <span class="text-[0.65rem] uppercase font-bold text-yellow-500/80 font-[Montserrat] block">
                            Invitation Required?
                        </span>
                        <span class="text-white">${escapeHtml(item.requiresInvitation)}</span>
                    </div>
                </div>
            </div>
        `;
        contactsMobileCards.appendChild(card);
    });

    // Attach Interactive Clipboard & Contact Event Listeners
    attachInteractiveActionListeners();

    updatePaginationUI(total, totalPages);
}

function updatePaginationUI(total, totalPages) {
    currentPageNum.textContent = currentPage;
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationInfo.textContent = `${total} records`;

    btnPrev.disabled = (currentPage <= 1);
    btnNext.disabled = (currentPage >= totalPages);
}

// ── Interactive Email & Phone Helpers ─────────────────────────────────────
function renderEmailLink(email) {
    if (!email) return '<span class="text-gray-500">—</span>';
    const escaped = escapeHtml(email);
    return `<a href="mailto:${escaped}" class="email-link" title="Send email to ${escaped}">${escaped}</a>`;
}

function renderPhoneLink(phone) {
    if (!phone) return '<span class="text-gray-500">—</span>';
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const escaped = escapeHtml(phone);

    return `
        <a href="tel:${cleanPhone}" class="contact-link btn-copy-phone" data-phone="${escaped}" title="Click to call or copy number">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            ${escaped}
        </a>
    `;
}

function attachInteractiveActionListeners() {
    document.querySelectorAll('.btn-copy-phone').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const phone = btn.getAttribute('data-phone');
            if (phone) {
                // Copy to clipboard
                navigator.clipboard.writeText(phone).then(() => {
                    showToast(`Copied ${phone} to clipboard`);
                }).catch(err => {
                    console.warn('Clipboard write failed:', err);
                });
            }
        });
    });
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// ── Multi-Format Export Engine (CSV & PDF) ────────────────────────────────
function openExportModal() {
    updateExportColumnsCountLabel();
    exportModal.classList.remove('hidden');
    exportModal.classList.add('flex');
}

function closeExportModal() {
    exportModal.classList.remove('flex');
    exportModal.classList.add('hidden');
}

function updateExportColumnsCountLabel() {
    const selectedCount = Object.values(selectedExportColumns).filter(Boolean).length;
    if (exportColumnsCount) {
        exportColumnsCount.textContent = `${selectedCount} of 6 columns`;
    }
}

function executeExport() {
    const scope = exportScope.value;
    const format = exportFormat.value;

    const activeColumns = exportColumnConfig.filter(col => selectedExportColumns[col.key]);

    if (activeColumns.length === 0) {
        alert('Please select at least one column using the header checkboxes to export.');
        return;
    }

    const targetDataset = (scope === 'filtered') ? filteredSchoolsData : allSchoolsData;

    if (!targetDataset || targetDataset.length === 0) {
        alert('No school contact records available to export.');
        return;
    }

    const todayDate = getFormattedDate();

    if (format === 'csv') {
        exportToCSV(targetDataset, activeColumns, todayDate);
    } else {
        exportToPDF(targetDataset, activeColumns, todayDate);
    }

    closeExportModal();
}

function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ── CSV Export Handler ────────────────────────────────────────────────────
function exportToCSV(dataset, activeColumns, todayDate) {
    const headers = activeColumns.map(col => escapeCSVField(col.label));

    const rows = dataset.map(item => {
        return activeColumns.map(col => escapeCSVField(item[col.key] || '')).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const filename = `schools-${todayDate}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function escapeCSVField(field) {
    if (field === null || field === undefined) return '""';
    const str = String(field);
    // Escape quotes, commas, or newlines by enclosing in quotes and doubling quotes inside
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// ── PDF Export Handler ────────────────────────────────────────────────────
function exportToPDF(dataset, activeColumns, todayDate) {
    const { jsPDF } = window.jspdf;

    // Metric: 1-4 columns -> Portrait, 5-6 columns -> Landscape
    const orientation = (activeColumns.length <= 4) ? 'portrait' : 'landscape';
    const docPdf = new jsPDF(orientation);

    const primaryGold = [212, 175, 55];
    const textDark = [26, 26, 26];

    // Header title & info
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(18);
    docPdf.setTextColor(...primaryGold);
    docPdf.text("NINNADA'26", 14, 15);

    docPdf.setFontSize(14);
    docPdf.setTextColor(40, 40, 40);
    docPdf.text("Registered Schools' Details", 14, 23);

    const timestamp = new Date().toLocaleString();
    docPdf.setFontSize(9);
    docPdf.setFont('helvetica', 'normal');
    docPdf.setTextColor(...textDark);
    docPdf.text(`Generated on: ${timestamp} | Total Exported Records: ${dataset.length}`, 14, 30);

    const tableHeaders = [activeColumns.map(col => col.label)];
    const tableBody = dataset.map(item => {
        return activeColumns.map(col => item[col.key] || '');
    });

    docPdf.autoTable({
        head: tableHeaders,
        body: tableBody,
        startY: 35,
        theme: 'grid',
        showHead: 'everyPage', // Automatically repeat table header on each new page
        headStyles: {
            fillColor: primaryGold,
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'left'
        },
        styles: {
            fontSize: (orientation === 'landscape' && activeColumns.length >= 5) ? 8 : 9,
            cellPadding: 3,
            overflow: 'linebreak'
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248]
        }
    });

    const filename = `schools-${todayDate}.pdf`;
    docPdf.save(filename);
}

// ── Utility Function ──────────────────────────────────────────────────────
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
