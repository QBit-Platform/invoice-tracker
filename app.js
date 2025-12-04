// --- الإعدادات ---
// استبدل بالبيانات الخاصة بمشروعك في Supabase
const SUPABASE_URL = 'https://nvfreqhmeprztpahfnft.supabase.co'; // الصق رابط المشروع هنا
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZnJlcWhtZXByenRwYWhmbmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njc1NTgsImV4cCI6MjA4MDM0MzU1OH0.pV9Ud-wltZJjryISJgqQRGfQU3X1frYTrrHJr5ymj4Y'; // الصق مفتاح anon public هنا

// --- الاتصال بـ Supabase ---
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- عناصر الصفحة ---
const form = document.getElementById('invoiceForm');
const invoiceInput = document.getElementById('invoiceNumber');
const submitButton = document.getElementById('submitButton');
const statusMsg = document.getElementById('status');
const buttonText = document.getElementById('button-text');
const spinner = document.getElementById('spinner');

let currentLocation = null;

// --- الوظائف ---

// دالة لتحديث واجهة المستخدم
function updateUI(message, type, isButtonEnabled) {
    statusMsg.textContent = message;
    statusMsg.className = `status-message ${type}`;
    submitButton.disabled = !isButtonEnabled;

    if (isButtonEnabled) {
        buttonText.textContent = 'إرسال';
    } else if (message.includes('تحديد الموقع')) {
         buttonText.textContent = 'انتظر تحديد الموقع...';
    }
}

// دالة لإظهار وإخفاء دائرة التحميل
function showLoading(isLoading) {
    if (isLoading) {
        spinner.style.display = 'block';
        buttonText.textContent = '';
        submitButton.disabled = true;
    } else {
        spinner.style.display = 'none';
        buttonText.textContent = 'إرسال';
        submitButton.disabled = false;
    }
}

// دالة للحصول على الموقع الجغرافي
function getLocation() {
    if (!navigator.geolocation) {
        updateUI('المتصفح لا يدعم تحديد الموقع.', 'error', false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            updateUI('تم تحديد الموقع بنجاح.', 'success', true);
        },
        () => {
            updateUI('تم رفض الوصول إلى الموقع. يرجى تفعيله.', 'error', false);
        }
    );
}

// دالة إرسال البيانات إلى Supabase
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
        updateUI('فشل الإرسال. حاول مرة أخرى.', 'error', true);
        console.error('Supabase error:', error.message);
    } else {
        updateUI('تم إرسال الفاتورة بنجاح!', 'success', true);
        form.reset(); // تفريغ الحقل
        // أعد طلب الموقع للاستعداد للإدخال التالي
        setTimeout(() => {
            updateUI('', '', false); // إعادة تعيين الرسالة
            getLocation();
        }, 2000); // انتظر ثانيتين قبل تحديث الموقع مرة أخرى
    }
}


// --- ربط الأحداث ---
window.addEventListener('load', getLocation); // اطلب الموقع عند تحميل الصفحة
form.addEventListener('submit', submitInvoice); // أرسل البيانات عند الضغط على الزر
