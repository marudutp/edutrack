
// 1. Definisikan variabel di paling ATAS
const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get('id');

// --- CONFIGURATION & GLOBAL VARS ---
const SUPABASE_URL = 'https://fcjmcqwlaauuoheggjpp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjam1jcXdsYWF1dW9oZWdnanBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDU3OTQsImV4cCI6MjA5Mjk4MTc5NH0.SbisuJx1bfWUxcMhoqyLjpECPqtZHeRaPa6vAePGIdY';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Fungsi Utama Satpam
async function initApp() {
    const loader = document.getElementById('loading-screen');
    const tirai = document.getElementById('tirai-pembayaran');
    const mainApp = document.getElementById('main-app');

    if (!clientId) {
        if (loader) loader.style.display = 'none';
        alert("ID Sekolah tidak ditemukan di URL, Lur!");
        return;
    }

    try {
        const { data: school, error } = await _supabase
            .from('schools')
            .select('name, license_status, salt, activation_token')
            .eq('slug', clientId)
            .single();

        if (error || !school) throw new Error("Sekolah tidak terdaftar.");

        // Simpan nama sekolah ke global biar bisa dipakai di index.html
        window.currentSchoolName = school.name;
        window.schoolData = school; // Simpan data salt & token untuk aktivasi

        if (school.license_status === 'active') {
            bukaSistem();
        } else {
            tampilkanTirai(school.name);
        }
    } catch (err) {
        if (loader) loader.style.display = 'none';
        console.error("Auth Error:", err);
    }
}

function bukaSistem() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('tirai-pembayaran').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

function tampilkanTirai(name) {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('tirai-pembayaran').style.display = 'flex';
    document.getElementById('pesan-tirai').innerText = `Masa aktif untuk ${name} telah habis.`;
}

// 3. FUNGSI AKTIVASI (Yang Sampeyan tanyakan tadi)
async function prosesAktivasi() {
    const tokenInput = document.getElementById('input-token').value;
    if (!tokenInput) return alert("Isi tokennya, Lur!");

    // Gunakan data school yang sudah kita simpan di window.schoolData saat initApp tadi
    const salt = window.schoolData.salt;
    const targetHash = window.schoolData.activation_token;

    // Buat hash dari (Input + Salt)
    const userHash = await generateSHA256(tokenInput + salt);

    if (userHash === targetHash) {
        const { error } = await _supabase
            .from('schools')
            .update({ license_status: 'active' })
            .eq('slug', clientId);

        if (!error) {
            alert("Aktivasi Berhasil!");
            bukaSistem(); // <--- INI KUNCINYA! Langsung buka tanpa refresh
        }
    } else {
        alert("Token Salah, Lur!");
    }
}

async function generateSHA256(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}