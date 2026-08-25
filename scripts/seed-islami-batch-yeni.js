// Soru havuzunu Firestore'a TEK SEFERLİK yükler (workflow_dispatch ile elle çalıştırılır).
// Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar eklenmez, güvenle tekrar çalıştırılabilir.
// Bu parti: 85 yeni İslami soru. Doğru cevaplar A şıkkında yığılmasın diye BİLİNÇLİ OLARAK
// A/B/C/D arasında dengeli dağıtıldı (önceki soru havuzundaki A-yığılması hatasını tekrarlamamak için).

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


const islamiBatchYeni = [
  {
    question: "Kur'an-ı Kerim'de toplam kaç sure vardır?",
    options: [
      "114",
      "108",
      "120",
      "124"
    ],
    correctIndex: 0,
    hint: "İlk sure Fatiha, son sure Nas'tır.",
    explanation: "Kur'an-ı Kerim 114 sureden oluşur."
  },
  {
    question: "Kur'an-ı Kerim'de toplam kaç ayet vardır (yaygın kabul edilen sayıma göre)?",
    options: [
      "6000",
      "6236",
      "6112",
      "6666"
    ],
    correctIndex: 1,
    hint: "Halk arasında yaygın bir yanlış bilgi de vardır.",
    explanation: "Kur'an-ı Kerim'de yaygın kabul edilen sayıma göre 6236 ayet bulunur; 6666 rakamı yaygın ama yanlış bir söylentidir."
  },
  {
    question: "Kur'an-ı Kerim kaç cüzden oluşur?",
    options: [
      "20",
      "25",
      "30",
      "28"
    ],
    correctIndex: 2,
    hint: "Ramazan ayında her gün bir tanesi okunacak şekilde düzenlenmiştir.",
    explanation: "Kur'an-ı Kerim 30 cüzden oluşur."
  },
  {
    question: "Kur'an-ı Kerim'in ilk suresi hangisidir?",
    options: [
      "Bakara",
      "İhlas",
      "Nas",
      "Fatiha"
    ],
    correctIndex: 3,
    hint: "Namazların her rekatında okunur.",
    explanation: "Kur'an-ı Kerim'in ilk suresi Fatiha suresidir."
  },
  {
    question: "Kur'an-ı Kerim'in son suresi hangisidir?",
    options: [
      "Nas",
      "Felak",
      "Kevser",
      "Asr"
    ],
    correctIndex: 0,
    hint: "İnsanları konu alan kısa bir suredir.",
    explanation: "Kur'an-ı Kerim'in son suresi Nas suresidir."
  },
  {
    question: "Kur'an-ı Kerim'in en uzun suresi hangisidir?",
    options: [
      "Al-i İmran",
      "Bakara",
      "Nisa",
      "Maide"
    ],
    correctIndex: 1,
    hint: "286 ayettir.",
    explanation: "Kur'an-ı Kerim'in en uzun suresi 286 ayetle Bakara suresidir."
  },
  {
    question: "Aşağıdakilerden hangisi Kur'an'da 3 ayetten oluşan kısa surelerden biri değildir?",
    options: [
      "Asr",
      "Kevser",
      "İhlas",
      "Nasr"
    ],
    correctIndex: 2,
    hint: "İhlas suresi kaç ayettir, hatırlayın.",
    explanation: "İhlas suresi 4 ayettir; Asr, Kevser ve Nasr sureleri ise 3'er ayettir."
  },
  {
    question: "'Ayet-el Kürsi' hangi surenin içindedir?",
    options: [
      "Al-i İmran",
      "Nisa",
      "Araf",
      "Bakara"
    ],
    correctIndex: 3,
    hint: "Kur'an'ın en uzun suresi içindedir.",
    explanation: "Ayet-el Kürsi, Bakara suresinin 255. ayetidir."
  },
  {
    question: "Kur'an-ı Kerim ilk olarak Hz. Peygamber'e hangi mağarada vahyedilmeye başlanmıştır?",
    options: [
      "Hira Mağarası",
      "Sevr Mağarası",
      "Ashab-ı Kehf Mağarası",
      "Ridvan Mağarası"
    ],
    correctIndex: 0,
    hint: "Nur Dağı'ndadır.",
    explanation: "İlk vahiy, Mekke yakınlarındaki Hira Mağarası'nda gelmiştir."
  },
  {
    question: "Kur'an-ı Kerim'de adı geçen ve balığın karnında kaldığı bilinen peygamber kimdir?",
    options: [
      "Hz. Yusuf",
      "Hz. Yunus",
      "Hz. Eyyüp",
      "Hz. İlyas"
    ],
    correctIndex: 1,
    hint: "Adını taşıyan bir sure de vardır.",
    explanation: "Hz. Yunus (a.s.), kavmini terk ettikten sonra bir balığın karnında kalmıştır."
  },
  {
    question: "İslam inancına göre Hz. Muhammed (s.a.v.) hangi şehirde doğmuştur?",
    options: [
      "Medine",
      "Taif",
      "Mekke",
      "Kudüs"
    ],
    correctIndex: 2,
    hint: "Kabe'nin bulunduğu şehirdir.",
    explanation: "Hz. Muhammed (s.a.v.) Mekke'de doğmuştur."
  },
  {
    question: "Hz. Muhammed'in (s.a.v.) annesinin adı nedir?",
    options: [
      "Halime",
      "Fatıma",
      "Hatice",
      "Amine"
    ],
    correctIndex: 3,
    hint: "Kendisi de erken yaşta vefat etmiştir.",
    explanation: "Hz. Peygamber'in annesinin adı Amine'dir."
  },
  {
    question: "Hz. Muhammed'i (s.a.v.) süt annesi olarak emziren kişi kimdir?",
    options: [
      "Halime",
      "Amine",
      "Hatice",
      "Safiye"
    ],
    correctIndex: 0,
    hint: "Sad kabilesindendir.",
    explanation: "Hz. Peygamber'i emziren süt annesi Halime'dir (Halime bint Ebi Züeyb)."
  },
  {
    question: "İslam inancına göre ilk insan ve ilk peygamber kimdir?",
    options: [
      "Hz. Nuh",
      "Hz. Adem",
      "Hz. İdris",
      "Hz. Şit"
    ],
    correctIndex: 1,
    hint: "Cennetten dünyaya indirilen ilk insandır.",
    explanation: "İslam inancına göre ilk insan ve ilk peygamber Hz. Adem'dir (a.s.)."
  },
  {
    question: "Büyük tufan kıssasıyla bilinen, gemi yapan peygamber kimdir?",
    options: [
      "Hz. Musa",
      "Hz. İbrahim",
      "Hz. Nuh",
      "Hz. Salih"
    ],
    correctIndex: 2,
    hint: "Kavmi suda boğulmuştur.",
    explanation: "Tufan ve gemi kıssasıyla bilinen peygamber Hz. Nuh'tur (a.s.)."
  },
  {
    question: "Ateşe atıldığında Allah'ın izniyle yanmadığı anlatılan peygamber kimdir?",
    options: [
      "Hz. İsmail",
      "Hz. Musa",
      "Hz. Yakup",
      "Hz. İbrahim"
    ],
    correctIndex: 3,
    hint: "Kabe'yi oğluyla birlikte inşa etmiştir.",
    explanation: "Nemrut tarafından ateşe atılan ancak Allah'ın izniyle zarar görmeyen peygamber Hz. İbrahim'dir."
  },
  {
    question: "Firavun'a karşı mücadele eden ve asası mucizesiyle bilinen peygamber kimdir?",
    options: [
      "Hz. Musa",
      "Hz. Harun",
      "Hz. Yusuf",
      "Hz. Şuayb"
    ],
    correctIndex: 0,
    hint: "Kızıldeniz'i asasıyla ikiye ayırmıştır.",
    explanation: "Firavun'a karşı mücadele eden ve asa mucizesiyle bilinen peygamber Hz. Musa'dır (a.s.)."
  },
  {
    question: "Kardeşleri tarafından kuyuya atılan, sonra Mısır'da vezir olan peygamber kimdir?",
    options: [
      "Hz. Yakup",
      "Hz. Yusuf",
      "Hz. Süleyman",
      "Hz. Davud"
    ],
    correctIndex: 1,
    hint: "Rüya tabirinde çok mahirdi.",
    explanation: "Kardeşleri tarafından kuyuya atılan ve sonra Mısır'da yüksek bir mevkiye gelen peygamber Hz. Yusuf'tur (a.s.)."
  },
  {
    question: "Kur'an'da kuşların ve karıncaların dilini anladığı belirtilen, hükümdarlığıyla da bilinen peygamber kimdir?",
    options: [
      "Hz. Davud",
      "Hz. Zülkarneyn",
      "Hz. Süleyman",
      "Hz. Lokman"
    ],
    correctIndex: 2,
    hint: "Hüdhüd kuşuyla ilgili bir kıssa vardır.",
    explanation: "Kuşların dilini anlayan ve büyük bir hükümdarlığa sahip olan peygamber Hz. Süleyman'dır (a.s.)."
  },
  {
    question: "Ümmetine sabırla ve uzun yıllar tebliğ yapan, ancak inananların çok az olduğu bilinen peygamber kimdir?",
    options: [
      "Hz. Hud",
      "Hz. Salih",
      "Hz. Şuayb",
      "Hz. Nuh"
    ],
    correctIndex: 3,
    hint: "950 yıl kavmini uyardığı rivayet edilir.",
    explanation: "Kur'an'da kavmini 950 yıl boyunca uyardığı belirtilen peygamber Hz. Nuh'tur (a.s.)."
  },
  {
    question: "İslam inancına göre son peygamber kimdir?",
    options: [
      "Hz. Muhammed",
      "Hz. İsa",
      "Hz. Musa",
      "Hz. İbrahim"
    ],
    correctIndex: 0,
    hint: "'Hatemü'l-Enbiya' (peygamberlerin sonuncusu) unvanı ona aittir.",
    explanation: "İslam inancına göre peygamberlerin sonuncusu Hz. Muhammed'dir (s.a.v.)."
  },
  {
    question: "Hz. Muhammed'in (s.a.v.) ilk eşi kimdir?",
    options: [
      "Ayşe",
      "Hatice",
      "Hafsa",
      "Zeyneb"
    ],
    correctIndex: 1,
    hint: "Kendisinden büyük, saygın bir tüccardı.",
    explanation: "Hz. Peygamber'in ilk eşi Hz. Hatice'dir (r.a.)."
  },
  {
    question: "İlk Müslüman erkek olarak kabul edilen kişi kimdir?",
    options: [
      "Hz. Ömer",
      "Hz. Ebu Bekir",
      "Hz. Ali",
      "Hz. Osman"
    ],
    correctIndex: 2,
    hint: "Hz. Peygamber'in amcasının oğlu ve damadıdır.",
    explanation: "İlk Müslüman çocuk/genç olarak Hz. Ali (r.a.) kabul edilir."
  },
  {
    question: "İlk Müslüman yetişkin erkek olarak kabul edilen ve 'Sıddık' unvanıyla bilinen sahabe kimdir?",
    options: [
      "Hz. Ömer",
      "Hz. Osman",
      "Hz. Ali",
      "Hz. Ebu Bekir"
    ],
    correctIndex: 3,
    hint: "İlk halifedir.",
    explanation: "İlk Müslüman yetişkin erkeklerden ve 'Sıddık' unvanıyla bilinen sahabe Hz. Ebu Bekir'dir (r.a.)."
  },
  {
    question: "Dört halifeden ilki kimdir?",
    options: [
      "Hz. Ebu Bekir",
      "Hz. Ömer",
      "Hz. Osman",
      "Hz. Ali"
    ],
    correctIndex: 0,
    hint: "Hicrette Hz. Peygamber'e yol arkadaşlığı yapmıştır.",
    explanation: "Dört halifeden ilki Hz. Ebu Bekir'dir (r.a.)."
  },
  {
    question: "'Adalet' ile anılan, ikinci halife kimdir?",
    options: [
      "Hz. Ali",
      "Hz. Ömer",
      "Hz. Osman",
      "Hz. Ebu Bekir"
    ],
    correctIndex: 1,
    hint: "Döneminde İslam toprakları büyük ölçüde genişlemiştir.",
    explanation: "İkinci halife ve adaletiyle bilinen sahabe Hz. Ömer'dir (r.a.)."
  },
  {
    question: "Kur'an-ı Kerim'i çoğaltıp tek bir nüsha (mushaf) haline getiren üçüncü halife kimdir?",
    options: [
      "Hz. Ali",
      "Hz. Ömer",
      "Hz. Osman",
      "Hz. Ebu Bekir"
    ],
    correctIndex: 2,
    hint: "Şehit edilen halifedir.",
    explanation: "Kur'an'ı çoğaltarak standart bir mushaf haline getiren üçüncü halife Hz. Osman'dır (r.a.)."
  },
  {
    question: "Dört halifeden sonuncusu ve Hz. Peygamber'in damadı olan kişi kimdir?",
    options: [
      "Hz. Ebu Bekir",
      "Hz. Ömer",
      "Hz. Osman",
      "Hz. Ali"
    ],
    correctIndex: 3,
    hint: "Hz. Fatıma ile evlenmiştir.",
    explanation: "Dört halifeden sonuncusu, Hz. Peygamber'in damadı Hz. Ali'dir (r.a.)."
  },
  {
    question: "Hz. Peygamber'in Mekke'den Medine'ye göç etmesine ne ad verilir?",
    options: [
      "Hicret",
      "Miraç",
      "İsra",
      "Fetih"
    ],
    correctIndex: 0,
    hint: "İslam takviminin başlangıcı kabul edilir.",
    explanation: "Hz. Peygamber'in Mekke'den Medine'ye göçüne Hicret denir."
  },
  {
    question: "Hicret hangi yılda gerçekleşmiştir (miladi)?",
    options: [
      "610",
      "622",
      "632",
      "624"
    ],
    correctIndex: 1,
    hint: "İlk vahiyden yaklaşık 12 yıl sonradır.",
    explanation: "Hicret, miladi 622 yılında gerçekleşmiştir."
  },
  {
    question: "Hz. Peygamber, hicret sırasında Hz. Ebu Bekir ile birlikte hangi mağarada gizlenmiştir?",
    options: [
      "Hira Mağarası",
      "Ashab-ı Kehf Mağarası",
      "Sevr Mağarası",
      "Nur Mağarası"
    ],
    correctIndex: 2,
    hint: "Örümceğin ağ ördüğü rivayet edilir.",
    explanation: "Hicret sırasında Hz. Peygamber ve Hz. Ebu Bekir, Sevr Mağarası'nda gizlenmiştir."
  },
  {
    question: "Müslümanların Mekkeli müşriklerle yaptığı ilk büyük savaş hangisidir?",
    options: [
      "Uhud Savaşı",
      "Hendek Savaşı",
      "Huneyn Savaşı",
      "Bedir Savaşı"
    ],
    correctIndex: 3,
    hint: "Sayıca çok az olan Müslümanlar büyük bir zafer kazanmıştır.",
    explanation: "Müslümanların Mekkeli müşriklerle yaptığı ilk büyük savaş Bedir Savaşı'dır."
  },
  {
    question: "Bedir Savaşı hangi hicri yılda gerçekleşmiştir?",
    options: [
      "Hicri 2. yıl",
      "Hicri 1. yıl",
      "Hicri 3. yıl",
      "Hicri 5. yıl"
    ],
    correctIndex: 0,
    hint: "Miladi 624 yılına denk gelir.",
    explanation: "Bedir Savaşı, Hicretin 2. yılında (miladi 624) gerçekleşmiştir."
  },
  {
    question: "Hz. Hamza'nın şehit olduğu, Müslümanların ilk yenilgisini yaşadığı savaş hangisidir?",
    options: [
      "Bedir Savaşı",
      "Uhud Savaşı",
      "Hendek Savaşı",
      "Mute Savaşı"
    ],
    correctIndex: 1,
    hint: "Medine yakınlarındaki bir dağın adını taşır.",
    explanation: "Hz. Hamza'nın şehit olduğu savaş Uhud Savaşı'dır."
  },
  {
    question: "Medine'nin etrafına hendek kazılarak savunulduğu savaşın adı nedir?",
    options: [
      "Bedir Savaşı",
      "Uhud Savaşı",
      "Hendek Savaşı",
      "Huneyn Savaşı"
    ],
    correctIndex: 2,
    hint: "Selman-ı Farisi'nin önerisiyle uygulanan bir taktiktir.",
    explanation: "Medine'nin etrafına hendek kazılarak yapılan savunma savaşı, Hendek Savaşı'dır."
  },
  {
    question: "Mekke'nin fethi hangi hicri yılda gerçekleşmiştir?",
    options: [
      "Hicri 6. yıl",
      "Hicri 10. yıl",
      "Hicri 2. yıl",
      "Hicri 8. yıl"
    ],
    correctIndex: 3,
    hint: "Hudeybiye Antlaşması'ndan yaklaşık 2 yıl sonradır.",
    explanation: "Mekke'nin fethi, Hicretin 8. yılında gerçekleşmiştir."
  },
  {
    question: "Bir günde farz olarak kaç vakit namaz kılınır?",
    options: [
      "5",
      "3",
      "4",
      "6"
    ],
    correctIndex: 0,
    hint: "Sabah, öğle, ikindi, akşam, yatsı.",
    explanation: "Müslümanlar bir günde 5 vakit farz namaz kılar."
  },
  {
    question: "Namaza başlarken söylenen ve namazı başlatan tekbire ne ad verilir?",
    options: [
      "Kunut",
      "İftitah Tekbiri",
      "Selam",
      "Secde"
    ],
    correctIndex: 1,
    hint: "'Allahu Ekber' denilerek namaza girilir.",
    explanation: "Namaza başlarken alınan ilk tekbire İftitah Tekbiri denir."
  },
  {
    question: "Namazın her rekatında okunması farz olan sure hangisidir?",
    options: [
      "İhlas",
      "Nas",
      "Fatiha",
      "Kevser"
    ],
    correctIndex: 2,
    hint: "Kur'an'ın ilk suresidir.",
    explanation: "Namazın her rekatında Fatiha suresinin okunması farzdır."
  },
  {
    question: "Cuma namazı kaç rekattır (farz kısmı)?",
    options: [
      "4",
      "3",
      "6",
      "2"
    ],
    correctIndex: 3,
    hint: "Öğle namazının yerine kılınır.",
    explanation: "Cuma namazının farz kısmı 2 rekattır."
  },
  {
    question: "Namaz kılarken kıble olarak hangi yöne dönülür?",
    options: [
      "Kabe'ye",
      "Medine'ye",
      "Kudüs'e",
      "Mescid-i Aksa'ya"
    ],
    correctIndex: 0,
    hint: "Mekke'deki kutsal yapıdır.",
    explanation: "Namazda Kabe yönüne (kıbleye) dönülür."
  },
  {
    question: "Abdestte yıkanması gereken organlardan biri değildir?",
    options: [
      "Yüz",
      "Kulaklar (yıkama değil mesh)",
      "Eller",
      "Ayaklar"
    ],
    correctIndex: 1,
    hint: "Kulaklar ıslak elle sadece meshedilir.",
    explanation: "Abdestte yüz, eller ve ayaklar yıkanır; kulaklar ise meshedilir (ıslatılarak dokunulur), yıkanmaz."
  },
  {
    question: "Namazda secde sırasında yere değmesi gereken organ sayısı kaçtır?",
    options: [
      "5",
      "6",
      "7",
      "8"
    ],
    correctIndex: 2,
    hint: "Alın, burun, iki el, iki diz, iki ayak parmağı sayılır.",
    explanation: "Secdede yere değmesi gereken 7 organ vardır: alın, burun, iki el, iki diz, iki ayağın parmakları."
  },
  {
    question: "Namazın farz olması için gerekli şartlardan biri değildir?",
    options: [
      "Akıllı olmak",
      "Ergenlik çağına gelmiş olmak",
      "Müslüman olmak",
      "Evli olmak"
    ],
    correctIndex: 3,
    hint: "Bekar kişiler de namaz kılmakla yükümlüdür.",
    explanation: "Namazın farz olması için evli olmak şart değildir; akıl, buluğ ve Müslüman olmak temel şartlardandır."
  },
  {
    question: "Abdesti bozan durumlardan biri değildir?",
    options: [
      "Gülmek (namaz dışında)",
      "Uyumak (derin uyku)",
      "Kan çıkması",
      "Tuvalet ihtiyacını gidermek"
    ],
    correctIndex: 0,
    hint: "Namaz dışında gülmenin abdeste bir etkisi yoktur.",
    explanation: "Namaz dışında gülmek abdesti bozmaz; ancak derin uyku, kan çıkması ve tuvalet ihtiyacı abdesti bozar."
  },
  {
    question: "Suyun bulunmadığı veya kullanılamadığı durumlarda abdest yerine yapılan temizliğe ne denir?",
    options: [
      "Gusül",
      "Teyemmüm",
      "Istinca",
      "Vitir"
    ],
    correctIndex: 1,
    hint: "Toprak veya temiz bir yüzeyle yapılır.",
    explanation: "Su bulunmadığında yapılan temizliğe teyemmüm denir."
  },
  {
    question: "Cenaze namazında kaç tekbir alınır?",
    options: [
      "2",
      "3",
      "4",
      "5"
    ],
    correctIndex: 2,
    hint: "Rükû ve secde bulunmayan bir namazdır.",
    explanation: "Cenaze namazında 4 tekbir alınır."
  },
  {
    question: "Namazların dışında, özellikle gece kılınan nafile namaza ne ad verilir?",
    options: [
      "Teravih",
      "Duha",
      "Vitir",
      "Teheccüd"
    ],
    correctIndex: 3,
    hint: "Gecenin son üçte birinde kılınması faziletli sayılır.",
    explanation: "Gece kılınan nafile namaza Teheccüd namazı denir."
  },
  {
    question: "Ramazan ayında yatsı namazından sonra kılınan özel namaz hangisidir?",
    options: [
      "Teravih",
      "Teheccüd",
      "Duha",
      "İşrak"
    ],
    correctIndex: 0,
    hint: "Sadece Ramazan ayına özgüdür.",
    explanation: "Ramazan ayında yatsıdan sonra kılınan özel namaz Teravih namazıdır."
  },
  {
    question: "İki bayram namazından biri Ramazan Bayramı ise diğeri hangisidir?",
    options: [
      "Mevlid Bayramı",
      "Kurban Bayramı",
      "Miraç Bayramı",
      "Berat Bayramı"
    ],
    correctIndex: 1,
    hint: "Hac ile aynı döneme denk gelir.",
    explanation: "İslam'da iki bayram vardır: Ramazan Bayramı ve Kurban Bayramı."
  },
  {
    question: "Cuma namazının farz olması için gerekli şartlardan biri nedir?",
    options: [
      "Zengin olmak",
      "Evli olmak",
      "Yolcu olmamak",
      "Yaşlı olmak"
    ],
    correctIndex: 2,
    hint: "Seyahatteki kişilere Cuma namazı farz değildir.",
    explanation: "Cuma namazının farz olması için kişinin yolcu (seferi) olmaması gerekir."
  },
  {
    question: "İslam'ın 5 şartından biri olan oruç hangi ayda farzdır?",
    options: [
      "Muharrem",
      "Recep",
      "Şevval",
      "Ramazan"
    ],
    correctIndex: 3,
    hint: "Kur'an'ın indirilmeye başlandığı aydır.",
    explanation: "Oruç, Ramazan ayında farz kılınmıştır."
  },
  {
    question: "Orucu bozan durumlardan biri değildir?",
    options: [
      "Unutarak yemek yemek",
      "Bilerek yemek yemek",
      "Bilerek su içmek",
      "Kasıtlı kusmak"
    ],
    correctIndex: 0,
    hint: "Unutarak yapılan bu davranış orucu bozmaz.",
    explanation: "Unutarak yemek yemek, orucu bozmaz; oruca devam edilir."
  },
  {
    question: "Ramazan orucunu tutamayan hasta veya yolcunun, iyileştiğinde veya döndüğünde yapması gereken şey nedir?",
    options: [
      "Fidye vermek",
      "Kaza etmek",
      "Keffaret ödemek",
      "Hiçbir şey yapmasına gerek yok"
    ],
    correctIndex: 1,
    hint: "Tutamadığı günler kadar sonradan oruç tutulur.",
    explanation: "Hasta veya yolcu, iyileştiğinde/döndüğünde tutamadığı günleri kaza eder (sonradan tutar)."
  },
  {
    question: "Zekat, malın hangi oranında verilir (genel kabule göre)?",
    options: [
      "1/10",
      "1/20",
      "1/40",
      "1/5"
    ],
    correctIndex: 2,
    hint: "Yüzde 2,5'e denk gelir.",
    explanation: "Zekat, genel olarak malın 1/40'ı (%2,5) oranında verilir."
  },
  {
    question: "Zekat vermek, İslam'ın kaç şartından biridir?",
    options: [
      "3.",
      "5.",
      "2.",
      "4."
    ],
    correctIndex: 3,
    hint: "İman, namaz, oruç, hac ile birlikte sayılır.",
    explanation: "Zekat, İslam'ın 5 şartından 4.'südür (iman, namaz, oruç, hac, zekat sıralamasında farklılık olsa da genelde bu şekilde anılır)."
  },
  {
    question: "Ramazan ayının sonunda, oruç tutamayanlar veya isteyen herkes tarafından fakirlere verilen sadakaya ne ad verilir?",
    options: [
      "Fitre",
      "Zekat",
      "Fidye",
      "Keffaret"
    ],
    correctIndex: 0,
    hint: "Bayramdan önce verilmesi tavsiye edilir.",
    explanation: "Ramazan sonunda verilen bu sadakaya fitre (sadaka-i fıtır) denir."
  },
  {
    question: "Hac ibadeti hangi ayda yapılır?",
    options: [
      "Ramazan",
      "Zilhicce",
      "Şevval",
      "Muharrem"
    ],
    correctIndex: 1,
    hint: "Kurban Bayramı ile aynı döneme denk gelir.",
    explanation: "Hac ibadeti Zilhicce ayında yapılır."
  },
  {
    question: "Hac ibadetinin farz olması için gereken maddi/bedeni yeterliliğe ne denir?",
    options: [
      "Nisab",
      "Zekat",
      "İstitaat",
      "Fidye"
    ],
    correctIndex: 2,
    hint: "'Gücü yetmek' anlamına gelir.",
    explanation: "Hacca gitmeye gücü yetme durumuna istitaat denir; hac, buna sahip olanlara farzdır."
  },
  {
    question: "Hac sırasında Kabe'nin etrafında 7 kez dönme ibadetine ne ad verilir?",
    options: [
      "Sa'y",
      "Vakfe",
      "Rami",
      "Tavaf"
    ],
    correctIndex: 3,
    hint: "'Dönmek' anlamına gelen bir kelimeden gelir.",
    explanation: "Kabe etrafında 7 kez dönme ibadetine tavaf denir."
  },
  {
    question: "Hac sırasında Safa ile Merve tepeleri arasında yapılan gidiş-geliş ibadetine ne ad verilir?",
    options: [
      "Sa'y",
      "Tavaf",
      "Vakfe",
      "Telbiye"
    ],
    correctIndex: 0,
    hint: "Hz. Hacer'in su ararken koşuşturması anısına yapılır.",
    explanation: "Safa ile Merve arasındaki gidiş-geliş ibadetine sa'y denir."
  },
  {
    question: "Hac'da Arafat'ta belirli bir süre bekleme ibadetine ne ad verilir?",
    options: [
      "Sa'y",
      "Vakfe",
      "Tavaf",
      "Rami"
    ],
    correctIndex: 1,
    hint: "Haccın en önemli rüknü kabul edilir.",
    explanation: "Arafat'ta bekleme ibadetine vakfe denir ve haccın en önemli rüknüdür."
  },
  {
    question: "Umre ile hac arasındaki temel fark nedir?",
    options: [
      "Umre sadece kadınlar için farzdır",
      "Hac sadece bir kez yapılabilir",
      "Umre'nin belirli bir zamanı yoktur, hac Zilhicce ayına özgüdür",
      "Umre'de Kabe ziyaret edilmez"
    ],
    correctIndex: 2,
    hint: "Umre yılın her zamanı yapılabilir.",
    explanation: "Umre, yılın herhangi bir zamanında yapılabilirken, hac sadece Zilhicce ayında belirli günlerde yapılır."
  },
  {
    question: "Kurban kesme ibadeti hangi bayramda yerine getirilir?",
    options: [
      "Ramazan Bayramı",
      "Mevlid Kandili",
      "Regaib Kandili",
      "Kurban Bayramı"
    ],
    correctIndex: 3,
    hint: "Adından da anlaşılabilir.",
    explanation: "Kurban kesme ibadeti Kurban Bayramı'nda yerine getirilir."
  },
  {
    question: "Nisab miktarına ulaşan mala sahip olan bir Müslümana hangi ibadet farz olur?",
    options: [
      "Zekat",
      "Hac",
      "Oruç",
      "Namaz"
    ],
    correctIndex: 0,
    hint: "Belirli bir zenginlik sınırını ifade eden terimdir.",
    explanation: "Nisab miktarına ulaşan mala sahip olan Müslümana zekat farz olur."
  },
  {
    question: "Ramazan orucunu kasıtlı olarak (özürsüz) bozan kişiye ne gerekir?",
    options: [
      "Sadece kaza",
      "Keffaret (peş peşe 60 gün oruç veya fidye)",
      "Fitre vermek",
      "Hiçbir şey gerekmez"
    ],
    correctIndex: 1,
    hint: "Ağır bir yaptırımdır, hem kaza hem de ek bir ceza içerir.",
    explanation: "Ramazan orucunu kasıtlı bozan kişiye keffaret gerekir (peş peşe 60 gün oruç tutmak veya belirli sayıda fakiri doyurmak)."
  },
  {
    question: "'Ameller niyetlere göredir' anlamına gelen meşhur hadis-i şerif hangi konuda önem taşır?",
    options: [
      "Namazın rükünleri",
      "Oruç çeşitleri",
      "İbadetlerde niyetin önemi",
      "Zekat oranları"
    ],
    correctIndex: 2,
    hint: "Bir işin Allah rızası için yapılıp yapılmadığını konu alır.",
    explanation: "Bu hadis, ibadetlerde ve amellerde niyetin ne kadar önemli olduğunu vurgular."
  },
  {
    question: "'Mümin, müminin aynasıdır' hadisi hangi konuyu vurgular?",
    options: [
      "Ticaret ahlakı",
      "Namazın önemi",
      "Hac ibadeti",
      "Kardeşlik ve dayanışma"
    ],
    correctIndex: 3,
    hint: "Müslümanların birbirine karşı tutumuyla ilgilidir.",
    explanation: "Bu hadis, müminler arasındaki kardeşlik, samimiyet ve birbirini düzeltme ilişkisini vurgular."
  },
  {
    question: "'Temizlik imanın yarısıdır' hadisi hangi konuyla ilgilidir?",
    options: [
      "Hijyen ve manevi temizlik",
      "Ahlak",
      "Ticaret",
      "Aile ilişkileri"
    ],
    correctIndex: 0,
    hint: "Hem bedeni hem manevi anlamda ele alınabilir.",
    explanation: "Bu hadis, hem bedensel hem manevi temizliğin imanla olan bağlantısını ifade eder."
  },
  {
    question: "'Komşusu açken tok yatan bizden değildir' hadisi hangi ahlaki değeri vurgular?",
    options: [
      "Sabır",
      "Cömertlik ve komşu hakları",
      "Adalet",
      "Doğruluk"
    ],
    correctIndex: 1,
    hint: "Yakın çevreye duyarlılığı öne çıkarır.",
    explanation: "Bu hadis, komşuluk haklarına dikkat çekerek cömertliği ve paylaşmayı teşvik eder."
  },
  {
    question: "'İlim Çin'de bile olsa gidip alınız' sözü hangi değeri teşvik eder?",
    options: [
      "Cesaret",
      "Sabır",
      "İlim öğrenmenin önemi",
      "Cömertlik"
    ],
    correctIndex: 2,
    hint: "Bilgiye ulaşmak için uzak mesafelerin bile engel olmaması gerektiğini anlatır.",
    explanation: "Bu söz, ilim öğrenmenin İslam'daki önemini ve bunun için gösterilmesi gereken çabayı vurgular."
  },
  {
    question: "'Kolaylaştırınız, zorlaştırmayınız' hadisi hangi konuda yol göstericidir?",
    options: [
      "Ticarette",
      "Aile hayatında",
      "Savaşta",
      "Din anlatımı ve davranışlarda"
    ],
    correctIndex: 3,
    hint: "İnsanlara İslam'ı anlatırken nasıl davranılması gerektiğiyle ilgilidir.",
    explanation: "Bu hadis, dini tebliğ ederken ve insanlarla ilişkilerde kolaylaştırıcı olunması gerektiğini öğütler."
  },
  {
    question: "'En hayırlınız, Kur'an'ı öğrenen ve öğretendir' hadisi neyi teşvik eder?",
    options: [
      "Kur'an eğitimi",
      "Namaz kılmayı",
      "Oruç tutmayı",
      "Hacca gitmeyi"
    ],
    correctIndex: 0,
    hint: "Öğrenme ve öğretme iki yönlü bir eylemdir.",
    explanation: "Bu hadis, Kur'an öğrenmenin ve başkalarına öğretmenin faziletini vurgular."
  },
  {
    question: "'Cennet, annelerin ayakları altındadır' sözü hangi konuyu vurgular?",
    options: [
      "Zekat",
      "Anne hakkının önemi",
      "Namaz vakti",
      "Cihat"
    ],
    correctIndex: 1,
    hint: "Aile içi ilişkilerle ilgilidir.",
    explanation: "Bu söz, anneye gösterilen saygı ve hizmetin manevi değerine dikkat çeker."
  },
  {
    question: "'Gülümsemek sadakadır' hadisi neyi ifade eder?",
    options: [
      "Sadece maddi yardımın önemli olduğunu",
      "Zekatın farz olduğunu",
      "Küçük iyiliklerin de değerli olduğunu",
      "Orucun önemini"
    ],
    correctIndex: 2,
    hint: "Basit ve küçük bir davranışın bile sevap kazandırabileceğini anlatır.",
    explanation: "Bu hadis, küçük iyiliklerin (gülümsemek gibi) bile sadaka sayılabileceğini, yani değerli olduğunu vurgular."
  },
  {
    question: "'Veren el, alan elden hayırlıdır' hadisi hangi değeri öğütler?",
    options: [
      "Sabır",
      "Doğruluk",
      "Adalet",
      "Cömertlik"
    ],
    correctIndex: 3,
    hint: "Yardım etmenin, yardım almaktan daha faziletli olduğunu anlatır.",
    explanation: "Bu hadis, cömertliği ve başkalarına yardım etmenin faziletini teşvik eder."
  },
  {
    question: "İslam'ın temel şartları kaç tanedir?",
    options: [
      "5",
      "3",
      "4",
      "6"
    ],
    correctIndex: 0,
    hint: "Kelime-i şehadet, namaz, oruç, zekat, hac.",
    explanation: "İslam'ın 5 şartı vardır: kelime-i şehadet, namaz, oruç, zekat ve hac."
  },
  {
    question: "İmanın şartları kaç tanedir?",
    options: [
      "4",
      "6",
      "5",
      "7"
    ],
    correctIndex: 1,
    hint: "Allah'a, meleklere, kitaplara, peygamberlere, ahiret gününe ve kadere iman.",
    explanation: "İmanın 6 şartı vardır."
  },
  {
    question: "Aşağıdakilerden hangisi imanın şartlarından biri değildir?",
    options: [
      "Meleklere iman",
      "Kitaplara iman",
      "Zekat vermeye iman",
      "Kadere iman"
    ],
    correctIndex: 2,
    hint: "Zekat bir ibadettir, iman şartı değildir.",
    explanation: "Zekat vermek İslam'ın şartlarından biridir, imanın şartlarından değildir."
  },
  {
    question: "Müslümanların kıble olarak yöneldiği kutsal yapı nedir?",
    options: [
      "Mescid-i Aksa",
      "Mescid-i Nebevi",
      "Süleymaniye Camii",
      "Kabe"
    ],
    correctIndex: 3,
    hint: "Mekke'de bulunur.",
    explanation: "Müslümanların namazda yöneldiği kıble, Mekke'deki Kabe'dir."
  },
  {
    question: "İslam'da alkol, kumar gibi zararlı şeylerden kaçınmayı ifade eden kavram nedir?",
    options: [
      "Haram",
      "Helal",
      "Mekruh",
      "Mübah"
    ],
    correctIndex: 0,
    hint: "Kesin olarak yasak olan şeyleri ifade eder.",
    explanation: "Dinen kesin olarak yasaklanmış şeylere haram denir."
  },
  {
    question: "Dinen yapılmasında bir sakınca olmayan, serbest bırakılmış davranışlara ne denir?",
    options: [
      "Haram",
      "Mübah",
      "Vacip",
      "Mekruh"
    ],
    correctIndex: 1,
    hint: "Ne emredilmiş ne de yasaklanmıştır.",
    explanation: "Yapılıp yapılmaması konusunda serbestlik olan davranışlara mübah denir."
  },
  {
    question: "Yapılması hoş karşılanmayan ama haram da olmayan davranışlara ne denir?",
    options: [
      "Mübah",
      "Vacip",
      "Mekruh",
      "Farz"
    ],
    correctIndex: 2,
    hint: "Sakıncalı ama yasak değildir.",
    explanation: "Yapılması hoş görülmeyen ama haram sayılmayan davranışlara mekruh denir."
  },
  {
    question: "Kelime-i şehadet neyi ifade eder?",
    options: [
      "Namaza başlama sözü",
      "Oruç niyeti",
      "Hac duası",
      "Allah'a ve Hz. Muhammed'in peygamberliğine tanıklık"
    ],
    correctIndex: 3,
    hint: "Müslüman olmanın ilk sözlü şartıdır.",
    explanation: "Kelime-i şehadet, Allah'ın birliğine ve Hz. Muhammed'in O'nun elçisi olduğuna tanıklık etme sözüdür."
  },
  {
    question: "Müslümanların birbirine yaptığı 'Selamün Aleyküm' selamlaşmasının anlamı nedir?",
    options: [
      "Allah'ın selamı senin üzerine olsun",
      "Hoşça kal",
      "Görüşürüz",
      "Teşekkür ederim"
    ],
    correctIndex: 0,
    hint: "Barış ve esenlik dileme anlamı taşır.",
    explanation: "'Selamün Aleyküm', 'Allah'ın selamı (esenliği) senin üzerine olsun' anlamına gelir."
  },
  {
    question: "'Sadaka-i cariye' kavramı neyi ifade eder?",
    options: [
      "Bir kereye mahsus verilen sadaka",
      "Etkisi ve sevabı devam eden hayır (cami yaptırmak gibi)",
      "Zorunlu zekat",
      "Kurban bağışı"
    ],
    correctIndex: 1,
    hint: "Kişi öldükten sonra bile sevabı devam eden bir hayırdır.",
    explanation: "Sadaka-i cariye, cami, çeşme, kitap gibi etkisi ve sevabı ölümden sonra da devam eden hayır işlerini ifade eder."
  },
  {
    question: "İslam'da büyük günahlardan biri olan ve 'Allah'a ortak koşma' anlamına gelen kavram nedir?",
    options: [
      "Küfür",
      "Nifak",
      "Şirk",
      "Fısk"
    ],
    correctIndex: 2,
    hint: "Tevhid inancının tam karşıtıdır.",
    explanation: "Allah'a ortak koşmaya şirk denir ve İslam'da affedilmeyen büyük günahlardan biridir."
  },
  {
    question: "Peygamberlerin günahsız ve hatasız olma özelliğine ne ad verilir?",
    options: [
      "Sıdk",
      "Emanet",
      "Fetanet",
      "İsmet"
    ],
    correctIndex: 3,
    hint: "'Korunmuşluk' anlamına gelir.",
    explanation: "Peygamberlerin günahtan korunmuş olma sıfatına ismet denir."
  },
  {
    question: "Peygamberlerin doğru sözlü olma sıfatına ne ad verilir?",
    options: [
      "Sıdk",
      "İsmet",
      "Fetanet",
      "Tebliğ"
    ],
    correctIndex: 0,
    hint: "'Doğruluk' kelimesiyle aynı kökten gelir.",
    explanation: "Peygamberlerin doğru sözlü olma sıfatına sıdk denir."
  },
  {
    question: "Peygamberlerin akıllı ve zeki olma sıfatına ne ad verilir?",
    options: [
      "Sıdk",
      "Fetanet",
      "Emanet",
      "Tebliğ"
    ],
    correctIndex: 1,
    hint: "'Zekilik' anlamına gelir.",
    explanation: "Peygamberlerin akıllı ve zeki olma sıfatına fetanet denir."
  },
  {
    question: "Peygamberlerin kendilerine emanet edilen vahyi eksiksiz koruma sıfatına ne ad verilir?",
    options: [
      "Fetanet",
      "Sıdk",
      "Emanet",
      "İsmet"
    ],
    correctIndex: 2,
    hint: "'Güvenilirlik' anlamı taşır.",
    explanation: "Peygamberlerin güvenilir olma ve emaneti koruma sıfatına emanet denir."
  },
  {
    question: "Peygamberlerin aldıkları vahyi insanlara olduğu gibi ulaştırma sıfatına ne ad verilir?",
    options: [
      "İsmet",
      "Fetanet",
      "Sıdk",
      "Tebliğ"
    ],
    correctIndex: 3,
    hint: "'İletme, ulaştırma' anlamı taşır.",
    explanation: "Peygamberlerin vahyi eksiksiz insanlara ulaştırma sıfatına tebliğ denir."
  },
  {
    question: "İslam'da faizin haram kılınmasının temel gerekçelerinden biri nedir?",
    options: [
      "Ekonomik adaletsizliğe yol açması",
      "Zekatı azaltması",
      "Namazı geciktirmesi",
      "Orucu bozması"
    ],
    correctIndex: 0,
    hint: "Zengin ile fakir arasındaki uçurumla ilgilidir.",
    explanation: "Faiz, haksız kazanca ve ekonomik adaletsizliğe yol açtığı için İslam'da haram kılınmıştır."
  },
  {
    question: "Kur'an-ı Kerim'de yalan söylemek, hile yapmak gibi davranışlar hangi kavramla ifade edilir?",
    options: [
      "Sıdk",
      "Nifak",
      "Amel-i salih",
      "İhsan"
    ],
    correctIndex: 1,
    hint: "Münafıklık özelliğiyle ilişkilidir.",
    explanation: "İkiyüzlülük, yalan ve hile gibi davranışlar nifak kavramıyla ilişkilendirilir."
  },
  {
    question: "'İhsan' kavramı İslam'da neyi ifade eder?",
    options: [
      "Sadece zekat vermek",
      "Sadece namaz kılmak",
      "Allah'ı görüyormuşçasına ibadet etmek",
      "Sadece oruç tutmak"
    ],
    correctIndex: 2,
    hint: "Kulluğun en üst derecesi olarak kabul edilir.",
    explanation: "İhsan, 'Allah'ı görmüyorsan da O'nun seni gördüğünü bilerek' ibadet etme bilincidir."
  },
  {
    question: "'Tevekkül' kavramı ne anlama gelir?",
    options: [
      "Çalışmadan beklemek",
      "Sadece dua etmek",
      "Kadere teslim olup hiçbir şey yapmamak",
      "Gerekli çabayı gösterip sonucu Allah'a bırakmak"
    ],
    correctIndex: 3,
    hint: "Çaba ile teslimiyetin dengeli birleşimidir.",
    explanation: "Tevekkül, gerekli tedbir ve çabayı gösterdikten sonra sonucu Allah'a bırakmaktır."
  },
  {
    question: "Miraç mucizesi Hz. Peygamber'in nereden nereye yolculuğunu ifade eder?",
    options: [
      "Mescid-i Haram'dan Mescid-i Aksa'ya ve semaya",
      "Mekke'den Medine'ye",
      "Mekke'den Taif'e",
      "Medine'den Kudüs'e"
    ],
    correctIndex: 0,
    hint: "Önce Kudüs'e, sonra göklere yükseliş şeklinde anlatılır.",
    explanation: "Miraç, Hz. Peygamber'in Mescid-i Haram'dan Mescid-i Aksa'ya (İsra), oradan da göklere (Miraç) yükseltilmesidir."
  },
  {
    question: "Miraç gecesinde Müslümanlara hangi ibadet farz kılınmıştır?",
    options: [
      "Oruç",
      "Namaz",
      "Zekat",
      "Hac"
    ],
    correctIndex: 1,
    hint: "Günde 5 vakit olarak belirlenmiştir.",
    explanation: "Miraç gecesinde 5 vakit namaz farz kılınmıştır."
  },
  {
    question: "Hz. Peygamber'in Medine'de ilk yaptırdığı yapılardan biri hangisidir?",
    options: [
      "Kabe",
      "Mescid-i Aksa",
      "Mescid-i Nebevi",
      "Süleymaniye Camii"
    ],
    correctIndex: 2,
    hint: "Kendi adını taşıyan mescittir.",
    explanation: "Hz. Peygamber Medine'ye hicret ettikten sonra Mescid-i Nebevi'yi inşa ettirmiştir."
  },
  {
    question: "Medine'de Müslümanlarla diğer din mensupları arasında yapılan ve birlikte yaşama esaslarını belirleyen belgeye ne ad verilir?",
    options: [
      "Hudeybiye Antlaşması",
      "Akabe Biati",
      "Veda Hutbesi",
      "Medine Vesikası"
    ],
    correctIndex: 3,
    hint: "Bir tür anayasa niteliği taşır.",
    explanation: "Medine'de farklı din mensuplarıyla yapılan bu antlaşmaya Medine Vesikası denir."
  },
  {
    question: "Hz. Peygamber'in hacca gittiğinde verdiği ve önemli evrensel mesajlar içeren hutbeye ne ad verilir?",
    options: [
      "Veda Hutbesi",
      "Medine Vesikası",
      "Akabe Biati",
      "Hudeybiye Hutbesi"
    ],
    correctIndex: 0,
    hint: "Hz. Peygamber'in son haccında verdiği hutbedir.",
    explanation: "Hz. Peygamber'in son haccında verdiği bu önemli hutbeye Veda Hutbesi denir."
  },
  {
    question: "Hz. Peygamber'in vefat ettiği şehir neresidir?",
    options: [
      "Mekke",
      "Medine",
      "Taif",
      "Kudüs"
    ],
    correctIndex: 1,
    hint: "Hicret ettiği şehirde vefat etmiştir.",
    explanation: "Hz. Peygamber, hicret ettiği şehir olan Medine'de vefat etmiştir."
  },
  {
    question: "İslam'da ilk ezanı okuyan sahabe kimdir?",
    options: [
      "Hz. Ammar",
      "Hz. Selman-ı Farisi",
      "Hz. Bilal-i Habeşi",
      "Hz. Ebu Zer"
    ],
    correctIndex: 2,
    hint: "Güzel sesiyle bilinen, Habeşistanlı bir sahabedir.",
    explanation: "İlk ezanı okuyan sahabe Hz. Bilal-i Habeşi'dir (r.a.)."
  },
  {
    question: "Kur'an-ı Kerim'i ilk kez bir kitap (mushaf) haline getirme çalışması hangi halife döneminde başlamıştır?",
    options: [
      "Hz. Ömer",
      "Hz. Osman",
      "Hz. Ali",
      "Hz. Ebu Bekir"
    ],
    correctIndex: 3,
    hint: "İlk halife döneminde, Zeyd b. Sabit görevlendirilmiştir.",
    explanation: "Kur'an ayetlerinin bir araya toplanması çalışması Hz. Ebu Bekir döneminde başlamıştır."
  },
  {
    question: "'Ashab-ı Suffe' kimleri ifade eder?",
    options: [
      "Mescid-i Nebevi'de ilim öğrenen fakir sahabiler",
      "Mekkeli zengin tüccarlar",
      "Savaşta şehit olan sahabiler",
      "Hz. Peygamber'in torunları"
    ],
    correctIndex: 0,
    hint: "Mescidin bir bölümünde barınan, ilimle meşgul olan kişilerdir.",
    explanation: "Ashab-ı Suffe, Mescid-i Nebevi'nin bir bölümünde kalarak ilimle meşgul olan fakir sahabilerdir."
  },
  {
    question: "Hz. Peygamber'in kızı ve Hz. Ali'nin eşi olan sahabe kimdir?",
    options: [
      "Hz. Ayşe",
      "Hz. Fatıma",
      "Hz. Hafsa",
      "Hz. Zeyneb"
    ],
    correctIndex: 1,
    hint: "'Cennet kadınlarının efendisi' olarak da anılır.",
    explanation: "Hz. Peygamber'in kızı ve Hz. Ali'nin eşi Hz. Fatıma'dır (r.a.)."
  },
  {
    question: "Bir kimsenin hem kendi çıkarına hem de topluma faydalı olacak şekilde davranmasını öğütleyen 'orta yol' anlayışına İslam'da ne denir?",
    options: [
      "İfrat",
      "Tefrit",
      "Vasat (itidal)",
      "Gulüv"
    ],
    correctIndex: 2,
    hint: "Aşırılıklardan kaçınmayı ifade eder.",
    explanation: "İslam'da aşırılıklardan uzak, dengeli tutuma vasat (itidal) denir."
  },
  {
    question: "Aşırı gitmek, bir şeyde ölçüyü kaçırmak anlamına gelen kavram hangisidir?",
    options: [
      "İtidal",
      "Vasat",
      "Sabır",
      "İfrat"
    ],
    correctIndex: 3,
    hint: "Dengeli olmanın zıttı sayılır.",
    explanation: "Bir konuda aşırıya kaçmaya ifrat denir."
  },
  {
    question: "İslam'da kul hakkına verilen önem düşünüldüğünde, bir kişiye haksızlık eden kimsenin öncelikle ne yapması gerekir?",
    options: [
      "Hak sahibinden helallik alması",
      "Sadece dua etmesi",
      "Sadece oruç tutması",
      "Hiçbir şey yapmasına gerek yoktur"
    ],
    correctIndex: 0,
    hint: "Allah hakları affedebilir ama kul hakkı için hak sahibinin rızası gerekir.",
    explanation: "Kul hakkına giren bir haksızlıkta, hak sahibinden helallik alınması gerekir."
  },
  {
    question: "İslam'da anne babaya iyi davranmak, onlara saygı göstermek hangi kavramla ifade edilir?",
    options: [
      "Sıla-i Rahim",
      "Birr'ul-Validin",
      "İhsan",
      "Takva"
    ],
    correctIndex: 1,
    hint: "'Validin' kelimesi ebeveyn anlamına gelir.",
    explanation: "Anne babaya iyilik ve saygı göstermeye Birr'ul-Validin denir."
  },
  {
    question: "Akraba ile ilişkileri sürdürmek, onları ziyaret etmek anlamına gelen kavram nedir?",
    options: [
      "Birr'ul-Validin",
      "Zekat",
      "Sıla-i Rahim",
      "İhsan"
    ],
    correctIndex: 2,
    hint: "'Rahim' kelimesi akrabalık bağını ifade eder.",
    explanation: "Akrabalık bağlarını sürdürmeye sıla-i rahim denir."
  },
  {
    question: "İslam'a göre bir Müslümanın diğer Müslüman üzerindeki haklarından biri değildir?",
    options: [
      "Hasta olduğunda ziyaret etmek",
      "Selamını almak",
      "Davetine icabet etmek",
      "Malını zorla almak"
    ],
    correctIndex: 3,
    hint: "Bu bir hak değil, açık bir haksızlıktır.",
    explanation: "Bir Müslümanın malını zorla almak, İslam'da açıkça yasaklanmış bir haksızlıktır; bu bir 'hak' değildir."
  },
  {
    question: "Kur'an-ı Kerim'i güzel bir şekilde, tecvid kurallarına uyarak okumaya ne ad verilir?",
    options: [
      "Tilavet",
      "Tefsir",
      "Kıraat",
      "Hıfz"
    ],
    correctIndex: 0,
    hint: "'Okuma' kökünden gelir.",
    explanation: "Kur'an'ı tecvid kurallarına uygun güzel okumaya tilavet denir."
  },
  {
    question: "Kur'an-ı Kerim'i ezbere bilmeye ne ad verilir, bunu yapan kişiye ne denir?",
    options: [
      "Kari - Kıraat",
      "Hafız - Hıfz",
      "Müfessir - Tefsir",
      "Muhaddis - Hadis"
    ],
    correctIndex: 1,
    hint: "Ezberleyen kişiye 'hafız' denir.",
    explanation: "Kur'an'ı ezbere bilmeye hıfz, bunu yapan kişiye hafız denir."
  },
  {
    question: "Kur'an ayetlerinin açıklanması, yorumlanması ilmine ne ad verilir?",
    options: [
      "Hıfz",
      "Kıraat",
      "Tefsir",
      "Tecvid"
    ],
    correctIndex: 2,
    hint: "Ayetlerin manasını derinlemesine inceleyen bir ilimdir.",
    explanation: "Kur'an ayetlerini açıklama ve yorumlama ilmine tefsir denir."
  },
  {
    question: "Kur'an-ı Kerim'i doğru harf ve ses özellikleriyle okuma kurallarına ne ad verilir?",
    options: [
      "Tefsir",
      "Hıfz",
      "Kıraat",
      "Tecvid"
    ],
    correctIndex: 3,
    hint: "Harflerin mahreçleriyle ilgilidir.",
    explanation: "Kur'an'ı doğru telaffuzla okuma kurallarına tecvid denir."
  },
  {
    question: "Hz. Peygamber'in söz, fiil ve onaylarının (sünnet) toplandığı ilme ne ad verilir?",
    options: [
      "Hadis",
      "Tefsir",
      "Fıkıh",
      "Kelam"
    ],
    correctIndex: 0,
    hint: "Peygamberin uygulamalarını konu alır.",
    explanation: "Hz. Peygamber'in söz, fiil ve onaylarını inceleyen ilme hadis ilmi denir."
  },
  {
    question: "İslam hukukunu, ibadet ve muamelat kurallarını inceleyen ilme ne ad verilir?",
    options: [
      "Kelam",
      "Fıkıh",
      "Tasavvuf",
      "Hadis"
    ],
    correctIndex: 1,
    hint: "'Anlayış, derin kavrayış' anlamına gelen kelimeden türemiştir.",
    explanation: "İslam hukuku ve ibadet kurallarını inceleyen ilme fıkıh denir."
  },
  {
    question: "İslam inanç esaslarını, akli deliller ile de temellendiren ilme ne ad verilir?",
    options: [
      "Fıkıh",
      "Tasavvuf",
      "Kelam",
      "Tefsir"
    ],
    correctIndex: 2,
    hint: "İtikat konularını akılla da açıklamaya çalışır.",
    explanation: "İslam'ın inanç esaslarını akli delillerle inceleyen ilme kelam denir."
  },
  {
    question: "Kalp temizliği, nefis terbiyesi ve manevi olgunlaşmayı konu alan ilme ne ad verilir?",
    options: [
      "Fıkıh",
      "Kelam",
      "Hadis",
      "Tasavvuf"
    ],
    correctIndex: 3,
    hint: "Manevi/ruhani boyutla ilgilenir.",
    explanation: "Kalp temizliği ve manevi olgunlaşmayı konu alan ilme tasavvuf denir."
  },
  {
    question: "Kur'an-ı Kerim'in Arapçadan başka bir dile aktarılmasına ne ad verilir?",
    options: [
      "Meal",
      "Tefsir",
      "Tecvid",
      "Hadis"
    ],
    correctIndex: 0,
    hint: "'Anlam' kelimesinden türemiştir.",
    explanation: "Kur'an'ın başka bir dile çevrilmesine meal denir."
  },
  {
    question: "Yaşlılığında bir çocuk sahibi olması için dua eden ve duası kabul olan peygamber kimdir?",
    options: [
      "Hz. Yahya",
      "Hz. Zekeriya",
      "Hz. Lut",
      "Hz. İlyas"
    ],
    correctIndex: 1,
    hint: "Oğlu Hz. Yahya'dır.",
    explanation: "Yaşlılığında evlat sahibi olmak için dua eden ve duası kabul olan peygamber Hz. Zekeriya'dır (a.s.)."
  },
  {
    question: "Annesi tarafından sepet içinde nehre bırakılan, sonra Firavun'un sarayında büyüyen peygamber kimdir?",
    options: [
      "Hz. İbrahim",
      "Hz. Yusuf",
      "Hz. Musa",
      "Hz. İsmail"
    ],
    correctIndex: 2,
    hint: "Sonradan Firavun'a karşı mücadele etmiştir.",
    explanation: "Annesi tarafından sepet içinde Nil Nehri'ne bırakılan, sonra Firavun'un sarayında büyüyen peygamber Hz. Musa'dır (a.s.)."
  },
  {
    question: "Babasına kurban edilmesi denenen, ancak Allah'ın bir koçla değiştirdiği peygamber kimdir?",
    options: [
      "Hz. Yusuf",
      "Hz. Musa",
      "Hz. Yahya",
      "Hz. İshak/İsmail (rivayetlere göre değişir)"
    ],
    correctIndex: 3,
    hint: "Kurban Bayramı'nın kökeni bu kıssaya dayanır.",
    explanation: "Kurban kıssasında, İslam alimlerinin çoğunluğuna göre Hz. İsmail (bazı rivayetlerde Hz. İshak) kurban edilmek istenmiş, Allah bir koçla bu durumu değiştirmiştir."
  },
  {
    question: "Kavmi taştan evler yapan, dişi bir deve mucizesiyle bilinen peygamber kimdir?",
    options: [
      "Hz. Salih",
      "Hz. Hud",
      "Hz. Şuayb",
      "Hz. Lut"
    ],
    correctIndex: 0,
    hint: "Semud kavmine gönderilmiştir.",
    explanation: "Dişi deve mucizesiyle bilinen ve Semud kavmine gönderilen peygamber Hz. Salih'tir (a.s.)."
  },
  {
    question: "Ad kavmine gönderilen, kavminin şiddetli bir rüzgarla helak edildiği peygamber kimdir?",
    options: [
      "Hz. Salih",
      "Hz. Hud",
      "Hz. Şuayb",
      "Hz. Lut"
    ],
    correctIndex: 1,
    hint: "Kavmi kasırga ile cezalandırılmıştır.",
    explanation: "Ad kavmine gönderilen ve kavmi şiddetli rüzgarla helak edilen peygamber Hz. Hud'dur (a.s.)."
  },
  {
    question: "Ticarette ölçü ve tartıda hile yapılmasına karşı uyaran, Medyen halkına gönderilen peygamber kimdir?",
    options: [
      "Hz. Salih",
      "Hz. Hud",
      "Hz. Şuayb",
      "Hz. Lut"
    ],
    correctIndex: 2,
    hint: "Ticaret ahlakıyla özdeşleşmiştir.",
    explanation: "Ölçü ve tartıda dürüstlüğü öğütleyen, Medyen halkına gönderilen peygamber Hz. Şuayb'dır (a.s.)."
  },
  {
    question: "Sodom ve Gomore olarak bilinen, ahlaksızlığın yaygın olduğu bir kavme gönderilen peygamber kimdir?",
    options: [
      "Hz. Hud",
      "Hz. Salih",
      "Hz. Şuayb",
      "Hz. Lut"
    ],
    correctIndex: 3,
    hint: "Hz. İbrahim'in yeğenidir.",
    explanation: "Ahlaksızlığıyla bilinen bir kavme gönderilen peygamber Hz. Lut'tur (a.s.)."
  },
  {
    question: "Hastalığa müptela olup uzun süre sabreden ve bu sabrıyla örnek gösterilen peygamber kimdir?",
    options: [
      "Hz. Eyyüp",
      "Hz. Yunus",
      "Hz. Zekeriya",
      "Hz. İdris"
    ],
    correctIndex: 0,
    hint: "'Sabır' denince akla ilk gelen peygamberdir.",
    explanation: "Hastalığına sabrettiği için örnek gösterilen peygamber Hz. Eyyüp'tür (a.s.)."
  },
  {
    question: "İsrailoğullarına gönderilen ve mucize olarak ölüleri diriltebildiği belirtilen peygamber kimdir?",
    options: [
      "Hz. Musa",
      "Hz. İsa",
      "Hz. Davud",
      "Hz. Süleyman"
    ],
    correctIndex: 1,
    hint: "Beşikte konuştuğu da rivayet edilir.",
    explanation: "Allah'ın izniyle ölüleri diriltme mucizesiyle bilinen peygamber Hz. İsa'dır (a.s.)."
  },
  {
    question: "Güzel sesiyle Zebur'u okuduğunda dağların ve kuşların ona eşlik ettiği rivayet edilen peygamber kimdir?",
    options: [
      "Hz. Süleyman",
      "Hz. Zekeriya",
      "Hz. Davud",
      "Hz. Yunus"
    ],
    correctIndex: 2,
    hint: "Zebur kendisine indirilmiştir.",
    explanation: "Zebur kendisine indirilen ve güzel sesiyle bilinen peygamber Hz. Davud'dur (a.s.)."
  }
];

async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question||'').trim()));

  const toAdd = [];
  islamiBatchYeni.forEach(q => {
    if(!existingTexts.has(q.question.trim())) toAdd.push(Object.assign({category:'islami'}, q));
  });

  console.log('Toplam hazırlanan soru:', islamiBatchYeni.length);
  console.log('Zaten var olan (atlanan):', islamiBatchYeni.length - toAdd.length);
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
