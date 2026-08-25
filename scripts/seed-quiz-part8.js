// 1000 SORU HEDEFİ SONRASI — 8. Parça (56 yeni soru: 41 İslami + 15 Genel Kültür)
// Kur'an kıssaları (Hz. Musa'nın annesi, Asiye), ahiret/kıyamet sahneleri,
// dualar, sureler (Yusuf, Nur, Ahzab, Feth, Talak vb.) gibi konulara odaklanır.
// Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar eklenmez, güvenle
// tekrar çalıştırılabilir.

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


const islamiBatch10 = [
  { question:"'Kur'an-ı Kerim'de geçen 'Ashab-ı Eyke' kavmi hangi peygambere gönderilmiştir?", options:["Hz. Şuayb","Hz. Salih","Hz. Hud","Hz. Lut"], correctIndex:0, hint:"Medyen kavmine yakın bir topluluk olarak da anılır.", explanation:"Ashab-ı Eyke, Hz. Şuayb'ın gönderildiği, ağaçlık bir bölgede yaşayan bir topluluktur." },
  { question:"İslam'da 'Kur'an-ı Kerim'de geçen ve Hz. Musa'nın kız kardeşi olduğu belirtilen kişi kimdir (adı açık geçmese de rivayetlerde anılır)?", options:["Rivayetlerde adı Meryem olarak da geçer","Hz. Meryem ile aynı kişidir","Bir peygamberdir","Bir melektir"], correctIndex:0, hint:"Hz. Musa'yı Nil nehrinde takip ettiği anlatılır.", explanation:"Hz. Musa'nın kız kardeşinin, onu sepet içinde Nil'de takip ettiği kıssa Kur'an'da anlatılır; rivayetlerde adının Meryem olduğu belirtilir." },
  { question:"'Hz. Musa'nın annesine' Kur'an'da hangi ilham verildiği anlatılır?", options:["Çocuğunu bir sandık içinde nehre bırakması","Firavun'a gitmesi","Mısır'dan hemen ayrılması","Bir savaş başlatması"], correctIndex:0, hint:"Kasas Suresi'nde bu olay anlatılır.", explanation:"Kasas Suresi'nde, Hz. Musa'nın annesine çocuğunu bir sandık içine koyup nehre bırakması ilham edildiği anlatılır." },
  { question:"İslam'da 'Firavun'un eşi Asiye' Kur'an'da hangi özelliğiyle anılır?", options:["İmanı ve Hz. Musa'yı himaye etmesiyle","Bir peygamber olmasıyla","Bir melek olmasıyla","Bir sahabe olmasıyla"], correctIndex:0, hint:"Firavun'un zulmüne rağmen imanından vazgeçmemiştir.", explanation:"Asiye, Firavun'un eşi olmasına rağmen iman etmiş ve Hz. Musa'yı himaye etmesiyle Kur'an'da örnek gösterilen bir figürdür." },
  { question:"'Kur'an-ı Kerim'de mümin kadınlara örnek olarak gösterilen isimlerden biri kimdir?", options:["Hz. Meryem","Sadece erkekler örnek gösterilir","Hz. Aişe (Kur'an'da adı geçmez ama örnektir)","Örnek kadın figür yoktur"], correctIndex:0, hint:"Tahrim Suresi'nde bu isim geçer.", explanation:"Tahrim Suresi'nde, Hz. Meryem iffetini koruyan ve Allah'a itaat eden bir kadın örneği olarak anılır." },
  { question:"İslam'da 'Kur'an-ı Kerim'de kötü örnek olarak gösterilen kadın figürlerden biri kimdir (isim verilmeden)?", options:["Hz. Nuh ve Hz. Lut'un eşleri","Hz. Hatice","Hz. Fatıma","Hz. Aişe"], correctIndex:0, hint:"Tahrim Suresi'nde bu örnekler de geçer.", explanation:"Tahrim Suresi'nde, Hz. Nuh ve Hz. Lut'un eşlerinin, peygamber eşi olmalarına rağmen inanmadıkları için kötü örnek olarak anıldığı belirtilir." },
  { question:"'Kur'an-ı Kerim'de 'Ashab-ı Kehf'in kaç kişi olduğu' konusunda ne söylenir?", options:["Kesin sayı belirtilmez, tahminler sıralanıp Allah'ın en iyi bileceği vurgulanır","Tam olarak 3 kişi olduğu belirtilir","Tam olarak 7 kişi olduğu kesin belirtilir","Tam olarak 12 kişi olduğu belirtilir"], correctIndex:0, hint:"Kehf Suresi'nde bu konuda dikkat çekici bir üslup kullanılır.", explanation:"Kehf Suresi'nde, Ashab-ı Kehf'in sayısı hakkında çeşitli tahminler sıralanıp kesin bilginin Allah katında olduğu vurgulanır." },
  { question:"İslam'da 'Kur'an-ı Kerim'de yer alan ve insanın yaratılış aşamalarını anlatan ayetlerde hangi sıralama izlenir?", options:["Nutfe, alaka, mudga gibi aşamalarla anlatılır","Doğrudan yetişkin olarak yaratıldığı anlatılır","Bu konuya hiç değinilmez","Sadece ruh üflenmesi anlatılır"], correctIndex:0, hint:"Müminun Suresi'nde bu aşamalar detaylı anlatılır.", explanation:"Müminun Suresi'nde insanın yaratılışı, nutfe (sperm), alaka (embriyo) ve mudga (et parçası) gibi aşamalarla anlatılır." },
  { question:"'Kur'an-ı Kerim'de 'ruh üflenmesi' kavramı en çok hangi bağlamda geçer?", options:["İnsanın yaratılış sürecinde","Sadece meleklerle ilgili","Sadece cinlerle ilgili","Sadece hayvanlarla ilgili"], correctIndex:0, hint:"Hz. Âdem'in yaratılışında da bu ifade geçer.", explanation:"Kur'an'da insanın yaratılış sürecinde, Allah'ın ona kendi ruhundan üflediği ifade edilir." },
  { question:"İslam'da 'Kur'an-ı Kerim'de geçen 'zerre kadar hayır ve şer'in bile karşılığının görüleceği' fikri hangi surede geçer?", options:["Zilzal Suresi","Kevser Suresi","Nasr Suresi","İhlas Suresi"], correctIndex:0, hint:"Kısa ama etkili bir mesaj içerir.", explanation:"Zilzal Suresi'nde, zerre kadar hayır veya şer işleyen herkesin bunun karşılığını göreceği bildirilir." },
  { question:"'Kur'an-ı Kerim'de 'insanın hesaba çekileceği' fikri en çok hangi kavramla ifade edilir?", options:["Hesap Günü (Yevm-i Hesab)","Sadece dünya hayatı","Sadece kabir hayatı","Sadece rüya"], correctIndex:0, hint:"Ahiret inancının önemli bir parçasıdır.", explanation:"Hesap Günü (Yevm-i Hesab), İslami inanışa göre insanların dünyada yaptıklarından sorguya çekileceği ahiret günüdür." },
  { question:"İslam'da 'amel defterleri'nin sağdan veya soldan verilmesi hangi anlamı taşır?", options:["Sağdan verilenlerin cennetlik, soldan verilenlerin cehennemlik olma ihtimali","Rastgele bir uygulama","Sadece sembolik bir anlatım, gerçek karşılığı yok","Cinsiyet ayrımını ifade eder"], correctIndex:0, hint:"Hakka Suresi'nde bu konuya değinilir.", explanation:"Kur'an'da, amel defteri sağdan verilenlerin iyi bir akıbetle, soldan verilenlerin ise kötü bir akıbetle karşılaşacağı anlatılır." },
  { question:"'Kur'an-ı Kerim'de 'terazi'nin (mizan) ağır gelmesi ne anlama gelir?", options:["İyi amellerin kötü amellerden fazla olması","Kişinin zengin olması","Kişinin güçlü olması","Kişinin uzun yaşaması"], correctIndex:0, hint:"Ahirette amellerin tartılmasıyla ilgilidir.", explanation:"Mizanın (amel terazisinin) ağır gelmesi, kişinin iyi amellerinin kötü amellerinden fazla olduğunu ve bunun olumlu bir sonuç getireceğini ifade eder." },
  { question:"İslam'da 'cennetin sekiz kapısı olduğu' rivayeti hangi anlamı taşır?", options:["Farklı amellere göre farklı kapılardan girileceği","Cennetin küçük olduğu","Herkesin aynı kapıdan gireceği","Kapı sayısının önemsiz olduğu"], correctIndex:0, hint:"Örneğin oruç tutanlar için özel bir kapı olduğu rivayet edilir.", explanation:"Rivayetlere göre cennetin sekiz kapısı olup, kişiler yoğunlaştıkları iyi amellere göre farklı kapılardan girebileceklerdir." },
  { question:"'Kur'an-ı Kerim'de 'cehennemin yedi kapısı olduğu' hangi surede geçer?", options:["Hicr Suresi","Yasin Suresi","Rahman Suresi","Mülk Suresi"], correctIndex:0, hint:"Cehennem tabakalarına işaret eder.", explanation:"Hicr Suresi'nde, cehennemin yedi kapısı olduğu ve her kapıdan belirli bir grubun gireceği ifade edilir." },
  { question:"İslam'da 'kıyamet alametleri' (küçük ve büyük alametler) kavramı neyi ifade eder?", options:["Kıyametin kopmadan önce gerçekleşeceğine inanılan işaretler","Sadece dünyevi doğa olayları","Sadece siyasi olaylar","Önemsiz bir konu"], correctIndex:0, hint:"Hadislerde birçok alamet sayılır.", explanation:"Kıyamet alametleri, hadislerde kıyametin kopmasından önce gerçekleşeceği bildirilen çeşitli olay ve işaretlerdir." },
  { question:"'Kur'an-ı Kerim'de 'İsrafil'in sura üfleyeceği' ve bunun sonucunda neler olacağı hangi surede anlatılır?", options:["Zümer Suresi","Kevser Suresi","İhlas Suresi","Nasr Suresi"], correctIndex:0, hint:"İki kez sura üfleneceği rivayet edilir.", explanation:"Zümer Suresi'nde, sura üflenmesi ve bunun sonucunda göklerdeki ve yerdeki herkesin düşüp bayılacağı (ölümü) anlatılır." },
  { question:"İslam'da 'ba's' (yeniden diriliş) kavramı ne anlama gelir?", options:["Ölümden sonra yeniden diriltilme","Sadece dünyada yeniden doğma","Bir hac ritüeli","Bir namaz şekli"], correctIndex:0, hint:"Kıyamet gününün önemli bir parçasıdır.", explanation:"Ba's, İslami inanışa göre kıyamet gününde ölülerin yeniden diriltilerek hesaba çekilmek üzere toplanmasıdır." },
  { question:"'Kur'an-ı Kerim'de 'haşir' kavramı ne anlama gelir?", options:["İnsanların hesap için bir araya toplanması","Sadece bir dua şekli","Sadece bir namaz vakti","Sadece bir zekât türü"], correctIndex:0, hint:"Diriltildikten sonraki toplanma sürecidir.", explanation:"Haşir, yeniden diriltilen insanların hesap vermek üzere bir araya toplanmasını ifade eden bir kavramdır." },
  { question:"İslam'da 'kıyamet gününün dehşeti' en çok hangi imgelerle anlatılır?", options:["Dağların yürütülmesi, denizlerin kaynaması gibi imgelerle","Sadece sakin bir geçiş olarak","Hiçbir imge kullanılmadan","Sadece sözlü anlatımla"], correctIndex:0, hint:"Tekvir ve İnfitar surelerinde bu tür imgeler bulunur.", explanation:"Kur'an'da kıyamet günü, dağların yürütülmesi, denizlerin kaynaması, güneşin dürülmesi gibi çarpıcı imgelerle tasvir edilir." },
  { question:"'Tekvir Suresi' hangi konuya değinen imgelerle başlar?", options:["Güneşin dürülmesi ve yıldızların dökülmesi","Bir savaş sahnesi","Bir aile hikayesi","Bir ticaret anlaşması"], correctIndex:0, hint:"Kıyamet sahnelerini betimleyen bir suredir.", explanation:"Tekvir Suresi, güneşin dürülmesi, yıldızların dökülmesi gibi kıyamet imgeleriyle başlar." },
  { question:"İslam'da 'İnfitar Suresi' hangi kıyamet sahnesine değinir?", options:["Göğün yarılması","Bir savaş sahnesi","Bir deniz yolculuğu","Bir ticaret sözleşmesi"], correctIndex:0, hint:"Sure adı 'yarılma' anlamına gelir.", explanation:"İnfitar Suresi, kıyamet gününde göğün yarılacağı sahnesiyle başlayan bir suredir." },
  { question:"'Kur'an-ı Kerim'de 'İnşikak Suresi' hangi kıyamet sahnesine değinir?", options:["Göğün yarılıp parçalanması","Bir savaş","Bir hicret","Bir miras meselesi"], correctIndex:0, hint:"Sure adı 'yarılma, parçalanma' anlamına gelir.", explanation:"İnşikak Suresi, kıyamet gününde göğün yarılıp parçalanacağı sahnesiyle ilgili ayetler içerir." },
  { question:"İslam'da 'Kur'an-ı Kerim'de geçen 'sırat-ı müstakim' ifadesi ne anlama gelir?", options:["Doğru, dosdoğru yol","Yanlış bir yol","Bir coğrafi bölge","Bir tarihi olay"], correctIndex:0, hint:"Fatiha Suresi'nde bu ifade için dua edilir.", explanation:"Sırat-ı müstakim, Fatiha Suresi'nde de geçen, Allah'ın razı olduğu doğru ve dosdoğru yolu ifade eden bir kavramdır." },
  { question:"'Kur'an-ı Kerim'de 'gadaba uğrayanların ve sapıtmışların yolu' ifadesiyle neye işaret edilir?", options:["Yanlış yola sapmış toplulukların akıbetine","Sadece bir coğrafi bölgeye","Sadece bir tarihi olaya","Sadece bir savaşa"], correctIndex:0, hint:"Fatiha Suresi'nin son ayetinde geçer.", explanation:"Fatiha Suresi'nin son ayetinde, Allah'ın gazabına uğrayanların ve doğru yoldan sapanların yolundan Allah'a sığınılır." },
  { question:"İslam'da 'Kur'an-ı Kerim'de yer alan Bakara Suresi'nin son ayetlerinde hangi dua bulunur?", options:["Allah'tan güç yetiremeyeceği yükü yüklememesini isteme duası","Sadece bir miras duası","Sadece bir hac duası","Sadece bir zekât duası"], correctIndex:0, hint:"'Rabbena' ile başlayan dualar bu bölümde yoğunlaşır.", explanation:"Bakara Suresi'nin son ayetlerinde, Allah'tan güç yetirilemeyecek yükler yüklenmemesi ve bağışlanma dilenen dualar yer alır." },
  { question:"'Kur'an-ı Kerim'de 'Rabbena' ile başlayan dualar en çok hangi surelerde yoğunlaşır?", options:["Bakara ve Al-i İmran Sureleri","Sadece kısa surelerde","Sadece Mekki surelerde","Hiçbir surede bulunmaz"], correctIndex:0, hint:"Peygamberlerin dilinden aktarılan dualar da bu kapsamdadır.", explanation:"'Rabbena' (Ey Rabbimiz) ile başlayan dualar, özellikle Bakara ve Al-i İmran surelerinde sıkça yer alır." },
  { question:"İslam'da 'Hz. İbrahim'in duası' Kur'an'da en çok hangi konuda geçer?", options:["Kâbe'nin inşası sırasında yapılan dualar","Sadece bir savaş duası","Sadece bir ticaret duası","Sadece bir miras duası"], correctIndex:0, hint:"Bakara Suresi'nde bu dualar yer alır.", explanation:"Hz. İbrahim'in, Kâbe'yi inşa ederken yaptığı dualar Bakara Suresi'nde yer alır." },
  { question:"'Kur'an-ı Kerim'de 'şükür duası' olarak bilinen ve nimetlere karşı Allah'a teşekkürü ifade eden dua hangi kelimeyle özetlenir?", options:["Elhamdülillah","Sübhanallah","Allahu Ekber","La havle"], correctIndex:0, hint:"Fatiha Suresi'nin ilk ayetinde de geçer.", explanation:"Elhamdülillah (Hamd Allah'a mahsustur) ifadesi, nimetlere karşı şükrü ifade eden temel bir zikir ve duadır." },
  { question:"İslam'da 'La havle vela kuvvete illa billah' ifadesi ne anlama gelir?", options:["'Güç ve kuvvet ancak Allah'tandır'","'Allah büyüktür'","'Allah'tan başka ilah yoktur'","'Hamd Allah'a mahsustur'"], correctIndex:0, hint:"Zorluk anında sıkça söylenen bir zikirdir.", explanation:"'La havle vela kuvvete illa billah', güç ve kudretin ancak Allah'a ait olduğunu ifade eden bir zikirdir." },
  { question:"'Kur'an-ı Kerim'de dua ederken 'hem dünya hem ahiret iyiliği' istenen meşhur bir dua hangi ayette geçer?", options:["Bakara Suresi 201. ayet","Sadece hadislerde geçer","Sadece Fatiha'da geçer","Hiçbir yerde geçmez"], correctIndex:0, hint:"'Rabbena âtina fid-dünya haseneten...' diye başlar.", explanation:"Bakara Suresi'nin 201. ayetinde, hem dünyada hem ahirette iyilik ve cehennem azabından korunma istenen meşhur bir dua yer alır." },
  { question:"İslam'da 'Kur'an okumanın adabı' arasında hangisi yer alır?", options:["Euzü besmele çekerek başlamak","Aceleyle okumak","Anlamını hiç düşünmemek","Sadece sessizce, çok hızlı okumak"], correctIndex:0, hint:"'Euzü billahimineşşeytânirracîm' ile başlanır.", explanation:"Kur'an okumaya euzü-besmele çekerek başlamak, okuma adabının önemli bir parçasıdır." },
  { question:"'Kur'an-ı Kerim'de secde ayetlerinden biri hangi uzun surede (Kur'an'ın ortalarına yakın) bulunur?", options:["Fussilet Suresi","Kevser Suresi","İhlas Suresi","Nasr Suresi"], correctIndex:0, hint:"Kur'an'ın orta bölümlerinde yer alan uzun bir suredir.", explanation:"Fussilet Suresi'nde, Kur'an'ın secde ayetlerinden biri bulunmaktadır." },
  { question:"İslam'da 'Kur'an-ı Kerim'de yer alan Yusuf Suresi' hangi özelliğiyle bilinir?", options:["'Kıssaların en güzeli' olarak nitelendirilmesiyle","Kur'an'ın en kısa suresi olmasıyla","Sadece hukuki içerikli olmasıyla","Sadece dua içermesiyle"], correctIndex:0, hint:"Sure, kendi içinde bu şekilde tanımlanır.", explanation:"Yusuf Suresi, Kur'an'da 'kıssaların en güzeli' olarak nitelendirilen, Hz. Yusuf'un hayatını anlatan bir suredir." },
  { question:"'Kur'an-ı Kerim'de 'Nur Suresi' en çok hangi konuya değinir?", options:["Aile ahlakı, iffet ve toplumsal düzenlemeler","Sadece savaş hukuku","Sadece miras hukuku","Sadece ticaret hukuku"], correctIndex:0, hint:"Sure adı 'ışık' anlamına gelir.", explanation:"Nur Suresi, iffet, aile ahlakı ve toplumsal düzenlemelere dair önemli hükümler içeren bir suredir." },
  { question:"İslam'da 'Nur ayeti' olarak bilinen ve Allah'ın nurunu tasvir eden ayet hangi surede geçer?", options:["Nur Suresi","Yasin Suresi","Rahman Suresi","Mülk Suresi"], correctIndex:0, hint:"Sure ile aynı isimdedir.", explanation:"Nur ayeti (Nur Suresi 35. ayet), Allah'ın nurunu bir kandile benzeten meşhur bir ayettir." },
  { question:"'Kur'an-ı Kerim'de 'Ahzab Suresi' en çok hangi tarihi olaya değinir?", options:["Hendek Savaşı","Bedir Savaşı","Mekke'nin Fethi","Veda Haccı"], correctIndex:0, hint:"Sure adı 'gruplar, ordular' anlamına gelir.", explanation:"Ahzab Suresi, Medine'yi kuşatan müttefik orduların (Ahzab) saldırdığı Hendek Savaşı'na değinir." },
  { question:"İslam'da 'Feth Suresi' hangi olayla ilgilidir?", options:["Hudeybiye Antlaşması ve sonrasındaki gelişmeler","Bedir Savaşı","Uhud Savaşı","Veda Haccı"], correctIndex:0, hint:"Sure adı 'fetih, açılış' anlamına gelir.", explanation:"Feth Suresi, Hudeybiye Antlaşması'nın ardından inen ve bunu bir 'apaçık fetih' olarak niteleyen ayetleri içerir." },
  { question:"'Kur'an-ı Kerim'de 'Münafikun Suresi' hangi konuya değinir?", options:["İkiyüzlü davranan (münafık) kişilerin özellikleri","Sadece miras hukuku","Sadece savaş taktikleri","Sadece ticaret kuralları"], correctIndex:0, hint:"Sure adı 'ikiyüzlüler' anlamına gelir.", explanation:"Münafikun Suresi, inandığını söyleyip içten inanmayan (münafık) kişilerin özelliklerini anlatır." },
  { question:"İslam'da 'Cuma Suresi' hangi konuya değinir?", options:["Cuma namazının önemi ve o vakitte ticaretin bırakılması","Sadece miras hukuku","Sadece hac ibadeti","Sadece oruç kuralları"], correctIndex:0, hint:"Sure ismini bu namazdan alır.", explanation:"Cuma Suresi, Cuma namazının önemine ve namaz vaktinde alışverişin bırakılması gerektiğine değinir." },
  { question:"'Kur'an-ı Kerim'de 'Talak Suresi' hangi hukuki konuya değinir?", options:["Boşanma (talak) hükümleri","Sadece miras hukuku","Sadece ticaret hukuku","Sadece ceza hukuku"], correctIndex:0, hint:"Sure ismini bu konudan alır.", explanation:"Talak Suresi, boşanma (talak) ile ilgili çeşitli hükümlere değinen bir suredir." },
];


