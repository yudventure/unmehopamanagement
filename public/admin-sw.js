/*
 * Pemadam, bukan pekerja. Ini bukan service worker sistem stafnya.
 *
 * Yang asli ada di /sistem/admin-sw.js, dan ruang lingkupnya /sistem/ saja.
 * Berkas ini duduk di akar domain dengan nama yang sama persis, dan tugasnya
 * satu: mematikan pendahulunya.
 *
 * ## Kenapa harus ada
 *
 * Di hosting lama, seluruh aplikasinya duduk di akar domain, jadi
 * `register('admin-sw.js')` menghasilkan pendaftaran dengan ruang lingkup `/`
 * — seluruh domain. Service worker itu memotong SETIAP navigasi same-origin
 * dan menyajikan salinan tersimpan lebih dulu (stale-while-revalidate), lalu
 * cache-first untuk aset.
 *
 * Itu keputusan yang benar untuk sinyal pulau, dan jadi jebakan begitu domain
 * yang sama mulai menyajikan situs yang berbeda. Di tiap HP staf yang pernah
 * membuka dashboard, service worker lama itu masih terpasang. Waktu
 * turtledivehomestay.com mulai menyajikan situs baru, yang mereka lihat bukan
 * situs baru melainkan salinan situs lama dari cache-nya sendiri — dan tidak
 * ada yang memperbaikinya, karena situs baru tidak pernah mendengarkan pesan
 * NEW_VERSION yang dikirim service worker itu.
 *
 * Gejalanya persis jenis yang paling mahal: berjalan sempurna di mesin yang
 * belum pernah membuka sistemnya (termasuk mesin yang mengerjakan ini), dan
 * rusak diam-diam berminggu-minggu di HP orang yang memakainya tiap hari.
 *
 * ## Cara kerjanya
 *
 * Peramban memeriksa ulang berkas service worker-nya sendiri, dan berkas di
 * alamat ini sudah berbeda isinya dengan yang lama. Jadi ia dipasang,
 * langsung diaktifkan, lalu: membuang cache lamanya, mencabut pendaftarannya
 * sendiri, dan memuat ulang tab yang sedang terbuka supaya yang tampil
 * situs sungguhan, bukan sisa cache.
 *
 * Tidak ada `fetch` handler di sini, dan itu disengaja: selama ia hidup —
 * beberapa milidetik — ia tidak boleh memotong apa pun.
 *
 * Cache yang dibuang bernama sama dengan cache sistem stafnya. Itu tidak
 * apa-apa: yang di /sistem/ akan mengisinya lagi sendiri pada kunjungan
 * berikutnya. Sekali bersih, lalu berkas ini tidak pernah jalan lagi.
 */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) { return k.indexOf('turtle-admin') === 0; })
            .map(function (k) { return caches.delete(k); }),
        );
      })
      .catch(function () {})
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (cs) {
        cs.forEach(function (c) {
          /* Memuat ulang di alamat yang sama. Tab yang sedang menatap salinan
             lama jadi menatap yang sungguhan, tanpa menunggu siapa pun
             menekan apa pun. */
          if (c.navigate) c.navigate(c.url);
        });
      })
      .catch(function () {}),
  );
});
