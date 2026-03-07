// Update Cart Count in Navbar
function updateCartCount() {
    const cart = getCart(); // Assumes storage.js is loaded
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const badge = document.querySelector('.cart-count');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Toast Notification
function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    initDynamicNavbar();
    initReviewsSlider();
});

/* --- Reviews Slider Logic --- */
let reviewCurrentSlide = 0;
let reviewTotalSlides = 0;
let reviewAutoPlay = null;

function initReviewsSlider() {
    const track = document.getElementById('reviewsTrack');
    const dotsContainer = document.getElementById('reviewsDots');
    if (!track || !dotsContainer) return;

    const slides = track.querySelectorAll('.review-slide');
    reviewTotalSlides = slides.length;
    if (reviewTotalSlides === 0) return;

    // Create dots
    for (let i = 0; i < reviewTotalSlides; i++) {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToReviewSlide(i));
        dotsContainer.appendChild(dot);
    }

    // Auto play
    startReviewAutoPlay();

    // Touch/Swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    const slider = document.getElementById('reviewsSlider');
    if (slider) {
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                // RTL: swipe left = prev, swipe right = next
                if (diff > 0) {
                    changeReviewSlide(-1);
                } else {
                    changeReviewSlide(1);
                }
            }
        }, { passive: true });
    }
}

function goToReviewSlide(index) {
    reviewCurrentSlide = index;
    updateReviewSlider();
    resetReviewAutoPlay();
}

function changeReviewSlide(direction) {
    reviewCurrentSlide = (reviewCurrentSlide + direction + reviewTotalSlides) % reviewTotalSlides;
    updateReviewSlider();
    resetReviewAutoPlay();
}

function updateReviewSlider() {
    const track = document.getElementById('reviewsTrack');
    if (!track) return;
    // RTL: use positive translateX
    track.style.transform = `translateX(${reviewCurrentSlide * 100}%)`;

    // Update dots
    const dots = document.querySelectorAll('.reviews-dots .dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === reviewCurrentSlide);
    });
}

function startReviewAutoPlay() {
    reviewAutoPlay = setInterval(() => {
        reviewCurrentSlide = (reviewCurrentSlide + 1) % reviewTotalSlides;
        updateReviewSlider();
    }, 4000);
}

function resetReviewAutoPlay() {
    clearInterval(reviewAutoPlay);
    startReviewAutoPlay();
}

// Dynamic Navbar: Fetch categories from DB
async function initDynamicNavbar() {
    const navUl = document.querySelector('.nav-links');
    if (!navUl) return;

    // Use current products if available (optimization) 
    // but better to fetch fresh to ensure nav is correct on all pages
    // We can rely on storage.js getProducts which is cached only if we implemented cache (we didn't yet)
    // For now, simple fetch is fine.

    // We already have Supabase Client initialized
    if (typeof getProducts !== 'function') return;

    const products = await getProducts();
    if (!products.length) return;

    // Extract unique categories
    const categories = [...new Set(products.map(p => p.category))];

    // Build HTML
    // Always keep search bar, "Home", and "All Products"
    let html = `
        <li class="nav-search-item">
          <div class="nav-search-bar">
            <svg class="nav-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="navSearchInput" placeholder="ابحث عن ساعه..." autocomplete="off" oninput="performNavSearch()" onkeydown="if(event.key==='Enter'){event.preventDefault();performNavSearch();}">
          </div>
          <div class="nav-search-results" id="navSearchResults"></div>
        </li>
        <li><a href="index">الرئيسية</a></li>
        <li><a href="#" onclick="handleNavClick('all'); return false;">كل الساعات</a></li>
    `;

    categories.forEach(cat => {
        // Translation map (optional, else show raw)
        const displayMap = {
            'men': 'رجالي',
            'women': 'حريمي',
            'kids': 'أطفال',
            'accessories': 'إكسسوارات'
        };
        const displayName = displayMap[cat] || cat; // Fallback to raw value

        // Check if we are on index page to use onclick filter, else link with param
        const isIndex = window.location.pathname.endsWith('index') || window.location.pathname.endsWith('/');

        if (isIndex) {
            html += `<li><a href="#" onclick="handleNavClick('${cat}'); return false;">${displayName}</a></li>`;
        } else {
            html += `<li><a href="index?category=${cat}">${displayName}</a></li>`;
        }
    });

    navUl.innerHTML = html;
}

