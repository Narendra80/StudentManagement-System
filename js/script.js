/* ==========================================================================
   STUDENT MANAGEMENT SYSTEM - CORE JAVASCRIPT LOGIC
   ========================================================================== */

const API_BASE = '/api';

// ==========================================
// 1. THEME MANAGEMENT (DARK/LIGHT MODE)
// ==========================================
function initTheme() {
    const savedTheme = localStorage.getItem('sms_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('sms_theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'bi bi-sun-fill';
        } else {
            icon.className = 'bi bi-moon-stars-fill';
        }
    }
}

// ==========================================
// 2. TOAST NOTIFICATION SYSTEM
// ==========================================
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    
    let iconClass = 'bi-check-circle-fill text-success';
    if (type === 'error') iconClass = 'bi-exclamation-triangle-fill text-danger';
    if (type === 'warning') iconClass = 'bi-exclamation-circle-fill text-warning';

    toast.innerHTML = `
        <i class="bi ${iconClass} fs-4"></i>
        <div>
            <strong class="d-block text-capitalize">${type}</strong>
            <span>${message}</span>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================
function getBranchBadgeClass(branch) {
    const b = str(branch).toLowerCase();
    if (b.includes('computer') || b.includes('cs')) return 'badge-branch-cs';
    if (b.includes('electron') || b.includes('ec')) return 'badge-branch-ec';
    if (b.includes('mechanic') || b.includes('me')) return 'badge-branch-me';
    if (b.includes('information') || b.includes('it')) return 'badge-branch-it';
    if (b.includes('civil') || b.includes('ce')) return 'badge-branch-ce';
    return 'badge-branch-default';
}

function str(val) {
    return val ? String(val) : '';
}

function animateCounter(element, target) {
    let current = 0;
    const increment = Math.ceil(target / 30);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = current;
        }
    }, 25);
}

// ==========================================
// 4. PAGE INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    const page = document.body.getAttribute('data-page');
    if (page === 'home') initHomePage();
    if (page === 'add') initAddPage();
    if (page === 'view') initViewPage();
    if (page === 'search') initSearchPage();
    if (page === 'edit') initEditPage();
});

// ==========================================
// 5. HOME PAGE & DASHBOARD LOGIC
// ==========================================
async function initHomePage() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const result = await response.json();
        if (result.success) {
            const stats = result.data;
            
            const totalEl = document.getElementById('stat-total-students');
            if (totalEl) animateCounter(totalEl, stats.total_students);

            const branchCountEl = document.getElementById('stat-branch-count');
            if (branchCountEl) animateCounter(branchCountEl, Object.keys(stats.branches).length);

            // Render Branch Breakdown
            const branchListEl = document.getElementById('branch-breakdown-list');
            if (branchListEl) {
                branchListEl.innerHTML = '';
                for (const [branch, count] of Object.entries(stats.branches)) {
                    const pct = Math.round((count / stats.total_students) * 100) || 0;
                    branchListEl.innerHTML += `
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="fw-semibold">${branch}</span>
                                <span class="text-secondary">${count} (${pct}%)</span>
                            </div>
                            <div class="progress" style="height: 8px; border-radius: 4px; background: var(--bg-secondary);">
                                <div class="progress-bar" role="progressbar" style="width: ${pct}%; background: var(--gradient-primary);" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                    `;
                }
            }
        }

        // Load recent students
        const stuRes = await fetch(`${API_BASE}/students`);
        const stuResult = await stuRes.json();
        if (stuResult.success) {
            const recentTable = document.getElementById('recent-students-tbody');
            if (recentTable) {
                const recent = stuResult.data.slice(-5).reverse();
                recentTable.innerHTML = recent.map(s => `
                    <tr>
                        <td class="fw-bold">${s.student_id}</td>
                        <td>${s.name}</td>
                        <td><span class="badge-custom ${getBranchBadgeClass(s.branch)}">${s.branch}</span></td>
                        <td>${s.year}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (err) {
        console.error("Error initializing home page:", err);
    }
}

