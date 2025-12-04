// auth-guard.js
const SUPABASE_URL = 'Your_Supabase_Project_URL';
const SUPABASE_ANON_KEY = 'Your_Supabase_Anon_Key';
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