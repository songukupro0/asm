document.addEventListener('DOMContentLoaded', () => {
    // Tải các thành phần chung
    updateHeader();
    populateNavCategories();
    renderFooter();

    // Tải lịch sử đơn hàng
    loadOrderHistory();
});

async function loadOrderHistory() {
    const container = document.getElementById('order-history-container');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    // 1. Kiểm tra đăng nhập
    if (!currentUser) {
        alert('Vui lòng đăng nhập để xem lịch sử đơn hàng.');
        window.location.href = `../user/login.html?redirect=../user/order-history.html`;
        return;
    }

    try {
        // 2. Lấy các đơn hàng của người dùng hiện tại từ API
        const response = await fetch(`${API_URL}/orders?userId=${currentUser.id}`);
        if (!response.ok) {
            throw new Error('Không thể tải lịch sử đơn hàng.');
        }
        const orders = await response.json();

        // 3. Hiển thị kết quả
        if (orders.length === 0) {
            container.innerHTML = '<p>Bạn chưa có đơn hàng nào.</p>';
            return;
        }

        // Sắp xếp đơn hàng mới nhất lên đầu
        orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        const ordersHTML = orders.map(order => renderOrder(order)).join('');
        container.innerHTML = ordersHTML;

    } catch (error) {
        console.error('Lỗi tải lịch sử đơn hàng:', error);
        container.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

function renderOrder(order) {
    const itemsHTML = order.items.map(item => `
        <div class="order-item-detail">
            <img src="${item.image}" alt="${item.name}" class="order-item-image">
            <div class="order-item-info">
                <span>${item.name}</span>
                <span>Số lượng: ${item.quantity}</span>
            </div>
            <span class="order-item-price">${formatCurrency(item.price * item.quantity)}</span>
        </div>
    `).join('');

    const orderDate = new Date(order.orderDate).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
        <div class="order-card">
            <div class="order-card-header">
                <div>
                    <strong>Mã đơn hàng:</strong> ${order.id}
                </div>
                <div>
                    <strong>Ngày đặt:</strong> ${orderDate}
                </div>
                <div>
                    <strong>Trạng thái:</strong> <span class="status status-${order.status}">${order.status}</span>
                </div>
            </div>
            <div class="order-card-body">
                ${itemsHTML}
            </div>
            <div class="order-card-footer">
                <span>Tổng cộng:</span>
                <strong>${formatCurrency(order.totalAmount)}</strong>
            </div>
        </div>
    `;
}