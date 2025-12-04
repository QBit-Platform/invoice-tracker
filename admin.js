// --- الإعدادات ---
// استبدل بالبيانات الخاصة بمشروعك في Supabase
const SUPABASE_URL = 'https://nvfreqhmeprztpahfnft.supabase.co'; // الصق رابط المشروع هنا
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZnJlcWhtZXByenRwYWhmbmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njc1NTgsImV4cCI6MjA4MDM0MzU1OH0.pV9Ud-wltZJjryISJgqQRGfQU3X1frYTrrHJr5ymj4Y'; // الصق مفتاح anon public هنا

// --- الاتصال بـ Supabase ---
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- عناصر واجهة المستخدم ---
const tableBody = document.getElementById('invoices-table-body');
const mapElement = document.getElementById('map');

// --- تهيئة الخريطة ---
// ضع إحداثيات لمركز الخريطة (مثلاً، القاهرة) ومستوى التقريب
const map = L.map('map').setView([30.0444, 31.2357], 6);

// إضافة طبقة الخريطة الأساسية من OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// --- الوظيفة الرئيسية لجلب وعرض البيانات ---
async function fetchAndDisplayInvoices() {
    // 1. جلب البيانات من جدول 'invoices'
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false }); // ترتيبها من الأحدث للأقدم

    // 2. التعامل مع الأخطاء إن وجدت
    if (error) {
        console.error('خطأ في جلب البيانات:', error);
        tableBody.innerHTML = `<tr><td colspan="4">فشل في تحميل البيانات.</td></tr>`;
        return;
    }

    // 3. مسح البيانات القديمة من الجدول قبل إضافة الجديدة
    tableBody.innerHTML = '';

    // 4. المرور على كل فاتورة وعرضها في الجدول وعلى الخريطة
    invoices.forEach(invoice => {
        // --- إضافة صف جديد في الجدول ---
        const tableRow = `
            <tr>
                <td>${invoice.invoice_number}</td>
                <td>${invoice.latitude}</td>
                <td>${invoice.longitude}</td>
                <td>${new Date(invoice.created_at).toLocaleString('ar-EG')}</td>
            </tr>
        `;
        tableBody.innerHTML += tableRow;

        // --- إضافة علامة (Marker) على الخريطة ---
        if (invoice.latitude && invoice.longitude) {
            const marker = L.marker([invoice.latitude, invoice.longitude]).addTo(map);
            // إضافة نافذة منبثقة تظهر عند الضغط على العلامة
            marker.bindPopup(`<b>رقم الفاتورة: ${invoice.invoice_number}</b>`);
        }
    });
}

// --- تشغيل الوظيفة عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', fetchAndDisplayInvoices);
