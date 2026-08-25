// 1000 SORU HEDEFİ SONRASI — 9. Parça (45 yeni soru: 30 İslami + 15 Genel Kültür)
// Günlük dua adabı, sahabeler (Bilal, Suhayb, Ammar, Sümeyye), tecvid terimleri,
// İslam sanatları (hat, tezhip, ebru), zekât/fitre/kurban detayları gibi konulara
// odaklanır. Zaten eklenmiş (aynı soru metnine sahip) sorular tekrar eklenmez,
// güvenle tekrar çalıştırılabilir.

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


const islamiBatch11 = [
  { question:"İslam'da 'yemekten önce dua/besmele çekmenin' amacı nedir?", options:["Nimeti Allah adına, bereketle yemek","Sadece bir gelenek olarak yapmak","Zorunlu bir farz olduğu için","Hiçbir özel amacı yoktur"], correctIndex:0, hint:"Bereket ve şükür bilinciyle ilişkilidir.", explanation:"Yemekten önce besmele çekmek, nimetin Allah'tan geldiğini hatırlayarak bereketle ve şükür bilinciyle yemek amacı taşır." },
  { question:"'Uyumadan önce yapılan dua ve zikirlerin' amacı nedir?", options:["Allah'a sığınarak huzurla uyumak","Sadece bir alışkanlık","Uyumayı geciktirmek","Hiçbir amacı yoktur"], correctIndex:0, hint:"Manevi bir koruma ve huzur arayışıdır.", explanation:"Uyumadan önceki dua ve zikirler, kişinin Allah'a sığınarak huzur içinde uyumasını amaçlar." },
  { question:"İslam'da 'yolculuğa çıkarken dua etmenin' amacı nedir?", options:["Yolculuğun güvenli ve hayırlı geçmesini dilemek","Sadece bir gelenek","Yolculuğu uzatmak","Hiçbir amacı yoktur"], correctIndex:0, hint:"Sefer duası olarak bilinir.", explanation:"Yolculuk (sefer) duası, yolculuğun güvenli, kolay ve hayırlı geçmesini Allah'tan dilemek amacıyla okunur." },
  { question:"'Bilal-i Habeşi' hangi özelliğiyle İslam tarihinde öne çıkar?", options:["İlk müezzin olması ve güzel sesi","Bir savaş komutanı olması","Bir tefsir alimi olması","Bir halife olması"], correctIndex:0, hint:"Habeşistan kökenli bir sahabedir.", explanation:"Bilal-i Habeşi, İslam'ın ilk müezzini olarak, güzel sesiyle ezan okumasıyla tanınan önemli bir sahabedir." },
  { question:"'Suhayb-i Rumi' hangi özelliğiyle bilinir?", options:["Bizans (Rum) kökenli olması ve erken Müslüman olması","Bir halife olması","Bir savaş kaybetmesi","Bir tefsir yazması"], correctIndex:0, hint:"'Rumi' lakabı kökenine işaret eder.", explanation:"Suhayb-i Rumi, Bizans (Rum) kökenli olup İslam'ı erken dönemde kabul eden sahabelerdendir." },
  { question:"'Ammar bin Yasir' hangi özelliğiyle bilinir?", options:["İşkenceye maruz kalmasına rağmen imanından dönmemesi","Bir halife olması","Bir savaş kaybetmesi","Bir tefsir yazması"], correctIndex:0, hint:"Ailesiyle birlikte büyük eziyetler görmüştür.", explanation:"Ammar bin Yasir ve ailesi, Mekke döneminde İslam'a girdikleri için ağır işkencelere maruz kalmış, buna rağmen imanlarından vazgeçmemişlerdir." },
  { question:"İslam'da 'Sümeyye binti Hayyat' kimdir?", options:["İslam'da ilk şehit olan kadın sahabe","Bir halife eşi","Bir peygamber kızı","Bir melek"], correctIndex:0, hint:"Ammar bin Yasir'in annesidir.", explanation:"Sümeyye binti Hayyat, İslam tarihinde şehit edilen ilk kadın sahabe olarak bilinir." },
  { question:"'Kur'an-ı Kerim'in tecvid kurallarına göre okunması' neden önemlidir?", options:["Anlamın ve doğru telaffuzun korunması için","Sadece estetik amaçla","Zorunlu olmadığı için önemsizdir","Sadece hafızlar için geçerlidir"], correctIndex:0, hint:"Harflerin doğru mahreçten çıkması anlamı etkileyebilir.", explanation:"Tecvid kurallarına uygun okuma, Kur'an'ın anlamının ve doğru telaffuzunun korunması açısından önemlidir." },
  { question:"İslam'da 'medd' kavramı tecvid ilminde neyi ifade eder?", options:["Belirli harflerin uzatılarak okunması","Bir secde türü","Bir dua şekli","Bir namaz vakti"], correctIndex:0, hint:"Elif, vav, ye harfleriyle ilgilidir.", explanation:"Medd, tecvid ilminde belirli şartlarda harflerin normalden daha uzun okunmasını ifade eden bir kuraldır." },
  { question:"'İdgam' kavramı tecvid ilminde ne anlama gelir?", options:["Bir harfin bir sonraki harfe katılarak okunması","Bir harfin hiç okunmaması","Bir harfin çok kısa okunması","Bir secde türü"], correctIndex:0, hint:"Harflerin akıcı bir şekilde birleştirilmesiyle ilgilidir.", explanation:"İdgam, tecvid ilminde bir harfin belirli şartlarda kendinden sonraki harfe katılarak (birleştirilerek) okunmasıdır." },
  { question:"İslam'da 'hüsn-i hat' (güzel yazı) sanatı en çok neyle ilişkilidir?", options:["Kur'an ve dini metinlerin sanatsal biçimde yazılması","Sadece resim sanatı","Sadece heykelcilik","Sadece mimari"], correctIndex:0, hint:"Osmanlı'da büyük gelişme göstermiştir.", explanation:"Hüsn-i hat (hat sanatı), özellikle Kur'an ve dini metinlerin estetik ve sanatsal bir üslupla yazılmasını ifade eden İslam sanatlarından biridir." },
  { question:"'Tezhip' sanatı en çok neyle ilişkilendirilir?", options:["El yazması eserlerin altın ve renkli desenlerle süslenmesi","Sadece heykelcilik","Sadece mimari","Sadece müzik"], correctIndex:0, hint:"Kur'an-ı Kerim nüshalarında sıkça görülür.", explanation:"Tezhip, el yazması eserlerin, özellikle Kur'an-ı Kerim nüshalarının altın varak ve renkli desenlerle süslenmesi sanatıdır." },
  { question:"İslam'da 'ebru sanatı' neyi ifade eder?", options:["Su üzerine boyalarla yapılan sanatsal desenler","Bir müzik türü","Bir dans türü","Bir mimari üslup"], correctIndex:0, hint:"Su yüzeyinde renklerin şekillendirilmesiyle yapılır.", explanation:"Ebru, su yüzerinde özel boyalarla oluşturulan, kağıda aktarılan geleneksel bir Türk-İslam sanatıdır." },
  { question:"'Kurban Bayramı' kaç gün sürer?", options:["4 gün","2 gün","1 gün","7 gün"], correctIndex:0, hint:"Kesim üç gün, bayram kutlaması ise biraz daha uzun sürebilir.", explanation:"Kurban Bayramı, genellikle 4 gün olarak kutlanır." },
  { question:"'Ramazan Bayramı' kaç gün sürer?", options:["3 gün","2 gün","1 gün","5 gün"], correctIndex:0, hint:"Şeker Bayramı olarak da bilinir.", explanation:"Ramazan Bayramı (Şeker Bayramı), genellikle 3 gün olarak kutlanır." },
  { question:"İslam'da 'zekâtın nisap miktarı' altın için genel olarak kaç gram kabul edilir?", options:["Yaklaşık 80.18 gram","Yaklaşık 10 gram","Yaklaşık 500 gram","Yaklaşık 1 kilogram"], correctIndex:0, hint:"Bu miktar 20 miskal olarak da ifade edilir.", explanation:"Altın için zekât nisabı, geleneksel olarak yaklaşık 80.18 gram (20 miskal) olarak kabul edilir." },
  { question:"'Zekâtın oranı' genel olarak mal varlığının yüzde kaçıdır?", options:["%2,5 (kırkta bir)","%10","%50","%1"], correctIndex:0, hint:"'Kırkta bir' olarak da bilinir.", explanation:"Zekât, genel olarak nisaba ulaşan malın yaklaşık %2,5'i (kırkta biri) oranında verilir." },
  { question:"İslam'da 'öşür' kavramı en çok hangi ürünlerle ilgilidir?", options:["Tarım ürünleri","Sadece altın","Sadece gümüş","Sadece hayvanlar"], correctIndex:0, hint:"'Onda bir' anlamına gelir.", explanation:"Öşür, tarım ürünlerinden alınan bir zekât türü olup genellikle ürünün onda biri veya yirmide biri oranında verilir." },
  { question:"'Fitre' (fıtır sadakası) miktarı neye göre belirlenir?", options:["Bir kişinin günlük temel gıda ihtiyacına göre","Sabit bir altın miktarına göre her zaman","Kişinin toplam servetine göre","Rastgele bir miktara göre"], correctIndex:0, hint:"Genellikle buğday veya un üzerinden hesaplanır.", explanation:"Fitre miktarı, geleneksel olarak bir kişinin günlük temel gıda (buğday, arpa gibi) ihtiyacı esas alınarak belirlenir." },
  { question:"İslam'da 'hac ibadetinin farz olma şartlarından biri' hangisidir?", options:["Yolculuğu güvenle yapabilecek beden ve mali güce sahip olmak (istitaat)","Sadece belirli bir yaşta olmak","Sadece evli olmak","Sadece belirli bir ülkede yaşamak"], correctIndex:0, hint:"'İstitaat' kavramı bu şartı ifade eder.", explanation:"Hac, yolculuğu güvenle yapabilecek beden ve mali güce (istitaat) sahip olan Müslümanlara farzdır." },
  { question:"'Umre' ibadetinin hükmü hangi mezheplere göre değişebilir?", options:["Bazı mezheplere göre farz, bazılarına göre sünnettir","Tüm mezheplere göre kesinlikle farzdır","Tüm mezheplere göre haramdır","Hiçbir mezhepte hükmü yoktur"], correctIndex:0, hint:"Mezhepler arasında küçük yorum farkları olabilir.", explanation:"Umre'nin hükmü konusunda mezhepler arasında farklı görüşler bulunur; bazı mezhepler farz, bazıları müekked sünnet olarak kabul eder." },
  { question:"İslam'da 'ihramın yasakları' arasında hangisi yer alır?", options:["Dikişli elbise giymek (erkekler için) ve avlanmak","Su içmek","Konuşmak","Nefes almak"], correctIndex:0, hint:"Hac veya umre sırasında geçerlidir.", explanation:"İhram halindeyken erkeklerin dikişli elbise giymesi ve av yapmak gibi bazı davranışlar yasaktır." },
  { question:"'Kurban edilecek hayvanların' sahip olması gereken temel şartlardan biri nedir?", options:["Belirli bir yaşa ulaşmış ve sağlıklı olması","Sadece büyük olması","Sadece pahalı olması","Sadece belirli bir renkte olması"], correctIndex:0, hint:"Kusurlu veya hasta hayvanlar kurban edilemez.", explanation:"Kurban edilecek hayvanların belirli bir yaşa ulaşmış, sağlıklı ve önemli bir kusuru olmayan hayvanlar olması gerekir." },
  { question:"İslam'da 'kurban etinin dağıtımı' konusunda genel öneri nedir?", options:["Bir kısmının ihtiyaç sahiplerine, bir kısmının akraba ve komşulara, bir kısmının da eve ayrılması","Tamamının satılması","Tamamının sahibine kalması","Tamamının israf edilmesi"], correctIndex:0, hint:"Paylaşım ve dayanışma amaçlanır.", explanation:"Kurban etinin bir kısmının ihtiyaç sahiplerine, bir kısmının akraba-komşulara, bir kısmının da kurban sahibine ayrılması yaygın bir öneridir." },
  { question:"'Akika kurbanı' ne için kesilir?", options:["Yeni doğan çocuk için şükür amacıyla","Bir hastalıktan kurtulma için","Bir yolculuk öncesi","Bir evlilik için"], correctIndex:0, hint:"Doğumun ardından sünnet olarak kesilir.", explanation:"Akika kurbanı, yeni doğan bir çocuk için şükür amacıyla kesilen bir kurban türüdür." },
  { question:"İslam'da 'adak kurbanı' ile 'akika kurbanı' arasındaki fark nedir?", options:["Adak, bir dileğin gerçekleşmesi karşılığında; akika ise doğumda kesilir","İkisi aynı anlama gelir","Adak sadece hacda kesilir","Akika sadece Ramazan'da kesilir"], correctIndex:0, hint:"İkisi de farklı vesilelerle kesilen kurban türleridir.", explanation:"Adak kurbanı, bir dileğin gerçekleşmesi karşılığında adanan kurbandır; akika ise çocuğun doğumu vesilesiyle kesilir." },
  { question:"'Kur'an-ı Kerim'de geçen 'infak eden erkek ve kadınların' eşit şekilde mükafatlandırılacağı fikri hangi surede belirgindir?", options:["Ahzab Suresi","Kevser Suresi","İhlas Suresi","Nasr Suresi"], correctIndex:0, hint:"Bu surede erkek ve kadın müminlerin özellikleri birlikte sayılır.", explanation:"Ahzab Suresi'nde, iman eden, itaat eden, sadaka veren erkek ve kadınların Allah katında eşit şekilde mükafatlandırılacağı belirtilir." },
  { question:"İslam'da 'kadınların mescitlere gitmesinin' hükmü hakkında genel görüş nedir?", options:["Engellenmemesi gerektiği yönünde rivayetler bulunur","Kesinlikle yasaktır","Zorunludur","Hiç değinilmemiştir"], correctIndex:0, hint:"'Allah'ın kadın kullarını mescitlerden men etmeyin' mealinde bir hadis vardır.", explanation:"Hadislerde, kadınların mescitlere gitmesinin engellenmemesi gerektiğine dair rivayetler bulunmaktadır." },
  { question:"'Kur'an-ı Kerim'de 'kadınların şahitliği' konusunda Bakara Suresi'nde geçen hüküm hangi bağlamdadır?", options:["Borç senetlerinin yazımı ve şahitliğiyle ilgili özel bir hukuki bağlamda","Genel olarak her konuda","Sadece miras konusunda","Sadece ceza hukukunda"], correctIndex:0, hint:"Bu hüküm belirli bir hukuki işlem bağlamında değerlendirilir.", explanation:"Bakara Suresi'ndeki ilgili ayet, özellikle borç senetlerinin yazımı gibi belirli bir hukuki işlem bağlamında şahitlikle ilgilidir." },
  { question:"İslam'da 'nikahta kadının rızasının' önemi hangi ilkeyle vurgulanır?", options:["Zorla evlendirmenin caiz olmadığı","Kadının görüşünün önemsiz olduğu","Sadece velinin kararının geçerli olduğu","Bu konuya değinilmediği"], correctIndex:0, hint:"Hadislerde bu konuda açık uyarılar bulunur.", explanation:"İslam hukukunda, kadının rızası olmadan zorla evlendirilmesinin caiz olmadığına dair hadisler bulunmaktadır." },
];


