// ============================================================
// BİR KERELİK GÖÇ: Mevcut sorulara "randomOrder" alanı ekle
// ============================================================
// Amaç: Soru çekerken artık tüm havuzu okumak yerine, bu rastgele sayı
// alanına göre sıralayıp sadece istenen kadarını (limit) çekebilmek.
// Bu script SADECE BİR KEZ çalıştırılır — randomOrder alanı olmayan
// (yani daha önce eklenmiş) sorulara bu alanı ekler. Zaten alanı olan
// sorulara (yeni eklenenler) dokunmaz, tekrar tekrar çalıştırmak güvenlidir.
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
  console.log('quiz_questions koleksiyonu okunuyor...');
  const snap = await db.collection('quiz_questions').get();
  console.log('Toplam soru sayısı:', snap.size);

  const needsUpdate = snap.docs.filter(d => typeof d.data().randomOrder !== 'number');
  console.log('randomOrder alanı eksik olan soru sayısı:', needsUpdate.length);

  if (needsUpdate.length === 0) {
    console.log('Tüm sorularda zaten randomOrder alanı var, yapılacak bir şey yok.');
    return;
  }

  // Firestore tek bir batch'te en fazla 500 işlem kabul ediyor, o yüzden
  // 400'erlik gruplar hâlinde (güvenlik payı bırakarak) işliyoruz.
  const CHUNK_SIZE = 400;
  let done = 0;
  for (let i = 0; i < needsUpdate.length; i += CHUNK_SIZE) {
    const chunk = needsUpdate.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();
    chunk.forEach(doc => {
      batch.update(doc.ref, { randomOrder: Math.random() });
    });
    await batch.commit();
    done += chunk.length;
    console.log(`İşlendi: ${done}/${needsUpdate.length}`);
  }

  console.log(`✅ Tamamlandı — ${needsUpdate.length} soruya randomOrder alanı eklendi.`);
}

main().then(() => process.exit(0)).catch(e => {
  console.error('Hata:', e);
  process.exit(1);
});
