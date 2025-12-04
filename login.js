
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessage.textContent = ''; // مسح الأخطاء السابقة عند كل محاولة

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // الخطوة 1: محاولة تسجيل الدخول
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (signInError) {
        errorMessage.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        return;
    }

    if (user) {
        // الخطوة 2: بعد نجاح الدخول، جلب "الدور" الخاص بالمستخدم من جدول profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single(); // .single() لجلب نتيجة واحدة فقط

        if (profileError) {
            errorMessage.textContent = 'حدث خطأ أثناء التحقق من صلاحياتك.';
            // تسجيل خروج المستخدم لضمان الأمان
            await supabase.auth.signOut();
            return;
        }

        // الخطوة 3: التوجيه الذكي بناءً على الدور
        if (profile && profile.role === 'مدير') {
            // إذا كان الدور هو "مدير"، قم بالتوجيه إلى صفحة الأدمن
            window.location.href = './admin.html';
        } else {
            // لأي دور آخر (مثل "مندوب")، قم بالتوجيه إلى الصفحة الرئيسية
            window.location.href = './index.html';
        }
    }
});
