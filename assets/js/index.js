async function renderProducts(filter = 'all') {
    const container = document.getElementById('product-grid');
    if (!container) return; // Guard clause

    // Show loading state
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><p>جاري تحميل الساعات...</p></div>';

    const products = await getProducts();

    container.innerHTML = '';

    const filteredProducts = filter === 'all'
        ? products
        : products.filter(p => p.category === filter);

    if (filteredProducts.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">لا توجد ساعات متاحة حالياً.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const card = document.createElement('article');
        card.className = 'product-card';

        // Prepare Image
        const mainImage = (product.images && product.images.length > 0)
            ? product.images[0]
            : (product.image || 'assets/images/placeholder.jpg');

        card.innerHTML = `
      <div class="product-img-wrapper">
        <span class="badge product-badge">
          ${product.category === 'men' ? 'رجالي' : (product.category === 'women' ? 'حريمي' : product.category)}
        </span>
        <img src="${mainImage}" alt="${product.name}" class="product-img">
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <div class="product-meta">
           <p class="product-price">${product.price} ج.م</p>
           ${product.old_price ? `<p class="product-old-price">${product.old_price} ج.م</p>` : ''}
        </div>
      </div>
    `;

        // Add click event to navigate
        card.addEventListener('click', () => {
            window.location.href = `product?${product.label ? 'label=' + product.label : 'id=' + product.id}`;
        });

        container.appendChild(card);
    });
}

function filterProducts(category) {
    // Update active state in navbar
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });

    // Re-render
    renderProducts(category);
}

// --- Search Feature ---

let allProductsCache = []; // To avoid refetching on every keystroke

function toggleSearch() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');

    if (overlay) {
        if (overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            input.value = '';
            results.innerHTML = '';
            document.body.style.overflow = 'auto'; // Restore scrolling
        } else {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling background
            setTimeout(() => input.focus(), 300); // Focus after transition

            // Load products into cache if empty
            if (allProductsCache.length === 0) {
                getProducts().then(data => {
                    allProductsCache = data;
                });
            }
        }
    }
}

// Search Input Listener
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('searchOverlay');
        if (overlay && overlay.classList.contains('active')) {
            toggleSearch();
        }
    }
});

// --- Nav Drawer Search Feature ---
const navSearchInput = document.getElementById('navSearchInput');
if (navSearchInput) {
    navSearchInput.addEventListener('input', (e) => {
        performNavSearch();
    });
    navSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performNavSearch();
        }
    });
    // Load cache when drawer opens
    if (allProductsCache.length === 0) {
        getProducts().then(data => {
            allProductsCache = data;
        });
    }
}

function performNavSearch() {
    const input = document.getElementById('navSearchInput');
    const resultsContainer = document.getElementById('navSearchResults');
    if (!input || !resultsContainer) return;

    const q = input.value.toLowerCase().trim();

    if (!q) {
        resultsContainer.innerHTML = '';
        return;
    }

    // Ensure products are loaded
    if (allProductsCache.length === 0) {
        getProducts().then(data => {
            allProductsCache = data;
            showNavSearchResults(q, resultsContainer);
        });
    } else {
        showNavSearchResults(q, resultsContainer);
    }
}

function showNavSearchResults(q, container) {
    const matches = allProductsCache.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    );

    if (matches.length === 0) {
        container.innerHTML = '<p class="no-results">لا توجد نتائج</p>';
        return;
    }

    container.innerHTML = matches.slice(0, 8).map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : (p.image || 'assets/images/placeholder.jpg');
        const link = p.label ? `product?label=${p.label}` : `product?id=${p.id}`;
        return `
            <a href="${link}">
                <img src="${img}" alt="${p.name}">
                <span class="search-item-info">
                    <span class="search-item-name">${p.name}</span>
                    <span class="search-item-price">${p.price} ج.م</span>
                </span>
            </a>
        `;
    }).join('');
}

const productsContainer = document.getElementById('product-grid');
if (productsContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');

    if (categoryParam) {
        renderProducts(categoryParam);
    } else {
        renderProducts('all');
    }
}



function performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    const q = query.toLowerCase().trim();

    if (!q) {
        resultsContainer.innerHTML = '';
        return;
    }

    const matches = allProductsCache.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    );

    if (matches.length === 0) {
        resultsContainer.innerHTML = '<p style="grid-column: 1/-1;">لا توجد نتائج</p>';
        return;
    }

    resultsContainer.innerHTML = matches.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : (p.image || 'assets/images/placeholder.jpg');
        return `
            <div class="search-item" onclick="window.location.href='product?id=${p.id}'">
                <img src="${img}" alt="${p.name}">
                <h4>${p.name}</h4>
                <span>${p.price} ج.م</span>
            </div>
         `;
    }).join('');
}

// --- Static Categories Logic ---
document.addEventListener('DOMContentLoaded', () => {
    initStaticCategories();
});

function initStaticCategories() {
    const container = document.getElementById('static-categories-grid');
    if (!container) return;

    // The user will change these image paths later.
    const categories = [
        { name: 'MEN', title: 'MEN', img: 'assets/images/men.jpg' },
        { name: 'WOMEN', title: 'WOMEN', img: 'assets/images/women.jpg' }
    ];

    let html = '';
    categories.forEach(cat => {
        html += `
            <div class="category-card" onclick="handleNavClick('${cat.name}'); return false;">
                <div class="category-img-wrapper">
                    <img src="${cat.img}" alt="${cat.title}">
                    <div class="category-content">
                        <h3>${cat.title}</h3>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}
