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

let currentLocation = null;
let currentEntryType = null;

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
    entryValueInput.value = '';
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
async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
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
            currentLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            updateStatus('تم تحديد الموقع بنجاح.', 'success');
            showChoices();
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
    } else {
        alert('تم الإرسال بنجاح!');
        showChoices();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchUser();
    getLocation();
});
logoutButton.addEventListener('click', handleLogout);
invoiceChoiceBtn.addEventListener('click', () => showForm('invoice'));
fuelChoiceBtn.addEventListener('click', () => showForm('fuel'));
backButton.addEventListener('click', showChoices);
entryForm.addEventListener('submit', submitEntry);
