let currentImages = []; // Not used for Upload mode, but kept for legacy ref

// Check Session on Load
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        showAdminContent();
    }
});

// Check Auth
async function checkAdmin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-pass').value;
    const btn = document.querySelector('.login-box button');

    if (!email || !password) {
        alert('يرجى إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }

    try {
        btn.textContent = 'جاري التحقق...';
        btn.disabled = true;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        showAdminContent();

    } catch (error) {
        console.error('Login Error:', error);
        alert('فشل تسجيل الدخول: ' + (error.message === 'Invalid login credentials' ? 'بيانات الدخول غير صحيحة' : error.message));
    } finally {
        btn.textContent = 'دخول';
        btn.disabled = false;
    }
}

function showAdminContent() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    // Initialize with Products Tab
    switchTab('products');
    renderProductsTable();
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Logout Error:', error);
    }
    location.reload();
}

// Upload helper
async function uploadImage(file) {
    // Generate clean filename
    const ext = file.name.split('.').pop();
    const fileName = `prop_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;

    // Upload
    const { data, error } = await supabaseClient
        .storage
        .from('products')
        .upload(fileName, file);

    if (error) {
        console.error('Upload Error:', error);
        alert('فشل رفع الصورة: ' + error.message);
        return null;
    }

    // Get Public URL
    const { data: publicData } = supabaseClient
        .storage
        .from('products')
        .getPublicUrl(fileName);

    return publicData.publicUrl;
}



// Handle Edit Product
async function handleEdit(id) {
    try {
        // Fetch product data
        const product = await getProductById(id);
        if (!product) {
            alert('لم يتم العثور على الساعه');
            return;
        }

        // Set form title
        const formTitle = document.querySelector('.form-panel h2');
        formTitle.textContent = 'تعديل الساعه';

        // Fill form fields
        document.getElementById('product-id').value = product.id;
        document.getElementById('p-name').value = product.name;
        document.getElementById('p-price').value = product.price;
        document.getElementById('p-old-price').value = product.old_price || '';
        document.getElementById('p-label').value = product.label || '';
        document.getElementById('p-details').value = product.details || '';

        // Set category
        document.getElementById('p-category').value = product.category || '';

        // Show existing images (optional preview)
        const previewContainer = document.getElementById('images-preview-container');
        previewContainer.innerHTML = '';
        if (product.images && product.images.length > 0) {
            product.images.forEach(imgUrl => {
                const img = document.createElement('img');
                img.src = imgUrl;
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                img.style.border = '2px solid #4CAF50';
                img.title = 'صورة موجودة';
                previewContainer.appendChild(img);
            });
        }

        // Update submit button text
        const submitBtn = document.querySelector('#add-product-form button[type="submit"]');
        submitBtn.textContent = 'تحديث الساعه';

        // Show cancel button
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'inline-block';

        // Scroll to form
        document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        console.error('Error loading product for edit:', err);
        alert('حدث خطأ أثناء تحميل بيانات الساعه');
    }
}

// Reset form to add mode
function resetFormToAddMode() {
    document.getElementById('product-id').value = '';
    document.querySelector('.form-panel h2').textContent = 'إضافة ساعه جديدة';
    document.querySelector('#add-product-form button[type="submit"]').textContent = 'حفظ الساعه';
    document.getElementById('add-product-form').reset();
    document.getElementById('images-preview-container').innerHTML = '';

    // Hide cancel button
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

// Handle Add/Edit Product
async function handleAddProduct(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'جاري الحفظ والرفع...';
    submitBtn.disabled = true;

    try {
        const id = document.getElementById('product-id').value; // If editing
        const name = document.getElementById('p-name').value;
        const price = Number(document.getElementById('p-price').value);
        const oldPrice = document.getElementById('p-old-price').value ? Number(document.getElementById('p-old-price').value) : null;

        // Get Category from text input
        const category = document.getElementById('p-category').value.trim();
        if (!category) {
            alert('يرجى إدخال التصنيف');
            throw new Error('No category');
        }

        const label = document.getElementById('p-label').value;
        const details = document.getElementById('p-details').value;

        const imageInput = document.getElementById('p-images');
        let imageUrls = [];

        // 1. Upload Images (if new images selected)
        if (imageInput.files && imageInput.files.length > 0) {
            for (let i = 0; i < imageInput.files.length; i++) {
                const file = imageInput.files[i];
                if (file.size > 1 * 1024 * 1024) {
                    alert(`الصورة ${file.name} أكبر من 1 ميجا، لن يتم رفعها.`);
                    continue;
                }
                const url = await uploadImage(file);
                if (url) imageUrls.push(url);
            }
        }

        // Build product data
        const productData = {
            name,
            price,
            old_price: oldPrice,
            category,
            label: label || null,
            details,
        };

        // Add images only if new ones were uploaded
        if (imageUrls.length > 0) {
            productData.images = imageUrls;
        }

        if (id) {
            // Edit Mode
            // If no new images, we keep the old ones (don't update images field)
            if (imageUrls.length === 0) {
                // Fetch existing product to preserve images
                const existingProduct = await getProductById(id);
                if (existingProduct && existingProduct.images) {
                    productData.images = existingProduct.images;
                }
            }

            const { error } = await updateProductInDB(id, productData);
            if (error) throw new Error(error);

            alert('تم تحديث الساعه بنجاح!');
            resetFormToAddMode();
            renderProductsTable();
        } else {
            // Create Mode
            if (imageUrls.length === 0) {
                alert('يرجى اختيار صورة للساعه');
                throw new Error('No image');
            }

            const { error } = await addProductToDB(productData);
            if (error) throw new Error(error.message);

            alert('تم إضافة الساعه بنجاح!');
            e.target.reset();
            document.getElementById('images-preview-container').innerHTML = '';
            renderProductsTable();
        }

    } catch (err) {
        console.error(err);
        // Alert handled or logs
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

// Render Table (Async)
async function renderProductsTable() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">جاري تحميل البيانات...</td></tr>';

    const products = await getProducts();
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">لا توجد ساعات</td></tr>';
        return;
    }

    products.forEach(p => {
        const img = (p.images && p.images[0]) ? p.images[0] : (p.image || '');
        const row = `
            <tr>
                <td><img src="${img}" class="admin-img-thumb" alt="img"></td>
                <td>${p.name}</td>
                <td>${p.price}</td>
                <td>${p.category}</td>
                <td>
                    <button class="btn btn-sm" onclick="handleEdit('${p.id}')" style="transform: scale(0.8); background: #4CAF50;">تعديل</button>
                    <button class="btn btn-sm" onclick="handleDelete('${p.id}')" style="background:red; transform: scale(0.8)">حذف</button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

async function handleDelete(id) {
    if (confirm('هل أنت متأكد من الحذف؟')) {
        const { error } = await deleteProductFromDB(id);
        if (error) {
            alert('حدث خطأ: ' + error);
        } else {
            renderProductsTable();
        }
    }
}

// Preview Images (Frontend only)
function previewImages(input) {
    const container = document.getElementById('images-preview-container');
    container.innerHTML = '';

    if (input.files) {
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                container.appendChild(img);
            }
            reader.readAsDataURL(file);
        });
    }
}