// ==========================================
// 6. ADD STUDENT PAGE LOGIC
// ==========================================
function initAddPage() {
    const form = document.getElementById('add-student-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Client-side quick validation
        if (!data.student_id || !data.name || !data.roll_number || !data.email || !data.mobile) {
            showToast("Please fill in all required fields.", "error");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showToast("Please enter a valid email address.", "error");
            return;
        }

        if (!/^\d{10}$/.test(data.mobile)) {
            showToast("Mobile number must be exactly 10 digits.", "error");
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Saving...`;
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok && result.success) {
                showToast(result.message || "Student added successfully!", "success");
                form.reset();
                setTimeout(() => window.location.href = 'view_students.html', 1500);
            } else {
                showToast(result.error || "Failed to add student.", "error");
            }
        } catch (err) {
            showToast("Server communication error occurred.", "error");
            console.error(err);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ==========================================
// 7. VIEW STUDENTS PAGE LOGIC
// ==========================================
let allStudentsData = [];

async function initViewPage() {
    await loadAllStudents();

    const searchInput = document.getElementById('table-filter-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().strip ? e.target.value.toLowerCase().trim() : e.target.value.toLowerCase();
            const filtered = allStudentsData.filter(s => 
                s.student_id.toLowerCase().includes(query) ||
                s.name.toLowerCase().includes(query) ||
                s.roll_number.toLowerCase().includes(query) ||
                s.branch.toLowerCase().includes(query)
            );
            renderStudentsTable(filtered);
        });
    }

    const exportBtn = document.getElementById('export-json-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allStudentsData, null, 4));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "students_export.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast("Exported students list to JSON!", "success");
        });
    }

    const printBtn = document.getElementById('print-list-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
}

async function loadAllStudents() {
    const tbody = document.getElementById('students-table-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4"><span class="spinner-border text-primary me-2"></span>Loading records...</td></tr>`;

    try {
        const response = await fetch(`${API_BASE}/students`);
        const result = await response.json();
        if (result.success) {
            allStudentsData = result.data;
            renderStudentsTable(allStudentsData);
        } else {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Failed to load student records.</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Error connecting to server.</td></tr>`;
    }
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('students-table-tbody');
    const countBadge = document.getElementById('student-count-badge');
    if (countBadge) countBadge.textContent = `${students.length} Records`;

    if (!tbody) return;

    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-2 d-block mb-2"></i>No student records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = students.map(s => `
        <tr>
            <td class="fw-bold">${s.student_id}</td>
            <td>
                <div class="fw-semibold">${s.name}</div>
                <small class="text-muted">${s.email}</small>
            </td>
            <td><span class="font-monospace">${s.roll_number}</span></td>
            <td><span class="badge-custom ${getBranchBadgeClass(s.branch)}">${s.branch}</span></td>
            <td>${s.year}</td>
            <td>${s.section}</td>
            <td>${s.gender}</td>
            <td>${s.mobile}</td>
            <td class="text-end text-nowrap">
                <button class="btn-action-icon btn-action-view" onclick="viewStudentProfile('${s.student_id}')" title="View Profile">
                    <i class="bi bi-eye-fill"></i>
                </button>
                <a href="edit_student.html?id=${s.student_id}" class="btn-action-icon btn-action-edit" title="Edit Record">
                    <i class="bi bi-pencil-fill"></i>
                </a>
                <button class="btn-action-icon btn-action-delete" onclick="confirmDeleteStudent('${s.student_id}', '${s.name}')" title="Delete Record">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// 8. VIEW PROFILE MODAL & DELETE CONFIRMATION
// ==========================================
function viewStudentProfile(studentId) {
    const student = allStudentsData.find(s => s.student_id === studentId);
    if (!student) return;

    const modalBody = document.getElementById('profile-modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="text-center mb-4">
                <div class="avatar-circle mx-auto mb-3 d-flex align-items-center justify-content-center text-white fw-bold fs-2" style="width: 80px; height: 80px; border-radius: 50%; background: var(--gradient-primary);">
                    ${student.name.charAt(0)}
                </div>
                <h4 class="mb-1">${student.name}</h4>
                <p class="text-secondary mb-2"><i class="bi bi-envelope me-2"></i>${student.email}</p>
                <span class="badge-custom ${getBranchBadgeClass(student.branch)}">${student.branch}</span>
            </div>
            <hr class="my-3" style="border-color: var(--border-color);">
            <div class="row g-3">
                <div class="col-6"><small class="text-secondary d-block">Student ID</small><strong class="font-monospace">${student.student_id}</strong></div>
                <div class="col-6"><small class="text-secondary d-block">Roll Number</small><strong class="font-monospace">${student.roll_number}</strong></div>
                <div class="col-6"><small class="text-secondary d-block">Academic Year</small><strong>${student.year}</strong></div>
                <div class="col-6"><small class="text-secondary d-block">Section</small><strong>${student.section}</strong></div>
                <div class="col-6"><small class="text-secondary d-block">Gender</small><strong>${student.gender}</strong></div>
                <div class="col-6"><small class="text-secondary d-block">Date of Birth</small><strong>${student.dob || 'N/A'}</strong></div>
                <div class="col-12"><small class="text-secondary d-block">Mobile Number</small><strong><i class="bi bi-telephone me-2"></i>${student.mobile}</strong></div>
                <div class="col-12"><small class="text-secondary d-block">Residential Address</small><strong><i class="bi bi-geo-alt me-2"></i>${student.address}</strong></div>
            </div>
        `;
    }

    const modalEl = document.getElementById('profileModal');
    if (modalEl && window.bootstrap) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

function confirmDeleteStudent(studentId, name) {
    if (confirm(`Are you sure you want to delete the record for "${name}" (${studentId})? This action cannot be undone.`)) {
        deleteStudentRecord(studentId);
    }
}

async function deleteStudentRecord(studentId) {
    try {
        const res = await fetch(`${API_BASE}/students/${studentId}`, { method: 'DELETE' });
        const result = await res.json();
        if (res.ok && result.success) {
            showToast(result.message || "Student record deleted.", "success");
            loadAllStudents();
        } else {
            showToast(result.error || "Failed to delete student.", "error");
        }
    } catch (err) {
        showToast("Error communicating with server.", "error");
    }
}

// ==========================================
// 9. SEARCH PAGE LOGIC
// ==========================================
function initSearchPage() {
    const searchInput = document.getElementById('live-search-input');
    const resultsContainer = document.getElementById('search-results-container');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');

    if (!searchInput || !resultsContainer) return;

    let debounceTimer;

    const performSearch = async (query) => {
        resultsContainer.innerHTML = `<div class="text-center py-5"><span class="spinner-border text-primary me-2"></span>Searching records...</div>`;
        try {
            const res = await fetch(`${API_BASE}/students/search?q=${encodeURIComponent(query)}`);
            const result = await res.json();
            if (result.success) {
                renderSearchResults(result.data, query);
            } else {
                resultsContainer.innerHTML = `<div class="alert alert-danger">Error fetching search results.</div>`;
            }
        } catch (err) {
            resultsContainer.innerHTML = `<div class="alert alert-danger">Server communication error.</div>`;
        }
    };

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const q = e.target.value.trim();
        debounceTimer = setTimeout(() => {
            performSearch(q);
        }, 300);
    });

    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const text = chip.getAttribute('data-search');
            searchInput.value = text;
            performSearch(text);
        });
    });

    // Initial load
    performSearch('');
}

function renderSearchResults(students, query) {
    const resultsContainer = document.getElementById('search-results-container');
    if (!resultsContainer) return;

    if (students.length === 0) {
        resultsContainer.innerHTML = `
            <div class="card-custom text-center py-5">
                <i class="bi bi-search fs-1 text-muted mb-3 d-block"></i>
                <h4 class="mb-2">No Matching Records Found</h4>
                <p class="text-secondary">We couldn't find any students matching "${query}". Try searching by Student ID, Roll Number, or Name.</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">Found <span class="text-primary fw-bold">${students.length}</span> matching record(s)</h5>
        </div>
        <div class="row g-4">
            ${students.map(s => `
                <div class="col-md-6 col-lg-4">
                    <div class="card-custom h-100 d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <span class="badge-custom ${getBranchBadgeClass(s.branch)}">${s.branch}</span>
                                <span class="font-monospace fw-bold text-secondary">${s.student_id}</span>
                            </div>
                            <h4 class="mb-1">${s.name}</h4>
                            <p class="text-secondary small mb-3"><i class="bi bi-envelope me-1"></i>${s.email}</p>
                            <div class="row g-2 small bg-secondary p-2 rounded-3 mb-3" style="background: var(--bg-secondary);">
                                <div class="col-6"><strong>Roll No:</strong> ${s.roll_number}</div>
                                <div class="col-6"><strong>Year:</strong> ${s.year}</div>
                                <div class="col-6"><strong>Section:</strong> ${s.section}</div>
                                <div class="col-6"><strong>Mobile:</strong> ${s.mobile}</div>
                            </div>
                        </div>
                        <div class="d-flex gap-2 pt-2 border-top" style="border-color: var(--border-color) !important;">
                            <a href="edit_student.html?id=${s.student_id}" class="btn btn-custom-secondary flex-grow-1 text-center py-2 small">
                                <i class="bi bi-pencil me-1"></i>Edit
                            </a>
                            <button onclick="confirmDeleteStudent('${s.student_id}', '${s.name}')" class="btn btn-outline-danger flex-grow-1 py-2 small" style="border-radius: 12px;">
                                <i class="bi bi-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ==========================================
// 10. EDIT STUDENT PAGE LOGIC
// ==========================================
async function initEditPage() {
    const form = document.getElementById('edit-student-form');
    if (!form) return;

    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');

    if (!studentId) {
        showToast("No Student ID provided in URL.", "error");
        setTimeout(() => window.location.href = 'view_students.html', 1500);
        return;
    }

    // Load existing data
    try {
        const res = await fetch(`${API_BASE}/students/${studentId}`);
        const result = await res.json();
        if (result.success && result.data) {
            const s = result.data;
            form.student_id.value = s.student_id || '';
            form.name.value = s.name || '';
            form.roll_number.value = s.roll_number || '';
            form.branch.value = s.branch || '';
            form.year.value = s.year || '';
            form.section.value = s.section || '';
            form.gender.value = s.gender || '';
            form.dob.value = s.dob || '';
            form.email.value = s.email || '';
            form.mobile.value = s.mobile || '';
            form.address.value = s.address || '';
        } else {
            showToast("Student record not found.", "error");
            setTimeout(() => window.location.href = 'view_students.html', 1500);
            return;
        }
    } catch (err) {
        showToast("Error loading student data.", "error");
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Updating...`;
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/students/${studentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok && result.success) {
                showToast(result.message || "Student updated successfully!", "success");
                setTimeout(() => window.location.href = 'view_students.html', 1500);
            } else {
                showToast(result.error || "Failed to update student.", "error");
            }
        } catch (err) {
            showToast("Server communication error occurred.", "error");
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}
