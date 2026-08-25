// "sorular.docx" dosyasından (5 şıklı, 100 soru) gelen İslami Bilgiler sorularını
// Firestore'a yükler. Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar
// eklenmez, güvenle tekrar çalıştırılabilir.
// NOT: Bu belgede, 100. sorunun açıklamasına yanlışlıkla karışmış görünen ayrı
// bir "50 ek soru" bloğu tespit edildi ve o blok KASITLI OLARAK bu dosyaya
// dahil edilmedi (kullanıcının belgede bıraktığı "kontrol etmeden ekleme" notuna
// uyularak).

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


const newIslami5Opt = [
  { question:"Kur'an-ı Kerim'in ilk inen ayetleri hangi surededir?", options:["Fatiha Suresi","Alak Suresi (1-5)","Müddessir Suresi","Yasin Suresi","Bakara Suresi"], correctIndex:1, explanation:"İlk vahyolunan ayetler Alak suresinin ilk 5 ayetidir ('Oku' emriyle başlar)." },
  { question:"Kur'an-ı Kerim'in en uzun suresi hangisidir?", options:["Âl-i İmrân","Nisâ","Bakara","A'râf","Mâide"], correctIndex:2, explanation:"Bakara Suresi 286 ayet ile Kur'an-ı Kerim'in en uzun suresidir." },
  { question:"Kur'an-ı Kerim'in en kısa suresi hangisidir?", options:["İhlas","Kevser","Felak","Nas","Asr"], correctIndex:1, explanation:"Kevser Suresi 3 ayetten oluşur ve en kısa suredir." },
  { question:"Kur'an-ı Kerim hangi halife döneminde kitap (mushaf) haline getirilmiştir?", options:["Hz. Ebubekir (r.a.)","Hz. Ömer (r.a.)","Hz. Osman (r.a.)","Hz. Ali (r.a.)","Hz. Muaviye"], correctIndex:0, explanation:"Yemame Savaşında hafızların şehit olması üzerine Hz. Ebubekir döneminde Zeyd b. Sabit başkanlığındaki heyetçe Mushaf haline getirilmiştir." },
  { question:"Kur'an-ı Kerim hangi halife döneminde çoğaltılarak önemli merkezlere gönderilmiştir?", options:["Hz. Ebubekir","Hz. Ömer","Hz. Osman","Hz. Ali","Hz. Hasan"], correctIndex:2, explanation:"Hz. Osman döneminde kıraat farklılıklarını gidermek amacıyla çoğaltılmıştır." },
  { question:"Kur'an-ı Kerim'de toplam kaç sure bulunmaktadır?", options:["110","112","114","116","120"], correctIndex:2, explanation:"Kur'an-ı Kerim 114 sureden oluşmaktadır." },
  { question:"Ayet kelimelerinin ve anlamlarının açıklanıp yorumlanması ilmine ne ad verilir?", options:["Tecvid","Fıkıh","Tefsir","Hadis","Kelam"], correctIndex:2, explanation:"Kur'an ayetlerinin manalarını açıklama ilmine Tefsir denir." },
  { question:"Kur'an-ı Kerim'de adından açıkça bahsedilen tek sahabe kimdir?", options:["Hz. Ebubekir","Hz. Ömer","Hz. Zeyd b. Harise","Hz. Hamza","Hz. Bilal-i Habeşi"], correctIndex:2, explanation:"Ahzab Suresi 37. ayette Hz. Zeyd b. Harise'nin adı açıkça geçmektedir." },
  { question:"Başında Besmele bulunmayan tek sure hangisidir?", options:["Tövbe (Berae) Suresi","Enfal Suresi","Yasin Suresi","Neml Suresi","Rahman Suresi"], correctIndex:0, explanation:"Tövbe Suresi'nin başında besmele yoktur; ancak Neml Suresinde iki besmele geçer." },
  { question:"İçerisinde iki defa Besmele geçen sure hangisidir?", options:["Bakara","Neml Suresi","Mülk","Fatiha","İhlas"], correctIndex:1, explanation:"Neml Suresi hem başında hem de Hz. Süleyman'ın mektubu içinde (30. ayet) besmele içerir." },
  { question:"Kur'an-ı Kerim'in 'kalbi' olarak nitelendirilen sure hangisidir?", options:["Fatiha","Yasin Suresi","Rahman","İhlas","Ayet-el Kürsi"], correctIndex:1, explanation:"Hadis-i şeriflerde Yasin Suresi Kur'an'ın kalbi olarak ifade edilmiştir." },
  { question:"Kur'an-ı Kerim'in üslup ve kelime dizilişi yönünden bir benzerinin oluşturulamaması mucizesine ne denir?", options:["İ'cazü'l-Kur'an","Tecvid","Tahrif","Kıraat","Tevil"], correctIndex:0, explanation:"Kur'an'ın insan gücünü aşan edebi ve manevi mucizeliğine İ'cazü'l-Kur'an denir." },
  { question:"Sadece Mekke döneminde nazil olan surelere ne ad verilir?", options:["Medeni Sure","Mekki Sure","Muhkem Sure","Müteşabih Sure","Garib Sure"], correctIndex:1, explanation:"Hicretten önce Mekke'de inen surelere Mekki sure denir." },
  { question:"Anlamı kapalı olan, birden fazla manaya gelen ve yorum gerektiren ayetlere ne denir?", options:["Muhkem Ayet","Müteşabih Ayet","Mensuh Ayet","Nasih Ayet","Makbul Ayet"], correctIndex:1, explanation:"Açık ve tek anlamlı ayetlere Muhkem, derin yorum gerektiren veya manası gaybi olanlara Müteşabih denir." },
  { question:"Kur'an-ı Kerim'in harflerinin mahreç ve sıfatlarına uyarak doğru okunması ilmine ne denir?", options:["Tefsir","Kıraat","Tecvid","Belagat","Siyer"], correctIndex:2, explanation:"Tecvid, Kur'an harflerini usulüne uygun ve doğru seslendirme kural ilmidir." },
  { question:"Kur'an-ı Kerim'de 'Ümmü'l-Kitab' (Kitabın Anası) olarak anılan sure hangisidir?", options:["Bakara","Fatiha Suresi","Yasin","İhlas","Ayet-el Kürsi"], correctIndex:1, explanation:"Fatiha Suresi Kur'an'ın özü ve özeti olduğu için Ümmü'l-Kitab adını alır." },
  { question:"Kur'an'da adıyla sure bulunan kadın şahsiyet kimdir?", options:["Hz. Asiye","Hz. Meryem","Hz. Hatice","Hz. Aişe","Hz. Fatima"], correctIndex:1, explanation:"Meryem Suresi Hz. Meryem'in adını taşımaktadır." },
  { question:"Peygamberimize Kur'an-ı Kerim'in indirildiği mübarek gece hangisidir?", options:["Berat Kandili","Kadir Gecesi","Miraç Kandili","Regaip Kandili","Mevlid Kandili"], correctIndex:1, explanation:"Kadir Suresinde belirtildiği üzere Kur'an Kadir Gecesinde indirilmeye başlanmıştır." },
  { question:"Kur'an-ı Kerim'deki her 20 sayfadan oluşan alt bölümlere ne ad verilir?", options:["Sure","Ayet","Cüz","Hizip","Durak"], correctIndex:2, explanation:"Kur'an-ı Kerim 30 cüzden oluşur, her cüz yaklaşık 20 sayfadır." },
  { question:"Hükmü yürürlükten kaldıran ayete ne ad verilir?", options:["Mensuh","Nasih","Müteşabih","Muhkem","İcmal"], correctIndex:1, explanation:"Hükmü değiştiren/kaldıran ayete Nasih, hükmü kalkan ayete Mensuh denir." },
  { question:"Peygamber Efendimiz (s.a.v.) hangi yılda doğmuştur?", options:["571 (Fil Yılı)","610","622","632","580"], correctIndex:0, explanation:"Peygamberimiz 20 Nisan 571 (Rebiülevvel ayı) Fil Yılında Mekke'de doğmuştur." },
  { question:"Peygamber Efendimizin annesinin adı nedir?", options:["Halime","Âmine","Şeyma","Fatıma","Hatice"], correctIndex:1, explanation:"Efendimizin annesi Hz. Âmine bint Vehb'dir." },
  { question:"Peygamberimizin sütannesi kimdir?", options:["Ümmü Ayman","Halime-i Sa'diyye","Fatıma bint Esed","Süveybe","Şeyma"], correctIndex:1, explanation:"Peygamberimiz çocukluğunda Halime hatunun yanında kalmıştır." },
  { question:"Peygamber Efendimize 'el-Emin' (Güvenilir) lakabını kimler vermiştir?", options:["Medineliler","Mekke Halkı (Cahiliye Toplumu)","Ashab-ı Suffe","Ensar","Hristiyan Rahipler"], correctIndex:0, explanation:"Dürüstlüğü ve doğruluğu sebebiyle gençliğinde Mekke halkı ona el-Emin demiştir." },
  { question:"Peygamberimize ilk vahiy nerede ve kaç yılında gelmiştir?", options:["Sevr Mağarası - 622","Hira Mağarası - 610","Uhud Dağı - 615","Kabe - 610","Mescid-i Nebevi - 622"], correctIndex:1, explanation:"İlk vahiy 610 yılında Ramazan ayında Hira Mağarasında gelmiştir." },
  { question:"İslam tarihinin ilk yazılı anayasası kabul edilen metin hangisidir?", options:["Hudeybiye Antlaşması","Medine Sözleşmesi","Veda Hutbesi","Akabe Biatları","Erdemliler İttifakı"], correctIndex:1, explanation:"Hicretten sonra Müslümanlar, Yahudiler ve yerli halk arasında imzalanan Medine Sözleşmesidir." },
  { question:"Müslümanların Mekke'den Medine'ye yaptıkları büyük hicret hangi yılda gerçekleşmiştir?", options:["610","615","622","630","632"], correctIndex:2, explanation:"Büyük Hicret 622 yılında gerçekleşmiş ve Hicri takvimin başlangıcı olmuştur." },
  { question:"Müslümanların Müşriklere karşı kazandığı ilk büyük askeri zafer hangisidir?", options:["Uhud Savaşı","Bedir Savaşı","Hendek Savaşı","Huneyn Savaşı","Mute Savaşı"], correctIndex:1, explanation:"624 (H. 2) yılında yapılan Bedir Savaşı Müslümanların ilk büyük zaferidir." },
  { question:"Müslümanların savunma amacıyla etrafına hendek kazdığı savaş hangisidir?", options:["Uhud","Hendek (Ahzab) Savaşı","Tabuk","Hayber","Taif"], correctIndex:1, explanation:"Hz. Selman-ı Farisi'nin teklifiyle Medine etrafına hendek kazılmıştır." },
  { question:"Mekke hangi yılda savaş yapılmadan fethedilmiştir?", options:["622","628","630 (Hicri 8)","632","636"], correctIndex:2, explanation:"Mekke 630 yılında barış ve genel afla fethedilmiştir." },
  { question:"Peygamber Efendimizin vefatından önce yüz bini aşkın Müslümana irad ettiği konuşmaya ne denir?", options:["Akabe Biatı","Veda Hutbesi","Medine Anayasası","Hudeybiye Hitabı","Mescid Konuşması"], correctIndex:1, explanation:"632 yılında Veda Haccı esnasında insan hakları evrensel bildirisi niteliğindeki Veda Hutbesi irad edilmiştir." },
  { question:"Peygamber Efendimizin kabrinin bulunduğu Mescid-i Nebevi'deki özel bölüme ne denir?", options:["Suffe","Ravza-i Mutahhara","Mihrap","Minber","Mültezem"], correctIndex:1, explanation:"Evimle minberim arası cennet bahçelerinden bir bahçedir buyurulan yere Ravza-i Mutahhara denir." },
  { question:"Peygamberimizin genelde tüccar gençlerle kurduğu, haksızlığa uğrayanları koruma cemiyetinin adı nedir?", options:["Ashab-ı Suffe","Hilfü'l-Fudûl (Erdemliler İttifakı)","Daru'l-Erkam","Daru'n-Nedve","Ensar Birliği"], correctIndex:1, explanation:"Peygamberimiz gençliğinde zayıfların hakkını koruyan Hilfü'l-Fudûl topluluğuna katılmıştır." },
  { question:"İslam'da ilk şehit olan karı-koca sahabe kimlerdir?", options:["Hz. Hamza ve Hz. Sümeyye","Hz. Yasir ve Hz. Sümeyye","Hz. Ammar ve Hz. Hatice","Hz. Mus'ab ve Hz. Nesibe","Hz. Cafer ve Hz. Asma"], correctIndex:1, explanation:"Ammar b. Yasir'in anne ve babası Hz. Yasir ve Hz. Sümeyye ilk şehitlerdir." },
  { question:"Medine'ye İslam'ı öğretmek üzere gönderilen ilk öğretmen sahabe kimdir?", options:["Hz. Mus'ab b. Umeyr","Hz. Muaz b. Cebel","Hz. Bilal-i Habeşi","Hz. Zeyd b. Harise","Hz. Usame b. Zeyd"], correctIndex:0, explanation:"1. Akabe Biatı sonrası Medine'ye Kur'an ve İslam öğretmeni olarak Mus'ab b. Umeyr gönderilmiştir." },
  { question:"Kendisine 'Kelimullah' (Allah ile konuşan) lakabı verilen peygamber hangisidir?", options:["Hz. İbrahim","Hz. Musa","Hz. İsa","Hz. Nuh","Hz. Yusuf"], correctIndex:1, explanation:"Hz. Musa Tur Dağında Allah ile vasıtasız konuştuğu için Kelimullah denir." },
  { question:"Kendisine 'Halilullah' (Allah'ın Dostu) lakabı verilen peygamber hangisidir?", options:["Hz. İbrahim","Hz. İsmail","Hz. Yakub","Hz. Adem","Hz. Süleyman"], correctIndex:0, explanation:"Hz. İbrahim sadakati ve samimiyeti sebebiyle Halilullah adını almıştır." },
  { question:"Sabrı ile sembolleşen ve ağır hastalıklara mücadelesiyle bilinen peygamber kimdir?", options:["Hz. Eyyub (a.s.)","Hz. Yunus","Hz. Lut","Hz. Şuaib","Hz. Davud"], correctIndex:0, explanation:"Hz. Eyyub büyük imtihanlara karşı gösterdiği sabırla örnek gösterilmiştir." },
  { question:"Gemisi Cudi Dağına oturan ve ikinci insanlığın babası kabul edilen peygamber kimdir?", options:["Hz. Âdem","Hz. Nuh (a.s.)","Hz. İdris","Hz. Salih","Hz. Hud"], correctIndex:1, explanation:"Büyük tufandan sonra insanlık Hz. Nuh'un neslinden devam etmiştir." },
  { question:"Peygamber Efendimizin doğduğu gece gerçekleştiği rivayet edilen mucizelerden biri hangisidir?", options:["Kabe'deki putların devrilmesi","Save gölünün kuruması","Mecusilerin bin yıldır yanan ateşinin sönmesi","Kisra sarayının sütunlarının yıkılması","Hepsi"], correctIndex:4, explanation:"Peygamberimizin doğumuyla alemde büyük harikulade olaylar yaşanmıştır." },
  { question:"İslam dininde iman esasları toplam kaç tanedir?", options:["4","5","6","7","12"], correctIndex:2, explanation:"İmanın esasları 6'dır (Allah'a, Meleklere, Kitaplara, Peygamberlere, Ahirete, Kader ve Kazaya iman)." },
  { question:"Allah'ın varlığı ve birliğini ifade eden tevhid inancının zıddı olan kavram hangisidir?", options:["Nifak","Şirk","Küfür","Fısık","Bid'at"], correctIndex:1, explanation:"Allah'a ortak koşmaya Şirk denir." },
  { question:"Allah'ın sadece kendine has olan ve yaratıklarında bulunmayan sıfatlarına ne denir?", options:["Zâti Sıfatlar","Subûti Sıfatlar","Fiili Sıfatlar","Manevi Sıfatlar","Selbi Sıfatlar"], correctIndex:0, explanation:"Zati sıfatlar yalnızca Allah'a mahsustur (Vücud, Kıdem, Beka, Vahdaniyet, Muhalefetün lil-havadis, Kıyam binefsihi)." },
  { question:"Allah'ın sonradan yaratılan şeylere benzetilemeyeceğini ifade eden zâti sıfat hangisidir?", options:["Vahdaniyet","Muhalefetün li'l-havadis","Kıyam bi-nefsihi","Beka","Kıdem"], correctIndex:1, explanation:"Muhalefetün lil-havadis: Yarattıklarına sonradan olan hiçbir şeye benzememek demektir." },
  { question:"Allah'ın başlangıcının olmaması anlamına gelen sıfat hangisidir?", options:["Beka","Kıdem","Vücud","İrade","İlim"], correctIndex:1, explanation:"Kıdem: Ezeli olmak, başlangıcı bulunmamak demektir." },
  { question:"Dört büyük melekten vahiy getirmekle görevli olan melek kimdir?", options:["Azrail","Cebrail","Mikail","İsrafil","Rıdvan"], correctIndex:1, explanation:"Cebrail (a.s.) peygamberlere vahiy getirmekle görevlidir." },
  { question:"Sura üflemekle görevli olan melek hangisidir?", options:["Cebrail","İsrafil","Mikail","Azrail","Kiramen Katibin"], correctIndex:1, explanation:"İsrafil (a.s.) kıyamet günü ve yeniden dirilişte sura üfleyecektir." },
  { question:"Tabiat olaylarını ve rızıkları idare etmekle görevli melek hangisidir?", options:["Cebrail","Mikail","İsrafil","Azrail","Malik"], correctIndex:1, explanation:"Mikail (a.s.) doğa olayları ve rızık dağıtımı ile görevlidir." },
  { question:"İnsanın sağında ve solunda bulunup iyilik ve kötülükleri yazan meleklere ne denir?", options:["Müneker ve Nekir","Kiramen Kâtibin","Muakkibe","Hamele-i Arş","Zebaniler"], correctIndex:1, explanation:"Kiramen Katibin değerli yazıcı meleklerdir." },
  { question:"Kabirde insanları sorgulamakla görevli melekler hangileridir?", options:["Kiramen Katibin","Münker ve Nekir","Rıdvan ve Malik","Cebrail ve Mikail","Zebaniler"], correctIndex:1, explanation:"Münker ve Nekir kabirde ilk sorguyu yaparlar." },
  { question:"Peygamberlerin günah işlemekten korunmuş olmaları sıfatına ne denir?", options:["Sıdk","Emanet","İsmet","Fetanet","Tebliğ"], correctIndex:2, explanation:"İsmet sıfatı peygamberlerin günahsızlığı anlamına gelir." },
  { question:"Peygamberlerin üstün zekâ ve anlayış sahibi olmalarını ifade eden sıfat hangisidir?", options:["Fetanet","Sıdk","Tebliğ","Adalet","İhlas"], correctIndex:0, explanation:"Fetanet peygamberlerin yüksek akıl ve zekaya sahip olmalarıdır." },
  { question:"Allah'ın ezelde takdir ettiği olayların zamanı gelince gerçekleşmesine ne denir?", options:["Kader","Kaza","Tevekkül","Rızık","Ecel"], correctIndex:1, explanation:"Ezelde planlanmasına Kader, zamanı gelince gerçekleşmesine Kaza denir." },
  { question:"Kişinin elinden gelen gayreti gösterdikten sonra sonucu Allah'a bırakıp güvenmesine ne denir?", options:["Tefekkür","Tevekkül","Tövbe","İhlas","Zühd"], correctIndex:1, explanation:"Gerekli tedbirleri alıp Allah'a dayanmaya Tevekkül denir." },
  { question:"Öldükten sonra insanların diriltilip toplandığı büyük mahşer meydanına dirilme olayına ne denir?", options:["Ba's","Haşir","Mizan","Sırat","Berzah"], correctIndex:0, explanation:"Yeniden dirilmeye Ba's, toplanmaya Haşir denir." },
  { question:"Ölümle başlayıp kıyamete kadar süren kabir hayatı dönemine ne ad verilir?", options:["Mahşer","Berzah Âlemi","Ahiret","Mizan","Gayb"], correctIndex:1, explanation:"Dünya ile ahiret arasındaki geçiş dönemine Berzah alemi denir." },
  { question:"Ahirette sevap ve günahların tartıldığı manevi teraziye ne denir?", options:["Sırat","Mizan","Kevser","Levh-i Mahfuz","Arş"], correctIndex:1, explanation:"Mizan amellerin tartıldığı adalet terazisidir." },
  { question:"İnanmadığı halde inanmış gibi görünen çift yüzlü kişilere ne ad verilir?", options:["Kâfir","Münafık","Müşrik","Fâsık","Mülhit"], correctIndex:1, explanation:"Kalben inanmayıp diliyle inandım diyen kişiye Münafık denir." },
  { question:"Amellerin sadece ve sadece Allah rızası için katıksız yapılmasına ne ad verilir?", options:["Takva","İhlas","İhsan","Sıdk","Vefa"], correctIndex:1, explanation:"İbadet ve davranışlarda sırf Allah rızasını gözetmeye İhlas denir." },
  { question:"Allah'ı görüyormuşçasına ibadet etme bilincine ne denir?", options:["İhlas","İhsan","Takva","Huşû","Zühd"], correctIndex:1, explanation:"Cebrail hadisinde İhsan: 'Allah'ı görüyormuş gibi ibadet etmendir' şeklinde tanımlanmıştır." },
  { question:"İslam'ın şartları toplam kaç tanedir?", options:["4","5","6","7","10"], correctIndex:1, explanation:"İslam'ın şartları 5'tir (Kelime-i Şehadet, Namaz, Zekat, Oruç, Hac)." },
  { question:"Namazın geçerli olması için dışından yapılması gereken şartlara ne denir?", options:["Namazın Rükünleri","Namazın Şartları (Dışındaki Farzlar)","Namazın Vacipleri","Namazın Sünnetleri","Namazın Adabı"], correctIndex:1, explanation:"Namazın içindekilere Rükün, dışındakilere Şart (Farz) denir." },
  { question:"Su bulunmadığı veya suyu kullanma imkanı olmadığı durumda toprakla yapılan temizliğe ne denir?", options:["Gusül","Teyemmüm","Abdest","Taharet","Necasetten Taharet"], correctIndex:1, explanation:"Toprak veya toprak cinsinden bir şeyle teyemmüm yapılır." },
  { question:"Namazda ayakta durmaya ne ad verilir?", options:["Kıyam","Kıraat","Rükû","Secde","Ka'de-i Âhire"], correctIndex:0, explanation:"Namazın rükünlerinden ayakta durmaya Kıyam denir." },
  { question:"Namazda Kur'an-ı Kerim'den ayet okumaya ne ad verilir?", options:["Kıyam","Kıraat","İftitah Tekbiri","Secde","Teşehhüd"], correctIndex:1, explanation:"Namazda ayakta iken Kur'an okumaya Kıraat denir." },
  { question:"Cuma ve Bayram namazlarından önce veya sonra imamın minbere çıkıp yaptığı konuşmaya ne denir?", options:["Vaaz","Hutbe","Dua","Kamet","Zikir"], correctIndex:1, explanation:"Cuma ve bayram namazlarının şartlarından biri Hutbedir." },
  { question:"Ramazan ayında yatsı namazından sonra kılınan sünnet-i müekkede namaz hangisidir?", options:["Teheccüd","Teravih Namazı","İşrak","Duha","Evvabin"], correctIndex:1, explanation:"Ramazan gecelerine özel kılınan namaz Teravih namazıdır." },
  { question:"Belli bir birikime (nisap miktarı) sahip olan Müslümanların yılda bir vermesi gereken mali ibadet hangisidir?", options:["Sadaka-i Fıtır","Zekât","Öşür","İnfak","Fidye"], correctIndex:1, explanation:"Zekat nisap miktarı mala sahip olanlara farz olan mali ibadettir." },
  { question:"Zekat verilecek asgari zenginlik ölçüsüne ne ad verilir?", options:["Nisap Miktarı","Öşür","Hukuk","İnfak","Kifayet"], correctIndex:0, explanation:"Dinen zengin sayılma sınırı Nisap miktarıdır (80.18 gram altın veya dengi)." },
  { question:"Ramazan ayında bayramdan önce verilmesi vacip olan sadakaya ne denir?", options:["Sadaka-i Cariye","Fitre (Sadaka-i Fıtır)","Zekat","Fidye","Nafaka"], correctIndex:1, explanation:"Ramazan bayramına ulaşmanın şükrü olarak verilen fitredir." },
  { question:"Toprak ürünlerinden alınan zekata ne ad verilir?", options:["Cizye","Öşür (Aşar)","Haraç","Fidye","Zekat"], correctIndex:1, explanation:"Tarım ürünlerinden alınan zekata Öşür denir (sulama masrafı yoksa 1/10, varsa 1/20)." },
  { question:"Haccın farzları toplam kaç tanedir?", options:["2","3 (İhram, Arafat Vakfı, Ziyaret Tavafı)","5","7","10"], correctIndex:1, explanation:"Haccın farzları 3'tür: İhram, Arafat'ta Vakfe ve Ziyaret Tavafı." },
  { question:"Kabe'nin etrafında bir defa dönmeye ne ad verilir?", options:["Şavt","Tavaf","Say","Vakfe","Remi"], correctIndex:0, explanation:"Kabe etrafında 1 dönüşe Şavt, 7 şavta 1 Tavaf denir." },
  { question:"Safa ile Merve tepeleri arasında 7 kez gidip gelmeye ne ad verilir?", options:["Tavaf","Sa'y","Vakfe","İhram","Mina"], correctIndex:1, explanation:"Hz. Hacer'in hatırasına Safa ve Merve arasında yapılan yürüyüşe Sa'y denir." },
  { question:"Hac veya umreye niyet edenlerin helal olan bazı davranışları kendine haram kılması durumuna ne denir?", options:["Mikat","İhram","Tecrit","Vakfe","Telbiye"], correctIndex:1, explanation:"İhram yasaklarına girmek hac ve umrenin ilk farzıdır." },
  { question:"Güneş battıktan sonra gece kılınan nafile namaza ne denir?", options:["Teheccüd Namazı","Duha","Evvabin","İşrak","Tahiyyetül Mescid"], correctIndex:0, explanation:"Gece uykudan uyanıp kılınan namaza Teheccüd denir." },
  { question:"Mescide girildiğinde mescidin selamlanması niyetiyle kılınan namaz hangisidir?", options:["Tahiyyetü'l-Mescid","İşrak","Kusuf","Istıska","Hacet"], correctIndex:0, explanation:"Camiye girince kılınan 2 rekatlık namazdır." },
  { question:"Güneş tutulduğunda kılınan sünnet namaza ne denir?", options:["Husuf Namazı","Küsuf Namazı","Istıska","Hacet","Teravih"], correctIndex:1, explanation:"Güneş tutulmasında Küsuf, ay tutulmasında Husuf namazı kılınır." },
  { question:"Ölen bir Müslüman için ayakta kılınan, rükusu ve secdesi olmayan dua niteliğindeki namaz hangisidir?", options:["Bayram Namazı","Cenaze Namazı","Şükür Namazı","Tesbih Namazı","Hacet Namazı"], correctIndex:1, explanation:"Cenaze namazı farz-ı kifaye olup rükusu ve secdesi yoktur." },
  { question:"Sözlükte 'kesin kararlılık, azim' anlamına gelen ve niyetin pekiştirilmesini sağlayan kavram fıkıhta neyi ifade eder?", options:["Azimet","Ruhsat","Farz","Vacip","Sünnet"], correctIndex:0, explanation:"Asli ve bağlayıcı dini hükümlere Azimet, kolaylaştırıcı hükümlere Ruhsat denir." },
  { question:"Hz. Peygamberin vefatından sonra ilk halife seçilen sahabi kimdir?", options:["Hz. Ömer","Hz. Ebubekir (r.a.)","Hz. Osman","Hz. Ali","Hz. Muaviye"], correctIndex:1, explanation:"Hz. Ebubekir Sıddık Dört Halifenin ilkidir." },
  { question:"Adaleti ile tanınan, Kudüs'ü fetheden ve Hicri takvimi başlatan halife kimdir?", options:["Hz. Ebubekir","Hz. Ömer (r.a.)","Hz. Osman","Hz. Ali","Hz. Hasan"], correctIndex:1, explanation:"Hz. Ömer adalet sembolü olup hicri takvimi ihdas etmiştir." },
  { question:"Kur'an-ı Kerim'i çoğaltan ve 'Zünnûreyn' (İki Nur Sahibi) lakabıyla anılan halife kimdir?", options:["Hz. Ebubekir","Hz. Ömer","Hz. Osman (r.a.)","Hz. Ali","Hz. Hamza"], correctIndex:2, explanation:"Peygamberimizin iki kızıyla sırayla evlendiği için Zünnureyn denmiştir." },
  { question:"İlim kapısı olarak bilinen, Hayber'de büyük kahramanlık gösteren dördüncü halife kimdir?", options:["Hz. Ebubekir","Hz. Ömer","Hz. Osman","Hz. Ali (r.a.)","Hz. Halid b. Velid"], correctIndex:3, explanation:"Hz. Ali 'Ben ilmin şehriyim Ali ise kapısıdır' hadisiyle övülmüştür." },
  { question:"Peygamber Efendimizin 'Allah'ın Çekilmiş Kılıcı' (Seyfullah) lakabını verdiği efsanevi komutan kimdir?", options:["Hz. Hamza","Hz. Halid b. Velid","Hz. Saad b. Abi Vakkas","Hz. Ebu Ubeyde","Hz. Ammar"], correctIndex:1, explanation:"Mute ve müteakip savaşlardaki dehasıyla Halid b. Velid'e Seyfullah denmiştir." },
  { question:"İslam ordusunun İran Sasani İmparatorluğu'na son verdiği tarihi savaş hangisidir?", options:["Kadisiye Savaşları / Nihavend","Yarmuk","Ecnadeyn","Talas","Hıttın"], correctIndex:0, explanation:"Hz. Ömer döneminde Kadisiye ve Nihavend savaşlarıyla Sasaniler yıkılmıştır." },
  { question:"İstanbul'u kuşatmaya gelip orada şehit düşen ve kabri Eyüpsultan'da bulunan yüce sahabe kimdir?", options:["Hz. Ebu Eyyûb el-Ensâri (r.a.)","Hz. Muaz b. Cebel","Hz. Bilal-i Habeşi","Hz. Salman","Hz. Ukbe"], correctIndex:0, explanation:"Mihmandar-ı Nebevi Ebu Eyyub el-Ensari hazretleridir." },
  { question:"İslam'ın ilk müezzini olan ve güzel sesiyle bilinen sahabe kimdir?", options:["Hz. Bilal-i Habeşi","Hz. Abdullah b. Ümmi Mektum","Hz. Zübeyr","Hz. Talha","Hz. Ammar"], correctIndex:0, explanation:"Hz. Bilal-i Habeşi İslam'ın ilk müezzinidir." },
  { question:"Emevi devletinin kurucusu kimdir?", options:["Muaviye b. Ebi Süfyan","Yezid","Abdülmelik b. Mervan","Ömer b. Abdülaziz","Velid"], correctIndex:0, explanation:"Şam valisi Muaviye b. Ebi Süfyan Emevi hanedanlığını kurmuştur." },
  { question:"İkinci Ömer olarak anılan, adil yönetimiyle Emeviler döneminde huzur getiren halife kimdir?", options:["Velid b. Abdülmelik","Ömer b. Abdülaziz","Hişam","Mervan","Süleyman"], correctIndex:1, explanation:"Ömer b. Abdülaziz 5. Hulefa-i Raşidin gibi adil yönetimiyle tanınır." },
  { question:"Endülüs Emevi Devleti hangi coğrafyada kurulmuş ve medeniyet inşa etmiştir?", options:["Mısır","İspanya (İber Yarımadası)","Hindistan","Kuzey Afrika","Balkanlar"], correctIndex:1, explanation:"Tarık b. Ziyad'ın İspanya'ya geçişiyle İberya'da Endülüs medeniyeti kurulmuştur." },
  { question:"Bağdat'ta kurulan ve Orta Çağ'ın en büyük bilim ve çeviri merkezi olan kurum hangisidir?", options:["Darulhikme / Beytü'l-Hikme","Nizamiye Medresesi","Enderun","Sahip Ata","Karatay"], correctIndex:0, explanation:"Abbasiler döneminde Beytülhikme bilim dünyasının kalbi olmuştur." },
  { question:"Selahaddin Eyyubi 1187 yılında Hıttın Savaşı ile hangi kutsal şehri Haçlılardan geri almıştır?", options:["Şam","Kudüs","Kahire","Antakya","Urfa"], correctIndex:1, explanation:"Selahaddin Eyyubi Kudüs'ü Haçlı işgalinden kurtarmıştır." },
  { question:"751 yılında yapılan ve Müslümanlar ile Çinliler arasında gerçekleşen, Türklerin İslam'a girişini hızlandıran savaş hangisidir?", options:["Talas Savaşı","Dandanakan","Malazgirt","Ayn Calut","Kösedağ"], correctIndex:0, explanation:"Talas Savaşı sonrası Türk boyları kitleler halinde İslam'ı benimsemiştir." },
  { question:"Moğol ilhanlı ordusunu 1260 yılında durduran ve tarihteki ilk yenilgisini tattıran Memlük zaferi hangisidir?", options:["Hıttın","Ayn Câlût Savaşı","Mercidabık","Ridaniye","Mohaç"], correctIndex:1, explanation:"Sultan Baybars ve Seyfeddin Qutuz liderliğindeki Memlükler Ayn Calut'ta Moğolları bozguna uğratmıştır." },
  { question:"Büyük Selçuklu İmparatorluğu döneminde Alparslan ve Melikşah'ın vezirliğini yapan, Nizamiye Medreselerini kuran devlet adamı kimdir?", options:["Nizamülmülk","Ömer Hayyam","Gazali","Biruni","İbn Sina"], correctIndex:0, explanation:"Siyasetname eserinin yazarı büyük devlet adamı Nizamülmülk'tür." },
  { question:"Tıbbın Kanunu (El-Kanun fi't-Tıbb) adlı eseriyle Batı'da 'Avicenna' adıyla tanınan büyük İslam alimi kimdir?", options:["Farabi","İbn Sina","İbn Rüşd","Razi","Harezmi"], correctIndex:1, explanation:"İbn Sina tıp tarihinin en büyük otoritelerindendir." },
  { question:"Cebir ilminin kurucusu kabul edilen ve sıfır (0) rakamını matematiğe kazandıran İslam bilgini kimdir?", options:["El-Harezmi","Biruni","Câbir b. Hayyan","Uluğ Bey","Ali Kuşçu"], correctIndex:0, explanation:"Harezmi algoritma ve cebirin babası olarak bilinir." },
  { question:"Sosyolojinin ve tarih felsefesinin kurucusu kabul edilen, 'Mukaddime' eserinin yazarı kimdir?", options:["İbn Haldun","İbn Batuta","İbn Arabi","Taberi","Mesudi"], correctIndex:0, explanation:"İbn Haldun Mukaddime adlı eseriyle sosyolojinin temellerini atmıştır." },
  { question:"Peygamber Efendimizin 'İstanbul mutlaka fethedilecektir. Onu fetheden komutan ne güzel komutan, onu fetheden asker ne güzel askerdir' müjdesine mazhar olan Osmanlı padişahı kimdir?", options:["Fatih Sultan Mehmed (II. Mehmed)","Yavuz Sultan Selim","Kanuni Sultan Süleyman","Osman Gazi","Orhan Gazi"], correctIndex:0, explanation:"29 Mayıs 1453 tarihinde İstanbul'u fetheden II. Mehmed (Fatih) hazretleridir." },
];

