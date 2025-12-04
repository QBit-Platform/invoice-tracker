const tableBody = document.getElementById('entries-table-body');
const userFilter = document.getElementById('user-filter');
const filterForm = document.getElementById('filter-form');
const logoutButton = document.getElementById('logout-button');
const map = L.map('map').setView([30.0444, 31.2357], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
const routeLayer = L.layerGroup().addTo(map);

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = './login.html';
}
async function populateUserFilter() {
    const { data: profiles, error } = await supabase.from('profiles').select('id, full_name').eq('role', 'مندوب');
    if (error) return;
    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.full_name;
        userFilter.appendChild(option);
    });
}
async function fetchAndDisplayEntries() {
    tableBody.innerHTML = '';
    routeLayer.clearLayers();
    
    // --- هذا هو السطر الذي تم تصحيحه ---
    // قمنا بتغيير '*, profiles(full_name)' إلى '*, profiles:user_id(full_name)'
    // هذا يخبر Supabase صراحةً باستخدام عمود user_id للربط
    let query = supabase.from('entries').select('*, profiles:user_id(full_name)');
    // ------------------------------------

    if (userFilter.value) query = query.eq('user_id', userFilter.value);
    const typeFilter = document.getElementById('type-filter').value;
    if (typeFilter) query = query.eq('entry_type', typeFilter);
    const startDate = document.getElementById('start-date-filter').value;
    if (startDate) query = query.gte('created_at', startDate);
    const endDate = document.getElementById('end-date-filter').value;
    if (endDate) query = query.lte('created_at', `${endDate}T23:59:59`);
    query = query.order('created_at', { ascending: true });
    const { data: entries, error } = await query;
    if (error) {
        console.error('خطأ في جلب البيانات:', error);
        return;
    }
    const routeCoordinates = [];
    entries.forEach(entry => {
        const rowHTML = `<tr data-lat="${entry.latitude}" data-lng="${entry.longitude}">
            <td>${entry.profiles?.full_name || 'غير معروف'}</td>
            <td>${entry.entry_type === 'invoice' ? 'فاتورة' : 'وقود'}</td>
            <td>${entry.entry_value}</td>
            <td>${new Date(entry.created_at).toLocaleString('ar-EG')}</td>
        </tr>`;
        tableBody.insertAdjacentHTML('afterbegin', rowHTML);
        if (entry.latitude && entry.longitude) {
            const marker = L.marker([entry.latitude, entry.longitude]).addTo(routeLayer);
            marker.bindPopup(`<b>${entry.profiles?.full_name}</b><br>${entry.entry_type === 'invoice' ? 'فاتورة رقم: ' : 'عداد: '}${entry.entry_value}`);
            routeCoordinates.push([entry.latitude, entry.longitude]);
        }
    });
    if (userFilter.value && routeCoordinates.length > 1) {
        const polyline = L.polyline(routeCoordinates, { color: '#dc3545', weight: 5 }).addTo(routeLayer);
        L.polylineDecorator(polyline, {
            patterns: [{
                offset: '10%',
                repeat: '80px',
                symbol: L.Symbol.arrowHead({ pixelSize: 15, pathOptions: { fillOpacity: 1, weight: 0, color: '#dc3545' } })
            }]
        }).addTo(routeLayer);
        map.fitBounds(polyline.getBounds().pad(0.1));
    } else if (routeCoordinates.length > 0) {
        // إذا كانت هناك نقاط ولكن ليست مسارًا، قم بتقريب الخريطة لتناسب جميع النقاط
        map.fitBounds(L.latLngBounds(routeCoordinates).pad(0.1));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    populateUserFilter();
    fetchAndDisplayEntries();
});
filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    fetchAndDisplayEntries();
});
filterForm.addEventListener('reset', () => {
    setTimeout(fetchAndDisplayEntries, 0);
});
logoutButton.addEventListener('click', handleLogout);
tableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const lat = row.dataset.lat;
    const lng = row.dataset.lng;
    if (lat && lng) {
        map.flyTo([lat, lng], 15);
    }
});
