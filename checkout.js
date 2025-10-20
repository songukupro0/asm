document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra đăng nhập ngay từ đầu
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Vui lòng đăng nhập để tiếp tục thanh toán.');
        // Lưu lại trang hiện tại để quay lại sau khi đăng nhập
        window.location.href = `login.html?redirect=checkout.html`;
        return; // Dừng thực thi nếu chưa đăng nhập
    }

    // 2. Tải các thành phần chung của trang
    updateHeader();
    setupSearchForm();
    populateNavCategories();
    renderFooter();

    // 3. Tải và hiển thị tóm tắt đơn hàng
    loadOrderSummary();

    // 4. Thiết lập form thanh toán
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Ngăn form submit mặc định
            handlePlaceOrder(currentUser);
        });
    }
});

function loadOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const summaryContainer = document.getElementById('order-summary');

    if (cart.length === 0) {
        summaryContainer.innerHTML = '<p>Giỏ hàng của bạn đang trống.</p>';
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const itemsHTML = cart.map(item => `
        <div class="summary-item">
            <img src="${item.image}" alt="${item.name}" class="summary-item-image">
            <div class="summary-item-info">
                <span>${item.name} (x${item.quantity})</span>
                <span>${formatCurrency(item.price * item.quantity)}</span>
            </div>
        </div>
    `).join('');

    summaryContainer.innerHTML = `
        <h3>Tổng kết đơn hàng</h3>
        <div class="summary-items-list">
            ${itemsHTML}
        </div>
        <hr>
        <div class="summary-row">
            <span>Tạm tính</span>
            <span id="subtotal-price">${formatCurrency(subtotal)}</span>
        </div>
        <div class="summary-row">
            <span>Phí vận chuyển</span>
            <span>Miễn phí</span>
        </div>
        <hr>
        <div class="summary-row total">
            <span>Tổng cộng</span>
            <span id="total-price">${formatCurrency(subtotal)}</span>
        </div>
        <button type="submit" form="checkout-form" class="place-order-btn">Đặt hàng</button>
    `;
}

async function handlePlaceOrder(currentUser) {
    const form = document.getElementById('checkout-form');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        alert('Giỏ hàng trống, không thể đặt hàng.');
        return;
    }

    // 1. Tạo đối tượng đơn hàng
    const newOrder = {
        id: `order${new Date().getTime()}`,
        userId: currentUser.id,
        customerInfo: {
            name: form.fullname.value,
            phone: form.phone.value,
            address: form.address.value,
            note: form.note.value,
        },
        items: cart,
        totalAmount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        orderDate: new Date().toISOString(),
        status: 'pending' // 'pending', 'shipped', 'delivered', 'cancelled'
    };

    // try {
    //     // 2. Gửi đơn hàng lên server
    //     const response = await fetch(`${API_URL}/orders`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(newOrder)
    //     });

    //     if (!response.ok) {
    //         throw new Error('Không thể tạo đơn hàng. Vui lòng thử lại.');
    //     }

        // 3. (Tùy chọn) Cập nhật danh sách đơn hàng của người dùng
        // Bạn có thể thêm logic này nếu muốn lưu trữ ID đơn hàng trong đối tượng user

        // 4. Xóa giỏ hàng
        localStorage.removeItem('cart');

        // 5. Thông báo và chuyển hướng
        alert('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.');
        window.location.href = '../user/index.html'; // Hoặc trang "Cảm ơn"

    // } catch (error) {
    //     console.error('Lỗi khi đặt hàng:', error);
    //     alert(error.message);
    // }
} // }
