// Helper to get params
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
const productLabel = urlParams.get('label');

let currentProduct = null;

let currentImageIndex = 0;

async function renderProductDetails() {
  const container = document.getElementById('product-content');
  if (!container) return;

  container.innerHTML = '<div style="text-align: center; width: 100%; padding: 50px;">جاري التحميل...</div>';

  if (!productId && !productLabel) {
    window.location.href = 'index';
    return;
  }

  // Optimize: Try fetching single product first if ID exists
  if (productId) {
    currentProduct = await getProductById(productId);
  }
  // Fallback or Label search
  else {
    const products = await getProducts();
    currentProduct = products.find(p => p.label === productLabel);
  }

  if (!currentProduct) {
    container.innerHTML = '<h2>الساعه غير موجوده</h2>';
    return;
  }

  // Ensure images array & Fallbacks
  const images = (currentProduct.images && currentProduct.images.length > 0)
    ? currentProduct.images
    : (currentProduct.image ? [currentProduct.image] : ['assets/images/placeholder.jpg']);

  // Preload images
  preloadImages(images);





  const imageHtml = `
  <div class="slider-container">
    <img id="main-product-img" src="${images[0]}" alt="${currentProduct.name}" class="slider-img" onclick="openImageZoom()">
      ${images.length > 1 ? `
        <div class="slider-controls">
            <button class="slider-btn prev-btn" onclick="nextImage()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            
            <button class="slider-btn next-btn" onclick="prevImage()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
        ` : ''}
  </div>`;

  container.innerHTML = `
    <div class="product-image">
      ${imageHtml}
    </div>
    <div class="product-info">
      <div class="product-header">
          <h1>${currentProduct.name}</h1>
      </div>

      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
        <span class="product-price" style="margin-bottom: 0;">${currentProduct.price} ج.م</span>
        ${currentProduct.old_price ? `<span style="text-decoration: line-through; color: #999; font-size: 1.2rem;">${currentProduct.old_price} ج.م</span>` : ''}
        
        <button class="share-btn" onclick="shareProduct('${currentProduct.name}', '${window.location.href}')" style="margin-right: 0;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
              مشاركة
          </button>
      </div>
      


      ${currentProduct.details ? `
      <div class="product-description-section">
          <span class="product-description-title">تفاصيل الساعه:</span>
          <p class="product-description-text">${currentProduct.details}</p>
      </div>
      ` : ''}

      <button onclick="handleAddToCart()" class="btn add-to-cart-btn">إضافة إلى السلة</button>
    </div>
  `;
  setupSwipeGestures();
}

function nextImage() {
  const images = (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images : [currentProduct.image];
  currentImageIndex = (currentImageIndex + 1) % images.length;
  updateSliderImage();
}

function prevImage() {
  const images = (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images : [currentProduct.image];
  currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
  updateSliderImage();
}

function updateSliderImage() {
  const img = document.getElementById('main-product-img');
  const images = (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images : [currentProduct.image];

  // Smooth CSS transition
  img.style.opacity = '0.5';

  // Short delay to trigger the transition effect
  setTimeout(() => {
    img.src = images[currentImageIndex];
    img.style.opacity = '1';
  }, 100);
}

function preloadImages(imageUrls) {
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

function handleAddToCart() {
  // Add to cart without size
  addToCart(currentProduct, 1, null, '');
}

function shareProduct(title, url) {
  if (navigator.share) {
    navigator.share({
      title: title,
      url: url
    }).catch(err => {
      console.log('Error sharing:', err);
      // Fallback
      copyToClipboard(url);
    });
  } else {
    // Fallback
    copyToClipboard(url);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('تم نسخ الرابط!');
  }).catch(err => {
    alert('تم نسخ الرابط: ' + text);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderProductDetails();
});

function setupSwipeGestures() {
  const slider = document.querySelector('.slider-container');
  if (!slider) return;

  let touchStartX = 0;
  let touchEndX = 0;

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const threshold = 50;
    const swipeDistance = touchStartX - touchEndX;

    // Swipe Left (drag finger left) -> Next Image
    if (swipeDistance > threshold) {
      nextImage();
    }

    // Swipe Right (drag finger right) -> Prev Image
    if (swipeDistance < -threshold) {
      prevImage();
    }
  }
}

// Image Zoom Functionality
function openImageZoom() {
  const img = document.getElementById('main-product-img');
  if (!img) return;

  // Create zoom modal if it doesn't exist
  let zoomModal = document.getElementById('image-zoom-modal');
  if (!zoomModal) {
    zoomModal = document.createElement('div');
    zoomModal.id = 'image-zoom-modal';
    zoomModal.className = 'image-zoom-modal';
    zoomModal.innerHTML = `
      <div class="zoom-overlay" onclick="closeImageZoom()"></div>
      <div class="zoom-content">
        <button class="zoom-close-btn" onclick="closeImageZoom()">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <img id="zoomed-image" src="" alt="Zoomed Product">
      </div>
    `;
    document.body.appendChild(zoomModal);
  }

  // Set the image source
  const zoomedImg = document.getElementById('zoomed-image');
  zoomedImg.src = img.src;

  // Show modal
  zoomModal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeImageZoom() {
  const zoomModal = document.getElementById('image-zoom-modal');
  if (zoomModal) {
    zoomModal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

// Close zoom on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeImageZoom();
  }
});
