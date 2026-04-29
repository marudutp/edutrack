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
    if(document.getElementById('loading-screen')) document.getElementById('loading-screen').style.display = 'none';
    if(document.getElementById('tirai-pembayaran')) document.getElementById('tirai-pembayaran').style.display = 'none';
    const mainApp = document.getElementById('main-app');
    if (mainApp) mainApp.style.filter = 'none';
}

function tampilkanTirai(schoolName) {
    if(document.getElementById('loading-screen')) document.getElementById('loading-screen').style.display = 'none';
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

async function prosesAktivasi() {
    const inputToken = document.getElementById('input-token').value;
    const clientId = urlParams.get('id');

    // Asumsi fungsi validateToken sudah ada di file ini atau file utility lain
    if (await validateToken(inputToken, "HASH_SAMPYEAN")) { 
        const { error } = await _supabase
            .from('schools')
            .update({ license_status: 'active' })
            .eq('slug', clientId);

        if (!error) {
            alert("Berhasil! Membuka sistem...");
            location.reload();
        }
    } else {
        alert("Token Salah, Lur!");
    }
}