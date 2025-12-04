/*************************************************************************************************
 * ملف: admin.js
 * 
 * الغرض: هذا الملف يحتوي على كل المنطق البرمجي الخاص بصفحة لوحة التحكم (Admin Panel).
 * 
 * الوظائف الرئيسية:
 * 1. التحقق من أن المستخدم المسجل هو "مدير" ومنع الوصول لغير المدراء.
 * 2. جلب أسماء المناديب وتعبئة قائمة الفلتر.
 * 3. جلب بيانات الإدخالات (فواتير ووقود) من قاعدة بيانات Supabase.
 * 4. تطبيق فلاتر متقدمة على البيانات (حسب المندوب، النوع، والتاريخ).
 * 5. عرض البيانات المفلترة في جدول تفاعلي.
 * 6. عرض مواقع الإدخالات على خريطة Leaflet تفاعلية.
 * 7. رسم خط سير المندوب على الخريطة عند فلترة مندوب معين.
 * 8. توفير وظيفة تسجيل الخروج.
 * 
 * يعتمد على:
 * - مكتبة Supabase للاتصال بقاعدة البيانات.
 * - مكتبة Leaflet للخرائط.
 * - مكتبة Leaflet.PolylineDecorator لرسم الأسهم على المسارات.
 * - ملف supabase-client.js (للاتصال).
 * - ملف auth-guard.js (للحماية).
 *************************************************************************************************/

// --- 1. إعداد العناصر الأساسية ---

// جلب عناصر واجهة المستخدم من ملف HTML
const tableBody = document.getElementById('entries-table-body');
const userFilter = document.getElementById('user-filter');
const filterForm = document.getElementById('filter-form');
const logoutButton = document.getElementById('logout-button');

// تهيئة الخريطة وتعيين مركز وعرض افتراضي
const map = L.map('map').setView([30.0444, 31.2357], 6); // مركز افتراضي (القاهرة)

// إضافة طبقة الخريطة الأساسية من OpenStreetMap (بديل مجاني لخرائط جوجل)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// إنشاء "طبقة" منفصلة على الخريطة مخصصة فقط لرسم المسارات والعلامات
// هذا يسهل حذفها وإعادة رسمها عند كل فلترة دون التأثير على الخريطة الأساسية
const routeLayer = L.layerGroup().addTo(map);


// --- 2. وظائف المصادقة والمساعدة ---

/**
 * يقوم بتسجيل خروج المستخدم وإعادة توجيهه إلى صفحة الدخول.
 */
async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = './login.html';
}

/**
 * يقوم بجلب أسماء المناديب من جدول 'profiles' ويملأ القائمة المنسدلة للفلتر.
 * يتم تشغيل هذه الدالة مرة واحدة عند تحميل الصفحة.
 */
async function populateUserFilter() {
    // جلب كل المستخدمين الذين دورهم "مندوب" فقط
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'مندوب');

    if (error) {
        console.error("خطأ في جلب قائمة المناديب:", error);
        return;
    }

    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.full_name;
        userFilter.appendChild(option);
    });
}


// --- 3. الوظيفة الأساسية لجلب وعرض البيانات ---

/**
 * هذه هي الوظيفة المحورية للتطبيق. تقوم بالآتي:
 * - بناء استعلام ديناميكي إلى Supabase بناءً على الفلاتر المحددة.
 * - تنفيذ الاستعلام وجلب البيانات.
 * - مسح الجدول والخريطة من البيانات القديمة.
 * - عرض البيانات الجديدة في الجدول وعلى الخريطة.
 * - رسم خط سير المندوب إذا تم تحديد مندوب واحد.
 */
