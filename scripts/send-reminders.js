// Her gün saat 17:00'de (GitHub Actions cron ile) çalışır.
// O gün "yevmiye" türünde kaydı olmayan ve bildirim adresine (fcmTokens) sahip her
// kullanıcıya "Yevmiye Hatırlatması" bildirimi gönderir. Bir kullanıcıya günde en
// fazla bir kez gönderilir (lastAsked alanı ile takip edilir; bu alan uygulamanın
// kendi ekran-içi hatırlatıcısıyla da paylaşılır, böylece iki taraf birbirini
// tekrar etmez).

const admin = require('firebase-admin');

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı. GitHub Secrets\'a eklendiğinden emin ol.');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountRaw);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Türkiye saati sabit UTC+3'tür (yaz saati uygulaması yoktur).
function nowTurkey() {
  return new Date(Date.now() + 3 * 60 * 60 * 1000);
}
function todayStrTurkey() {
  return nowTurkey().toISOString().slice(0, 10);
}

async function main() {
  const now = nowTurkey();
  const hour = now.getUTCHours();   // Date nesnesini +3 kaydırdığımız için UTC alanları Türkiye saatini verir.
  const minute = now.getUTCMinutes();
  console.log(`Şu an Türkiye saatiyle: ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);

  // GitHub Actions'ın zamanlanmış (cron) görevleri, özellikle az kullanılan depolarda,
  // GitHub'ın kendi yoğunluğuna göre SAATLERCE gecikebiliyor (belgelenmiş, bilinen bir
  // GitHub sınırı — bizim kodumuzdan kaynaklı değil). Bu yüzden iş akışını her 15
  // dakikada bir çalışacak şekilde ayarladık, ama GERÇEK gönderimi SADECE hedeflenen
  // saate (17:00 Türkiye) yakın bir pencerede yapıyoruz. Görev geç başlasa bile,
  // pencerenin dışındaysa hiçbir şey göndermeden sessizce çıkıyor — böylece "sabah
  // erken saatte bildirim gelmesi" bir daha yaşanmaz.
  const TARGET_HOUR = 17;
  const WINDOW_MINUTES = 30; // 17:00–17:29 arası kabul edilir
  const inWindow = (hour === TARGET_HOUR && minute < WINDOW_MINUTES);
  if (!inWindow) {
    console.log(`Hedef pencerenin (17:00–17:${String(WINDOW_MINUTES-1).padStart(2,'0')}) dışında, bildirim gönderilmeyecek. Çıkılıyor.`);
    return;
  }
  const today = todayStrTurkey();
  console.log('Kontrol edilen tarih (Türkiye):', today);

  const usersSnap = await db.collection('users').get();
  console.log('Toplam kullanıcı:', usersSnap.size);

  // Gerçek (yanıltıcı olmayan) sayaçlar: "denendi" ile "gerçekten ulaştı" ayrı tutulur.
  let attempted = 0;          // Bildirim göndermeyi denediğimiz kullanıcı sayısı
  let usersFullySucceeded = 0; // Tüm token'larına başarıyla ulaşan kullanıcı sayısı
  let usersPartialFailure = 0; // Bazı token'ları başarısız olan kullanıcı sayısı
  let usersFullyFailed = 0;    // Hiçbir token'ına ulaşamadığımız kullanıcı sayısı
  let totalTokensSuccess = 0;  // Tüm kullanıcılar genelinde başarılı token gönderimi
  let totalTokensFailure = 0;  // Tüm kullanıcılar genelinde başarısız token gönderimi
  let alreadyHasEntry = 0;
  let alreadyNotifiedToday = 0;
  let noToken = 0;

  for (const doc of usersSnap.docs) {
    const data = doc.data() || {};
    const tokens = Array.isArray(data.fcmTokens) ? data.fcmTokens.filter(Boolean) : [];

    if (tokens.length === 0) { noToken++; continue; }
    if (data.lastAsked === today) { alreadyNotifiedToday++; continue; }

    const entries = Array.isArray(data.entries) ? data.entries : [];
    const hasTodayEntry = entries.some(e => e && e.type === 'yevmiye' && e.date === today);
    if (hasTodayEntry) { alreadyHasEntry++; continue; }

    const username = (data.profile && data.profile.username) || data.username || doc.id;

    const message = {
      tokens,
      data: {
        title: 'Yevmiye Hatırlatması',
        body: 'Bugün için herhangi bir yevmiye girişi yapmadınız. Yevmiyenizi girmek için dokunun.',
        openEntry: 'true'
      },
      webpush: {
        fcmOptions: { link: './index.html' }
      }
    };

    attempted++;

    try {
      const resp = await admin.messaging().sendEachForMulticast(message);

      // sendEachForMulticast'in kendi verdiği successCount/failureCount kullanılıyor —
      // "denedik" ile "gerçekten ulaştı"yı KARIŞTIRMIYORUZ.
      totalTokensSuccess += resp.successCount;
      totalTokensFailure += resp.failureCount;

      console.log(`[${username}] gönderim sonucu: ${resp.successCount} başarılı / ${resp.failureCount} başarısız (toplam ${tokens.length} cihaz)`);

      // Her başarısız token için tam hata kodunu ayrı ayrı logla — hangi kullanıcının
      // hangi cihazında ne sebeple başarısız olduğu net görülsün.
      const invalidTokens = [];
      resp.responses.forEach((r, i) => {
        if (!r.success) {
          const code = (r.error && r.error.code) || 'bilinmeyen-hata';
          const msg = (r.error && r.error.message) || '';
          console.warn(`  ✗ [${username}] token ${tokens[i].slice(0, 12)}… -> ${code} (${msg})`);
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-argument' ||
            code === 'messaging/mismatched-credential' ||
            code === 'messaging/sender-id-mismatch'
          ) {
            invalidTokens.push(tokens[i]);
          }
        } else {
          console.log(`  ✓ [${username}] token ${tokens[i].slice(0, 12)}… -> gönderildi (message id: ${r.messageId})`);
        }
      });

      if (resp.successCount === tokens.length) {
        usersFullySucceeded++;
      } else if (resp.successCount > 0) {
        usersPartialFailure++;
      } else {
        usersFullyFailed++;
      }

      const update = {};
      if (resp.successCount > 0) {
        update.lastAsked = today;
      }
      if (invalidTokens.length > 0) {
        update.fcmTokens = admin.firestore.FieldValue.arrayRemove(...invalidTokens);
        console.log(`  🗑 [${username}] ${invalidTokens.length} geçersiz token Firestore'dan temizlendi`);
      }
      if (Object.keys(update).length > 0) {
        await doc.ref.set(update, { merge: true });
      }
    } catch (e) {
      usersFullyFailed++;
      console.error(`[${username}] BEKLENMEYEN HATA (istek hiç gönderilemedi):`, e.message);
    }
  }

  console.log('');
  console.log('=========== ÖZET ===========');
  console.log('Bildirim denenen kullanıcı sayısı :', attempted);
  console.log('  - Tüm cihazlarına ulaşan        :', usersFullySucceeded);
  console.log('  - Bazı cihazlarına ulaşan        :', usersPartialFailure);
  console.log('  - Hiçbir cihazına ulaşamayan      :', usersFullyFailed);
  console.log('Toplam başarılı token gönderimi    :', totalTokensSuccess);
  console.log('Toplam başarısız token gönderimi   :', totalTokensFailure);
  console.log('Zaten yevmiye girmiş (atlandı)      :', alreadyHasEntry);
  console.log('Bugün zaten bildirilmiş (atlandı)   :', alreadyNotifiedToday);
  console.log('Bildirim adresi (token) olmayan     :', noToken);
  console.log('=============================');
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error('Beklenmeyen hata:', e); process.exit(1); });
