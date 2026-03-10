/**
 * Admin Portal Logic
 * Isolated script to manage the Admin Dashboard without exposing it to the client app.
 */

document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const loginModal = document.getElementById('admin-login-modal');
    const loginForm = document.getElementById('login-form');
    const adminUsername = document.getElementById('admin-username');
    const adminPassword = document.getElementById('admin-password');
    const loginError = document.getElementById('login-error');

    const store = window.appStore;
    const views = window.views;

    function checkAuth() {
        if (store.isAdmin()) {
            loginModal.classList.remove('active');
            renderDashboard();
        } else {
            loginModal.classList.add('active');
            appContent.innerHTML = ''; // Hide dashboard if not logged in
        }
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (store.loginAdmin(adminUsername.value.trim(), adminPassword.value)) {
            checkAuth();
            adminPassword.value = '';
        } else {
            loginError.textContent = 'Invalid Username or Password. Access denied.';
        }
    });

    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const phrase = prompt("Enter the Master Recovery Key to reset your Admin password back to default:");
            if (phrase === "Rajee@2026") {
                store.updateAdminCredentials("admin", "admin123");
                alert("Password successfully reset! You can now log in with:\nUsername: admin\nPassword: admin123");
            } else if (phrase !== null) {
                alert("Incorrect Recovery Key. Contact technical support if you have lost your key.");
            }
        });
    }

    function renderDashboard() {
        appContent.innerHTML = views.renderAdminView();
        
        // Reattach events
        const btnLogout = document.getElementById('btn-logout');
        const btnFactoryReset = document.getElementById('btn-factory-reset');
        const btnTabDesigns = document.getElementById('btn-tab-designs');
        const btnTabSettings = document.getElementById('btn-tab-settings');
        const viewDesigns = document.getElementById('admin-designs-view');
        const viewSettings = document.getElementById('admin-settings-view');

        const adminUploadForm = document.getElementById('admin-upload-form');
        const adminCategoryForm = document.getElementById('admin-category-form');
        const deleteBtns = document.querySelectorAll('.btn-delete');
        const editBtns = document.querySelectorAll('.btn-edit');
        const deleteCatBtns = document.querySelectorAll('.btn-delete-cat');
        const btnCancelEdit = document.getElementById('btn-cancel-edit');
        const formErrorMsg = document.getElementById('form-error-msg');

        // Tab Switching Logic
        if (btnTabDesigns && btnTabSettings) {
            btnTabDesigns.addEventListener('click', () => {
                viewDesigns.classList.remove('hidden');
                viewSettings.classList.add('hidden');
                btnTabDesigns.classList.replace('btn-outline', 'btn-primary');
                btnTabSettings.classList.replace('btn-primary', 'btn-outline');
            });
            
            btnTabSettings.addEventListener('click', () => {
                viewSettings.classList.remove('hidden');
                viewDesigns.classList.add('hidden');
                btnTabSettings.classList.replace('btn-outline', 'btn-primary');
                btnTabDesigns.classList.replace('btn-primary', 'btn-outline');
            });
        }

        // Logout
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                store.logoutAdmin();
                checkAuth();
            });
        }

        // Factory Reset
        if (btnFactoryReset) {
            btnFactoryReset.addEventListener('click', () => {
                if (confirm("WARNING: This will delete ALL designs and categories. Are you sure you want to completely clear the store?")) {
                    store.clearAllData();
                    renderDashboard(); // refresh
                }
            });
        }

        // Add Category
        if (adminCategoryForm) {
            adminCategoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const catName = document.getElementById('add-cat-name').value.trim();
                if (catName) {
                    store.addCategory(catName);
                    renderDashboard();
                }
            });
        }

        // Delete Category
        deleteCatBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm(`Delete the "${store.getCategories()[id]}" category?`)) {
                    store.deleteCategory(id);
                    renderDashboard();
                }
            });
        });

        // Edit Mode Setup
        function setEditMode(designId) {
            const design = store.getDesignById(designId);
            if (!design) return;

            document.getElementById('edit-mode-id').value = design.id;
            
            const fileGroup = document.getElementById('file-upload-group');
            const idGroup = document.getElementById('id-input-group');
            if (fileGroup) fileGroup.style.display = 'none';
            if (idGroup) idGroup.style.display = 'block';

            const idInput = document.getElementById('add-id');
            idInput.value = design.id;
            idInput.disabled = true;

            const titleInput = document.getElementById('add-title');
            titleInput.value = design.title;
            titleInput.disabled = false;

            const catInput = document.getElementById('add-category');
            catInput.value = design.category;
            catInput.disabled = false;

            const priceInput = document.getElementById('add-price');
            priceInput.value = parseFloat(design.price).toFixed(2);
            priceInput.disabled = false;

            document.getElementById('form-design-title').textContent = `Editing Design: ${design.id}`;
            document.getElementById('btn-submit-design').textContent = 'Update Design';
            document.getElementById('btn-submit-design').disabled = false;
            btnCancelEdit.classList.remove('hidden');
            formErrorMsg.textContent = '';
            
            document.getElementById('form-design-title').scrollIntoView({ behavior: 'smooth' });
        }

        function cancelEditMode() {
            document.getElementById('edit-mode-id').value = '';
            
            const fileGroup = document.getElementById('file-upload-group');
            const idGroup = document.getElementById('id-input-group');
            if (fileGroup) fileGroup.style.display = 'block';
            if (idGroup) idGroup.style.display = 'none';

            const idInput = document.getElementById('add-id');
            idInput.value = '';
            idInput.disabled = true;

            const titleInput = document.getElementById('add-title');
            titleInput.value = '';
            titleInput.disabled = false;

            const catInput = document.getElementById('add-category');
            catInput.value = '';
            catInput.disabled = false;

            const priceInput = document.getElementById('add-price');
            priceInput.value = '';
            priceInput.disabled = false;

            document.getElementById('form-design-title').textContent = 'Add New Design';
            document.getElementById('btn-submit-design').textContent = 'Upload Design';
            document.getElementById('btn-submit-design').disabled = true;
            btnCancelEdit.classList.add('hidden');
            formErrorMsg.textContent = '';
        }

        if (btnCancelEdit) btnCancelEdit.addEventListener('click', cancelEditMode);

        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                setEditMode(e.currentTarget.dataset.id);
            });
        });

        if (adminUploadForm) {
            adminUploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                formErrorMsg.textContent = '';
                
                const editId = document.getElementById('edit-mode-id').value;
                const fileInput = document.getElementById('add-file');
                const files = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
                const submitBtn = document.getElementById('btn-submit-design');

                let inputTitle = document.getElementById('add-title').value.trim();
                const inputCategory = document.getElementById('add-category').value;
                const inputPrice = parseFloat(document.getElementById('add-price').value).toFixed(2);

                try {
                    submitBtn.disabled = true;
                    if (editId) {
                        // Edit Mode
                        store.updateDesign(editId, { title: inputTitle, category: inputCategory, price: inputPrice });
                        alert('Design updated successfully!');
                        renderDashboard();
                        cancelEditMode();
                    } else {
                        // Upload Mode
                        if (files.length === 0) throw new Error("Please select an image file to upload.");
                        
                        const designsData = files.map(file => {
                            if (file.size > 5 * 1024 * 1024) throw new Error(`File ${file.name} is too large. Max 5MB per file.`);
                            return {
                                file: file,
                                // If multiple files, use filename as title if none provided
                                title: inputTitle || file.name.split('.').slice(0, -1).join(' '),
                                category: inputCategory,
                                price: inputPrice
                            };
                        });
                        
                        submitBtn.textContent = `Uploading ${files.length} Design(s) to GitHub...`;
                        await store.uploadMultipleToGithub(designsData);
                        alert(`Success! ${files.length} design(s) uploaded. It may take 1-3 minutes to update globally.`);
                        if (fileInput) fileInput.value = '';
                        document.getElementById('add-title').value = '';
                        // Do not clear price/category to make mass-adding easier
                        renderDashboard();
                    }
                } catch (err) {
                    formErrorMsg.textContent = err.message;
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = editId ? 'Update Design' : 'Upload Design';
                }
            });
        }

        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm(`Hide design ${id} from the catalog? This is stored in your local browser state.`)) {
                    store.deleteDesign(id);
                    renderDashboard();
                }
            });
        });

        // Admin Settings Logic
        const adminCredsForm = document.getElementById('admin-creds-form');
        const credsErrorMsg = document.getElementById('creds-error-msg');
        
        if (adminCredsForm) {
            adminCredsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                credsErrorMsg.textContent = '';
                
                const newUser = document.getElementById('setting-admin-user').value.trim();
                const newPass = document.getElementById('setting-admin-pass').value;

                if (!newUser || !newPass) {
                    credsErrorMsg.textContent = "Both Username and Password are required.";
                    return;
                }

                if (newPass.length < 4) {
                    credsErrorMsg.textContent = "Password must be at least 4 characters.";
                    return;
                }

                try {
                    store.updateAdminCredentials(newUser, newPass);
                    alert('Credentials updated successfully. Please log in again with your new credentials.');
                    store.logoutAdmin();
                    checkAuth();
                } catch (err) {
                    credsErrorMsg.textContent = err.message;
                }
            });
        }
        
        // GitHub Settings Form
        const adminGithubForm = document.getElementById('admin-github-form');
        if (adminGithubForm) {
            adminGithubForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const repo = document.getElementById('setting-github-repo').value.trim();
                const token = document.getElementById('setting-github-token').value.trim();
                if (repo && token) {
                    store.setGithubConfig(repo, token);
                    alert('GitHub Integration configured successfully! You can now upload New Designs from the Manage Designs tab.');
                }
            });
        }
    }

    // Init
    checkAuth();
});
