const CACHE_NAME = 'santiye-defteri-v3';
const CORE_ASSETS = ['./', './index.html', './stil.css', './script.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(()=>{})
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Firebase ve dış servislere her zaman ağdan git (önbelleğe alma)
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('firebaseapp.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com') ||
      event.request.url.includes('ipify.org')) {
    return;
  }
  // ÖNCE İNTERNET: internet varsa her zaman en güncel dosyayı çek ve önbelleği güncelle.
  // İnternet yoksa (çevrimdışı), o zaman önbellekteki son bilinen kopyayı göster.
  event.respondWith(
    fetch(event.request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(()=>{});
      return response;
    }).catch(() => caches.match(event.request))
  );
});

// Bildirime tıklanınca uygulamayı aç (veya öne getir) ve yevmiye giriş ekranına yönlendir
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({type:'window', includeUncontrolled:true}).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({openEntry:true});
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./index.html').then(newClient => {
          if (newClient) setTimeout(()=> newClient.postMessage({openEntry:true}), 1500);
        });
      }
    })
  );
});

// Günlük yerel hatırlatma: uygulama kapalıyken de en iyi çaba ile çalışsın diye
// tarayıcı destekliyorsa (Chrome/Android) periyodik arka plan senkronizasyonunu kaydet.
// Not: Bu API tüm tarayıcılarda yok ve zamanlaması kesin değildir — bu, web teknolojisinin
// (Firebase ile ilgisi olmayan) genel bir platform sınırlamasıdır.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'yevmiye-reminder-check') {
    event.waitUntil(checkYevmiyeReminderInBackground());
  }
});
async function checkYevmiyeReminderInBackground(){
  try{
    const clientList = await self.clients.matchAll({type:'window'});
    if (clientList.length > 0) return; // uygulama zaten açık, ön plan zamanlayıcısı hallediyor
    // Uygulama kapalıyken burada gösterilecek bildirim, o an kayıt durumu bilinmediği için
    // genel bir hatırlatma olarak gösterilir (ayrıntılı kontrol uygulama açıldığında yapılır).
    await self.registration.showNotification('📋 Şantiye Defteri', {
      body: 'Bugünkü yevmiyenizi henüz girmediniz. Kaydı tamamlamak için dokunun.',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      data: {openEntry:true}
    });
  }catch(e){}
}
