// ---------- UYGULAMA KAPALIYKEN DE BİLDİRİM (Firebase Cloud Messaging) ----------
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "AIzaSyD_HgqaB1bQgLuwduTL8lIXKMwK9-HZWZk",
  authDomain: "defterim-bf5a9.firebaseapp.com",
  projectId: "defterim-bf5a9",
  storageBucket: "defterim-bf5a9.firebasestorage.app",
  messagingSenderId: "504570577849",
  appId: "1:504570577849:web:93021a43e37dbce84d6c68"
});
const messaging = firebase.messaging();
// Sunucudan (GitHub Actions) gelen bildirim, uygulama/tarayıcı kapalıyken burada gösterilir.
// Tıklanınca aşağıdaki mevcut 'notificationclick' dinleyicisi devreye girip uygulamayı açar.
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Arka planda FCM mesajı alındı:', payload);
  const title = (payload.data && payload.data.title) || 'Şantiye Defteri';
  const body = (payload.data && payload.data.body) || '';
  self.registration.showNotification(title, {
    body,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { openEntry: true }
  }).then(() => console.log('[SW] Bildirim gösterildi:', title))
    .catch((err) => console.error('[SW] Bildirim gösterilemedi:', err));
});

const CACHE_NAME = 'santiye-defteri-v5';
const CORE_ASSETS = [
  './', './index.html', './stil.css', './manifest.json', './icon-192.png', './icon-512.png',
  './themes.css', './themes.js', './chess.js', './wordgame.js', './quiz.js', './duel.js'
];

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
  // STALE-WHILE-REVALIDATE: önbellekte varsa HEMEN onu göster (hızlı açılış),
  // aynı anda arka planda internetten taze kopyayı çek ve önbelleği güncelle
  // (bir sonraki açılışta güncel içerik zaten hazır olur). Önbellekte hiç
  // yoksa (ilk ziyaret), internete gitmeyi bekle.
  // { cache: 'no-store' } burada da önemli: arka plan güncellemesinin GERÇEKTEN
  // taze veri çekmesini sağlar, ara HTTP önbelleğine takılmaz.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request, { cache: 'no-store' }).then((response) => {
        cache.put(event.request, response.clone()).catch(()=>{});
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
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
