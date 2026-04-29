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
    const phone = "6287809657300";
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
        // LANKAH 1: Ambil SALT dan HASH target dari database untuk sekolah ini
        const { data: school, error: fetchError } = await _supabase
            .from('schools')
            .select('salt, activation_token, name')
            .eq('slug', clientId)
            .single();

        if (fetchError || !school) {
            alert("Sekolah tidak ditemukan, Lur!");
            return;
        }

        // LANGKAH 2: Buat hash dari (Input User + Salt dari DB)
        const userHash = await generateSHA256(inputToken + school.salt);
        // --- TAMBAHKAN INI UNTUK CEK DI CONSOLE (F12) ---
        console.log("Token Input:", inputToken);
        console.log("Salt dari DB:", school.salt);
        console.log("Rumus Gabung:", inputToken + school.salt);
        console.log("Hasil Hash Browser:", userHash);
        console.log("Hash di Database   :", school.activation_token);
        // ------------------------------------------------
        // LANGKAH 3: Bandingkan hasil hash tadi dengan yang ada di DB
        if (userHash === school.activation_token) {
            // Jika cocok, aktifkan!
            // ... di dalam prosesAktivasi ...
            const { data, error: updateError } = await _supabase
                .from('schools')
                .update({ license_status: 'active' }) // Pastikan nama kolomnya benar
                .eq('slug', clientId)
                .select(); // Tambahkan .select() untuk memastikan data terupdate

            if (updateError) {
                console.error("Gagal update DB:", updateError);
                alert("Token benar, tapi gagal lapor ke pusat, Lur! Cek RLS Supabase Sampeyan.");
            } else if (data && data.length > 0) {
                alert("Berhasil! Sistem telah aktif.");
                // location.reload();
                bukaSistem();
            } else {
                location.reload();
                alert("Gagal: Sekolah tidak ditemukan saat update.");
            }
        } else {
            alert("Token Salah, Lur! Periksa kembali kodenya.");
        }

    } catch (err) {
        console.error("Aktivasi Gagal:", err);
        alert("Terjadi gangguan jaringan.");
    }
}