async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question || '').trim().toLowerCase()));
  console.log('Firestore\'da zaten var olan soru sayısı:', existingTexts.size);

  const toAdd = newIslami5Opt.filter(q => !existingTexts.has(q.question.trim().toLowerCase()));
  console.log('Eklenecek yeni soru sayısı:', toAdd.length, '(dosyadan hazırlanan:', newIslami5Opt.length, ')');

  if(toAdd.length === 0){
    console.log('Eklenecek yeni soru yok, hepsi zaten mevcut.');
    return;
  }

  const batch = db.batch();
  toAdd.forEach(q => {
    const ref = db.collection('quiz_questions').doc();
    batch.set(ref, Object.assign({ category: 'islami', createdAt: Date.now(), createdBy: 'seed-script-4' }, q));
  });
  await batch.commit();
  console.log(toAdd.length + ' soru başarıyla eklendi.');
}

__checkAlreadySeeded().then(async (alreadyDone) => {
  const __scriptName = require('path').basename(__filename);
  if (alreadyDone) { console.log(`${__scriptName} zaten daha önce tamamlanmış, atlanıyor.`); process.exit(0); return; }
  await main();
  await db.collection('app_config').doc('seedScriptStatus').set({ [require('path').basename(__filename)]: true }, { merge: true }).catch(()=>{});
  process.exit(0);
}).catch(e=>{ console.error('Hata:', e); process.exit(1); });
