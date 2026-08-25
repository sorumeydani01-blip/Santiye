// Soru havuzunu Firestore'a TEK SEFERLİK yükler (workflow_dispatch ile elle çalıştırılır).
// Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar eklenmez, güvenle tekrar çalıştırılabilir.
// Bu parti: 100 yeni Genel Kültür sorusu. Doğru cevaplar A şıkkında yığılmasın diye
// yazıldıktan sonra round-robin ile A/B/C/D arasında dengeli dağıtıldı.

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


const genelKulturBatchYeni = [
  {
    question: "Türkiye'nin en yüksek dağı hangisidir?",
    options: [
      "Erciyes",
      "Ağrı Dağı",
      "Kaçkar",
      "Süphan"
    ],
    correctIndex: 0,
    hint: "5137 metre yüksekliğindedir.",
    explanation: "Türkiye'nin en yüksek dağı 5137 metreyle Ağrı Dağı'dır."
  },
  {
    question: "Türkiye'nin en büyük gölü hangisidir?",
    options: [
      "Beyşehir Gölü",
      "Tuz Gölü",
      "Van Gölü",
      "Eğirdir Gölü"
    ],
    correctIndex: 1,
    hint: "Doğu Anadolu'da, sodalı bir göldür.",
    explanation: "Türkiye'nin yüzölçümü en büyük gölü Van Gölü'dür."
  },
  {
    question: "Türkiye'nin en uzun nehri hangisidir?",
    options: [
      "Sakarya",
      "Kızılırmak",
      "Fırat",
      "Yeşilırmak"
    ],
    correctIndex: 2,
    hint: "Doğu Anadolu'dan doğup Irak'a doğru akar.",
    explanation: "Türkiye sınırları içinde en uzun nehir Kızılırmak'tır (Fırat, Türkiye içindeki en uzun nehir olsa da kaynağı Türkiye'de olup yurt dışına akan nehirler arasında en uzunudur; Kızılırmak ise tamamen Türkiye sınırları içinde kalan en uzun nehirdir)."
  },
  {
    question: "İstanbul Boğazı hangi iki denizi birbirine bağlar?",
    options: [
      "Ege ve Akdeniz",
      "Marmara ve Ege",
      "Akdeniz ve Karadeniz",
      "Karadeniz ve Marmara"
    ],
    correctIndex: 3,
    hint: "İstanbul şehrinin ortasından geçer.",
    explanation: "İstanbul Boğazı, Karadeniz ile Marmara Denizi'ni birbirine bağlar."
  },
  {
    question: "Türkiye kaç coğrafi bölgeye ayrılır?",
    options: [
      "7",
      "5",
      "6",
      "8"
    ],
    correctIndex: 0,
    hint: "Marmara, Ege, Akdeniz, İç Anadolu, Karadeniz, Doğu Anadolu, Güneydoğu Anadolu.",
    explanation: "Türkiye 7 coğrafi bölgeye ayrılır."
  },
  {
    question: "Türkiye'nin başkenti neresidir?",
    options: [
      "İstanbul",
      "Ankara",
      "İzmir",
      "Bursa"
    ],
    correctIndex: 1,
    hint: "Cumhuriyetin ilanıyla başkent olmuştur.",
    explanation: "Türkiye'nin başkenti Ankara'dır."
  },
  {
    question: "Kapadokya bölgesi hangi ilimizde yer alır?",
    options: [
      "Konya",
      "Kayseri",
      "Nevşehir",
      "Aksaray"
    ],
    correctIndex: 2,
    hint: "Peribacaları ile ünlüdür.",
    explanation: "Kapadokya'nın merkezi Nevşehir ilidir."
  },
  {
    question: "Pamukkale travertenleri hangi ilimizdedir?",
    options: [
      "Aydın",
      "Muğla",
      "Manisa",
      "Denizli"
    ],
    correctIndex: 3,
    hint: "Antik Hierapolis kentiyle birlikte anılır.",
    explanation: "Pamukkale, Denizli iline bağlıdır."
  },
  {
    question: "Türkiye'nin nüfus bakımından en kalabalık şehri hangisidir?",
    options: [
      "İstanbul",
      "Ankara",
      "İzmir",
      "Bursa"
    ],
    correctIndex: 0,
    hint: "İki kıtaya yayılan tek şehrimizdir.",
    explanation: "Türkiye'nin en kalabalık şehri İstanbul'dur."
  },
  {
    question: "Türkiye hangi iki kıta üzerinde yer alır?",
    options: [
      "Avrupa - Afrika",
      "Asya - Avrupa",
      "Asya - Afrika",
      "Avrupa - Amerika"
    ],
    correctIndex: 1,
    hint: "Boğazlar bu iki kıtayı ayırır.",
    explanation: "Türkiye, Asya ve Avrupa kıtaları üzerinde yer alır."
  },
  {
    question: "Nemrut Dağı'ndaki dev heykelleriyle ünlü ören yeri hangi ildedir?",
    options: [
      "Şanlıurfa",
      "Malatya",
      "Adıyaman",
      "Diyarbakır"
    ],
    correctIndex: 2,
    hint: "Kommagene Krallığı'na aittir.",
    explanation: "Nemrut Dağı, Adıyaman ilinde yer alır."
  },
  {
    question: "Efes Antik Kenti hangi ilimizdedir?",
    options: [
      "Muğla",
      "Aydın",
      "Denizli",
      "İzmir"
    ],
    correctIndex: 3,
    hint: "Selçuk ilçesindedir.",
    explanation: "Efes Antik Kenti, İzmir'in Selçuk ilçesinde yer alır."
  },
  {
    question: "Dünyanın en büyük okyanusu hangisidir?",
    options: [
      "Büyük (Pasifik) Okyanus",
      "Atlas Okyanusu",
      "Hint Okyanusu",
      "Arktik Okyanus"
    ],
    correctIndex: 0,
    hint: "Asya ile Amerika kıtaları arasındadır.",
    explanation: "Dünyanın en büyük okyanusu Büyük (Pasifik) Okyanus'tur."
  },
  {
    question: "Dünyanın en yüksek dağı hangisidir?",
    options: [
      "K2",
      "Everest",
      "Kilimanjaro",
      "Mont Blanc"
    ],
    correctIndex: 1,
    hint: "Himalayalar'da, Nepal-Çin sınırındadır.",
    explanation: "Dünyanın en yüksek dağı, 8848 metreyle Everest Dağı'dır."
  },
  {
    question: "Dünyanın yüzölçümü en büyük ülkesi hangisidir?",
    options: [
      "Kanada",
      "Çin",
      "Rusya",
      "ABD"
    ],
    correctIndex: 2,
    hint: "Hem Avrupa hem Asya'da toprakları vardır.",
    explanation: "Dünyanın yüzölçümü en büyük ülkesi Rusya'dır."
  },
  {
    question: "Nüfus bakımından dünyanın en kalabalık ülkesi hangisidir?",
    options: [
      "Çin",
      "ABD",
      "Endonezya",
      "Hindistan"
    ],
    correctIndex: 3,
    hint: "2020'li yıllarda bu unvan el değiştirmiştir.",
    explanation: "Güncel verilere göre nüfus bakımından dünyanın en kalabalık ülkesi Hindistan'dır."
  },
  {
    question: "Sahra Çölü hangi kıtada yer alır?",
    options: [
      "Afrika",
      "Asya",
      "Avustralya",
      "Güney Amerika"
    ],
    correctIndex: 0,
    hint: "Dünyanın en büyük sıcak çölüdür.",
    explanation: "Sahra Çölü, Afrika kıtasında yer alır."
  },
  {
    question: "Amazon Yağmur Ormanları çoğunlukla hangi ülkede yer alır?",
    options: [
      "Kolombiya",
      "Brezilya",
      "Peru",
      "Venezuela"
    ],
    correctIndex: 1,
    hint: "Güney Amerika'nın en büyük ülkesidir.",
    explanation: "Amazon Yağmur Ormanları'nın büyük bölümü Brezilya sınırları içindedir."
  },
  {
    question: "Büyük Set Resifi (Great Barrier Reef) hangi ülke kıyılarındadır?",
    options: [
      "Yeni Zelanda",
      "Endonezya",
      "Avustralya",
      "Filipinler"
    ],
    correctIndex: 2,
    hint: "Dünyanın en büyük mercan resif sistemidir.",
    explanation: "Büyük Set Resifi, Avustralya'nın kuzeydoğu kıyılarındadır."
  },
  {
    question: "Dünyanın en kalabalık şehri (belediye sınırları içinde nüfus bakımından) genellikle hangisidir?",
    options: [
      "New York",
      "Şanghay",
      "Mumbai",
      "Tokyo"
    ],
    correctIndex: 3,
    hint: "Japonya'nın başkentidir.",
    explanation: "Büyükşehir bölgesi nüfus bakımından Tokyo, dünyanın en kalabalık şehir bölgelerinden biridir."
  },
  {
    question: "Aşağıdaki ülkelerden hangisi hem Asya hem Avrupa'da toprağa sahiptir?",
    options: [
      "Türkiye",
      "İran",
      "Suriye",
      "Irak"
    ],
    correctIndex: 0,
    hint: "Trakya ve Anadolu topraklarını kapsar.",
    explanation: "Türkiye, hem Asya (Anadolu) hem Avrupa'da (Trakya) toprağa sahip bir ülkedir."
  },
  {
    question: "Dünyanın en derin okyanus çukuru hangisidir?",
    options: [
      "Puerto Rico Çukuru",
      "Mariana Çukuru",
      "Tonga Çukuru",
      "Java Çukuru"
    ],
    correctIndex: 1,
    hint: "Pasifik Okyanusu'ndadır, yaklaşık 11.000 metre derinliktedir.",
    explanation: "Dünyanın en derin noktası, Pasifik'teki Mariana Çukuru'dur."
  },
  {
    question: "Victoria Şelalesi hangi iki ülke arasındadır?",
    options: [
      "Kenya-Tanzanya",
      "Güney Afrika-Namibya",
      "Zambiya-Zimbabve",
      "Mısır-Sudan"
    ],
    correctIndex: 2,
    hint: "Zambezi Nehri üzerindedir.",
    explanation: "Victoria Şelalesi, Zambiya ile Zimbabve sınırındadır."
  },
  {
    question: "Osmanlı Devleti'nin kurucusu kimdir?",
    options: [
      "Orhan Bey",
      "Ertuğrul Gazi",
      "I. Murad",
      "Osman Bey"
    ],
    correctIndex: 3,
    hint: "Devlete adını veren kişidir.",
    explanation: "Osmanlı Devleti'nin kurucusu Osman Bey'dir (Osman Gazi)."
  },
  {
    question: "İstanbul'u fetheden Osmanlı padişahı kimdir?",
    options: [
      "II. Mehmed (Fatih)",
      "II. Murad",
      "I. Selim",
      "Kanuni Sultan Süleyman"
    ],
    correctIndex: 0,
    hint: "'Fatih' unvanıyla anılır.",
    explanation: "İstanbul'u 1453'te fetheden padişah II. Mehmed'dir, yani Fatih Sultan Mehmed."
  },
  {
    question: "İstanbul hangi yılda fethedilmiştir?",
    options: [
      "1071",
      "1453",
      "1299",
      "1517"
    ],
    correctIndex: 1,
    hint: "Bizans İmparatorluğu'nun sonu oldu.",
    explanation: "İstanbul, 1453 yılında Osmanlılar tarafından fethedilmiştir."
  },
  {
    question: "Türkiye Cumhuriyeti hangi yılda kurulmuştur?",
    options: [
      "1919",
      "1920",
      "1923",
      "1938"
    ],
    correctIndex: 2,
    hint: "29 Ekim'de ilan edilmiştir.",
    explanation: "Türkiye Cumhuriyeti, 29 Ekim 1923'te kurulmuştur."
  },
  {
    question: "Türkiye Cumhuriyeti'nin kurucusu ve ilk cumhurbaşkanı kimdir?",
    options: [
      "İsmet İnönü",
      "Celal Bayar",
      "Kazım Karabekir",
      "Mustafa Kemal Atatürk"
    ],
    correctIndex: 3,
    hint: "Kurtuluş Savaşı'nın da önderidir.",
    explanation: "Türkiye Cumhuriyeti'nin kurucusu ve ilk cumhurbaşkanı Mustafa Kemal Atatürk'tür."
  },
  {
    question: "Malazgirt Savaşı hangi yılda yapılmıştır?",
    options: [
      "1071",
      "1176",
      "1299",
      "1453"
    ],
    correctIndex: 0,
    hint: "Anadolu'nun Türklere açılmasını sağlamıştır.",
    explanation: "Malazgirt Savaşı, 1071 yılında yapılmıştır."
  },
  {
    question: "Malazgirt Savaşı'nda Selçuklu ordusuna kim komuta etmiştir?",
    options: [
      "Tuğrul Bey",
      "Alparslan",
      "Melikşah",
      "Kutalmış"
    ],
    correctIndex: 1,
    hint: "Bizans İmparatoru'nu esir almıştır.",
    explanation: "Malazgirt Savaşı'nda Selçuklu ordusunun başında Sultan Alparslan bulunuyordu."
  },
  {
    question: "Kurtuluş Savaşı'nda Yunan ordusunun kesin olarak yenildiği meydan muharebesi hangisidir?",
    options: [
      "Sakarya Meydan Muharebesi",
      "İnönü Muharebeleri",
      "Büyük Taarruz (Başkomutanlık Meydan Muharebesi)",
      "Çanakkale Savaşı"
    ],
    correctIndex: 2,
    hint: "30 Ağustos zaferi bu muharebeyle kazanılmıştır.",
    explanation: "Yunan ordusunun kesin olarak yenilgiye uğratıldığı muharebe, Büyük Taarruz'dur (Başkomutanlık Meydan Muharebesi)."
  },
  {
    question: "Çanakkale Savaşları hangi yıllarda gerçekleşmiştir?",
    options: [
      "1912-1913",
      "1914-1918",
      "1919-1922",
      "1915-1916"
    ],
    correctIndex: 3,
    hint: "I. Dünya Savaşı içinde önemli bir cephedir.",
    explanation: "Çanakkale Savaşları esas olarak 1915-1916 yılları arasında yaşanmıştır."
  },
  {
    question: "İkinci Dünya Savaşı hangi yıl sona ermiştir?",
    options: [
      "1945",
      "1943",
      "1944",
      "1946"
    ],
    correctIndex: 0,
    hint: "Japonya'nın teslim olmasıyla bitmiştir.",
    explanation: "İkinci Dünya Savaşı, 1945 yılında sona ermiştir."
  },
  {
    question: "Antik Mısır'da firavunların gömüldüğü büyük taş yapılara ne ad verilir?",
    options: [
      "Zigurat",
      "Piramit",
      "Sfenks",
      "Obelisk"
    ],
    correctIndex: 1,
    hint: "Giza'daki üç büyük yapı örnektir.",
    explanation: "Antik Mısır'da firavunların gömüldüğü büyük taş yapılara piramit denir."
  },
  {
    question: "Roma İmparatorluğu'nun başkenti neresidir?",
    options: [
      "Atina",
      "Kartaca",
      "Roma",
      "İstanbul"
    ],
    correctIndex: 2,
    hint: "İmparatorluk adını bu şehirden almıştır.",
    explanation: "Roma İmparatorluğu'nun başkenti Roma şehridir."
  },
  {
    question: "Suyun kimyasal formülü nedir?",
    options: [
      "CO2",
      "O2",
      "NaCl",
      "H2O"
    ],
    correctIndex: 3,
    hint: "İki hidrojen bir oksijen atomundan oluşur.",
    explanation: "Suyun kimyasal formülü H2O'dur."
  },
  {
    question: "Güneş sistemindeki gezegenlerden Güneş'e en yakın olanı hangisidir?",
    options: [
      "Merkür",
      "Venüs",
      "Dünya",
      "Mars"
    ],
    correctIndex: 0,
    hint: "En küçük gezegendir.",
    explanation: "Güneş'e en yakın gezegen Merkür'dür."
  },
  {
    question: "İnsan vücudunda kanı pompalayan organ hangisidir?",
    options: [
      "Akciğer",
      "Kalp",
      "Karaciğer",
      "Böbrek"
    ],
    correctIndex: 1,
    hint: "Göğüs kafesinin sol tarafında yer alır.",
    explanation: "Kanı vücuda pompalayan organ kalptir."
  },
  {
    question: "Fotosentez olayı bitkilerin hangi organında gerçekleşir?",
    options: [
      "Kök",
      "Gövde",
      "Yaprak",
      "Çiçek"
    ],
    correctIndex: 2,
    hint: "Klorofil bu organda bulunur.",
    explanation: "Fotosentez, esas olarak bitkilerin yapraklarında gerçekleşir."
  },
  {
    question: "Dünya'nın uydusu (ayı) neresidir?",
    options: [
      "Mars",
      "Güneş",
      "Venüs",
      "Ay"
    ],
    correctIndex: 3,
    hint: "Gece gökyüzünde en parlak görünen gök cismidir.",
    explanation: "Dünya'nın doğal uydusu Ay'dır."
  },
  {
    question: "Periyodik tabloda 'O' sembolü hangi elementi ifade eder?",
    options: [
      "Oksijen",
      "Altın",
      "Demir",
      "Gümüş"
    ],
    correctIndex: 0,
    hint: "Solunum için gereklidir.",
    explanation: "'O' sembolü Oksijen elementini ifade eder."
  },
  {
    question: "İnsan vücudundaki en büyük organ hangisidir?",
    options: [
      "Karaciğer",
      "Deri",
      "Akciğer",
      "Beyin"
    ],
    correctIndex: 1,
    hint: "Vücudun dış yüzeyini kaplar.",
    explanation: "İnsan vücudundaki en büyük organ deridir."
  },
  {
    question: "Newton'un hareket yasalarıyla ünlü olduğu bilim dalı hangisidir?",
    options: [
      "Kimya",
      "Biyoloji",
      "Fizik",
      "Astronomi"
    ],
    correctIndex: 2,
    hint: "Yerçekimi yasasını da o keşfetmiştir.",
    explanation: "Isaac Newton, fizik bilimindeki katkılarıyla ünlüdür."
  },
  {
    question: "DNA'nın açılımı nedir?",
    options: [
      "Dinamik Nükleer Analiz",
      "Doğal Nükleer Aktivite",
      "Değişken Nörolojik Aktivite",
      "Deoksiribo Nükleik Asit"
    ],
    correctIndex: 3,
    hint: "Kalıtım bilgisini taşıyan moleküldür.",
    explanation: "DNA, Deoksiribo Nükleik Asit'in kısaltmasıdır."
  },
  {
    question: "Ses dalgalarının çalışılmasıyla ilgilenen fizik dalı hangisidir?",
    options: [
      "Akustik",
      "Optik",
      "Termodinamik",
      "Mekanik"
    ],
    correctIndex: 0,
    hint: "'Akustik' kelimesi konser salonu tasarımıyla da ilişkilendirilir.",
    explanation: "Ses dalgalarını inceleyen fizik dalına akustik denir."
  },
  {
    question: "Vücudumuzda oksijen taşıma görevini üstlenen kan hücreleri hangisidir?",
    options: [
      "Beyaz kan hücreleri",
      "Kırmızı kan hücreleri",
      "Trombositler",
      "Plazma hücreleri"
    ],
    correctIndex: 1,
    hint: "Kanın rengini bu hücreler verir.",
    explanation: "Oksijeni taşıyan kan hücreleri kırmızı kan hücreleridir (alyuvarlar)."
  },
  {
    question: "Elektrik akımının birimi nedir?",
    options: [
      "Volt",
      "Watt",
      "Amper",
      "Ohm"
    ],
    correctIndex: 2,
    hint: "Akımın şiddetini ölçer.",
    explanation: "Elektrik akımının birimi amperdir."
  },
  {
    question: "'Mona Lisa' tablosunun ressamı kimdir?",
    options: [
      "Michelangelo",
      "Rafaello",
      "Van Gogh",
      "Leonardo da Vinci"
    ],
    correctIndex: 3,
    hint: "Aynı zamanda bilim insanı ve mucittir.",
    explanation: "'Mona Lisa' tablosunu Leonardo da Vinci yapmıştır."
  },
  {
    question: "'Sefiller' romanının yazarı kimdir?",
    options: [
      "Victor Hugo",
      "Alexandre Dumas",
      "Emile Zola",
      "Balzac"
    ],
    correctIndex: 0,
    hint: "Fransız edebiyatının önemli isimlerindendir.",
    explanation: "'Sefiller' romanının yazarı Victor Hugo'dur."
  },
  {
    question: "'Romeo ve Juliet' oyununun yazarı kimdir?",
    options: [
      "Charles Dickens",
      "William Shakespeare",
      "Oscar Wilde",
      "Jane Austen"
    ],
    correctIndex: 1,
    hint: "İngiliz edebiyatının en ünlü oyun yazarıdır.",
    explanation: "'Romeo ve Juliet' oyunu William Shakespeare tarafından yazılmıştır."
  },
  {
    question: "Türk edebiyatının önemli şairlerinden 'Safahat' eserinin yazarı kimdir?",
    options: [
      "Yahya Kemal",
      "Necip Fazıl",
      "Mehmet Akif Ersoy",
      "Nazım Hikmet"
    ],
    correctIndex: 2,
    hint: "İstiklal Marşı'nın da şairidir.",
    explanation: "'Safahat' eseri Mehmet Akif Ersoy'a aittir."
  },
  {
    question: "Türkiye Cumhuriyeti'nin milli marşı olan İstiklal Marşı'nın bestecisi kimdir?",
    options: [
      "Zeki Üngör",
      "Cemal Reşit Rey",
      "Ahmed Adnan Saygun",
      "Osman Zeki Üngör"
    ],
    correctIndex: 3,
    hint: "Marşın sözleri Mehmet Akif Ersoy'a aittir.",
    explanation: "İstiklal Marşı'nın bestesi Osman Zeki Üngör'e aittir."
  },
  {
    question: "Ünlü ressam Vincent van Gogh hangi ülke asıllıdır?",
    options: [
      "Hollanda",
      "Fransa",
      "Belçika",
      "Almanya"
    ],
    correctIndex: 0,
    hint: "'Yıldızlı Gece' tablosuyla ünlüdür.",
    explanation: "Vincent van Gogh, Hollanda asıllı bir ressamdır."
  },
  {
    question: "Klasik müzikte 'dokuzuncu senfoni'siyle ünlü, sağırlığına rağmen beste yapmaya devam eden besteci kimdir?",
    options: [
      "Mozart",
      "Beethoven",
      "Bach",
      "Chopin"
    ],
    correctIndex: 1,
    hint: "Alman asıllı bir besteciydi.",
    explanation: "Dokuzuncu Senfoni'siyle ünlü, sağırlığına rağmen besteler yapan müzisyen Ludwig van Beethoven'dır."
  },
  {
    question: "'Kuyucaklı Yusuf' romanının yazarı kimdir?",
    options: [
      "Reşat Nuri Güntekin",
      "Yaşar Kemal",
      "Sabahattin Ali",
      "Halide Edip Adıvar"
    ],
    correctIndex: 2,
    hint: "Aynı yazarın 'Kürk Mantolu Madonna' adlı bir eseri daha vardır.",
    explanation: "'Kuyucaklı Yusuf' romanı Sabahattin Ali'ye aittir."
  },
  {
    question: "Dünyaca ünlü ressam Pablo Picasso hangi ülke asıllıdır?",
    options: [
      "İtalya",
      "Fransa",
      "Portekiz",
      "İspanya"
    ],
    correctIndex: 3,
    hint: "Kübizm akımının öncülerindendir.",
    explanation: "Pablo Picasso, İspanya asıllı bir ressamdır."
  },
  {
    question: "'Çalıkuşu' romanının yazarı kimdir?",
    options: [
      "Reşat Nuri Güntekin",
      "Halide Edip Adıvar",
      "Peyami Safa",
      "Ahmet Hamdi Tanpınar"
    ],
    correctIndex: 0,
    hint: "Feride adlı karakterle ünlüdür.",
    explanation: "'Çalıkuşu' romanı Reşat Nuri Güntekin'e aittir."
  },
  {
    question: "Dünya Kupası'nı en çok kazanan ülke hangisidir?",
    options: [
      "Almanya",
      "Brezilya",
      "Arjantin",
      "İtalya"
    ],
    correctIndex: 1,
    hint: "5 kez şampiyon olmuştur.",
    explanation: "FIFA Dünya Kupası'nı en çok kazanan ülke, 5 şampiyonlukla Brezilya'dır."
  },
  {
    question: "Olimpiyat Oyunları kaç yılda bir düzenlenir?",
    options: [
      "2",
      "3",
      "4",
      "5"
    ],
    correctIndex: 2,
    hint: "Yaz ve kış olimpiyatları birbirinden 2 yıl arayla yapılır.",
    explanation: "Olimpiyat Oyunları (yaz veya kış, kendi türünde) 4 yılda bir düzenlenir."
  },
  {
    question: "Basketbolda bir takım sahada kaç oyuncu ile oynar?",
    options: [
      "4",
      "6",
      "7",
      "5"
    ],
    correctIndex: 3,
    hint: "Voleybolda bu sayı 6'dır.",
    explanation: "Basketbolda bir takım sahada 5 oyuncu ile oynar."
  },
  {
    question: "Futbolda bir maçın normal süresi kaç dakikadır?",
    options: [
      "90",
      "80",
      "100",
      "120"
    ],
    correctIndex: 0,
    hint: "İki devre halinde oynanır.",
    explanation: "Futbolda normal maç süresi 90 dakikadır (45+45)."
  },
  {
    question: "Tenis sporunda bir 'set' kazanmak için genellikle kaç 'game' almak gerekir?",
    options: [
      "4",
      "6",
      "5",
      "7"
    ],
    correctIndex: 1,
    hint: "En az 2 fark ile kazanılması gerekir.",
    explanation: "Bir tenis setini kazanmak için genellikle en az 6 game almak (ve rakibe en az 2 fark atmak) gerekir."
  },
  {
    question: "Modern olimpiyat oyunlarının kurucusu kabul edilen kişi kimdir?",
    options: [
      "Juan Antonio Samaranch",
      "Avery Brundage",
      "Pierre de Coubertin",
      "Thomas Bach"
    ],
    correctIndex: 2,
    hint: "Fransız bir eğitimcidir.",
    explanation: "Modern olimpiyat oyunlarının kurucusu Pierre de Coubertin'dir."
  },
  {
    question: "Voleybolda bir set genellikle kaç sayıya kadar oynanır?",
    options: [
      "21",
      "30",
      "15",
      "25"
    ],
    correctIndex: 3,
    hint: "Beşinci (karar) seti hariç diğer setler için geçerlidir.",
    explanation: "Voleybolda normal setler (5. set hariç) 25 sayıya kadar oynanır."
  },
  {
    question: "Dünyanın en prestijli tenis turnuvalarından Wimbledon hangi ülkede düzenlenir?",
    options: [
      "İngiltere",
      "Fransa",
      "ABD",
      "Avustralya"
    ],
    correctIndex: 0,
    hint: "Çim kortlarda oynanan tek Grand Slam turnuvasıdır.",
    explanation: "Wimbledon turnuvası İngiltere'de düzenlenir."
  },
  {
    question: "Bir yılda kaç mevsim vardır?",
    options: [
      "2",
      "4",
      "3",
      "5"
    ],
    correctIndex: 1,
    hint: "İlkbahar, yaz, sonbahar, kış.",
    explanation: "Bir yılda 4 mevsim vardır."
  },
  {
    question: "Bir haftada kaç gün vardır?",
    options: [
      "5",
      "6",
      "7",
      "8"
    ],
    correctIndex: 2,
    hint: "Pazartesi'den Pazar'a kadar.",
    explanation: "Bir haftada 7 gün vardır."
  },
  {
    question: "Dünya'nın kendi ekseni etrafında bir tam dönüşü ne kadar sürer?",
    options: [
      "12 saat",
      "48 saat",
      "365 gün",
      "24 saat"
    ],
    correctIndex: 3,
    hint: "Gece ve gündüzün oluşmasına neden olur.",
    explanation: "Dünya, kendi ekseni etrafında yaklaşık 24 saatte bir tur döner."
  },
  {
    question: "Dünya'nın Güneş etrafındaki bir tam turu ne kadar sürer?",
    options: [
      "365 gün",
      "24 saat",
      "30 gün",
      "10 yıl"
    ],
    correctIndex: 0,
    hint: "Yıl kavramını oluşturur.",
    explanation: "Dünya, Güneş etrafında yaklaşık 365 günde bir tam tur atar."
  },
  {
    question: "Türkiye'de kullanılan para birimi nedir?",
    options: [
      "Euro",
      "Türk Lirası",
      "Dolar",
      "Sterlin"
    ],
    correctIndex: 1,
    hint: "Kısaltması TL veya ₺'dir.",
    explanation: "Türkiye'nin resmi para birimi Türk Lirası'dır."
  },
  {
    question: "Gökkuşağında kaç renk bulunur?",
    options: [
      "5",
      "6",
      "7",
      "8"
    ],
    correctIndex: 2,
    hint: "Kırmızı, turuncu, sarı, yeşil, mavi, lacivert, mor.",
    explanation: "Gökkuşağı geleneksel olarak 7 renkten oluşur."
  },
  {
    question: "İnsan vücudunda kaç kemik bulunur (yetişkin bir insanda)?",
    options: [
      "186",
      "226",
      "246",
      "206"
    ],
    correctIndex: 3,
    hint: "Bebeklerde bu sayı daha fazladır, büyürken bazı kemikler kaynaşır.",
    explanation: "Yetişkin bir insan vücudunda 206 kemik bulunur."
  },
  {
    question: "Bir metre kaç santimetredir?",
    options: [
      "100",
      "10",
      "1000",
      "10000"
    ],
    correctIndex: 0,
    hint: "Metrik sistemde 'santi' öneki yüzde biri ifade eder.",
    explanation: "1 metre 100 santimetreye eşittir."
  },
  {
    question: "Bir kilogram kaç gramdır?",
    options: [
      "10",
      "1000",
      "100",
      "10000"
    ],
    correctIndex: 1,
    hint: "'Kilo' öneki bin anlamına gelir.",
    explanation: "1 kilogram 1000 grama eşittir."
  },
  {
    question: "Dünyanın en hızlı kara hayvanı olarak bilinen hayvan hangisidir?",
    options: [
      "Aslan",
      "At",
      "Çita",
      "Antilop"
    ],
    correctIndex: 2,
    hint: "Kısa mesafelerde saatte 100 km'ye yakın hız yapabilir.",
    explanation: "Dünyanın en hızlı kara hayvanı çitadır."
  },
  {
    question: "En büyük memeli hayvan hangisidir?",
    options: [
      "Fil",
      "Zürafa",
      "Gergedan",
      "Mavi Balina"
    ],
    correctIndex: 3,
    hint: "Okyanuslarda yaşar.",
    explanation: "Dünyanın en büyük memelisi mavi balinadır."
  },
  {
    question: "Dünyada en çok konuşulan ana dil hangisidir (konuşan kişi sayısına göre)?",
    options: [
      "Mandarin Çincesi",
      "İngilizce",
      "İspanyolca",
      "Hintçe"
    ],
    correctIndex: 0,
    hint: "Çin'de konuşulan başlıca lehçedir.",
    explanation: "Ana dil olarak konuşan kişi sayısına göre dünyada en çok konuşulan dil Mandarin Çincesi'dir."
  },
  {
    question: "Satrançta bir oyuncunun başlangıçta kaç piyonu vardır?",
    options: [
      "6",
      "8",
      "10",
      "16"
    ],
    correctIndex: 1,
    hint: "Her sütunda bir tane bulunur.",
    explanation: "Satrançta her oyuncunun başlangıçta 8 piyonu vardır."
  },
  {
    question: "Bir yılın kaç ayı 31 çekmez (30 gün veya daha az)?",
    options: [
      "3",
      "5",
      "4",
      "7"
    ],
    correctIndex: 2,
    hint: "Şubat, Nisan, Haziran, Eylül, Kasım ayları arasından sayın.",
    explanation: "Bir yılda 4 ay 30 gün çeker (Nisan, Haziran, Eylül, Kasım); Şubat ise ayrıca 28/29 gün çeker."
  },
  {
    question: "Bilgisayarlarda 'byte' biriminin en küçük parçası nedir?",
    options: [
      "Pixel",
      "Kilobyte",
      "Megabyte",
      "Bit"
    ],
    correctIndex: 3,
    hint: "0 veya 1 değerini alır.",
    explanation: "Bir byte, 8 bit'ten oluşur; bit, verinin en küçük birimidir."
  },
  {
    question: "Dünyanın en büyük çölü (soğuk çöller dahil) hangisidir?",
    options: [
      "Antarktika",
      "Sahra",
      "Gobi",
      "Arabistan Çölü"
    ],
    correctIndex: 0,
    hint: "Soğuk çöller de çöl sayılır, buzul kaplı olması buna engel değildir.",
    explanation: "Yağış miktarı esas alındığında dünyanın en büyük çölü, buzullarla kaplı Antarktika'dır."
  },
  {
    question: "Bir insanın kalp atış hızı normal şartlarda dakikada ortalama kaç kez atar?",
    options: [
      "30-40",
      "60-100",
      "150-180",
      "200-250"
    ],
    correctIndex: 1,
    hint: "Yetişkinler için istirahat halindeki normal aralıktır.",
    explanation: "Yetişkin bir insanın istirahat halindeki kalp atış hızı genellikle dakikada 60-100 arasındadır."
  },
  {
    question: "Işığın boşluktaki hızı yaklaşık kaç km/saniyedir?",
    options: [
      "30.000",
      "150.000",
      "300.000",
      "1.000.000"
    ],
    correctIndex: 2,
    hint: "Evrendeki en yüksek hız kabul edilir.",
    explanation: "Işığın boşluktaki hızı yaklaşık 300.000 km/saniyedir."
  },
  {
    question: "Dünya üzerindeki en büyük kıta hangisidir?",
    options: [
      "Afrika",
      "Avrupa",
      "Kuzey Amerika",
      "Asya"
    ],
    correctIndex: 3,
    hint: "Hem nüfus hem yüzölçümü bakımından en büyüktür.",
    explanation: "Dünyanın en büyük kıtası Asya'dır."
  },
  {
    question: "'UNESCO' kısaltması hangi kurumu ifade eder?",
    options: [
      "Birleşmiş Milletler Eğitim, Bilim ve Kültür Örgütü",
      "Dünya Sağlık Örgütü",
      "Uluslararası Para Fonu",
      "Avrupa Birliği"
    ],
    correctIndex: 0,
    hint: "Dünya mirası listeleriyle tanınır.",
    explanation: "UNESCO, Birleşmiş Milletler Eğitim, Bilim ve Kültür Örgütü'nün kısaltmasıdır."
  },
  {
    question: "Bir 'yüzyıl' kaç yıldır?",
    options: [
      "10",
      "100",
      "50",
      "1000"
    ],
    correctIndex: 1,
    hint: "'Yüz' kelimesinden gelir.",
    explanation: "Bir yüzyıl 100 yıldır."
  },
  {
    question: "Sudoku ve benzeri bulmaca oyunlarının kökeni hangi ülkeye dayanır (modern popülerliği)?",
    options: [
      "Çin",
      "Kore",
      "Japonya",
      "Hindistan"
    ],
    correctIndex: 2,
    hint: "1980'lerde bu ülkede popülerleşmiştir.",
    explanation: "Sudoku, modern haliyle Japonya'da popülerlik kazanmıştır (kökeni ABD'ye dayansa da)."
  },
  {
    question: "Dünyanın en büyük adası hangisidir?",
    options: [
      "Madagaskar",
      "Borneo",
      "Yeni Gine",
      "Grönland"
    ],
    correctIndex: 3,
    hint: "Danimarka'ya bağlı özerk bir bölgedir.",
    explanation: "Dünyanın en büyük adası Grönland'dır."
  },
  {
    question: "'Wi-Fi' teknolojisi temel olarak neyi sağlar?",
    options: [
      "Kablosuz internet bağlantısı",
      "Şarj etme",
      "Ses kaydı",
      "Görüntü işleme"
    ],
    correctIndex: 0,
    hint: "Modemler bu teknolojiyi kullanır.",
    explanation: "Wi-Fi, kablosuz internet/ağ bağlantısı sağlayan bir teknolojidir."
  },
  {
    question: "Bir 'bayt' (byte) kaç bitten oluşur?",
    options: [
      "2",
      "8",
      "4",
      "16"
    ],
    correctIndex: 1,
    hint: "Bilgisayar biliminde temel bir birimdir.",
    explanation: "1 bayt, 8 bitten oluşur."
  },
  {
    question: "Türkiye'nin komşu ülke sayısı kaçtır?",
    options: [
      "6",
      "7",
      "8",
      "9"
    ],
    correctIndex: 2,
    hint: "Yunanistan, Bulgaristan, Gürcistan, Ermenistan, Azerbaycan (Nahçıvan), İran, Irak, Suriye.",
    explanation: "Türkiye'nin 8 komşu ülkesi vardır."
  },
  {
    question: "Aya ilk ayak basan astronot kimdir?",
    options: [
      "Buzz Aldrin",
      "Yuri Gagarin",
      "John Glenn",
      "Neil Armstrong"
    ],
    correctIndex: 3,
    hint: "'Küçük bir adım' sözüyle ünlüdür.",
    explanation: "Aya ilk ayak basan astronot Neil Armstrong'dur (1969)."
  },
  {
    question: "Uzaya çıkan ilk insan kimdir?",
    options: [
      "Yuri Gagarin",
      "Neil Armstrong",
      "Buzz Aldrin",
      "Alan Shepard"
    ],
    correctIndex: 0,
    hint: "Sovyet bir kozmonauttur.",
    explanation: "Uzaya çıkan ilk insan, Sovyet kozmonot Yuri Gagarin'dir (1961)."
  },
  {
    question: "Türkiye'de kullanılan alfabede kaç harf vardır?",
    options: [
      "26",
      "29",
      "28",
      "31"
    ],
    correctIndex: 1,
    hint: "Latin alfabesine dayanır ama bazı harfler eklenmiş/çıkarılmıştır.",
    explanation: "Türk alfabesinde 29 harf bulunur."
  }
];

async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question||'').trim()));

  const toAdd = [];
  genelKulturBatchYeni.forEach(q => {
    if(!existingTexts.has(q.question.trim())) toAdd.push(Object.assign({category:'genel_kultur'}, q));
  });

  console.log('Toplam hazırlanan soru:', genelKulturBatchYeni.length);
  console.log('Zaten var olan (atlanan):', genelKulturBatchYeni.length - toAdd.length);
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

  console.log(`\n✅ ${toAdd.length} yeni Genel Kültür sorusu eklendi.`);

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
