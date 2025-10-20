document.addEventListener('DOMContentLoaded', () => {
    let currentProduct = null;
    let selectedVariant = null;

    function updateVariantDetails(variant) {
        selectedVariant = variant;
        if (!variant) return;

        const priceEl = document.getElementById('product-price');
        const oldPriceEl = document.getElementById('product-old-price');
        const mainImageEl = document.getElementById('main-product-image');

        priceEl.textContent = formatCurrency(variant.price.current);
        if (variant.price.old) {
            oldPriceEl.textContent = formatCurrency(variant.price.old);
            oldPriceEl.style.display = 'inline';
        } else {
            oldPriceEl.style.display = 'none';
        }

        if (variant.images && variant.images.length > 0) {
            mainImageEl.src = variant.images[0];
        }

        // Cập nhật trạng thái active cho các nút
        document.querySelectorAll('.variant-btn').forEach(btn => btn.classList.remove('active'));
        if (variant.storage) {
            document.querySelector(`.variant-btn[data-storage="${variant.storage}"]`)?.classList.add('active');
        }
        if (variant.color) {
            document.querySelector(`.variant-btn[data-color="${variant.color.name}"]`)?.classList.add('active');
        }
    }

    function selectVariant(newSelection) {
        if (!currentProduct || !currentProduct.variants) return;
        let bestMatch = null;

        // Ưu tiên tìm phiên bản khớp cả dung lượng và màu sắc
        bestMatch = currentProduct.variants.find(v => 
            v.storage === newSelection.storage && v.color?.name === newSelection.color
        );

        // Nếu không tìm thấy, ưu tiên tìm theo lựa chọn mới nhất của người dùng
        if (!bestMatch) {
            if (newSelection.lastChanged === 'color') {
                // Tìm bất kỳ dung lượng nào có màu đã chọn
                bestMatch = currentProduct.variants.find(v => v.color?.name === newSelection.color);
            } else { // lastChanged === 'storage'
                // Tìm bất kỳ màu nào có dung lượng đã chọn
                bestMatch = currentProduct.variants.find(v => v.storage === newSelection.storage);
            }
        }

        // Nếu vẫn không tìm thấy, lấy phiên bản đầu tiên làm mặc định
        if (!bestMatch) {
            bestMatch = currentProduct.variants[0];
        }

        // Cập nhật giao diện với phiên bản tốt nhất đã tìm thấy
        updateVariantDetails(bestMatch);
    }

    function renderProductDetails(product) {
        currentProduct = product;
        const container = document.getElementById('product-detail-container');

        // Lấy các tùy chọn duy nhất
        const uniqueStorages = [...new Set(product.variants.map(v => v.storage).filter(Boolean))];
        const uniqueColors = [...new Map(product.variants.map(v => v.color).filter(Boolean).map(c => [c.name, c])).values()];

        const storageButtons = uniqueStorages.map(storage => 
            `<button class="variant-btn" data-storage="${storage}">${storage}</button>`
        ).join('');

        const colorButtons = uniqueColors.map(color => 
            `<button class="variant-btn color" data-color="${color.name}" style="--bg-color: ${color.hex};"></button>`
        ).join('');

        const highlightsHTML = product.highlights.map(h => `<li>${h}</li>`).join('');

        const specRows = Object.entries(product.specifications).map(([key, value]) => `
            <tr>
                <td>${key.charAt(0).toUpperCase() + key.slice(1)}</td>
                <td>${value}</td>
            </tr>
        `).join('');

        const initialVariant = product.variants[0];

        container.innerHTML = `
            <div class="product-detail-layout">
                <div class="image-gallery">
                    <img id="main-product-image" src="${initialVariant.images[0]}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h1>${product.name}</h1>
                    <div class="price-section">
                        <span id="product-price" class="new-price">${formatCurrency(initialVariant.price.current)}</span>
                        <span id="product-old-price" class="old-price">${initialVariant.price.old ? formatCurrency(initialVariant.price.old) : ''}</span>
                    </div>

                    ${uniqueStorages.length > 0 ? `
                    <div class="variant-group">
                        <p><strong>Dung lượng:</strong></p>
                        <div class="options-list">${storageButtons}</div>
                    </div>` : ''}

                    ${uniqueColors.length > 0 ? `
                    <div class="variant-group">
                        <p><strong>Màu sắc:</strong></p>
                        <div class="options-list">${colorButtons}</div>
                    </div>` : ''}

                    <button id="add-to-cart-btn" class="add-to-cart-btn">Thêm vào giỏ hàng</button>

                    <div class="product-highlights">
                        <h4>Đặc điểm nổi bật</h4>
                        <ul>${highlightsHTML}</ul>
                    </div>
                </div>
            </div>
            <div class="product-full-description">
                <div class="content-section">
                    <h2>Mô tả sản phẩm</h2>
                    <p>${product.description}</p>
                </div>
                <div class="content-section">
                    <h2>Thông số kỹ thuật</h2>
                    <table class="spec-table">
                        <tbody>${specRows}</tbody>
                    </table>
                </div>
            </div>
        `;

        // Gán sự kiện cho nút "Thêm vào giỏ hàng"
        document.getElementById('add-to-cart-btn').addEventListener('click', () => {
            addToCart(product, selectedVariant);
        });

        // Gán sự kiện cho các nút variant
        let currentSelection = {
            storage: initialVariant.storage,
            color: initialVariant.color?.name,
            lastChanged: null
        };

        // Khi chọn dung lượng, giá sẽ thay đổi
        document.querySelectorAll('.variant-btn[data-storage]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentSelection.storage = btn.dataset.storage;
                currentSelection.lastChanged = 'storage';
                selectVariant(currentSelection);
            });
        });

        // Khi chọn màu, cập nhật toàn bộ variant
        document.querySelectorAll('.variant-btn[data-color]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentSelection.color = btn.dataset.color;
                currentSelection.lastChanged = 'color';
                selectVariant(currentSelection);
            });
        });

        // Chọn variant đầu tiên
        updateVariantDetails(initialVariant);
    }

    function addToCart(product, variant) {
        if (!product || !variant) {
            alert('Vui lòng chọn đầy đủ phiên bản sản phẩm.');
            return;
        }

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItemIndex = cart.findIndex(item => item.sku === variant.sku);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            const cartItem = {
                productId: product.id,
                sku: variant.sku,
                name: `${product.name} ${variant.storage || ''} ${variant.color?.name || ''}`.trim(),
                price: variant.price.current,
                image: variant.images[0],
                quantity: 1
            };
            cart.push(cartItem);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Đã thêm sản phẩm vào giỏ hàng!');
    }

    async function loadData() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            document.getElementById('product-detail-container').innerHTML = '<p>Không tìm thấy sản phẩm. Vui lòng quay lại trang chủ.</p>';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/products/${productId}`);
            if (!response.ok) {
                throw new Error('Không thể tải thông tin sản phẩm.');
            }
            const product = await response.json();
            renderProductDetails(product);
        } catch (error) {
            console.error(error);
            document.getElementById('product-detail-container').innerHTML = '<p>Đã xảy ra lỗi khi tải sản phẩm.</p>';
        }
    }

    updateHeader();
    setupSearchForm();
    populateNavCategories();
    renderFooter();
    loadData();
});