const genelKulturBatch11 = [
  { question:"'Ay'ın Dünya etrafındaki bir tam turu ortalama kaç gün sürer?", options:["7 gün","14 gün","27-29 gün","60 gün"], correctIndex:2, hint:"Ay takviminin de temelini oluşturur.", explanation:"Ay, Dünya etrafındaki bir tam turunu ortalama 27-29 gün içinde tamamlar." },
  { question:"Dünyanın en büyük ikinci en derin gölü hangisidir?", options:["Tanganika Gölü","Baykal Gölü (en derini o, bu ikincisi)","Superior Gölü","Viktorya Gölü"], correctIndex:0, hint:"Afrika'da yer alır.", explanation:"Tanganika Gölü, Baykal Gölü'nden sonra dünyanın en derin ikinci gölü olarak kabul edilir." },
  { question:"'Osmanlı Devleti'nde 'Divan Edebiyatı' dışında halk arasında gelişen edebiyat türüne ne ad verilir?", options:["Halk Edebiyatı","Tanzimat Edebiyatı","Servet-i Fünun Edebiyatı","Milli Edebiyat"], correctIndex:0, hint:"Aşık tarzı şiirler bu geleneğe girer.", explanation:"Halk Edebiyatı, sözlü gelenek ve aşıklık kültürüne dayanan, sade dille oluşturulan bir Türk edebiyatı türüdür." },
  { question:"İnsan vücudunda 'refleks yayı' kavramı ne anlama gelir?", options:["Bir uyarının reseptörden kasa kadar izlediği sinirsel yol","Bir kemik eklemi","Bir kas türü","Bir damar çeşidi"], correctIndex:0, hint:"Diz refleksi buna bir örnektir.", explanation:"Refleks yayı, bir uyarının alınmasından kasın tepki vermesine kadar izlediği sinirsel yolu ifade eder." },
  { question:"'Türk halk edebiyatında' aşıklık geleneğinin en önemli temsilcilerinden biri kimdir?", options:["Karacaoğlan","Yahya Kemal","Tevfik Fikret","Cenap Şahabettin"], correctIndex:0, hint:"17. yüzyılda yaşamış, aşk ve doğa temalı şiirleriyle bilinir.", explanation:"Karacaoğlan, Türk halk edebiyatının aşıklık geleneğinde en tanınan isimlerinden biridir." },
  { question:"Dünyanın en büyük ikinci en yüksek yanardağı hangisidir?", options:["Kilimanjaro","Ojos del Salado","Everest (yanardağ değildir)","Etna"], correctIndex:1, hint:"And Dağları'ndadır, Şili-Arjantin sınırındadır.", explanation:"Ojos del Salado, dünyanın en yüksek aktif yanardağlarından biri olarak kabul edilir." },
  { question:"'Türkiye'de ilk kadın mühendislerden biri olarak bilinen isim kimdir?", options:["Sabiha Rüştü Bölükbaşı","Belkıs Şevket","Sabiha Gökçen","Nezihe Muhiddin"], correctIndex:0, hint:"Yüksek mühendis unvanı alan ilk Türk kadınlarındandır.", explanation:"Sabiha Rüştü Bölükbaşı, Türkiye'nin ilk kadın mühendislerinden biri olarak bilinir." },
  { question:"İnsan vücudunda 'kırmızı kemik iliği' en çok hangi işlevle bilinir?", options:["Kan hücrelerinin üretilmesi","Ses üretimi","Sindirim","Görme"], correctIndex:0, hint:"Yassı kemiklerde daha yoğun bulunur.", explanation:"Kırmızı kemik iliği, alyuvar, akyuvar ve trombosit gibi kan hücrelerinin üretildiği dokudur." },
  { question:"'Kanuni Sultan Süleyman' döneminde yaşayan ünlü şair kimdir?", options:["Baki","Fuzuli (farklı dönem, ama tanınır)","Nedim","Şeyh Galip"], correctIndex:0, hint:"'Sultanü'ş-Şuara' (Şairler Sultanı) olarak anılır.", explanation:"Baki, Kanuni Sultan Süleyman döneminde yaşamış, Divan edebiyatının önemli şairlerinden biridir." },
  { question:"Dünyanın en büyük ikinci en yüksek nüfusa sahip metropolü olan Şangay hangi ülkededir?", options:["Çin","Japonya","Güney Kore","Vietnam"], correctIndex:0, hint:"Doğu Asya'nın en büyük ekonomilerinden birine sahiptir.", explanation:"Şangay, Çin'in en büyük ve en kalabalık şehirlerinden biridir." },
  { question:"'Fuzuli' hangi eseriyle Türk edebiyatında en çok tanınır?", options:["Leyla vü Mecnun","Şikayetname (bu da onun ama daha az bilinir)","Hüsn ü Aşk","Mesnevi"], correctIndex:0, hint:"Aşk temalı mesnevisi meşhurdur.", explanation:"Fuzuli, 'Leyla vü Mecnun' mesnevisiyle Türk Divan edebiyatının en tanınan şairlerinden biri haline gelmiştir." },
  { question:"İnsan vücudunda 'sindirim sisteminin' başlangıç noktası neresidir?", options:["Ağız","Mide","İnce bağırsak","Yemek borusu"], correctIndex:0, hint:"Çiğneme burada başlar.", explanation:"Sindirim sistemi, besinlerin çiğnendiği ağızdan başlar." },
  { question:"'Şeyh Galip' hangi eseriyle tanınan bir Divan şairidir?", options:["Hüsn ü Aşk","Leyla vü Mecnun","Mesnevi","Divan-ı Lügati't Türk"], correctIndex:0, hint:"18. yüzyılda yaşamıştır.", explanation:"Şeyh Galip, 'Hüsn ü Aşk' adlı mesnevisiyle tanınan önemli bir Divan edebiyatı şairidir." },
  { question:"Dünyanın en büyük ikinci en uzun yüzeysel mağara sistemine sahip ülkelerden biri hangisidir?", options:["ABD (Mammoth Cave)","Norveç","İsveç","Danimarka"], correctIndex:0, hint:"Kentucky eyaletinde bulunur.", explanation:"ABD'deki Mammoth Cave, dünyanın en uzun bilinen mağara sistemlerinden biri olarak kabul edilir." },
  { question:"'Nedim' hangi dönemin (Lale Devri) önemli bir şairidir?", options:["Lale Devri (18. yüzyıl)","Tanzimat Dönemi","Cumhuriyet Dönemi","Selçuklu Dönemi"], correctIndex:0, hint:"III. Ahmed döneminde yaşamıştır.", explanation:"Nedim, Osmanlı'nın Lale Devri olarak bilinen döneminde yaşamış, zevk ve eğlenceyi konu alan şiirleriyle tanınan bir şairdir." },
];


