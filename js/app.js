/**
 * Main Application Logic
 * Wire together the data store, templates, routing, and event listeners.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Core Elements
    const appContent = document.getElementById('app-content');
    const searchModal = document.getElementById('image-search-modal');
    const clientLoginModal = document.getElementById('client-login-modal');
    const cartModal = document.getElementById('cart-modal');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const cartBadge = document.getElementById('cart-badge');
    const navCartBtn = document.getElementById('nav-cart-btn');
    const navAccountBtn = document.getElementById('nav-account-btn');
    const cartContentArea = document.getElementById('cart-content-area');

    // Current State
    let currentRoute = 'home';
    const store = window.appStore;
    const views = window.views;

    // ----- Routing Engine -----

    function navigateTo(route) {
        currentRoute = route;
        updateNavLinks();
        
        switch (route) {
            case 'home':
                appContent.innerHTML = views.renderHomeView();
                break;
            case 'catalog':
                appContent.innerHTML = views.renderCatalogView();
                initCatalogEvents();
                break;
            case 'settings':
                if (!store.isClient()) {
                    clientLoginModal.classList.add('active');
                    navigateTo('home');
                    return;
                }
                appContent.innerHTML = views.renderSettingsView();
                initSettingsEvents();
                break;
            default:
                appContent.innerHTML = views.renderHomeView();
        }
        
        // Ensure menu closes on navigation
        navLinks.classList.remove('active');
    }

    // --- Secret Admin Handshake ---
    const brandLogo = document.querySelector('.brand-logo');
    let logoClickCount = 0;
    let logoClickTimer;

    brandLogo.addEventListener('click', (e) => {
        // We still let the default routing happen, but we track fast clicks silently
        logoClickCount++;
        clearTimeout(logoClickTimer);
        
        if (logoClickCount >= 5) {
            window.location.href = 'admin.html';
            logoClickCount = 0; // reset
        } else {
            logoClickTimer = setTimeout(() => {
                logoClickCount = 0;
            }, 600); // Must be clicked 5 times within 600ms pauses
        }
    });

    function updateNavLinks() {
        document.querySelectorAll('[data-route]').forEach(link => {
            if (link.dataset.route === currentRoute) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        if (store.isClient()) {
            navAccountBtn.textContent = 'Settings';
            navAccountBtn.dataset.route = 'settings';
        } else {
            navAccountBtn.textContent = 'Sign In';
            navAccountBtn.removeAttribute('data-route');
        }
    }

    // --- Cart UI Logic ---
    function updateCartBadge() {
        const cartCount = store.getCart().length;
        if (cartCount > 0) {
            cartBadge.style.display = 'inline-block';
            cartBadge.textContent = cartCount;
        } else {
            cartBadge.style.display = 'none';
        }
    }

    function openCartModal() {
        cartModal.classList.add('active');
        cartContentArea.innerHTML = views.renderCartItems();
    }

    document.getElementById('close-cart-modal').addEventListener('click', () => {
        cartModal.classList.remove('active');
    });

    navCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartModal();
    });

    // Global Click Delegation
    document.body.addEventListener('click', (e) => {
        // Router Links
        const routeLink = e.target.closest('[data-route]');
        if (routeLink) {
            e.preventDefault();
            const route = routeLink.dataset.route;
            navigateTo(route);
        }

        // Search similar via image click
        if (e.target.closest('.card-img-wrapper') && currentRoute === 'catalog') {
            openSearchModal();
        }

        // Add to Cart
        const buyBtn = e.target.closest('.action-buy');
        if (buyBtn) {
            const id = buyBtn.dataset.id;
            if (store.addToCart(id)) {
                updateCartBadge();
                const originalText = buyBtn.innerHTML;
                buyBtn.innerHTML = 'Added ✓';
                buyBtn.style.background = 'var(--success)';
                buyBtn.style.color = '#fff';
                buyBtn.style.borderColor = 'var(--success)';
                setTimeout(() => {
                    buyBtn.innerHTML = originalText;
                    buyBtn.style = '';
                }, 2000);
            } else {
                alert('This design is already in your cart!');
            }
        }

        // Remove from Cart
        const removeBtn = e.target.closest('.btn-remove-cart');
        if (removeBtn) {
            const id = removeBtn.dataset.id;
            store.removeFromCart(id);
            updateCartBadge();
            cartContentArea.innerHTML = views.renderCartItems(); // refresh cart modal
        }

        // Checkout Button
        const checkoutBtn = e.target.closest('#btn-checkout');
        if (checkoutBtn) {
            const cartIds = store.getCart();
            if (cartIds.length > 0) {
                const designs = store.getAllDesigns();
                const cartItems = cartIds.map(id => designs.find(d => d && d.id === id)).filter(Boolean);
                
                let orderDetails = cartItems.map(item => `- ${item.title} (ID: ${item.id}) - ₹${item.price}`).join('%0A');
                let total = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
                
                let text = `Hello Rajee Embroidery! I would like to order the following designs:%0A%0A${orderDetails}%0A%0ATotal: ₹${total.toFixed(2)}%0A%0APlease let me know the payment details.`;
                
                window.open(`https://wa.me/918428705203?text=${text}`, '_blank');
                
                store.clearCart();
                updateCartBadge();
                cartModal.classList.remove('active');
            }
        }
    });

    // Mobile Menu
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // ----- Catalog Logic -----

    function initCatalogEvents() {
        const searchInput = document.getElementById('catalog-search');
        const categorySelect = document.getElementById('catalog-category');
        const grid = document.getElementById('catalog-grid');

        const updateGrid = () => {
            const query = searchInput.value;
            const cat = categorySelect.value;
            const results = store.searchDesigns(query, cat);
            
            if (results.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1;" class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No patterns found</h3>
                        <p class="text-muted">Try adjusting your filters or search terms.</p>
                    </div>`;
            } else {
                grid.innerHTML = results.map(d => views.getDesignCardHtml(d)).join('');
            }
        };

        // Initial Load
        updateGrid();

        // Listeners for realtime search
        searchInput.addEventListener('input', updateGrid);
        categorySelect.addEventListener('change', updateGrid);
    }

    // ----- Image Search Modal Logic -----

    const navUploadBtn = document.getElementById('nav-upload-btn');
    const closeSearchModal = document.getElementById('close-search-modal');
    const searchUploadArea = document.getElementById('search-upload-area');
    const searchImageInput = document.getElementById('search-image-input');
    const searchPreviewContainer = document.getElementById('search-preview-container');
    const searchImagePreview = document.getElementById('search-image-preview');
    const btnFindSimilar = document.getElementById('btn-find-similar');

    function openSearchModal() {
        searchModal.classList.add('active');
        searchUploadArea.style.display = 'block';
        searchPreviewContainer.classList.add('hidden');
        searchImageInput.value = '';
    }

    navUploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSearchModal();
    });

    closeSearchModal.addEventListener('click', () => searchModal.classList.remove('active'));
    searchUploadArea.addEventListener('click', () => searchImageInput.click());

    // Drag and Drop
    searchUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        searchUploadArea.classList.add('dragover');
    });
    searchUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        searchUploadArea.classList.remove('dragover');
    });
    searchUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        searchUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    });

    searchImageInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleImageUpload(e.target.files[0]);
        }
    });

    function handleImageUpload(file) {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            searchImagePreview.src = e.target.result;
            searchUploadArea.style.display = 'none';
            searchPreviewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    btnFindSimilar.addEventListener('click', () => {
        btnFindSimilar.textContent = 'Analyzing patterns...';
        setTimeout(() => {
            searchModal.classList.remove('active');
            btnFindSimilar.textContent = 'Find Matches';
            
            navigateTo('catalog');
            const grid = document.getElementById('catalog-grid');
            const similar = store.findSimilar();
            const headerHtml = `
                <div style="grid-column: 1 / -1; margin-bottom: 1rem; color: var(--brand-gold);">
                    <h3 class="t-h3 text-gold">🎯 Visual Matches Found</h3>
                    <p>Showing patterns similar to your uploaded reference.</p>
                </div>
            `;
            if (similar.length > 0) {
                grid.innerHTML = headerHtml + similar.map(d => views.getDesignCardHtml(d)).join('');
            } else {
                grid.innerHTML = headerHtml + '<p class="text-muted" style="grid-column: 1 / -1;">No patterns in the catalog to match against.</p>';
            }
        }, 800);
    });

    // ----- Client Authentication Logic -----
    navAccountBtn.addEventListener('click', (e) => {
        if (!store.isClient()) {
            e.preventDefault();
            clientLoginModal.classList.add('active');
        }
        // If they are a client, it will be handled by the global data-route="settings" click delegator
    });

    document.getElementById('close-client-login-modal').addEventListener('click', () => {
        clientLoginModal.classList.remove('active');
    });

    document.getElementById('client-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('client-name').value.trim();
        const phone = document.getElementById('client-phone').value.trim();
        
        store.loginClient(phone, name);
        clientLoginModal.classList.remove('active');
        updateNavLinks();
        navigateTo('settings');
    });

    function initSettingsEvents() {
        const btnLogout = document.getElementById('btn-client-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                store.logoutClient();
                updateNavLinks();
                navigateTo('home');
            });
        }
    }

    // Modal Background Close
    window.addEventListener('click', (e) => {
        if (e.target === searchModal) searchModal.classList.remove('active');
        if (e.target === cartModal) cartModal.classList.remove('active');
        if (e.target === clientLoginModal) clientLoginModal.classList.remove('active');
    });

    // ----- Initialization -----
    updateCartBadge();
    navigateTo('home');
});
