// Soru havuzunu Firestore'a TEK SEFERLİK yükler (workflow_dispatch ile elle çalıştırılır).
// Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar eklenmez, güvenle tekrar çalıştırılabilir.

const admin = require('firebase-admin');

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı.');
  process.exit(1);
}
const serviceAccount = JSON.parse(serviceAccountRaw);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const genelKulturQuestions = [
  { question:"Türkiye'nin başkenti neresidir?", options:["İstanbul","Ankara","İzmir","Bursa"], correctIndex:1, hint:"Cumhuriyet ilan edildikten sonra başkent oldu.", explanation:"Ankara, 13 Ekim 1923'te Türkiye Cumhuriyeti'nin başkenti ilan edilmiştir." },
  { question:"Dünyanın en uzun nehri hangisidir?", options:["Amazon","Nil","Mississippi","Yangtze"], correctIndex:1, hint:"Afrika kıtasından geçer.", explanation:"Nil Nehri, yaklaşık 6.650 km uzunluğuyla dünyanın en uzun nehri kabul edilir." },
  { question:"İstanbul'u fetheden Osmanlı padişahı kimdir?", options:["Yıldırım Bayezid","II. Mehmed","I. Selim","Kanuni Sultan Süleyman"], correctIndex:1, hint:"'Fatih' unvanıyla anılır.", explanation:"II. Mehmed, 1453'te İstanbul'u fethederek 'Fatih' unvanını almıştır." },
  { question:"Güneş sistemindeki en büyük gezegen hangisidir?", options:["Satürn","Dünya","Jüpiter","Mars"], correctIndex:2, hint:"Kızılı olan komşusu değil, ondan daha büyüğü.", explanation:"Jüpiter, güneş sistemindeki en büyük gezegendir." },
  { question:"'Kuvayı Milliye' hareketi hangi dönemde ortaya çıkmıştır?", options:["Kurtuluş Savaşı","Balkan Savaşları","I. Dünya Savaşı","Tanzimat Dönemi"], correctIndex:0, hint:"Anadolu'nun işgaline karşı halk direnişi.", explanation:"Kuvayı Milliye, Kurtuluş Savaşı sırasında düzenli ordu kurulana kadar direnişi sürdüren silahlı halk birlikleridir." },
  { question:"İnsan vücudundaki en büyük organ hangisidir?", options:["Karaciğer","Deri","Akciğer","Beyin"], correctIndex:1, hint:"Vücudu dıştan sarar.", explanation:"Deri, yüzey alanı bakımından insan vücudundaki en büyük organdır." },
  { question:"Mona Lisa tablosunun ressamı kimdir?", options:["Vincent van Gogh","Pablo Picasso","Leonardo da Vinci","Michelangelo"], correctIndex:2, hint:"Aynı zamanda bilim insanı ve mühendisti.", explanation:"Mona Lisa, İtalyan Rönesans sanatçısı Leonardo da Vinci tarafından yapılmıştır." },
  { question:"Dünya'nın uydusu nedir?", options:["Mars","Ay","Güneş","Venüs"], correctIndex:1, hint:"Geceleri gökyüzünde görürüz.", explanation:"Ay, Dünya'nın tek doğal uydusudur." },
  { question:"Türkiye Cumhuriyeti hangi yıl kurulmuştur?", options:["1920","1923","1922","1925"], correctIndex:1, hint:"29 Ekim'de ilan edilmiştir.", explanation:"Türkiye Cumhuriyeti, 29 Ekim 1923'te ilan edilmiştir." },
  { question:"Periyodik tabloda 'Fe' hangi elementin simgesidir?", options:["Flor","Demir","Fosfor","Fermiyum"], correctIndex:1, hint:"Latince adı 'Ferrum'dur.", explanation:"'Fe' simgesi, Latince 'Ferrum' kelimesinden gelen demir elementini temsil eder." },
  { question:"Dünyanın en büyük okyanusu hangisidir?", options:["Atlas Okyanusu","Hint Okyanusu","Büyük Okyanus (Pasifik)","Arktik Okyanusu"], correctIndex:2, hint:"Asya ile Amerika kıtaları arasında yer alır.", explanation:"Büyük Okyanus (Pasifik), yüzölçümü bakımından dünyanın en büyük okyanusudur." },
  { question:"Türk edebiyatının ilk yerli romanı kabul edilen eser hangisidir?", options:["İntibah","Araba Sevdası","Taaşşuk-ı Talat ve Fitnat","Sergüzeşt"], correctIndex:2, hint:"Şemsettin Sami tarafından yazılmıştır.", explanation:"Taaşşuk-ı Talat ve Fitnat, Şemsettin Sami'nin 1872'de yazdığı, Türk edebiyatının ilk yerli romanı kabul edilen eseridir." },
  { question:"İnsan vücudunda kaç kemik bulunur (yetişkinlerde)?", options:["186","206","256","150"], correctIndex:1, hint:"Bebeklerde daha fazla kemik vardır, büyüdükçe birleşir.", explanation:"Yetişkin bir insan vücudunda ortalama 206 kemik bulunur." },
  { question:"Everest Dağı hangi ülkeler sınırında yer alır?", options:["Hindistan-Çin","Nepal-Çin","Pakistan-Hindistan","Nepal-Hindistan"], correctIndex:1, hint:"Dünyanın en yüksek dağıdır.", explanation:"Everest Dağı, Nepal ile Çin (Tibet) sınırında yer alır ve dünyanın en yüksek dağıdır." },
  { question:"'Nutuk' adlı eserin yazarı kimdir?", options:["İsmet İnönü","Mustafa Kemal Atatürk","Fevzi Çakmak","Kazım Karabekir"], correctIndex:1, hint:"Kurtuluş Savaşı'nı anlatan bir söylevdir.", explanation:"Nutuk, Mustafa Kemal Atatürk'ün 1927'de okuduğu, Kurtuluş Savaşı sürecini anlatan büyük söylevdir." },
  { question:"Dünyanın en kalabalık ülkesi (nüfus bakımından) hangisidir?", options:["Çin","Hindistan","ABD","Endonezya"], correctIndex:1, hint:"2023 itibarıyla bu ülke Çin'i geçmiştir.", explanation:"Hindistan, 2023 itibarıyla dünyanın en kalabalık ülkesi konumuna gelmiştir." },
  { question:"Fotosentez olayı bitkilerin hangi kısmında gerçekleşir?", options:["Kökte","Yaprakta","Gövdede","Çiçekte"], correctIndex:1, hint:"Klorofil burada bulunur.", explanation:"Fotosentez, klorofil içeren yapraklarda gerçekleşir." },
  { question:"Türkiye'nin en yüksek dağı hangisidir?", options:["Erciyes","Ağrı Dağı","Kaçkar","Uludağ"], correctIndex:1, hint:"Doğu Anadolu'da, İran sınırına yakındır.", explanation:"Ağrı Dağı, 5.137 metre ile Türkiye'nin en yüksek dağıdır." },
  { question:"'Relativite Teorisi' kime aittir?", options:["Isaac Newton","Albert Einstein","Nikola Tesla","Stephen Hawking"], correctIndex:1, hint:"E=mc² formülüyle tanınır.", explanation:"Görelilik (Relativite) Teorisi, Albert Einstein tarafından geliştirilmiştir." },
  { question:"Osmanlı Devleti'nin kurucusu kimdir?", options:["Orhan Gazi","Osman Gazi","I. Murad","Ertuğrul Gazi"], correctIndex:1, hint:"Devlete adını veren kişi.", explanation:"Osmanlı Devleti, Osman Gazi tarafından 1299'da kurulmuştur." },
  { question:"Vücutta oksijeni taşıyan hücreler hangisidir?", options:["Alyuvarlar (Eritrositler)","Akyuvarlar (Lökositler)","Trombositler","Plazma"], correctIndex:0, hint:"Kanın kırmızı rengini verirler.", explanation:"Alyuvarlar (eritrositler), içerdikleri hemoglobin sayesinde oksijeni vücuda taşır." },
  { question:"Dünyanın en büyük çölü hangisidir (sıcak çöller arasında)?", options:["Gobi Çölü","Sahra Çölü","Kalahari Çölü","Arabistan Çölü"], correctIndex:1, hint:"Afrika kıtasının kuzeyinde yer alır.", explanation:"Sahra Çölü, Afrika'nın kuzeyinde yer alan dünyanın en büyük sıcak çölüdür." },
  { question:"İlk Türk uydusu hangisidir?", options:["Türksat 1A","Göktürk-1","RASAT","İMECE"], correctIndex:0, hint:"1994 yılında fırlatılmıştır.", explanation:"Türksat 1A, Türkiye'nin uzaya gönderilen ilk uydusudur (1994)." },
  { question:"Bir üçgenin iç açıları toplamı kaç derecedir?", options:["90","180","270","360"], correctIndex:1, hint:"Bu, temel bir geometri kuralıdır.", explanation:"Herhangi bir üçgenin iç açıları toplamı her zaman 180 derecedir." },
  { question:"Kâğıdı ilk icat eden medeniyet hangisidir?", options:["Mısırlılar","Çinliler","Sümerler","Yunanlılar"], correctIndex:1, hint:"MS 2. yüzyılda geliştirilmiştir.", explanation:"Kâğıt, MS 105 yılı civarında Çin'de Cai Lun tarafından geliştirilmiştir." },
  { question:"Dünya'nın kendi ekseni etrafında bir tam dönüşü ne kadar sürer?", options:["12 saat","24 saat","365 gün","30 gün"], correctIndex:1, hint:"Bir gün-gece döngüsüne denk gelir.", explanation:"Dünya, kendi ekseni etrafında yaklaşık 24 saatte bir tam tur atar." },
  { question:"'Safahat' adlı şiir kitabının yazarı kimdir?", options:["Yahya Kemal Beyatlı","Mehmet Akif Ersoy","Necip Fazıl Kısakürek","Tevfik Fikret"], correctIndex:1, hint:"İstiklal Marşı'nın da yazarıdır.", explanation:"Safahat, İstiklal Marşı'nın yazarı Mehmet Akif Ersoy'un şiir kitabıdır." },
  { question:"İnsan kalbinde kaç oda (boşluk) bulunur?", options:["2","3","4","6"], correctIndex:2, hint:"İki kulakçık, iki karıncık.", explanation:"İnsan kalbi 4 odacıktan oluşur: sağ-sol kulakçık ve sağ-sol karıncık." },
  { question:"Dünyanın yüzölçümü bakımından en büyük ülkesi hangisidir?", options:["Kanada","Çin","ABD","Rusya"], correctIndex:3, hint:"Avrupa ve Asya kıtalarına yayılır.", explanation:"Rusya, yüzölçümü bakımından dünyanın en büyük ülkesidir." },
  { question:"Malazgirt Savaşı hangi yıl gerçekleşmiştir?", options:["1071","1176","1453","1299"], correctIndex:0, hint:"Anadolu'nun Türklere açıldığı savaştır.", explanation:"Malazgirt Savaşı, 1071 yılında Selçuklu Sultanı Alparslan ile Bizans arasında yapılmış ve Anadolu'nun Türk yurdu olma sürecini başlatmıştır." },
  { question:"Suyun kimyasal formülü nedir?", options:["CO2","H2O","O2","NaCl"], correctIndex:1, hint:"İki hidrojen, bir oksijen atomundan oluşur.", explanation:"Su, kimyasal olarak H2O formülüyle ifade edilir; iki hidrojen ve bir oksijen atomundan oluşur." },
  { question:"Türkiye'nin Avrupa'daki tek kıyısı hangi denize aittir?", options:["Ege Denizi","Marmara Denizi","Karadeniz","Akdeniz"], correctIndex:1, hint:"İstanbul Boğazı bu denize açılır.", explanation:"Marmara Denizi kıyıları, Türkiye'nin Avrupa (Trakya) yakasındaki kıyılarını oluşturur." },
  { question:"Dünyada en çok konuşulan ana dil hangisidir?", options:["İngilizce","İspanyolca","Mandarin Çincesi","Hintçe"], correctIndex:2, hint:"Nüfusu en kalabalık ülkelerden birinin dilidir.", explanation:"Ana dil olarak konuşan kişi sayısı bakımından Mandarin Çincesi dünyada ilk sırada yer alır." },
  { question:"'Görelilik kuramı' dışında Einstein hangi buluşuyla Nobel ödülü almıştır?", options:["Atom bombası","Fotoelektrik etki","Kara delik teorisi","Kuantum mekaniği"], correctIndex:1, hint:"Işığın madde üzerindeki etkisiyle ilgilidir.", explanation:"Einstein, 1921 Nobel Fizik Ödülü'nü görelilik kuramı için değil, fotoelektrik etkiyi açıklayan çalışması için almıştır." },
  { question:"Ankara hangi yıl Türkiye'nin başkenti ilan edilmiştir?", options:["1920","1923","1922","1927"], correctIndex:1, hint:"Cumhuriyet'in ilan edildiği yılla aynıdır.", explanation:"Ankara, 13 Ekim 1923'te başkent ilan edilmiştir." },
];