// Tab Switcher
function switchTab(tabName) {
    const productsView = document.getElementById('products-view');
    const ordersView = document.getElementById('orders-view');
    const btnProducts = document.getElementById('btn-products');
    const btnOrders = document.getElementById('btn-orders');

    // Reset all
    productsView.style.display = 'none';
    ordersView.style.display = 'none';

    btnProducts.classList.replace('btn', 'btn-outline');
    btnOrders.classList.replace('btn', 'btn-outline');

    if (tabName === 'products') {
        productsView.style.display = 'block';
        btnProducts.classList.replace('btn-outline', 'btn');
        renderProductsTable();
    } else {
        ordersView.style.display = 'block';
        btnOrders.classList.replace('btn-outline', 'btn');
        renderOrdersTable();
    }
}

// Render Orders Table
async function renderOrdersTable() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">جاري تحميل الطلبات...</td></tr>';

    const orders = await getOrders();
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">لا توجد طلبات حتى الآن</td></tr>';
        return;
    }

    orders.forEach(order => {
        // Format Items
        let itemsHtml = '<ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9rem;">';
        if (Array.isArray(order.items)) {
            order.items.forEach(item => {
                itemsHtml += `<li style="margin-bottom: 4px;">- ${item.name} x${item.quantity}</li>`;
            });
        }
        itemsHtml += '</ul>';

        // Format Date
        const date = new Date(order.created_at).toLocaleDateString('ar-EG', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Status Colors
        let statusColor = '#ffc107'; // pending (yellow)
        if (order.status === 'shipped') statusColor = '#2196F3'; // blue
        if (order.status === 'delivered') statusColor = '#4CAF50'; // green
        if (order.status === 'cancelled') statusColor = '#F44336'; // red

        const row = `
            <tr>
                <td>#${order.id}</td>
                <td style="font-size: 0.85rem;">${date}</td>
                <td>
                    <strong>${order.customer_name}</strong><br>
                    <a href="tel:${order.customer_phone}" style="text-decoration: none; color: #2196F3;">${order.customer_phone}</a><br>
                    <span style="font-size: 0.85rem; color: #666;">${order.governorate}</span><br>
                    <span style="font-size: 0.8rem; color: #888;">${order.customer_address}</span>
                </td>
                <td>${itemsHtml}</td>
                <td style="font-weight: bold;">${order.total_price} ج.م</td>
                <td>
                    <span style="background: ${statusColor}; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                        ${translateStatus(order.status)}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 5px; align-items: center;">
                        <select onchange="handleStatusChange('${order.id}', this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid #ddd; width: 110px;">
                            <option value="" disabled selected>تغيير الحالة</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="shipped">تم الشحن</option>
                            <option value="delivered">تم التسليم</option>
                            <option value="cancelled">ملغي</option>
                        </select>
                        <button onclick="handleDeleteOrder('${order.id}')" style="background: red; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">حذف</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function translateStatus(status) {
    const map = {
        'pending': 'قيد الانتظار',
        'shipped': 'تم الشحن',
        'delivered': 'تم التسليم',
        'cancelled': 'ملغي'
    };
    return map[status] || status;
}

// Handle Status Change
async function handleStatusChange(orderId, newStatus) {
    if (!newStatus) return;

    // Optimistic Update (optional, or just reload)
    const { error } = await updateOrderStatus(orderId, newStatus);

    if (error) {
        alert('حدث خطأ أثناء تحديث الحالة: ' + error);
    } else {
        // form feedback
        // Re-render to show updated status pill
        renderOrdersTable();
    }
}

// Handle Delete Order
async function handleDeleteOrder(id) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
        const { error } = await deleteOrderFromDB(id);
        if (error) {
            alert('حدث خطأ أثناء الحذف: ' + error);
        } else {
            renderOrdersTable();
            alert('تم حذف الطلب بنجاح');
        }
    }
}



