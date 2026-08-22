// Mevcut TÜM soru bankasındaki şıkları karıştırır (doğru cevap A şıkkında yığılmıştı).
// Soru metni, açıklama, ipucu hiç değişmez — sadece şıkların SIRASI karışır ve
// doğru cevap yeni sıraya göre doğru şekilde takip edilir. Firestore doküman ID'leri
// değişmez, sadece 'options' ve 'correctIndex' alanları güncellenir.
// Güvenle tekrar çalıştırılabilir (her çalıştırmada yeniden karıştırır).

const admin = require('firebase-admin');

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı.');
  process.exit(1);
}
const serviceAccount = JSON.parse(serviceAccountRaw);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function shuffledIndices(n) {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

async function main() {
  const snap = await db.collection('quiz_questions').get();
  console.log('Toplam soru sayısı:', snap.size);

  const docs = snap.docs;
  let updated = 0;
  let skipped = 0;

  // Firestore batch limiti 500 işlemdir, 500'erli parçalara bölüyoruz
  for (let i = 0; i < docs.length; i += 450) {
    const chunk = docs.slice(i, i + 450);
    const batch = db.batch();

    chunk.forEach(doc => {
      const data = doc.data();
      const options = data.options;
      const correctIndex = data.correctIndex;

      if (!Array.isArray(options) || options.length < 2 || typeof correctIndex !== 'number') {
        skipped++;
        return; // beklenmedik yapıdaki soruları dokunmadan atla
      }

      // order[yeniPozisyon] = eskiPozisyon
      const order = shuffledIndices(options.length);
      const newOptions = order.map(oldPos => options[oldPos]);
      const newCorrectIndex = order.indexOf(correctIndex);

      batch.update(doc.ref, { options: newOptions, correctIndex: newCorrectIndex });
      updated++;
    });

    await batch.commit();
    console.log(`  ${Math.min(i + chunk.length, docs.length)}/${docs.length} işlendi...`);
  }

  console.log(`\n✅ ${updated} soru güncellendi (şıklar karıştırıldı).`);
  if (skipped > 0) console.log(`⚠️ ${skipped} soru beklenmedik yapıda olduğu için atlandı.`);

  // Doğrulama: yeni dağılımı göster
  const freshSnap = await db.collection('quiz_questions').get();
  const dist = {};
  freshSnap.docs.forEach(d => {
    const ci = d.data().correctIndex;
    dist[ci] = (dist[ci] || 0) + 1;
  });
  console.log('\nGüncelleme sonrası doğru cevap dağılımı:');
  Object.keys(dist).sort().forEach(k => {
    const letter = ['A', 'B', 'C', 'D', 'E', 'F'][parseInt(k, 10)] || '?';
    console.log(`  ${letter}: ${dist[k]}`);
  });
}

main().then(() => process.exit(0)).catch(e => { console.error('Hata:', e); process.exit(1); });