const islamiQuestions = [
  { question:"İslam'ın beş şartından biri olmayan hangisidir?", options:["Namaz","Oruç","Kurban","Zekât"], correctIndex:2, hint:"Kurban bir ibadettir ama beş şarttan biri değildir.", explanation:"İslam'ın beş şartı: Kelime-i Şehadet, namaz, oruç, zekât ve hacdır. Kurban bunların içinde yer almaz." },
  { question:"Ramazan ayında tutulan ibadete ne denir?", options:["Namaz","Oruç","Zekât","İtikaf"], correctIndex:1, hint:"Sabahtan akşama yeme-içmeden uzak durmayı içerir.", explanation:"Ramazan ayında güneşin doğuşundan batışına kadar yeme, içme ve orucu bozan şeylerden uzak durmaya oruç denir." },
  { question:"Müslümanların yılda bir kez, gücü yetenlere farz olan hac ibadeti hangi şehirde yapılır?", options:["Medine","Kudüs","Mekke","Bağdat"], correctIndex:2, hint:"Kâbe bu şehirdedir.", explanation:"Hac ibadeti, Kâbe'nin bulunduğu Mekke şehrinde ve çevresinde belirli günlerde yapılır." },
  { question:"İslam dininin son peygamberi kimdir?", options:["Hz. İsa","Hz. Musa","Hz. Muhammed","Hz. İbrahim"], correctIndex:2, hint:"Kur'an-ı Kerim ona indirilmiştir.", explanation:"Hz. Muhammed (s.a.v.), İslam inancına göre Allah'ın gönderdiği son peygamberdir." },
  { question:"Müslümanların kıblesi hangi yöndedir?", options:["Medine","Kudüs","Kâbe (Mekke)","Şam"], correctIndex:2, hint:"Namaz kılarken bu yöne dönülür.", explanation:"Müslümanlar namaz kılarken Mekke'deki Kâbe'ye yönelir; bu yöne kıble denir." },
  { question:"Kur'an-ı Kerim kaç sureden oluşur?", options:["99","114","124","141"], correctIndex:1, hint:"Üç haneli, 1 ile başlayan bir sayı.", explanation:"Kur'an-ı Kerim toplam 114 sureden oluşur." },
  { question:"İslam'da zenginlerin yoksullara vermekle yükümlü olduğu mali ibadete ne denir?", options:["Sadaka","Zekât","Fitre","Kurban"], correctIndex:1, hint:"Belirli bir mal varlığı üzerinden farz olarak verilir.", explanation:"Zekât, belirli bir mal varlığına ulaşan Müslümanların yılda bir kez vermekle yükümlü olduğu farz bir ibadettir." },
  { question:"Miraç Kandili hangi olayla ilgilidir?", options:["Kur'an'ın inişi","Hz. Muhammed'in göğe yükselişi","Hicret","Bedir Savaşı"], correctIndex:1, hint:"Peygamberimizin gece yolculuğuyla ilgilidir.", explanation:"Miraç Kandili, Hz. Muhammed'in (s.a.v.) İsra ve Miraç olayını, yani gece yolculuğunu ve göğe yükselişini anar." },
  { question:"Hz. Muhammed'in Mekke'den Medine'ye göç etmesine ne denir?", options:["Miraç","Hicret","Fetih","Bedir"], correctIndex:1, hint:"İslam takviminin başlangıcı bu olaya dayanır.", explanation:"Hicret, Hz. Muhammed'in ve Müslümanların 622 yılında Mekke'den Medine'ye göç etmesidir; Hicri takvim bu olayla başlar." },
  { question:"Kur'an-ı Kerim'in ilk suresi hangisidir?", options:["Bakara","Fatiha","İhlas","Nas"], correctIndex:1, hint:"Namazların her rekâtında okunur.", explanation:"Fatiha Suresi, Kur'an-ı Kerim'in ilk suresidir ve namazlarda her rekâtta okunur." },
  { question:"Ramazan Bayramı'na diğer bir isimle ne denir?", options:["Kurban Bayramı","Şeker Bayramı","Miraç Bayramı","Regaip Bayramı"], correctIndex:1, hint:"Halk arasında tatlı ikram edilen bayram olarak da bilinir.", explanation:"Ramazan Bayramı, halk arasında 'Şeker Bayramı' olarak da anılır." },
  { question:"Hac ibadetinin farz olması için gereken temel şartlardan biri nedir?", options:["Genç olmak","Maddi ve bedeni güce sahip olmak","Evli olmak","Öğrenim görmüş olmak"], correctIndex:1, hint:"Gücü yetmeyene farz değildir.", explanation:"Hac, maddi imkânı olan ve bedenen gidebilecek güçte olan Müslümanlara farzdır." },
  { question:"İslam'da oruç hangi ayda farzdır?", options:["Muharrem","Ramazan","Recep","Şaban"], correctIndex:1, hint:"Hicri takvimin dokuzuncu ayıdır.", explanation:"Oruç, Hicri takvimin dokuzuncu ayı olan Ramazan ayında farzdır." },
  { question:"Namazın farz olan günlük vakit sayısı kaçtır?", options:["3","4","5","6"], correctIndex:2, hint:"Sabah, öğle, ikindi, akşam, yatsı.", explanation:"Müslümanlara günde beş vakit namaz farz kılınmıştır." },
  { question:"Kâbe'nin bulunduğu mescide ne ad verilir?", options:["Mescid-i Aksa","Mescid-i Nebevi","Mescid-i Haram","Mescid-i Kuba"], correctIndex:2, hint:"'Haram' kelimesi burada 'kutsal, dokunulmaz' anlamındadır.", explanation:"Kâbe'nin içinde bulunduğu Mekke'deki büyük mescide Mescid-i Haram denir." },
  { question:"Hz. Muhammed'in kabri hangi şehirdedir?", options:["Mekke","Medine","Kudüs","Kahire"], correctIndex:1, hint:"Mescid-i Nebevi bu şehirdedir.", explanation:"Hz. Muhammed'in (s.a.v.) kabri, Medine'deki Mescid-i Nebevi içindedir." },
  { question:"Kur'an-ı Kerim kaç yılda parça parça (âyet âyet, sure sure) indirilmiştir?", options:["Yaklaşık 10 yıl","Yaklaşık 23 yıl","Yaklaşık 40 yıl","Yaklaşık 5 yıl"], correctIndex:1, hint:"Peygamberliğin başından vefatına kadar süren bir dönem.", explanation:"Kur'an-ı Kerim, Hz. Muhammed'e peygamberliğinin başladığı andan vefatına kadar yaklaşık 23 yıllık bir süreçte parça parça indirilmiştir." },
  { question:"İslam'da 'iman'ın altı esasından (âmentü) biri değildir hangisi?", options:["Allah'a inanmak","Meleklere inanmak","Kader'e inanmak","Kurban kesmeye inanmak"], correctIndex:3, hint:"Kurban bir ibadettir, imanın şartı değildir.", explanation:"İmanın altı şartı: Allah'a, meleklere, kitaplara, peygamberlere, ahiret gününe ve kadere inanmaktır. Kurban kesmek bir ibadettir, iman esası değildir." },
  { question:"Kurban Bayramı, hangi hac ibadetiyle aynı döneme denk gelir?", options:["Umre","Hac","İtikaf","Miraç"], correctIndex:1, hint:"Hacıların Mekke'de bulunduğu günlerdir.", explanation:"Kurban Bayramı, hac ibadetinin son günlerine denk gelen bir zaman diliminde kutlanır." },
  { question:"İslam'da oruç kaç gün farzdır (Ramazan ayı boyunca)?", options:["28-29 gün","29-30 gün","30-31 gün","25-26 gün"], correctIndex:1, hint:"Ramazan ayının uzunluğuna bağlıdır (hilale göre değişebilir).", explanation:"Ramazan ayı, hilalin görülmesine göre 29 veya 30 gün sürer ve oruç bu süre boyunca tutulur." },
  { question:"Kur'an'da ismi en çok geçen peygamber kimdir?", options:["Hz. İbrahim","Hz. Musa","Hz. Muhammed","Hz. Nuh"], correctIndex:1, hint:"Kızıldeniz'i yardığına inanılan peygamberdir.", explanation:"Kur'an-ı Kerim'de ismi en çok geçen peygamber Hz. Musa'dır." },
  { question:"İslam'da 'sünnet' kavramı ne anlama gelir?", options:["Farz olan ibadet","Hz. Muhammed'in söz, fiil ve onaylarından oluşan yol","Kur'an'ın bir bölümü","Yasaklanmış davranış"], correctIndex:1, hint:"Peygamberimizin örnek yaşayışını ifade eder.", explanation:"Sünnet, Hz. Muhammed'in sözlerini, davranışlarını ve onayladığı uygulamaları ifade eden bir kavramdır." },
  { question:"Fitre (fıtır sadakası) ne zaman verilir?", options:["Kurban Bayramı öncesi","Ramazan Bayramı öncesi","Yılbaşında","Hac döneminde"], correctIndex:1, hint:"Oruç ayının sonuna denk gelir.", explanation:"Fitre, Ramazan Bayramı'ndan önce, imkânı olan Müslümanların ihtiyaç sahiplerine verdiği bir sadakadır." },
  { question:"'Ezan' ne için okunur?", options:["Bayram kutlamak için","Namaz vaktinin geldiğini bildirmek için","Cenaze duyurusu için","Nikâh için"], correctIndex:1, hint:"Camilerden günde beş kez duyulur.", explanation:"Ezan, namaz vaktinin girdiğini Müslümanlara duyurmak amacıyla okunur." },
  { question:"İslam'ın ilk şartı (temel esası) nedir?", options:["Namaz","Kelime-i Şehadet","Oruç","Hac"], correctIndex:1, hint:"Allah'a ve peygamberine iman ifadesidir.", explanation:"İslam'ın beş şartının ilki, Allah'ın birliğine ve Hz. Muhammed'in O'nun elçisi olduğuna şahitlik eden Kelime-i Şehadet'tir." },
  { question:"Kur'an-ı Kerim hangi dilde indirilmiştir?", options:["Farsça","Arapça","İbranice","Süryanice"], correctIndex:1, hint:"Hz. Muhammed'in konuştuğu dildir.", explanation:"Kur'an-ı Kerim, Arapça olarak indirilmiştir." },
  { question:"'Umre' ile 'Hac' arasındaki temel fark nedir?", options:["Umre'nin belirli bir zamanı yoktur, hac belirli günlerde yapılır","İkisi de aynı ibadettir","Umre sadece kadınlara mahsustur","Hac her yıl birden fazla yapılabilir"], correctIndex:0, hint:"Biri yılın her günü yapılabilir, diğeri belirli günlerle sınırlıdır.", explanation:"Umre, yılın herhangi bir zamanında yapılabilirken; hac, belirli günlerde (Zilhicce ayında) yapılması gereken bir ibadettir." },
  { question:"İslam'a göre meleklerin yaratıldığı madde nedir?", options:["Topraktan","Ateşten","Nurdan (ışıktan)","Sudan"], correctIndex:2, hint:"İnsan topraktan, cin ateşten yaratılmıştır.", explanation:"İslam inancına göre melekler nurdan (ışıktan) yaratılmıştır." },
  { question:"Kadir Gecesi hangi ayda bulunur?", options:["Muharrem","Ramazan","Recep","Zilhicce"], correctIndex:1, hint:"Kur'an'ın indirilmeye başladığı gece olduğuna inanılır.", explanation:"Kadir Gecesi, Ramazan ayının son on gününde bulunduğuna inanılan, Kur'an'ın indirilmeye başladığı gecedir." },
  { question:"Hz. İbrahim ile ilgili Kurban Bayramı'nın kaynağı olan olay nedir?", options:["Kızıldeniz'in yarılması","Oğlunu kurban etmeye hazır oluşu","Tufan","Miraç"], correctIndex:1, hint:"Allah'a olan teslimiyetini gösteren bir imtihandır.", explanation:"Kurban Bayramı, Hz. İbrahim'in oğlunu Allah için kurban etmeye hazır olduğu imtihanın anısına dayanır." },
  { question:"'Tesbih' çekmek hangi ibadet türüne girer?", options:["Farz","Zikir","Vacip","Sünnet-i müekkede"], correctIndex:1, hint:"Allah'ı anmak, O'nu tekrar tekrar hatırlamak.", explanation:"Tesbih çekmek, Allah'ı anmak amacıyla yapılan bir zikir çeşididir." },
];

async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question || '').trim()));
  console.log('Firestore\'da zaten var olan soru sayısı:', existingTexts.size);

  const toAdd = [];
  genelKulturQuestions.forEach(q => { if(!existingTexts.has(q.question.trim())) toAdd.push(Object.assign({category:'genel_kultur'}, q)); });
  islamiQuestions.forEach(q => { if(!existingTexts.has(q.question.trim())) toAdd.push(Object.assign({category:'islami'}, q)); });

  console.log('Eklenecek yeni soru sayısı:', toAdd.length, '(toplam hazırlanan:', genelKulturQuestions.length + islamiQuestions.length, ')');

  if(toAdd.length === 0){
    console.log('Eklenecek yeni soru yok, hepsi zaten mevcut.');
    return;
  }

  const batch = db.batch();
  toAdd.forEach(q => {
    const ref = db.collection('quiz_questions').doc();
    batch.set(ref, Object.assign({ createdAt: Date.now(), createdBy: 'seed-script' }, q));
  });
  await batch.commit();
  console.log(toAdd.length + ' soru başarıyla eklendi.');
}

main().then(()=>process.exit(0)).catch(e=>{ console.error('Hata:', e); process.exit(1); });
