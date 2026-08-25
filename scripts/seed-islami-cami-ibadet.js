// Soru havuzunu Firestore'a TEK SEFERLİK yükler (workflow_dispatch ile elle çalıştırılır).
// Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar eklenmez, güvenle tekrar çalıştırılabilir.
// Bu parti: DUALAR, CAMİLER/MESCİTLER, EK İSLAM TARİHİ konulu yeni sorular.
// Önceki tüm partilerle (1427+ mevcut soru) çakışmaması için kontrol edilmiştir.

const admin = require('firebase-admin');

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı.');
  process.exit(1);
}
const serviceAccount = JSON.parse(serviceAccountRaw);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// --- ZATEN TAMAMLANDIYSA ATLA (otomatik eklendi) ---
async function __checkAlreadySeeded() {
  const __scriptName = require('path').basename(__filename);
  try {
    const __marker = await db.collection('app_config').doc('seedScriptStatus').get();
    return !!(__marker.exists && __marker.data()[__scriptName]);
  } catch (e) {
    console.error('Tamamlanma kontrolü yapılamadı, script normal devam edecek:', e.message);
    return false;
  }
}


const islamiCamiTarih = [
  {
    question: "İslam'da en kutsal kabul edilen, içinde Kabe'nin bulunduğu mescid hangisidir?",
    options: [
      "Mescid-i Haram",
      "Mescid-i Nebevi",
      "Mescid-i Aksa",
      "Kuba Mescidi"
    ],
    correctIndex: 0,
    hint: "Mekke'de bulunur.",
    explanation: "İslam'da en kutsal mescid, Kabe'yi içine alan Mescid-i Haram'dır."
  },
  {
    question: "Hz. Peygamber'in kabrinin de bulunduğu, Medine'deki mescid hangisidir?",
    options: [
      "Mescid-i Haram",
      "Mescid-i Nebevi",
      "Mescid-i Aksa",
      "Kuba Mescidi"
    ],
    correctIndex: 1,
    hint: "Hz. Peygamber'in inşa ettirdiği ilk mesciddir.",
    explanation: "Medine'de bulunan ve Hz. Peygamber'in kabrinin de yer aldığı mescid Mescid-i Nebevi'dir."
  },
  {
    question: "Kudüs'te bulunan ve İslam'ın üç kutsal mescidinden biri sayılan mescid hangisidir?",
    options: [
      "Mescid-i Haram",
      "Mescid-i Nebevi",
      "Mescid-i Aksa",
      "Kuba Mescidi"
    ],
    correctIndex: 2,
    hint: "Miraç yolculuğunda Hz. Peygamber'in uğradığı yerdir.",
    explanation: "Kudüs'teki kutsal mescid Mescid-i Aksa'dır."
  },
  {
    question: "İslam tarihinde inşa edilen ilk mescid hangisidir?",
    options: [
      "Mescid-i Haram",
      "Mescid-i Nebevi",
      "Mescid-i Aksa",
      "Kuba Mescidi"
    ],
    correctIndex: 3,
    hint: "Hicret yolculuğu sırasında, Medine yakınlarında inşa edilmiştir.",
    explanation: "İslam tarihinde inşa edilen ilk mescid Kuba Mescidi'dir."
  },
  {
    question: "İstanbul'da Mimar Sinan'ın en önemli eserlerinden biri olan cami hangisidir?",
    options: [
      "Süleymaniye Camii",
      "Sultanahmet Camii",
      "Fatih Camii",
      "Eyüp Sultan Camii"
    ],
    correctIndex: 0,
    hint: "Kanuni Sultan Süleyman adına yapılmıştır.",
    explanation: "Mimar Sinan'ın önemli eserlerinden biri Süleymaniye Camii'dir."
  },
  {
    question: "İstanbul'da 'Mavi Cami' olarak da bilinen, altı minareli cami hangisidir?",
    options: [
      "Süleymaniye Camii",
      "Sultanahmet Camii",
      "Fatih Camii",
      "Yeni Camii"
    ],
    correctIndex: 1,
    hint: "İç duvarlarındaki mavi çinilerden dolayı bu isimle anılır.",
    explanation: "'Mavi Cami' olarak bilinen altı minareli cami Sultanahmet Camii'dir."
  },
  {
    question: "Camilerde ezan okunan, genellikle yüksek ve ince kulelere ne ad verilir?",
    options: [
      "Kubbe",
      "Şadırvan",
      "Minare",
      "Minber"
    ],
    correctIndex: 2,
    hint: "Müezzin buradan ezan okur.",
    explanation: "Camilerde ezan okunan yüksek kulelere minare denir."
  },
  {
    question: "Camilerde imamın hutbe okuduğu, merdivenli yüksek kürsüye ne ad verilir?",
    options: [
      "Minare",
      "Mihrap",
      "Şadırvan",
      "Minber"
    ],
    correctIndex: 3,
    hint: "Cuma hutbeleri buradan verilir.",
    explanation: "İmamın hutbe okuduğu yüksek kürsüye minber denir."
  },
  {
    question: "Camilerde kıble yönünü gösteren, duvarda bulunan girintili bölmeye ne ad verilir?",
    options: [
      "Mihrap",
      "Minber",
      "Kürsü",
      "Şadırvan"
    ],
    correctIndex: 0,
    hint: "İmam namazı burada kıldırır.",
    explanation: "Kıble yönünü gösteren girintili bölmeye mihrap denir."
  },
  {
    question: "Camilerin avlusunda bulunan, abdest almak için kullanılan su kaynağına ne ad verilir?",
    options: [
      "Mihrap",
      "Şadırvan",
      "Minber",
      "Kürsü"
    ],
    correctIndex: 1,
    hint: "Genellikle merkezi bir yapı olarak avluda bulunur.",
    explanation: "Camilerde abdest almak için kullanılan yapıya şadırvan denir."
  },
  {
    question: "Hz. Peygamber'in amcası olup İslam'ı kabul etmeyen ve Kur'an'da adı geçen kişi kimdir?",
    options: [
      "Ebu Talib",
      "Hamza",
      "Ebu Leheb",
      "Abbas"
    ],
    correctIndex: 2,
    hint: "Tebbet suresinde kendisinden bahsedilir.",
    explanation: "Kur'an'da (Tebbet suresi) adı geçen ve İslam'a karşı çıkan amca Ebu Leheb'dir."
  },
  {
    question: "Hz. Peygamber'i himaye eden, kendisi Müslüman olmasa da onu koruyan amcası kimdir?",
    options: [
      "Ebu Leheb",
      "Hamza",
      "Abbas",
      "Ebu Talib"
    ],
    correctIndex: 3,
    hint: "Hz. Ali'nin de babasıdır.",
    explanation: "Hz. Peygamber'i koruyan ancak Müslüman olmayan amcası Ebu Talib'tir."
  },
  {
    question: "Habeşistan'a hicret eden ilk Müslüman kafileye kim önderlik etmiştir (bilinen isimlerden biri)?",
    options: [
      "Ca'fer b. Ebi Talib",
      "Hz. Osman",
      "Hz. Ömer",
      "Hz. Ali"
    ],
    correctIndex: 0,
    hint: "Hz. Ali'nin kardeşidir.",
    explanation: "Habeşistan'a hicret eden kafilede öne çıkan isimlerden biri Ca'fer b. Ebi Talib'dir."
  },
  {
    question: "Habeşistan Necaşisi'nin Müslümanlara sağladığı korumaya karşılık, İslam tarihinde bu ülkeye yapılan göçe ne ad verilir?",
    options: [
      "Büyük Hicret",
      "Küçük Hicret (Habeşistan Hicreti)",
      "Taif Yolculuğu",
      "Miraç"
    ],
    correctIndex: 1,
    hint: "Medine'ye hicretten önce gerçekleşmiştir.",
    explanation: "Müslümanların Habeşistan'a yaptığı göçe Habeşistan Hicreti (Küçük Hicret) denir."
  },
  {
    question: "Hz. Peygamber'in İslam'ı tebliğ etmek için gittiği ancak halkı tarafından taşlanarak kovulduğu şehir hangisidir?",
    options: [
      "Medine",
      "Şam",
      "Taif",
      "Yemen"
    ],
    correctIndex: 2,
    hint: "Mekke'ye yakın bir şehirdir.",
    explanation: "Hz. Peygamber'in tebliğ için gittiği ancak kötü karşılandığı şehir Taif'tir."
  },
  {
    question: "Mekke müşrikleriyle Müslümanlar arasında 10 yıllığına barış öngören, ancak sonradan Mekke'nin fethine zemin hazırlayan antlaşma hangisidir?",
    options: [
      "Medine Vesikası",
      "Akabe Biati",
      "Veda Haccı Antlaşması",
      "Hudeybiye Antlaşması"
    ],
    correctIndex: 3,
    hint: "Bir umre girişimi sırasında yapılmıştır.",
    explanation: "Mekke ile yapılan barış antlaşması Hudeybiye Antlaşması'dır."
  },
  {
    question: "Medineli Müslümanların, Hz. Peygamber'e hicretten önce Akabe'de verdiği bağlılık sözüne ne ad verilir?",
    options: [
      "Akabe Biati",
      "Hudeybiye Antlaşması",
      "Medine Vesikası",
      "Rıdvan Biati"
    ],
    correctIndex: 0,
    hint: "Hicretin önünü açan önemli bir gelişmedir.",
    explanation: "Medinelilerin Hz. Peygamber'e verdiği bu söze Akabe Biati denir."
  },
  {
    question: "Hz. Peygamber'in vefatından sonra peygamberlik iddiasında bulunan yalancılara karşı yapılan savaşlara ne ad verilir?",
    options: [
      "Cihat Savaşları",
      "Ridde Savaşları",
      "Fetih Savaşları",
      "İrtidat Muharebeleri"
    ],
    correctIndex: 1,
    hint: "Hz. Ebu Bekir döneminde gerçekleşmiştir.",
    explanation: "Sahte peygamberlere ve dinden dönenlere karşı yapılan savaşlara Ridde Savaşları denir."
  },
  {
    question: "Emeviler Devleti'nin başkenti neresidir?",
    options: [
      "Bağdat",
      "Kahire",
      "Şam",
      "Medine"
    ],
    correctIndex: 2,
    hint: "Bugünkü Suriye'nin başkentidir.",
    explanation: "Emeviler Devleti'nin başkenti Şam'dır."
  },
  {
    question: "Abbasiler Devleti'nin başkenti neresidir?",
    options: [
      "Şam",
      "Kahire",
      "İstanbul",
      "Bağdat"
    ],
    correctIndex: 3,
    hint: "Bugünkü Irak'ın başkentidir.",
    explanation: "Abbasiler Devleti'nin başkenti Bağdat'tır."
  },
  {
    question: "Sabah namazının farzı kaç rekattır?",
    options: [
      "2",
      "3",
      "4",
      "1"
    ],
    correctIndex: 0,
    hint: "Günün ilk vakit namazıdır.",
    explanation: "Sabah namazının farzı 2 rekattır."
  },
  {
    question: "Öğle namazının farzı kaç rekattır?",
    options: [
      "2",
      "4",
      "3",
      "6"
    ],
    correctIndex: 1,
    hint: "Günün en çok rekatlı vakit namazlarından biridir.",
    explanation: "Öğle namazının farzı 4 rekattır."
  },
  {
    question: "Akşam namazının farzı kaç rekattır?",
    options: [
      "2",
      "4",
      "3",
      "5"
    ],
    correctIndex: 2,
    hint: "Güneş battıktan hemen sonra kılınır.",
    explanation: "Akşam namazının farzı 3 rekattır."
  },
  {
    question: "Namazda rükudan doğrulduktan sonra söylenen 'Semi Allahu limen hamideh' sözünün ardından hangi ifade söylenir?",
    options: [
      "Sübhane Rabbiyel Azim",
      "Sübhane Rabbiyel A'la",
      "Allahu Ekber",
      "Rabbena lekel hamd"
    ],
    correctIndex: 3,
    hint: "'Rabbimiz, hamd sanadır' anlamına gelir.",
    explanation: "'Semi Allahu limen hamideh' sözünün ardından 'Rabbena lekel hamd' denir."
  },
  {
    question: "Namazın vacip olması için gereken şartlardan biri hangisidir?",
    options: [
      "Akıl baliğ olmak (ergen ve akıllı olmak)",
      "Zengin olmak",
      "Evli olmak",
      "Yolculukta olmamak"
    ],
    correctIndex: 0,
    hint: "Çocuklar ve akıl hastaları bu yükümlülükten muaftır.",
    explanation: "Namazın farz olması için akıl baliğ (ergenlik çağına gelmiş ve akıllı) olmak gerekir."
  },
  {
    question: "Namazı bozan durumlardan biri değildir?",
    options: [
      "Konuşmak",
      "Secdede fazla durmak",
      "Gülmek (sesli)",
      "Yemek yemek"
    ],
    correctIndex: 1,
    hint: "Secdede uzun süre kalmak namazı bozmaz, tam tersine tavsiye edilir.",
    explanation: "Secdede fazla durmak namazı bozmaz; konuşmak, sesli gülmek ve yemek yemek ise namazı bozar."
  },
  {
    question: "İki namazın (öğle-ikindi veya akşam-yatsı gibi) bir vakitte birleştirilerek kılınmasına ne ad verilir?",
    options: [
      "Kasr",
      "Sehiv",
      "Cem",
      "Kaza"
    ],
    correctIndex: 2,
    hint: "Özellikle yolculuk veya hac sırasında uygulanır.",
    explanation: "İki namazın birleştirilerek kılınmasına cem denir."
  },
  {
    question: "Yolculuk halindeyken dört rekatlı farz namazların kısaltılarak iki rekat kılınmasına ne ad verilir?",
    options: [
      "Cem",
      "Sehiv",
      "Nafile",
      "Kasr"
    ],
    correctIndex: 3,
    hint: "Sadece 4 rekatlı farzlar için geçerlidir.",
    explanation: "Yolculukta namazın kısaltılmasına kasr denir."
  },
  {
    question: "Namazda yanlışlıkla bir şey unutulduğunda, namazın sonunda yapılan secdeye ne ad verilir?",
    options: [
      "Secde-i Sehiv",
      "Secde-i Tilavet",
      "Secde-i Şükür",
      "Secde-i Rahman"
    ],
    correctIndex: 0,
    hint: "'Sehiv' kelimesi 'unutma, yanılma' anlamına gelir.",
    explanation: "Namazda unutma durumunda yapılan secdeye secde-i sehiv denir."
  },
  {
    question: "Kur'an okurken secde ayetine gelindiğinde yapılan secdeye ne ad verilir?",
    options: [
      "Secde-i Sehiv",
      "Secde-i Tilavet",
      "Secde-i Şükür",
      "Secde-i Rahman"
    ],
    correctIndex: 1,
    hint: "Kur'an'da belirli ayetlerin sonunda yapılır.",
    explanation: "Kur'an okurken secde ayetinde yapılan secdeye secde-i tilavet denir."
  }
];

