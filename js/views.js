/**
 * UI View Templates
 * Functions that return HTML strings for different application states
 */

const getDesignCardHtml = (design) => {
    const categories = window.appStore.getCategories();
    return `
        <article class="design-card" data-id="${design.id}">
            <div class="card-img-wrapper" title="Click to search similar designs">
                <img src="${design.imageUrl}" alt="${design.title}" class="card-img" loading="lazy">
                <span class="card-badge">${design.id}</span>
            </div>
            <div class="card-content">
                <h3 class="card-title">${design.title}</h3>
                <span class="card-category">${categories[design.category] || design.category || 'Uncategorized'}</span>
                <div class="card-footer">
                    <span class="card-price">₹${design.price}</span>
                    <button class="btn btn-primary btn-sm action-buy" data-id="${design.id}" aria-label="Add to cart">
                        Add to Cart <span aria-hidden="true">&#43;</span>
                    </button>
                </div>
            </div>
        </article>
    `;
};

const renderHomeView = () => {
    const api = window.appStore;
    const allDesigns = api.getAllDesigns().filter(d => !d.isHidden);
    const featured = allDesigns.slice(0, 4);
    
    return `
        <section class="hero fade-in">
            <div class="hero-content">
                <h1 class="t-h1">Elevate Your Textiles</h1>
                <p class="hero-subtitle">Discover premium, meticulously digitized embroidery patterns for professionals and passionate creators.</p>
                <button class="btn btn-primary" data-route="catalog">Explore the Catalog</button>
            </div>
        </section>

        <section class="container featured-section fade-in">
            <h2 class="t-h2 section-title">Featured Designs</h2>
            ${featured.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <h3>No designs loaded yet</h3>
                    <p class="text-muted">Place image files in the <code>images/designs/</code> folder and run <code>update_catalog.ps1</code>.</p>
                </div>
            ` : `
                <div class="design-grid">
                    ${featured.map(d => getDesignCardHtml(d)).join('')}
                </div>
            `}
            <div class="text-center mt-8">
                <button class="btn btn-secondary" data-route="catalog">View All Patterns</button>
            </div>
        </section>
    `;
};

const renderCatalogView = () => {
    const categories = window.appStore.getCategories();
    return `
        <div class="catalog-header">
            <div class="container text-center">
                <h1 class="t-h1">Design Collection</h1>
                <p class="hero-subtitle text-muted">Browse by category or search by design ID.</p>
                
                <div class="search-filters">
                    <div class="search-input-group">
                        <span class="search-icon">🔍</span>
                        <input type="text" id="catalog-search" class="form-control" placeholder="Search ID or Title..." aria-label="Search patterns">
                    </div>
                    <div class="search-input-group">
                        <select id="catalog-category" class="form-control" aria-label="Filter by category">
                            <option value="all">All Categories</option>
                            ${Object.entries(categories).map(([val, label]) => 
                                `<option value="${val}">${label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mb-8 min-h-screen">
            <div id="catalog-grid" class="design-grid">
                <!-- Designs render here -->
            </div>
        </div>
    `;
};

const renderAdminView = () => {
    if (!window.appStore.isAdmin()) {
        return `
            <div class="container min-h-screen flex items-center justify-center">
                <div class="empty-state">
                    <div class="empty-icon">🔒</div>
                    <h3>Access Denied</h3>
                    <p class="text-muted mt-4">You need admin privileges to view this page.</p>
                </div>
            </div>
        `;
    }

    const designs = window.appStore.getAllDesigns();
    const categories = window.appStore.getCategories();
    const clients = window.appStore.getAllClients();

    return `
        <div class="catalog-header text-center" style="padding: 2rem 0;">
            <div class="container">
                <h1 class="t-h2">Admin Dashboard</h1>
                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn btn-primary" id="btn-tab-designs">Manage Designs</button>
                    <button class="btn btn-outline" id="btn-tab-settings">Settings & Members</button>
                    <button class="btn btn-outline text-danger" id="btn-logout">Logout</button>
                </div>
            </div>
        </div>

        <!-- Manage Designs Tab -->
        <div class="container pb-8" id="admin-designs-view">
            <div class="admin-header">
                <h2 class="t-h3">Manage Inventory</h2>
                <div class="action-btns">
                    <button class="btn btn-outline text-danger" id="btn-factory-reset" title="Wipe all designs and categories">Clear All Data</button>
                </div>
            </div>

            <!-- Manage Categories Area -->
            <div class="upload-form-container" style="margin-bottom: 2rem;">
                <h3 class="mb-4">Manage Categories</h3>
                
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;" id="category-badges">
                    ${Object.entries(categories).length === 0 ? '<p class="text-muted" style="font-size: 0.9rem;">No categories set. Add one below.</p>' : ''}
                    ${Object.entries(categories).map(([id, name]) => `
                        <span class="card-badge" style="position:static; display: inline-flex; align-items: center; gap: 0.5rem; background: var(--bg-primary); padding: 0.5rem 1rem;">
                            ${name} 
                            <button type="button" class="btn-delete-cat text-danger" data-id="${id}" style="background: none; border: none; cursor: pointer; font-size: 1.25rem; line-height: 1;" title="Delete Category">&times;</button>
                        </span>
                    `).join('')}
                </div>

                <form id="admin-category-form" style="display: flex; gap: 1rem; align-items: flex-end;">
                    <div class="form-group" style="margin-bottom: 0; flex: 1;">
                        <label>New Category Name</label>
                        <input type="text" id="add-cat-name" class="form-control" required placeholder="e.g. Wedding Designs">
                    </div>
                    <button type="submit" class="btn btn-secondary">Add Category</button>
                </form>
            </div>

            <!-- Add/Edit Design Area -->
            <div class="upload-form-container">
                <h3 class="mb-4" id="form-design-title">Add New Design</h3>
                <p class="text-muted mb-4" style="font-size: 0.9rem;">Upload a new image directly to your website. <strong>Requires GitHub Integration to be configured in Settings.</strong></p>
                
                <form id="admin-upload-form">
                    <input type="hidden" id="edit-mode-id" value="">
                    
                    <div class="form-group" id="file-upload-group">
                        <label>Design Image (JPG/PNG)</label>
                        <input type="file" id="add-file" class="form-control" accept="image/*">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group" id="id-input-group" style="display:none;">
                            <label>Design ID</label>
                            <input type="text" id="add-id" class="form-control" disabled>
                        </div>
                        <div class="form-group">
                            <label>Title</label>
                            <input type="text" id="add-title" class="form-control" required placeholder="Design Name">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>Category</label>
                            <select id="add-category" class="form-control" required>
                                <option value="" disabled selected>Select a category...</option>
                                ${Object.keys(categories).map(k => `<option value="${k}">${categories[k]}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Price (₹)</label>
                            <input type="number" id="add-price" class="form-control" required min="0" step="1" placeholder="99">
                        </div>
                    </div>

                    <div class="error-msg" id="form-error-msg"></div>

                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;" id="btn-submit-design">Upload Design</button>
                        <button type="button" class="btn btn-secondary hidden" id="btn-cancel-edit">Cancel Edit</button>
                    </div>
                </form>
            </div>

            <!-- Inventory Table -->
            <div class="table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Preview</th>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${designs.length === 0 ? '<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">No designs loaded. Run update_catalog.ps1 to populate catalog.</td></tr>' : ''}
                        ${designs.filter(d => !d.isHidden).map(d => `
                            <tr>
                                <td><img src="${d.imageUrl}" alt="${d.title}"></td>
                                <td><span class="card-badge" style="position:static;">${d.id}</span></td>
                                <td>${d.title}</td>
                                <td>${categories[d.category] || d.category || 'Uncategorized'}</td>
                                <td>₹${d.price}</td>
                                <td>
                                    <div class="action-btns">
                                        <button class="btn btn-outline btn-sm btn-edit" data-id="${d.id}" aria-label="Edit" title="Edit">✏️</button>
                                        <button class="btn btn-outline text-danger btn-sm btn-delete" data-id="${d.id}" aria-label="Hide" title="Hide (Delete locally)">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            </div>
            
            <!-- Designs Tab End -->
        </div>

        <!-- Admin Settings Tab -->
        <div class="container pb-8 hidden" id="admin-settings-view">
            <div class="admin-header">
                <h2 class="t-h3">Settings & Members</h2>
            </div>
            
            <div class="upload-form-container" style="margin-bottom: 2rem;">
                <h3 class="mb-4">Registered Members</h3>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>WhatsApp Number</th>
                                <th>Date Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.length === 0 ? '<tr><td colspan="3" class="text-center text-muted" style="padding: 1rem;">No registered members yet.</td></tr>' : ''}
                            ${clients.map(c => `
                                <tr>
                                    <td><strong>${c.name}</strong></td>
                                    <td><a href="https://wa.me/91${c.phone}" target="_blank" style="color: #25D366; text-decoration: underline;">${c.phone}</a></td>
                                    <td>${new Date(c.dateJoined).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="upload-form-container">
                <h3 class="t-h4" style="margin-bottom: 0.5rem;">Access Management</h3>
                <p class="text-muted" style="margin-bottom: 1rem; font-size: 0.9rem;">Update your admin login credentials here. You will be asked to log back in after saving.</p>
                
                <form id="admin-creds-form">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>New Username</label>
                            <input type="text" id="setting-admin-user" class="form-control" value="${window.appStore.getAdminCredentials().username}" required>
                        </div>
                        <div class="form-group">
                            <label>New Password</label>
                            <input type="password" id="setting-admin-pass" class="form-control" placeholder="Enter new password" required minlength="4">
                        </div>
                    </div>
                    <div class="error-msg" id="creds-error-msg" style="margin-bottom: 1rem;"></div>
                    <button type="submit" class="btn btn-secondary w-full" id="btn-save-creds">Update Credentials</button>
                </form>
            </div>

            <div class="upload-form-container" style="margin-top: 2rem;">
                <h3 class="t-h4" style="margin-bottom: 0.5rem;">GitHub Integration</h3>
                <p class="text-muted" style="margin-bottom: 1rem; font-size: 0.9rem;">To upload images directly to the live website, provide your GitHub securely here. It is saved only on your local browser.</p>
                <form id="admin-github-form">
                    <div class="form-group">
                        <label>Repository (e.g. rajee-embroidery/rajee-embroidery.github.io)</label>
                        <input type="text" id="setting-github-repo" class="form-control" value="${window.appStore.getGithubConfig().repo}" placeholder="username/repository" required>
                    </div>
                    <div class="form-group">
                        <label>GitHub Personal Access Token</label>
                        <input type="password" id="setting-github-token" class="form-control" value="${window.appStore.getGithubConfig().token}" placeholder="ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" required>
                    </div>
                    <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 1rem;">Copy your token from your initial deploy_github.ps1 script.</p>
                    <button type="submit" class="btn btn-primary w-full text-center">Save GitHub Credentials</button>
                </form>
            </div>
        </div>
    `;
};

const renderCartItems = () => {
    const cartIds = window.appStore.getCart();
    if (cartIds.length === 0) {
        return `
            <div class="empty-state" style="padding: 2rem;">
                <div class="empty-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p class="text-muted">Explore our catalog to find your next design.</p>
            </div>
        `;
    }

    const designs = window.appStore.getAllDesigns();
    const cartItems = cartIds.map(id => designs.find(d => d && d.id === id)).filter(Boolean);
    
    let total = 0;
    const html = cartItems.map(item => {
        total += parseFloat(item.price);
        return `
            <div class="cart-item" style="display: flex; gap: 1rem; align-items: center; border-bottom: 1px solid var(--glass-border); padding: 1rem 0;">
                <img src="${item.imageUrl}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-sm);">
                <div style="flex: 1;">
                    <h4 style="font-size: 1rem; margin-bottom: 0.25rem;">${item.title}</h4>
                    <p class="text-muted" style="font-size: 0.85rem;">ID: ${item.id}</p>
                </div>
                <div style="text-align: right;">
                    <p class="text-gold" style="font-weight: 600;">₹${item.price}</p>
                    <button class="btn-remove-cart text-danger" data-id="${item.id}" style="background:none; border:none; cursor:pointer; font-size: 0.85rem; text-decoration: underline;">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="cart-items-list" style="max-height: 40vh; overflow-y: auto; margin-bottom: 1.5rem;">
            ${html}
        </div>
        <div class="cart-summary" style="border-top: 2px solid var(--glass-border); padding-top: 1rem; margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <strong style="font-size: 1.25rem;">Total</strong>
                <strong style="font-size: 1.5rem; color: var(--brand-gold);">₹${total.toFixed(2)}</strong>
            </div>
            <button class="btn btn-primary w-full" id="btn-checkout">Checkout</button>
        </div>
    `;
};

const renderSettingsView = () => {
    if (!window.appStore.isClient()) {
        return `
            <div class="container min-h-screen flex items-center justify-center">
                <div class="empty-state">
                    <div class="empty-icon">🔒</div>
                    <h3>Please Login</h3>
                    <p class="text-muted mt-4">You need to sign in to view your account settings.</p>
                </div>
            </div>
        `;
    }

    const p = window.appStore.getClientProfile();

    return `
        <div class="catalog-header text-center" style="padding: 2rem 0;">
            <div class="container">
                <h1 class="t-h2">Your Account</h1>
            </div>
        </div>
        
        <div class="container pb-8" style="max-width: 600px; padding-top: 2rem;">
            <div class="upload-form-container">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; margin-bottom: 2rem;">
                    <div>
                        <h2 class="t-h3" style="margin-bottom: 0;">Profile Details</h2>
                        <p class="text-muted text-sm">Manage your Rajee Embroidery account.</p>
                    </div>
                </div>

                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" class="form-control" value="${p.name}" disabled style="opacity:0.8;">
                </div>
                <div class="form-group">
                    <label>WhatsApp Number</label>
                    <input type="text" class="form-control" value="${p.phone}" disabled style="opacity:0.8;">
                </div>

                <div style="margin-top: 3rem; text-align: center;">
                    <button class="btn btn-outline text-danger w-full" id="btn-client-logout">Sign Out</button>
                </div>
            </div>
        </div>
    `;
};

// Global Exposure
window.views = {
    renderHomeView,
    renderCatalogView,
    renderAdminView,
    renderSettingsView,
    getDesignCardHtml,
    renderCartItems
};
