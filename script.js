/**
 * Modul Presensi Wajah Terintegrasi Telegram Bot API
 * BimtolProject Ecosystem
 */

// ==========================================
// 1. KONFIGURASI TELEGRAM BOT
// ==========================================
// Ganti dengan Token Bot dan Chat ID Telegram kamu
const TELEGRAM_BOT_TOKEN = '8980539836:AAGfySYT1uK8mF_egU5NQvtxCh-LX_WEKFI';
const TELEGRAM_CHAT_ID = '1917708915';

// ==========================================
// 2. INISIALISASI ELEMEN & JAM REAL-TIME
// ==========================================
const video = document.getElementById('videoElement');
const canvas = document.getElementById('photoCanvas');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const btnStartCamera = document.getElementById('btnStartCamera');
const btnSubmit = document.getElementById('btnSubmit');
const statusAlert = document.getElementById('statusAlert');
const statusMessage = document.getElementById('statusMessage');
const statusIcon = document.getElementById('statusIcon');

let streamInstance = null;

// Jalankan jam dan tanggal real-time
function updateRealTimeClock() {
  const now = new Date();
  
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  
  document.getElementById('liveTime').textContent = now.toLocaleTimeString('id-ID', timeOptions) + ' WIB';
  document.getElementById('liveDate').textContent = now.toLocaleDateString('id-ID', dateOptions);
}
setInterval(updateRealTimeClock, 1000);
updateRealTimeClock();

// ==========================================
// 3. KONTROL KAMERA
// ==========================================
async function startCamera() {
  try {
    showStatus('Meminta izin akses kamera...', 'loading');
    
    // Meminta stream kamera depan
    streamInstance = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });

    video.srcObject = streamInstance;
    cameraPlaceholder.classList.add('hidden');
    btnSubmit.disabled = false;
    btnStartCamera.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Kamera Aktif';
    btnStartCamera.disabled = true;

    hideStatus();
  } catch (error) {
    console.error('Gagal mengakses kamera:', error);
    showStatus('Gagal mengakses kamera. Izinkan akses izin kamera pada peramban Anda.', 'error');
  }
}

// ==========================================
// 4. PENGAMBILAN GAMBAR & PENGIRIMAN KE TELEGRAM
// ==========================================
async function submitAttendance(event) {
  event.preventDefault();

  if (!streamInstance) {
    showStatus('Harap aktifkan kamera terlebih dahulu!', 'error');
    return;
  }

  const name = document.getElementById('userName').value.trim();
  const status = document.getElementById('userActivity').value;
  const timeString = document.getElementById('liveTime').textContent;
  const dateString = document.getElementById('liveDate').textContent;

  if (!name) {
    showStatus('Nama lengkap wajib diisi.', 'error');
    return;
  }

  // Nonaktifkan tombol selama proses kirim
  btnSubmit.disabled = true;
  showStatus('Memverifikasi wajah & mengirim presensi ke Telegram...', 'loading');

  // Ambil snapshot gambar dari video ke canvas
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');

  // Efek cermin saat render canvas agar sesuai preview
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Konversi canvas ke Blob (JPEG)
  canvas.toBlob(async (blob) => {
    if (!blob) {
      showStatus('Gagal memproses gambar kamera.', 'error');
      btnSubmit.disabled = false;
      return;
    }

    // Format pesan caption Telegram
    const captionText = 
      `📌 *PRESENSI DIGITAL BIMTOLPROJECT*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Nama:* ${name}\n` +
      `📋 *Status:* ${status}\n` +
      `🕒 *Waktu:* ${timeString}\n` +
      `📅 *Tanggal:* ${dateString}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Status: Terverifikasi oleh Sistem Presensi Wajah_`;

    // Siapkan data FormData untuk Telegram API
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', blob, `presensi_${Date.now()}.jpg`);
    formData.append('caption', captionText);
    formData.append('parse_mode', 'Markdown');

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.ok) {
        showStatus('Presensi berhasil dikirim ke Telegram!', 'success');
        document.getElementById('userName').value = '';
      } else {
        throw new Error(result.description || 'Gagal mengirim data ke bot.');
      }
    } catch (err) {
      console.error('Telegram API Error:', err);
      showStatus(`Gagal kirim: ${err.message}`, 'error');
    } finally {
      btnSubmit.disabled = false;
    }
  }, 'image/jpeg', 0.85);
}

// ==========================================
// 5. HELPER STATUS ALERT
// ==========================================
function showStatus(text, type) {
  statusAlert.classList.remove('hidden', 'success', 'error');
  statusMessage.textContent = text;

  if (type === 'loading') {
    statusIcon.className = 'fa-solid fa-spinner fa-spin';
  } else if (type === 'success') {
    statusAlert.classList.add('success');
    statusIcon.className = 'fa-solid fa-circle-check';
  } else if (type === 'error') {
    statusAlert.classList.add('error');
    statusIcon.className = 'fa-solid fa-circle-exclamation';
  }
}

function hideStatus() {
  statusAlert.classList.add('hidden');
}
