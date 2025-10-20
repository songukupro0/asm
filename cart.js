document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
    setupSearchForm();
    populateNavCategories();
    loadCart();
    loadRelatedProducts();
    setupCheckoutButton();
    renderFooter();
});

function setupCheckoutButton() {
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (currentUser) {
                window.location.href = 'checkout.html';
            } else {
                alert('Vui lòng đăng nhập để tiến hành thanh toán.');
                window.location.href = 'login.html?redirect=checkout.html';
            }
        });
    }
}
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    const cart = getCart();
    const container = document.getElementById('cart-items-container');
    
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p>Hãy mua hàng đi mà.</p>';
        updateTotals(0);
        return;
    }

    const cartHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-info">
                <p class="item-name">${item.name}</p>
                <p class="item-price">${formatCurrency(item.price)}</p>
            </div>
            <div class="item-quantity">
                <button onclick="updateQuantity('${item.sku}', -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity('${item.sku}', 1)">+</button>
            </div>
            <div class="item-subtotal">${formatCurrency(item.price * item.quantity)}</div>
            <button class="item-remove" onclick="removeItem('${item.sku}')">&times;</button>
        </div>
    `).join('');

    container.innerHTML = cartHTML;
    calculateTotal();
}

function calculateTotal() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    updateTotals(total);
}

function updateTotals(total) {
    const subtotalEl = document.getElementById('subtotal-price');
    const totalEl = document.getElementById('total-price');
    if (subtotalEl && totalEl) {
        subtotalEl.textContent = formatCurrency(total);
        totalEl.textContent = formatCurrency(total);
    }
}

function updateQuantity(sku, change) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.sku === sku);

    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1); // Xóa sản phẩm nếu số lượng <= 0
        }
    }

    saveCart(cart);
    loadCart(); // Tải lại giao diện giỏ hàng
}

function removeItem(sku) {
    let cart = getCart().filter(item => item.sku !== sku);
    saveCart(cart);
    loadCart();
}

async function loadRelatedProducts() {
    const grid = document.getElementById('related-products-grid');
    if (!grid) return;

    try {
        const response = await fetch('http://localhost:3000/products?_limit=6');
        const products = await response.json();

        const relatedProductsHTML = products.map(product => {
            if (product.variants && product.variants.length > 0) {
                const variant = product.variants[0];                const imageUrl = variant.images && variant.images.length > 0 ? variant.images[0] : 'https://placehold.co/800x800/EFEFEF/AAAAAA/png?text=No+Image';
                const fullName = `${product.name} ${variant.storage || ''}`.trim();
                return `
                    <div class="product-item">
                        <a href="../user/product-detail.html?id=${product.id}">
                            <img src="${imageUrl}" alt="${fullName}" loading="lazy">
                            <h3>${fullName}</h3>
                            <div class="price">
                                <span class="new-price">${formatCurrency(variant.price.current)}</span>
                            </div>
                        </a>
                    </div>
                `;
            }
            return '';
        }).join('');

        grid.innerHTML = relatedProductsHTML;
    } catch (error) {
        console.error('Lỗi tải sản phẩm liên quan:', error);
    }
}    
