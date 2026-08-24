// Soru havuzunu Firestore'a TEK SEFERLİK yükler (workflow_dispatch ile elle çalıştırılır).
// Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar eklenmez, güvenle tekrar çalıştırılabilir.
// Bu parti: cennet-cehennem, tevbe/günah, aile hukuku, helal-haram, ashab unvanları,
// kıyamet alametleri, ek sure bilgisi gibi YENİ konularda İslami sorular.
// Önceki tüm partilerle (1498+ mevcut soru) çakışmaması için gerçek çalıştırmayla kontrol edilmiştir.

const admin = require('firebase-admin');

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı.');
  process.exit(1);
}
const serviceAccount = JSON.parse(serviceAccountRaw);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const islamiBuyukParti = [
  {
    question: "Kur'an-ı Kerim'de cennetin en yüksek makamına ne ad verilir?",
    options: [ 'Firdevs', 'Adn Cenneti', 'Naim Cenneti', "Me'va Cenneti" ],
    correctIndex: 0,
    hint: 'Genellikle en üstün cennet katmanı olarak anılır.',
    explanation: 'Cennetin en yüksek makamına Firdevs denir.'
  },
  {
    question: 'Cehennemin İslami kaynaklarda geçen isimlerinden biri hangisidir?',
    options: [ 'Firdevs', 'Cahim', 'Adn', 'Naim' ],
    correctIndex: 1,
    hint: "Kur'an'da azap yeri olarak anılan isimlerden biridir.",
    explanation: "Cehennemin isimlerinden biri Cahim'dir."
  },
  {
    question: 'İslam inancına göre cennet ve cehennem ne zaman var olacaktır?',
    options: [
      'Sadece kıyametten sonra yaratılacak',
      'Hiçbir zaman var olmayacak',
      'Şu anda da mevcuttur',
      'Sadece rüyada görülür'
    ],
    correctIndex: 2,
    hint: 'Ehl-i Sünnet inancına göre zaten yaratılmış durumdadırlar.',
    explanation: 'Ehl-i Sünnet inancına göre cennet ve cehennem şu anda da mevcuttur.'
  },
  {
    question: 'Kabir hayatına İslami terimle ne ad verilir?',
    options: [ 'Mahşer', 'Sırat', 'Mizan', 'Berzah' ],
    correctIndex: 3,
    hint: 'Dünya hayatı ile ahiret arasındaki ara dönemdir.',
    explanation: 'Ölümden kıyamete kadar geçen kabir hayatına berzah denir.'
  },
  {
    question: 'Kıyamet günü insanların hesaba çekilmek için toplanacağı yere ne ad verilir?',
    options: [ 'Arasat (Mahşer meydanı)', 'Berzah', 'Mahşer', 'Sırat' ],
    correctIndex: 0,
    hint: 'Toplanma ve hesap yeri anlamındadır.',
    explanation: 'Kıyamet günü insanların toplanacağı yere Arasat (Mahşer meydanı) denir.'
  },
  {
    question: 'Ahirette amellerin tartılacağı manevi teraziye ne ad verilir?',
    options: [ 'Sırat', 'Mizan', 'Berzah', 'Kevser' ],
    correctIndex: 1,
    hint: "'Terazi' anlamına gelir.",
    explanation: 'Amellerin tartılacağı teraziye Mizan denir.'
  },
  {
    question: 'Cehennemin üzerine kurulu olduğuna, cennete geçmek için üzerinden geçilmesi gerektiğine inanılan köprüye ne ad verilir?',
    options: [ 'Mizan', 'Kevser', 'Sırat', 'Arasat' ],
    correctIndex: 2,
    hint: 'Kıldan ince, kılıçtan keskin olarak tasvir edilir.',
    explanation: 'Cennete geçiş için üzerinden geçilecek köprüye Sırat denir.'
  },
  {
    question: "Cennette bulunduğuna inanılan, Hz. Peygamber'e verilen özel havuz/nehrin adı nedir?",
    options: [ 'Sırat', 'Mizan', 'Arasat', 'Kevser' ],
    correctIndex: 3,
    hint: "Aynı zamanda kısa bir Kur'an suresinin de adıdır.",
    explanation: "Hz. Peygamber'e verilen cennetteki özel havuza Kevser denir."
  },
  {
    question: "İşlenen bir günahtan pişman olup Allah'a dönmeye ne ad verilir?",
    options: [ 'Tevbe', 'Şükür', 'Sabır', 'İhlas' ],
    correctIndex: 0,
    hint: "'Dönmek' anlamına gelen bir kökten gelir.",
    explanation: "Günahtan pişman olup Allah'a dönmeye tevbe denir."
  },
  {
    question: "Affedilmeyeceği Kur'an'da özellikle belirtilen tek günah hangisidir (tevbe edilmediği sürece)?",
    options: [ 'Yalan söylemek', "Şirk (Allah'a ortak koşmak)", 'Gıybet etmek', 'Kibirlenmek' ],
    correctIndex: 1,
    hint: 'Tevhid inancının doğrudan karşıtıdır.',
    explanation: "Kur'an'a göre tevbe edilmediği sürece affedilmeyeceği belirtilen günah şirktir."
  },
  {
    question: 'Büyük günahlara İslami terimle ne ad verilir?',
    options: [ 'Sağir günahlar', 'Nafile günahlar', 'Kebair (büyük günahlar)', 'Vacip günahlar' ],
    correctIndex: 2,
    hint: "'Kebir' kelimesi büyük anlamına gelir.",
    explanation: 'Büyük günahlara kebair denir.'
  },
  {
    question: 'Küçük günahlara İslami terimle ne ad verilir?',
    options: [ 'Kebair', 'Farz-ı ayn', 'Vacip', 'Sagair (küçük günahlar)' ],
    correctIndex: 3,
    hint: "'Sağir' kelimesi küçük anlamına gelir.",
    explanation: 'Küçük günahlara sagair denir.'
  },
  {
    question: "Bir Müslümanın yaptığı hatadan dolayı Allah'tan bağışlanma dilemesine ne ad verilir?",
    options: [ 'İstiğfar', 'Şükür', 'Zikir', 'Tefekkür' ],
    correctIndex: 0,
    hint: "'Estağfirullah' ifadesiyle ilişkilidir.",
    explanation: "Allah'tan bağışlanma dilemeye istiğfar denir."
  },
  {
    question: "İslam'da evlilik akdinde kadına verilen ve onun hakkı olan mal/paraya ne ad verilir?",
    options: [ 'Zekat', 'Mehir', 'Fidye', 'Sadaka' ],
    correctIndex: 1,
    hint: 'Evlilik sözleşmesinin bir parçasıdır.',
    explanation: 'Evlilikte kadına verilen mala mehir denir.'
  },
  {
    question: 'İslam hukukunda boşanmaya ne ad verilir?',
    options: [ 'Nikah', 'Mehir', 'Talak', 'İddet' ],
    correctIndex: 2,
    hint: 'Kocanın eşinden ayrılma hakkını ifade eder.',
    explanation: 'İslam hukukunda boşanmaya talak denir.'
  },
  {
    question: 'Boşanan veya eşi vefat eden bir kadının, yeniden evlenebilmesi için beklemesi gereken süreye ne ad verilir?',
    options: [ 'Talak', 'Mehir', 'Nafaka', 'İddet' ],
    correctIndex: 3,
    hint: 'Bu süre genellikle birkaç ay olarak belirlenmiştir.',
    explanation: 'Kadının yeniden evlenmeden önce beklemesi gereken süreye iddet denir.'
  },
  {
    question: 'Ailede erkeğin eşine ve çocuklarına sağlamakla yükümlü olduğu maddi geçime ne ad verilir?',
    options: [ 'Nafaka', 'Mehir', 'Zekat', 'Sadaka' ],
    correctIndex: 0,
    hint: 'Geçim/bakım masraflarını ifade eder.',
    explanation: 'Ailenin geçimi için sağlanan maddi desteğe nafaka denir.'
  },
  {
    question: "İslam'da domuz eti neden haram kabul edilir?",
    options: [
      'Pahalı olduğu için',
      'Dini hükümle açıkça yasaklandığı için',
      'Az bulunduğu için',
      'Sadece gelenek olduğu için'
    ],
    correctIndex: 1,
    hint: "Kur'an'da açıkça belirtilmiştir.",
    explanation: "Domuz eti, Kur'an-ı Kerim'de açıkça haram kılınmıştır."
  },
  {
    question: 'İslami usullere uygun şekilde kesilen hayvan etine ne ad verilir?',
    options: [ 'Haram et', 'Mekruh et', 'Helal (Kesim şartlarına uygun) et', 'Şüpheli et' ],
    correctIndex: 2,
    hint: 'Besmele ile kesim şartı vardır.',
    explanation: 'İslami usullere uygun kesilen ete helal et denir.'
  },
  {
    question: "İslam'da alkollü içeceklerin haram kılınmasının temel sebeplerinden biri nedir?",
    options: [ 'Pahalı olması', 'Az bulunması', 'Yabancı ürün olması', 'Aklı örtmesi/etkilemesi' ],
    correctIndex: 3,
    hint: "'Sarhoşluk veren' anlamına gelen 'hamr' kelimesiyle ilişkilidir.",
    explanation: 'Alkollü içecekler, aklı örttüğü/etkilediği için haram kılınmıştır.'
  },
  {
    question: 'Dinen şüpheli olan, helal mi haram mı olduğu net olmayan şeylere ne ad verilir?',
    options: [ 'Şüpheli (müştebihat)', 'Haram', 'Mekruh', 'Mübah' ],
    correctIndex: 0,
    hint: "'Şüphe' kelimesinden türemiştir.",
    explanation: 'Helal mi haram mı olduğu net olmayan şeylere müştebihat (şüpheli şeyler) denir.'
  },
  {
    question: 'Hz. Peygamber tarafından hayattayken cennetle müjdelenen 10 sahabeye ne ad verilir?',
    options: [ 'Ashab-ı Suffe', 'Aşere-i Mübeşşere', 'Ashab-ı Bedir', 'Muhacirin' ],
    correctIndex: 1,
    hint: "'On müjdelenmiş' anlamına gelir.",
    explanation: 'Hayattayken cennetle müjdelenen 10 sahabeye Aşere-i Mübeşşere denir.'
  },
  {
    question: "Mekke'den Medine'ye göç eden Müslümanlara ne ad verilir?",
    options: [ 'Ensar', 'Ashab-ı Suffe', 'Muhacirin', 'Tabiin' ],
    correctIndex: 2,
    hint: "'Göç edenler' anlamına gelir.",
    explanation: "Mekke'den Medine'ye göç eden Müslümanlara Muhacirin denir."
  },
  {
    question: "Medine'de hicret eden Müslümanlara ev sahipliği yapan, onlara yardım eden yerli Müslümanlara ne ad verilir?",
    options: [ 'Muhacirin', 'Tabiin', 'Ashab-ı Suffe', 'Ensar' ],
    correctIndex: 3,
    hint: "'Yardımcılar' anlamına gelir.",
    explanation: "Medine'de hicret edenlere yardım eden yerli Müslümanlara Ensar denir."
  },
  {
    question: "Hz. Peygamber'i görmüş ve iman etmiş kişilere ne ad verilir?",
    options: [ 'Sahabe', 'Tabiin', 'Tebe-i Tabiin', 'Ensar' ],
    correctIndex: 0,
    hint: "'Arkadaş, yoldaş' anlamına gelen kelimeden gelir.",
    explanation: "Hz. Peygamber'i görmüş ve iman etmiş kişilere sahabe denir."
  },
  {
    question: "Sahabeyi görmüş olan, ancak Hz. Peygamber'i görmemiş olan Müslüman nesle ne ad verilir?",
    options: [ 'Sahabe', 'Tabiin', 'Ensar', 'Muhacirin' ],
    correctIndex: 1,
    hint: 'Sahabeden sonraki nesildir.',
    explanation: 'Sahabeyi görmüş olan sonraki nesle tabiin denir.'
  },
  {
    question: 'İslam inancına göre kıyametin kesin olarak ne zaman kopacağını sadece kim bilir?',
    options: [ 'Melekler', 'Peygamberler', 'Sadece Allah', 'Alimler' ],
    correctIndex: 2,
    hint: 'Bu bilgi gaybe aittir.',
    explanation: 'Kıyametin ne zaman kopacağını sadece Allah bilir.'
  },
  {
    question: 'Kıyamet öncesi yaşanacağına inanılan, dünyada büyük fitne çıkaracağı belirtilen kişiye ne ad verilir?',
    options: [ 'Mehdi', 'İsa (a.s.)', 'Yecüc-Mecüc', 'Deccal' ],
    correctIndex: 3,
    hint: 'Yalancı ve aldatıcı özellikleriyle bilinir.',
    explanation: 'Kıyamet öncesi büyük fitne çıkaracağına inanılan kişiye Deccal denir.'
  },
  {
    question: 'İslam inancına göre kıyamete yakın gökten inerek Deccal ile mücadele edeceğine inanılan peygamber kimdir?',
    options: [ 'Hz. İsa', 'Hz. Musa', 'Hz. Nuh', 'Hz. İbrahim' ],
    correctIndex: 0,
    hint: 'Ölmediği, göğe yükseltildiği inancı vardır.',
    explanation: "Kıyamete yakın geleceğine inanılan peygamber Hz. İsa'dır (a.s.)."
  },
  {
    question: 'Kıyamet alametlerinden sayılan ve büyük bir tahribat yapacağına inanılan iki topluluğun adı nedir?',
    options: [ 'Ashab-ı Kehf', 'Yecüc ve Mecüc', 'Ashab-ı Fil', 'Sebe Halkı' ],
    correctIndex: 1,
    hint: "Kur'an'da da adı geçer.",
    explanation: 'Kıyamet alametlerinden biri olarak Yecüc ve Mecüc toplulukları anılır.'
  },
  {
    question: "Mekke'de indirilen surelere ne ad verilir?",
    options: [ 'Medeni sureler', 'Müstesna sureler', 'Mekki sureler', 'Muhkem sureler' ],
    correctIndex: 2,
    hint: 'Hicretten önce inen ayet/sureler bu gruba girer.',
    explanation: "Mekke'de indirilen surelere Mekki sureler denir."
  },
  {
    question: "Medine'de indirilen surelere ne ad verilir?",
    options: [ 'Mekki sureler', 'Müteşabih sureler', 'Muhkem sureler', 'Medeni sureler' ],
    correctIndex: 3,
    hint: 'Hicretten sonra inen ayet/sureler bu gruba girer.',
    explanation: "Medine'de indirilen surelere Medeni sureler denir."
  },
  {
    question: "Kur'an'da anlamı açık ve kesin olan ayetlere ne ad verilir?",
    options: [ 'Muhkem', 'Müteşabih', 'Mensuh', 'Nasih' ],
    correctIndex: 0,
    hint: "'Sağlam, açık' anlamına gelir.",
    explanation: 'Anlamı açık ve kesin olan ayetlere muhkem ayetler denir.'
  },
  {
    question: "Kur'an'da anlamı kapalı, yoruma açık olan ayetlere ne ad verilir?",
    options: [ 'Muhkem', 'Müteşabih', 'Mensuh', 'Nasih' ],
    correctIndex: 1,
    hint: "'Birbirine benzeyen, kapalı' anlamına gelir.",
    explanation: 'Anlamı kapalı ve yoruma açık olan ayetlere müteşabih ayetler denir.'
  },
  {
    question: "Kur'an-ı Kerim'de adı geçen ve mağarada uzun süre uyuduğuna inanılan gençlere ne ad verilir?",
    options: [ 'Ashab-ı Suffe', 'Ashab-ı Fil', 'Ashab-ı Kehf', 'Ashab-ı Uhdud' ],
    correctIndex: 2,
    hint: 'Adlarını taşıyan bir sure de vardır.',
    explanation: 'Mağarada uzun süre uyudukları anlatılan gençlere Ashab-ı Kehf denir.'
  },
  {
    question: "Kur'an-ı Kerim'de, fillerle Kabe'ye saldırmaya çalışan ancak başarısız olan orduyu anlatan sure hangisidir?",
    options: [ 'Kureyş suresi', 'Maun suresi', 'Kevser suresi', 'Fil suresi' ],
    correctIndex: 3,
    hint: "Ebrehe'nin ordusuyla ilgilidir.",
    explanation: "Fillerle Kabe'ye saldıran orduyu anlatan sure Fil suresidir."
  },
  {
    question: "İslam'da bir işe başlarken 'Bismillah' demenin faydalarından biri olarak ne öğütlenir?",
    options: [ 'İşin bereketli olması', 'İşin daha hızlı bitmesi', 'İşin ücretsiz olması', 'İşin tekrar edilmemesi' ],
    correctIndex: 0,
    hint: "Bereket ve Allah'ın yardımını dilemek amaçlanır.",
    explanation: "'Bismillah' demenin faydalarından biri, yapılan işin bereketli olmasını ummaktır."
  },
  {
    question: 'Cuma günü Müslümanlar için neden özel bir öneme sahiptir?',
    options: [
      'Sadece tatil günü olduğu için',
      'Cuma namazının bu günde kılınması',
      'Sadece ticaretin durduğu gün olduğu için',
      'Yılın son günü olduğu için'
    ],
    correctIndex: 1,
    hint: 'Haftalık toplu ibadet günüdür.',
    explanation: 'Cuma günü, Cuma namazının kılındığı ve Müslümanlar için özel öneme sahip bir gündür.'
  },
  {
    question: "Ramazan ayının içinde bulunan, 'bin aydan hayırlı' olarak nitelenen gece hangisidir?",
    options: [ 'Miraç Kandili', 'Berat Kandili', 'Kadir Gecesi', 'Mevlid Kandili' ],
    correctIndex: 2,
    hint: "Kur'an'ın indirilmeye başlandığı gece olduğu kabul edilir.",
    explanation: "'Bin aydan hayırlı' olarak nitelenen gece Kadir Gecesi'dir."
  },
  {
    question: "İslam'da beş vakit namazın dışında, bilhassa teşvik edilen gece namazına verilen genel isim nedir?",
    options: [ 'Farz namaz', 'Vacip namaz', 'Sünnet-i müekkede', 'Nafile (gönüllü) namaz' ],
    correctIndex: 3,
    hint: 'Zorunlu olmayan, gönüllü kılınan namazları kapsar.',
    explanation: 'Farz olmayan, gönüllü kılınan namazlara genel olarak nafile namaz denir.'
  },
  {
    question: "Kelime anlamı 'anmak, hatırlamak' olan ve Allah'ı anmak amacıyla yapılan ibadete ne ad verilir?",
    options: [ 'Zikir', 'Dua', 'Tövbe', 'Şükür' ],
    correctIndex: 0,
    hint: 'Tespih çekmek de bu kapsamdadır.',
    explanation: "Allah'ı anmak amacıyla yapılan ibadete zikir denir."
  },
  {
    question: "İslam'da 'infak' kelimesi ne anlama gelir?",
    options: [
      'Sadece zekat vermek',
      'Allah yolunda mal harcamak/yardım etmek',
      'Sadece hacca gitmek',
      'Sadece oruç tutmak'
    ],
    correctIndex: 1,
    hint: 'Zekattan daha geniş bir yardımlaşma kavramıdır.',
    explanation: 'İnfak, Allah yolunda ve ihtiyaç sahiplerine mal harcamak, yardım etmek anlamına gelir.'
  },
  {
    question: "İslam'da bir Müslümanın komşusuna, akrabasına ve muhtaçlara yardım etmesi hangi genel ahlaki ilkeyle açıklanır?",
    options: [ 'Riya', 'Kibir', 'İhsan ve cömertlik', 'Nifak' ],
    correctIndex: 2,
    hint: 'Güzel davranış ve cömertliği kapsar.',
    explanation: "Yardımlaşma ve cömertlik, İslam'da ihsan ilkesiyle açıklanır."
  },
  {
    question: "Kur'an-ı Kerim'i baştan sona bir kez hatasız okumaya (veya ezberden bitirmeye) ne ad verilir?",
    options: [ 'Tilavet', 'Hafızlık', 'Kıraat', 'Hatim' ],
    correctIndex: 3,
    hint: 'Ramazan ayında sıkça yapılan bir ameldir.',
    explanation: "Kur'an'ı baştan sona okumayı bitirmeye hatim denir."
  },
  {
    question: "İslam'da yalan yere yemin etmeye ne ad verilir?",
    options: [ 'Yemin-i Gamus', 'Yemin-i Sadıka', 'Yemin-i Lağv', 'Yemin-i Münakid' ],
    correctIndex: 0,
    hint: 'Bilerek yapılan yalan yemin türüdür.',
    explanation: 'Bilerek yapılan yalan yemine yemin-i gamus denir.'
  },
  {
    question: "Bir Müslümanın hasta bir kişiyi ziyaret etmesi İslam'da hangi kavramla teşvik edilir?",
    options: [ 'Kul hakkı', 'Hasta ziyareti (sünnet olan bir davranış)', 'Sadaka-i cariye', 'Riya' ],
    correctIndex: 1,
    hint: "Hz. Peygamber'in de teşvik ettiği bir davranıştır.",
    explanation: "Hasta ziyareti, İslam'da teşvik edilen sünnet bir davranıştır."
  },
  {
    question: "İslam'da 'emr-i bi'l-maruf nehy-i ani'l-münker' ilkesi ne anlama gelir?",
    options: [
      'Sadece namaz kılmak',
      'Sadece oruç tutmak',
      'İyiliği emretmek, kötülükten sakındırmak',
      'Sadece zekat vermek'
    ],
    correctIndex: 2,
    hint: 'Toplumsal sorumluluk ilkesidir.',
    explanation: 'Bu ilke, iyiliği emretmek ve kötülükten sakındırmak anlamına gelir.'
  },
  {
    question: "İslam'da 'takva' kavramı ne anlama gelir?",
    options: [
      'Sadece namaz kılmak',
      'Sadece zengin olmak',
      'Sadece hacca gitmek',
      "Allah'tan korkarak günahlardan sakınmak"
    ],
    correctIndex: 3,
    hint: 'Kalp temizliğiyle ilişkili bir kavramdır.',
    explanation: "Takva, Allah'tan korkarak günahlardan sakınma bilincidir."
  },
  {
    question: "İslam'da 'rıza' kavramı genellikle hangi bağlamda kullanılır?",
    options: [
      "Allah'ın veya kişinin memnuniyeti/onayı",
      'Sadece ticarette kullanılan bir terim',
      'Sadece miras hukukunda kullanılır',
      'Sadece cihatla ilgilidir'
    ],
    correctIndex: 0,
    hint: 'Hem Allah rızası hem kul rızası şeklinde kullanılabilir.',
    explanation: 'Rıza, memnuniyet ve onay anlamına gelir; Allah rızası önemli bir kavramdır.'
  },
  {
    question: "İslam'da kişinin yaptığı iyiliği başkalarına gösteriş amacıyla yapmasına ne ad verilir?",
    options: [ 'İhlas', 'Riya', 'Takva', 'Tevekkül' ],
    correctIndex: 1,
    hint: 'İhlasın zıttıdır.',
    explanation: 'Gösteriş amacıyla yapılan iyiliğe riya denir.'
  },
  {
    question: 'Bir işi sadece Allah rızası için, samimiyetle yapmaya ne ad verilir?',
    options: [ 'Riya', 'Nifak', 'İhlas', 'Kibir' ],
    correctIndex: 2,
    hint: "Riya'nın zıttıdır.",
    explanation: 'Bir işi samimiyetle sadece Allah rızası için yapmaya ihlas denir.'
  },
  {
    question: "İslam'da kibir (büyüklenme) hangi açıdan kötü bir davranış olarak görülür?",
    options: [
      'Sadece toplumsal açıdan hoş karşılanmaz',
      'Sadece zenginlerde görülen bir özellik olduğu için',
      'Hiçbir zaman kötü görülmez',
      "Şeytanın Allah'a isyan etme sebeplerinden biri olarak görülür"
    ],
    correctIndex: 3,
    hint: "İblis'in secde etmeme sebebiyle ilişkilendirilir.",
    explanation: "Kibir, İblis'in Allah'a isyan etmesinin sebeplerinden biri olarak görülür ve İslam'da kötülenmiştir."
  },
  {
    question: 'Müslümanların birbirlerine karşı sabırlı, hoşgörülü ve bağışlayıcı olmalarını öğütleyen ahlaki ilke nedir?',
    options: [ 'Hilm (yumuşak huyluluk)', 'Adalet', 'Cesaret', 'Cömertlik' ],
    correctIndex: 0,
    hint: 'Öfkeyi kontrol etmeyi de içerir.',
    explanation: "Sabırlı ve yumuşak huylu olmayı ifade eden kavram hilm'dir."
  },
  {
    question: "İslam'da adaletli davranmak, haksızlık yapmamak hangi temel ahlaki değerle ifade edilir?",
    options: [ 'Cömertlik', 'Adalet', 'Sabır', 'Tevazu' ],
    correctIndex: 1,
    hint: "Kur'an'da sıkça vurgulanan bir kavramdır.",
    explanation: 'Haksızlık yapmamak ve adaletli davranmak, adalet kavramıyla ifade edilir.'
  },
  {
    question: 'Kendini beğenmeme, alçakgönüllü davranma erdemine ne ad verilir?',
    options: [ 'Kibir', 'Riya', 'Tevazu', 'Gurur' ],
    correctIndex: 2,
    hint: 'Kibirin zıttıdır.',
    explanation: 'Alçakgönüllülük erdemine tevazu denir.'
  },
  {
    question: "Hz. Peygamber döneminde Bizans'a karşı yapılan ve komutanların şehit düştüğü savaş hangisidir?",
    options: [ 'Bedir Savaşı', 'Uhud Savaşı', 'Hendek Savaşı', 'Mute Savaşı' ],
    correctIndex: 3,
    hint: 'Zeyd b. Harise, Cafer b. Ebi Talib ve Abdullah b. Revaha bu savaşta şehit olmuştur.',
    explanation: "Bizans'a karşı yapılan ve önemli komutanların şehit düştüğü savaş Mute Savaşı'dır."
  },
  {
    question: "Hayber'in fethi hangi hicri yılda gerçekleşmiştir?",
    options: [ 'Hicri 7. yıl', 'Hicri 3. yıl', 'Hicri 5. yıl', 'Hicri 9. yıl' ],
    correctIndex: 0,
    hint: "Hudeybiye Antlaşması'ndan kısa süre sonradır.",
    explanation: "Hayber'in fethi Hicretin 7. yılında gerçekleşmiştir."
  },
  {
    question: "Mekke'nin fethinden sonra, Huneyn'de Müslümanlarla hangi kabile arasında savaş yaşanmıştır?",
    options: [ 'Kureyş', 'Hevazin', 'Gassaniler', 'Benî Kaynuka' ],
    correctIndex: 1,
    hint: "Mekke'nin fethinin hemen ardından gerçekleşmiştir.",
    explanation: 'Huneyn Savaşı, Müslümanlarla Hevazin kabilesi arasında yaşanmıştır.'
  },
  {
    question: 'Hz. Ömer döneminde İslam toprakları büyük ölçüde hangi yönde genişlemiştir?',
    options: [
      'Sadece Arabistan içinde kalmıştır',
      "Sadece Afrika'da",
      'İran ve Suriye/Filistin yönünde',
      "Sadece Endülüs'te"
    ],
    correctIndex: 2,
    hint: 'Sasani ve Bizans topraklarına doğru fetihler yapılmıştır.',
    explanation: 'Hz. Ömer döneminde İslam toprakları özellikle İran ve Suriye/Filistin yönünde genişlemiştir.'
  },
  {
    question: 'Endülüs (İber Yarımadası) İslam topraklarına hangi dönemde katılmıştır?',
    options: [ 'Hz. Ebu Bekir döneminde', 'Hz. Ömer döneminde', 'Osmanlılar döneminde', 'Emeviler döneminde' ],
    correctIndex: 3,
    hint: "Tarık bin Ziyad'ın fetihleriyle ilişkilidir.",
    explanation: 'Endülüs, Emeviler döneminde İslam topraklarına katılmıştır.'
  },
  {
    question: "Kur'an'da adı geçen, kavmine gönderilmiş ancak sadece ailesinden birkaç kişinin iman ettiği, en çok sabırla anılan peygamberlerden biri kimdir?",
    options: [ 'Hz. Nuh', 'Hz. Hud', 'Hz. Salih', 'Hz. Şuayb' ],
    correctIndex: 0,
    hint: '950 yıl tebliğ ettiği rivayet edilir.',
    explanation: "Kavmine uzun süre tebliğ eden ancak azınlığın iman ettiği peygamber Hz. Nuh'tur."
  },
  {
    question: "Hz. Yusuf'un (a.s.) kıssasında, onu satın alıp saraya götüren Mısırlı yetkilinin unvanı nedir (yaygın olarak bilinen)?",
    options: [ 'Firavun', 'Aziz', 'Vezir', 'Kral' ],
    correctIndex: 1,
    hint: "Mısır'da yüksek bir memuriyet unvanıdır.",
    explanation: "Hz. Yusuf'u satın alan kişi, Mısır'da 'Aziz' unvanlı bir yetkiliydi."
  },
  {
    question: "Hz. Süleyman'ın (a.s.) kıssasında, kendisine elçilik yapan ve Sebe Melikesi hakkında haber getiren kuş hangisidir?",
    options: [ 'Kartal', 'Güvercin', 'Hüdhüd (İbibik kuşu)', 'Bülbül' ],
    correctIndex: 2,
    hint: "Kur'an'da Neml suresinde anlatılır.",
    explanation: "Hz. Süleyman'a Sebe Melikesi hakkında haber getiren kuş Hüdhüd'dür."
  },
  {
    question: "Sebe Melikesi'nin adı, İslami kaynaklarda genellikle hangi isimle anılır?",
    options: [ 'Zenobia', 'Kleopatra', 'Nefertiti', 'Belkıs' ],
    correctIndex: 3,
    hint: "Hz. Süleyman'la olan kıssasıyla bilinir.",
    explanation: 'Sebe Melikesi, İslami kaynaklarda genellikle Belkıs adıyla anılır.'
  },
  {
    question: "Hz. Musa'nın (a.s.) kıssasında, ona ilim öğreten ve sabrını sınayan, Kur'an'da adı özel olarak anılmayan ancak yaygın olarak bilinen şahsın kim olduğu rivayet edilir?",
    options: [ 'Hızır', 'Hz. Harun', 'Firavun', 'Karun' ],
    correctIndex: 0,
    hint: 'Kehf suresinde anlatılan bir kıssadır.',
    explanation: "Hz. Musa'ya ilim öğreten ve İslami rivayetlerde Hızır olarak bilinen bir şahıstan bahsedilir."
  },
  {
    question: "Kur'an'da adı geçen, Hz. Musa'nın kavminden olup büyük servetiyle bilinen, kibri yüzünden yerin dibine batırıldığına inanılan kişi kimdir?",
    options: [ 'Firavun', 'Karun', 'Haman', 'Belam' ],
    correctIndex: 1,
    hint: "'Karun kadar zengin' deyimi ondan gelir.",
    explanation: "Serveti ve kibriyle bilinen, yerin dibine battığına inanılan kişi Karun'dur."
  },
  {
    question: "İslam'da ilim öğrenmenin hükmü genel olarak nasıl kabul edilir?",
    options: [
      'Yasaktır',
      'Sadece erkeklere farzdır',
      'Farzdır (bilgiye göre farz-ı ayn veya farz-ı kifaye)',
      'Sadece alimlere farzdır'
    ],
    correctIndex: 2,
    hint: "'İlim öğrenmek her Müslümana farzdır' şeklinde bir hadis vardır.",
    explanation: "İslam'da ilim öğrenmek, konusuna göre farz-ı ayn veya farz-ı kifaye kabul edilir."
  },
  {
    question: 'Osmanlı döneminde medreselerde eğitim veren, ilmiye sınıfının en üst kademesindeki alimlere ne ad verilir?',
    options: [ 'Müderris', 'Kadı', 'Müftü', 'Şeyhülislam' ],
    correctIndex: 3,
    hint: "Osmanlı'da dini işlerin en yüksek makamıdır.",
    explanation: 'Osmanlı ilmiye teşkilatının en üst makamı Şeyhülislamlıktır.'
  },
  {
    question: "İslam dünyasında ilk yükseköğretim kurumlarından biri kabul edilen, Fas'ta bulunan ve hâlâ faaliyette olan kurum hangisidir?",
    options: [ 'Karaviyyin Üniversitesi', 'El-Ezher', 'Nizamiye Medresesi', "Beytü'l-Hikme" ],
    correctIndex: 0,
    hint: 'Dünyanın en eski sürekli faaliyet gösteren üniversitesi kabul edilir.',
    explanation: "Fas'taki Karaviyyin Üniversitesi, dünyanın en eski üniversitelerinden biri kabul edilir."
  },
  {
    question: "Abbasiler döneminde Bağdat'ta kurulan, tercüme ve bilimsel çalışmaların yapıldığı önemli kurumun adı nedir?",
    options: [ 'Karaviyyin', "Beytü'l-Hikme (Hikmet Evi)", 'Nizamiye', 'El-Ezher' ],
    correctIndex: 1,
    hint: "'Hikmet Evi' anlamına gelir.",
    explanation: "Abbasiler döneminde Bağdat'ta kurulan önemli bilim merkezi Beytü'l-Hikme'dir."
  },
  {
    question: "Mısır'da bulunan ve dünyanın en eski ve önemli İslami eğitim kurumlarından biri sayılan cami/üniversite hangisidir?",
    options: [ 'Karaviyyin', 'Nizamiye', 'El-Ezher', 'Süleymaniye Medresesi' ],
    correctIndex: 2,
    hint: "Kahire'dedir.",
    explanation: "Mısır'daki önemli İslami eğitim kurumu El-Ezher'dir."
  },
  {
    question: "İslam'da ticarette ölçü ve tartıda hile yapmak nasıl değerlendirilir?",
    options: [ 'Serbesttir', 'Sadece mekruhtur', 'Sadece ayıptır, günah değildir', 'Haramdır, büyük günah sayılır' ],
    correctIndex: 3,
    hint: "Hz. Şuayb'ın kavmine gönderilme sebeplerinden biridir.",
    explanation: "İslam'da ölçü ve tartıda hile yapmak haram kabul edilir ve büyük günah sayılır."
  },
  {
    question: "İslam'da faizli işlemlere genel olarak ne ad verilir?",
    options: [ 'Riba (faiz)', 'Zekat', 'Sadaka', 'İnfak' ],
    correctIndex: 0,
    hint: "Kur'an'da açıkça yasaklanmıştır.",
    explanation: 'Faize İslami terimle riba denir ve haram kılınmıştır.'
  },
  {
    question: "İslam'da alışverişte tarafların karşılıklı rızasının önemi hangi ilkeyle vurgulanır?",
    options: [
      'Sadece yazılı sözleşme geçerlidir',
      'Rıza (karşılıklı gönül hoşluğu) esastır',
      'Sadece tanıklık şarttır',
      'Hiçbir şart aranmaz'
    ],
    correctIndex: 1,
    hint: "'Karşılıklı rıza ile olan ticaret' vurgusu vardır.",
    explanation: "İslam'da ticarette tarafların karşılıklı rızası (gönül hoşluğu) esastır."
  },
  {
    question: 'Zorluklara ve sıkıntılara karşı dayanıklı olma, isyan etmeme erdemine ne ad verilir?',
    options: [ 'Şükür', 'Tevekkül', 'Sabır', 'Rıza' ],
    correctIndex: 2,
    hint: 'Hz. Eyyüp bu erdemle örnek gösterilir.',
    explanation: 'Zorluklara dayanma erdemine sabır denir.'
  },
  {
    question: "Allah'ın verdiği nimetlere karşı minnettarlık duyma ve bunu ifade etme erdemine ne ad verilir?",
    options: [ 'Sabır', 'Tevekkül', 'Takva', 'Şükür' ],
    correctIndex: 3,
    hint: "'Elhamdülillah' demek bu erdemin bir parçasıdır.",
    explanation: 'Nimetlere karşı minnettarlık göstermeye şükür denir.'
  },
  {
    question: "Bir Müslümanın başına gelen musibetlere karşı 'İnna lillahi ve inna ileyhi raciun' demesi hangi durumda söylenir?",
    options: [ 'Bir musibet/kayıp yaşandığında', 'Sevinçli bir haber alındığında', 'Namaza başlarken', 'Yemek yerken' ],
    correctIndex: 0,
    hint: "'Biz Allah'a aitiz ve O'na döneceğiz' anlamına gelir.",
    explanation: 'Bu ifade, bir musibet veya kayıp yaşandığında söylenir.'
  },
  {
    question: "İslam'da 'ecel' kavramı ne anlama gelir?",
    options: [ 'Sadece hastalık', 'Ölüm anı/vakti', 'Sadece kaza', 'Sadece yaşlılık' ],
    correctIndex: 1,
    hint: 'Her canlı için belirlenmiş olduğuna inanılır.',
    explanation: 'Ecel, ölüm anı/vaktini ifade eder.'
  },
  {
    question: 'Hac veya umre sırasında giyilen, dikişsiz iki parça kumaştan oluşan kıyafete ne ad verilir (erkekler için)?',
    options: [ 'Kefen', 'Cübbe', 'İhram', 'Sarık' ],
    correctIndex: 2,
    hint: 'Hacca niyet edilince giyilir.',
    explanation: 'Hac/umrede giyilen dikişsiz kıyafete ihram denir.'
  },
  {
    question: 'Hac sırasında şeytan taşlama ibadetine ne ad verilir?',
    options: [ 'Tavaf', "Sa'y", 'Vakfe', 'Rami (Cemre)' ],
    correctIndex: 3,
    hint: "Mina'da belirli sütunlara taş atılır.",
    explanation: 'Şeytan taşlama ibadetine rami (cemreler) denir.'
  },
  {
    question: 'Hac ibadetinin farz olan rükünlerinden biri değildir?',
    options: [ 'Şeytan taşlama', 'İhrama girmek', 'Arafat vakfesi', 'Tavaf-ı ziyaret' ],
    correctIndex: 0,
    hint: 'Şeytan taşlama vaciptir, rükün değildir.',
    explanation: 'Şeytan taşlama (rami), haccın vaciplerinden sayılır, rükünlerinden değildir.'
  },
  {
    question: 'Umre veya hac sırasında ihramdan çıkarken erkeklerin saçlarını tamamen kestirmesine ne ad verilir?',
    options: [ 'Taksir', 'Halk', 'Rami', "Sa'y" ],
    correctIndex: 1,
    hint: 'Kısaltmaktan farklı olarak tamamen kesmeyi ifade eder.',
    explanation: 'Saçın tamamen kestirilmesine halk denir (kısaltmaya ise taksir denir).'
  },
  {
    question: 'Hicri takvimin ilk ayı hangisidir?',
    options: [ 'Safer', 'Ramazan', 'Muharrem', 'Zilhicce' ],
    correctIndex: 2,
    hint: 'Aşure günü de bu ayda anılır.',
    explanation: "Hicri takvimin ilk ayı Muharrem'dir."
  },
  {
    question: 'Regaib Kandili hangi ayın ilk cuma gecesinde kutlanır?',
    options: [ 'Ramazan', 'Şaban', 'Muharrem', 'Recep' ],
    correctIndex: 3,
    hint: 'Üç ayların başlangıcı sayılır.',
    explanation: 'Regaib Kandili, Recep ayının ilk cuma gecesinde kutlanır.'
  },
  {
    question: "'Üç aylar' olarak bilinen, manevi açıdan önemli sayılan aylar hangileridir?",
    options: [
      'Recep, Şaban, Ramazan',
      'Muharrem, Safer, Rebiülevvel',
      'Şevval, Zilkade, Zilhicce',
      'Cemaziyelevvel, Cemaziyelahir, Recep'
    ],
    correctIndex: 0,
    hint: 'Ramazan bu üçlünün sonuncusudur.',
    explanation: "'Üç aylar' Recep, Şaban ve Ramazan aylarıdır."
  },
  {
    question: 'Aşure günü hangi hicri ayın kaçıncı günü kutlanır?',
    options: [ 'Ramazan ayının 27. günü', 'Muharrem ayının 10. günü', 'Şaban ayının 15. günü', 'Recep ayının 1. günü' ],
    correctIndex: 1,
    hint: "Hz. Nuh'un gemisinin karaya oturduğu gün olduğuna da inanılır.",
    explanation: 'Aşure günü, Muharrem ayının 10. günüdür.'
  },
  {
    question: 'Miraç Kandili hangi ayda kutlanır?',
    options: [ 'Şaban', 'Ramazan', 'Recep', 'Muharrem' ],
    correctIndex: 2,
    hint: 'Recep ayının 27. gecesidir.',
    explanation: 'Miraç Kandili, Recep ayının 27. gecesinde kutlanır.'
  },
  {
    question: 'Berat Kandili hangi ayda kutlanır?',
    options: [ 'Recep', 'Ramazan', 'Zilhicce', 'Şaban' ],
    correctIndex: 3,
    hint: "Ramazan'dan hemen önceki aydır.",
    explanation: 'Berat Kandili, Şaban ayının 15. gecesinde kutlanır.'
  },
  {
    question: 'Mevlid Kandili neyi anmak için kutlanır?',
    options: [ "Hz. Peygamber'in doğumu", "Hz. Peygamber'in vefatı", "Hz. Peygamber'in hicreti", "Kur'an'ın inişi" ],
    correctIndex: 0,
    hint: 'Rebiülevvel ayında kutlanır.',
    explanation: "Mevlid Kandili, Hz. Peygamber'in doğumunu anmak için kutlanır."
  },
  {
    question: "Allah'ın varlığının delillerini akılla da temellendiren İslam alimlerine genel olarak ne ad verilir?",
    options: [ 'Fakih', 'Kelamcı (Mütekellim)', 'Muhaddis', 'Müfessir' ],
    correctIndex: 1,
    hint: "'Kelam ilmi' ile uğraşan kişilerdir.",
    explanation: 'Akli delillerle inanç konularını temellendiren alimlere kelamcı denir.'
  },
  {
    question: "Allah'ın isimlerine (Esma-ül Hüsna) göre kaç isim bulunduğu yaygın olarak bilinir?",
    options: [ '33', '66', '99', '100' ],
    correctIndex: 2,
    hint: "'En güzel isimler' anlamına gelir.",
    explanation: "Esma-ül Hüsna'nın (Allah'ın güzel isimlerinin) yaygın olarak 99 tane olduğu kabul edilir."
  },
  {
    question: "Allah'ın 'Rahman' ismi ne anlama gelir?",
    options: [
      'Çok bağışlayan',
      'Sadece ahirette merhamet eden',
      'Adaletli olan',
      'Dünyada tüm yaratıklara merhamet eden'
    ],
    correctIndex: 3,
    hint: 'Besmelede de geçer.',
    explanation: "'Rahman' ismi, dünyada tüm yaratıklara merhamet eden anlamına gelir."
  },
  {
    question: "Allah'ın 'Rahim' ismi ne anlama gelir?",
    options: [ 'Sadece müminlere ahirette merhamet eden', 'Adaletli olan', 'Her şeyi bilen', 'Güçlü olan' ],
    correctIndex: 0,
    hint: "Rahman'dan farklı olarak özellikle müminlere yöneliktir.",
    explanation: "'Rahim' ismi, özellikle müminlere (ahirette) merhamet eden anlamına gelir."
  },
  {
    question: "Allah'ın hiçbir şeye muhtaç olmaması, her şeyin O'na muhtaç olması durumunu ifade eden isim/sıfat nedir?",
    options: [ 'Kadir', 'Samed', 'Alim', 'Vedud' ],
    correctIndex: 1,
    hint: 'İhlas suresinde de geçer.',
    explanation: 'Hiçbir şeye muhtaç olmama sıfatı Samed ismiyle ifade edilir.'
  },
  {
    question: 'İslam inancına göre peygamberlerin sayısı hakkında yaygın kabul gören rakam nedir?',
    options: [ '25', '10', '124.000 (kesin sayı bilinmez)', '1000' ],
    correctIndex: 2,
    hint: "Kur'an'da sadece 25 tanesinin ismi geçer, ama toplam sayı için farklı rivayetler vardır.",
    explanation: "Kur'an'da 25 peygamberin adı geçer; toplam peygamber sayısı için ise 124.000 gibi rivayetler bulunur, kesin sayı Allah katındadır."
  },
  {
    question: "Kur'an-ı Kerim'de kıssası en çok anlatılan peygamber kimdir?",
    options: [ 'Hz. Nuh', 'Hz. İbrahim', 'Hz. Muhammed', 'Hz. Musa' ],
    correctIndex: 3,
    hint: 'Firavun ile mücadelesi birçok surede tekrar anlatılır.',
    explanation: "Kur'an'da kıssası en çok anlatılan peygamber Hz. Musa'dır (a.s.)."
  },
  {
    question: "Hz. İbrahim'in (a.s.) putperest babasının adı, İslami kaynaklarda genellikle nasıl geçer?",
    options: [ 'Azer', 'Nemrut', 'Karun', 'Firavun' ],
    correctIndex: 0,
    hint: "Kur'an'da bu isimle anılır.",
    explanation: "Hz. İbrahim'in babasının adı İslami kaynaklarda Azer olarak geçer."
  },
  {
    question: "Hz. İbrahim'i ateşe attıran, zalimliğiyle bilinen hükümdarın adı nedir (yaygın rivayete göre)?",
    options: [ 'Azer', 'Nemrut', 'Firavun', 'Karun' ],
    correctIndex: 1,
    hint: "'Nemrut gibi zalim' deyimi ondan gelir.",
    explanation: "Hz. İbrahim'i ateşe attıran zalim hükümdar, yaygın rivayete göre Nemrut'tur."
  },
  {
    question: "Hz. Musa'ya (a.s.) karşı gelen, zalimliğiyle bilinen Mısır hükümdarının unvanı nedir?",
    options: [ 'Nemrut', 'Kral', 'Firavun', 'Sultan' ],
    correctIndex: 2,
    hint: "Mısır'ın eski hükümdarlarına verilen genel unvandır.",
    explanation: "Hz. Musa döneminde Mısır hükümdarının unvanı Firavun'dur."
  },
  {
    question: 'Yatsı namazının farzı kaç rekattır?',
    options: [ '2', '3', '6', '4' ],
    correctIndex: 3,
    hint: 'Günün son vakit namazıdır.',
    explanation: 'Yatsı namazının farzı 4 rekattır.'
  },
  {
    question: 'İkindi namazının farzı kaç rekattır?',
    options: [ '4', '2', '3', '5' ],
    correctIndex: 0,
    hint: 'Öğleden sonraki vakit namazıdır.',
    explanation: 'İkindi namazının farzı 4 rekattır.'
  },
  {
    question: 'Vitir namazı hangi vakitte kılınır?',
    options: [ 'Sabah', 'Yatsıdan sonra', 'Öğle', 'İkindi' ],
    correctIndex: 1,
    hint: 'Yatsı namazının ardından kılınan vacip bir namazdır.',
    explanation: 'Vitir namazı, yatsı namazından sonra kılınır.'
  },
  {
    question: 'Bir Müslümanın hayatında bir kez yerine getirmekle yükümlü olduğu hac ibadetinin hükmü nedir (gücü yetenler için)?',
    options: [ 'Sünnet', 'Vacip', 'Farz', 'Mendup' ],
    correctIndex: 2,
    hint: "İslam'ın 5 şartından biridir.",
    explanation: 'Hac, gücü yetenler için farzdır.'
  },
  {
    question: "Namazda kıraat (Kur'an okuma) sırasında sesli okumanın gerekli olduğu namaz hangisidir?",
    options: [ 'Öğle namazı (imam için)', 'İkindi namazı', 'Cuma namazı hariç hepsi sessizdir', 'Sabah namazı' ],
    correctIndex: 3,
    hint: 'Sabah, akşam ve yatsı namazlarında imam sesli okur.',
    explanation: 'Sabah namazında (ve akşam, yatsıda) imam kıraati sesli okur.'
  }
];

async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question||'').trim()));

  const toAdd = [];
  islamiBuyukParti.forEach(q => {
    if(!existingTexts.has(q.question.trim())) toAdd.push(Object.assign({category:'islami'}, q));
  });

  console.log('Toplam hazırlanan soru:', islamiBuyukParti.length);
  console.log('Zaten var olan (atlanan):', islamiBuyukParti.length - toAdd.length);
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