const genelKulturBatch12 = [
  { question:"'Ses hızı' havada saniyede yaklaşık kaç metredir?", options:["100 m/s","343 m/s","1000 m/s","3000 m/s"], correctIndex:1, hint:"Deniz seviyesinde, oda sıcaklığında geçerli bir değerdir.", explanation:"Sesin havadaki hızı, deniz seviyesinde ve oda sıcaklığında yaklaşık 343 metre/saniyedir." },
  { question:"Dünyanın en büyük ikinci en kalabalık dil grubunu oluşturan İspanyolca en çok hangi kıtada konuşulur?", options:["Güney Amerika","Avrupa (sadece)","Asya","Afrika"], correctIndex:0, hint:"Birçok Güney Amerika ülkesinin resmi dilidir.", explanation:"İspanyolca, İspanya'nın yanı sıra Güney Amerika'daki birçok ülkede yaygın olarak konuşulan bir dildir." },
  { question:"'Türk Kurtuluş Savaşı'nda kullanılan 'Kılıç Ali' gibi lakaplı kumandanlardan biri kimdir (Cumhuriyet sonrası soyadıdır)?", options:["Kılıç Ali Bey, milli mücadelede önemli görevler üstlenmiştir","Hiçbir önemi yoktur","Sadece bir yazar olarak bilinir","Bir ressamdır"], correctIndex:0, hint:"Latife Hanım'ın da akrabasıdır.", explanation:"Kılıç Ali, Kurtuluş Savaşı'nda ve sonrasında önemli görevler üstlenen bir asker ve siyasetçidir." },
  { question:"İnsan vücudunda 'kolesterol' kavramı hakkında genel bilgi olarak ne söylenebilir?", options:["Hem faydalı hem zararlı türleri vardır (HDL ve LDL)","Tamamen zararlıdır","Tamamen faydalıdır","Vücutta hiç bulunmaz"], correctIndex:0, hint:"HDL 'iyi', LDL 'kötü' kolesterol olarak bilinir.", explanation:"Kolesterolün HDL (iyi) ve LDL (kötü) olmak üzere farklı türleri vardır; dengeli seviyelerde bulunması sağlık için önemlidir." },
  { question:"'Türkiye'de Cumhuriyet döneminde açılan ilk kız öğretmen okullarından biri hangi şehirdedir?", options:["İstanbul","Ankara","İzmir","Bursa"], correctIndex:0, hint:"Osmanlı'dan devralınan eğitim kurumlarından biridir.", explanation:"İstanbul, Cumhuriyet döneminde de kız öğretmen okullarının bulunduğu önemli eğitim merkezlerinden biriydi." },
  { question:"Dünyanın en büyük ikinci en yüksek gelgit farkına sahip bölgesi hangisidir?", options:["Fundy Körfezi (Kanada)","Akdeniz","Karadeniz","Hazar Denizi"], correctIndex:0, hint:"Kanada'dadır, dünyanın en yüksek gelgitleriyle bilinir.", explanation:"Fundy Körfezi, dünyanın en yüksek gelgit farklarından birine sahip bölgelerden biridir." },
  { question:"'Türk edebiyatında' Reşat Nuri Güntekin en çok hangi eseriyle tanınır?", options:["Çalıkuşu","İnce Memed","Aşk-ı Memnu","Kürk Mantolu Madonna"], correctIndex:0, hint:"Feride adlı bir öğretmenin hikayesini anlatır.", explanation:"Reşat Nuri Güntekin, 'Çalıkuşu' romanıyla Türk edebiyatının en tanınan yazarlarından biridir." },
  { question:"İnsan vücudunda 'kas türlerinden' hangisi istemsiz çalışır?", options:["Düz kaslar (iç organlarda)","İskelet kasları","Sadece kol kasları","Sadece bacak kasları"], correctIndex:0, hint:"Bağırsak hareketleri bu kas türüyle gerçekleşir.", explanation:"Düz kaslar, iç organlarda bulunan ve bilinçli kontrol dışında, istemsiz olarak çalışan kas türüdür." },
  { question:"'Halide Edip Adıvar' hangi eseriyle en çok tanınır?", options:["Sinekli Bakkal","Çalıkuşu","İnce Memed","Kürk Mantolu Madonna"], correctIndex:0, hint:"Osmanlı'nın son dönemini konu alan bir romanıdır.", explanation:"Halide Edip Adıvar, 'Sinekli Bakkal' romanı başta olmak üzere birçok önemli eseriyle tanınan bir Türk yazardır." },
  { question:"Dünyanın en büyük ikinci en yüksek volkanik patlama olayı (kayıtlı tarihte) hangisidir?", options:["Tambora Yanardağı","Krakatoa","Vezüv","Etna"], correctIndex:0, hint:"1815'te Endonezya'da gerçekleşmiştir.", explanation:"Tambora Yanardağı'nın 1815'teki patlaması, kayıtlı tarihteki en büyük volkanik patlamalardan biri olarak kabul edilir." },
  { question:"'Sabahattin Ali' hangi eseriyle en çok tanınır?", options:["Kürk Mantolu Madonna","Çalıkuşu","İnce Memed","Sinekli Bakkal"], correctIndex:0, hint:"Bir aşk hikayesini anlatan, sonradan büyük ilgi gören bir romandır.", explanation:"Sabahattin Ali, 'Kürk Mantolu Madonna' romanıyla özellikle son yıllarda büyük ilgi gören bir Türk yazardır." },
  { question:"İnsan vücudunda 'göz merceğinin şeklini değiştirerek odaklanmayı sağlayan' kas hangisidir?", options:["Silier kas","Göz kapağı kası","Boyun kası","Çene kası"], correctIndex:0, hint:"Yakın ve uzak nesnelere odaklanmayı sağlar.", explanation:"Silier kas, göz merceğinin şeklini değiştirerek yakın ve uzak nesnelere odaklanmayı sağlayan bir kastır." },
  { question:"'Yaşar Kemal' dışında Çukurova'yı konu alan eserleriyle bilinen başka bir yazar var mıdır?", options:["Orhan Kemal de bu bölgeyi işleyen eserler yazmıştır","Hiçbir başka yazar yoktur","Sadece şiir yazarları vardır","Bu bölge hiç işlenmemiştir"], correctIndex:0, hint:"Toplumcu gerçekçi bir yazardır.", explanation:"Orhan Kemal, Yaşar Kemal gibi Çukurova ve işçi sınıfı yaşamını konu alan eserler yazan önemli bir Türk yazardır." },
  { question:"Dünyanın en büyük ikinci en yüksek şelale kompleksi olan Iguazu Şelaleleri hangi ülkeler arasındadır?", options:["Brezilya-Arjantin","Şili-Peru","Kolombiya-Venezuela","Bolivya-Paraguay"], correctIndex:0, hint:"Güney Amerika'da, iki ülke sınırındadır.", explanation:"Iguazu Şelaleleri, Brezilya ile Arjantin sınırında yer alan büyük bir şelale kompleksidir." },
  { question:"'Aziz Nesin' Türk edebiyatında en çok hangi türle tanınır?", options:["Mizah (hiciv, hikaye)","Sadece şiir","Sadece tiyatro","Sadece roman"], correctIndex:0, hint:"Toplumsal eleştiri içeren mizahi hikayeleriyle bilinir.", explanation:"Aziz Nesin, mizah ve hiciv türünde yazdığı hikayelerle tanınan önemli bir Türk yazardır." },
];


async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question || '').trim().toLowerCase()));
  console.log('Firestore\'da zaten var olan soru sayısı:', existingTexts.size);

  const allNew = [
    ...islamiBatch11.map(q => Object.assign({category:'islami'}, q)),
    ...genelKulturBatch12.map(q => Object.assign({category:'genel_kultur'}, q)),
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
    batch.set(ref, Object.assign({ createdAt: Date.now(), createdBy: 'seed-script-15' }, q));
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