// Handle Nav Click: filter, close menu, scroll
function handleNavClick(category) {
    // 1. Filter
    if (typeof filterProducts === 'function') {
        filterProducts(category);
    }

    // 2. Close Menu (if open on mobile)
    const navLinks = document.getElementById('navLinks');
    const overlay = document.getElementById('menuOverlay');
    if (navLinks && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
    }

    // 3. Scroll to products
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Mobile Menu Toggle
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    const overlay = document.getElementById('menuOverlay');

    if (navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        navLinks.classList.add('active');
        overlay.classList.add('active');
    }
}


/* --- Hero Slider Logic --- */
document.addEventListener('DOMContentLoaded', () => {
    // initHeroSlider(); // Disabled as we use a single static image now
});

function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dotsContainer = document.getElementById('heroSliderDots');
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');

    if (!slides.length) return;

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoSlideInterval;

    // Create Dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('slider-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.slider-dot');

    function updateSlides() {
        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            dots[index].classList.remove('active');
            if (index === currentSlide) {
                slide.classList.add('active');
                dots[index].classList.add('active');
            }
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlides();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateSlides();
    }

    function goToSlide(index) {
        currentSlide = index;
        updateSlides();
        resetTimer();
    }

    function resetTimer() {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(nextSlide, 5000);
    }

    // Event Listeners
    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
        resetTimer();
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
        resetTimer();
    });

    // Auto Play
    resetTimer();
}

/* --- Mini Cart Popup Logic --- */

function toggleMiniCart(event) {
    if (event) event.preventDefault();
    const popup = document.getElementById('miniCartPopup');
    if (!popup) return;

    const isVisible = popup.classList.contains('show');

    if (isVisible) {
        popup.classList.remove('show');
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300); // Wait for transition
    } else {
        renderMiniCart(); // Render before showing
        popup.style.display = 'block';
        // Small delay to allow display:block to apply before opacity transition
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);
    }
}

function renderMiniCart() {
    const cartItemsContainer = document.getElementById('miniCartItems');
    const totalEl = document.getElementById('miniCartTotal');
    const badge = document.querySelector('.cart-count');

    if (!cartItemsContainer || !totalEl) return;

    const cart = getCart(); // from storage.js

    // Calculate Total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalEl.textContent = total + ' ج.م';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center" style="padding: 20px; color: #888;">سلة المشتريات فارغة</p>';
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="mini-cart-item">
            <!-- Image Removed as per request -->
            <div class="mini-cart-item-details">
                <span class="mini-cart-item-title">${item.name}</span>
                <div class="mini-cart-item-meta">
                    ${item.color ? `<span> | اللون: ${item.color}</span>` : ''}
                </div>
                
                <div class="price-qty-wrapper">
                    <div class="mini-cart-item-price">${item.price} ج.م</div>
                    <div class="mini-cart-qty-control">
                        <button class="qty-btn-mini" onclick="event.stopPropagation(); updateCartItemQuantity('${item.id}', 1)">+</button>
                        <span class="qty-display-mini">${item.quantity}</span>
                        <button class="qty-btn-mini" onclick="event.stopPropagation(); updateCartItemQuantity('${item.id}', -1)">-</button>
                    </div>
                </div>
            </div>
            <button class="remove-item-btn" onclick="event.stopPropagation(); removeFromCart('${item.id}')" title="حذف">
                &times;
            </button>
        </div>
    `).join('');
}

// Listen for updates from storage.js
window.addEventListener('cartUpdated', () => {
    // If popup is open, re-render it
    const popup = document.getElementById('miniCartPopup');
    if (popup && popup.classList.contains('show')) {
        renderMiniCart();
    }
});

// Close popup when clicking outside
document.addEventListener('click', (e) => {
    const popup = document.getElementById('miniCartPopup');
    const cartBtn = document.querySelector('.cart-icon');

    // If click is outside popup AND outside cart button
    if (popup && popup.classList.contains('show') &&
        !popup.contains(e.target) &&
        !cartBtn.contains(e.target) &&
        !e.target.closest('.cart-wrapper')) { // Added wrapper check just in case

        toggleMiniCart(null); // Close it
    }
});

function continueShopping(event) {
    if (event) event.preventDefault();

    // Close the popup first
    toggleMiniCart(null);

    // Navigate to homepage products section
    // If already on index, scrolling handles it (or just anchor jump)
    // If on other pages, full navigation needed

    const isIndex = window.location.pathname.endsWith('index') || window.location.pathname.endsWith('/');

    if (isIndex) {
        const productsSection = document.getElementById('products-section');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = '#products-section';
        }
    } else {
        window.location.href = 'index#products-section';
    }
}
