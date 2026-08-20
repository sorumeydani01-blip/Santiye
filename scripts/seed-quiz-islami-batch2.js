// İslami Bilgiler soru havuzunu genişletir (peygamber kıssaları, ahlak, tarih
// ve daha az işlenmiş konulara odaklı 2. parti, 48 yeni soru).
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

const islamiBatch2 = [
  { question:"Hz. Nuh'un (a.s.) kavmine gönderdiği en temel çağrı neydi?", options:["Zekât vermek","Sadece Allah'a ibadet etmek, putlardan vazgeçmek","Savaşmayı bırakmak","Göç etmek"], correctIndex:1, hint:"Tüm peygamberlerin ortak mesajıdır.", explanation:"Hz. Nuh, kavmini putperestlikten vazgeçip yalnızca Allah'a ibadet etmeye çağırmıştır." },
  { question:"Hz. Yusuf (a.s.) kıssası Kur'an-ı Kerim'in hangi suresinde ayrıntılı olarak anlatılır?", options:["Yusuf Suresi","Nur Suresi","Kehf Suresi","Meryem Suresi"], correctIndex:0, hint:"Sure adı doğrudan peygamberin adını taşır.", explanation:"Hz. Yusuf'un hayatı, Kur'an'da adını taşıyan Yusuf Suresi'nde bütünüyle anlatılır." },
  { question:"Hz. Musa'nın (a.s.) asasıyla ilgili bilinen mucizelerden biri nedir?", options:["Yılana dönüşmesi","Ateşe dönüşmesi","Kuşa dönüşmesi","Taşa dönüşmesi"], correctIndex:0, hint:"Firavun'un sihirbazlarına karşı gösterilen bir mucizedir.", explanation:"Hz. Musa'nın asası, Allah'ın izniyle yılana dönüşen mucizelerden biri olarak bilinir." },
  { question:"Hz. Süleyman'ın (a.s.) hangi özelliğiyle de bilindiği Kur'an'da geçer?", options:["Hayvanların dilini anlaması","Denizde yürümesi","Ateşte yanmaması","Gökyüzüne çıkması"], correctIndex:0, hint:"Karınca ve hüdhüd kuşuyla ilgili kıssalar bilinir.", explanation:"Kur'an'da Hz. Süleyman'a kuşların ve diğer canlıların dilinin öğretildiği belirtilir." },
  { question:"'Ashab-ı Kehf' kıssası neyle ilgilidir?", options:["Mağarada uzun süre uyuyan gençlerle","Denizde boğulan bir kavimle","Çölde kaybolan bir kervanla","Dağda yaşayan bir kabile ile"], correctIndex:0, hint:"Kehf Suresi'nde anlatılır.", explanation:"Ashab-ı Kehf, imanlarını korumak için bir mağaraya sığınan ve Allah'ın onları uzun süre uyuttuğu gençlerin kıssasıdır." },
  { question:"İslam'da 'Sahabe' terimi kimleri ifade eder?", options:["Hz. Muhammed'i gören ve iman eden Müslümanları","Sadece Mekkeli Müslümanları","Sadece Medineli Müslümanları","Peygamberlerin çocuklarını"], correctIndex:0, hint:"'Arkadaş, yoldaş' anlamına gelir.", explanation:"Sahabe, Hz. Muhammed'i (s.a.v.) görmüş, ona iman etmiş ve Müslüman olarak vefat etmiş kişilere denir." },
  { question:"Dört Halife Dönemi'nde ilk halife kimdir?", options:["Hz. Ömer","Hz. Ebu Bekir","Hz. Osman","Hz. Ali"], correctIndex:1, hint:"'Sıddîk' lakabıyla bilinir.", explanation:"Hz. Ebu Bekir (r.a.), Hz. Muhammed'in vefatından sonra Müslümanların ilk halifesi olmuştur." },
  { question:"'Ezher Üniversitesi' hangi ülkede bulunan tarihi bir İslami ilim merkezidir?", options:["Suudi Arabistan","Mısır","Türkiye","Fas"], correctIndex:1, hint:"Kahire şehrindedir.", explanation:"Ezher (El-Ezher) Üniversitesi, Mısır'ın Kahire şehrinde bulunan tarihi bir İslami ilim merkezidir." },
  { question:"İslam'da 'infak' kavramı ne anlama gelir?", options:["Namaz kılmak","Allah rızası için mal harcamak, yardımda bulunmak","Oruç tutmak","Hacca gitmek"], correctIndex:1, hint:"Zekât ve sadakayı da kapsayan geniş bir kavramdır.", explanation:"İnfak, kişinin malından Allah rızası için başkalarına yardım amacıyla harcama yapmasıdır." },
  { question:"'Tevbe' kavramı İslam'da ne ifade eder?", options:["Günahtan pişman olup Allah'a dönmek","Sadece dua etmek","Kurban kesmek","Oruç tutmak"], correctIndex:0, hint:"Kişinin hatasından vazgeçip Allah'a yönelmesidir.", explanation:"Tevbe, işlenen bir günahtan pişmanlık duyup Allah'a yönelerek bağışlanma dilemektir." },
  { question:"Kur'an-ı Kerim'de adı geçen ve büyük bir tufanla cezalandırılan kavim hangi peygamberin kavmidir?", options:["Hz. Nuh'un kavmi","Hz. Lut'un kavmi","Hz. Salih'in kavmi","Hz. Şuayb'ın kavmi"], correctIndex:0, hint:"Gemi inşa eden peygamberdir.", explanation:"Hz. Nuh'un kavmi, ona inanmadıkları için büyük bir tufanla cezalandırılmıştır." },
  { question:"'Ashabu'l-Uhdud' kıssası neyi anlatır?", options:["İnananların ateş çukurunda yakılmasını","Bir savaşı","Bir hicreti","Bir ticaret yolculuğunu"], correctIndex:0, hint:"Buruc Suresi'nde geçer.", explanation:"Ashabu'l-Uhdud kıssası, imanlarından dönmeyen inananların bir hükümdar tarafından ateş çukurunda yakılmasını anlatır." },
  { question:"İslam'da 'helal' kelimesi ne anlama gelir?", options:["Yasak olan","Dinen izin verilen, caiz olan","Sadece yemekle ilgili bir terim","Günah olan"], correctIndex:1, hint:"'Haram'ın karşıtıdır.", explanation:"Helal, İslam'a göre yapılmasına veya kullanılmasına izin verilen şey anlamına gelir." },
  { question:"'Kelime-i Tevhid' hangi ifadeyi kapsar?", options:["Elhamdülillah","Lâ ilâhe illallah Muhammedün Rasûlullah","Sübhanallah","Allahu Ekber"], correctIndex:1, hint:"Allah'ın birliğini ve Hz. Muhammed'in peygamberliğini ifade eder.", explanation:"Kelime-i Tevhid, 'Allah'tan başka ilah yoktur, Muhammed O'nun elçisidir' anlamına gelen temel iman ifadesidir." },
  { question:"Hz. Peygamber'in (s.a.v.) doğduğu ay hangisidir (Hicri takvime göre)?", options:["Muharrem","Rebiülevvel","Ramazan","Zilhicce"], correctIndex:1, hint:"Mevlid Kandili bu ayda kutlanır.", explanation:"Hz. Muhammed'in (s.a.v.), Hicri takvime göre Rebiülevvel ayında doğduğu kabul edilir." },
  { question:"'Sabır' kavramı İslam ahlakında nasıl tanımlanır?", options:["Sıkıntı ve zorluklara katlanıp Allah'a güvenmek","Hiç konuşmamak","Her isteği hemen yerine getirmek","Kızgınlığı belli etmek"], correctIndex:0, hint:"Zorluklarda dayanma ve teslimiyet erdemidir.", explanation:"Sabır, karşılaşılan zorluk ve sıkıntılara Allah'a güvenerek, isyan etmeden katlanmaktır." },
  { question:"İslam'da namazın farz kılındığı gece hangisidir?", options:["Miraç Gecesi","Kadir Gecesi","Berat Gecesi","Regaip Gecesi"], correctIndex:0, hint:"Hz. Peygamber'in göğe yükseldiği gecedir.", explanation:"Beş vakit namaz, Miraç Gecesi'nde Allah tarafından farz kılınmıştır." },
  { question:"'Kur'an-ı Kerim'i ezbere bilen kişiye ne denir?", options:["Müezzin","Hafız","İmam","Vaiz"], correctIndex:1, hint:"Kur'an'ın tamamını ezberlemiş kişidir.", explanation:"Kur'an-ı Kerim'in tamamını ezbere bilen kişiye 'hafız' denir." },
  { question:"'Adak' (nezir) kavramı İslam'da neyi ifade eder?", options:["Bir dileğin gerçekleşmesi durumunda yapılmayı vaat edilen ibadeti","Zorunlu bir vergiyi","Günlük bir duayı","Cuma namazını"], correctIndex:0, hint:"Kişi kendi isteğiyle üzerine borç kılar.", explanation:"Adak (nezir), kişinin bir dileğinin gerçekleşmesi halinde belirli bir ibadeti yerine getireceğine dair kendi kendine söz vermesidir." },
  { question:"'Kıyamet günü' için Kur'an'da kullanılan isimlerden biri hangisidir?", options:["Yevmü'l-Kıyame","Leyletü'l-Kadir","Yevmü'l-Cuma","Leyletü'l-Mirac"], correctIndex:0, hint:"'Kıyamet Günü' anlamına gelen Arapça ifadedir.", explanation:"Yevmü'l-Kıyame, Kur'an'da kıyamet gününü ifade eden isimlerden biridir." },
  { question:"İslam'da bir Müslümanın diğer Müslüman kardeşine karşı en temel haklarından biri nedir?", options:["Selamını almak","Malını almak","Onu kınamak","Sırt çevirmek"], correctIndex:0, hint:"Karşılaşınca verilen bir görevdir.", explanation:"Bir Müslümanın diğer Müslüman üzerindeki haklarından biri, selam verildiğinde onu almaktır." },
  { question:"'Kurân-ı Kerim'in toplanıp kitap haline getirilmesine ne ad verilir?", options:["Tefsir","Cem-i Kur'an","Tecvid","Kıraat"], correctIndex:1, hint:"'Toplama' anlamına gelen bir terimdir.", explanation:"Kur'an ayetlerinin bir araya getirilip mushaf haline getirilmesi sürecine 'Cem-i Kur'an' denir." },
  { question:"'Zemzem suyu' nerede bulunur?", options:["Medine'de","Mekke'de, Kâbe yakınında","Kudüs'te","Şam'da"], correctIndex:1, hint:"Hz. İsmail ile ilgili bir kıssaya dayanır.", explanation:"Zemzem kuyusu, Mekke'de Kâbe'nin yakınında bulunur ve hac/umre ziyaretçileri tarafından içilir." },
  { question:"İslam'da 'takva' kavramı en genel anlamıyla ne demektir?", options:["Allah'tan korkup emirlerine uyma bilinci","Sadece oruç tutmak","Zengin olmak","Seyahat etmek"], correctIndex:0, hint:"Kişinin Allah'a karşı sorumluluk bilincidir.", explanation:"Takva, kişinin Allah'ın emir ve yasaklarına uyma konusunda gösterdiği bilinç ve duyarlılıktır." },
  { question:"'Sıla-i Rahim' ne anlama gelir?", options:["Akraba ziyaretini ve ilişkisini sürdürmek","Kurban kesmek","Zekât vermek","Namaz kılmak"], correctIndex:0, hint:"Akrabalık bağlarını koruma erdemidir.", explanation:"Sıla-i Rahim, akrabalarla ilişkiyi kesmeyip onları ziyaret etmek ve gözetmek anlamına gelir." },
  { question:"İslam tarihinde 'Hulefa-i Raşidin' dönemi kaç halifeyi kapsar?", options:["2","3","4","5"], correctIndex:2, hint:"Hz. Ebu Bekir'den Hz. Ali'ye kadar olan dönemi kapsar.", explanation:"Hulefa-i Raşidin (Dört Halife) dönemi, Hz. Ebu Bekir, Hz. Ömer, Hz. Osman ve Hz. Ali'yi kapsayan dört halifelik dönemidir." },
  { question:"'Şükür' kavramı İslam'da nasıl tanımlanır?", options:["Allah'ın nimetlerine karşı minnettarlık duyup bunu dile getirmek","Sadece dua etmek","Sabırlı olmak","Oruç tutmak"], correctIndex:0, hint:"Nimetlere karşı gösterilen bir tavırdır.", explanation:"Şükür, Allah'ın verdiği nimetlerin farkında olup bunlara karşı minnettarlık göstermektir." },
  { question:"Hz. Âdem (a.s.) ile ilgili Kur'an'da anlatılan olaylardan biri nedir?", options:["Cennetten yeryüzüne indirilmesi","Kızıldeniz'i yarması","Balığın karnında kalması","Ateşte yanmaması"], correctIndex:0, hint:"İlk insan ve ilk peygamber kabul edilir.", explanation:"Kur'an'da Hz. Âdem'in cennette yasak meyveden yemesi ve bunun ardından yeryüzüne indirilmesi anlatılır." },
  { question:"'Kelime-i Şehadet'i söyleyerek İslam'a giren kişiye ne ad verilir?", options:["Sahabe","Mühtedi","Hafız","Müezzin"], correctIndex:1, hint:"'Hidayete eren' anlamına gelir.", explanation:"Sonradan Müslüman olan kişiye 'mühtedi' denir." },
  { question:"İslam'da beş vakit namazdan hangisi güneş doğmadan önce kılınır?", options:["Öğle","İkindi","Sabah","Yatsı"], correctIndex:2, hint:"Günün ilk namaz vaktidir.", explanation:"Sabah namazı, güneş doğmadan önce, tan yerinin ağarmasıyla kılınan namaz vaktidir." },
  { question:"'Hicaz' bölgesi günümüzde hangi ülke sınırları içindedir?", options:["Ürdün","Suudi Arabistan","Mısır","Yemen"], correctIndex:1, hint:"Mekke ve Medine bu bölgededir.", explanation:"Hicaz bölgesi, Mekke ve Medine'yi içine alan, günümüzde Suudi Arabistan sınırları içinde yer alan tarihi bir bölgedir." },
  { question:"'Cami' kelimesinin sözlük anlamı nedir?", options:["Toplayan, bir araya getiren","Yükselen","Aydınlatan","Koruyan"], correctIndex:0, hint:"Cemaati bir araya getiren yer olmasıyla ilişkilidir.", explanation:"Cami kelimesi, Arapça'da 'toplayan, bir araya getiren' anlamına gelir; cemaati bir araya getirdiği için bu isim verilmiştir." },
  { question:"İslam'da 'oruç bozan şeylerden' biri hangisidir?", options:["Uyumak","Kasıtlı olarak yemek içmek","Konuşmak","Yürümek"], correctIndex:1, hint:"İrade dışı değil, bilerek yapılan bir eylemdir.", explanation:"Kasıtlı olarak yemek veya içmek, orucu bozan temel durumlardan biridir." },
  { question:"'Ashab-ı Suffe' kimlerdi?", options:["Zengin tüccarlar","Mescid-i Nebevi yanında ilim öğrenen fakir sahabiler","Mekke'nin yöneticileri","Yahudi kabileler"], correctIndex:1, hint:"Barınacak yeri olmayan, ilimle meşgul olan sahabelerdi.", explanation:"Ashab-ı Suffe, Medine'de Mescid-i Nebevi'nin yanında kalıp ilimle meşgul olan, çoğunlukla maddi imkânı kısıtlı sahabelerdi." },
  { question:"'İhlas' kavramı İslam'da en genel anlamıyla neyi ifade eder?", options:["İbadet ve amelleri sadece Allah rızası için yapmak","Sadece dua etmeyi","Zengin olmayı","Seyahat etmeyi"], correctIndex:0, hint:"Aynı zamanda kısa bir Kur'an suresinin de adıdır.", explanation:"İhlas, yapılan ibadet ve iyiliklerin gösteriş amacı olmadan yalnızca Allah rızası için yapılmasıdır." },
  { question:"'Sünnetullah' kavramı ne anlama gelir?", options:["Allah'ın evrende koyduğu değişmez kanunlar","Sadece namaz kuralları","Bir hadis çeşidi","Bir dua şekli"], correctIndex:0, hint:"Doğa kanunlarını da kapsayan geniş bir kavramdır.", explanation:"Sünnetullah, Allah'ın evrende ve toplumlarda koyduğu, değişmeyen ilahi kanun ve düzenlere denir." },
  { question:"'Zikir' kavramı İslam'da ne anlama gelir?", options:["Allah'ı anmak, hatırlamak","Kur'an okumayı bırakmak","Namazı ertelemek","Oruç tutmamak"], correctIndex:0, hint:"Tesbih çekmek de bu kapsama girer.", explanation:"Zikir, dil ile veya kalp ile Allah'ı anmak, O'nu hatırlamak anlamına gelir." },
  { question:"'Ramazan' kelimesi hangi kökten gelmektedir?", options:["'Yakıcı sıcaklık' anlamına gelen bir kökten","'Soğuk' anlamına gelen bir kökten","'Yağmur' anlamına gelen bir kökten","'Karanlık' anlamına gelen bir kökten"], correctIndex:0, hint:"Günahların yakılıp arındırıldığına dair yorumlar da yapılmıştır.", explanation:"Ramazan kelimesinin, Arapça'da 'yakıcı sıcaklık' anlamına gelen bir kökten türediği kabul edilir." },
  { question:"'Kabe'yi ilk inşa eden kimdir (İslami rivayete göre)?", options:["Hz. Âdem","Hz. Nuh","Hz. İbrahim","Hz. Muhammed"], correctIndex:0, hint:"Sonradan Hz. İbrahim ile Hz. İsmail tarafından yeniden yükseltilmiştir.", explanation:"İslami rivayete göre Kâbe'nin temelleri Hz. Âdem tarafından atılmış, sonradan Hz. İbrahim ve oğlu Hz. İsmail tarafından yeniden inşa edilmiştir." },
  { question:"'Vahiy' kavramı ne anlama gelir?", options:["Allah'ın peygamberlerine bildirdiği mesaj","Bir dua şekli","Bir ibadet türü","Bir tarih dönemi"], correctIndex:0, hint:"Kur'an bu yolla indirilmiştir.", explanation:"Vahiy, Allah'ın peygamberlerine, genellikle bir melek aracılığıyla ilettiği ilahi mesajdır." },
  { question:"İslam'da 'kıyas' hangi alanla ilgili bir terimdir?", options:["Fıkıh usulü (İslam hukuku)","Tecvid","Tefsir usulü","Kelam"], correctIndex:0, hint:"Yeni bir meselenin, benzer bir hükme kıyaslanarak çözülmesidir.", explanation:"Kıyas, İslam hukukunda (fıkıh usulünde), hakkında açık hüküm bulunmayan bir meselenin, benzer bir meseleye kıyaslanarak hükme bağlanmasıdır." },
  { question:"'Berat Kandili' hangi ayda kutlanır?", options:["Muharrem","Şaban","Ramazan","Zilhicce"], correctIndex:1, hint:"Ramazan ayından bir önceki aydır.", explanation:"Berat Kandili, Hicri takvimin Şaban ayının 15. gecesinde kutlanır." },
  { question:"'Nikâh' İslam'da hangi anlama gelir?", options:["Evlilik akdi","Boşanma işlemi","Miras paylaşımı","Ticaret sözleşmesi"], correctIndex:0, hint:"Aile kurumunun temelidir.", explanation:"Nikâh, İslam hukukunda evlilik akdine, yani evliliğin dini ve hukuki bağlanmasına verilen isimdir." },
  { question:"'Kurban' kelimesinin sözlük anlamı nedir?", options:["Yaklaşmak, Allah'a yakınlaşmak","Uzaklaşmak","Paylaşmak","Beklemek"], correctIndex:0, hint:"Kişiyi Allah'a manen yaklaştıran bir ibadettir.", explanation:"Kurban kelimesi, sözlükte 'yaklaşmak' anlamına gelir; kişiyi Allah'a manevi olarak yaklaştıran bir ibadet olarak görülür." },
  { question:"'İslam' kelimesinin sözlük anlamı nedir?", options:["Barış, teslimiyet, esenlik","Savaş","Zenginlik","Bilgi"], correctIndex:0, hint:"Aynı kökten 'selam' kelimesi de gelir.", explanation:"İslam kelimesi sözlükte 'barış, teslimiyet, esenlik' anlamlarına gelir ve Allah'a teslim olmayı ifade eder." },
  { question:"'Muhacir' ve 'Ensar' kavramları hangi olayla ilgilidir?", options:["Hicret","Miraç","Bedir Savaşı","Hac"], correctIndex:0, hint:"Mekke'den göç edenler ve onları Medine'de karşılayanlar.", explanation:"Muhacirler Mekke'den Medine'ye göç eden Müslümanlar, Ensar ise onlara Medine'de yardım eden Müslümanlardır; bu ayrım Hicret olayıyla ilgilidir." },
  { question:"'Kur'an-ı Kerim'i usulüne uygun olarak yüzünden okumaya ne denir?", options:["Kıraat","Tefsir","Fıkıh","Kelam"], correctIndex:0, hint:"'Okuma' anlamına gelir.", explanation:"Kıraat, Kur'an-ı Kerim'in belirli kurallara (tecvide) uygun şekilde okunmasıdır." },
  { question:"İslam'da 'emrbil maruf nehyi anil münker' ilkesi neyi ifade eder?", options:["İyiliği emredip kötülükten sakındırmayı","Sadece namaz kılmayı","Zekât vermeyi","Hacca gitmeyi"], correctIndex:0, hint:"Toplumsal sorumluluk ilkesidir.", explanation:"Bu ilke, Müslümanların iyiliği teşvik edip kötülükten sakındırma sorumluluğunu ifade eder." },
];


async function main(){
  const existingSnap = await db.collection('quiz_questions').get();
  const existingTexts = new Set(existingSnap.docs.map(d => (d.data().question || '').trim().toLowerCase()));
  console.log('Firestore\'da zaten var olan soru sayısı:', existingTexts.size);

  const toAdd = islamiBatch2.filter(q => !existingTexts.has(q.question.trim().toLowerCase()));
  console.log('Eklenecek yeni soru sayısı:', toAdd.length, '(hazırlanan:', islamiBatch2.length, ')');

  if(toAdd.length === 0){
    console.log('Eklenecek yeni soru yok, hepsi zaten mevcut.');
    return;
  }

  const batch = db.batch();
  toAdd.forEach(q => {
    const ref = db.collection('quiz_questions').doc();
    batch.set(ref, Object.assign({ category: 'islami', createdAt: Date.now(), createdBy: 'seed-script-6' }, q));
  });
  await batch.commit();
  console.log(toAdd.length + ' soru başarıyla eklendi.');
}

main().then(()=>process.exit(0)).catch(e=>{ console.error('Hata:', e); process.exit(1); });
