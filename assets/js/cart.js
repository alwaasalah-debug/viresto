const governorates = {
  // Delta (50)
  'cairo': { name: 'القاهرة', price: 50 },
  'giza': { name: 'الجيزة', price: 50 },
  'alex': { name: 'الإسكندرية', price: 50 },
  'tanta': { name: 'طنطا', price: 50 },
  'mansoura': { name: 'المنصورة', price: 50 },
  // Upper Egypt (100)
  'aswan': { name: 'أسوان', price: 100 },
  'luxor': { name: 'الأقصر', price: 100 },
  'sohag': { name: 'سوهاج', price: 100 },
  'qena': { name: 'قنا', price: 100 },
  'assuit': { name: 'أسيوط', price: 100 },
  // Middle Egypt/Canal (70)
  // Canal & Others (70)
  'suez': { name: 'السويس', price: 70 },
  'ismailia': { name: 'الإسماعيلية', price: 70 },
  'portsaid': { name: 'بورسعيد', price: 70 },
  'fayoum': { name: 'الفيوم', price: 70 },
  'beni_suef': { name: 'بني سويف', price: 70 },
  'minya': { name: 'المنيا', price: 70 },
  'damietta': { name: 'دمياط', price: 70 },
  'beheira': { name: 'البحيرة', price: 70 },
  'sharqia': { name: 'الشرقية', price: 70 },
  'menofia': { name: 'المنوفية', price: 70 },
  'qalyubia': { name: 'القليوبية', price: 70 },
  'kafr_sheikh': { name: 'كفر الشيخ', price: 70 },
  // Frontier Governorates (70 - per user request to keep same as 'Other')
  'red_sea': { name: 'البحر الأحمر', price: 70 },
  'new_valley': { name: 'الوادي الجديد', price: 70 },
  'matrouh': { name: 'مطروح', price: 70 },
  'north_sinai': { name: 'شمال سيناء', price: 70 },
  'south_sinai': { name: 'جنوب سيناء', price: 70 }
};

let shippingCost = 0;
let subtotal = 0;

function renderCartItem(item) {
  return `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="item-details" style="flex-grow: 1;">
        <h3>${item.name}</h3>
        <div class="item-meta">
        </div>
        <div class="item-controls">
          <div class="qty-wrapper">
            <button class="qty-btn" onclick="updateQty('${item.id}', ${item.quantity + 1})">+</button>
            <input type="number" min="1" value="${item.quantity}" class="qty-input" readonly>
            <button class="qty-btn" onclick="updateQty('${item.id}', ${item.quantity - 1})">-</button>
          </div>
          <span style="font-weight: 500;">${item.price * item.quantity} ج.م</span>
        </div>
      </div>
      <button class="remove-btn" onclick="removeItem('${item.id}')">حذف</button>
    </div>
  `;
}

