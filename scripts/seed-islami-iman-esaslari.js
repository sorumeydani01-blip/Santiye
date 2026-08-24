// Soru havuzunu Firestore'a TEK SEFERLİK yükler (workflow_dispatch ile elle çalıştırılır).
// Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar eklenmez, güvenle tekrar çalıştırılabilir.
// Bu parti: İMAN ESASLARI (melekler, kutsal kitaplar, kader/kaza) konulu yeni İslami sorular.
// Önceki tüm partilerle (1427 mevcut soru) çakışmaması için kontrol edilmiştir.

const admin = require('firebase-admin');

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı.');
  process.exit(1);
}
const serviceAccount = JSON.parse(serviceAccountRaw);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const islamiImanEsaslari = [
  {
    question: "İslam inancına göre meleklerin reisi kabul edilen ve vahiy getirmekle görevli melek kimdir?",
    options: [
      "Cebrail",
      "Mikail",
      "İsrafil",
      "Azrail"
    ],
    correctIndex: 0,
    hint: "Peygamberlere Allah'ın emirlerini iletir.",
    explanation: "Vahiy getirmekle görevli ve meleklerin reisi kabul edilen melek Cebrail'dir (a.s.)."
  },
  {
    question: "Doğa olaylarını, yağmurun yağmasını ve rızıkların dağıtımını düzenlemekle görevli melek kimdir?",
    options: [
      "Cebrail",
      "Mikail",
      "İsrafil",
      "Azrail"
    ],
    correctIndex: 1,
    hint: "Bitkilerin yeşermesiyle de ilişkilendirilir.",
    explanation: "Doğa olayları ve rızıkla ilgili görevli melek Mikail'dir (a.s.)."
  },
  {
    question: "Kıyametin kopması ve yeniden dirilişin habercisi olan, Sur'a üfleyecek melek kimdir?",
    options: [
      "Cebrail",
      "Mikail",
      "İsrafil",
      "Azrail"
    ],
    correctIndex: 2,
    hint: "İki kez üfleyeceği rivayet edilir.",
    explanation: "Sur'a üfleme görevi İsrafil'e (a.s.) aittir."
  },
  {
    question: "Can almakla görevli melek kimdir?",
    options: [
      "Cebrail",
      "Mikail",
      "İsrafil",
      "Azrail"
    ],
    correctIndex: 3,
    hint: "'Ölüm meleği' olarak bilinir.",
    explanation: "Can almakla görevli melek Azrail'dir (a.s.)."
  },
  {
    question: "İnsanın sağında ve solunda bulunup yaptığı iyi ve kötü amelleri kaydeden meleklere ne ad verilir?",
    options: [
      "Kiramen Katibin",
      "Münker ve Nekir",
      "Hafaza melekleri",
      "Mukarrebin"
    ],
    correctIndex: 0,
    hint: "'Değerli yazıcılar' anlamına gelir.",
    explanation: "İnsanın amellerini kaydeden meleklere Kiramen Katibin denir."
  },
  {
    question: "Kabirde ölen kişiye sorular soracağına inanılan iki melek kimlerdir?",
    options: [
      "Kiramen Katibin",
      "Münker ve Nekir",
      "Hafaza melekleri",
      "Ridvan ve Malik"
    ],
    correctIndex: 1,
    hint: "Kabir sorgusuyla ilişkilendirilirler.",
    explanation: "Kabirde sorgu ile ilişkilendirilen iki melek Münker ve Nekir'dir."
  },
  {
    question: "İslam inancına göre melekler hangi maddeden yaratılmıştır?",
    options: [
      "Ateşten",
      "Topraktan",
      "Nurdan",
      "Sudan"
    ],
    correctIndex: 2,
    hint: "Cinler ateşten, insan topraktan yaratılmıştır.",
    explanation: "İslam inancına göre melekler nurdan (ışıktan) yaratılmıştır."
  },
  {
    question: "Meleklerin temel özelliklerinden biri aşağıdakilerden hangisidir?",
    options: [
      "Yerler ve içerler",
      "Evlenip çoğalırlar",
      "Uyurlar",
      "Allah'a asla isyan etmezler"
    ],
    correctIndex: 3,
    hint: "Emredildikleri her şeyi eksiksiz yaparlar.",
    explanation: "Meleklerin temel özelliklerinden biri Allah'a asla isyan etmemeleridir."
  },
  {
    question: "İnsanı sürekli koruyan, kaza ve belalardan Allah'ın izniyle koruyan meleklere ne denir?",
    options: [
      "Hafaza melekleri",
      "Kiramen Katibin",
      "Mukarrebin",
      "Kerrubiyyun"
    ],
    correctIndex: 0,
    hint: "'Koruyucu melekler' anlamına gelir.",
    explanation: "İnsanı koruyan meleklere hafaza melekleri denir."
  },
  {
    question: "Cennetle görevli melek kimdir (rivayetlere göre)?",
    options: [
      "Malik",
      "Ridvan",
      "Cebrail",
      "Mikail"
    ],
    correctIndex: 1,
    hint: "Cennetin kapıcısı olarak bilinir.",
    explanation: "Rivayetlere göre cennetle görevli melek Ridvan'dır."
  },
  {
    question: "Cehennemle görevli melek kimdir (rivayetlere göre)?",
    options: [
      "Ridvan",
      "İsrafil",
      "Malik",
      "Mikail"
    ],
    correctIndex: 2,
    hint: "Cehennemin bekçisi olarak bilinir.",
    explanation: "Rivayetlere göre cehennemle görevli melek Malik'tir."
  },
  {
    question: "İslam inancına göre kaç büyük kutsal kitap indirilmiştir?",
    options: [
      "3",
      "5",
      "6",
      "4"
    ],
    correctIndex: 3,
    hint: "Tevrat, Zebur, İncil ve Kur'an.",
    explanation: "İslam inancına göre 4 büyük kitap indirilmiştir: Tevrat, Zebur, İncil ve Kur'an-ı Kerim."
  },
  {
    question: "Hz. Musa'ya (a.s.) indirilen kutsal kitap hangisidir?",
    options: [
      "Tevrat",
      "Zebur",
      "İncil",
      "Suhuf"
    ],
    correctIndex: 0,
    hint: "Yahudilikte kutsal kabul edilen kitaptır.",
    explanation: "Hz. Musa'ya (a.s.) indirilen kutsal kitap Tevrat'tır."
  },
  {
    question: "Hz. Davud'a (a.s.) indirilen kutsal kitap hangisidir?",
    options: [
      "Tevrat",
      "Zebur",
      "İncil",
      "Kur'an"
    ],
    correctIndex: 1,
    hint: "Mezmurlar da denir.",
    explanation: "Hz. Davud'a (a.s.) indirilen kutsal kitap Zebur'dur."
  },
  {
    question: "Hz. İsa'ya (a.s.) indirilen kutsal kitap hangisidir?",
    options: [
      "Tevrat",
      "Zebur",
      "İncil",
      "Furkan"
    ],
    correctIndex: 2,
    hint: "Hristiyanlıkta kutsal kabul edilen kitaptır.",
    explanation: "Hz. İsa'ya (a.s.) indirilen kutsal kitap İncil'dir."
  },
  {
    question: "Bazı peygamberlere (Hz. İbrahim ve Hz. Musa gibi) indirilen küçük kutsal sayfalara ne ad verilir?",
    options: [
      "Zebur",
      "Furkan",
      "Mesel",
      "Suhuf"
    ],
    correctIndex: 3,
    hint: "'Sayfalar' anlamına gelir.",
    explanation: "Bazı peygamberlere indirilen küçük kutsal sayfalara Suhuf denir."
  },
  {
    question: "Kur'an-ı Kerim'in isimlerinden biri olan ve 'hakkı batıldan ayıran' anlamına gelen kelime hangisidir?",
    options: [
      "Furkan",
      "Zikir",
      "Beyan",
      "Nur"
    ],
    correctIndex: 0,
    hint: "Aynı zamanda bir sure adıdır.",
    explanation: "'Hakkı batıldan ayıran' anlamına gelen ve Kur'an'ın isimlerinden biri olan kelime Furkan'dır."
  },
  {
    question: "İslam inancına göre önceki kutsal kitaplardan hangisi hiç değiştirilmeden korunmuştur?",
    options: [
      "Tevrat",
      "Kur'an-ı Kerim",
      "İncil",
      "Zebur"
    ],
    correctIndex: 1,
    hint: "Allah'ın koruma vaadi bu kitaba özgüdür.",
    explanation: "İslam inancına göre değiştirilmeden korunan tek kitap Kur'an-ı Kerim'dir."
  },
  {
    question: "Allah'ın olacak her şeyi ezelden bilmesine ne denir?",
    options: [
      "Kaza",
      "Tevekkül",
      "Kader",
      "İrade"
    ],
    correctIndex: 2,
    hint: "'Ölçü, takdir' anlamına gelir.",
    explanation: "Allah'ın olacak her şeyi ezelden bilip takdir etmesine kader denir."
  },
  {
    question: "Allah'ın ezelde takdir ettiği şeylerin zamanı gelince gerçekleşmesine ne denir?",
    options: [
      "Kader",
      "Tevekkül",
      "Sabır",
      "Kaza"
    ],
    correctIndex: 3,
    hint: "Kaderin fiiliyata geçmesidir.",
    explanation: "Takdir edilen şeylerin gerçekleşmesine kaza denir."
  },
  {
    question: "İmanın şartlarından biri olan kader inancı, insanın hangi kavramla dengelendiği kabul edilir?",
    options: [
      "İrade-i cüz'iyye (cüzi irade/tercih hakkı)",
      "Cebir (zorunluluk)",
      "Şirk",
      "Nifak"
    ],
    correctIndex: 0,
    hint: "İnsanın kendi tercihleriyle sorumlu tutulmasını sağlayan kavramdır.",
    explanation: "İslam'da kader inancı, insanın cüzi iradesiyle (kendi tercih hakkıyla) dengelenir; insan sorumluluğunu ortadan kaldırmaz."
  },
  {
    question: "Hz. Peygamber'in ilk vahiy geldiğinde onu teselli eden ve ilk inanan eşi kimdir?",
    options: [
      "Hz. Ayşe",
      "Hz. Hatice",
      "Hz. Hafsa",
      "Hz. Zeyneb"
    ],
    correctIndex: 1,
    hint: "İlk vahiy sırasında büyük destek olmuştur.",
    explanation: "İlk vahiy geldiğinde Hz. Peygamber'i teselli eden eşi Hz. Hatice'dir (r.a.)."
  },
  {
    question: "Hz. Peygamber'in en genç yaşta evlendiği, birçok hadis rivayet eden eşi kimdir?",
    options: [
      "Hz. Hatice",
      "Hz. Safiye",
      "Hz. Ayşe",
      "Hz. Meymune"
    ],
    correctIndex: 2,
    hint: "Hz. Ebu Bekir'in kızıdır.",
    explanation: "Hz. Peygamber'in genç yaşta evlendiği ve çokça hadis rivayet eden eşi Hz. Ayşe'dir (r.a.)."
  },
  {
    question: "Hz. Ömer'in kızı olan ve Hz. Peygamber'in eşlerinden biri olan sahabe kimdir?",
    options: [
      "Hz. Ümmü Seleme",
      "Hz. Cüveyriye",
      "Hz. Ümmü Habibe",
      "Hz. Hafsa"
    ],
    correctIndex: 3,
    hint: "Kur'an'ın ilk nüshasının koruyucusu olmuştur.",
    explanation: "Hz. Ömer'in kızı ve Hz. Peygamber'in eşlerinden biri Hz. Hafsa'dır (r.a.)."
  },
  {
    question: "İslam'da ilk şehit olan kadın sahabe kimdir?",
    options: [
      "Hz. Sümeyye",
      "Hz. Hatice",
      "Hz. Fatıma",
      "Hz. Zeyneb"
    ],
    correctIndex: 0,
    hint: "Mekke döneminde işkence sonucu şehit edilmiştir.",
    explanation: "İslam'da ilk şehit olan kişi, kadın sahabe Hz. Sümeyye'dir (r.a.)."
  },
  {
    question: "Uhud Savaşı'nda Hz. Peygamber'i canını hiçe sayarak koruyan kadın sahabe kimdir?",
    options: [
      "Hz. Sümeyye",
      "Hz. Nesibe (Ümmü Umare)",
      "Hz. Hafsa",
      "Hz. Safiye"
    ],
    correctIndex: 1,
    hint: "Savaş meydanında kılıç kullanarak savunma yapmıştır.",
    explanation: "Uhud Savaşı'nda Hz. Peygamber'i koruyan kadın sahabe Hz. Nesibe'dir (Ümmü Umare)."
  },
  {
    question: "Sünni İslam'da fıkıhta kabul edilen dört mezhepten biri değildir?",
    options: [
      "Hanefi",
      "Şafii",
      "Caferi",
      "Maliki"
    ],
    correctIndex: 2,
    hint: "Caferi, Şii fıkhında öne çıkan bir mezheptir.",
    explanation: "Sünni fıkhında dört mezhep Hanefi, Şafii, Maliki ve Hanbeli'dir; Caferi bunlardan biri değildir."
  },
  {
    question: "Hanefi mezhebinin kurucusu kabul edilen imam kimdir?",
    options: [
      "İmam Şafii",
      "İmam Malik",
      "Ahmed b. Hanbel",
      "İmam-ı Azam Ebu Hanife"
    ],
    correctIndex: 3,
    hint: "Türkiye'de en yaygın uygulanan mezheptir.",
    explanation: "Hanefi mezhebinin kurucusu İmam-ı Azam Ebu Hanife'dir."
  },
  {
    question: "Türkiye'de yaygın olarak uygulanan itikadi (inanç) mezhep hangisidir?",
    options: [
      "Maturidiyye",
      "Mu'tezile",
      "Eş'ariyye",
      "Selefiyye"
    ],
    correctIndex: 0,
    hint: "İmam Maturidi'ye nispet edilir.",
    explanation: "Türkiye'de yaygın itikadi mezhep Maturidiyye'dir."
  },
  {
    question: "Kütüb-i Sitte (altı hadis kitabı) içinde en sahih kabul edilen eser kime aittir?",
    options: [
      "İmam Müslim",
      "İmam Buhari",
      "İmam Tirmizi",
      "İmam Nesai"
    ],
    correctIndex: 1,
    hint: "'Sahih-i Buhari' adıyla bilinir.",
    explanation: "Kütüb-i Sitte içinde en sahih kabul edilen eser İmam Buhari'nin 'Sahih-i Buhari' adlı eseridir."
  },
  {
    question: "Cebir biliminin kurucusu kabul edilen, Harezm bölgesinden gelen Müslüman bilgin kimdir?",
    options: [
      "İbn-i Sina",
      "Farabi",
      "Harezmi",
      "Biruni"
    ],
    correctIndex: 2,
    hint: "'Algoritma' kelimesi onun adından türemiştir.",
    explanation: "Cebir biliminin kurucusu kabul edilen bilgin Harezmi'dir."
  },
  {
    question: "Tıp alanındaki 'El-Kanun fi't-Tıb' adlı eseriyle yüzyıllarca Avrupa'da ders kitabı olarak okutulan Müslüman bilgin kimdir?",
    options: [
      "Harezmi",
      "Farabi",
      "İbn-i Rüşd",
      "İbn-i Sina"
    ],
    correctIndex: 3,
    hint: "Batı dünyasında 'Avicenna' olarak bilinir.",
    explanation: "'El-Kanun fi't-Tıb' adlı önemli tıp eserinin yazarı İbn-i Sina'dır."
  },
  {
    question: "'Muallim-i Sani' (İkinci Öğretmen) unvanıyla bilinen, felsefe alanında önemli eserler veren Müslüman bilgin kimdir?",
    options: [
      "Farabi",
      "Biruni",
      "İbn-i Haldun",
      "Gazali"
    ],
    correctIndex: 0,
    hint: "Aristoteles'ten sonra ikinci öğretmen sayılmıştır.",
    explanation: "'Muallim-i Sani' unvanıyla bilinen bilgin Farabi'dir."
  },
  {
    question: "Sosyoloji biliminin öncülerinden sayılan, 'Mukaddime' adlı eseriyle tanınan Müslüman düşünür kimdir?",
    options: [
      "İbn-i Sina",
      "İbn-i Haldun",
      "Gazali",
      "Biruni"
    ],
    correctIndex: 1,
    hint: "Toplumların gelişim ve çöküşünü incelemiştir.",
    explanation: "'Mukaddime' adlı eseriyle tanınan ve sosyolojinin öncülerinden sayılan düşünür İbn-i Haldun'dur."
  },
  {
    question: "'İhya-u Ulumi'd-Din' adlı önemli eseriyle tanınan, tasavvuf ve kelam alanında etkili olan İslam alimi kimdir?",
    options: [
      "Razi",
      "İbn-i Rüşd",
      "Gazali",
      "Maturidi"
    ],
    correctIndex: 2,
    hint: "'Hüccetü'l-İslam' unvanıyla da bilinir.",
    explanation: "'İhya-u Ulumi'd-Din' adlı eserin yazarı İmam Gazali'dir."
  },
  {
    question: "Optik (ışık bilimi) alanındaki çalışmalarıyla tanınan, 'Kitab-ül Menazır' adlı eseri bulunan Müslüman bilgin kimdir?",
    options: [
      "Harezmi",
      "Biruni",
      "Farabi",
      "İbn-i Heysem"
    ],
    correctIndex: 3,
    hint: "Işığın gözden değil, cisimlerden geldiğini ispatlamıştır.",
    explanation: "Optik alanındaki çalışmalarıyla tanınan bilgin İbn-i Heysem'dir."
  },
  {
    question: "'Elhamdülillah' ifadesi ne anlama gelir?",
    options: [
      "Hamd (övgü) Allah'a mahsustur",
      "Allah en büyüktür",
      "Allah'tan başka ilah yoktur",
      "Allah'ım beni bağışla"
    ],
    correctIndex: 0,
    hint: "Namazın ilk suresinde de geçer.",
    explanation: "'Elhamdülillah', 'Hamd (övgü ve şükür) Allah'a mahsustur' anlamına gelir."
  },
  {
    question: "'Sübhanallah' ifadesi ne anlama gelir?",
    options: [
      "Allah en büyüktür",
      "Allah her türlü noksanlıktan uzaktır",
      "Allah'tan yardım dileriz",
      "Allah'a tevekkül ettik"
    ],
    correctIndex: 1,
    hint: "Allah'ı tenzih etmek için söylenir.",
    explanation: "'Sübhanallah', 'Allah her türlü noksanlıktan ve eksiklikten uzaktır' anlamına gelir."
  },
  {
    question: "'Elhamdülillahi Rabbil Alemin' ifadesi hangi surenin ilk ayetidir?",
    options: [
      "İhlas",
      "Nas",
      "Fatiha",
      "Kevser"
    ],
    correctIndex: 2,
    hint: "Namazın her rekatında okunan suredir.",
    explanation: "Bu ifade, Fatiha suresinin ilk ayetidir."
  },
  {
    question: "Bir işe başlarken söylenen 'Bismillahirrahmanirrahim' ifadesinin anlamı nedir?",
    options: [
      "Allah en büyüktür",
      "Allah'a şükürler olsun",
      "Allah'tan başka güç yoktur",
      "Rahman ve Rahim olan Allah'ın adıyla"
    ],
    correctIndex: 3,
    hint: "Kur'an'da neredeyse her surenin başında yer alır.",
    explanation: "'Bismillahirrahmanirrahim', 'Rahman ve Rahim olan Allah'ın adıyla' anlamına gelir."
  },
  {
    question: "Yemekten sonra edilen ve şükrü ifade eden dua/söze ne ad verilir genel olarak?",
    options: [
      "Şükür duası",
      "Kunut duası",
      "Rabbena duası",
      "Tahiyyat"
    ],
    correctIndex: 0,
    hint: "Nimete karşı şükranı ifade eder.",
    explanation: "Yemekten sonra edilen şükür ifadesine genel olarak şükür duası denir."
  }
];

async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question||'').trim()));

  const toAdd = [];
  islamiImanEsaslari.forEach(q => {
    if(!existingTexts.has(q.question.trim())) toAdd.push(Object.assign({category:'islami'}, q));
  });

  console.log('Toplam hazırlanan soru:', islamiImanEsaslari.length);
  console.log('Zaten var olan (atlanan):', islamiImanEsaslari.length - toAdd.length);
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

main().then(()=>process.exit(0)).catch(e=>{ console.error('Hata:', e); process.exit(1); });
