// Soru havuzunu Firestore'a TEK SEFERLİK yükler (workflow_dispatch ile elle çalıştırılır).
// Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar eklenmez, güvenle tekrar çalıştırılabilir.
// Bu parti: Kur'an'da geçen hayvanlar/yerler, miras hukuku, temizlik çeşitleri, İslam
// sanatları, halifelik kavramı gibi YENİ konularda İslami sorular.

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

const SCRIPT_NAME = 'seed-islami-cesitli-konular'; // bu dosyanin kendi adi (kota tasarrufu takibi icin)

const islamiCesitliKonular = [
  // ---------- KUR'AN'DA GEÇEN HAYVANLAR ----------
  { question:"Kur'an-ı Kerim'de, Hz. Süleyman'ın (a.s.) ordusuyla ilgili bir kıssada geçen ve 'ezilmeyelim' diye uyarı yapan hayvan hangisidir?", options:["Arı","Karınca","Kelebek","Çekirge"], correctIndex:1, hint:"Neml suresi bu hayvandan adını alır.", explanation:"Kur'an'da Hz. Süleyman'ın ordusuna uyarıda bulunan hayvan karıncadır (Neml suresi)." },
  { question:"Kur'an'da adı geçen ve kendi adını taşıyan bir sure bulunan böcek hangisidir?", options:["Karınca","Arı (Nahl)","Örümcek (Ankebut)","İkisi de doğru (Nahl ve Ankebut)"], correctIndex:3, hint:"Hem 'Nahl' hem 'Ankebut' suresi vardır.", explanation:"Kur'an'da hem arı (Nahl suresi) hem örümcek (Ankebut suresi) adını taşıyan sureler bulunur." },
  { question:"Hz. Salih'in (a.s.) kıssasında kavmine mucize olarak gönderilen hayvan hangisidir?", options:["At","Deve","Koyun","Fil"], correctIndex:1, hint:"Kayadan çıktığına inanılır.", explanation:"Hz. Salih'in kavmine gönderilen mucize hayvan bir devedir." },
  { question:"Hz. Yunus'un (a.s.) kıssasında onu yutan deniz canlısı genellikle nasıl tasvir edilir?", options:["Köpekbalığı","Büyük bir balık","Yunus balığı","Ahtapot"], correctIndex:1, hint:"Kur'an'da 'hut' kelimesiyle anılır.", explanation:"Hz. Yunus'u yutan deniz canlısı, Kur'an'da büyük bir balık olarak anılır." },
  { question:"Ashab-ı Kehf kıssasında, mağarada gençlerle birlikte olduğuna inanılan hayvan hangisidir?", options:["Kedi","Köpek (Kıtmir)","Kuş","At"], correctIndex:1, hint:"Adı 'Kıtmir' olarak bilinir.", explanation:"Ashab-ı Kehf kıssasında gençlerle birlikte olan köpeğin adı Kıtmir olarak bilinir." },
  { question:"Hz. İbrahim'in (a.s.) kurban kıssasında, oğlunun yerine kesilen hayvan hangisidir?", options:["Deve","Koç","Sığır","Keçi"], correctIndex:1, hint:"Kurban Bayramı'nın kökenidir.", explanation:"Hz. İbrahim'in kıssasında oğlunun yerine kesilen hayvan bir koçtur." },

  // ---------- KUR'AN'DA GEÇEN YERLER ----------
  { question:"Kur'an-ı Kerim'de adı geçen ve kendi adını taşıyan bir sure bulunan şehir/bölge hangisidir?", options:["Mekke","Medine","Sebe","Hepsi doğru olabilir"], correctIndex:3, hint:"Sebe suresi de vardır.", explanation:"Kur'an'da hem Mekke (Beled suresi bağlamında), hem Medine (Münafikun bağlamında) hem de Sebe gibi yer/bölge isimleri geçer; Sebe suresi doğrudan bu isimle anılır." },
  { question:"Kur'an'da 'İki Doğu ile İki Batı'nın Rabbi' ifadesiyle işaret edilen kavram neyle ilgilidir?", options:["Coğrafi yönler","Güneşin ve ayın doğuş-batış noktalarının değişimi","Sadece Mekke ve Medine","Sadece gökyüzü"], correctIndex:1, hint:"Rahman suresinde geçer.", explanation:"Bu ifade, güneşin/ayın mevsimlere göre değişen doğuş ve batış noktalarına işaret eder." },
  { question:"Hz. Musa'nın (a.s.) doğduğu ve büyüdüğü, Firavun'un hüküm sürdüğü bölge neresidir?", options:["Mısır","Şam","Filistin","Irak"], correctIndex:0, hint:"Nil Nehri bu bölgededir.", explanation:"Hz. Musa, Firavun'un hüküm sürdüğü Mısır'da doğup büyümüştür." },
  { question:"Hz. Lut'un (a.s.) kavminin yaşadığı ve helak edilen bölge, günümüzdeki hangi coğrafyaya yakın kabul edilir?", options:["Lut Gölü (Ölü Deniz) civarı","Nil Deltası","Fırat kıyıları","Arap Yarımadası'nın güneyi"], correctIndex:0, hint:"Bugünkü Ürdün-Filistin sınırındadır.", explanation:"Hz. Lut'un kavminin yaşadığı bölge, bugünkü Lut Gölü (Ölü Deniz) civarına yakın kabul edilir." },

  // ---------- MİRAS HUKUKU (FERAİZ) TEMELLERİ ----------
  { question:"İslam hukukunda miras paylaşımı ilmine ne ad verilir?", options:["Fıkıh","Feraiz","Kelam","Tefsir"], correctIndex:1, hint:"'Farz kılınan paylar' anlamına gelir.", explanation:"Miras paylaşımı ilmine feraiz denir." },
  { question:"İslam miras hukukunda, mirasın dağıtılmasından önce ölen kişinin borçları ve vasiyeti hangi sırada yerine getirilir?", options:["Miras paylaştırıldıktan sonra","Önce borç ve vasiyet, sonra miras paylaşımı","Sadece vasiyet dikkate alınır","Hiçbiri dikkate alınmaz"], correctIndex:1, hint:"Mirasçılar arasında paylaşımdan önce yapılması gerekenler vardır.", explanation:"İslam hukukunda önce ölenin borçları ödenir, vasiyeti yerine getirilir, sonra kalan miras paylaştırılır." },
  { question:"İslam miras hukukunda vasiyet, mirasın en fazla kaçta kaçı için geçerli olabilir (mirasçılar onay vermedikçe)?", options:["Yarısı","Üçte biri","Dörtte biri","Tamamı"], correctIndex:1, hint:"Bu sınır, mirasçıların haklarını korumak içindir.", explanation:"İslam hukukunda vasiyet, mirasçılar onay vermedikçe mirasın en fazla üçte biri için geçerli olabilir." },

  // ---------- TEMİZLİK ÇEŞİTLERİ (TAHARET) ----------
  { question:"İslam'da büyük hadesten (cünüplük gibi) temizlenmek için yapılan tam yıkanmaya ne ad verilir?", options:["Abdest","Gusül","Teyemmüm","İstinca"], correctIndex:1, hint:"Tüm vücudun yıkanmasını gerektirir.", explanation:"Büyük hadesten temizlenmek için yapılan tam yıkanmaya gusül denir." },
  { question:"Tuvalet sonrası yapılan temizliğe İslami fıkıh terimiyle ne ad verilir?", options:["Gusül","Abdest","İstinca","Teyemmüm"], correctIndex:2, hint:"Su veya taşla yapılabilir.", explanation:"Tuvalet sonrası yapılan temizliğe istinca denir." },
  { question:"Namaz kılmak için gerekli olan temizlik durumuna genel olarak ne ad verilir?", options:["Necaset","Taharet","Hades","Cenabet"], correctIndex:1, hint:"'Temizlik' anlamına gelir.", explanation:"Namaz için gerekli genel temizlik durumuna taharet denir." },
  { question:"İslam fıkhında dinen pis kabul edilen şeylere ne ad verilir?", options:["Taharet","Necaset","Gusül","İstinca"], correctIndex:1, hint:"Taharetin zıttı bir durumdur.", explanation:"Dinen pis kabul edilen şeylere necaset denir." },

  // ---------- İSLAM SANATLARI ----------
  { question:"İslam sanatında güzel yazı sanatına ne ad verilir?", options:["Tezhip","Hat","Ebru","Minyatür"], correctIndex:1, hint:"Kur'an yazımında da kullanılır.", explanation:"Güzel yazı sanatına hat denir." },
  { question:"İslam sanatında, el yazması eserlerin sayfalarını altın varak ve desenlerle süsleme sanatına ne ad verilir?", options:["Hat","Tezhip","Ebru","Çini"], correctIndex:1, hint:"'Süsleme, altınlama' anlamına gelir.", explanation:"El yazması eserleri süsleme sanatına tezhip denir." },
  { question:"Su üzerinde boya ile yapılan, kağıda aktarılan geleneksel Türk-İslam sanatına ne ad verilir?", options:["Hat","Tezhip","Ebru","Minyatür"], correctIndex:2, hint:"'Bulutsu' desenleriyle bilinir.", explanation:"Su üzerinde yapılan boya sanatına ebru denir." },
  { question:"Osmanlı ve İslam mimarisinde yaygın olarak kullanılan, çoğunlukla mavi-beyaz desenli seramik süslemeye ne ad verilir?", options:["Ebru","Çini","Tezhip","Hat"], correctIndex:1, hint:"İznik bu sanatla ünlüdür.", explanation:"Cami ve saraylarda kullanılan seramik süslemeye çini denir." },
  { question:"İslam sanatında, kitap sayfalarına küçük boyutlu, canlı renkli resimler yapma sanatına ne ad verilir?", options:["Minyatür","Hat","Tezhip","Ebru"], correctIndex:0, hint:"Osmanlı tarihinde saray hayatını tasvir etmek için de kullanılmıştır.", explanation:"Küçük boyutlu, canlı renkli resim sanatına minyatür denir." },

  // ---------- HALİFELİK VE İSLAM DEVLETİ KAVRAMLARI ----------
  { question:"'Halife' kelimesi kelime anlamı olarak ne ifade eder?", options:["Kral","Halef, vekil, temsilci","Komutan","Alim"], correctIndex:1, hint:"Peygamber'in yerine geçen kişiyi ifade eder.", explanation:"'Halife' kelimesi, halef/vekil/temsilci anlamına gelir." },
  { question:"İslam tarihinde 'Raşid Halifeler' (Hulefa-i Raşidin) dönemi kaç halifeyi kapsar?", options:["2","3","4","5"], correctIndex:2, hint:"Hz. Ebu Bekir, Hz. Ömer, Hz. Osman, Hz. Ali.", explanation:"Raşid Halifeler dönemi 4 halifeyi kapsar: Hz. Ebu Bekir, Hz. Ömer, Hz. Osman ve Hz. Ali." },
  { question:"Osmanlı padişahları hangi dönemden itibaren halifelik unvanını da taşımaya başlamıştır (yaygın kabule göre)?", options:["Osman Bey döneminden itibaren","Yavuz Sultan Selim döneminden itibaren","Fatih Sultan Mehmed döneminden itibaren","Kanuni döneminden itibaren"], correctIndex:1, hint:"Mısır'ın fethiyle ilişkilendirilir.", explanation:"Yaygın kabule göre Osmanlı padişahları, Yavuz Sultan Selim'in Mısır'ı fethiyle halifelik unvanını almaya başlamıştır." },
  { question:"Halifelik kurumu Türkiye'de hangi yılda kaldırılmıştır?", options:["1923","1924","1928","1938"], correctIndex:1, hint:"Cumhuriyetin ilanından kısa süre sonradır.", explanation:"Halifelik kurumu Türkiye'de 1924 yılında kaldırılmıştır." },

  // ---------- SELAMLAŞMA VE MİSAFİRPERVERLİK ADABI ----------
  { question:"İslam'da bir eve girerken izin istemenin ve selam vermenin önemi hangi ayetlerde vurgulanır?", options:["Sadece hadislerde geçer, ayet yoktur","Nur suresinde geçer","Sadece örf olarak vardır","Fatiha suresinde geçer"], correctIndex:1, hint:"Mahremiyetle ilgili ayetler içerir.", explanation:"Eve girerken izin isteme ve selam verme, Nur suresinde vurgulanır." },
  { question:"İslam'da misafire ikramda bulunmak hangi hadisle özellikle teşvik edilir?", options:["'Misafirperverlik imandandır' türü hadislerle","Sadece Kur'an'da geçer","Teşvik edilmez","Sadece zenginler için geçerlidir"], correctIndex:0, hint:"Hz. Peygamber bu konuda çokça hadis söylemiştir.", explanation:"Misafire ikram, Hz. Peygamber'in 'Allah'a ve ahiret gününe inanan, misafirine ikram etsin' gibi hadisleriyle teşvik edilir." },
  { question:"İslam'da yolda karşılaşan iki Müslümandan hangisinin önce selam vermesi tavsiye edilir?", options:["Yaşlı olan gençe verir","Küçük olan büyüğe, binitli olan yayaya, az olan çok olana verir","Sadece erkekler selam verir","Hiçbir öncelik yoktur"], correctIndex:1, hint:"Tevazuyu öne çıkaran bir sıralamadır.", explanation:"Hadislere göre küçük büyüğe, binitli yayaya, az olan çok olan gruba önce selam verir." },

  // ---------- İSLAM'DA CİHAT KAVRAMI ----------
  { question:"İslam'da 'cihat' kelimesinin kapsamı sadece savaşla mı sınırlıdır?", options:["Evet, sadece savaşı ifade eder","Hayır, nefisle mücadeleyi ve çaba göstermeyi de kapsar","Sadece ticari çabaları ifade eder","Sadece eğitimi ifade eder"], correctIndex:1, hint:"'Cihad-ı ekber' (büyük cihat) kavramı da vardır.", explanation:"Cihat kelimesi, savaşın yanı sıra nefisle mücadele ve genel anlamda çaba göstermeyi de kapsar." },
  { question:"'Cihad-ı ekber' (büyük cihat) hangi mücadeleyi ifade eder?", options:["Düşmanla savaşmak","Nefisle mücadele etmek","Sadece ticari rekabet","Sadece spor müsabakaları"], correctIndex:1, hint:"İç mücadeleye işaret eder.", explanation:"Cihad-ı ekber, kişinin kendi nefsiyle (kötü arzularıyla) mücadelesini ifade eder." },

  // ---------- EHL-İ BEYT VE KERBELA ----------
  { question:"'Ehl-i Beyt' terimi genel olarak kimleri ifade eder?", options:["Tüm sahabe","Hz. Peygamber'in yakın aile fertleri","Sadece Muhacirler","Sadece Ensar"], correctIndex:1, hint:"Hz. Fatıma, Hz. Ali, Hz. Hasan, Hz. Hüseyin bu kapsamdadır.", explanation:"Ehl-i Beyt, Hz. Peygamber'in yakın aile fertlerini (özellikle Hz. Fatıma, Hz. Ali ve çocukları) ifade eder." },
  { question:"Hz. Hüseyin'in (r.a.) şehit edildiği, İslam tarihinde önemli bir yeri olan olay hangisidir?", options:["Sıffin Savaşı","Kerbela Olayı","Cemel Vakası","Hendek Savaşı"], correctIndex:1, hint:"Muharrem ayında yaşanmıştır.", explanation:"Hz. Hüseyin'in şehit edildiği olay Kerbela Olayı'dır." },
  { question:"Kerbela Olayı hangi hicri yılda gerçekleşmiştir?", options:["Hicri 41","Hicri 61","Hicri 71","Hicri 91"], correctIndex:1, hint:"Hz. Muaviye'nin vefatından kısa süre sonradır.", explanation:"Kerbela Olayı, Hicri 61 yılında (Muharrem ayında) gerçekleşmiştir." },

  // ---------- EK GENEL KAVRAMLAR ----------
  { question:"İslam'da 'bidat' kavramı ne anlama gelir?", options:["Sünnete uygun davranış","Dinde sonradan ortaya çıkan, aslı olmayan yenilik","Farz ibadet","Vacip ibadet"], correctIndex:1, hint:"Genellikle olumsuz bir çağrışımı vardır.", explanation:"Bidat, dinde sonradan ortaya çıkan ve aslı olmayan yenilikleri ifade eder." },
  { question:"Hz. Peygamber'in sünnetine sıkı sıkıya bağlı olan davranışlara ne ad verilir?", options:["Bidat","Sünnet-i müekkede","Mekruh","Haram"], correctIndex:1, hint:"'Kuvvetli sünnet' anlamına gelir.", explanation:"Hz. Peygamber'in devamlı yaptığı, önemle sürdürdüğü davranışlara sünnet-i müekkede denir." },
  { question:"İslam'da bir işi yaparken 'niyet'in önemi hangi meşhur hadiste vurgulanır?", options:["'Ameller niyetlere göredir'","'Din nasihattir'","'Kolaylaştırınız'","'Müslüman, elinden ve dilinden emin olunan kişidir'"], correctIndex:0, hint:"Hadis kitaplarının çoğu bu hadisle başlar.", explanation:"Niyetin önemi, 'Ameller niyetlere göredir' hadisiyle vurgulanır." },
  { question:"İslam'da 'ihlas' kavramının zıttı olan ve amelleri gösteriş için yapmayı ifade eden kavram nedir?", options:["Takva","Riya","Sabır","Şükür"], correctIndex:1, hint:"Daha önce de değinilen bir kavramdır.", explanation:"İhlasın zıttı riya'dır (gösteriş için amel yapmak)." },
  { question:"İslam'da kişinin kendi nefsini hesaba çekmesi, davranışlarını sürekli sorgulaması erdemine ne ad verilir?", options:["Muhasebe (nefis muhasebesi)","Tevekkül","Zikir","İnfak"], correctIndex:0, hint:"'Hesaplaşma' kökünden gelir.", explanation:"Kişinin kendi nefsini sorgulamasına muhasebe (nefis muhasebesi) denir." },
  { question:"İslam'da 'kanaat' kavramı ne anlama gelir?", options:["Aşırı hırs göstermek","Sahip olduğuyla yetinip şükretmek","Sadece zenginlik istemek","Tembellik etmek"], correctIndex:1, hint:"'Kanaat, tükenmeyen bir hazinedir' sözü meşhurdur.", explanation:"Kanaat, sahip olunanla yetinip şükretme erdemini ifade eder." },
  { question:"İslam'da başkalarının kusurlarını araştırmama, gizli hallerini merak etmeme ilkesine ne ad verilir?", options:["Tecessüs yapmamak (gıybetten kaçınmak)","Zikir yapmak","İnfak etmek","Şükretmek"], correctIndex:0, hint:"Bu ilke Kur'an'da açıkça yasaklanan bir davranışın karşıtıdır.", explanation:"Başkalarının kusurlarını araştırmamaya (tecessüs etmemeye) Kur'an'da dikkat çekilir." },
  { question:"İslam'da bir Müslümanın diğerinin arkasından, o kişi duysa hoşlanmayacağı şeyleri konuşmasına ne ad verilir?", options:["Nasihat","Gıybet","Şahitlik","İstişare"], correctIndex:1, hint:"Kur'an'da 'ölmüş kardeşinin etini yemek' benzetmesiyle anlatılır.", explanation:"Bir kişinin arkasından hoşlanmayacağı şeyleri konuşmaya gıybet denir." },
  { question:"İslam'da önemli kararlar alırken danışma, fikir alışverişi yapma ilkesine ne ad verilir?", options:["İstişare (Şura)","Tevekkül","İhlas","Kanaat"], correctIndex:0, hint:"Kur'an'da bir sureye de adını vermiştir.", explanation:"Danışma ve fikir alışverişi ilkesine istişare (şura) denir." },

  // ---------- EK MEZHEP VE FIKIH USULÜ ----------
  { question:"İslam hukukunda, Kur'an ve Sünnet'te açık hüküm bulunmayan konularda alimlerin ortak görüşüne ne ad verilir?", options:["Kıyas","İcma","Örf","Istıhsan"], correctIndex:1, hint:"'Görüş birliği' anlamına gelir.", explanation:"Alimlerin bir konuda ortak görüşte birleşmesine icma denir." },
  { question:"İslam hukukunda, hükmü bilinen bir meseleyi, ona benzeyen ve hükmü bilinmeyen bir meseleye uygulamaya ne ad verilir?", options:["İcma","Kıyas","Istıshab","Örf"], correctIndex:1, hint:"'Karşılaştırma, benzeterek hüküm çıkarma' anlamına gelir.", explanation:"Benzetme yoluyla hüküm çıkarmaya kıyas denir." },
  { question:"İslam hukukunun temel kaynakları (edille-i şer'iyye) arasında sayılmayan hangisidir?", options:["Kur'an","Sünnet","İcma","Kişisel rüya"], correctIndex:3, hint:"Diğer üçü, fıkıh usulünün temel kaynaklarıdır.", explanation:"İslam hukukunun temel kaynakları Kur'an, Sünnet, İcma ve Kıyas'tır; kişisel rüya bir hukuk kaynağı değildir." },
  { question:"Bir toplumun örf ve adetlerinin, İslam hukukunda bazı konularda dikkate alınmasına ne ad verilir?", options:["Örf","Kıyas","İcma","Nas"], correctIndex:0, hint:"Yerel gelenekleri ifade eder.", explanation:"Toplumun örf ve adetlerinin dikkate alınmasına örf denir." },

  // ---------- OSMANLI-İSLAM İLİŞKİSİ EK ----------
  { question:"Osmanlı Devleti'nde din işlerinden sorumlu en yüksek makam hangisidir?", options:["Sadrazam","Şeyhülislam","Kadıasker","Defterdar"], correctIndex:1, hint:"Fetva verme yetkisine sahiptir.", explanation:"Osmanlı'da din işlerinden sorumlu en yüksek makam Şeyhülislamlıktır." },
  { question:"Osmanlı hukuk sisteminde, İslam hukukuna dayanan fakat padişah tarafından da düzenlemeler yapılan kurallara ne ad verilir?", options:["Şer'i hukuk (sadece)","Örfi hukuk (padişah kanunları)","Roma hukuku","Kilise hukuku"], correctIndex:1, hint:"'Kanunname'ler bu kapsamdadır.", explanation:"Padişah tarafından düzenlenen, şer'i hukuku tamamlayan kurallara örfi hukuk denir." },
  { question:"Osmanlı'da mahkemelerde hüküm veren, İslam hukukuna göre yargılama yapan görevliye ne ad verilir?", options:["Şeyhülislam","Kadı","Müftü","Vali"], correctIndex:1, hint:"Yerel mahkemelerde görev yapardı.", explanation:"Osmanlı'da yargı görevini yürüten kişiye kadı denir." },

  // ---------- İSLAM VE BİLİM İLİŞKİSİ ----------
  { question:"İslam'da ilim öğrenmenin teşvik edilmesinin temel kaynaklarından biri, Kur'an'ın ilk emrinin ne olmasıdır?", options:["Namaz kılmak","Oku (İkra)","Oruç tutmak","Zekat vermek"], correctIndex:1, hint:"Alak suresinin ilk kelimesidir.", explanation:"Kur'an'ın ilk inen emri 'Oku' (İkra) olduğu için, ilim öğrenmek İslam'da büyük önem taşır." },
  { question:"İslam medeniyetinde astronomi, tıp, matematik gibi bilimlerin gelişmesinde hangi faktörün payı büyüktür?", options:["Sadece savaşlar","İlmin dinen teşvik edilmesi ve tercüme faaliyetleri","Sadece ticaret","Hiçbir özel sebep yoktur"], correctIndex:1, hint:"Yunan, Hint ve İran kaynaklarının Arapçaya çevrilmesi önemlidir.", explanation:"İslam'da ilmin teşvik edilmesi ve yoğun tercüme faaliyetleri, bilimlerin gelişmesine büyük katkı sağlamıştır." },

  // ---------- KUR'AN OKUMA VE HIFZ GELENEĞİ ----------
  { question:"Kur'an-ı Kerim'i yedi farklı kıraat şekliyle okuma geleneğine ne ad verilir?", options:["Kıraat-ı Aşere","Kıraat-ı Seb'a","Tecvid","Tefsir"], correctIndex:1, hint:"'Yedi okuyuş' anlamına gelir.", explanation:"Kur'an'ın yedi farklı okunuş şekline Kıraat-ı Seb'a denir." },
  { question:"Kur'an-ı Kerim'i on farklı kıraat şekliyle okuma geleneğine ne ad verilir?", options:["Kıraat-ı Seb'a","Kıraat-ı Aşere","Tecvid","Tefsir"], correctIndex:1, hint:"'On okuyuş' anlamına gelir.", explanation:"Kur'an'ın on farklı okunuş şekline Kıraat-ı Aşere denir." },
  { question:"Kur'an-ı Kerim'de bir ayetin sonraki bir ayet veya hüküm ile geçersiz kılınmasına ne ad verilir?", options:["Nesih","Tefsir","Te'vil","İcaz"], correctIndex:0, hint:"'Kaldırma, iptal etme' anlamına gelir.", explanation:"Bir ayetin hükmünün sonraki bir ayetle değiştirilmesine nesih denir." },
  { question:"Kur'an-ı Kerim'in mucizevi, benzersiz üslubunu ve edebi gücünü ifade eden kavram nedir?", options:["Nesih","İ'caz","Te'vil","Kıraat"], correctIndex:1, hint:"'Aciz bırakma' anlamına gelir.", explanation:"Kur'an'ın benzersiz üslup ve edebi gücüne i'caz denir." },

  // ---------- KADIN SAHABELER VE ROLLERİ EK ----------
  { question:"Hz. Peygamber'in vefatından sonra, Cemel Vakası'nda (Cemel Savaşı'nda) ordu içinde bulunan ve bu olayla anılan eşi kimdir?", options:["Hz. Hafsa","Hz. Ayşe","Hz. Ümmü Seleme","Hz. Meymune"], correctIndex:1, hint:"Deve üzerinde bulunması nedeniyle savaşa bu isim verilmiştir.", explanation:"Cemel Vakası, Hz. Ayşe'nin de içinde bulunduğu bir olaydır (savaşın adı, onun bindiği devenin etrafındaki çarpışmadan gelir)." },
  { question:"Uhud Savaşı'nda yaralıları tedavi eden, su taşıyan kadın sahabelerin genel rolü nasıl tanımlanır?", options:["Sadece evde kalırlardı","Savaş meydanında destek ve tedavi hizmeti verirlerdi","Hiçbir görev üstlenmezlerdi","Sadece dua ederlerdi"], correctIndex:1, hint:"Hz. Nesibe gibi örnekler vardır.", explanation:"Kadın sahabeler, savaş meydanında yaralıları tedavi etme ve su taşıma gibi destek görevleri üstlenmiştir." },

  // ---------- CAMİ MİMARİSİ VE İSLAM ŞEHİRCİLİĞİ ----------
  { question:"Mimar Sinan'ın kendi 'ustalık eserim' dediği, Edirne'de bulunan cami hangisidir?", options:["Süleymaniye Camii","Selimiye Camii","Sultanahmet Camii","Şehzade Camii"], correctIndex:1, hint:"II. Selim adına yapılmıştır.", explanation:"Mimar Sinan'ın kendi ustalık eseri olarak nitelendirdiği cami, Edirne'deki Selimiye Camii'dir." },
  { question:"İslam mimarisinde caminin üzerini örten, yarım küre şeklindeki yapıya ne ad verilir?", options:["Minare","Kubbe","Mihrap","Şerefe"], correctIndex:1, hint:"Camilerin en belirgin unsurlarından biridir.", explanation:"Caminin üzerini örten yarım küre yapıya kubbe denir." },
  { question:"Minarede müezzinin ezan okuduğu, dışarı çıkılan balkon şeklindeki bölüme ne ad verilir?", options:["Kubbe","Şerefe","Mihrap","Minber"], correctIndex:1, hint:"Minarenin gövdesinde bulunan çıkıntılı kısımdır.", explanation:"Minarede müezzinin ezan okuduğu balkon kısmına şerefe denir." },

  // ---------- İSLAM'DA EĞLENCE VE SANAT SINIRI ----------
  { question:"İslam'da meşru eğlence ve sanat faaliyetleri konusunda genel ilke nedir?", options:["Her türlü eğlence yasaktır","Harama yol açmayan, ahlaka aykırı olmayan eğlenceler mubahtır","Sadece müzik tamamen yasaktır","Hiçbir sınır yoktur"], correctIndex:1, hint:"Ölçü, haram unsurlar içermemesidir.", explanation:"İslam'da harama yol açmayan ve ahlaka aykırı olmayan eğlenceler genel olarak mubah kabul edilir." },

  // ---------- İSLAM'DA HAYVAN HAKLARI VE ÇEVRE ----------
  { question:"İslam'da hayvanlara iyi davranmanın önemi hangi hadisle vurgulanır?", options:["'Bir kediye eziyet eden cehenneme girdi' türü hadislerle","Hiçbir hadiste geçmez","Sadece Kur'an'da geçer","Önemsiz bir konudur"], correctIndex:0, hint:"Hz. Peygamber hayvanlara iyi davranmayı önemle vurgulamıştır.", explanation:"Hayvanlara kötü davranmanın günah olduğu, susuz bırakılan bir kedi örneğiyle anlatılan hadislerle vurgulanır." },
  { question:"İslam'da ağaç dikmenin ve doğayı koruma faaliyetlerinin sevap kabul edilmesi hangi anlayışla açıklanır?", options:["Sadece ekonomik fayda","Sadaka-i cariye anlayışı (devamlı sevap kazandıran hayır)","Hiçbir dini gerekçesi yoktur","Sadece estetik kaygı"], correctIndex:1, hint:"Etkisi uzun süre devam eden hayırlardandır.", explanation:"Ağaç dikmek, sadaka-i cariye (devam eden sevap) anlayışıyla teşvik edilir." },

  // ---------- İSLAM'DA ADALET VE YÖNETİM ----------
  { question:"Hz. Ömer'in adaletiyle ilgili en bilinen uygulamalarından biri hangisidir?", options:["Halkı sürekli denetlemesi ve adaletli davranması","Sadece zenginlerle ilgilenmesi","Halktan uzak durması","Kararları tek başına, danışmadan alması"], correctIndex:0, hint:"Geceleri halkı dolaşıp ihtiyaçlarını kontrol ettiği rivayet edilir.", explanation:"Hz. Ömer, halkını denetleyen ve adaletiyle bilinen bir halifedir." },
  { question:"İslam'da yöneticilerin halka karşı sorumluluğu hangi ilkeyle özetlenir?", options:["'Hepiniz çobansınız ve hepiniz güttüğünüzden sorumlusunuz' hadisiyle","Hiçbir sorumluluk yoktur","Sadece Allah'a karşı sorumludur, halka karşı değil","Sadece ekonomik sorumluluk vardır"], correctIndex:0, hint:"Meşhur bir hadistir.", explanation:"Yöneticilerin sorumluluğu, 'Hepiniz çobansınız...' hadisiyle özetlenir." },

  // ---------- İSLAM'DA SAĞLIK VE TIP ANLAYIŞI ----------
  { question:"İslam'da hastalık durumunda tedavi olmanın hükmü genel olarak nasıldır?", options:["Yasaktır","Teşvik edilir ('Her derdin bir devası vardır' hadisi)","Sadece dua yeterlidir, tedavi gereksizdir","Hiçbir görüş yoktur"], correctIndex:1, hint:"Hz. Peygamber'in tedaviyi teşvik eden hadisleri vardır.", explanation:"İslam'da hastalıkta tedavi olmak, 'Her derdin bir devası vardır' gibi hadislerle teşvik edilir." },
  { question:"İslam'da bulaşıcı hastalık durumunda karantina uygulamasına dair hangi hadis örnek gösterilir?", options:["'Veba olan bir yere girmeyin, orada iken de çıkmayın' hadisi","Hiçbir hadis yoktur","Sadece modern tıpta vardır","Sadece Kur'an'da geçer"], correctIndex:0, hint:"Hz. Ömer döneminde de uygulanmıştır.", explanation:"Karantina uygulamasına örnek olarak, veba bölgesine girip çıkmamayı öğütleyen hadis gösterilir." },

  // ---------- İSLAM'DA EĞİTİM METODU EK ----------
  { question:"Hz. Peygamber'in eğitim metodunda öne çıkan yaklaşımlardan biri hangisidir?", options:["Sadece ezber","Örnek davranış (üsve-i hasene) ile öğretme","Sadece teorik anlatım","Sadece ceza yöntemi"], correctIndex:1, hint:"Kur'an'da kendisi 'güzel örnek' olarak nitelenir.", explanation:"Hz. Peygamber'in eğitim metodunda öne çıkan yaklaşımlardan biri, kendi davranışlarıyla örnek olmaktır (üsve-i hasene)." },
  { question:"İslam'da çocuklara karşı şefkatli davranmanın önemi hangi örnekle sıkça anlatılır?", options:["Hz. Peygamber'in torunlarına gösterdiği sevgi","Hiçbir örnek yoktur","Sadece kızlara özgüdür","Sadece erkek çocuklara özgüdür"], correctIndex:0, hint:"Hz. Hasan ve Hz. Hüseyin'le ilgili rivayetler meşhurdur.", explanation:"Hz. Peygamber'in torunlarına gösterdiği sevgi, çocuklara şefkatin önemli bir örneğidir." },

  // ---------- EK KAVRAMLAR: DUA VE TEVESSÜL ----------
  { question:"Bir Müslümanın başka bir Müslüman için, o kişi yokken dua etmesine ne ad verilir (özel bir fazileti vardır)?", options:["Gıyabi dua","Şahsi dua","Vacip dua","Farz dua"], correctIndex:0, hint:"'Arkadan, yokken yapılan' anlamına gelir.", explanation:"Kişinin yokluğunda onun için yapılan duaya gıyabi dua denir." },
  { question:"Duanın kabul olma vakitlerinden biri olarak bilinen, Cuma günü içindeki özel ana ne ad verilir?", options:["İcabet saati","Kabul vakti","Rahmet saati","Bereket ânı"], correctIndex:0, hint:"Bu vaktin tam olarak ne zaman olduğu kesin bilinmez, aranması tavsiye edilir.", explanation:"Cuma günü içinde duanın kabul olduğuna inanılan özel ana icabet saati denir." },

  // ---------- İSLAM'DA AF VE BAĞIŞLAMA ----------
  { question:"İslam'da kişisel haksızlıklara uğrayan bir Müslümanın affetmesi hangi erdemle teşvik edilir?", options:["Af ve bağışlama erdemi","Kin tutma","İntikam alma","Hiçbiri teşvik edilmez"], correctIndex:0, hint:"Kur'an'da affetmenin faziletinden bahsedilir.", explanation:"İslam'da affetmek, Kur'an'da övülen bir erdemdir." },
  { question:"Mekke'nin fethi sırasında Hz. Peygamber'in eski düşmanlarına karşı sergilediği tavır nasıldı?", options:["Hepsini cezalandırdı","Genel af ilan etti","Şehri terk etmelerini istedi","Onları köleleştirdi"], correctIndex:1, hint:"'Bugün size kınama yok' sözüyle bilinir.", explanation:"Hz. Peygamber, Mekke'nin fethinde eski düşmanlarına genel af ilan etmiştir." },

  // ---------- EK PEYGAMBER MUCİZELERİ ----------
  { question:"Hz. Muhammed'in (s.a.v.) en büyük ve kalıcı mucizesi olarak kabul edilen nedir?", options:["Ay'ın ikiye yarılması","Kur'an-ı Kerim","Parmaklarından su akması","Miraç mucizesi"], correctIndex:1, hint:"Kıyamete kadar geçerliliğini koruyacak tek mucizedir.", explanation:"Hz. Muhammed'in en büyük ve kalıcı mucizesi Kur'an-ı Kerim'dir." },
  { question:"Hz. Peygamber'in mucizelerinden biri olarak, hangi gök cismiyle ilgili bir olay Kur'an'da anlatılır?", options:["Güneş'in durması","Ay'ın ikiye yarılması (Şakku'l-Kamer)","Yıldızların kayması","Gökkuşağının oluşması"], correctIndex:1, hint:"Kamer suresinde bahsedilir.", explanation:"Hz. Peygamber'in mucizelerinden biri, Kamer suresinde anlatılan Ay'ın ikiye yarılmasıdır (Şakku'l-Kamer)." },
  { question:"Hz. Peygamber'in hutbe verirken dayandığı kuru hurma kütüğünün, minbere geçtiğinde ses çıkardığına dair rivayete ne ad verilir?", options:["Hanin-i Ciz' (Hasret İnleyen Kütük)","Şakku'l-Kamer","Miraç","Fetih Mucizesi"], correctIndex:0, hint:"Hz. Peygamber'e olan sevgisinden dolayı inlediği rivayet edilir.", explanation:"Bu rivayete Hanin-i Ciz' (inleyen kütük) denir." },
  { question:"Hz. Peygamber'in parmaklarından su akıp sahabenin abdest aldığına dair rivayet edilen mucizeye ne ad verilir?", options:["Nebiy mucizesi","Parmaklarından su fışkırması mucizesi","Şakku'l-Kamer","Miraç"], correctIndex:1, hint:"Bir savaş sırasında susuzluk çekildiğinde yaşandığı rivayet edilir.", explanation:"Hz. Peygamber'in parmaklarından su akması, sahabenin ihtiyacını karşılayan bir mucize olarak rivayet edilir." },

  // ---------- İSLAM VE İNSAN HAKLARI ----------
  { question:"İslam'da insanların ırk, renk gibi farklılıklara göre üstünlük iddia etmesi hangi ilkeyle reddedilir?", options:["Eşitlik ilkesi (üstünlük sadece takvadadır)","Kast sistemi","Sınıf ayrımı","Hiçbir ilke yoktur"], correctIndex:0, hint:"Veda Hutbesi'nde bu konuya değinilmiştir.", explanation:"İslam'da üstünlüğün sadece takvada olduğu, ırk/renk farklılıklarının üstünlük sebebi olmadığı vurgulanır." },
  { question:"Veda Hutbesi'nde Hz. Peygamber'in vurguladığı temel haklardan biri hangisidir?", options:["Sadece erkeklerin hakları","Can, mal ve namus güvenliği","Sadece zenginlerin hakları","Sadece Araplara özgü haklar"], correctIndex:1, hint:"Evrensel insan hakları ilkeleriyle örtüşür.", explanation:"Veda Hutbesi'nde can, mal ve namus güvenliğinin dokunulmazlığı vurgulanmıştır." },
  { question:"Veda Hutbesi'nde kadın hakları konusunda Hz. Peygamber ne öğütlemiştir?", options:["Kadınlara iyi davranılmasını","Kadınların hiçbir hakkı olmadığını","Kadınların görmezden gelinmesini","Bu konuya hiç değinmemiştir"], correctIndex:0, hint:"Kadınlara karşı sorumluluğun altını çizmiştir.", explanation:"Veda Hutbesi'nde Hz. Peygamber, kadınlara iyi davranılması gerektiğini vurgulamıştır." },

  // ---------- SAHABE İLİM ADAMLARI ----------
  { question:"Sahabe arasında hadis ilminde en çok rivayette bulunan (en çok hadis nakleden) kimdir?", options:["Hz. Ömer","Ebu Hureyre","Hz. Ali","Abdullah b. Mesud"], correctIndex:1, hint:"Hz. Peygamber'in yanında uzun süre bulunmuştur.", explanation:"Sahabe arasında en çok hadis rivayet eden kişi Ebu Hureyre'dir (r.a.)." },
  { question:"Sahabe arasında Kur'an tefsirinde otorite kabul edilen, 'tercüman-ı Kur'an' unvanıyla anılan kimdir?", options:["Abdullah b. Ömer","Abdullah b. Abbas","Abdullah b. Mesud","Muaz b. Cebel"], correctIndex:1, hint:"Hz. Peygamber'in amcasının oğludur.", explanation:"Kur'an tefsirinde otorite kabul edilen ve 'tercüman-ı Kur'an' unvanıyla anılan sahabe Abdullah b. Abbas'tır." },
  { question:"Sahabe arasında fıkıh (İslam hukuku) ilminde önde gelen isimlerden biri, aynı zamanda Kufe'ye kadı olarak gönderilen kimdir?", options:["Abdullah b. Mesud","Muaz b. Cebel","Zeyd b. Sabit","Ebu Musa el-Eş'ari"], correctIndex:0, hint:"Kur'an'ı ilk ezberleyenlerden biridir.", explanation:"Fıkıh ilminde önde gelen ve Kufe'ye gönderilen sahabe Abdullah b. Mesud'dur." },
  { question:"Kur'an'ı Hz. Peygamber döneminde tam olarak ezberleyen sahabelerden biri olan ve aynı zamanda vahiy katipliği yapan kimdir?", options:["Zeyd b. Sabit","Ebu Hureyre","Selman-ı Farisi","Bilal-i Habeşi"], correctIndex:0, hint:"Kur'an'ın Hz. Ebu Bekir döneminde toplanmasında görev almıştır.", explanation:"Kur'an'ı ezberleyen ve vahiy katipliği yapan, Kur'an'ın toplanmasında da görev alan sahabe Zeyd b. Sabit'tir." },

  // ---------- İSLAM'DA ÇALIŞMA VE HELAL KAZANÇ ----------
  { question:"İslam'da çalışıp helal kazanç elde etmenin hükmü nasıl değerlendirilir?", options:["Gereksizdir","Övülen, teşvik edilen bir davranıştır","Yasaktır","Sadece zenginler için önemlidir"], correctIndex:1, hint:"'Helal kazanç için çalışmak ibadettir' anlayışı vardır.", explanation:"İslam'da helal kazanç için çalışmak, övülen ve teşvik edilen bir davranıştır." },
  { question:"Hz. Peygamber'in 'En hayırlı kazanç hangisidir?' sorusuna verdiği cevaplardan biri nedir (rivayete göre)?", options:["Sadece miras","Kişinin kendi elinin emeğiyle kazandığı","Sadece ticaret","Sadece tarım"], correctIndex:1, hint:"Emek ve alın teri vurgulanır.", explanation:"Rivayete göre en hayırlı kazanç, kişinin kendi el emeğiyle kazandığıdır." },

  // ---------- EK KAVRAMLAR: SABIR TÜRLERİ ----------
  { question:"İslam alimleri sabrı genellikle kaç kısımda değerlendirir?", options:["2 (ibadette sabır, günahtan sabır)","3 (ibadette, günahtan, musibete karşı sabır)","5","Hiçbir sınıflandırma yoktur"], correctIndex:1, hint:"İbadete devam, günahtan kaçınma ve belalara karşı dayanma şeklinde ele alınır.", explanation:"Sabır genellikle ibadette sabır, günahtan sabır ve musibete karşı sabır olmak üzere 3 kısımda değerlendirilir." },

  // ---------- İSLAM'DA GÜZEL AHLAK ÖRNEKLERİ ----------
  { question:"Hz. Peygamber'in ahlakı, Kur'an'da hangi ayetle özel olarak övülmüştür?", options:["'Sen elbette yüce bir ahlak üzeresin' (Kalem suresi)","'Oku!' (Alak suresi)","'De ki: O Allah birdir' (İhlas suresi)","'Elhamdülillah' (Fatiha suresi)"], correctIndex:0, hint:"Kalem suresinde geçer.", explanation:"Hz. Peygamber'in ahlakı, Kalem suresinde 'Sen elbette yüce bir ahlak üzeresin' ayetiyle övülmüştür." },
  { question:"Hz. Peygamber'in 'Ben güzel ahlakı tamamlamak için gönderildim' sözü, İslam'da neyin önemini vurgular?", options:["Sadece ibadetlerin","Ahlakın, dinin temel amaçlarından biri olduğunu","Sadece savaşın","Sadece ticaretin"], correctIndex:1, hint:"Peygamberliğin amaçlarından birine işaret eder.", explanation:"Bu söz, güzel ahlakın İslam'ın temel amaçlarından biri olduğunu vurgular." },

  // ---------- HZ. PEYGAMBER'İN SAVAŞ AHLAKI ----------
  { question:"Hz. Peygamber'in savaş kurallarında, hangi gruplara zarar verilmemesi özellikle emredilmiştir?", options:["Sadece askerlere","Kadın, çocuk, yaşlı ve savaşmayan sivillere","Sadece zenginlere","Hiçbir kısıtlama yoktur"], correctIndex:1, hint:"Savaş ahlakının temel ilkelerindendir.", explanation:"Hz. Peygamber'in savaş kurallarında kadın, çocuk, yaşlı ve savaşmayan sivillere zarar verilmemesi emredilmiştir." },
  { question:"İslam'da savaş sırasında ağaçların kesilmemesi, hayvanların öldürülmemesi gibi kurallar hangi ilkeyle açıklanır?", options:["Çevre ve doğaya saygı ilkesiyle","Hiçbir gerekçesi yoktur","Sadece ekonomik kaygıyla","Sadece estetik kaygıyla"], correctIndex:0, hint:"Savaşta bile ölçülü davranmayı öğütler.", explanation:"Savaşta gereksiz tahribattan kaçınma, çevreye ve doğaya saygı ilkesiyle açıklanır." },

  // ---------- İSLAM'DA KOMŞULUK VE TOPLUMSAL İLİŞKİLER ----------
  { question:"Hz. Peygamber'in komşuluk hakkı konusundaki hassasiyeti hangi sözle ifade edilir?", options:["'Cebrail bana komşu hakkında o kadar tavsiyede bulundu ki, onu mirasçı kılacağını sandım' sözüyle","Hiçbir söz yoktur","Sadece akrabalık önemlidir","Komşuluk önemsizdir"], correctIndex:0, hint:"Komşu hakkının önemini vurgulayan meşhur bir sözdür.", explanation:"Hz. Peygamber'in bu sözü, komşuluk hakkının ne kadar önemli olduğunu göstermektedir." },
  { question:"İslam'da toplumsal dayanışmayı güçlendiren, zenginden fakire kaynak aktarımını sağlayan temel ibadet hangisidir?", options:["Namaz","Zekat","Oruç","Hac"], correctIndex:1, hint:"Malın belirli bir kısmının muhtaçlara verilmesidir.", explanation:"Toplumsal dayanışmayı güçlendiren temel ibadet zekattır." },

  // ---------- SON EK KONULAR ----------
  { question:"İslam'da yetimlere iyi davranmanın önemi hangi ayet/hadislerle özellikle vurgulanır?", options:["'Yetimin malına yaklaşmayın' türü ayetlerle","Hiçbir vurgu yoktur","Sadece hadislerde geçer","Önemsiz bir konudur"], correctIndex:0, hint:"Hz. Peygamber'in kendisi de yetim büyümüştür.", explanation:"Yetimlere iyi davranmak, Kur'an'da 'yetimin malına yaklaşmayın' gibi ayetlerle vurgulanır." },
  { question:"Hz. Peygamber'in kendisinin de yetim büyümesi, İslam'da yetimlere karşı tutumu nasıl etkilemiştir?", options:["Hiçbir etkisi olmamıştır","Yetimlere şefkatin önemini daha da güçlendirmiştir","Yetimlerin görmezden gelinmesine yol açmıştır","Konuyla ilgisi yoktur"], correctIndex:1, hint:"Kişisel tecrübesi, bu konudaki duyarlılığını artırmıştır.", explanation:"Hz. Peygamber'in yetim büyümesi, yetimlere şefkat gösterilmesi gerektiği vurgusunu güçlendirmiştir." },
  { question:"İslam'da 'emanet' kavramı sadece maddi eşyalarla mı sınırlıdır?", options:["Evet, sadece maddi eşyalarla sınırlıdır","Hayır, görev, sır, söz gibi manevi şeyleri de kapsar","Sadece parayla ilgilidir","Sadece mülkle ilgilidir"], correctIndex:1, hint:"Geniş bir kavramdır.", explanation:"Emanet kavramı, maddi eşyaların yanı sıra görev, sır, verilen söz gibi manevi şeyleri de kapsar." },
  { question:"İslam'da bir sözleşmeye/anlaşmaya bağlı kalmanın önemi hangi ilkeyle ifade edilir?", options:["Ahde vefa (sözünde durma)","Riya","Kibir","Nifak"], correctIndex:0, hint:"'Söze bağlılık' anlamına gelir.", explanation:"Sözleşmelere/anlaşmalara bağlı kalma ilkesine ahde vefa denir." },
  { question:"Hz. Peygamber'in, verdiği sözleri tutması ve anlaşmalara bağlı kalması hangi olayda özellikle örnek gösterilir?", options:["Hudeybiye Antlaşması'na bağlılığında","Sadece Bedir Savaşı'nda","Sadece Uhud Savaşı'nda","Hiçbir örnek yoktur"], correctIndex:0, hint:"Antlaşma şartları Müslümanların aleyhine görünse de bağlı kalınmıştır.", explanation:"Hz. Peygamber'in Hudeybiye Antlaşması'na bağlılığı, ahde vefanın önemli bir örneğidir." },
  { question:"İslam'da 'emr-i bi'l maruf' görevi öncelikle kimlere aittir?", options:["Sadece yöneticilere","Gücü yeten her Müslümana (kademeli olarak)","Sadece alimlere","Sadece askerlere"], correctIndex:1, hint:"Elle, dille veya kalben yapılabileceği belirtilir.", explanation:"İyiliği emretme kötülükten sakındırma görevi, gücü yeten her Müslümana kademeli olarak aittir." },
  { question:"İslam'da 'sıla-i rahim'i kesmenin (akrabalık bağlarını koparmanın) hükmü nasıl değerlendirilir?", options:["Övülen bir davranıştır","Kınanan, günah kabul edilen bir davranıştır","Önemsizdir","Sadece kadınlar için geçerlidir"], correctIndex:1, hint:"Akrabalık bağlarının sürdürülmesi teşvik edilir, kesilmesi kınanır.", explanation:"Akrabalık bağlarını koparmak (sıla-i rahmi kesmek), İslam'da kınanan bir davranıştır." },
  { question:"Hz. Peygamber'in vefatından sonra, Kur'an'ın kitap haline getirilme sürecinde en çok endişe edilen konu neydi?", options:["Kur'an'ın unutulma/kaybolma riski","Kur'an'ın çok pahalı olması","Kur'an'ın çok uzun olması","Hiçbir endişe yoktu"], correctIndex:0, hint:"Hafızların savaşlarda şehit olması bu endişeyi artırmıştır.", explanation:"Yemame Savaşı'nda birçok hafızın şehit olması, Kur'an'ın kaybolma riskine dair endişeyi artırmış ve toplanmasına vesile olmuştur." },
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
  islamiCesitliKonular.forEach(q => {
    if(!existingTexts.has(q.question.trim())) toAdd.push(Object.assign({category:'islami'}, q));
  });

  console.log('Toplam hazırlanan soru:', islamiCesitliKonular.length);
  console.log('Zaten var olan (atlanan):', islamiCesitliKonular.length - toAdd.length);
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