async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question || '').trim().toLowerCase()));
  console.log('Firestore\'da zaten var olan soru sayısı:', existingTexts.size);

  const allNew = [
    ...islamiBatch10.map(q => Object.assign({category:'islami'}, q)),
    ...genelKulturBatch11.map(q => Object.assign({category:'genel_kultur'}, q)),
  ];

  const toAdd = allNew.filter(q => !existingTexts.has(q.question.trim().toLowerCase()));
  console.log('Eklenecek yeni soru sayısı:', toAdd.length, '(hazırlanan:', allNew.length, ')');

  if(toAdd.length === 0){
    console.log('Eklenecek yeni soru yok, hepsi zaten mevcut.');
    return;
  }

  const batch = db.batch();
  toAdd.forEach(q => {
    const ref = db.collection('quiz_questions').doc();
    batch.set(ref, Object.assign({ createdAt: Date.now(), createdBy: 'seed-script-14' }, q));
  });
  await batch.commit();
  console.log(toAdd.length + ' soru başarıyla eklendi.');
  console.log('Yeni toplam (tahmini):', existingTexts.size + toAdd.length);
}

__checkAlreadySeeded().then(async (alreadyDone) => {
  const __scriptName = require('path').basename(__filename);
  if (alreadyDone) { console.log(`${__scriptName} zaten daha önce tamamlanmış, atlanıyor.`); process.exit(0); return; }
  await main();
  await db.collection('app_config').doc('seedScriptStatus').set({ [require('path').basename(__filename)]: true }, { merge: true }).catch(()=>{});
  process.exit(0);
}).catch(e=>{ console.error('Hata:', e); process.exit(1); });
