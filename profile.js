document.addEventListener('DOMContentLoaded', () => {
    // Tải các thành phần chung
    updateHeader();
    setupSearchForm();
    populateNavCategories();
    renderFooter();

    // Tải thông tin trang cá nhân
    loadProfile();
});

function loadProfile() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    // 1. Kiểm tra đăng nhập
    if (!currentUser) {
        alert('Vui lòng đăng nhập để xem trang cá nhân.');
        window.location.href = `login.html?redirect=profile.html`;
        return;
    }

    // 2. Hiển thị thông tin người dùng
    displayUserInfo(currentUser);

    // 3. Tải lịch sử đơn hàng
    loadOrderHistory(currentUser);

    // 4. Gán sự kiện cho các nút
    setupEventListeners(currentUser);
}

function displayUserInfo(user) {
    const container = document.getElementById('user-info-container');
    if (!container) return;

    container.innerHTML = `
        <div class="user-info-item"><strong>Email:</strong> ${user.email}</div>
        <div class="user-info-item"><strong>Tên:</strong> ${user.name || 'Chưa cập nhật'}</div>
        <div class="user-info-item"><strong>Số điện thoại:</strong> ${user.phone || 'Chưa cập nhật'}</div>
        <div class="user-info-item"><strong>Địa chỉ:</strong> ${user.address || 'Chưa cập nhật'}</div>
        <button id="edit-profile-btn" class="btn">Chỉnh sửa thông tin</button>
        <a href="#" class="profile-link">Đổi mật khẩu</a>
        <a href="#" id="logout-link-profile" class="profile-link">Đăng xuất</a>
    `;
}

function setupEventListeners(user) {
    // Nút đăng xuất
    document.getElementById('logout-link-profile').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentUser');
        window.location.href = '../user/index.html';
    });

    // Nút chỉnh sửa thông tin
    const editBtn = document.getElementById('edit-profile-btn');
    const editFormContainer = document.getElementById('edit-profile-form-container');
    const userInfoContainer = document.getElementById('user-info-container');
    
    editBtn.addEventListener('click', () => {
        // Điền form với dữ liệu hiện tại
        document.getElementById('edit-name').value = user.name || '';
        document.getElementById('edit-phone').value = user.phone || '';
        document.getElementById('edit-address').value = user.address || '';

        // Ẩn thông tin, hiện form
        userInfoContainer.style.display = 'none';
        editFormContainer.style.display = 'block';
    });

    // Nút hủy chỉnh sửa
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        // Hiện thông tin, ẩn form
        userInfoContainer.style.display = 'block';
        editFormContainer.style.display = 'none';
    });

    // Form chỉnh sửa
    document.getElementById('edit-profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveProfile(user);
    });
}

