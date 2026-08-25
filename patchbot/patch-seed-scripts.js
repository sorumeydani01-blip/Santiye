// ============================================================
// TÜM seed-*.js DOSYALARINA "ZATEN TAMAMLANDIYSA ATLA" MANTIĞI EKLE
// ============================================================
// Bu script, scripts/ klasöründeki her seed-*.js dosyasını okur ve şunu ekler:
//  1. Dosyanın başına: Firestore'da "bu script daha önce başarıyla tamamlandı mı?"
//     diye bakan bir kontrol — tamamlandıysa script hiçbir okuma/yazma yapmadan
//     hemen çıkar.
//  2. Dosyanın sonuna (başarıyla bittiğinde): "bu script tamamlandı" diye
//     işaretleyen bir yazma.
//
// Hangi dosyaya dokunduğunu/dokunamadığını (beklenen kalıp bulunamadıysa,
// dosyayı BOZMAMAK için atlar) ayrıntılı olarak loglar.
//
// ÇALIŞTIRMA: Elle tetiklenir (.github/workflows/patch-seed-scripts.yml
// üzerinden, GitHub Actions → "Run workflow"). Repo'ya OTOMATİK COMMIT yapar.
// ============================================================

const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = path.join(__dirname);

const CHECK_FN_SNIPPET = `
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
`;

function markDoneSnippet() {
  return `db.collection('app_config').doc('seedScriptStatus').set({ [require('path').basename(__filename)]: true }, { merge: true }).catch(()=>{})`;
}

const ANCHOR_INIT = /const db = admin\.firestore\(\);/;
const ANCHOR_END = /main\(\)\.then\(\s*\(\s*\)\s*=>\s*process\.exit\(0\)\s*\)/;

function patchFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf-8');

  if (original.includes('ZATEN TAMAMLANDIYSA ATLA (otomatik eklendi)')) {
    return { status: 'skipped', reason: 'zaten daha önce yamalanmış' };
  }
  if (!ANCHOR_INIT.test(original)) {
    return { status: 'failed', reason: '"const db = admin.firestore();" satırı bulunamadı — dosya yapısı farklı, elle bakılmalı' };
  }
  if (!ANCHOR_END.test(original)) {
    return { status: 'failed', reason: '"main().then(() => process.exit(0))" satırı bulunamadı — dosya yapısı farklı, elle bakılmalı' };
  }

  let patched = original.replace(ANCHOR_INIT, (m) => m + '\n' + CHECK_FN_SNIPPET);
  // ÖNEMLİ: Kontrol, asıl işlemin (main()) başlamasından ÖNCE ve GERÇEKTEN
  // BEKLENEREK (awaited) yapılıyor — böylece "zaten tamamlandıysa" hiçbir
  // gereksiz okuma/yazma başlamadan script anında çıkıyor.
  patched = patched.replace(ANCHOR_END, () =>
    `__checkAlreadySeeded().then(async (alreadyDone) => {
  const __scriptName = require('path').basename(__filename);
  if (alreadyDone) { console.log(\`\${__scriptName} zaten daha önce tamamlanmış, atlanıyor.\`); process.exit(0); return; }
  await main();
  await ${markDoneSnippet()};
  process.exit(0);
})`
  );

  fs.writeFileSync(filePath, patched, 'utf-8');
  return { status: 'patched' };
}

function main() {
  const allFiles = fs.readdirSync(SCRIPTS_DIR).filter(f => f.startsWith('seed-') && f.endsWith('.js'));
  console.log(`Bulunan seed script sayısı: ${allFiles.length}`);

  const results = { patched: [], skipped: [], failed: [] };
  allFiles.forEach(file => {
    const fullPath = path.join(SCRIPTS_DIR, file);
    const res = patchFile(fullPath);
    results[res.status].push({ file, reason: res.reason });
    const icon = res.status === 'patched' ? '✅' : res.status === 'skipped' ? '⏭️' : '❌';
    console.log(`${icon} ${file}${res.reason ? ' — ' + res.reason : ''}`);
  });

  console.log('\n--- ÖZET ---');
  console.log(`Yamalanan: ${results.patched.length}`);
  console.log(`Atlanan (zaten yamalıydı): ${results.skipped.length}`);
  console.log(`Başarısız (elle bakılmalı): ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log('\nBaşarısız olanlar:');
    results.failed.forEach(f => console.log(`  - ${f.file}: ${f.reason}`));
  }
}

main();
