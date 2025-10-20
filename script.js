let allProductsData = {};

document.addEventListener('DOMContentLoaded', async function() {
    updateHeader(); // Từ shared.js
    setupSearchForm(); // Từ shared.js
    populateNavCategories(); // Từ shared.js
    renderFooter(); // Từ shared.js
    await loadAndInitializeProducts();
});

function createProductItemHTML(product, variant) { 
    const oldPriceHTML = variant.price.old ? `<span class="old-price">${formatCurrency(variant.price.old)}</span>` : '';
    const imageUrl = variant.images && variant.images.length > 0 ? variant.images[0] : 'https://placehold.co/800x800/EFEFEF/AAAAAA/png?text=No+Image';

    const fullName = `${product.name} ${variant.storage || ''} ${variant.size || ''} ${variant.color ? variant.color.name : ''}`.trim();

    return `
        <div class="product-item">
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

function renderProducts(products, gridSelector, maxItems) {
    const gridContainer = document.querySelector(gridSelector);
    if (!gridContainer) {
        console.error(`Không tìm thấy container với selector: ${gridSelector}`);
        return;
    }

    const productsToShow = products.slice(0, maxItems);

   
    const htmlItems = productsToShow.map(product => {
        if (product.variants && product.variants.length > 0) {
            const variant = product.variants[0];
            return createProductItemHTML(product, variant);
        }
        return ''; // Trả về chuỗi rỗng nếu không có variant
    }).join('');

    gridContainer.innerHTML = htmlItems;
}

async function loadAndInitializeProducts() {
    try {
        const [productsResponse, categoriesResponse] = await Promise.all([
            fetch(`${API_URL}/products`),
            fetch(`${API_URL}/categories`)
        ]);

        if (!productsResponse.ok || !categoriesResponse.ok) {
            throw new Error(`HTTP error! Products status: ${productsResponse.status}, Categories status: ${categoriesResponse.status}`);
        }

        const products = await productsResponse.json();
        const categories = await categoriesResponse.json();

        allProductsData = { products, categories };

        const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
        renderProducts(shuffledProducts, '.content-section:nth-of-type(1) .product-grid', 6);

        const shuffledProducts2 = [...products].sort(() => 0.5 - Math.random());
        renderProducts(shuffledProducts2, '.content-section:nth-of-type(4) .product-grid', 6);

        const tabContainer = document.querySelector('.category-tabs');
        const contentContainer = tabContainer.parentElement;

        tabContainer.innerHTML = '';
        document.querySelectorAll('.tab-content').forEach(el => el.remove());

        let isFirstTab = true;
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = `tab-link ${isFirstTab ? 'active' : ''}`;
            button.textContent = category.name;
            button.onclick = (event) => openTab(event, category.id);
            tabContainer.appendChild(button);

            const tabContent = document.createElement('div');
            tabContent.id = category.id;
            tabContent.className = `tab-content ${isFirstTab ? 'active' : ''}`;
            const productGrid = document.createElement('div');
            productGrid.className = 'product-grid';
            tabContent.appendChild(productGrid);
            contentContainer.appendChild(tabContent);

            const productsForCategory = products.filter(p => p.categoryId == category.id || p.category_id == category.id);
            
            const allVariantsInCategory = [];
            productsForCategory.forEach(product => {
                if (product.variants && product.variants.length > 0) {
                    product.variants.forEach(variant => {
                        allVariantsInCategory.push({ product, variant });
                    });
                }
            });

            // Tối ưu: Giới hạn 12 sản phẩm, tạo mảng HTML rồi join
            const limitedVariants = allVariantsInCategory.slice(0, 12);
            const productGridHTML = limitedVariants.map(item => 
                createProductItemHTML(item.product, item.variant)
            ).join('');

            productGrid.innerHTML = productGridHTML;

            isFirstTab = false;
        });

    } catch (error) {
        console.error("Không thể tải dữ liệu từ API:", error);
    }
}

function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove('active');
    }

    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove('active');
    }

    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}