async function saveProfile(user) {
    const updatedData = {
        name: document.getElementById('edit-name').value,
        phone: document.getElementById('edit-phone').value,
        address: document.getElementById('edit-address').value,
    };

    try {
        const response = await fetch(`${API_URL}/users/${user.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật thông tin.');
        }

        const updatedUser = await response.json();

        // Cập nhật sessionStorage
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Tải lại giao diện
        alert('Cập nhật thông tin thành công!');
        loadProfile(); // Tải lại toàn bộ profile
         // Hiện thông tin, ẩn form
        document.getElementById('user-info-container').style.display = 'block';
        document.getElementById('edit-profile-form-container').style.display = 'none';


    } catch (error) {
        console.error('Lỗi cập nhật profile:', error);
        alert(error.message);
    }
}


async function loadOrderHistory(currentUser) {
    const container = document.getElementById('order-history-container');
    if (!container) return;

    container.innerHTML = '<p>Đang tải lịch sử đơn hàng...</p>';

    try {
        // Lấy các đơn hàng của người dùng hiện tại từ API
        const response = await fetch(`${API_URL}/orders?userId=${currentUser.id}`);
        if (!response.ok) {
            throw new Error('Không thể tải lịch sử đơn hàng.');
        }
        const orders = await response.json();

        if (orders.length === 0) {
            container.innerHTML = '<p>Bạn chưa có đơn hàng nào.</p>';
            return;
        }

        orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        // Chỉ hiển thị 3 đơn hàng đầu tiên
        const visibleOrders = orders.slice(0, 3);
        const hiddenOrders = orders.slice(3);

        let ordersHTML = visibleOrders.map(order => renderOrder(order)).join('');

        // Thêm nút "Xem thêm" nếu cần
        if (hiddenOrders.length > 0) {
            ordersHTML += `<div id="hidden-orders" style="display: none;">${hiddenOrders.map(order => renderOrder(order)).join('')}</div>`;
            ordersHTML += `
                <div class="see-more-container">
                    <button id="load-more-orders-btn" class="see-more-btn">
                        Xem thêm ${hiddenOrders.length} đơn hàng cũ hơn <i class="fas fa-chevron-down"></i>
                    </button>
                </div>`;
        }

        container.innerHTML = ordersHTML;

        // Gán sự kiện cho nút "Xem thêm"
        const loadMoreBtn = document.getElementById('load-more-orders-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                const hiddenOrdersDiv = document.getElementById('hidden-orders');
                const isHidden = hiddenOrdersDiv.style.display === 'none' || hiddenOrdersDiv.style.display === '';

                if (isHidden) {
                    // Nếu đang ẩn -> Hiện ra và đổi nút thành "Thu gọn"
                    hiddenOrdersDiv.style.display = 'block';
                    loadMoreBtn.innerHTML = `Thu gọn <i class="fas fa-chevron-up"></i>`;
                } else {
                    // Nếu đang hiện -> Ẩn đi và đổi nút về "Xem thêm"
                    hiddenOrdersDiv.style.display = 'none';
                    loadMoreBtn.innerHTML = `Xem thêm ${hiddenOrders.length} đơn hàng cũ hơn <i class="fas fa-chevron-down"></i>`;
                }
            });
        }

    } catch (error) {
        console.error('Lỗi tải lịch sử đơn hàng:', error);
        container.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

function renderOrder(order) {
    const renderItemHTML = (item) => `
        <div class="order-item-detail">
            <img src="${item.image}" alt="${item.name}" class="order-item-image">
            <div class="order-item-info">
                <span>${item.name}</span>
                <span>Số lượng: ${item.quantity}</span>
            </div>
            <span class="order-item-price">${formatCurrency(item.price * item.quantity)}</span>
        </div>
    `;

    let itemsHTML = '';
    let seeMoreButtonHTML = '';

    if (order.items.length > 3) {
        const visibleItems = order.items.slice(0, 3);
        const hiddenItems = order.items.slice(3);

        itemsHTML = visibleItems.map(renderItemHTML).join('') + 
                    `<div class="hidden-order-items" id="hidden-items-${order.id}">` +
                    hiddenItems.map(renderItemHTML).join('') +
                    `</div>`;
        
        seeMoreButtonHTML = `
            <div class="see-more-container">
                <button class="see-more-btn" onclick="toggleOrderItems('${order.id}', this)">
                    Xem thêm ${hiddenItems.length} sản phẩm <i class="fas fa-chevron-down"></i>
                </button>
            </div>
        `;
    } else {
        itemsHTML = order.items.map(renderItemHTML).join('');
    }

    const orderDate = new Date(order.orderDate).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
        <div class="order-card">
            <div class="order-card-header">
                <div><strong>Mã đơn hàng:</strong> ${order.id}</div>
                <div><strong>Ngày đặt:</strong> ${orderDate}</div>
                <div><strong>Trạng thái:</strong> <span class="status status-${order.status}">${order.status}</span></div>
            </div>
            <div class="order-card-body">
                ${itemsHTML}
            </div>
            ${seeMoreButtonHTML}
            <div class="order-card-footer">
                <span>Tổng cộng:</span>
                <strong>${formatCurrency(order.totalAmount)}</strong>
            </div>
        </div>
    `;
}

function toggleOrderItems(orderId, button) {
    const hiddenItems = document.getElementById(`hidden-items-${orderId}`);
    const icon = button.querySelector('i');

    if (hiddenItems.style.display === 'none' || hiddenItems.style.display === '') {
        hiddenItems.style.display = 'flex';
        button.innerHTML = `Thu gọn <i class="fas fa-chevron-up"></i>`;
    } else {
        hiddenItems.style.display = 'none';
        const hiddenCount = hiddenItems.children.length;
        button.innerHTML = `Xem thêm ${hiddenCount} sản phẩm <i class="fas fa-chevron-down"></i>`;
    }
}
    

