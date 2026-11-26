// Admin dashboard service worker v5 — BUKA SEKETIKA, perbarui di latar belakang.
//
// KENAPA v5 (2026-08-31, atas keluhan William: "kerja dengan signal lemah sama sekali
// tidak bisa karena loading nya sangat lama sedangkan kita di kejar waktu"):
//
// v4 memakai NETWORK-FIRST untuk HTML dengan cache:'no-store'. Artinya setiap kali
// halaman dibuka, browser HARUS menunggu unduhan penuh (~203 KB terkompresi untuk
// Dashboard) selesai dulu sebelum apa pun tampil. Salinan tersimpan baru dipakai kalau
// fetch benar-benar GAGAL — padahal dengan sinyal lemah fetch tidak gagal, dia cuma
// LAMBAT SEKALI (bisa 30 detik lebih sebelum menyerah). Jadi justru pada kondisi yang
// paling butuh cepat, cache-nya tidak pernah terpakai.
//
// Lebih parah lagi: halaman-halaman itu punya "cache-buster" yang menambahkan
// ?v=<timestamp> baru setiap kali dibuka. Karena cache dicocokkan berdasarkan URL,
// setiap pembukaan menghasilkan URL yang belum pernah ada di cache — sehingga:
//   • c.match(req) selalu kosong  → fallback offline tidak pernah jalan,
//   • `old` selalu undefined      → deteksi versi baru (NEW_VERSION) tidak pernah jalan,
//   • c.put() menyimpan salinan BARU tiap buka → cache membengkak tanpa batas.
// Seluruh fasilitas PWA-nya lumpuh. Cache-buster itu dicabut dari halamannya bersamaan
// dengan v5 ini.
//
// YANG BERUBAH DI v5:
//   • HTML: STALE-WHILE-REVALIDATE. Salinan tersimpan disajikan SEKETIKA (0 detik,
//     jalan walau sinyal lemah atau mati total), lalu versi baru diambil diam-diam di
//     latar belakang. Kalau isinya ternyata berbeda, semua tab diberi tahu untuk
//     memuat ulang sekali — jadi update tetap otomatis sampai ke HP, tanpa perlu
//     ganti nama file dan tanpa pernah membuat siapa pun menunggu.
//   • Kunci cache DINORMALKAN: ?v=... dan #hash dibuang sebelum dicocokkan/disimpan,
//     jadi satu halaman = satu entri cache, apa pun embel-embel di alamatnya. Ini juga
//     membuat v5 kebal kalau suatu saat ada cache-buster nyasar lagi.
//   • Aset (gambar/ikon): tetap cache-first + segarkan di latar belakang.
//   • Nama cache dinaikkan → semua cache lama (termasuk yang membengkak dari v4)
//     otomatis dihapus saat v5 aktif.
const CACHE = 'turtle-admin-v5';

self.addEventListener('install', function (e) { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

// Biar halaman bisa memaksa worker baru langsung aktif setelah ada update.
self.addEventListener('message', function (e) { if (e.data === 'skipWaiting') self.skipWaiting(); });

function notifyClients(msg) {
  self.clients.matchAll({ type: 'window' }).then(function (cs) { cs.forEach(function (c) { c.postMessage(msg); }); });
}

/* Satu halaman = satu entri cache. Query (?v=..., ?page=...) dan #hash dibuang, supaya
   membuka halaman yang sama lewat alamat yang sedikit berbeda tetap kena cache. */
function pageKey(rawUrl) {
  var u = new URL(rawUrl);
  u.search = '';
  u.hash = '';
  return u.href;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                       // jangan sentuh POST (penulisan data)
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // API (script.google.com) -> biarkan lewat jaringan

  var accept = req.headers.get('accept') || '';
  var isHTML = req.mode === 'navigate' || accept.indexOf('text/html') !== -1 || url.pathname.indexOf('.html') !== -1;

  if (isHTML) {
    var key = pageKey(req.url);
    e.respondWith(
      caches.open(CACHE).then(function (c) {
        return c.match(key).then(function (cached) {

          // Ambil versi terbaru di latar belakang — TIDAK ditunggu kalau sudah ada
          // salinan tersimpan. Inilah inti perbaikannya.
          var fresh = fetch(req, { cache: 'no-store' }).then(function (res) {
            if (res && res.status === 200) {
              var toStore = res.clone();
              if (cached) {
                // Bandingkan isi: kalau berbeda berarti ada versi baru di server.
                Promise.all([cached.clone().text(), res.clone().text()]).then(function (t) {
                  if (t[0] !== t[1]) {
                    c.put(key, toStore).then(function () { notifyClients({ type: 'NEW_VERSION' }); }).catch(function () {});
                  }
                  // Isi sama persis → tidak perlu tulis ulang cache, tidak perlu reload.
                }).catch(function () {});
              } else {
                c.put(key, toStore).catch(function () {});
              }
            }
            return res;
          }).catch(function () { return cached; });   // jaringan mati → pakai yang tersimpan

          // Ada salinan → sajikan SEKARANG JUGA. Belum ada → mau tak mau tunggu jaringan.
          return cached || fresh;
        });
      })
    );
    return;
  }

  // Aset: CACHE-FIRST + segarkan di latar belakang.
  e.respondWith(
    caches.match(req).then(function (cached) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200) { var c = res.clone(); caches.open(CACHE).then(function (x) { x.put(req, c); }).catch(function () {}); }
        return res;
      }).catch(function () { return cached; });
      return cached || net;
    })
  );
});
