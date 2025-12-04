// auth-guard.js
const SUPABASE_URL = 'https://nvfreqhmeprztpahfnft.supabase.co'; // الصق رابط المشروع هنا
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZnJlcWhtZXByenRwYWhmbmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njc1NTgsImV4cCI6MjA4MDM0MzU1OH0.pV9Ud-wltZJjryISJgqQRGfQU3X1frYTrrHJr5ymj4Y'; // الصق مفتاح anon public هنا
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // إذا لم يكن هناك جلسة (مستخدم غير مسجل)، أعد التوجيه لصفحة الدخول
    if (!session) {
        window.location.href = './login.html';
        return;
    }

    // إذا كان هناك جلسة، تحقق من دور المستخدم (خاص بصفحة الأدمن)
    const currentPath = window.location.pathname.split('/').pop();
    if (currentPath === 'admin.html') {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        // إذا لم يكن المستخدم "مدير"، أعد توجيهه لصفحة المندوب
        if (!profile || profile.role !== 'مدير') {
            window.location.href = './index.html';
        }
    }
})();
