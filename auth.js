document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

async function handleLogin(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;
    const errorMessageEl = document.getElementById('error-message');

    try {
        
        const response = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
        const users = await response.json();

        // Sau khi lấy được user, so sánh mật khẩu.
        if (users.length > 0 && users[0].password === password) {
            const user = users[0];
            
            sessionStorage.setItem('currentUser', JSON.stringify(user));

            
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect');

            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else if (user.role === 'admin') {
                 window.location.href = '../admin/admin.html';
            } else {
                 window.location.href = 'index.html';
            }
        } else {
            errorMessageEl.textContent = 'Thông tin đăng nhập không chính xác.';
        }
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        errorMessageEl.textContent = 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;
    const confirmPassword = event.target['confirm-password'].value;
    const errorMessageEl = document.getElementById('error-message');

    if (password !== confirmPassword) {
        errorMessageEl.textContent = 'Mật khẩu xác nhận không khớp.';
        return;
    }

    try {
        // 1. Kiểm tra email đã tồn tại chưa
        const checkEmailResponse = await fetch(`${API_URL}/users?email=${email}`);
        const existingUsers = await checkEmailResponse.json();

        if (existingUsers.length > 0) {
            errorMessageEl.textContent = 'Email này đã được sử dụng.';
            return;
        }

        // 2. Tạo người dùng mới
        const newUser = {
            id: `u${new Date().getTime()}`,
            email: email,
            password: password, // Lưu ý: Trong thực tế cần mã hóa mật khẩu
            role: 'user',
            orders: []
        };

        const registerResponse = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newUser),
        });

        if (registerResponse.ok) {
            alert('Đăng ký thành công! Bạn sẽ được chuyển đến trang đăng nhập.');
            window.location.href = '../user/login.html';
        } else {
            throw new Error('Không thể tạo tài khoản.');
        }

    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        errorMessageEl.textContent = 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
}