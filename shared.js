const API_URL = 'http://localhost:3000';

function formatCurrency(number) {
    if (typeof number !== 'number') return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

function updateHeader() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const authLinkContainer = document.querySelector('.navigation ul');
    if (!authLinkContainer) return;

    // Tìm các phần tử li bằng class đã thêm
    const loginLi = authLinkContainer.querySelector('.nav-login');
    const cartLi = authLinkContainer.querySelector('.nav-cart');

    // Luôn dọn dẹp các phần tử cũ trước khi vẽ lại
    authLinkContainer.querySelector('.nav-user-info')?.remove();
    authLinkContainer.querySelector('.nav-order-history')?.remove();
    authLinkContainer.querySelector('.nav-logout')?.remove();


    // trạng thái đăng nhập
    if (currentUser) {
        
        if (loginLi) {
            loginLi.style.display = 'none';
        }

        const userLi = document.createElement('li');
        userLi.className = 'nav-user-info';
        const displayName = currentUser.name || currentUser.email.split('@')[0];
        userLi.innerHTML = `<a href="profile.html">Chào, ${displayName}</a>`;

        const logoutLi = document.createElement('li');
        logoutLi.className = 'nav-logout';
        logoutLi.innerHTML = `<a href="#" id="logout-btn">Đăng xuất</a>`;

        // Chèn các phần tử mới vào trước nút giỏ hàng
        if (cartLi) {
            authLinkContainer.insertBefore(userLi, cartLi);
            authLinkContainer.insertBefore(logoutLi, cartLi);
        }

       
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    } else {
        if (loginLi) {
            loginLi.style.display = ''; // Hiện lại nút đăng nhập
        }
    }
}

async function populateNavCategories() {
    const navCategoryDropdown = document.getElementById('nav-category-dropdown');
    if (!navCategoryDropdown) return;

    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        navCategoryDropdown.innerHTML = ''; // Xóa nội dung cũ
        categories.forEach(category => {
            const link = document.createElement('a');
            link.href = `../user/products.html?category=${category.id}`;
            link.textContent = category.name;
            navCategoryDropdown.appendChild(link);
        });
    } catch (error) {
        console.error('Lỗi tải danh mục cho navigation:', error);
    }
}

function renderFooter() {
    const footerContainer = document.getElementById('page-footer');
    if (!footerContainer) return;

    footerContainer.innerHTML = `
        <div class="container footer-grid">
            <div class="footer-column">
                <h4>Thông tin liên hệ</h4>
                <p><strong>Địa chỉ:</strong> 123 Đường XYZ, TP. HCM</p>
                <p><strong>Hotline:</strong> 1800 1234</p>
                <p><strong>Email:</strong> support@abc.com</p>
            </div>
            <div class="footer-column">
                <h4>Chuyên trang iPhone</h4>
                <p>Chúng tôi chuyên cung cấp các dòng iPhone chính hãng VN/A mới nhất.</p>
            </div>
            <div class="footer-column">
                <h4>Chính sách & Hỗ trợ</h4>
                <ul>
                    <li><a href="#">Chính sách bảo hành</a></li>
                    <li><a href="#">Chính sách đổi trả</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h4>Kết nối với chúng tôi</h4>
                <div class="social-icons">
                    <a href="#"><i class="fab fa-facebook-f"></i></a>
                    <a href="#"><i class="fab fa-instagram"></i></a>
                </div>
            </div>
        </div>
        <div class="footer-bottom"><p>&copy; 2025 Bản quyền thuộc về Lương Hữu Luyến.</p></div>
    `;
}

function setupSearchForm() {
    const searchForms = document.querySelectorAll('.search-form');
    searchForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchInput = form.querySelector('input[type="search"]');
            const query = searchInput.value.trim();
            if (query) {
                // Chuyển hướng đến trang sản phẩm với query tìm kiếm
                window.location.href = `products.html?q=${encodeURIComponent(query)}`;
            }
        });
    });
}