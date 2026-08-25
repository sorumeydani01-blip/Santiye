// Soru havuzunu Firestore'a TEK SEFERLİK yükler (workflow_dispatch ile elle çalıştırılır).
// Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar eklenmez, güvenle tekrar çalıştırılabilir.
// Bu parti: zekat sınıfları, abdest/gusül farzları, nafile oruçlar, kölelik/azat etme,
// ilk Müslümanlar, Ridde Savaşları gibi YENİ konularda İslami sorular.

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

const SCRIPT_NAME = 'seed-islami-ek-fikih-tarih'; // bu dosyanin kendi adi (kota tasarrufu takibi icin)

const islamiEkFikihTarih = [
  // ---------- ZEKAT VERİLECEK SINIFLAR ----------
  { question:"Kur'an-ı Kerim'de zekatın verileceği sınıflar kaç grup olarak sayılmıştır?", options:["4","6","8","10"], correctIndex:2, hint:"Tevbe suresinde bu sınıflar sayılır.", explanation:"Kur'an'da zekatın verileceği 8 sınıf sayılmıştır (Tevbe suresi 60. ayet)." },
  { question:"Zekat verilecek sınıflardan biri olan 'fakir' ile 'miskin' arasındaki genel fark nedir?", options:["Hiçbir fark yoktur","Fakir hiçbir şeyi olmayan, miskin az bir şeyi olandır (veya tam tersi görüşler vardır)","Miskin zengin demektir","Fakir sadece yaşlıları ifade eder"], correctIndex:1, hint:"Fıkıh alimleri arasında farklı görüşler vardır.", explanation:"Fakir ve miskin arasında, ihtiyaç derecesine göre ince bir ayrım yapıldığına dair farklı fıkhi görüşler bulunur." },
  { question:"Zekat toplama ve dağıtma işiyle görevlendirilen memurlara zekattan pay verilmesi, hangi sınıf kapsamında değerlendirilir?", options:["Fakir","Amilin (zekat memurları)","Yolda kalmış","Kalpleri ısındırılacaklar"], correctIndex:1, hint:"'Amil' kelimesi 'görevli' anlamına gelir.", explanation:"Zekat toplama görevlileri (amilin) de zekat verilecek sınıflardan biridir." },
  { question:"Borcu olan ve bu borcu ödeyemeyen kişilere zekat verilmesi hangi sınıf kapsamında değerlendirilir?", options:["Fakir","Garimin (borçlular)","Yolda kalmış","Kalpleri ısındırılacaklar"], correctIndex:1, hint:"'Garim' kelimesi 'borçlu' anlamına gelir.", explanation:"Borçlulara (garimin) zekat verilmesi, Kur'an'da sayılan sınıflardan biridir." },
  { question:"Yolculuk sırasında maddi sıkıntıya düşen, parası biten kişilere zekat verilmesi hangi sınıf kapsamında değerlendirilir?", options:["İbnü's-sebil (yolda kalmış)","Fakir","Garimin","Amilin"], correctIndex:0, hint:"'Yolun oğlu' anlamına gelir, yolcuları ifade eder.", explanation:"Yolculukta zor durumda kalanlara (ibnü's-sebil) zekat verilmesi Kur'an'da belirtilmiştir." },
  { question:"Zekatın hangi malı olanlara farz olduğu, genel olarak neye göre belirlenir?", options:["Sadece yaşa göre","Nisab miktarına ulaşan mala sahip olmaya göre","Sadece cinsiyete göre","Sadece mesleğe göre"], correctIndex:1, hint:"Belirli bir zenginlik eşiğidir.", explanation:"Zekat, nisab miktarına ulaşan mala sahip olan Müslümanlara farzdır." },

  // ---------- ABDEST VE GUSLÜN FARZLARI ----------
  { question:"Abdestin farzları kaç tanedir (Hanefi mezhebine göre)?", options:["2","3","4","5"], correctIndex:2, hint:"Yüz, kollar, mesh, ayaklar.", explanation:"Hanefi mezhebine göre abdestin farzları 4 tanedir: yüzü yıkamak, kolları dirseklerle beraber yıkamak, başın dörtte birini meshetmek, ayakları topuklarla beraber yıkamak." },
  { question:"Guslün farzları kaç tanedir (Hanefi mezhebine göre)?", options:["2","3","4","5"], correctIndex:1, hint:"Ağıza su vermek, buruna su vermek, tüm vücudu yıkamak.", explanation:"Hanefi mezhebine göre guslün farzları 3 tanedir: ağza su vermek (mazmaza), buruna su çekmek (istinşak), tüm vücudu yıkamak." },
  { question:"Abdest alırken ağza ve buruna su vermeye ne ad verilir?", options:["Mazmaza ve İstinşak","Mesh","İstinca","Teyemmüm"], correctIndex:0, hint:"İki ayrı eylemin adıdır.", explanation:"Ağza su vermeye mazmaza, buruna su çekmeye istinşak denir." },
  { question:"Abdestte başın bir kısmına ıslak elle dokunmaya ne ad verilir?", options:["Yıkama","Mesh","İstinca","Gusül"], correctIndex:1, hint:"Yıkamaktan farklı bir eylemdir.", explanation:"Islak elle dokunmaya mesh denir; abdestte başın meshedilmesi farzdır." },
  { question:"Mest (deriden yapılmış ayakkabı) giyen kişinin abdest alırken ayaklarını yıkamak yerine yapabileceği işleme ne ad verilir?", options:["Mesh üzerine mesh","Teyemmüm","İstinca","Gusül"], correctIndex:0, hint:"Belirli şartlarda uygulanabilen bir kolaylıktır.", explanation:"Mest üzerine mesh yapmak, belirli şartlarda ayakları yıkamak yerine uygulanabilen bir kolaylıktır." },

  // ---------- NAFİLE ORUÇLAR ----------
  { question:"Haftanın hangi günlerinde nafile oruç tutmak Hz. Peygamber'in sünnetinde özellikle teşvik edilmiştir?", options:["Cumartesi-Pazar","Pazartesi-Perşembe","Salı-Çarşamba","Cuma-Cumartesi"], correctIndex:1, hint:"Amellerin Allah'a arz edildiği günler olarak bilinir.", explanation:"Pazartesi ve Perşembe günleri oruç tutmak, Hz. Peygamber'in sünnetinde teşvik edilmiştir." },
  { question:"Her ayın 13, 14 ve 15. günlerinde tutulan nafile oruca ne ad verilir?", options:["Aşure orucu","Eyyam-ı Bid orucu","Şevval orucu","Muharrem orucu"], correctIndex:1, hint:"'Beyaz günler' anlamına gelir, ayın dolunay günlerine denk gelir.", explanation:"Her ayın 13-14-15. günlerinde tutulan oruca Eyyam-ı Bid orucu denir." },
  { question:"Ramazan Bayramı'ndan sonra, Şevval ayında tutulan 6 günlük nafile oruca ne ad verilir?", options:["Eyyam-ı Bid orucu","Şevval orucu (altı gün)","Muharrem orucu","Aşure orucu"], correctIndex:1, hint:"Bu orucun, bir yıl oruç tutmuş gibi sevap kazandırdığına dair hadis vardır.", explanation:"Şevval ayında tutulan 6 günlük nafile oruca Şevval orucu denir." },
  { question:"Zilhicce ayının ilk 9 gününde (özellikle Arefe günü) tutulan nafile orucun fazileti hangi hadisle bilinir?", options:["'Arefe orucu, bir önceki ve sonraki yılın günahlarına kefarettir'","Hiçbir fazileti yoktur","Sadece hacılar için geçerlidir","Sadece kadınlar tutar"], correctIndex:0, hint:"Hacca gitmeyenler için önemli bir nafile oruçtur.", explanation:"Arefe günü orucunun, iki yıllık günahlara kefaret olduğuna dair hadis rivayet edilir." },
  { question:"Hz. Davud'un (a.s.) oruç tutma şekli, hangi isimle anılır ve gün aşırı tutulur?", options:["Davud orucu (bir gün tutup bir gün tutmama)","Şevval orucu","Eyyam-ı Bid orucu","Aşure orucu"], correctIndex:0, hint:"En faziletli nafile oruç şekli olarak nitelenir.", explanation:"Bir gün tutup bir gün tutmama şeklindeki oruca Davud orucu denir." },

  // ---------- KURBAN İBADETİ DETAYLARI ----------
  { question:"Kurban kesmenin hükmü, İslam alimlerinin çoğunluğuna göre nasıldır (belirli şartları taşıyanlar için)?", options:["Farz","Vacip","Sünnet-i gayr-i müekkede","Mekruh"], correctIndex:1, hint:"Hanefi mezhebine göre bu hükümdedir.", explanation:"Kurban kesmek, Hanefi mezhebine göre belirli şartları taşıyanlar için vaciptir." },
  { question:"Kurban edilecek hayvanlarda büyükbaş (sığır, deve gibi) hayvanlar için kaç kişi ortak olabilir?", options:["3","5","7","10"], correctIndex:2, hint:"Küçükbaş hayvanlar sadece 1 kişi için kesilir.", explanation:"Büyükbaş hayvanlarda (sığır, deve) en fazla 7 kişi ortak olabilir." },
  { question:"Kurban bayramında kurban kesim süresi kaç gün devam eder?", options:["1 gün","2 gün","3 gün","4 gün"], correctIndex:2, hint:"Bayramın 1., 2. ve 3. günlerini kapsar.", explanation:"Kurban kesim süresi, bayramın 3 günü boyunca devam eder." },

  // ---------- KÖLELİK VE AZAT ETME TEŞVİKİ ----------
  { question:"İslam'ın köle azat etmeyi teşvik etme yöntemlerinden biri, hangi günahların kefareti olarak köle azat etmeyi göstermesidir?", options:["Sadece yalan söylemenin kefareti","Bazı büyük günahların/hataların kefareti (örn. yanlışlıkla adam öldürme)","Sadece namaz kılmamanın kefareti","Hiçbir kefaret yoktur"], correctIndex:1, hint:"Kur'an'da bazı hatalara kefaret olarak köle azadı gösterilir.", explanation:"İslam, bazı hataların (örneğin yanlışlıkla adam öldürme) kefareti olarak köle azat etmeyi teşvik etmiştir." },
  { question:"İlk Müslüman köle/azatlı olarak bilinen ve işkenceye rağmen imanından dönmeyen sahabe kimdir?", options:["Ammar b. Yasir","Bilal-i Habeşi","Selman-ı Farisi","Zeyd b. Harise"], correctIndex:1, hint:"Hz. Ebu Bekir tarafından satın alınıp azat edilmiştir.", explanation:"İşkenceye rağmen imanından dönmeyen, Hz. Ebu Bekir tarafından azat edilen sahabe Bilal-i Habeşi'dir." },
  { question:"Bilal-i Habeşi'yi işkence gören halinden satın alıp azat eden sahabe kimdir?", options:["Hz. Ömer","Hz. Ebu Bekir","Hz. Osman","Hz. Ali"], correctIndex:1, hint:"İlk halifedir.", explanation:"Bilal-i Habeşi'yi satın alıp azat eden sahabe Hz. Ebu Bekir'dir (r.a.)." },

  // ---------- İLK MÜSLÜMANLAR ----------
  { question:"İlk Müslüman kadın olarak kabul edilen kişi kimdir?", options:["Hz. Ayşe","Hz. Hatice","Hz. Fatıma","Hz. Sümeyye"], correctIndex:1, hint:"Hz. Peygamber'in ilk eşidir.", explanation:"İlk Müslüman kadın Hz. Hatice'dir (r.a.)." },
  { question:"İlk Müslüman çocuk/genç olarak kabul edilen kişi kimdir?", options:["Hz. Osman","Hz. Ali","Hz. Ömer","Zeyd b. Harise"], correctIndex:1, hint:"Hz. Peygamber'in himayesinde büyümüştür.", explanation:"İlk Müslüman çocuk/genç Hz. Ali'dir (r.a.)." },
  { question:"İlk Müslüman köle/azatlı olarak kabul edilen kişi kimdir?", options:["Bilal-i Habeşi","Zeyd b. Harise","Selman-ı Farisi","Ammar b. Yasir"], correctIndex:1, hint:"Hz. Peygamber'in evlatlık edindiği kişidir.", explanation:"İlk Müslüman köle/azatlı olarak kabul edilen kişi Zeyd b. Harise'dir." },
  { question:"İlk Müslüman yetişkin erkek (hür) olarak kabul edilen kişi kimdir?", options:["Hz. Ali","Hz. Ebu Bekir","Hz. Ömer","Hz. Osman"], correctIndex:1, hint:"'Sıddık' unvanıyla bilinir.", explanation:"İlk Müslüman yetişkin hür erkek Hz. Ebu Bekir'dir (r.a.)." },
  { question:"İslam'a giren ilk on kişiden biri olan ve 'Ashab-ı Suffe'nin de önde gelenlerinden sayılan, aynı zamanda meşhur bir tüccar olan sahabe kimdir?", options:["Abdurrahman b. Avf","Talha b. Ubeydullah","Zübeyr b. Avvam","Sa'd b. Ebi Vakkas"], correctIndex:0, hint:"Zenginliğiyle de bilinir, cömertliğiyle meşhurdur.", explanation:"İslam'a ilk girenlerden, zenginliği ve cömertliğiyle bilinen sahabe Abdurrahman b. Avf'tır." },

  // ---------- RİDDE SAVAŞLARI VE SAHTE PEYGAMBERLER ----------
  { question:"Hz. Peygamber'in vefatından sonra peygamberlik iddia eden sahte peygamberlerden en bilineni kimdir?", options:["Müseylimetü'l-Kezzab","Ebu Cehil","Ka'b b. Eşref","Ümeyye b. Halef"], correctIndex:0, hint:"'Yalancı Müseyleme' anlamına gelen bir unvanla anılır.", explanation:"Hz. Peygamber sonrası peygamberlik iddiasında bulunan en bilinen kişi Müseylimetü'l-Kezzab'dır." },
  { question:"Ridde Savaşları döneminde bazı kabileler İslam'ı kabul etmiş olmalarına rağmen hangi ibadeti reddetmiştir?", options:["Namaz","Zekat","Oruç","Hac"], correctIndex:1, hint:"Bu, Hz. Ebu Bekir'in kararlılıkla mücadele ettiği bir konuydu.", explanation:"Ridde döneminde bazı kabileler zekat vermeyi reddetmiştir." },
  { question:"Ridde Savaşları'nda İslam ordularına genel komutanlık yapan, birçok savaşta zafer kazanan ve 'Allah'ın Kılıcı' unvanıyla bilinen komutan kimdir?", options:["Halid b. Velid","Amr b. As","Sa'd b. Ebi Vakkas","Ubeyde b. Cerrah"], correctIndex:0, hint:"Uhud Savaşı'nda müşrik tarafında savaşmış, sonradan Müslüman olmuştur.", explanation:"Ridde Savaşları ve sonrasında büyük başarılar kazanan, 'Allah'ın Kılıcı' unvanlı komutan Halid b. Velid'dir." },

  // ---------- BÜYÜK FETİHLER ----------
  { question:"Kudüs'ün İslam orduları tarafından fethi hangi halife döneminde gerçekleşmiştir?", options:["Hz. Ebu Bekir","Hz. Ömer","Hz. Osman","Hz. Ali"], correctIndex:1, hint:"Halife bizzat şehre giderek teslim almıştır.", explanation:"Kudüs'ün fethi Hz. Ömer döneminde gerçekleşmiştir." },
  { question:"Mısır'ın İslam orduları tarafından fethi hangi komutan öncülüğünde gerçekleşmiştir?", options:["Halid b. Velid","Amr b. As","Sa'd b. Ebi Vakkas","Ubeyde b. Cerrah"], correctIndex:1, hint:"Kahire yakınlarında bir şehir onun adını taşır (Fustat).", explanation:"Mısır'ın fethi, komutan Amr b. As öncülüğünde gerçekleşmiştir." },
  { question:"Sasani (İran) İmparatorluğu'na karşı kazanılan ve İran topraklarının İslam'a açılmasını sağlayan önemli savaş hangisidir?", options:["Kadisiye Savaşı","Yermük Savaşı","Nihavend Savaşı","İkisi de doğru (Kadisiye ve Nihavend)"], correctIndex:3, hint:"Sasanilere karşı birden fazla önemli savaş yapılmıştır.", explanation:"Sasanilere karşı hem Kadisiye hem Nihavend savaşları, İran'ın fethinde önemli dönüm noktalarıdır." },
  { question:"Bizans'a karşı kazanılan ve Suriye'nin İslam topraklarına katılmasını sağlayan önemli savaş hangisidir?", options:["Kadisiye Savaşı","Yermük Savaşı","Nihavend Savaşı","Bedir Savaşı"], correctIndex:1, hint:"Hz. Ömer döneminde kazanılmıştır.", explanation:"Bizans'a karşı kazanılan ve Suriye'nin fethini sağlayan savaş Yermük Savaşı'dır." },

  // ---------- NAMAZ VAKİTLERİ VE KERAHET VAKİTLERİ ----------
  { question:"Namaz kılmanın mekruh (uygun olmayan) kabul edildiği vakitlerden biri hangisidir?", options:["Öğle vakti girdiğinde","Güneş doğarken","İkindiden sonra her zaman","Sabah namazından sonra her zaman"], correctIndex:1, hint:"Güneşin tam doğuş anıdır.", explanation:"Güneş doğarken (tam doğuş anında) namaz kılmak mekruh kabul edilir." },
  { question:"Namaz kılmanın mekruh olduğu vakitlerden biri, güneşin hangi durumudur?", options:["Tam tepede iken (istiva vakti, Cuma hariç)","Güneş doğarken değil","Öğleden sonra her zaman","Hiçbir zaman mekruh değildir"], correctIndex:0, hint:"Cuma günü hariç, öğle vaktine çok yakın bir zaman dilimidir.", explanation:"Güneşin tam tepede olduğu istiva vaktinde (Cuma günü hariç) namaz kılmak mekruhtur." },
  { question:"İkindi namazından sonra, güneş batana kadar olan sürede yeni bir nafile namaza başlamanın hükmü nedir?", options:["Serbesttir, teşvik edilir","Mekruhtur","Farzdır","Vaciptir"], correctIndex:1, hint:"Bu vakit, namaz kılmanın kerahet vakitlerinden biridir.", explanation:"İkindiden sonra güneş batana kadar yeni nafile namaza başlamak mekruh kabul edilir." },

  // ---------- KUR'AN'DA GEÇEN SAYILAR VE RAKAMLAR ----------
  { question:"Kur'an-ı Kerim'de adı geçen ve kıssasında '40 gün' ifadesi geçen olaylardan biri hangisidir?", options:["Hz. Musa'nın Tur Dağı'nda Allah ile buluşması için beklediği süre","Hz. Nuh'un tufanı","Hz. Yunus'un balığın karnında kalması","Hz. Yusuf'un zindanda kalması"], correctIndex:0, hint:"Tevrat'ın verilişiyle ilgilidir.", explanation:"Hz. Musa'nın Tur Dağı'nda Allah ile buluşma öncesi beklediği süre 40 gün olarak Kur'an'da belirtilir." },
  { question:"Ashab-ı Kehf kıssasında, gençlerin mağarada kaç yıl uyudukları Kur'an'da belirtilir?", options:["100 yıl","309 yıl","500 yıl","1000 yıl"], correctIndex:1, hint:"Kehf suresinde bu süre özellikle belirtilir.", explanation:"Ashab-ı Kehf'in mağarada 309 yıl (300 güneş yılı + fazlası) uyudukları Kur'an'da belirtilir." },
  { question:"Hz. Nuh'un (a.s.) kavmini kaç yıl boyunca tebliğ ettiği Kur'an'da belirtilir?", options:["500 yıl","950 yıl","100 yıl","1000 yıl"], correctIndex:1, hint:"Ankebut suresinde bu süre geçer.", explanation:"Hz. Nuh'un kavmini 950 yıl tebliğ ettiği Kur'an'da belirtilir." },

  // ---------- İSLAM'DA RÜYA TABİRİ ----------
  { question:"İslam'da rüyaların genel olarak kaça ayrıldığı kabul edilir?", options:["2 (doğru rüya, karışık rüya)","3 (Allah'tan, nefisten, şeytandan olan rüyalar)","5","Hiçbir sınıflandırma yoktur"], correctIndex:1, hint:"Kaynağına göre sınıflandırılır.", explanation:"Rüyalar genel olarak Allah'tan gelen (sadık rüya), nefisten kaynaklanan ve şeytandan olan rüyalar olarak 3'e ayrılır." },
  { question:"Kur'an'da rüya tabiri konusunda en çok bilinen kıssa hangi peygamberle ilgilidir?", options:["Hz. Musa","Hz. Yusuf","Hz. İbrahim","Hz. Süleyman"], correctIndex:1, hint:"Mısır'daki rüya yorumlarıyla ünlüdür.", explanation:"Rüya tabiriyle en çok bilinen kıssa Hz. Yusuf'a (a.s.) aittir." },

  // ---------- EK NAMAZ ÇEŞİTLERİ ----------
  { question:"Bir doğal afet, kuraklık gibi durumlarda yağmur duası amacıyla kılınan namaza ne ad verilir?", options:["İstiska namazı","Husuf namazı","Küsuf namazı","Teheccüd namazı"], correctIndex:0, hint:"'Su isteme' anlamına gelir.", explanation:"Yağmur duası amacıyla kılınan namaza istiska namazı denir." },
  { question:"Güneş tutulması sırasında kılınan namaza ne ad verilir?", options:["İstiska namazı","Küsuf namazı","Husuf namazı","Teravih namazı"], correctIndex:1, hint:"'Güneş tutulması' ile ilişkilidir.", explanation:"Güneş tutulmasında kılınan namaza küsuf namazı denir." },
  { question:"Ay tutulması sırasında kılınan namaza ne ad verilir?", options:["İstiska namazı","Küsuf namazı","Husuf namazı","Teravih namazı"], correctIndex:2, hint:"'Ay tutulması' ile ilişkilidir.", explanation:"Ay tutulmasında kılınan namaza husuf namazı denir." },
  { question:"Bir konuda kararsız kalındığında, doğru yolu bulmak için kılınan namaza ne ad verilir?", options:["İstihare namazı","İstiska namazı","Tahiyyetü'l-Mescid namazı","Teheccüd namazı"], correctIndex:0, hint:"'Hayırlısını isteme' anlamına gelir.", explanation:"Kararsızlık durumunda kılınan namaza istihare namazı denir." },
  { question:"Camiye girildiğinde, oturmadan önce kılınması tavsiye edilen 2 rekatlık namaza ne ad verilir?", options:["İstihare namazı","Tahiyyetü'l-Mescid namazı","Duha namazı","Evvabin namazı"], correctIndex:1, hint:"'Mescidi selamlama' anlamına gelir.", explanation:"Camiye girince kılınan bu namaza Tahiyyetü'l-Mescid namazı denir." },
  { question:"Kuşluk vaktinde kılınan nafile namaza ne ad verilir?", options:["Duha (Kuşluk) namazı","İşrak namazı","Evvabin namazı","Teheccüd namazı"], correctIndex:0, hint:"Güneş yükseldikten sonraki vakittir.", explanation:"Kuşluk vaktinde kılınan namaza Duha namazı denir." },
  { question:"Akşam namazından sonra kılınan nafile namaza ne ad verilir?", options:["Duha namazı","Evvabin namazı","İşrak namazı","İstihare namazı"], correctIndex:1, hint:"'Tevbe edenler' anlamıyla ilişkilidir.", explanation:"Akşam namazından sonra kılınan nafileye Evvabin namazı denir." },

  // ---------- İSLAM'DA GİYİM VE TESETTÜR ----------
  { question:"İslam'da erkeklerin ipek giymesi ve altın takı takması konusundaki genel hüküm nedir?", options:["Serbesttir","Genel olarak mekruh/haram kabul edilir","Farzdır","Sadece zenginler için serbesttir"], correctIndex:1, hint:"Kadınlar için bu konuda farklı bir hüküm vardır.", explanation:"Erkeklerin ipek giymesi ve altın takması, genel olarak mekruh/haram kabul edilir (kadınlar için bu kısıtlama yoktur)." },
  { question:"İslam'da kıyafetin temel amacı olarak Kur'an'da hangi kavramlar vurgulanır?", options:["Sadece süs","Örtünme ve süs (ziynet)","Sadece rahatlık","Hiçbir amaç belirtilmez"], correctIndex:1, hint:"A'raf suresinde bu konuya değinilir.", explanation:"Kur'an'da kıyafetin hem örtünme hem süslenme amacı taşıdığı belirtilir." },

  // ---------- EK ASHAB-I KİRAM DETAYLARI ----------
  { question:"'Zü'n-Nureyn' (iki nur sahibi) unvanıyla anılan, Hz. Peygamber'in iki kızıyla evlenen sahabe kimdir?", options:["Hz. Ali","Hz. Osman","Hz. Ebu Bekir","Hz. Ömer"], correctIndex:1, hint:"Kur'an'ı çoğaltan halifedir.", explanation:"'Zü'n-Nureyn' unvanıyla anılan sahabe Hz. Osman'dır (r.a.)." },
  { question:"Hz. Peygamber'in amcası olup, Uhud Savaşı'nda şehit olan ve 'Şehitlerin Efendisi' unvanıyla anılan sahabe kimdir?", options:["Ebu Talib","Hamza","Abbas","Akil"], correctIndex:1, hint:"Cesaretiyle bilinen bir sahabedir.", explanation:"'Şehitlerin Efendisi' unvanıyla anılan, Uhud'da şehit olan sahabe Hz. Hamza'dır." },
  { question:"On yaşındayken İslam ile şereflenen ve uzun yıllar Hz. Peygamber'e hizmet eden, hadis rivayetleriyle de bilinen sahabe kimdir?", options:["Enes b. Malik","Abdullah b. Ömer","Cabir b. Abdullah","Ebu Said el-Hudri"], correctIndex:0, hint:"10 yıl boyunca Hz. Peygamber'e hizmet etmiştir.", explanation:"On yaşında Müslüman olan ve uzun yıllar Hz. Peygamber'e hizmet eden sahabe Enes b. Malik'tir." },
  { question:"Hz. Peygamber'in 'cennetle müjdelenen' sahabelerinden biri olan ve ticaretteki başarısıyla bilinen, cömertliğiyle de öne çıkan sahabe kimdir?", options:["Sa'd b. Ebi Vakkas","Said b. Zeyd","Abdurrahman b. Avf","Ebu Ubeyde b. Cerrah"], correctIndex:2, hint:"Aşere-i Mübeşşere'den biridir, büyük bir tüccardı.", explanation:"Ticaretteki başarısı ve cömertliğiyle bilinen, Aşere-i Mübeşşere'den sahabe Abdurrahman b. Avf'tır." },

  // ---------- İSLAM'DA AİLE İÇİ İLİŞKİLER ----------
  { question:"İslam'da evlilikte eşler arasındaki temel ilkelerden biri, Kur'an'da hangi kavramla ifade edilir?", options:["Sevgi ve merhamet (Meveddet ve Rahmet)","Sadece itaat","Sadece görev paylaşımı","Hiçbir ilke belirtilmez"], correctIndex:0, hint:"Rum suresinde bu konuya değinilir.", explanation:"Kur'an'da eşler arasındaki ilişki, sevgi ve merhamet (meveddet ve rahmet) kavramlarıyla ifade edilir." },
  { question:"İslam'da çocuklara isim verme konusunda hangi genel prensip öğütlenir?", options:["Güzel ve anlamlı isimler seçmek","Herhangi bir isim önemli değildir","Sadece Arapça isimler zorunludur","İsim vermenin önemi yoktur"], correctIndex:0, hint:"Hz. Peygamber bazı kötü anlamlı isimleri değiştirmiştir.", explanation:"İslam'da çocuklara güzel ve anlamlı isimler verilmesi öğütlenir." },

  // ---------- EK GENEL BİLGİLER ----------
  { question:"İslam'da 'sünnet olma' (erkek çocukların sünnet edilmesi) uygulamasının kökeni, hangi peygamberin uygulamasına dayandırılır?", options:["Hz. Musa","Hz. İbrahim","Hz. Nuh","Hz. Adem"], correctIndex:1, hint:"İbrahim'in dini (Hanif dini) ile ilişkilendirilir.", explanation:"Sünnet olma geleneği, Hz. İbrahim'in uygulamasına dayandırılır." },
  { question:"İslam'da bir Müslümanın ölümünden sonra yıkanması, kefenlenmesi ve namazının kılınması hangi hükümdedir?", options:["Sünnet","Farz-ı kifaye (toplumdan bir kısmının yapmasıyla düşen farz)","Mekruh","Haram"], correctIndex:1, hint:"Herkes değil, bir grup yapınca yeterli olur.", explanation:"Cenaze yıkama, kefenleme ve namazı farz-ı kifayedir." },
  { question:"İslam'da bir kişinin vefatından sonra arkasından hayır dua edilmesi ve iyilikle anılması hangi ahlaki ilkeyle ilişkilidir?", options:["Ölüleri kötülemekten kaçınma ilkesi","Gıybet","Riya","Nifak"], correctIndex:0, hint:"'Ölülerinizi hayırla yad edin' anlayışı vardır.", explanation:"Vefat edenler hakkında kötü konuşmaktan kaçınma, İslam ahlakında önemli bir ilkedir." },
  { question:"İslam'da kabir ziyaretinin hükmü ve amacı nedir?", options:["Yasaktır","Ölümü hatırlamak ve ibret almak amacıyla meşrudur","Sadece kadınlar için yasaktır","Hiçbir amacı yoktur"], correctIndex:1, hint:"Hz. Peygamber başlangıçta yasaklamış, sonra izin vermiştir.", explanation:"Kabir ziyareti, ölümü hatırlatması ve ibret vermesi amacıyla meşru kabul edilir." },
  { question:"İslam'da taziye (baş sağlığı dileme) geleneğinin amacı nedir?", options:["Sadece bir formaliteten ibarettir","Kaybın acısını paylaşmak ve teselli etmek","Hiçbir dini dayanağı yoktur","Sadece zenginler için geçerlidir"], correctIndex:1, hint:"Toplumsal dayanışmayı güçlendiren bir gelenektir.", explanation:"Taziye, yakınını kaybeden kişiyi teselli etmek ve acısını paylaşmak amacı taşır." },
  { question:"İslam'da 'ümmet' kavramı ne anlama gelir?", options:["Sadece Araplar","Hz. Muhammed'e inanan tüm Müslümanlar topluluğu","Sadece Mekkeliler","Sadece Medineliler"], correctIndex:1, hint:"Din birliği etrafında toplanan topluluğu ifade eder.", explanation:"Ümmet, Hz. Muhammed'e (s.a.v.) inanan tüm Müslümanlar topluluğunu ifade eder." },
  { question:"İslam'da 'Ehl-i Kitap' terimi kimleri ifade eder?", options:["Sadece Müslümanları","Yahudi ve Hristiyanlar gibi kendilerine kitap indirilen toplulukları","Sadece Arapları","Sadece putperestleri"], correctIndex:1, hint:"Tevrat ve İncil'e inanan topluluklardır.", explanation:"Ehl-i Kitap, kendilerine ilahi kitap indirilen Yahudi ve Hristiyanlar gibi toplulukları ifade eder." },
  { question:"İslam hukukunda gayrimüslim vatandaşların can, mal ve din özgürlüklerinin korunması karşılığında ödediği vergiye ne ad verilir?", options:["Zekat","Cizye","Öşür","Haraç"], correctIndex:1, hint:"Sadece gayrimüslim erkeklerden alınan bir vergidir.", explanation:"Gayrimüslim vatandaşlardan alınan, can ve mal güvenliği karşılığı olan vergiye cizye denir." },
  { question:"İslam devletinde fethedilen topraklardan alınan toprak vergisine ne ad verilir?", options:["Cizye","Haraç","Zekat","Öşür"], correctIndex:1, hint:"Toprak ürünlerinden alınan bir vergi türüdür.", explanation:"Fethedilen topraklardan alınan vergiye haraç denir." },
  { question:"Müslümanların tarım ürünlerinden ödediği zekat türüne ne ad verilir?", options:["Cizye","Haraç","Öşür","Fitre"], correctIndex:2, hint:"'Onda bir' anlamına gelen bir orandan gelir.", explanation:"Tarım ürünlerinden ödenen zekata öşür denir." },
  { question:"İslam'da içki, kumar gibi şeylerin haram kılınmasının kademeli (aşamalı) bir şekilde gerçekleştiği bilinir. Bu yaklaşım hangi kavramla açıklanır?", options:["Tedric (kademeli hükmetme)","Nesih","İcma","Kıyas"], correctIndex:0, hint:"Toplumun alışkanlıklarının aniden değil, aşamalı olarak değiştirilmesini ifade eder.", explanation:"Bazı hükümlerin (örneğin içki yasağı) kademeli olarak konulmasına tedric denir." },
  { question:"Kur'an'da secde ayeti bulunan surelerden okuyucunun secde etmesi hangi hükümdedir?", options:["Farz","Vacip (Hanefi mezhebine göre) veya Sünnet (bazı mezheplere göre)","Haram","Hiçbir hükmü yoktur"], correctIndex:1, hint:"Mezheplere göre hüküm farklılık gösterir.", explanation:"Secde ayeti okunduğunda secde etmek, Hanefi mezhebine göre vaciptir, bazı mezheplere göre sünnettir." },
  { question:"İslam'da bir kişinin başka birine haksız yere zarar vermesi durumunda, zarar görenin hakkını alması ilkesine ne ad verilir?", options:["Kısas","Diyet","Keffaret","Fidye"], correctIndex:0, hint:"'Göze göz, dişe diş' ilkesiyle ilişkilendirilir.", explanation:"Haksız zarar durumunda uygulanan denk karşılık ilkesine kısas denir." },
  { question:"Kısas yerine, zarar gören tarafın rızasıyla ödenen maddi tazminata ne ad verilir?", options:["Kısas","Diyet","Zekat","Fitre"], correctIndex:1, hint:"Kısasa alternatif bir çözümdür.", explanation:"Kısas yerine ödenen maddi tazminata diyet denir." },
  { question:"İslam'da bir kişinin işlediği hataya karşılık yerine getirmesi gereken dini yükümlülüğe (örneğin oruç bozma cezası gibi) ne ad verilir?", options:["Kısas","Diyet","Keffaret","Fidye"], correctIndex:2, hint:"'Örtme, telafi etme' anlamına gelir.", explanation:"Belirli hatalara karşılık yerine getirilen dini yükümlülüğe keffaret denir." },

  // ---------- SON EK KONULAR: FIKIH VE TARİH ----------
  { question:"İslam hukukunda kişinin yaptığı bir işlemin (alışveriş, evlilik gibi) geçerli olması için gerekli temel şartlara ne ad verilir?", options:["Rükün ve şart","Sadece niyet","Sadece tanıklık","Hiçbir şart yoktur"], correctIndex:0, hint:"Fıkıh usulünde temel bir kavramdır.", explanation:"Bir işlemin geçerliliği için gerekli temel unsurlara rükün ve şart denir." },
  { question:"İslam hukukunda bir sözleşmenin batıl (geçersiz) veya fasid (kusurlu) olması arasındaki fark nedir?", options:["Hiçbir fark yoktur","Batıl temelden geçersizdir, fasid ise bazı şartları eksik olan bir işlemdir","Fasid daha ağır bir geçersizliktir","İkisi de aynı anlama gelir"], correctIndex:1, hint:"Fıkıh usulünde ince bir ayrımdır.", explanation:"Batıl işlem temelden geçersizdir; fasid işlem ise bazı şartları eksik olan, düzeltilebilir bir işlemdir." },
  { question:"İslam'da 'ictihad' kavramı ne anlama gelir?", options:["Sadece namaz kılmak","Bir konuda delillerden hüküm çıkarmak için çaba göstermek","Sadece dua etmek","Sadece zekat vermek"], correctIndex:1, hint:"Alimlerin hüküm çıkarma çabasını ifade eder.", explanation:"İctihad, bir konuda delillerden hüküm çıkarmak için gösterilen ilmi çabayı ifade eder." },
  { question:"İctihad yapabilecek yeterlilikte olan alime ne ad verilir?", options:["Müctehid","Muhaddis","Müfessir","Kari"], correctIndex:0, hint:"'İctihad eden' anlamına gelir.", explanation:"İctihad yapabilecek yeterlilikteki alime müctehid denir." },

  // ---------- EK TARİH: EMEVİLER VE ABBASİLER ----------
  { question:"Emeviler Devleti'nin kurucusu kimdir?", options:["Muaviye b. Ebu Süfyan","Abdülmelik b. Mervan","Velid b. Abdülmelik","Ömer b. Abdülaziz"], correctIndex:0, hint:"Hz. Ali ile mücadele eden kişidir.", explanation:"Emeviler Devleti'nin kurucusu Muaviye b. Ebu Süfyan'dır." },
  { question:"Emevi halifeleri arasında adaletiyle öne çıkan ve bazı kaynaklarda 'beşinci raşid halife' olarak da anılan kimdir?", options:["Muaviye","Ömer b. Abdülaziz","Velid b. Abdülmelik","Yezid b. Muaviye"], correctIndex:1, hint:"Kısa süren ama adaletli bir yönetimiyle bilinir.", explanation:"Adaletiyle öne çıkan ve bazen 'beşinci raşid halife' olarak anılan Emevi halifesi Ömer b. Abdülaziz'dir." },
  { question:"Abbasiler Devleti'nin kuruluşunda Emevilere karşı yapılan ihtilale ne ad verilir?", options:["Abbasi İhtilali","Ridde Savaşları","Sıffin Savaşı","Cemel Vakası"], correctIndex:0, hint:"Emevi hanedanının sonunu getirmiştir.", explanation:"Emevilere karşı yapılan ve Abbasilerin iktidara gelmesini sağlayan harekete Abbasi İhtilali denir." },
  { question:"Abbasiler döneminde İslam medeniyetinin bilim, sanat ve kültürde en parlak dönemini yaşadığı halife kimdir (yaygın kabule göre)?", options:["Harun Reşid","Me'mun","İkisi de bu döneme katkı sağlamıştır","Hiçbiri"], correctIndex:2, hint:"Bin Bir Gece Masalları'nda da adı geçer.", explanation:"Hem Harun Reşid hem oğlu Me'mun dönemleri, Abbasilerin bilim ve kültürde parlak dönemleridir." },

  // ---------- İSLAM'DA İTİKADİ FIRKA VE MEZHEPLER (GENEL BİLGİ) ----------
  { question:"İslam dünyasında Sünni ve Şii ayrımının temel kökeni hangi konuyla ilgilidir?", options:["Namaz vakitleri","Hz. Peygamber'den sonra halifeliğin/imametin kime ait olması gerektiği","Oruç süresi","Hac ibadetinin şekli"], correctIndex:1, hint:"Siyasi/itikadi bir ayrılıktır.", explanation:"Sünni-Şii ayrımının temel kökeni, Hz. Peygamber'den sonra liderliğin kime ait olması gerektiği tartışmasıdır." },
  { question:"'Ehl-i Sünnet vel Cemaat' terimi genel olarak neyi ifade eder?", options:["Sadece bir mezhebi","Hz. Peygamber'in ve sahabenin yolunu izleyen çoğunluk topluluğu","Sadece Hanefi mezhebini","Sadece tasavvuf ehlini"], correctIndex:1, hint:"Sünni İslam'ın genel kimliğini ifade eder.", explanation:"Ehl-i Sünnet vel Cemaat, Hz. Peygamber ve sahabenin yolunu izleyen geniş çoğunluk topluluğunu ifade eder." },

  // ---------- EK AHLAK VE İBADET ----------
  { question:"İslam'da kişinin sahip olduğu nimetleri başkalarına karşı üstünlük vesilesi yapmasına ne ad verilir (kınanan bir tutumdur)?", options:["Şükür","Ucub (kendini beğenme) ve kibir","Tevazu","Kanaat"], correctIndex:1, hint:"Nimetleri kendinden bilip böbürlenmeyi ifade eder.", explanation:"Nimetleri kendine mal edip böbürlenmeye ucub, bunun sonucunda oluşan büyüklenmeye kibir denir." },
  { question:"İslam'da başkalarının haklarına saygı gösterme, onlara zarar vermekten kaçınma ilkesine genel olarak ne ad verilir?", options:["Kul hakkına riayet","Riya","Nifak","Bidat"], correctIndex:0, hint:"Allah hakkından farklı olarak, insanlar arası hakları ifade eder.", explanation:"Başkalarının haklarına saygı gösterme ilkesine kul hakkına riayet denir." },
  { question:"İslam'da 'rıfk' kavramı ne anlama gelir?", options:["Sertlik","Yumuşaklık, nezaket","Kibir","Cimrilik"], correctIndex:1, hint:"Hz. Peygamber'in 'Rıfk sahibi olan hayırlıdır' sözüyle bilinir.", explanation:"Rıfk, yumuşaklık ve nezaket anlamına gelir." },
  { question:"İslam'da 'hayâ' kavramı ne anlama gelir?", options:["Cesaret","Utanma duygusu, edep","Kibir","Cimrilik"], correctIndex:1, hint:"'Hayâ imandandır' hadisiyle bilinir.", explanation:"Hayâ, utanma duygusu ve edep anlamına gelir." },
  { question:"İslam'da 'cömertlik' kavramının zıttı olan ve kınanan davranışa ne ad verilir?", options:["Sehavet","Cimrilik (buhl)","Kanaat","İhsan"], correctIndex:1, hint:"Malı paylaşmaktan kaçınmayı ifade eder.", explanation:"Cömertliğin zıttı olan ve kınanan davranışa cimrilik (buhl) denir." },
  { question:"İslam'da öfkeyi kontrol edebilme, sinirlenmeme erdemine ne ad verilir (sabırla ilişkili ama biraz farklı bir kavramdır)?", options:["Hilm","Kibir","Riya","Nifak"], correctIndex:0, hint:"Hz. Peygamber'in de örnek gösterdiği bir erdemdir.", explanation:"Öfkeyi kontrol edebilme erdemine hilm denir." },
  { question:"İslam'da doğruluk ve dürüstlük erdemine ne ad verilir?", options:["Sıdk","Kizb (yalan)","Nifak","Riya"], correctIndex:0, hint:"Yalanın (kizb) zıttıdır.", explanation:"Doğruluk ve dürüstlük erdemine sıdk denir." },
  { question:"İslam'da yalan söyleme davranışına ne ad verilir?", options:["Sıdk","Kizb","Vera","Zühd"], correctIndex:1, hint:"Doğruluğun (sıdk) zıttıdır.", explanation:"Yalan söylemeye kizb denir." },

  // ---------- EK PEYGAMBER SIFATLARI TEKRAR FARKLI SORULARLA ----------
  { question:"Peygamberlerin ortak sıfatlarından biri olan 'ismet' sıfatı, onların hangi özelliğini ifade eder?", options:["Zeki olmaları","Günahtan korunmuş olmaları","Zengin olmaları","Güçlü olmaları"], correctIndex:1, hint:"Daha önce de değinilen temel bir sıfattır.", explanation:"İsmet sıfatı, peygamberlerin günahtan korunmuş olmalarını ifade eder." },
  { question:"Peygamberlerin, kendilerine verilen vahyi/emaneti eksiksiz koruyup insanlara ulaştırma sıfatlarına (tebliğ ve emanet) neden ihtiyaç vardır?", options:["Mesajın bozulmadan ulaşmasını sağlamak için","Hiçbir sebebi yoktur","Sadece gelenek olduğu için","Zenginlik göstergesi olduğu için"], correctIndex:0, hint:"Vahyin güvenilirliğiyle ilgilidir.", explanation:"Tebliğ ve emanet sıfatları, ilahi mesajın bozulmadan insanlara ulaşmasını güvence altına alır." },

  // ---------- EK: İSLAM'DA ZAMAN VE MEKAN KAVRAMLARI ----------
  { question:"İslam'da mübarek kabul edilen ve içinde İsra-Miraç olayının gerçekleştiği gece hangi kandille anılır?", options:["Berat Kandili","Miraç Kandili","Kadir Gecesi","Mevlid Kandili"], correctIndex:1, hint:"Recep ayının 27. gecesidir.", explanation:"İsra-Miraç olayının gerçekleştiği gece Miraç Kandili olarak anılır." },
  { question:"İslam'da Cuma gününün, haftanın diğer günlerine göre taşıdığı özel önem neye dayanır?", options:["Sadece tatil günü olmasına","Toplu ibadet (Cuma namazı) ve manevi faziletlerine","Sadece ticaretin durmasına","Hiçbir özel önemi yoktur"], correctIndex:1, hint:"Haftalık toplu ibadet günüdür.", explanation:"Cuma gününün önemi, toplu ibadet (Cuma namazı) ve içerdiği manevi faziletlere dayanır." },

  // ---------- SON EKLEMELER ----------
  { question:"İslam'da bir Müslümanın, dinini öğrenirken ve yaşarken izlediği bilinen, sağlam kaynaklara dayanan yola ne ad verilir?", options:["Bidat","Sünnet (Hz. Peygamber'in yolu)","Nifak","Şirk"], correctIndex:1, hint:"Hz. Peygamber'in söz ve uygulamalarını ifade eder.", explanation:"Hz. Peygamber'in izlediği, söz ve uygulamalarıyla oluşan yola sünnet denir." },
  { question:"İslam'da kişinin kendi çabasıyla değil, sadece Allah'ın lütfuyla hidayete erdiğine inanılması hangi kavramla ilişkilidir?", options:["Hidayet (Allah'ın yol göstermesi)","Dalalet","Şirk","Nifak"], correctIndex:0, hint:"'Doğru yolu bulma' anlamına gelir.", explanation:"Kişinin doğru yola erişmesi, hidayet kavramıyla ifade edilir ve nihai olarak Allah'ın lütfuna bağlanır." },
  { question:"İslam'da doğru yoldan sapma, dalalete düşme durumuna ne ad verilir?", options:["Hidayet","Dalalet","Takva","İhsan"], correctIndex:1, hint:"Hidayetin zıttıdır.", explanation:"Doğru yoldan sapmaya dalalet denir." },
  { question:"İslam'da bir kişinin İslam'dan çıkmasına (dinden dönmesine) ne ad verilir?", options:["Nifak","İrtidat (Ridde)","Bidat","Şirk (aynı anlama gelmez ama ilişkilidir)"], correctIndex:1, hint:"Ridde Savaşları'nın da kökenidir.", explanation:"Bir kişinin İslam'dan çıkmasına irtidat (ridde) denir." },
  { question:"İslam'da görünüşte Müslüman gibi davranıp içten inanmayan kişilere ne ad verilir?", options:["Kafir","Münafık","Fasık","Zalim"], correctIndex:1, hint:"'İkiyüzlülük' ile ilişkilidir.", explanation:"Görünüşte Müslüman gibi davranıp içten inanmayan kişilere münafık denir." },
  { question:"İslam'da Allah'ın varlığını ve birliğini kabul etmeyen kişilere ne ad verilir?", options:["Münafık","Kafir","Fasık","Mümin"], correctIndex:1, hint:"'Örtmek, inkar etmek' kökünden gelir.", explanation:"Allah'ın varlığını/birliğini inkar eden kişilere kafir denir." },
  { question:"İslam'da inandığı halde büyük günah işleyen kişiye ne ad verilir (Ehl-i Sünnet'e göre imandan çıkmaz)?", options:["Kafir","Münafık","Fasık","Müşrik"], correctIndex:2, hint:"'Yoldan çıkan' anlamına gelir ama iman dairesinden çıkmaz.", explanation:"İnandığı halde büyük günah işleyen kişiye fasık denir; Ehl-i Sünnet'e göre bu kişi imandan çıkmış sayılmaz." },
  { question:"İslam'da Allah'a ibadet eden, emirlerine uyan kişiye ne ad verilir?", options:["Kafir","Fasık","Mümin","Münafık"], correctIndex:2, hint:"'İnanan' anlamına gelir.", explanation:"Allah'a iman edip ibadet eden kişiye mümin denir." },
  { question:"İslam'da bir kişinin hem Allah'a inanıp hem de başka varlıklara da ilahlık yakıştırmasına ne ad verilir?", options:["Tevhid","Şirk","İhlas","Takva"], correctIndex:1, hint:"Tevhidin zıttıdır.", explanation:"Allah'a ortak koşmaya şirk denir." },
  { question:"İslam'da Allah'ın birliğine, ortağı olmadığına inanma ilkesine ne ad verilir?", options:["Şirk","Tevhid","Nifak","Bidat"], correctIndex:1, hint:"İslam inancının temel taşıdır.", explanation:"Allah'ın birliğine inanma ilkesine tevhid denir." },
];