function renderCart() {
  const container = document.getElementById('cart-content-wrapper');
  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 50px;">
        <h2>سلة التسوق فارغة</h2>
        <a href="index" class="btn mt-2">تسوق الآن</a>
      </div>
    `;
    updateCartCount();
    return;
  }

  // Calculate Subtotal
  subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Generate Options
  let optionsHtml = '<option value="" disabled selected>اختر المحافظة لحساب الشحن</option>';
  for (const [key, data] of Object.entries(governorates)) {
    optionsHtml += `<option value="${key}">${data.name}</option>`;
  }

  const itemsHtml = cart.map(renderCartItem).join('');

  container.innerHTML = `
    <div class="cart-container">
      <div class="cart-items">
        ${itemsHtml}
      </div>
      
      <div class="cart-summary">
        <h3 class="mb-1">بيانات العميل</h3>
        
        <!-- Customer Info Form -->
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">الاسم الكامل *</label>
          <input type="text" id="customer-name" class="form-control" placeholder="أدخل اسمك" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;">
          
          <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">رقم الهاتف *</label>
          <input type="tel" id="customer-phone" class="form-control" placeholder="01xxxxxxxxx" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;">
          
          <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">العنوان بالتفصيل</label>
          <textarea id="customer-address" class="form-control" placeholder="الشارع - المنطقة - معلومات إضافية" rows="2" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px; resize: vertical;"></textarea>
          
          <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">المحافظة *</label>
          <select id="gov-select" class="shipping-select" onchange="calculateShipping(this.value)">
            ${optionsHtml}
          </select>
        </div>

        <h3 class="mb-1" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">ملخص الطلب</h3>
        
        <div class="summary-row">
          <span>مجموع الساعات</span>
          <span>${subtotal} ج.م</span>
        </div>
        
        ${subtotal >= 4000 ? '<div class="summary-row" style="color: green; font-weight: 700;"><span>🎉 شحن مجاني لطلبك!</span><span>0 ج.م</span></div>' : ''}
        
        <div class="summary-row" ${subtotal >= 4000 ? 'style="display:none"' : ''}>
          <span>الشحن</span>
          <span id="shipping-display">--</span>
        </div>
        
        <div class="summary-row summary-total">
          <span>الإجمالي</span>
          <span id="total-display">${subtotal} ج.م</span>
        </div>
        
        <button class="btn" style="width: 100%; margin-top: 15px;" onclick="checkoutCOD()">الدفع عند الاستلام</button>
      </div>
    </div>
  `;
}

function updateQty(itemId, newQty) {
  let cart = getCart();
  const item = cart.find(i => i.id === itemId);
  if (item && newQty >= 1) {
    item.quantity = parseInt(newQty);
    saveCart(cart);
    renderCart(); // Re-render to update totals
    updateCartCount();
  }
}

function removeItem(itemId) {
  if (confirm('هل أنت متأكد من حذف هذه الساعه؟')) {
    removeFromCart(itemId);
    renderCart();
  }
}

function calculateShipping(govKey) {
  if (governorates[govKey]) {
    if (subtotal >= 4000) {
      // Free shipping for orders above 4000 EGP
      shippingCost = 0;
      document.getElementById('total-display').textContent = subtotal + ' ج.م';
    } else {
      shippingCost = governorates[govKey].price;
      document.getElementById('shipping-display').textContent = shippingCost + ' ج.م';
      document.getElementById('total-display').textContent = (subtotal + shippingCost) + ' ج.م';
    }
  }
}

// Override logic: Use fetch for smoother UX
async function checkoutCOD() {
  // Get customer data from form
  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const address = document.getElementById('customer-address').value.trim();
  const govSelect = document.getElementById('gov-select');

  // Validation
  if (!name) {
    showToast('يرجى إدخال الاسم');
    document.getElementById('customer-name').focus();
    return;
  }

  if (!phone) {
    showToast('يرجى إدخال رقم الهاتف');
    document.getElementById('customer-phone').focus();
    return;
  }

  if (!govSelect.value) {
    showToast('يرجى اختيار المحافظة');
    return;
  }

  if (!address) {
    showToast('يرجى إدخال العنوان للدفع عند الاستلام');
    document.getElementById('customer-address').focus();
    return;
  }

  // Prepare Data
  const cart = getCart();
  const shipping = subtotal >= 4000 ? 0 : governorates[govSelect.value].price;
  const total = subtotal + shipping;

  const orderData = {
    customer_name: name,
    customer_phone: phone,
    customer_address: address,
    governorate: governorates[govSelect.value].name,
    items: cart, // Store the array of objects directly
    total_price: total,
    status: 'pending' // Default status
  };

  const btn = document.querySelector('button[onclick="checkoutCOD()"]');
  const originalText = btn.textContent;
  btn.textContent = 'جاري إرسال الطلب...';
  btn.disabled = true;

  try {
    // Call Supabase Helper
    const result = await createOrder(orderData);

    if (result.error) {
      throw new Error(result.error);
    }

    // Success
    clearCart();
    alert('تم استلام طلبك بنجاح! سيتم التواصل معك قريباً.');
    window.location.href = 'index';

  } catch (err) {
    alert('حدث خطأ في الإرسال: ' + err.message);
    console.error(err);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});
