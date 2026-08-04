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
function todayStrTurkey() {
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

async function main() {
  const today = todayStrTurkey();
  console.log('Kontrol edilen tarih (Türkiye):', today);

  const usersSnap = await db.collection('users').get();
  console.log('Toplam kullanıcı:', usersSnap.size);

  let sent = 0;
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

    try {
      const resp = await admin.messaging().sendEachForMulticast(message);
      sent++;

      // Artık geçersiz olan (uygulama kaldırılmış, izin geri alınmış vb.) tokenleri temizle.
      const invalidTokens = [];
      resp.responses.forEach((r, i) => {
        if (!r.success) {
          const code = r.error && r.error.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(tokens[i]);
          }
        }
      });

      const update = { lastAsked: today };
      if (invalidTokens.length > 0) {
        update.fcmTokens = admin.firestore.FieldValue.arrayRemove(...invalidTokens);
      }
      await doc.ref.set(update, { merge: true });
    } catch (e) {
      console.error('Gönderim hatası:', doc.id, e.message);
    }
  }

  console.log('--- Özet ---');
  console.log('Bildirim gönderilen:', sent);
  console.log('Zaten yevmiye girmiş:', alreadyHasEntry);
  console.log('Bugün zaten bildirilmiş:', alreadyNotifiedToday);
  console.log('Bildirim adresi (token) olmayan:', noToken);
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error('Beklenmeyen hata:', e); process.exit(1); });
