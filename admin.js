
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000'; // Define API_URL consistently
    const viewContainer = document.getElementById('view-container');
    
    const appCache = {
        products: [],
        categories: [],
        orders: [],
        dataLoaded: false,
        charts: {}
    };

   
    const fetchData = async () => {
        if (appCache.dataLoaded) {
            return;
        }
        try {
            
            const [productsResponse, categoriesResponse, ordersResponse] = await Promise.all([
                fetch(`${API_URL}/products`),
                fetch(`${API_URL}/categories`),
                fetch(`${API_URL}/orders`)
            ]);

            if (!productsResponse.ok || !categoriesResponse.ok || !ordersResponse.ok) throw new Error('Network response was not ok');

            appCache.products = await productsResponse.json();
            appCache.categories = await categoriesResponse.json();
            appCache.orders = await ordersResponse.json();
            appCache.dataLoaded = true;
        } catch (error) {
            console.error('Error fetching main data:', error);
            viewContainer.innerHTML = '<p style="color: red; text-align: center;">Could not load main application data.</p>';
            throw error; // Propagate error to stop further execution
        }
    };

    // --- VIEW INITIALIZERS ---

    const initDashboard = async () => {
        await fetchData();
        document.getElementById('total-products').textContent = appCache.products.length;
        document.getElementById('total-categories').textContent = appCache.categories.length;
        document.getElementById('total-orders').textContent = appCache.orders.length;
        document.getElementById('total-revenue').textContent = '0 ₫';

        // Destroy existing charts before creating new ones
        if (appCache.charts.categoryChart) {
            appCache.charts.categoryChart.destroy();
        }
        if (appCache.charts.stockChart) {
            appCache.charts.stockChart.destroy();
        }

        // Create charts
        createCategoryChart();
        createStockChart();
    };

    const createCategoryChart = () => {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        const categoryCounts = appCache.products.reduce((acc, product) => {
            const categoryName = (appCache.categories.find(c => c.id === product.category_id) || {}).name || 'Unknown';
            acc[categoryName] = (acc[categoryName] || 0) + 1;
            return acc;
        }, {});

        appCache.charts.categoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categoryCounts),
                datasets: [{
                    label: 'Số lượng sản phẩm',
                    data: Object.values(categoryCounts),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    };

    const createStockChart = () => {
        const ctx = document.getElementById('stockChart').getContext('2d');
        const productsWithStock = appCache.products.map(p => ({
            name: p.name,
            stock: p.variants.reduce((sum, v) => sum + v.stock, 0)
        }));

        const sortedProducts = productsWithStock.sort((a, b) => b.stock - a.stock).slice(0, 5);

        appCache.charts.stockChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedProducts.map(p => p.name),
                datasets: [{
                    label: 'Tồn kho',
                    data: sortedProducts.map(p => p.stock),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    };

    const initProductsPage = async () => {
        await fetchData();
        
        // Get all elements needed for this view
        const productListContainer = document.getElementById('product-list-container');
        const searchInput = document.getElementById('searchInput');
        const addProductBtn = document.getElementById('addProductBtn');
        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalTitle');
        const closeBtn = modal.querySelector('.close-btn');
        const productForm = document.getElementById('productForm');
        const variantsContainer = document.getElementById('variantsContainer');
        const addVariantBtn = document.getElementById('addVariantBtn');

        let variantCounter = 0;

        const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        const getCategoryName = (categoryId) => (appCache.categories.find(c => c.id === categoryId) || {}).name || 'Unknown';

        const renderProducts = (productsToRender) => {
            let tableHtml = `<table class="product-table">                           <th>Ảnh</th>
                            <th>Tên sản phẩm</th>
                            <th>Danh mục</th>
                            <th>Giá thấp nhất</th>
                            <th>Tổng tồn kho</th>
                            <th>Hành động</th>
                            <tbody>`;
             if (productsToRender.length === 0) {
                tableHtml += '<tr><td colspan="6" style="text-align: center;">Không tìm thấy sản phẩm nào.</td></tr>';
            } else {
                productsToRender.forEach(product => {
                    const firstVariant = product.variants[0] || {};
                    const lowestPrice = product.variants.length > 0 ? Math.min(...product.variants.map(v => v.price.current)) : 0;
                    const totalStock = product.variants.length > 0 ? product.variants.reduce((sum, v) => sum + v.stock, 0) : 0;
                    const imageUrl = firstVariant.images ? firstVariant.images[0] : 'https://placehold.co/800x800/ccc/333/png?text=No+Image';

                    tableHtml += `
                        <tr data-id="${product.id}">
                            <td><img src="${imageUrl}" alt="${product.name}" class="product-image"></td>
                            <td>${product.name}</td>
                            <td>${getCategoryName(product.category_id)}</td>
                            <td>${formatCurrency(lowestPrice)}</td>
                            <td>${totalStock}</td>
                            <td class="actions">
                                <button class="btn edit-btn">Sửa</button>
                                <button class="btn delete-btn">Xóa</button>
                            </td>
                        </tr>
                    `;
                });
            }
            productListContainer.innerHTML = tableHtml + '</tbody></table>';
        };

        const openModal = () => {
            variantCounter = 0;
            variantsContainer.innerHTML = '';
            productForm.reset();
            modalTitle.textContent = 'Thêm sản phẩm mới';
            document.getElementById('productId').value = '';
            addVariantBlock();
            populateCategories();
            modal.style.display = 'block';
        };

        const closeModal = () => { modal.style.display = 'none'; };

        const populateCategories = () => {
            const categorySelect = document.getElementById('productCategory');
            categorySelect.innerHTML = appCache.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        };

        const addVariantBlock = (variant = {}) => {
            variantCounter++;
            const block = document.createElement('div');
            block.className = 'variant-block';
            block.innerHTML = `
                <h5>
                    Phiên bản ${variantCounter}
                    <button type="button" class="delete-variant-btn">&times; Xóa</button>
                </h5>
                <div class="variant-grid">
                    <div class="form-group">
                        <label>Màu sắc</label>
                        <input type="text" class="variant-color" value="${variant.color || ''}" placeholder="VD: Đen">
                    </div>
                    <div class="form-group">
                        <label>Kích thước</label>
                        <input type="text" class="variant-size" value="${variant.size || ''}" placeholder="VD: 6.1 inch">
                    </div>
                    <div class="form-group">
                        <label>Giá gốc</label>
                        <input type="number" class="variant-price-original" value="${(variant.price && variant.price.original) || ''}" placeholder="25000000">
                    </div>
                    <div class="form-group">
                        <label>Giá bán</label>
                        <input type="number" class="variant-price-current" value="${(variant.price && variant.price.current) || ''}" placeholder="22000000">
                    </div>
                    <div class="form-group">
                        <label>Tồn kho</label>
                        <input type="number" class="variant-stock" value="${variant.stock || 0}" placeholder="100">
                    </div>
                </div>
                 <div class="form-group">
                    <label>Hình ảnh (URLs, cách nhau bằng dấu phẩy)</label>
                    <input type="text" class="variant-images" value="${(variant.images && variant.images.join(', ')) || ''}" placeholder="url1, url2, ...">
                </div>
            `;
            variantsContainer.appendChild(block);
            block.querySelector('.delete-variant-btn').addEventListener('click', () => block.remove());
        };

        // Event Listeners
        addProductBtn.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        addVariantBtn.addEventListener('click', addVariantBlock);

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = appCache.products.filter(p => p.name.toLowerCase().includes(searchTerm));
            renderProducts(filtered);
        });

        const openModalForEdit = (id) => {
            const product = appCache.products.find(p => p.id === id);
            if (!product) {
                alert('Không tìm thấy sản phẩm!');
                return;
            }

            productForm.reset();
            variantCounter = 0;
            variantsContainer.innerHTML = '';
            
            modalTitle.textContent = 'Chỉnh sửa sản phẩm';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productBrand').value = product.brand || 'Apple';
            document.getElementById('productDescription').value = product.description || '';
            
            populateCategories();
            document.getElementById('productCategory').value = product.category_id;

            if (product.variants && product.variants.length > 0) {
                product.variants.forEach(variant => addVariantBlock(variant));
            } else {
                addVariantBlock(); // Add a default empty block if no variants
            }

            modal.style.display = 'block';
        };

        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const productId = document.getElementById('productId').value;

            // Collect variant data from the form
            const variantBlocks = variantsContainer.querySelectorAll('.variant-block');
            const variants = Array.from(variantBlocks).map(block => {
                return {
                    color: block.querySelector('.variant-color').value,
                    size: block.querySelector('.variant-size').value,
                    price: {
                        original: parseFloat(block.querySelector('.variant-price-original').value) || 0,
                        current: parseFloat(block.querySelector('.variant-price-current').value) || 0,
                    },
                    stock: parseInt(block.querySelector('.variant-stock').value) || 0,
                    images: block.querySelector('.variant-images').value.split(',').map(url => url.trim()).filter(url => url)
                };
            });

            if (productId) {
                // Update existing product
                const productIndex = appCache.products.findIndex(p => p.id === productId);
                if (productIndex > -1) {
                    const product = appCache.products[productIndex];
                    product.name = document.getElementById('productName').value;
                    product.category_id = document.getElementById('productCategory').value;
                    product.brand = document.getElementById('productBrand').value;
                    product.description = document.getElementById('productDescription').value;
                    product.variants = variants;
                }
                 alert('Sản phẩm đã được cập nhật (tạm thời).');
            } else {
                // Add new product
                const newProduct = {
                    id: `product-${Date.now()}`,
                    name: document.getElementById('productName').value,
                    category_id: document.getElementById('productCategory').value,
                    brand: document.getElementById('productBrand').value,
                    description: document.getElementById('productDescription').value,
                    variants: variants
                };
                appCache.products.unshift(newProduct);
                alert('Sản phẩm đã được thêm (tạm thời).');
            }

            renderProducts(appCache.products);
            closeModal();
        });

        productListContainer.addEventListener('click', (e) => {
            const id = e.target.closest('tr')?.dataset.id;
            if (!id) return;

            if (e.target.classList.contains('delete-btn')) {
                if (confirm('Bạn có chắc muốn xóa? (Tạm thời)')) {
                    appCache.products = appCache.products.filter(p => p.id !== id);
                    renderProducts(appCache.products);
                }
            }
            if (e.target.classList.contains('edit-btn')) {
                openModalForEdit(id);
            }
        });

        // Initial Render
        renderProducts(appCache.products);
    };

    const initCategoriesPage = async () => {
        await fetchData();

        // Get all elements needed for this view
        const container = document.getElementById('category-list-container');
        const searchInput = document.getElementById('categorySearchInput');
        const addBtn = document.getElementById('addCategoryBtn');
        const modal = document.getElementById('categoryModal');
        const modalTitle = document.getElementById('categoryModalTitle');
        const closeBtn = modal.querySelector('.close-btn');
        const categoryForm = document.getElementById('categoryForm');
        const categoryIdInput = document.getElementById('categoryId');
        const categoryNameInput = document.getElementById('categoryName');

        const renderCategories = (categoriesToRender) => {
            let tableHtml = `<table class="product-table"><thead><tr><th>Tên danh mục</th><th>Số sản phẩm</th><th>Hành động</th></tr></thead><tbody>`;
            if (categoriesToRender.length === 0) {
                tableHtml += '<tr><td colspan="3" style="text-align: center;">Không tìm thấy danh mục nào.</td></tr>';
            } else {
                categoriesToRender.forEach(category => {
                    const productCount = appCache.products.filter(p => p.category_id === category.id).length;
                    tableHtml += `
                        <tr data-id="${category.id}">
                            <td>${category.name}</td>
                            <td>${productCount}</td>
                            <td class="actions">
                                <button class="btn edit-btn">Sửa</button>
                                <button class="btn delete-btn">Xóa</button>
                            </td>
                        </tr>
                    `;
                });
            }
            container.innerHTML = tableHtml + '</tbody></table>';
        };

        const openModal = (id = null) => {
            categoryForm.reset();
            if (id) {
                const category = appCache.categories.find(c => c.id === id);
                if (category) {
                    modalTitle.textContent = 'Chỉnh sửa danh mục';
                    categoryIdInput.value = category.id;
                    categoryNameInput.value = category.name;
                }
            } else {
                modalTitle.textContent = 'Thêm danh mục mới';
                categoryIdInput.value = '';
            }
            modal.style.display = 'block';
        };

        const closeModal = () => {
            modal.style.display = 'none';
        };

        // Event Listeners
        addBtn.addEventListener('click', () => openModal());
        closeBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = appCache.categories.filter(c => c.name.toLowerCase().includes(searchTerm));
            renderCategories(filtered);
        });

        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = categoryIdInput.value;
            const name = categoryNameInput.value.trim();

            if (!name) {
                alert('Tên danh mục không được để trống.');
                return;
            }

            try {
                if (id) {
                    // Update (PUT request)
                    const response = await fetch(`${API_URL}/categories/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name })
                    });
                    if (!response.ok) throw new Error('Cập nhật thất bại');
                    const updatedCategory = await response.json();
                    const index = appCache.categories.findIndex(c => c.id === id);
                    if (index !== -1) appCache.categories[index] = updatedCategory;
                    alert('Danh mục đã được cập nhật.');
                } else {
                    // Add (POST request)
                    const response = await fetch(`${API_URL}/categories`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name })
                    });
                    if (!response.ok) throw new Error('Thêm mới thất bại');
                    const newCategory = await response.json();
                    appCache.categories.push(newCategory);
                    alert('Danh mục đã được thêm.');
                }
                renderCategories(appCache.categories);
                closeModal();
            } catch (error) {
                alert(`Đã xảy ra lỗi: ${error.message}`);
            }
        });

        container.addEventListener('click', async (e) => {
            const id = e.target.closest('tr')?.dataset.id;
            if (!id) return;

            if (e.target.classList.contains('edit-btn')) {
                openModal(id);
            }

            if (e.target.classList.contains('delete-btn')) {
                const productCount = appCache.products.filter(p => p.category_id === id).length;
                if (productCount > 0) {
                    alert(`Không thể xóa danh mục này vì có ${productCount} sản phẩm thuộc về nó.`);
                    return;
                }

                if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
                    try {
                        const response = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Xóa thất bại');
                        appCache.categories = appCache.categories.filter(c => c.id !== id);
                        renderCategories(appCache.categories);
                        alert('Danh mục đã được xóa.');
                    } catch (error) {
                        alert(`Đã xảy ra lỗi: ${error.message}`);
                    }
                }
            }
        });

        // Initial Render
        renderCategories(appCache.categories);
    };

    const initOrdersPage = async () => {
        await fetchData();
        const container = document.getElementById('order-list-container');
        const searchInput = document.getElementById('orderSearchInput');
        const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        const renderOrders = (orders) => {
            let tableHtml = `<table class="product-table">
                <thead>
                    <tr>
                        <th>Mã ĐH</th>
                        <th>Khách hàng</th>
                        <th>Ngày đặt</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>`;

            if (orders.length === 0) {
                tableHtml += '<tr><td colspan="6" style="text-align: center;">Không có đơn hàng nào.</td></tr>';
            } else {
                orders.forEach(order => {
                    const statusOptions = orderStatuses.map(status => 
                        `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>`
                    ).join('');

                    tableHtml += `
                        <tr data-id="${order.id}">
                            <td>${order.id}</td>
                            <td>${order.customerInfo.name}</td>
                            <td>${new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
                            <td>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</td>
                            <td><span class="status status-${order.status}">${order.status}</span></td>
                            <td>
                                <select class="status-select">${statusOptions}</select>
                            </td>
                        </tr>
                    `;
                });
            }
            container.innerHTML = tableHtml + '</tbody></table>';
        };

        const handleStatusChange = async (e) => {
            if (e.target.classList.contains('status-select')) {
                const newStatus = e.target.value;
                const orderId = e.target.closest('tr').dataset.id;
                
                try {
                    const response = await fetch(`${API_URL}/orders/${orderId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });

                    if (!response.ok) throw new Error('Cập nhật trạng thái thất bại');

                    const updatedOrder = await response.json();
                    const index = appCache.orders.findIndex(o => o.id === orderId);
                    if (index !== -1) {
                        appCache.orders[index] = updatedOrder;
                    }
                    
                    renderOrders(appCache.orders);
                    alert('Trạng thái đơn hàng đã được cập nhật.');

                } catch (error) {
                    alert(`Lỗi: ${error.message}`);
                    // Revert UI change on failure
                    renderOrders(appCache.orders);
                }
            }
        };

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredOrders = appCache.orders.filter(order => {
                return order.id.toLowerCase().includes(searchTerm) || 
                       order.customerInfo.name.toLowerCase().includes(searchTerm);
            });
            renderOrders(filteredOrders);
        });

        container.addEventListener('change', handleStatusChange);
        renderOrders(appCache.orders);
    };

    // --- ROUTER ---
    const routes = {
        '#dashboard': { path: 'dashboard.html', init: initDashboard },
        '#products': { path: 'products.html', init: initProductsPage },
        '#categories': { path: 'categories.html', init: initCategoriesPage },
        '#orders': { path: 'orders.html', init: initOrdersPage }
    };

    const loadView = async () => {
        const hash = window.location.hash || '#dashboard';
        const route = routes[hash];

        // Reset classes on the container
        if (viewContainer) {
            viewContainer.className = 'main-content'; 
        }

        if (route && viewContainer) {
            try {
                const response = await fetch(route.path);
                if (!response.ok) throw new Error(`Could not load ${route.path}`);
                viewContainer.innerHTML = await response.text();

                // Add a page-specific class for styling
                if (hash === '#orders') {
                    viewContainer.classList.add('orders-view');
                }

                if (route.init) {
                    await route.init();
                }
            } catch (error) {
                console.error('Error loading view:', error);
                viewContainer.innerHTML = `<p style="text-align:center; color:red;">Lỗi tải trang. Vui lòng thử lại.</p>`;
            }
        }
    };

    
    // Sidebar submenu toggle
    document.querySelector('.sidebar').addEventListener('click', (e) => {
        if (e.target.matches('.has-submenu > a')) {
            e.preventDefault();
            e.target.parentElement.classList.toggle('active');
        }
    });

    window.addEventListener('hashchange', loadView);
    loadView();
});
