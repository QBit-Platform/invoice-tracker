const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        errorMessage.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        return;
    }

    // التوجيه التلقائي سيتم بواسطة auth-guard في الصفحة التالية
    window.location.href = './index.html';
});
