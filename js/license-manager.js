// 1. Inisialisasi Variabel Global
const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get('id');

const SUPABASE_URL = 'https://fcjmcqwlaauuoheggjpp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjam1jcXdsYWF1dW9oZWdnanBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDU3OTQsImV4cCI6MjA5Mjk4MTc5NH0.SbisuJx1bfWUxcMhoqyLjpECPqtZHeRaPa6vAePGIdY';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Fungsi Utama Inisialisasi
async function initApp() {
    const loader = document.getElementById('loading-screen');
    if (!clientId) {
        if (loader) loader.style.display = 'none';
        alert("ID Sekolah tidak ditemukan, Lur!");
        return;
    }

    try {
        const { data: school, error } = await _supabase
            .from('schools')
            .select('name, license_status, salt, activation_token')
            .eq('slug', clientId)
            .single();

        if (error || !school) throw new Error("Sekolah tidak terdaftar.");

        // Simpan data ke Window agar bisa diakses di index.html
        window.schoolData = school;

        if (school.license_status === 'active') {
            bukaSistem();
        } else {
            tampilkanTirai(school.name);
        }
    } catch (err) {
        console.error("Auth Error:", err);
        if (loader) loader.style.display = 'none';
    }
}

function bukaSistem() {
    if (document.getElementById('loading-screen')) document.getElementById('loading-screen').style.display = 'none';
    if (document.getElementById('tirai-pembayaran')) document.getElementById('tirai-pembayaran').style.display = 'none';
    if (document.getElementById('main-app')) document.getElementById('main-app').style.display = 'block';
}

function tampilkanTirai(name) {
    if (document.getElementById('loading-screen')) document.getElementById('loading-screen').style.display = 'none';
    if (document.getElementById('tirai-pembayaran')) document.getElementById('tirai-pembayaran').style.display = 'flex';
    if (document.getElementById('pesan-tirai')) document.getElementById('pesan-tirai').innerText = `Masa aktif untuk ${name} telah habis.`;
}

// 3. Fungsi Aktivasi
async function prosesAktivasi() {
    const tokenInput = document.getElementById('input-token').value;
    if (!tokenInput) return alert("Isi tokennya, Lur!");

    const salt = window.schoolData.salt;
    const targetHash = window.schoolData.activation_token;

    const userHash = await generateSHA256(tokenInput + salt);

    if (userHash === targetHash) {
        const { error } = await _supabase
            .from('schools')
            .update({ license_status: 'active' })
            .eq('slug', clientId);

        if (!error) {
            alert("Aktivasi Berhasil!");
            bukaSistem();
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