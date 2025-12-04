// --- الإعدادات ---
// استبدل بالبيانات الخاصة بمشروعك في Supabase
const SUPABASE_URL = 'https://nvfreqhmeprztpahfnft.supabase.co'; // الصق رابط المشروع هنا
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZnJlcWhtZXByenRwYWhmbmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njc1NTgsImV4cCI6MjA4MDM0MzU1OH0.pV9Ud-wltZJjryISJgqQRGfQU3X1frYTrrHJr5ymj4Y'; // الصق مفتاح anon public هنا

// --- الاتصال بـ Supabase (تم التصحيح هنا) ---
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- عناصر واجهة المستخدم ---
const form = document.getElementById('invoiceForm');
const invoiceInput = document.getElementById('invoiceNumber');
const submitButton = document.getElementById('submitButton');
const statusMsg = document.getElementById('status');
const buttonText = document.getElementById('button-text');
const spinner = document.getElementById('spinner');

let currentLocation = null;

// --- الوظائف ---

// دالة لتحديث حالة واجهة المستخدم (الرسائل، تفعيل/تعطيل الزر)
function updateUI(message, type, isButtonEnabled) {
    statusMsg.textContent = message;
    statusMsg.className = `status-message ${type}`;
    submitButton.disabled = !isButtonEnabled;

    if (isButtonEnabled) {
        buttonText.textContent = 'إرسال';
    } else {
        buttonText.textContent = 'انتظر تحديد الموقع...';
    }
}

// دالة لإظهار أو إخفاء أيقونة التحميل
function showLoading(isLoading) {
    spinner.style.display = isLoading ? 'block' : 'none';
    buttonText.textContent = isLoading ? '' : 'إرسال';
    submitButton.disabled = isLoading;
}

// دالة لمعالجة أخطاء تحديد الموقع وعرض رسالة مناسبة
function handleLocationError(error) {
    let message = '';
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = "تم رفض الإذن. يرجى تفعيل الموقع للمتصفح.";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "تعذر تحديد الموقع. حاول مرة أخرى.";
            break;
        case error.TIMEOUT:
            message = "انتهت مهلة الطلب. يرجى تحديث الصفحة.";
            break;
        default:
            message = "حدث خطأ غير معروف في تحديد الموقع.";
            break;
    }
    updateUI(message, 'error', false);
}

// دالة لطلب الموقع الجغرافي من المتصفح
function getLocation() {
    if (!navigator.geolocation) {
        updateUI('المتصفح لا يدعم تحديد الموقع.', 'error', false);
        return;
    }

    // عرض رسالة للمستخدم أثناء انتظار الموقع
    updateUI('جارٍ تحديد الموقع...', '', false);

    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            updateUI('تم تحديد الموقع بنجاح.', 'success', true);
        },
        handleLocationError
    );
}

// دالة لإرسال بيانات الفاتورة إلى Supabase عند الضغط على الزر
async function submitInvoice(event) {
    event.preventDefault(); // منع تحديث الصفحة
    const invoiceValue = invoiceInput.value.trim();

    if (!invoiceValue || !currentLocation) {
        updateUI('يرجى إدخال رقم الفاتورة وتفعيل الموقع.', 'error', true);
        return;
    }

    showLoading(true);

    const { error } = await supabase.from('invoices').insert({
        invoice_number: invoiceValue,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
    });

    showLoading(false);

    if (error) {
        updateUI('فشل الإرسال. تأكد من اتصالك بالإنترنت.', 'error', true);
        console.error('Supabase error:', error.message);
    } else {
        updateUI('تم إرسال الفاتورة بنجاح!', 'success', false); // تعطيل الزر بعد الإرسال
        form.reset(); // تفريغ حقل الإدخال
        
        // إعادة طلب الموقع تلقائيًا للاستعداد للإدخال التالي
        setTimeout(() => {
            getLocation();
        }, 2000); // انتظر ثانيتين قبل تحديث الموقع مرة أخرى
    }
}

// --- ربط الأحداث بالوظائف ---
window.addEventListener('load', getLocation); // اطلب الموقع عند تحميل الصفحة لأول مرة
form.addEventListener('submit', submitInvoice); // أرسل البيانات عند تقديم النموذج