async function fetchAndDisplayEntries() {
    // الخطوة 1: تنظيف الواجهة من النتائج السابقة
    tableBody.innerHTML = '';
    routeLayer.clearLayers(); // مسح كل العلامات والمسارات القديمة من الخريطة

    // الخطوة 2: بناء الاستعلام الديناميكي
    // نبدأ بالاستعلام الأساسي الذي يجلب كل شيء ويربطه بجدول البروفايلات
    // `profiles:user_id(full_name)` هي الطريقة الصحيحة لإخبار Supabase بالربط عبر المفتاح الأجنبي `user_id`
    let query = supabase.from('entries').select('*, profiles:user_id(full_name)');

    // إضافة شروط الفلترة إلى الاستعلام بشكل تدريجي
    if (userFilter.value) {
        query = query.eq('user_id', userFilter.value);
    }
    const typeFilter = document.getElementById('type-filter').value;
    if (typeFilter) {
        query = query.eq('entry_type', typeFilter);
    }
    const startDate = document.getElementById('start-date-filter').value;
    if (startDate) {
        query = query.gte('created_at', startDate);
    }
    const endDate = document.getElementById('end-date-filter').value;
    if (endDate) {
        // نضيف الوقت لنهاية اليوم لضمان شمول كل إدخالات هذا اليوم
        query = query.lte('created_at', `${endDate}T23:59:59`);
    }

    // **مهم جداً:** ترتيب النتائج حسب الوقت تصاعديًا لضمان رسم خط السير بالترتيب الصحيح
    query = query.order('created_at', { ascending: true });

    // الخطوة 3: تنفيذ الاستعلام النهائي وجلب البيانات
    const { data: entries, error } = await query;

    if (error) {
        console.error('خطأ في جلب البيانات:', error);
        alert("فشل في تحميل البيانات. يرجى مراجعة الـ Console.");
        return;
    }

    // الخطوة 4: معالجة البيانات وعرضها
    const routeCoordinates = []; // مصفوفة لتخزين إحداثيات المسار
    entries.forEach(entry => {
        // أ) إضافة صف جديد إلى الجدول
        const rowHTML = `
            <tr data-lat="${entry.latitude}" data-lng="${entry.longitude}">
                <td>${entry.profiles?.full_name || 'غير معروف'}</td>
                <td>${entry.entry_type === 'invoice' ? 'فاتورة' : 'وقود'}</td>
                <td>${entry.entry_value}</td>
                <td>${new Date(entry.created_at).toLocaleString('ar-EG')}</td>
            </tr>`;
        // `insertAdjacentHTML` أفضل من `innerHTML +=` لأنه يضيف الصفوف الجديدة في بداية الجدول
        tableBody.insertAdjacentHTML('afterbegin', rowHTML);

        // ب) إضافة علامة (Marker) على الخريطة وتجميع الإحداثيات للمسار
        if (entry.latitude && entry.longitude) {
            const marker = L.marker([entry.latitude, entry.longitude]).addTo(routeLayer);
            marker.bindPopup(`<b>${entry.profiles?.full_name}</b><br>${entry.entry_type === 'invoice' ? 'فاتورة رقم: ' : 'عداد: '}${entry.entry_value}`);
            routeCoordinates.push([entry.latitude, entry.longitude]);
        }
    });

    // الخطوة 5: رسم خط السير وتعديل عرض الخريطة
    if (userFilter.value && routeCoordinates.length > 1) {
        // الحالة 1: تم تحديد مندوب واحد وهناك أكثر من نقطة (يمكن رسم مسار)
        const polyline = L.polyline(routeCoordinates, { color: '#dc3545', weight: 5 }).addTo(routeLayer);
        
        // استخدام مكتبة الديكور لإضافة أسهم توضح اتجاه الحركة
        L.polylineDecorator(polyline, {
            patterns: [{
                offset: '10%',
                repeat: '80px',
                symbol: L.Symbol.arrowHead({ pixelSize: 15, pathOptions: { fillOpacity: 1, weight: 0, color: '#dc3545' } })
            }]
        }).addTo(routeLayer);
        
        // تقريب الخريطة تلقائيًا لتناسب حدود المسار المرسوم
        map.fitBounds(polyline.getBounds().pad(0.1));

    } else if (routeCoordinates.length > 0) {
        // الحالة 2: هناك نقاط على الخريطة ولكن لا يمكن رسم مسار (إما لعدم تحديد مندوب أو لوجود نقطة واحدة فقط)
        // هنا نقوم بتقريب الخريطة لتناسب جميع النقاط الظاهرة
        map.fitBounds(L.latLngBounds(routeCoordinates).pad(0.1));
    }
}


// --- 4. ربط الأحداث وتشغيل التطبيق ---

// عند اكتمال تحميل الصفحة، ابدأ في تنفيذ الوظائف الأولية
document.addEventListener('DOMContentLoaded', () => {
    populateUserFilter(); // املأ قائمة المناديب
    fetchAndDisplayEntries(); // اعرض كل البيانات المتاحة عند التحميل الأولي
});

// عند الضغط على زر "تطبيق" في نموذج الفلترة
filterForm.addEventListener('submit', (e) => {
    e.preventDefault(); // منع تحديث الصفحة
    fetchAndDisplayEntries(); // أعد جلب البيانات بالفلترة الجديدة
});

// عند الضغط على زر "إعادة تعيين"
filterForm.addEventListener('reset', () => {
    // نستخدم setTimeout لضمان أن قيم الحقول قد تم تفريغها بالفعل قبل إعادة الجلب
    setTimeout(fetchAndDisplayEntries, 0);
});

// عند الضغط على زر تسجيل الخروج
logoutButton.addEventListener('click', handleLogout);

// تفعيل ميزة التفاعل بين الجدول والخريطة
tableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr'); // ابحث عن أقرب صف تم الضغط عليه
    if (!row) return; // إذا لم يتم الضغط على صف، لا تفعل شيئًا

    const lat = row.dataset.lat;
    const lng = row.dataset.lng;
    
    // إذا كان الصف يحتوي على بيانات الموقع، قم بتحريك الخريطة إليه
    if (lat && lng) {
        map.flyTo([lat, lng], 15); // انتقال سلس وتكبير إلى مستوى 15
    }
});```
