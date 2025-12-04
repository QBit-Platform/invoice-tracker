const SUPABASE_URL = 'Your_Supabase_Project_URL';
const SUPABASE_ANON_KEY = 'Your_Supabase_Anon_Key';
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