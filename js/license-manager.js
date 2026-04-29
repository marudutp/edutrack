// --- CONFIGURATION & GLOBAL VARS ---
const SUPABASE_URL = 'https://fcjmcqwlaauuoheggjpp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjam1jcXdsYWF1dW9oZWdnanBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDU3OTQsImV4cCI6MjA5Mjk4MTc5NH0.SbisuJx1bfWUxcMhoqyLjpECPqtZHeRaPa6vAePGIdY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
let currentSchoolName = "Sekolah Kami";

// --- CORE LOGIC: INIT APP ---
async function initApp() {
    const clientId = urlParams.get('id');
    if (!clientId) return console.error("ID Sekolah tidak ditemukan.");

    try {
        const { data: school, error } = await _supabase
            .from('schools')
            .select('name, license_status')
            .eq('slug', clientId)
            .single();

        if (error || !school) throw new Error("Sekolah tidak terdaftar");

        currentSchoolName = school.name;

        if (school.license_status === 'active') {
            bukaSistem();
        } else {
            tampilkanTirai(school.name);
        }
    } catch (err) {
        console.error("Auth Error:", err);
    }
}

function bukaSistem() {
    if (document.getElementById('loading-screen')) document.getElementById('loading-screen').style.display = 'none';
    if (document.getElementById('tirai-pembayaran')) document.getElementById('tirai-pembayaran').style.display = 'none';
    const mainApp = document.getElementById('main-app');
    if (mainApp) mainApp.style.filter = 'none';
}

function tampilkanTirai(schoolName) {
    if (document.getElementById('loading-screen')) document.getElementById('loading-screen').style.display = 'none';
    const pesanTirai = document.getElementById('pesan-tirai');
    if (pesanTirai) pesanTirai.innerText = `Saudara ${schoolName}, masa freemium Anda sudah habis.`;

    document.getElementById('tirai-pembayaran').style.display = 'flex';
    const mainApp = document.getElementById('main-app');
    if (mainApp) mainApp.style.filter = 'blur(10px)';
}

// --- FUNGSI TOMBOL ---
function kirimBuktiWA() {
    const phone = "6281315582319";
    const pesan = encodeURIComponent(`Halo Lur, saya dari ${currentSchoolName} ingin kirim bukti transfer aktivasi EduTrack.`);
    window.open(`https://wa.me/${phone}?text=${pesan}`, '_blank');
}

// Fungsi untuk merubah teks biasa jadi SHA-256
async function generateSHA256(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function prosesAktivasi() {
    const inputToken = document.getElementById('input-token').value;
    const clientId = urlParams.get('id');

    if (!inputToken) return alert("Isi tokennya dulu, Lur!");

    try {
        // 1. Ubah input user jadi hash SHA-256
        const hashedInput = await generateSHA256(inputToken);

        // 2. Cek ke Supabase: bandingkan HASH di DB vs HASH dari input user
        const { data: school, error } = await _supabase
            .from('schools')
            .select('id')
            .eq('slug', clientId)
            .eq('activation_token', hashedInput)
            .single();

        if (error || !school) {
            alert("Token Salah, Lur! Periksa kembali kode aktivasi Sampeyan.");
            return;
        }

        // 3. Jika cocok, ubah status jadi 'active'
        const { error: updateError } = await _supabase
            .from('schools')
            .update({ license_status: 'active' })
            .eq('id', school.id);

        if (!updateError) {
            alert("Sistem Berhasil Diaktifkan! Membuka gembok...");
            location.reload();
        }

    } catch (err) {
        console.error("Gagal Aktivasi:", err);
        alert("Terjadi kesalahan teknis, Lur.");
    }
}