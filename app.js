// --- الإعدادات ---
// استبدل بالبيانات الخاصة بمشروعك في Supabase
const SUPABASE_URL = 'https://nvfreqhmeprztpahfnft.supabase.co'; // الصق رابط المشروع هنا
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZnJlcWhtZXByenRwYWhmbmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njc1NTgsImV4cCI6MjA4MDM0MzU1OH0.pV9Ud-wltZJjryISJgqQRGfQU3X1frYTrrHJr5ymj4Y'; // الصق مفتاح anon public هنا

// --- الإعدادات ---

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- عناصر واجهة المستخدم ---
const statusMsg = document.getElementById('status');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');

const choicesSection = document.getElementById('choices-section');
const formSection = document.getElementById('form-section');

const invoiceChoiceBtn = document.getElementById('invoice-choice-btn');
const fuelChoiceBtn = document.getElementById('fuel-choice-btn');
const backButton = document.getElementById('back-button');

const entryForm = document.getElementById('entryForm');
const entryValueInput = document.getElementById('entryValue');
const submitButton = document.getElementById('submitButton');
const buttonText = document.getElementById('button-text');
const spinner = document.getElementById('spinner');

// --- متغيرات الحالة ---
let currentLocation = null;
let currentEntryType = null; // سيخزن 'invoice' أو 'fuel'

// --- وظائف الواجهة ---
function updateStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = `status-message ${type}`;
}

function showLoading(isLoading) {
    spinner.style.display = isLoading ? 'block' : 'none';
    buttonText.textContent = isLoading ? '' : 'إرسال';
    submitButton.disabled = isLoading;
}

function showChoices() {
    choicesSection.classList.remove('hidden');
    formSection.classList.add('hidden');
}

function showForm(type) {
    currentEntryType = type;
    entryValueInput.value = ''; // تفريغ الحقل
    if (type === 'invoice') {
        entryValueInput.placeholder = 'أدخل رقم الفاتورة';
        entryValueInput.type = 'text';
    } else if (type === 'fuel') {
        entryValueInput.placeholder = 'أدخل قراءة عداد السيارة';
        entryValueInput.type = 'number';
    }
    choicesSection.classList.add('hidden');
    formSection.classList.remove('hidden');
}

// --- وظائف البيانات والمصادقة ---
async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
        if (profile && profile.full_name) {
            welcomeMessage.textContent = `مرحباً، ${profile.full_name}`;
        }
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = './login.html';
}

function getLocation() {
    updateStatus('جارٍ تحديد الموقع...', '');
    if (!navigator.geolocation) {
        updateStatus('المتصفح لا يدعم تحديد الموقع.', 'error');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            updateStatus('تم تحديد الموقع بنجاح.', 'success');
            showChoices(); // إظهار الاختيارات بعد تحديد الموقع
        },
        () => {
            updateStatus('تم رفض الوصول للموقع. يرجى تفعيله.', 'error');
        }
    );
}

async function submitEntry(event) {
    event.preventDefault();
    const entryValue = entryValueInput.value.trim();

    if (!entryValue || !currentLocation || !currentEntryType) {
        alert('يرجى إدخال القيمة المطلوبة.');
        return;
    }

    showLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('entries').insert({
        user_id: user.id,
        entry_type: currentEntryType,
        entry_value: entryValue,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
    });

    showLoading(false);

    if (error) {
        alert('فشل الإرسال. تأكد من اتصالك بالإنترنت.');
        console.error('Supabase error:', error.message);
    } else {
        alert('تم الإرسال بنجاح!');
        showChoices(); // الرجوع إلى شاشة الاختيارات
    }
}

// --- ربط الأحداث ---
document.addEventListener('DOMContentLoaded', () => {
    fetchUser();
    getLocation();
});

logoutButton.addEventListener('click', handleLogout);
invoiceChoiceBtn.addEventListener('click', () => showForm('invoice'));
fuelChoiceBtn.addEventListener('click', () => showForm('fuel'));
backButton.addEventListener('click', showChoices);
entryForm.addEventListener('submit', submitEntry);
