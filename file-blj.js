const API = '';
let token = localStorage.getItem('gz_token');
let currentUser = JSON.parse(localStorage.getItem('gz_user') || 'null');
let isLoginMode = true;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateAuthUI();
});

// ==================== API HELPER ====================
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(`${API}${endpoint}`, options);
    return res.json();
}

// ==================== PRODUCTS ====================
async function loadProducts(platform = '', search = '') {
    let url = '/api/products?limit=20';
    if (platform && platform !== 'all') url += `&platform=${platform}`;
    if (search) url += `&search=${search}`;

    const data = await apiCall(url);
    renderProducts(data.products || []);
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');

    if (products.length === 0) {
        grid.innerHTML = '<p style="color:#888; text-align:center; grid-column:1/-1;">No games found 😕</p>';
        return;
    }

    grid.innerHTML = products.map(p => {
        const discount = Math.round((1 - p.price / p.originalPrice) * 100);
        const stars = '★'.repeat(Math.round(p.rating?.average || 4)) + '☆'.repeat(5 - Math.round(p.rating?.average || 4));
        const conditionMap = {
            'new': '✨ New', 'like-new': '🌟 Like New',
            'excellent': '👍 Excellent', 'good': '👌 Good', 'fair': '📦 Fair'
        };

        return `
            <div class="product-card">
                <div class="product-image">
                    <span class="badge ${discount >= 30 ? 'badge-sale' : 'badge-new'}">
                        ${discount >= 30 ? '🔥 ' + discount + '% OFF' : conditionMap[p.condition] || '🎮'}
                    </span>
                    ${p.emoji || '🎮'}
                </div>
                <div class="product-info">
                    <div class="product-platform">${(p.platform || '').toUpperCase()}</div>
                    <div class="stars">${stars}</div>
                    <h3 class="product-name">${p.name}</h3>
                    <p class="product-condition">${conditionMap[p.condition] || p.condition}</p>
                    <div class="product-pricing">
                        <span class="current-price">₹${p.price.toLocaleString()}</span>
                        <span class="original-price">₹${p.originalPrice.toLocaleString()}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-cart" onclick="addToCart('${p._id}')">🛒 Add to Cart</button>
                        <button class="btn-wishlist" onclick="toggleWishlist('${p._id}')">♡</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterByPlatform(platform, btn) {
    if (btn) {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
    }
    loadProducts(platform);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function searchProducts() {
    const term = document.getElementById('searchInput').value;
    loadProducts('', term);
}

// ==================== CART ====================
async function addToCart(productId) {
    if (!token) {
        showNotification('⚠️ Please login first!');
        toggleAuth();
        return;
    }

    const data = await apiCall('/api/cart/add', 'POST', { productId, quantity: 1 });
    showNotification(data.message || '✅ Added to cart!');
    updateCartCount(data.cart);
}

async function loadCart() {
    if (!token) return;
    const cart = await apiCall('/api/cart');
    renderCart(cart);
}

function renderCart(cart) {
    const itemsEl = document.getElementById('cartItems');
    const footerEl = document.getElementById('cartFooter');
    const countEl = document.getElementById('cartCount');

    if (!cart || !cart.items || cart.items.length === 0) {
        itemsEl.innerHTML = '<p style="color:#888;text-align:center;padding:40px;">Cart is empty</p>';
        footerEl.style.display = 'none';
        countEl.textContent = '0';
        return;
    }

    countEl.textContent = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    footerEl.style.display = 'block';
    document.getElementById('cartTotal').textContent = `₹${(cart.totalPrice || 0).toLocaleString()}`;

    itemsEl.innerHTML = cart.items.map(item => {
        const p = item.product;
        if (!p) return '';
        return `
            <div class="cart-item">
                <div class="cart-item-img">${p.emoji || '🎮'}</div>
                <div class="cart-item-info">
                    <h4>${p.name} ${item.quantity > 1 ? `(x${item.quantity})` : ''}</h4>
                    <span class="price">₹${(p.price * item.quantity).toLocaleString()}</span>
                </div>
                <button class="remove-item" onclick="removeFromCart('${p._id}')">🗑️</button>
            </div>
        `;
    }).join('');
}

function updateCartCount(cart) {
    if (cart && cart.items) {
        document.getElementById('cartCount').textContent = cart.items.reduce((s, i) => s + i.quantity, 0);
    }
}

async function removeFromCart(productId) {
    const data = await apiCall(`/api/cart/remove/${productId}`, 'DELETE');
    showNotification('🗑️ Removed from cart');
    renderCart(data.cart);
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    sidebar.classList.toggle('active');
    if (sidebar.classList.contains('active')) {
        loadCart();
    }
}

// ==================== ORDERS ====================
async function placeOrder() {
    if (!token) {
        showNotification('⚠️ Please login first!');
        return;
    }

    const address = prompt('📍 Enter delivery address (Street, City, State, Pincode):');
    if (!address) return;

    const parts = address.split(',').map(s => s.trim());

    const data = await apiCall('/api/orders/place', 'POST', {
        shippingAddress: {
            name: currentUser?.name || 'User',
            phone: currentUser?.phone || '',
            street: parts[0] || address,
            city: parts[1] || '',
            state: parts[2] || '',
            pincode: parts[3] || ''
        },
        paymentMethod: 'cod'
    });

    if (data.order) {
        showNotification(`🎉 Order placed! Tracking: ${data.order.trackingId}`);
        toggleCart();
        document.getElementById('cartCount').textContent = '0';
    } else {
        showNotification('❌ ' + (data.message || 'Order failed'));
    }
}

// ==================== AUTH ====================
function toggleAuth() {
    document.getElementById('authModal').classList.toggle('active');
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').textContent = isLoginMode ? 'Login' : 'Create Account';
    document.getElementById('authSubmitBtn').textContent = isLoginMode ? 'Login' : 'Register';
    document.getElementById('registerFields').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('authToggleText').textContent = isLoginMode ? 'New user?' : 'Already have account?';
    document.getElementById('authToggleLink').textContent = isLoginMode ? 'Create Account' : 'Login';
}

async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    if (!email || !password) {
        showNotification('⚠️ Please fill all fields');
        return;
    }

    let data;
    if (isLoginMode) {
        data = await apiCall('/api/auth/login', 'POST', { email, password });
    } else {
        const name = document.getElementById('regName').value;
        const phone = document.getElementById('regPhone').value;
        if (!name || !phone) {
            showNotification('⚠️ Please fill all fields');
            return;
        }
        data = await apiCall('/api/auth/register', 'POST', { name, email, phone, password });
    }

    if (data.token) {
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('gz_token', token);
        localStorage.setItem('gz_user', JSON.stringify(data.user));
        updateAuthUI();
        toggleAuth();
        showNotification(`✅ Welcome, ${data.user.name}!`);
    } else {
        showNotification('❌ ' + (data.message || 'Auth failed'));
    }
}

function updateAuthUI() {
    const btn = document.getElementById('authBtn');
    if (token && currentUser) {
        btn.textContent = `Hi, ${currentUser.name} 👋`;
        btn.onclick = logout;
    } else {
        btn.textContent = 'Login';
        btn.onclick = toggleAuth;
    }
}

function logout() {
    if (confirm('Logout karna hai?')) {
        token = null;
        currentUser = null;
        localStorage.removeItem('gz_token');
        localStorage.removeItem('gz_user');
        updateAuthUI();
        document.getElementById('cartCount').textContent = '0';
        showNotification('👋 Logged out!');
    }
}

// ==================== WISHLIST ====================
async function toggleWishlist(productId) {
    if (!token) {
        showNotification('⚠️ Please login first!');
        return;
    }
    const data = await apiCall(`/api/auth/wishlist/${productId}`, 'POST');
    showNotification(data.message || '♥️ Updated!');
}

// ==================== SELL ====================
function showSellForm() {
    if (!token) {
        showNotification('⚠️ Please login first to sell games!');
        toggleAuth();
        return;
    }

    const name = prompt('🎮 Game name:');
    if (!name) return;
    const platform = prompt('Platform (ps5/xbox/nintendo/pc):');
    const price = prompt('💰 Your selling price (₹):');
    const condition = prompt('Condition (new/like-new/excellent/good/fair):');

    if (name && platform && price && condition) {
        apiCall('/api/products', 'POST', {
            name,
            description: `${name} for ${platform} - ${condition} condition`,
            price: Number(price),
            originalPrice: Math.round(Number(price) * 1.4),
            platform,
            condition,
            category: 'game',
            emoji: '🎮',
            stock: 1
        }).then(data => {
            showNotification(data.message || '✅ Game listed for sale!');
            loadProducts();
        });
    }
}

// ==================== NOTIFICATION ====================
function showNotification(msg) {
    const el = document.getElementById('notification');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}