async function main(){
  // KOTA TASARRUFU: bu script daha once basariyla calistiysa, hicbir okuma/yazma yapmadan hemen cik
  const statusRef = db.collection('app_config').doc('seedScriptStatus');
  const statusDoc = await statusRef.get();
  if (statusDoc.exists && statusDoc.data()[SCRIPT_NAME] === true) {
    console.log(`⏭️  ${SCRIPT_NAME} daha once calistirilmis, atlaniyor (kota tasarrufu).`);
    return;
  }

  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question||'').trim()));

  const toAdd = [];
  islamiEkFikihTarih.forEach(q => {
    if(!existingTexts.has(q.question.trim())) toAdd.push(Object.assign({category:'islami'}, q));
  });

  console.log('Toplam hazırlanan soru:', islamiEkFikihTarih.length);
  console.log('Zaten var olan (atlanan):', islamiEkFikihTarih.length - toAdd.length);
  console.log('Yeni eklenecek:', toAdd.length);

  if(toAdd.length === 0){
    console.log('Eklenecek yeni soru yok.');
    await statusRef.set({ [SCRIPT_NAME]: true }, { merge: true });
    return;
  }

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
  await statusRef.set({ [SCRIPT_NAME]: true }, { merge: true });
  console.log(`✅ ${SCRIPT_NAME} isaretlendi, bir daha calismayacak.`);
}

__checkAlreadySeeded().then(async (alreadyDone) => {
  const __scriptName = require('path').basename(__filename);
  if (alreadyDone) { console.log(`${__scriptName} zaten daha önce tamamlanmış, atlanıyor.`); process.exit(0); return; }
  await main();
  await db.collection('app_config').doc('seedScriptStatus').set({ [require('path').basename(__filename)]: true }, { merge: true }).catch(()=>{});
  process.exit(0);
}).catch(e=>{ console.error('Hata:', e); process.exit(1); });
