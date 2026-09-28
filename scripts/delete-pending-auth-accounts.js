// ============================================================
// BEKLEYEN GİRİŞ HESABI (AUTHENTICATION) SİLMELERİNİ TAMAMLA
// ============================================================
// Amaç: Admin panelinden "Kalıcı Olarak Sil" yapıldığında, tarayıcı sadece
// Firestore verisini silebiliyor (users, public_profiles, arkadaşlıklar).
// Kişinin GERÇEK giriş hesabı (e-posta/şifre, Firebase Authentication kaydı)
// tarayıcıdan silinemez — bunu ancak bu script (sunucu tarafı / Admin SDK)
// yapabilir. Admin panelinden silme yapıldığında bir "pending_auth_deletions"
// kaydı bırakılıyor; bu script o kuyruğu okuyup gerçek giriş hesabını da
// siliyor, sonra kuyruk kaydını temizliyor.
//
// GitHub Actions'tan elle tetiklenir ("Run workflow"), tıpkı
// add-random-order.js gibi. Zaten silinmiş/kuyrukta olmayan hesaplara
// dokunmaz, tekrar tekrar çalıştırmak güvenlidir.
// ============================================================

const admin = require('firebase-admin');

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı.');
  process.exit(1);
}
const serviceAccount = JSON.parse(serviceAccountRaw);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  console.log('pending_auth_deletions kuyruğu okunuyor...');
  const snap = await db.collection('pending_auth_deletions').get();
  console.log('Bekleyen silme sayısı:', snap.size);

  if (snap.empty) {
    console.log('Bekleyen bir şey yok, yapılacak iş bulunmuyor.');
    return;
  }

  let deleted = 0, alreadyGone = 0, failed = 0;

  for (const doc of snap.docs) {
    const uid = doc.id;
    const data = doc.data();
    const label = data.username ? `${uid} (${data.username})` : uid;
    try {
      await admin.auth().deleteUser(uid);
      console.log(`✅ Giriş hesabı silindi: ${label}`);
      deleted++;
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log(`⏭️  Zaten yok (muhtemelen daha önce silinmiş): ${label}`);
        alreadyGone++;
      } else {
        console.error(`❌ Silinemedi: ${label} — ${e.message}`);
        failed++;
        continue; // Başarısız olanın kuyruk kaydını SİLME, bir sonraki çalıştırmada tekrar denensin.
      }
    }
    // Başarılı ya da zaten yoksa, kuyruktan çıkar.
    await doc.ref.delete();
  }

  console.log(`\n--- ÖZET ---`);
  console.log(`Silinen: ${deleted}`);
  console.log(`Zaten yoktu: ${alreadyGone}`);
  console.log(`Başarısız (kuyrukta bırakıldı, tekrar denenecek): ${failed}`);
}

main().then(() => process.exit(0)).catch(e => {
  console.error('Hata:', e);
  process.exit(1);
});
