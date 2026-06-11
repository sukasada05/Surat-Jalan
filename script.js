// script.js
const SUPABASE_URL = 'https://GANTI_DENGAN_URL_ANDA.supabase.co';
const SUPABASE_ANON_KEY = 'GANTI_DENGAN_ANON_KEY_ANDA';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentNrp = null;
let currentAnggota = null;

// Helper format tanggal indo
function formatTanggal(tglISO) {
    if (!tglISO) return '';
    const date = new Date(tglISO);
    if (isNaN(date)) return tglISO;
    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

// Tampilkan notifikasi sederhana (alert diganti dengan toast style)
function showNotif(msg, isError = false) {
    const notif = document.createElement('div');
    notif.className = `alert ${isError ? 'alert-danger' : 'alert-success'} position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg`;
    notif.style.zIndex = '9999';
    notif.style.minWidth = '250px';
    notif.style.textAlign = 'center';
    notif.innerText = msg;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
}

async function loadCuti() {
    if (!currentNrp) return;
    const { data, error } = await supabase
        .from('permohonan_cuti')
        .select('*')
        .eq('nrp', currentNrp)
        .order('tanggal_surat', { ascending: false });
    if (error) {
        showNotif('Gagal ambil data: ' + error.message, true);
        return;
    }
    const tbody = document.getElementById('cutiBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-5">Belum ada data cuti</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatTanggal(row.tanggal_surat)}</td>
            <td>${row.nama}</td>
            <td>${row.pangkat}</td>
            <td>${row.nrp}</td>
            <td>${formatTanggal(row.berangkat_tanggal)}</td>
            <td>${formatTanggal(row.kembali_tanggal)}</td>
            <td>${row.tempat_tujuan}</td>
            <td>${row.keperluan}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editCuti('${row.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="deleteCuti('${row.id}')"><i class="fas fa-trash"></i></button>
                <button class="btn btn-info btn-sm" onclick="downloadSinglePdf('${row.id}')"><i class="fas fa-file-pdf"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editCuti = async (id) => {
    const { data, error } = await supabase.from('permohonan_cuti').select('*').eq('id', id).single();
    if (error) return showNotif('Gagal ambil data edit', true);
    document.getElementById('editId').value = data.id;
    document.getElementById('formNrp').value = data.nrp;
    document.getElementById('formNama').value = data.nama;
    document.getElementById('formPangkat').value = data.pangkat;
    document.getElementById('formJabatan').value = data.jabatan;
    document.getElementById('formKesatuan').value = data.kesatuan;
    document.getElementById('pengikut').value = data.pengikut || '';
    document.getElementById('pergi_dari').value = data.pergi_dari;
    document.getElementById('tempat_tujuan').value = data.tempat_tujuan;
    document.getElementById('keperluan').value = data.keperluan;
    document.getElementById('berkendaraan').value = data.berkendaraan;
    document.getElementById('tanggal_surat').value = data.tanggal_surat;
    document.getElementById('berangkat_tanggal').value = data.berangkat_tanggal;
    document.getElementById('kembali_tanggal').value = data.kembali_tanggal;
    new bootstrap.Modal(document.getElementById('cutiModal')).show();
};

window.deleteCuti = async (id) => {
    if (confirm('Yakin menghapus data cuti ini?')) {
        const { error } = await supabase.from('permohonan_cuti').delete().eq('id', id);
        if (error) showNotif('Gagal hapus: '+error.message, true);
        else { showNotif('Data berhasil dihapus'); loadCuti(); }
    }
};

window.resetForm = () => {
    document.getElementById('cutiForm').reset();
    document.getElementById('editId').value = '';
    if (currentAnggota) {
        document.getElementById('formNrp').value = currentAnggota.nrp;
        document.getElementById('formNama').value = currentAnggota.nama;
        document.getElementById('formPangkat').value = currentAnggota.pangkat;
        document.getElementById('formJabatan').value = currentAnggota.jabatan || '';
        document.getElementById('formKesatuan').value = currentAnggota.kesatuan || '';
    }
    document.getElementById('tanggal_surat').value = new Date().toISOString().slice(0,10);
};

document.getElementById('saveCutiBtn').onclick = async () => {
    const id = document.getElementById('editId').value;
    const dataCuti = {
        nrp: document.getElementById('formNrp').value,
        nama: document.getElementById('formNama').value,
        pangkat: document.getElementById('formPangkat').value,
        jabatan: document.getElementById('formJabatan').value,
        kesatuan: document.getElementById('formKesatuan').value,
        pengikut: document.getElementById('pengikut').value,
        pergi_dari: document.getElementById('pergi_dari').value,
        tempat_tujuan: document.getElementById('tempat_tujuan').value,
        keperluan: document.getElementById('keperluan').value,
        berkendaraan: document.getElementById('berkendaraan').value,
        tanggal_surat: document.getElementById('tanggal_surat').value,
        berangkat_tanggal: document.getElementById('berangkat_tanggal').value,
        kembali_tanggal: document.getElementById('kembali_tanggal').value
    };
    let result;
    if (id) result = await supabase.from('permohonan_cuti').update(dataCuti).eq('id', id);
    else result = await supabase.from('permohonan_cuti').insert([dataCuti]);
    if (result.error) showNotif('Error: '+result.error.message, true);
    else {
        showNotif('Data tersimpan');
        bootstrap.Modal.getInstance(document.getElementById('cutiModal')).hide();
        loadCuti();
    }
};

// LOGIN
document.getElementById('loginBtn').onclick = async () => {
    const nrp = document.getElementById('nrpLogin').value.trim();
    const errorDiv = document.getElementById('loginError');
    if (!nrp) {
        errorDiv.classList.remove('d-none');
        errorDiv.innerText = 'Masukkan NRP';
        return;
    }
    errorDiv.classList.add('d-none');
    const { data, error } = await supabase.from('master_anggota').select('*').eq('nrp', nrp);
    if (error || !data || data.length === 0) {
        errorDiv.classList.remove('d-none');
        errorDiv.innerText = 'NRP tidak terdaftar di database';
        return;
    }
    currentAnggota = data[0];
    currentNrp = nrp;
    localStorage.setItem('cuti_nrp', nrp);
    localStorage.setItem('cuti_anggota', JSON.stringify(currentAnggota));
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dataSection').style.display = 'block';
    document.getElementById('userInfo').innerHTML = `<i class="fas fa-user-check"></i> ${currentAnggota.nama} (${currentAnggota.pangkat})`;
    resetForm();
    loadCuti();
};

document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('cuti_nrp');
    localStorage.removeItem('cuti_anggota');
    currentNrp = null;
    currentAnggota = null;
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dataSection').style.display = 'none';
    document.getElementById('nrpLogin').value = '';
};

// Cek session
const storedNrp = localStorage.getItem('cuti_nrp');
const storedAnggota = localStorage.getItem('cuti_anggota');
if (storedNrp && storedAnggota) {
    currentNrp = storedNrp;
    currentAnggota = JSON.parse(storedAnggota);
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dataSection').style.display = 'block';
    document.getElementById('userInfo').innerHTML = `<i class="fas fa-user-check"></i> ${currentAnggota.nama} (${currentAnggota.pangkat})`;
    resetForm();
    loadCuti();
}

// Download PDF All
document.getElementById('downloadAllPdfBtn').onclick = () => {
    const element = document.getElementById('cutiTable');
    const opt = { margin: 0.5, filename: 'laporan_cuti.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a2', orientation: 'landscape' } };
    html2pdf().set(opt).from(element).save();
};

window.downloadSinglePdf = async (id) => {
    const { data, error } = await supabase.from('permohonan_cuti').select('*').eq('id', id).single();
    if (error) return showNotif('Gagal ambil data PDF', true);
    const div = document.createElement('div');
    div.style.padding = '20px';
    div.style.fontFamily = 'Arial';
    div.innerHTML = `<h2>Surat Permohonan Cuti</h2>
        <p><strong>NRP:</strong> ${data.nrp}<br><strong>Nama:</strong> ${data.nama} (${data.pangkat})<br><strong>Jabatan:</strong> ${data.jabatan}<br><strong>Kesatuan:</strong> ${data.kesatuan}<br>
        <strong>Pengikut:</strong> ${data.pengikut || '-'}<br><strong>Pergi dari:</strong> ${data.pergi_dari}<br><strong>Tujuan:</strong> ${data.tempat_tujuan}<br>
        <strong>Keperluan:</strong> ${data.keperluan}<br><strong>Kendaraan:</strong> ${data.berkendaraan}<br>
        <strong>Tanggal Surat:</strong> ${formatTanggal(data.tanggal_surat)}<br>
        <strong>Berangkat:</strong> ${formatTanggal(data.berangkat_tanggal)}<br>
        <strong>Kembali:</strong> ${formatTanggal(data.kembali_tanggal)}</p>`;
    html2pdf().set({ margin: 0.5, filename: `cuti_${data.nama}.pdf` }).from(div).save();
};

// Download TXT (JSON)
document.getElementById('downloadTxtBtn').onclick = async () => {
    const { data, error } = await supabase.from('permohonan_cuti').select('*').eq('nrp', currentNrp);
    if (error) return showNotif('Gagal export TXT', true);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cuti_data.txt';
    link.click();
    URL.revokeObjectURL(link.href);
};

// Download CSV
document.getElementById('downloadCsvBtn').onclick = async () => {
    const { data, error } = await supabase.from('permohonan_cuti').select('*').eq('nrp', currentNrp);
    if (error || !data || data.length === 0) return showNotif('Tidak ada data', true);
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cuti_data.csv';
    link.click();
};
