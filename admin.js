// مثال بسيط لكود جلب البيانات في صفحة الأدمن
async function displayInvoices() {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false }); // جلب الأحدث أولاً

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    // هنا يمكنك استخدام `data` (وهي مصفوفة من الفواتير) لعرضها في جدول HTML
    const tableBody = document.getElementById('invoices-table-body');
    tableBody.innerHTML = ''; // تفريغ الجدول قبل ملئه

    data.forEach(invoice => {
        const row = `
            <tr>
                <td>${invoice.invoice_number}</td>
                <td>${invoice.latitude}</td>
                <td>${invoice.longitude}</td>
                <td>${new Date(invoice.created_at).toLocaleString()}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

displayInvoices();