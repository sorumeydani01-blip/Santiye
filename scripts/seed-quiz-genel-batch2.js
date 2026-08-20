// Genel Kültür soru havuzunu genişletir (2. parti, 35 yeni soru).
// Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar eklenmez.

const admin = require('firebase-admin');

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('FIREBASE_SERVICE_ACCOUNT ortam değişkeni bulunamadı.');
  process.exit(1);
}
const serviceAccount = JSON.parse(serviceAccountRaw);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const genelKulturBatch2 = [
  { question:"Türkiye'de kullanılan para birimi nedir?", options:["Euro","Türk Lirası","Dolar","Sterlin"], correctIndex:1, hint:"Kısaltması TL veya ₺'dir.", explanation:"Türkiye'nin resmi para birimi Türk Lirası'dır." },
  { question:"Dünyanın en yüksek dağı hangisidir?", options:["K2","Everest","Kilimanjaro","Mont Blanc"], correctIndex:1, hint:"Himalayalar'da, Nepal-Çin sınırındadır.", explanation:"Everest, 8.849 metre yüksekliğiyle dünyanın en yüksek dağıdır." },
  { question:"İnsan vücudunda kan hangi organ tarafından pompalanır?", options:["Akciğer","Kalp","Karaciğer","Böbrek"], correctIndex:1, hint:"Göğüs kafesinin sol tarafına yakındır.", explanation:"Kalp, kanı damarlar aracılığıyla tüm vücuda pompalayan organdır." },
  { question:"'Sefiller' adlı romanın yazarı kimdir?", options:["Victor Hugo","Alexandre Dumas","Emile Zola","Gustave Flaubert"], correctIndex:0, hint:"Fransız yazardır, Notre Dame'ın Kamburu'nu da yazmıştır.", explanation:"Sefiller (Les Misérables), Fransız yazar Victor Hugo'nun 1862'de yayımlanan romanıdır." },
  { question:"Türkiye'nin en kalabalık şehri hangisidir?", options:["Ankara","İzmir","İstanbul","Bursa"], correctIndex:2, hint:"İki kıtaya yayılan tek şehrimizdir.", explanation:"İstanbul, nüfus bakımından Türkiye'nin en kalabalık şehridir." },
  { question:"Dünyada en fazla altın üreten ülke hangisidir (2020'ler itibarıyla)?", options:["Rusya","Avustralya","Çin","ABD"], correctIndex:2, hint:"Nüfusu en kalabalık ülkedir.", explanation:"Çin, günümüzde dünyanın en büyük altın üreticisi ülkesidir." },
  { question:"İnsan gözünün rengini belirleyen yapı hangisidir?", options:["Retina","İris","Kornea","Lens"], correctIndex:1, hint:"Gözbebeğini çevreleyen renkli halkadır.", explanation:"İris, göz rengini belirleyen ve göze giren ışık miktarını ayarlayan yapıdır." },
  { question:"Osmanlı Devleti'nde ilk anayasa (Kanun-i Esasi) hangi padişah döneminde ilan edilmiştir?", options:["II. Abdülhamid","Abdülaziz","V. Mehmed","II. Mahmud"], correctIndex:0, hint:"1876 yılıdır, aynı zamanda I. Meşrutiyet'in ilanıdır.", explanation:"Kanun-i Esasi, 1876'da II. Abdülhamid döneminde ilan edilmiş ve I. Meşrutiyet başlamıştır." },
  { question:"Dünyanın en derin okyanus çukuru hangisidir?", options:["Mariana Çukuru","Puerto Riko Çukuru","Tonga Çukuru","Java Çukuru"], correctIndex:0, hint:"Büyük Okyanus'ta, Filipinler yakınındadır.", explanation:"Mariana Çukuru, bilinen en derin okyanus noktası olan Challenger Derinliği'ni barındırır." },
  { question:"'Yunus Emre' hangi dönemde yaşamış bir Türk şair ve mutasavvıftır?", options:["13-14. yüzyıl","16. yüzyıl","18. yüzyıl","20. yüzyıl"], correctIndex:0, hint:"Anadolu Selçuklu Devleti'nin son dönemlerine denk gelir.", explanation:"Yunus Emre, 13. yüzyılın ikinci yarısı ile 14. yüzyılın başlarında yaşamış büyük bir Türk şairidir." },
  { question:"Ay tutulması ne zaman gerçekleşir?", options:["Ay, Dünya ile Güneş arasına girdiğinde","Dünya, Ay ile Güneş arasına girdiğinde","Güneş, Dünya ile Ay arasına girdiğinde","Ay, Dünya'dan uzaklaştığında"], correctIndex:1, hint:"Dünya'nın gölgesi Ay'a düşer.", explanation:"Ay tutulması, Dünya'nın Güneş ile Ay arasına girip Ay üzerine gölge düşürmesiyle gerçekleşir." },
  { question:"Cumhuriyet Halk Fırkası (bugünkü CHP) hangi yıl kurulmuştur?", options:["1919","1923","1920","1925"], correctIndex:1, hint:"Cumhuriyetin ilan edildiği yıldır.", explanation:"Cumhuriyet Halk Fırkası, 9 Eylül 1923'te Mustafa Kemal Atatürk tarafından kurulmuştur." },
  { question:"Bir bilgisayarın 'beyni' olarak kabul edilen parça hangisidir?", options:["RAM","İşlemci (CPU)","Ekran Kartı","Anakart"], correctIndex:1, hint:"Kısaltması CPU'dur.", explanation:"İşlemci (CPU - Central Processing Unit), bilgisayarın temel işlemleri gerçekleştiren, 'beyni' olarak nitelenen parçasıdır." },
  { question:"Türk Dil Kurumu hangi yıl kurulmuştur?", options:["1928","1932","1923","1940"], correctIndex:1, hint:"Harf İnkılabı'ndan birkaç yıl sonradır.", explanation:"Türk Dil Kurumu, 12 Temmuz 1932'de Atatürk'ün öncülüğünde kurulmuştur." },
  { question:"'Romeo ve Juliet' adlı eserin yazarı kimdir?", options:["Charles Dickens","William Shakespeare","Oscar Wilde","Jane Austen"], correctIndex:1, hint:"İngiliz oyun yazarı ve şairdir.", explanation:"Romeo ve Juliet, İngiliz yazar William Shakespeare'in yazdığı ünlü bir trajedidir." },
  { question:"Dünyanın en küçük kıtası hangisidir?", options:["Avrupa","Avustralya (Okyanusya)","Antarktika","Güney Amerika"], correctIndex:1, hint:"Tek bir ülkenin de kıta olarak kabul edildiği yerdir.", explanation:"Avustralya (Okyanusya), yüzölçümü bakımından dünyanın en küçük kıtasıdır." },
  { question:"İstiklal Marşı ilk kez hangi tarihte kabul edilmiştir?", options:["23 Nisan 1920","12 Mart 1921","29 Ekim 1923","30 Ağustos 1922"], correctIndex:1, hint:"TBMM tarafından kabul edilmiştir.", explanation:"İstiklal Marşı, 12 Mart 1921'de TBMM tarafından milli marş olarak kabul edilmiştir." },
  { question:"İnsan vücudundaki en uzun kemik hangisidir?", options:["Kaburga","Femur (uyluk kemiği)","Kol kemiği","Köprücük kemiği"], correctIndex:1, hint:"Bacağın üst kısmında bulunur.", explanation:"Femur (uyluk kemiği), insan vücudundaki en uzun ve en güçlü kemiktir." },
  { question:"'Bilardo, dünyanın en çok oynanan sporlarından biri değildir' önermesi doğru mudur? Dünyada en çok izlenen spor hangisidir?", options:["Basketbol","Futbol","Tenis","Beyzbol"], correctIndex:1, hint:"Dört yılda bir dünya kupası düzenlenir.", explanation:"Futbol, taraftar sayısı ve izlenme oranı bakımından dünyanın en popüler sporudur." },
  { question:"Sanayi Devrimi ilk olarak hangi ülkede başlamıştır?", options:["Fransa","Almanya","İngiltere","ABD"], correctIndex:2, hint:"18. yüzyılın ikinci yarısında başlamıştır.", explanation:"Sanayi Devrimi, 18. yüzyılın ikinci yarısında İngiltere'de başlamış ve dünyaya yayılmıştır." },
  { question:"Bir insanın DNA'sının bulunduğu hücre yapısı nedir?", options:["Sitoplazma","Çekirdek (Nükleus)","Mitokondri","Hücre zarı"], correctIndex:1, hint:"Hücrenin 'yönetim merkezi' olarak bilinir.", explanation:"DNA, hücrenin çekirdeğinde (nükleusunda) bulunur." },
  { question:"Boğazlar (İstanbul ve Çanakkale Boğazı) statüsünü belirleyen antlaşma hangisidir?", options:["Lozan Antlaşması","Montrö Boğazlar Sözleşmesi","Sevr Antlaşması","Mudanya Ateşkes Antlaşması"], correctIndex:1, hint:"1936 yılında imzalanmıştır.", explanation:"Montrö Boğazlar Sözleşmesi, 1936'da imzalanmış olup Türk Boğazları'nın statüsünü belirler." },
  { question:"Dünyanın en soğuk kıtası hangisidir?", options:["Antarktika","Avrupa","Asya","Kuzey Amerika"], correctIndex:0, hint:"Güney Kutbu bu kıtada yer alır.", explanation:"Antarktika, dünyanın en soğuk ve en az nüfuslu kıtasıdır." },
  { question:"'Piri Reis' kimdir?", options:["Osmanlı denizcisi ve haritacısı","Bir Selçuklu sultanı","Bir Bizans imparatoru","Bir İtalyan kâşif"], correctIndex:0, hint:"Ünlü bir dünya haritası çizmiştir.", explanation:"Piri Reis, 1513 tarihli dünya haritasıyla tanınan Osmanlı denizci ve haritacısıdır." },
  { question:"Vücudumuzda solunumu sağlayan temel organ çifti hangisidir?", options:["Böbrekler","Akciğerler","Karaciğer","Bağırsaklar"], correctIndex:1, hint:"Göğüs kafesinde, kalbin iki yanında bulunur.", explanation:"Akciğerler, oksijen alıp karbondioksit vermemizi sağlayan solunum organlarıdır." },
  { question:"Türkiye'de ilk kadın hakları (seçme-seçilme) hangi yıl tanınmıştır?", options:["1930 (yerel), 1934 (genel)","1923","1945","1950"], correctIndex:0, hint:"Kadınlar önce belediye seçimlerinde, sonra genel seçimlerde oy kullanmıştır.", explanation:"Türk kadınları 1930'da yerel seçimlerde, 1934'te ise genel seçimlerde seçme ve seçilme hakkı kazanmıştır." },
  { question:"'Es-Cezeri' kimdir?", options:["Bir Osmanlı şairi","Ortaçağ İslam dünyasının önemli bir mühendisi","Bir Selçuklu veziri","Bir coğrafyacı"], correctIndex:1, hint:"Otomatik makineler ve su saatleriyle tanınır.", explanation:"El-Cezeri (Es-Cezeri), 12-13. yüzyılda yaşamış, mekanik buluşlarıyla tanınan İslam dünyasının önemli mühendislerindendir." },
  { question:"Bir bitkinin büyümesi için gerekli olan temel gaz hangisidir (fotosentez için)?", options:["Oksijen","Karbondioksit","Azot","Hidrojen"], correctIndex:1, hint:"Bitkiler bu gazı alıp oksijen verir.", explanation:"Bitkiler, fotosentez sırasında karbondioksiti alır ve oksijen üretir." },
  { question:"Türkiye'nin komşu olduğu ülke sayısı kaçtır?", options:["6","7","8","9"], correctIndex:2, hint:"Yunanistan'dan Gürcistan'a kadar sayarsanız.", explanation:"Türkiye'nin kara sınırı olan 8 komşusu vardır: Yunanistan, Bulgaristan, Gürcistan, Ermenistan, Azerbaycan (Nahçıvan), İran, Irak, Suriye." },
  { question:"'Kanuni Sultan Süleyman' hangi Osmanlı padişahının diğer adıdır?", options:["I. Süleyman","II. Süleyman","III. Süleyman","IV. Süleyman"], correctIndex:0, hint:"Osmanlı'nın en uzun süre tahtta kalan padişahlarındandır.", explanation:"Kanuni Sultan Süleyman, I. Süleyman'ın halk arasındaki ve tarihi adıdır; 46 yıl tahtta kalmıştır." },
  { question:"Dünyanın en büyük adası hangisidir?", options:["Madagaskar","Grönland","Borneo","Yeni Gine"], correctIndex:1, hint:"Kuzey Amerika ile Avrupa arasında, Danimarka'ya bağlıdır.", explanation:"Grönland, Avustralya kıta sayıldığından, dünyanın en büyük adası olarak kabul edilir." },
  { question:"'Atatürk'ün Gençliğe Hitabesi' hangi eserin bir bölümüdür?", options:["Nutuk","Söylev ve Demeçler","Anafartalar Hatıraları","Zabit ve Kumandan ile Hasbihal"], correctIndex:0, hint:"1927'de okunan büyük söylevin son bölümüdür.", explanation:"Gençliğe Hitabe, Atatürk'ün 1927'de okuduğu Nutuk'un son bölümüdür." },
  { question:"İnsan vücudunda sindirimi başlatan organ hangisidir?", options:["Mide","Ağız","İnce bağırsak","Karaciğer"], correctIndex:1, hint:"Tükürükteki enzimler burada işe başlar.", explanation:"Sindirim, ağızda çiğneme ve tükürük enzimleriyle başlar." },
  { question:"'Troya' antik kenti hangi ülkede bulunmaktadır?", options:["Yunanistan","İtalya","Türkiye","Mısır"], correctIndex:2, hint:"Çanakkale iline bağlıdır.", explanation:"Troya antik kenti, Türkiye'nin Çanakkale ilinde, UNESCO Dünya Mirası listesinde yer alır." },
  { question:"Dünyada ilk yazılı anayasal belgelerden biri kabul edilen Magna Carta hangi ülkede imzalanmıştır?", options:["Fransa","İngiltere","Almanya","İspanya"], correctIndex:1, hint:"1215 yılında Kral John tarafından imzalanmıştır.", explanation:"Magna Carta, 1215'te İngiltere'de Kral John tarafından imzalanan, kraliyet yetkilerini sınırlayan tarihi bir belgedir." },
];


async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question || '').trim().toLowerCase()));
  console.log('Firestore\'da zaten var olan soru sayısı:', existingTexts.size);

  const toAdd = genelKulturBatch2.filter(q => !existingTexts.has(q.question.trim().toLowerCase()));
  console.log('Eklenecek yeni soru sayısı:', toAdd.length, '(hazırlanan:', genelKulturBatch2.length, ')');

  if(toAdd.length === 0){
    console.log('Eklenecek yeni soru yok, hepsi zaten mevcut.');
    return;
  }

  const batch = db.batch();
  toAdd.forEach(q => {
    const ref = db.collection('quiz_questions').doc();
    batch.set(ref, Object.assign({ category: 'genel_kultur', createdAt: Date.now(), createdBy: 'seed-script-3' }, q));
  });
  await batch.commit();
  console.log(toAdd.length + ' soru başarıyla eklendi.');
}

main().then(()=>process.exit(0)).catch(e=>{ console.error('Hata:', e); process.exit(1); });