async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question||'').trim()));

  const toAdd = [];
  islamiCamiTarih.forEach(q => {
    if(!existingTexts.has(q.question.trim())) toAdd.push(Object.assign({category:'islami'}, q));
  });

  console.log('Toplam hazırlanan soru:', islamiCamiTarih.length);
  console.log('Zaten var olan (atlanan):', islamiCamiTarih.length - toAdd.length);
  console.log('Yeni eklenecek:', toAdd.length);

  if(toAdd.length === 0){ console.log('Eklenecek yeni soru yok.'); return; }

  for (let i = 0; i < toAdd.length; i += 450) {
    const chunk = toAdd.slice(i, i + 450);
    const batch = db.batch();
    chunk.forEach(q => {
      const ref = db.collection('quiz_questions').doc();
      batch.set(ref, q);
    });
    await batch.commit();
    console.log(`  ${Math.min(i + chunk.length, toAdd.length)}/${toAdd.length} yüklendi...`);
  }

  console.log(`\n✅ ${toAdd.length} yeni İslami soru eklendi.`);
  const dist = {0:0,1:0,2:0,3:0};
  toAdd.forEach(q => { dist[q.correctIndex] = (dist[q.correctIndex]||0)+1; });
  console.log('Bu partideki doğru cevap dağılımı:', dist);
}

__checkAlreadySeeded().then(async (alreadyDone) => {
  const __scriptName = require('path').basename(__filename);
  if (alreadyDone) { console.log(`${__scriptName} zaten daha önce tamamlanmış, atlanıyor.`); process.exit(0); return; }
  await main();
  await db.collection('app_config').doc('seedScriptStatus').set({ [require('path').basename(__filename)]: true }, { merge: true }).catch(()=>{});
  process.exit(0);
}).catch(e=>{ console.error('Hata:', e); process.exit(1); });
