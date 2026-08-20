// Genel Kültür soru havuzunu genişletir (3. parti, 50 yeni soru).
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

const genelKulturBatch3 = [
  { question:"Türkiye'de kaç coğrafi bölge bulunmaktadır?", options:["5","6","7","8"], correctIndex:2, hint:"Marmara, Ege, Akdeniz, İç Anadolu, Karadeniz, Doğu Anadolu, Güneydoğu Anadolu.", explanation:"Türkiye 7 coğrafi bölgeye ayrılır." },
  { question:"Dünyada en çok nüfusa sahip kıta hangisidir?", options:["Afrika","Avrupa","Asya","Kuzey Amerika"], correctIndex:2, hint:"Çin ve Hindistan bu kıtada yer alır.", explanation:"Asya, dünya nüfusunun yarısından fazlasını barındıran en kalabalık kıtadır." },
  { question:"'Hamlet' adlı eserin yazarı kimdir?", options:["William Shakespeare","Johann Wolfgang von Goethe","Anton Çehov","Molière"], correctIndex:0, hint:"'Romeo ve Juliet'i de o yazmıştır.", explanation:"Hamlet, İngiliz yazar William Shakespeare'in en ünlü trajedilerinden biridir." },
  { question:"Bir yılda kaç mevsim vardır?", options:["2","3","4","5"], correctIndex:2, hint:"İlkbahar, yaz, sonbahar, kış.", explanation:"Bir yıl, dört mevsime ayrılır: ilkbahar, yaz, sonbahar ve kış." },
  { question:"Dünyanın en hızlı kara hayvanı hangisidir?", options:["Aslan","Çita","At","Antilop"], correctIndex:1, hint:"Saatte 100 km'yi aşan hıza ulaşabilir.", explanation:"Çita, kısa mesafelerde saatte 100-120 km hıza ulaşabilen dünyanın en hızlı kara hayvanıdır." },
  { question:"Türkiye'nin ilk kadın savaş pilotu kimdir?", options:["Sabiha Gökçen","Halide Edip Adıvar","Fatma Aliye","Nezihe Muhiddin"], correctIndex:0, hint:"Atatürk'ün manevi kızıdır.", explanation:"Sabiha Gökçen, dünyanın ilk kadın savaş pilotlarından biri olarak kabul edilir." },
  { question:"'Don Kişot' adlı romanın yazarı kimdir?", options:["Miguel de Cervantes","Gabriel García Márquez","Federico García Lorca","Pablo Neruda"], correctIndex:0, hint:"İspanyol yazardır.", explanation:"Don Kişot, İspanyol yazar Miguel de Cervantes'in 1605'te yayımlanan ünlü romanıdır." },
  { question:"İnsan vücudunda bulunan en küçük kemik nerededir?", options:["Elde","Kulakta","Ayakta","Omurgada"], correctIndex:1, hint:"İşitme ile ilgilidir.", explanation:"Üzengi kemiği (stapes), kulakta bulunan ve vücuttaki en küçük kemiktir." },
  { question:"Osmanlı Devleti'nde 'Divan-ı Hümayun' ne işe yarardı?", options:["Ordu eğitim merkeziydi","Devlet işlerinin görüşüldüğü kuruldu","Bir tür mahkeme binasıydı","Vergi toplama teşkilatıydı"], correctIndex:1, hint:"Padişah veya sadrazam başkanlığında toplanırdı.", explanation:"Divan-ı Hümayun, Osmanlı Devleti'nde devlet işlerinin görüşülüp karara bağlandığı en yüksek kuruldu." },
  { question:"Dünyanın en uzun kara sınırına sahip iki ülkesi hangisidir?", options:["ABD-Meksika","Rusya-Çin","Kanada-ABD","Hindistan-Çin"], correctIndex:2, hint:"Kuzey Amerika kıtasındaki iki komşu ülke.", explanation:"Kanada ile ABD arasındaki sınır, dünyanın en uzun kara sınırıdır (yaklaşık 8.891 km)." },
  { question:"'Bilim insanları neden Ay'a ilk kez 1969'da gidebildi?' sorusundan yola çıkarak, Ay'a ilk ayak basan insan kimdir?", options:["Buzz Aldrin","Yuri Gagarin","Neil Armstrong","John Glenn"], correctIndex:2, hint:"Apollo 11 görevinin komutanıydı.", explanation:"Neil Armstrong, 20 Temmuz 1969'da Ay'a ayak basan ilk insan olmuştur." },
  { question:"Türk basınının ilk özel gazetesi kabul edilen yayın hangisidir?", options:["Takvim-i Vekayi","Tercüman-ı Ahval","Ceride-i Havadis","İkdam"], correctIndex:1, hint:"1860 yılında yayımlanmaya başlamıştır.", explanation:"Tercüman-ı Ahval, 1860'ta yayımlanan, Türk basın tarihinin ilk özel (resmi olmayan) gazetesidir." },
  { question:"İnsan vücudunda vitamin D'nin temel kaynağı nedir?", options:["Su","Güneş ışığı","Tuz","Hava"], correctIndex:1, hint:"Cilt bu ışınla temas ettiğinde üretilir.", explanation:"Vitamin D, güneş ışığının (UVB ışınlarının) ciltle teması sonucunda vücutta doğal olarak üretilir." },
  { question:"Türkiye'de karasal iklimin en belirgin görüldüğü bölge hangisidir?", options:["Marmara","Ege","İç Anadolu","Karadeniz"], correctIndex:2, hint:"Yazları sıcak-kurak, kışları soğuk-kar yağışlı geçer.", explanation:"İç Anadolu Bölgesi, karasal iklimin en tipik görüldüğü bölgemizdir." },
  { question:"Dünyada ilk modern Olimpiyat Oyunları hangi şehirde düzenlenmiştir?", options:["Paris","Londra","Atina","Roma"], correctIndex:2, hint:"1896 yılında, oyunların kadim başlangıç ülkesinde yapılmıştır.", explanation:"İlk modern Olimpiyat Oyunları, 1896'da Atina'da düzenlenmiştir." },
  { question:"'Simyacı' adlı romanın yazarı kimdir?", options:["Paulo Coelho","Isabel Allende","Jorge Luis Borges","Mario Vargas Llosa"], correctIndex:0, hint:"Brezilyalı yazardır.", explanation:"Simyacı (O Alquimista), Brezilyalı yazar Paulo Coelho'nun dünya çapında ün kazanan romanıdır." },
  { question:"Ekvator çizgisi hangi kıtalardan geçmez?", options:["Afrika","Güney Amerika","Avrupa","Asya"], correctIndex:2, hint:"Bu kıta, Kuzey Yarımküre'de yer alır.", explanation:"Ekvator çizgisi Afrika, Güney Amerika ve Asya'dan geçer; Avrupa'dan geçmez." },
  { question:"Türkiye Büyük Millet Meclisi hangi tarihte açılmıştır?", options:["23 Nisan 1920","19 Mayıs 1919","29 Ekim 1923","30 Ağustos 1922"], correctIndex:0, hint:"Bu tarih daha sonra bir bayram olarak kutlanmaya başlanmıştır.", explanation:"TBMM, 23 Nisan 1920'de Ankara'da açılmıştır." },
  { question:"İnsan vücudunda beyni koruyan kemik yapıya ne ad verilir?", options:["Omurga","Kafatası","Kaburga","Leğen kemiği"], correctIndex:1, hint:"Başımızı çevreleyen kemik bütünüdür.", explanation:"Kafatası, beyni dış darbelere karşı koruyan kemik yapıdır." },
  { question:"Dünyanın en büyük mercan resifi olan Büyük Bariyer Resifi hangi ülke kıyılarındadır?", options:["Endonezya","Avustralya","Filipinler","Meksika"], correctIndex:1, hint:"Okyanusya kıtasındaki bir ülkedir.", explanation:"Büyük Bariyer Resifi, Avustralya'nın kuzeydoğu kıyılarında yer alan dünyanın en büyük mercan resif sistemidir." },
  { question:"'Anadolu Ajansı' hangi yıl kurulmuştur?", options:["1920","1923","1919","1925"], correctIndex:0, hint:"Kurtuluş Savaşı sürecinde, Mustafa Kemal'in talimatıyla kurulmuştur.", explanation:"Anadolu Ajansı, 6 Nisan 1920'de Mustafa Kemal Atatürk'ün talimatıyla kurulmuştur." },
  { question:"İnsan vücudunda protein sentezinden sorumlu hücre içi yapı hangisidir?", options:["Ribozom","Mitokondri","Golgi cisimciği","Lizozom"], correctIndex:0, hint:"DNA'daki bilgiyi proteine çeviren yapıdır.", explanation:"Ribozomlar, hücrede protein sentezinin gerçekleştiği organellerdir." },
  { question:"Osmanlı Devleti'nde ilk kağıt para hangi padişah döneminde çıkarılmıştır?", options:["III. Selim","Abdülmecid","II. Mahmud","Abdülaziz"], correctIndex:1, hint:"Buna 'Kaime' denirdi.", explanation:"Osmanlı'da ilk kağıt para (Kaime), Sultan Abdülmecid döneminde 1840'ta çıkarılmıştır." },
  { question:"Dünyanın en uzun demiryolu hattı hangisidir?", options:["Trans-Sibirya Demiryolu","Orient Ekspres","Kanada Pasifik Demiryolu","Hindistan Demiryolu"], correctIndex:0, hint:"Moskova ile Vladivostok'u birbirine bağlar.", explanation:"Trans-Sibirya Demiryolu, yaklaşık 9.289 km ile dünyanın en uzun demiryolu hattıdır." },
  { question:"'Bir litre su kaç kilogramdır (yaklaşık)?'", options:["0,5 kg","1 kg","2 kg","10 kg"], correctIndex:1, hint:"Suyun yoğunluğu 1 g/cm³'tür.", explanation:"1 litre saf su, yaklaşık olarak 1 kilogram ağırlığındadır." },
  { question:"Cumhuriyet döneminde harf inkılabı hangi yıl gerçekleştirilmiştir?", options:["1923","1925","1928","1930"], correctIndex:2, hint:"Latin alfabesine geçilen yıldır.", explanation:"Harf İnkılabı, 1 Kasım 1928'de kabul edilen kanunla Latin alfabesine geçişi sağlamıştır." },
  { question:"'Kristof Kolomb' hangi kıtayı 'keşfetmiştir' (Avrupalılar için)?", options:["Afrika","Asya","Amerika","Avustralya"], correctIndex:2, hint:"1492 yılında Atlas Okyanusu'nu geçmiştir.", explanation:"Kristof Kolomb, 1492'de Amerika kıtasına ulaşan ilk Avrupalı kâşiflerden biridir." },
  { question:"İnsan vücudunda idrar üretiminden sorumlu organ hangisidir?", options:["Karaciğer","Böbrekler","Dalak","Pankreas"], correctIndex:1, hint:"Vücutta çift olarak bulunan, kanı süzen organdır.", explanation:"Böbrekler, kanı süzerek idrar oluşturan boşaltım organlarıdır." },
  { question:"'Kapadokya' hangi coğrafi bölgemizde yer alır?", options:["Ege Bölgesi","İç Anadolu Bölgesi","Doğu Anadolu Bölgesi","Marmara Bölgesi"], correctIndex:1, hint:"Peri bacalarıyla ünlüdür, Nevşehir çevresindedir.", explanation:"Kapadokya, İç Anadolu Bölgesi'nde, başta Nevşehir olmak üzere birkaç il sınırlarında yer alır." },
  { question:"Bir bilgisayarda verilerin geçici olarak saklandığı, bilgisayar kapandığında silinen bellek türü hangisidir?", options:["Sabit disk (HDD)","RAM","SSD","USB Bellek"], correctIndex:1, hint:"'Rastgele Erişimli Bellek' anlamına gelir.", explanation:"RAM (Random Access Memory), geçici veri saklama birimidir; bilgisayar kapandığında içeriği silinir." },
  { question:"'Mustafa Kemal Atatürk' hangi şehirde doğmuştur?", options:["İstanbul","Selanik","İzmir","Ankara"], correctIndex:1, hint:"Bugün Yunanistan sınırları içindedir.", explanation:"Mustafa Kemal Atatürk, 1881 yılında bugünkü Yunanistan'da bulunan Selanik'te doğmuştur." },
  { question:"Dünyanın en büyük gölü (yüzölçümü bakımından) hangisidir?", options:["Superior Gölü","Hazar Denizi (Gölü)","Viktorya Gölü","Baykal Gölü"], correctIndex:1, hint:"Aslında bir göldür ama 'deniz' olarak da anılır.", explanation:"Hazar Denizi (aslında bir göldür), yüzölçümü bakımından dünyanın en büyük gölüdür." },
  { question:"İnsan vücudunda kasların hareketini kontrol eden sistem hangisidir?", options:["Dolaşım sistemi","Sinir sistemi","Sindirim sistemi","Solunum sistemi"], correctIndex:1, hint:"Beyin ve omurilikten oluşur.", explanation:"Sinir sistemi, kasların hareketlerini ve vücuttaki diğer birçok fonksiyonu kontrol eder." },
  { question:"'Süleymaniye Camii'nin mimarı kimdir?", options:["Sinan","Sedefkar Mehmed Ağa","Davud Ağa","Dalgıç Ahmed Ağa"], correctIndex:0, hint:"Osmanlı'nın en önemli mimarıdır, 'Mimar' unvanıyla anılır.", explanation:"Süleymaniye Camii, ünlü Osmanlı mimarı Mimar Sinan tarafından inşa edilmiştir." },
  { question:"Dünyada nüfus bakımından en büyük şehir hangisidir (metropol alan olarak)?", options:["Tokyo","New York","Şangay","Mumbai"], correctIndex:0, hint:"Japonya'nın başkentidir.", explanation:"Tokyo, metropoliten alan nüfusu bakımından dünyanın en kalabalık şehridir." },
  { question:"'Bir dakika kaç saniyedir?'", options:["100","60","24","365"], correctIndex:1, hint:"Saat sisteminin temel biriminden biri.", explanation:"Bir dakika, 60 saniyeden oluşur." },
  { question:"Türkiye'nin ilk özel televizyon kanalı hangisidir?", options:["Show TV","Star TV","ATV","Kanal D"], correctIndex:1, hint:"1989 yılında yayına başlamıştır.", explanation:"Star TV (o dönemki adıyla Star 1), Türkiye'nin ilk özel televizyon kanalıdır." },
  { question:"'Beethoven' hangi ülkenin ünlü bir bestecisidir?", options:["Avusturya","Almanya","Fransa","İtalya"], correctIndex:1, hint:"Bonn şehrinde doğmuştur.", explanation:"Ludwig van Beethoven, Alman asıllı dünyaca ünlü bir klasik müzik bestecisidir." },
  { question:"İnsan vücudunda enfeksiyonlara karşı savunma yapan sistem hangisidir?", options:["Bağışıklık sistemi","Sindirim sistemi","İskelet sistemi","Boşaltım sistemi"], correctIndex:0, hint:"Beyaz kan hücreleri bu sistemde görev alır.", explanation:"Bağışıklık (immün) sistemi, vücudu hastalık yapan mikroorganizmalara karşı korur." },
  { question:"Osmanlı Devleti'nin son padişahı kimdir?", options:["V. Mehmed (Reşad)","VI. Mehmed (Vahdettin)","II. Abdülhamid","Abdülmecid"], correctIndex:1, hint:"1922'de saltanatın kaldırılmasıyla tahttan indirilmiştir.", explanation:"VI. Mehmed Vahdettin, Osmanlı Devleti'nin son padişahıdır." },
  { question:"Dünyanın en yüksek yapısı hangisidir (günümüz itibarıyla)?", options:["Empire State Building","Burj Khalifa","Şangay Kulesi","Petronas Kuleleri"], correctIndex:1, hint:"Dubai'dedir.", explanation:"Burj Khalifa, 828 metre yüksekliğiyle dünyanın en yüksek yapısıdır." },
  { question:"'Pi sayısı' (π) yaklaşık olarak kaçtır?", options:["2,14","3,14","4,14","1,14"], correctIndex:1, hint:"Bir dairenin çevresinin çapına oranıdır.", explanation:"Pi sayısı (π), yaklaşık olarak 3,14159 değerine eşittir." },
  { question:"Türkiye'de ilk üniversite kabul edilen kurum hangisidir?", options:["İstanbul Üniversitesi","Ankara Üniversitesi","ODTÜ","Boğaziçi Üniversitesi"], correctIndex:0, hint:"Kökeni Darülfünun'a dayanır.", explanation:"İstanbul Üniversitesi, kökeni Darülfünun'a dayanan Türkiye'nin en eski üniversitesi olarak kabul edilir." },
  { question:"'Kuzey Yıldızı' olarak da bilinen yıldız hangi takımyıldızda bulunur?", options:["Büyük Ayı","Küçük Ayı","Orion","Kassiopeia"], correctIndex:1, hint:"Denizcilerin yön bulmak için kullandığı yıldızdır.", explanation:"Kutup Yıldızı (Kuzey Yıldızı), Küçük Ayı (Küçükayı) takımyıldızında yer alır." },
  { question:"Dünyada en fazla dil konuşulan ülke hangisidir (dil çeşitliliği bakımından)?", options:["Papua Yeni Gine","Hindistan","Nijerya","Endonezya"], correctIndex:0, hint:"Okyanusya'da küçük ama son derece dil çeşitliliği yüksek bir ülkedir.", explanation:"Papua Yeni Gine, 800'den fazla dille dünyada en fazla dil çeşitliliğine sahip ülkedir." },
  { question:"'Cumhuriyet' kelimesi hangi dilden Türkçeye geçmiştir?", options:["Farsça","Arapça","Fransızca","Latince"], correctIndex:1, hint:"Kök anlamı 'halka ait' demektir.", explanation:"Cumhuriyet kelimesi, Arapça 'cumhur' (halk) kökünden Türkçeye geçmiştir." },
  { question:"Güneş tutulması ne zaman gerçekleşir?", options:["Dünya, Ay ile Güneş arasına girdiğinde","Ay, Dünya ile Güneş arasına girdiğinde","Güneş, Ay'ın gölgesine girdiğinde","Ay, Dünya'dan uzaklaştığında"], correctIndex:1, hint:"Ay'ın gölgesi Dünya üzerine düşer.", explanation:"Güneş tutulması, Ay'ın Dünya ile Güneş arasına girerek Güneş'i geçici olarak örtmesiyle gerçekleşir." },
  { question:"'Nasrettin Hoca' fıkralarıyla tanınan bir Türk halk bilgesi ve mizah ustasıdır. Hangi yüzyılda yaşadığı kabul edilir?", options:["11. yüzyıl","13. yüzyıl","16. yüzyıl","19. yüzyıl"], correctIndex:1, hint:"Anadolu Selçuklu Devleti dönemine denk gelir.", explanation:"Nasrettin Hoca'nın 13. yüzyılda, Anadolu Selçukluları döneminde yaşadığı kabul edilir." },
  { question:"Dünyada elektrik üretiminde en çok kullanılan yenilenebilir enerji kaynağı hangisidir?", options:["Güneş enerjisi","Rüzgar enerjisi","Hidroelektrik (su gücü)","Jeotermal enerji"], correctIndex:2, hint:"Barajlarla üretilir.", explanation:"Hidroelektrik enerji, dünya genelinde en yaygın kullanılan yenilenebilir elektrik kaynağıdır." },
  { question:"'Fenerbahçe, Galatasaray ve Beşiktaş' gibi kulüplerin de yer aldığı Türkiye'nin en üst düzey futbol ligi hangisidir?", options:["1. Lig","Süper Lig","Bölgesel Amatör Lig","2. Lig"], correctIndex:1, hint:"Türk futbolunun zirve ligidir.", explanation:"Süper Lig, Türkiye'nin en üst düzey profesyonel futbol ligidir." },
];


async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question || '').trim().toLowerCase()));
  console.log('Firestore\'da zaten var olan soru sayısı:', existingTexts.size);

  const toAdd = genelKulturBatch3.filter(q => !existingTexts.has(q.question.trim().toLowerCase()));
  console.log('Eklenecek yeni soru sayısı:', toAdd.length, '(hazırlanan:', genelKulturBatch3.length, ')');

  if(toAdd.length === 0){
    console.log('Eklenecek yeni soru yok, hepsi zaten mevcut.');
    return;
  }

  const batch = db.batch();
  toAdd.forEach(q => {
    const ref = db.collection('quiz_questions').doc();
    batch.set(ref, Object.assign({ category: 'genel_kultur', createdAt: Date.now(), createdBy: 'seed-script-5' }, q));
  });
  await batch.commit();
  console.log(toAdd.length + ' soru başarıyla eklendi.');
}

main().then(()=>process.exit(0)).catch(e=>{ console.error('Hata:', e); process.exit(1); });
