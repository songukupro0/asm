let allProductsData = {};
let allVariantProducts = []; // Danh sách phẳng tất cả các phiên bản sản phẩm
let currentPage = 1;
const productsPerPage = 12; // 2 hàng x 6 cột

function createProductItemHTML(product, variant) {
    const oldPriceHTML = variant.price.old ? `<span class="old-price">${formatCurrency(variant.price.old)}</span>` : '';
    const imageUrl = variant.images && variant.images.length > 0 ? variant.images[0] : 'https://placehold.co/800x800/EFEFEF/AAAAAA/png?text=No+Image';
    const fullName = `${product.name} ${variant.storage || ''} ${variant.size || ''} ${variant.color ? variant.color.name : ''}`.trim();

    return `
        <div class="product-item">
            <!-- Cập nhật link tới trang chi tiết sản phẩm -->
            <a href="../user/product-detail.html?id=${product.id}">
                <img src="${imageUrl}" alt="${fullName}" loading="lazy" decoding="async">
                <h3>${fullName}</h3>
                <div class="price">
                    <span class="new-price">${formatCurrency(variant.price.current)}</span>
                    ${oldPriceHTML}
                </div>
                <div class="rating">
                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                </div>
            </a>
        </div>
    `;
}

function displayProducts(page) {
    currentPage = page;
    const gridContainer = document.getElementById('products-container');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    const startIndex = (page - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = allVariantProducts.slice(startIndex, endIndex);

    // Tối ưu: Tạo mảng HTML rồi join, thay vì dùng innerHTML += trong loop
    const gridHTML = paginatedProducts.map(item => 
        createProductItemHTML(item.product, item.variant)
    ).join('');
    gridContainer.innerHTML = gridHTML;

    setupPagination();
}

function setupPagination() {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';
    const pageCount = Math.ceil(allVariantProducts.length / productsPerPage);

    if (pageCount <= 1) return;

    for (let i = 1; i <= pageCount; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.classList.add('page-btn');
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => displayProducts(i));
        paginationContainer.appendChild(pageButton);
    }
}

async function loadData() {
    try {
        // Lấy category từ URL trước
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('category');
        const searchQuery = urlParams.get('q');

        const categoryTitle = document.getElementById('category-title');

        // Luôn fetch tất cả sản phẩm để có thể lọc chính xác ở client-side
        const [productsResponse, categoriesResponse] = await Promise.all([
            fetch(`${API_URL}/products`),
            fetch(`${API_URL}/categories`) // Vẫn cần fetch all categories cho menu
        ]);

        if (!productsResponse.ok || !categoriesResponse.ok) throw new Error('Lỗi khi tải dữ liệu từ API');

        let products = await productsResponse.json();
        const categories = await categoriesResponse.json();
        allProductsData = { products, categories };

        if (categoryId && !searchQuery) {
            const category = categories.find(c => c.id === categoryId);
            if (category) categoryTitle.textContent = category.name;
        }

        // Lọc sản phẩm dựa trên tham số URL
        if (searchQuery) {
            categoryTitle.textContent = `Kết quả tìm kiếm cho "${searchQuery}"`;
            const lowerCaseQuery = searchQuery.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(lowerCaseQuery) ||
                p.brand.toLowerCase().includes(lowerCaseQuery)
            );
        } else if (categoryId) {
            const category = categories.find(c => c.id === categoryId);
            if (category) categoryTitle.textContent = category.name;
            products = products.filter(p => p.category_id === categoryId);
        } else {
            categoryTitle.textContent = "Tất cả sản phẩm";
        }
        
        // Làm phẳng cấu trúc sản phẩm và các phiên bản của nó, bất kể là tìm kiếm hay lọc
        const variants = [];
        products.forEach(product => {
            if (product.variants && product.variants.length > 0) {
                product.variants.forEach(variant => {
                    variants.push({ product, variant });
                });
            }
        });
        allVariantProducts = variants;

        displayProducts(1);

    } catch (error) {
        console.error("Không thể tải dữ liệu:", error);
        const container = document.getElementById('products-container');
        if(container) container.innerHTML = "<p>Lỗi tải dữ liệu. Vui lòng thử lại sau.</p>";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
    setupSearchForm();
    populateNavCategories();
    renderFooter();
    loadData();
});