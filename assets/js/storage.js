const PRODUCTS_TABLE = 'products';
const CART_KEY = 'ghazma_cart';

// --- Product Helpers (Supabase) ---

/**
 * Fetch all products from Supabase
 * @returns {Promise<Array>} Array of product objects
 */
async function getProducts() {
    if (!supabaseClient) {
        console.error('Supabase client not initialized');
        return [];
    }

    try {
        const { data, error } = await supabaseClient
            .from(PRODUCTS_TABLE)
            .select('*')
            .order('created_at', { ascending: false }); // الأحدث أولاً

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching products:', err.message);
        return [];
    }
}

/**
 * Get a single product by ID
 */
async function getProductById(id) {
    if (!supabaseClient) return null;

    try {
        const { data, error } = await supabaseClient
            .from(PRODUCTS_TABLE)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.warn('Product not found or error:', error.message);
            return null;
        }
        return data;

    } catch (err) {
        console.error('Error fetching product by ID:', err.message);
        return null;
    }
}

/**
 * Add a new product to Supabase
 */
async function addProductToDB(productData) {
    if (!supabaseClient) return { error: 'Client not ready' };

    try {
        const { data, error } = await supabaseClient
            .from(PRODUCTS_TABLE)
            .insert([productData])
            .select();

        if (error) throw error;
        return { data };

    } catch (err) {
        console.error('Error adding product:', err.message);
        return { error: err.message };
    }
}

/**
 * Update an existing product in Supabase
 */
async function updateProductInDB(id, productData) {
    if (!supabaseClient) return { error: 'Client not ready' };

    try {
        // نحدث created_at لكي تظهر الساعة في الأعلى عند الترتيب
        productData.created_at = new Date().toISOString();

        const { data, error } = await supabaseClient
            .from(PRODUCTS_TABLE)
            .update(productData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return { data };
    } catch (err) {
        console.error('Error updating product:', err.message);
        return { error: err.message };
    }
}

/**
 * Delete product from Supabase
 */
async function deleteProductFromDB(id) {
    if (!supabaseClient) return { error: 'Client not ready' };

    try {
        const { error } = await supabaseClient
            .from(PRODUCTS_TABLE)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        return { error: err.message };
    }
}

// --- Order Helpers (Supabase) ---

const ORDERS_TABLE = 'orders';

/**
 * Create a new order
 */
async function createOrder(orderData) {
    if (!supabaseClient) return { error: 'Client not ready' };

    try {
        const { data, error } = await supabaseClient
            .from(ORDERS_TABLE)
            .insert([orderData])
            .select();

        if (error) throw error;
        return { data };
    } catch (err) {
        console.error('Error creating order:', err.message);
        return { error: err.message };
    }
}

/**
 * Get all orders (for Admin)
 */
async function getOrders() {
    if (!supabaseClient) return [];

    try {
        const { data, error } = await supabaseClient
            .from(ORDERS_TABLE)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching orders:', err.message);
        return [];
    }
}

/**
 * Update order status
 */
async function updateOrderStatus(id, newStatus) {
    if (!supabaseClient) return { error: 'Client not ready' };

    try {
        const { data, error } = await supabaseClient
            .from(ORDERS_TABLE)
            .update({ status: newStatus })
            .eq('id', id)
            .select();

        if (error) throw error;
        return { data };
    } catch (err) {
        console.error('Error updating order status:', err.message);
        return { error: err.message };
    }
}

/**
 * Delete order from Supabase
 */
async function deleteOrderFromDB(id) {
    if (!supabaseClient) return { error: 'Client not ready' };

    try {
        const { error } = await supabaseClient
            .from(ORDERS_TABLE)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        return { error: err.message };
    }
}






// --- Cart Helpers (LocalStorage - unchanged logic) ---

function getCart() {
    const cart = sessionStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(product, quantity = 1, selectedSize, selectedColor) {
    let cart = getCart();

    const existingItemIndex = cart.findIndex(item =>
        item.productId === product.id &&
        item.size === selectedSize &&
        item.color === selectedColor
    );

    const mainImage = (product.images && product.images.length > 0)
        ? product.images[0]
        : (product.image || 'assets/images/placeholder.jpg');

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({
            id: Date.now().toString(),
            productId: product.id,
            name: product.name,
            price: product.price,
            image: mainImage,
            quantity: quantity,
            size: selectedSize,
            color: selectedColor
        });
    }
    saveCart(cart);
    updateCartCount();

    if (typeof showToast === 'function') {
        showToast('تمت إضافة الساعه للسلة بنجاح');
    } else {
        alert('تمت إضافة الساعه للسلة');
    }
}


function removeFromCart(cartItemId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== cartItemId);
    saveCart(cart);
    updateCartCount();
    // Dispatch event for UI updates
    window.dispatchEvent(new Event('cartUpdated'));
    if (typeof showToast === 'function') showToast('تم حذف الساعه من السلة');
}

function updateCartItemQuantity(cartItemId, change) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === cartItemId);

    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;

        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1); // Remove if quantity becomes 0 or less
        }

        saveCart(cart);
        updateCartCount();
        // Dispatch event so other components (like mini cart) can update
        window.dispatchEvent(new Event('cartUpdated'));
    }
}

function clearCart() {
    sessionStorage.removeItem(CART_KEY);
    updateCartCount();
    window.dispatchEvent(new Event('cartUpdated'));
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-count'); // Update all badges (desktop/mobile)
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
        // Animation effect
        if (count > 0) {
            badge.classList.remove('pulse');
            void badge.offsetWidth; // trigger reflow
            badge.classList.add('pulse');
        }
    });
}


// Initialize Cart Count on Load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});
