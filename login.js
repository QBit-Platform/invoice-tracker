const SUPABASE_URL = 'https://nvfreqhmeprztpahfnft.supabase.co'; // الصق رابط المشروع هنا
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZnJlcWhtZXByenRwYWhmbmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njc1NTgsImV4cCI6MjA4MDM0MzU1OH0.pV9Ud-wltZJjryISJgqQRGfQU3X1frYTrrHJr5ymj4Y'; // الصق مفتاح anon public هنا
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // محاولة تسجيل الدخول
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        errorMessage.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        return;
    }

    // إذا نجح الدخول، لا يوجد توجيه مباشر هنا
    // سنعتمد على كود الحماية في الصفحات الأخرى لتوجيه المستخدم
    // ولكن للتأكد، سنقوم بإعادة توجيه المستخدمين من هنا
    window.location.href = './index.html'; // توجيه افتراضي لصفحة المندوب
});
