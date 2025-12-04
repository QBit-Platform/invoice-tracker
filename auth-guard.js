(async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = './login.html';
        return;
    }

    const currentPath = window.location.pathname.split('/').pop();
    if (currentPath === 'admin.html') {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
        
        if (!profile || profile.role !== 'مدير') {
            window.location.href = './index.html';
        }
    } else if (currentPath === 'login.html') {
        // إذا كان المستخدم مسجلاً بالفعل ويحاول فتح صفحة الدخول، وجهه للصفحة الرئيسية
        window.location.href = './index.html';
    }
})();
