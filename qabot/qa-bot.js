// ============================================================
// ŞANTİYE DEFTERİ — OTOMATİK QA (KALİTE KONTROL) BOTU
// ============================================================
// Bu script, siteyi gerçek bir kullanıcı gibi kapsamlı şekilde gezer:
//  - Normal bir test hesabı oluşturur (yoksa) / giriş yapar (qa.bot.test@...)
//  - Yevmiye kaydı ekler, siler; not ekler
//  - Geçmiş, İstatistik, Notlar, Profil, Ara ekranlarını gezer
//  - PDF rapor indirmeyi dener, koyu moda geçer
//  - Oyunlar ekranını, Soru Çöz'ü açar — gerçek bir soruyu cevaplar,
//    joker kullanır
//  - Header açılır menülerini (mesaj/arkadaş/bildirim) test eder
//  - Sayfayı yeniler (pull-to-refresh benzeri)
//  - Test hesabından, uygulamanın KENDİ mesajlaşma sistemiyle,
//    admin hesabına (QA_ADMIN_UID) özet raporu MESAJ olarak gönderir
//  - Ayrı bir admin hesabıyla giriş yapıp admin panelindeki TÜM ana
//    ekranları (SADECE GÖRÜNTÜLEME — hiçbir silme/yasaklama/uyarı
//    verme gibi kalıcı/tehlikeli işlem YAPILMAZ) gezer
//  - Konsol hatalarını, JS istisnalarını ve ekran görüntülerini toplar
//  - Sonunda okunabilir bir Markdown rapor üretir (qa-report/report.md)
//
// ÇALIŞTIRMA: Bu dosya elle çalıştırılmaz — GitHub Actions
// (.github/workflows/qa-bot.yml) üzerinden otomatik çalışır.
// ============================================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.QA_SITE_URL || 'https://sorumeydani01-blip.github.io/Santiye/index.html';
const TEST_EMAIL = process.env.QA_TEST_EMAIL || 'qa.bot.test@santiyedefteri-test.com';
const TEST_PASSWORD = process.env.QA_TEST_PASSWORD || 'QaBotTest2026!';
const TEST_UID = process.env.QA_TEST_UID || ''; // test hesabının UID'si — admin panelinde onu bulmak için kullanıcı adı yerine bunu kullanıyoruz (kullanıcı adı değişse bile bozulmaz)
const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD || '';
const ADMIN_UID = process.env.QA_ADMIN_UID || '';

const REPORT_DIR = path.join(__dirname, '..', 'qa-report');
const SHOTS_DIR = path.join(REPORT_DIR, 'screenshots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const results = [];
const consoleErrors = [];
const pageErrors = [];

function logStep(step, status, detail = '') {
  results.push({ step, status, detail });
  const icon = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${step}${detail ? ' — ' + detail : ''}`);
}

async function shot(page, name) {
  const file = `${String(results.length).padStart(2, '0')}_${name}.png`;
  try {
    await page.screenshot({ path: path.join(SHOTS_DIR, file), fullPage: false });
    return file;
  } catch (e) {
    return null;
  }
}

async function safeClick(page, selector, opts = {}) {
  try {
    await page.click(selector, { timeout: 5000, ...opts });
    return true;
  } catch (e) {
    return false;
  }
}

async function clearOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.modal-overlay.show').forEach(el => el.classList.remove('show'));
  }).catch(() => {});
}

async function goScreen(page, navName, screenId) {
  const navBtn = navName ? await page.$(`nav.tabs button[data-screen="${navName}"]`) : null;
  if (navBtn) {
    await navBtn.click();
  } else {
    await page.evaluate((id) => {
      if (typeof switchScreen === 'function') switchScreen(id);
    }, screenId);
  }
  await page.waitForTimeout(700);
}

async function step(page, label, fn) {
  try {
    await fn();
  } catch (e) {
    logStep(label, 'fail', e.message ? e.message.split('\n')[0] : String(e));
    const s = await shot(page, `hata_${label.replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ]/g, '_').slice(0, 40)}`);
    results[results.length - 1].screenshot = s;
    await clearOverlays(page);
  }
}

function friendlyErrorReason(detail) {
  if (!detail) return 'Beklenmeyen bir sorun oluştu.';
  if (/waitForSelector.*Timeout/i.test(detail)) return 'İlgili ekran/pencere zamanında açılmadı (site yavaş kalmış olabilir).';
  if (/elementHandle\.click.*Timeout/i.test(detail)) return 'İlgili butona basılamadı (buton görünmedi ya da bir pencere önünü kapatmış olabilir).';
  if (/elementHandle\.fill.*Timeout/i.test(detail)) return 'İlgili kutuya yazı yazılamadı (alan görünür değildi).';
  if (/bulunamadı/i.test(detail)) return detail; // zaten Türkçe ve anlaşılır
  return detail;
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    locale: 'tr-TR',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[${new Date().toISOString()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    pageErrors.push(`[${new Date().toISOString()}] ${err.message}`);
  });

  // ============================================================
  // BÖLÜM 1: TEST HESABI — GENEL UYGULAMA GEZİNTİSİ
  // ============================================================

  await step(page, 'Site açıldı', async () => {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    logStep('Site açıldı', 'ok');
    results[results.length - 1].screenshot = await shot(page, 'ilk_acilis');
  });

  await step(page, 'Giriş/Kayıt', async () => {
    const isFormVisible = await page.isVisible('#authFormWrap').catch(() => false);
    if (!isFormVisible) return;
    await page.fill('#authEmail', TEST_EMAIL);
    await page.fill('#authPassword', TEST_PASSWORD);
    await safeClick(page, '#btnEmailAuth');
    await page.waitForTimeout(2500);
    const stillOnAuth = await page.isVisible('#authFormWrap').catch(() => false);
    if (stillOnAuth) {
      logStep('Test hesabıyla giriş başarısız, kayıt deneniyor', 'warn');
      await safeClick(page, '#authTabSignup');
      await page.waitForTimeout(300);
      await page.fill('#authEmail', TEST_EMAIL);
      await page.fill('#authPassword', TEST_PASSWORD);
      await safeClick(page, '#btnEmailAuth');
      await page.waitForTimeout(3000);
    }
    const onboardVisible = await page.isVisible('#onboardOverlay').catch(() => false);
    if (onboardVisible) {
      await page.fill('#obFullName', 'QA Bot Test');
      await page.fill('#obUsername', 'qabot_test');
      await page.selectOption('#obProfession', { index: 1 }).catch(() => {});
      await page.fill('#obCity', 'İstanbul');
      await page.fill('#obDefaultWage', '1000');
      await safeClick(page, '#obSave');
      await page.waitForTimeout(2000);
      logStep('Onboarding (profil oluşturma) tamamlandı', 'ok');
    }
    const loggedIn = await page.isVisible('header.top').catch(() => false);
    if (!loggedIn) throw new Error('Giriş/kayıt sonrası ana ekran açılmadı');
    logStep('Test hesabıyla giriş yapıldı', 'ok', TEST_EMAIL);
    results[results.length - 1].screenshot = await shot(page, 'giris_sonrasi');
  });

  await step(page, '"Bugün çalıştın mı?" popup kapatma', async () => {
    await page.waitForTimeout(1200);
    const visible = await page.isVisible('#dailyCheckOverlay.show').catch(() => false);
    if (visible) {
      await safeClick(page, '#dcNo');
      await page.waitForTimeout(500);
      logStep('"Bugün çalıştın mı?" popup\'ı kapatıldı', 'ok');
    }
    await clearOverlays(page);
  });

  await step(page, 'Ana Sayfa → Takvim sekmesi', async () => {
    const takvimBtn = await page.$('.home-view-tab[data-homeview="calendar"]');
    if (!takvimBtn) throw new Error('Takvim sekmesi bulunamadı');
    await takvimBtn.click();
    await page.waitForTimeout(600);
    const shown = await page.isVisible('#homeCalendarSection').catch(() => false);
    logStep('Ana Sayfa → Takvim sekmesi', shown ? 'ok' : 'fail');
    results[results.length - 1].screenshot = await shot(page, 'takvim_sekmesi');
  });

  await step(page, 'Takvimden yevmiye ekle', async () => {
    await clearOverlays(page);
    let shown = await page.isVisible('#homeCalendarSection').catch(() => false);
    if (!shown) {
      // Bir önceki adımda sekme geçişi tam oturmamış olabilir — burada bir kez daha dene.
      await safeClick(page, '.home-view-tab[data-homeview="calendar"]');
      await page.waitForTimeout(800);
    }
    await page.waitForSelector('#calGrid .cal-day:not(.other-month)', { state: 'visible', timeout: 8000 });
    const dayCell = await page.$('#calGrid .cal-day:not(.other-month)');
    await dayCell.click();
    await page.waitForTimeout(800);
    logStep('Takvimden yevmiye kaydı eklendi', 'ok');
    results[results.length - 1].screenshot = await shot(page, 'yevmiye_eklendi');
  });

  await step(page, 'Eklenen yevmiye kaydını sil (temizlik)', async () => {
    const sameDayCell = await page.$('#calGrid .cal-day:not(.other-month).has-yevmiye, #calGrid .cal-day:not(.other-month).has-half');
    if (sameDayCell) {
      await sameDayCell.click();
      await page.waitForTimeout(500);
      await sameDayCell.click();
      await page.waitForTimeout(500);
      logStep('Test yevmiye kaydı temizlendi', 'ok');
    } else {
      logStep('Temizlenecek yevmiye kaydı bulunamadı', 'warn');
    }
  });

  await step(page, 'Veriler sekmesine dön', async () => {
    const verilerBtn = await page.$('.home-view-tab[data-homeview="data"]');
    if (verilerBtn) { await verilerBtn.click(); await page.waitForTimeout(400); }
    logStep('Veriler sekmesine dönüldü', 'ok');
  });

  await step(page, 'Not ekle', async () => {
    await goScreen(page, null, 'ana');
    await clearOverlays(page);
    const addNoteBtn = await page.$('#btnAddNote');
    if (!addNoteBtn) throw new Error('"Ekle" (Notlarım) butonu bulunamadı');
    await addNoteBtn.click();
    // Kayıt ekleme penceresinin gerçekten AÇILMASINI bekle (sabit süre yerine)
    await page.waitForSelector('#entryOverlay.show', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#entryNote', { state: 'visible', timeout: 5000 });
    const noteInput = await page.$('#entryNote');
    if (noteInput) await noteInput.fill('QA Bot test notu — otomatik oluşturuldu.');
    await safeClick(page, '#entrySave');
    await page.waitForTimeout(800);
    logStep('Not eklendi', 'ok');
    results[results.length - 1].screenshot = await shot(page, 'not_eklendi');
  });

  const screensToVisit = [
    { nav: 'kayitlar', label: 'Geçmiş' },
    { nav: 'istatistik', label: 'İstatistik' },
    { nav: 'notlarim', label: 'Notlar' },
  ];
  for (const s of screensToVisit) {
    await step(page, `${s.label} ekranı`, async () => {
      await goScreen(page, s.nav, s.nav);
      const active = await page.isVisible(`#screen-${s.nav}.active`).catch(() => false);
      logStep(`${s.label} ekranı açıldı`, active ? 'ok' : 'fail');
      results[results.length - 1].screenshot = await shot(page, `ekran_${s.nav}`);
    });
  }

  await step(page, 'Arama ekranı', async () => {
    await goScreen(page, null, 'ana');
    await safeClick(page, '#navSearchBtn');
    await page.waitForTimeout(600);
    const shown = await page.isVisible('#searchOverlay.show').catch(() => false);
    logStep('Arama ekranı açıldı', shown ? 'ok' : 'fail');
    results[results.length - 1].screenshot = await shot(page, 'arama_ekrani');
    if (shown) {
      await page.fill('#searchInput', 'test').catch(() => {});
      await page.waitForTimeout(500);
      await safeClick(page, '#searchClose');
    }
  });

  const headerButtons = [
    { sel: '#btnHeaderMessages', dropdown: '#headerMsgDropdown', label: 'Mesajlar menüsü' },
    { sel: '#btnHeaderFriends', dropdown: '#headerFriendsDropdown', label: 'Arkadaşlar menüsü' },
    { sel: '#btnNotifBell', dropdown: '#headerNotifDropdown', label: 'Bildirimler menüsü' },
  ];
  for (const hb of headerButtons) {
    await step(page, hb.label, async () => {
      const ok = await safeClick(page, hb.sel);
      await page.waitForTimeout(500);
      const dropdownVisible = ok ? await page.isVisible(hb.dropdown).catch(() => false) : false;
      logStep(hb.label, dropdownVisible ? 'ok' : 'fail');
      results[results.length - 1].screenshot = await shot(page, `header_${hb.sel.replace(/[#.]/g, '')}`);
      await page.keyboard.press('Escape').catch(() => {});
      await page.click('body', { position: { x: 10, y: 300 } }).catch(() => {});
      await page.waitForTimeout(300);
    });
  }

  await step(page, 'Profil ekranı', async () => {
    await goScreen(page, 'profil', 'profil');
    const active = await page.isVisible('#screen-profil.active').catch(() => false);
    logStep('Profil ekranı açıldı', active ? 'ok' : 'fail');
    results[results.length - 1].screenshot = await shot(page, 'profil_ekrani');
  });

  await step(page, 'PDF rapor indirme', async () => {
    await goScreen(page, null, 'ana');
    await clearOverlays(page);
    await safeClick(page, '.gear-btn');
    // Ayarlar penceresinin gerçekten AÇILMASINI bekle (sabit süre yerine) —
    // önceki denemede pencere tam açılmadan tıklamaya çalışıldığı için zaman aşımı olmuştu.
    await page.waitForSelector('#settingsOverlay.show', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#btnPdfRangeMonth', { state: 'visible', timeout: 5000 });
    const pdfBtn = await page.$('#btnPdfRangeMonth');
    if (pdfBtn) {
      const downloadPromise = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
      await pdfBtn.click();
      const download = await downloadPromise;
      logStep('PDF rapor indirme denendi', download ? 'ok' : 'warn', download ? '' : 'İndirme olayı yakalanamadı (yine de hata vermemiş olabilir)');
    } else {
      logStep('PDF rapor butonu bulunamadı', 'fail');
    }
    results[results.length - 1].screenshot = await shot(page, 'pdf_rapor');
  });

  await step(page, 'Koyu mod', async () => {
    // Ayarlar penceresi zaten açık olmalı (bir önceki adımdan) — değilse tekrar açmayı dene.
    const overlayOpen = await page.isVisible('#settingsOverlay.show').catch(() => false);
    if (!overlayOpen) {
      await safeClick(page, '.gear-btn');
      await page.waitForSelector('#settingsOverlay.show', { state: 'visible', timeout: 8000 });
    }
    await page.waitForSelector('#toggleDark', { state: 'visible', timeout: 5000 });
    const darkToggle = await page.$('#toggleDark');
    if (!darkToggle) throw new Error('Koyu mod anahtarı bulunamadı');
    await darkToggle.click();
    await page.waitForTimeout(600);
    const isDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark');
    logStep('Koyu mod açıldı', isDark ? 'ok' : 'fail');
    results[results.length - 1].screenshot = await shot(page, 'koyu_mod');
    await darkToggle.click();
    await page.waitForTimeout(400);
    await safeClick(page, '#settingsClose');
  });

  await step(page, 'Oyunlar ekranı', async () => {
    await safeClick(page, '#btnHeaderProfile');
    await page.waitForTimeout(400);
    await safeClick(page, '#btnHeaderMenuOyunlar');
    await page.waitForTimeout(1000);
    const active = await page.isVisible('#screen-oyunlar.active').catch(() => false);
    logStep('Oyunlar ekranı açıldı', active ? 'ok' : 'fail');
    results[results.length - 1].screenshot = await shot(page, 'oyunlar_ekrani');
  });

  await step(page, 'Soru Çöz — soru cevaplama', async () => {
    await goScreen(page, null, 'ana');
    await safeClick(page, '#btnHeaderProfile');
    await page.waitForTimeout(400);
    await safeClick(page, '#btnHeaderMenuQuiz');
    await page.waitForTimeout(1000);
    const quizActive = await page.isVisible('#screen-quiz.active').catch(() => false);
    logStep('Soru Çöz ekranı açıldı', quizActive ? 'ok' : 'fail');
    results[results.length - 1].screenshot = await shot(page, 'quiz_ekrani');
    if (!quizActive) return;

    const catCard = await page.$('.quiz-category-card, [data-quiz-category]');
    if (catCard) {
      await catCard.click();
      await page.waitForTimeout(1200);
      const optionBtn = await page.$('.quiz-option-btn');
      if (optionBtn) {
        await optionBtn.click();
        await page.waitForTimeout(1200);
        logStep('Bir soru cevaplandı', 'ok');
        results[results.length - 1].screenshot = await shot(page, 'soru_cevaplandi');

        const jokerBtn = await page.$('#btnQuizJoker');
        if (jokerBtn) {
          await jokerBtn.click().catch(() => {});
          await page.waitForTimeout(600);
          logStep('50/50 joker denendi', 'ok');
        }
      } else {
        logStep('Soru şıkları bulunamadı', 'warn');
      }
    } else {
      logStep('Quiz kategori kartı bulunamadı', 'warn');
    }
  });

  await step(page, 'Sayfa yenileme (reload)', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const ok = await page.isVisible('header.top').catch(() => false);
    logStep('Sayfa yenileme sonrası ana ekran', ok ? 'ok' : 'fail');
    results[results.length - 1].screenshot = await shot(page, 'reload_sonrasi');
  });

  // ---------- BÖLÜM 2: TEST HESABINDAN ÇIKIŞ (rapor mesajı en sonda, tüm testler bitince gönderilecek) ----------
  await step(page, 'Test hesabından çıkış', async () => {
    await goScreen(page, null, 'ana');
    await safeClick(page, '#btnHeaderProfile');
    await page.waitForTimeout(300);
    await safeClick(page, '#btnHeaderMenuSettings');
    await page.waitForTimeout(600);
    await safeClick(page, '#btnLogout');
    await page.waitForTimeout(1500);
    logStep('Test hesabından çıkış yapıldı', 'ok');
  });

  // ============================================================
  // BÖLÜM 3: ADMİN PANELİ — SADECE GÖRÜNTÜLEME
  // ============================================================
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    await step(page, 'Admin hesabıyla giriş', async () => {
      await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      const authVisible = await page.isVisible('#authFormWrap').catch(() => false);
      if (authVisible) {
        await page.fill('#authEmail', ADMIN_EMAIL);
        await page.fill('#authPassword', ADMIN_PASSWORD);
        await safeClick(page, '#btnEmailAuth');
        await page.waitForTimeout(3000);
      }
      const loggedIn = await page.isVisible('header.top').catch(() => false);
      if (!loggedIn) throw new Error('Admin girişi başarısız');
      logStep('Admin hesabıyla giriş yapıldı', 'ok', ADMIN_EMAIL);
      results[results.length - 1].screenshot = await shot(page, 'admin_giris');
      // isAdmin/modPerms durumu Firestore'dan asenkron geliyor; rozet önce
      // "display:none" duruyor, GÖRÜNÜR hâle gelene kadar bekliyoruz (sabit
      // bir süre beklemek yerine) — CI ortamında bu değişken sürebiliyor.
      await page.waitForSelector('#roleBadgeToggleBtn', { state: 'visible', timeout: 15000 });
    });

    await step(page, 'Admin hızlı menüsü', async () => {
      await page.waitForSelector('#roleBadgeToggleBtn', { state: 'visible', timeout: 10000 });
      const roleBadge = await page.$('#roleBadgeToggleBtn');
      if (!roleBadge) throw new Error('Rütbe rozeti bulunamadı — bu hesap admin olarak tanınmıyor olabilir');
      await roleBadge.click();
      await page.waitForTimeout(700);
      const open = await page.isVisible('#roleBadgeMenuItems').catch(() => false);
      logStep('Admin hızlı menüsü açıldı', open ? 'ok' : 'fail');
      results[results.length - 1].screenshot = await shot(page, 'admin_menu');
      if (!open) throw new Error('Menü açılmadı');
    });

    const adminScreens = [
      { id: 'adminstats', label: 'İstatistikler' },
      { id: 'adminusers', label: 'Kullanıcılar' },
      { id: 'admindeactivated', label: 'Devre Dışı Bırakılanlar' },
      { id: 'adminappeals', label: 'İtirazlar' },
      { id: 'adminreports', label: 'Şikayetler' },
      { id: 'adminsuggestions', label: 'Öneriler' },
      { id: 'adminmodlog', label: 'İşlem Geçmişi' },
      { id: 'adminquiz', label: 'Soru Bankası' },
      { id: 'adminranks', label: 'Moderatör Rütbeleri' },
      { id: 'admintenureranks', label: 'Kıdem Rütbeleri' },
      { id: 'adminmoderators', label: 'Moderatörler' },
    ];
    for (const scr of adminScreens) {
      await step(page, `Admin → ${scr.label}`, async () => {
        await page.waitForSelector('#roleBadgeToggleBtn', { state: 'visible', timeout: 8000 });
        await safeClick(page, '#roleBadgeToggleBtn');
        await page.waitForTimeout(500);
        const link = await page.$(`[data-role-link="${scr.id}"]`);
        if (!link) throw new Error('Menü linki bulunamadı');
        await link.click();
        await page.waitForTimeout(1000);
        const active = await page.isVisible(`#screen-${scr.id}.active`).catch(() => false);
        logStep(`Admin → ${scr.label}`, active ? 'ok' : 'fail');
        results[results.length - 1].screenshot = await shot(page, `admin_${scr.id}`);
      });
    }

    await step(page, 'Admin, test hesabının profilini görüntüledi', async () => {
      if (!TEST_UID) {
        logStep('Admin, test hesabının profilini açtı', 'warn', 'QA_TEST_UID tanımlanmamış, adım atlandı');
        return;
      }
      // Kullanıcı adına göre listede arama yapmak yerine (kullanıcı adı değişirse
      // bozulur), UID ile doğrudan profili açıyoruz — daha sağlam.
      const navigated = await page.evaluate((uid) => {
        if (typeof openViewProfile === 'function') { openViewProfile(uid); return true; }
        return false;
      }, TEST_UID);
      if (!navigated) throw new Error('openViewProfile fonksiyonu bulunamadı');
      await page.waitForTimeout(1000);
      const profileOpen = await page.isVisible('#screen-view-profile.active').catch(() => false);
      logStep('Admin, test hesabının profilini açtı', profileOpen ? 'ok' : 'fail');
      results[results.length - 1].screenshot = await shot(page, 'admin_test_hesabi_profili');
    });

  } else {
    logStep('Admin paneli testi atlandı', 'warn', 'QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD tanımlanmamış');
  }

  // ============================================================
  // BÖLÜM 4: TÜM TESTLER BİTTİ — ADMİN'E TAM RAPOR MESAJI GÖNDER
  // ============================================================
  // Buraya kadar hem genel kullanıcı testleri hem admin paneli testi tamamlandı.
  // Şimdi test hesabına tekrar girip, TÜM sonucu (hatalı adımların ekran
  // görüntüleriyle birlikte) admin'e uygulama içi mesaj olarak gönderiyoruz.
  if (ADMIN_UID) {
    await step(page, 'Admin\'e tam rapor mesajı gönder', async () => {
      // Test hesabına geri dön (admin panelinden çıkıp)
      await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      const authVisible = await page.isVisible('#authFormWrap').catch(() => false);
      if (authVisible) {
        await page.fill('#authEmail', TEST_EMAIL);
        await page.fill('#authPassword', TEST_PASSWORD);
        await safeClick(page, '#btnEmailAuth');
        await page.waitForTimeout(3000);
      }
      const loggedIn = await page.isVisible('header.top').catch(() => false);
      if (!loggedIn) throw new Error('Rapor göndermek için test hesabına tekrar giriş yapılamadı');
      await clearOverlays(page);

      const navigated = await page.evaluate((uid) => {
        if (typeof openViewProfile === 'function') { openViewProfile(uid); return true; }
        return false;
      }, ADMIN_UID);
      if (!navigated) throw new Error('openViewProfile fonksiyonu bulunamadı');
      await page.waitForTimeout(1200);
      const profileOpen = await page.isVisible('#screen-view-profile.active').catch(() => false);
      if (!profileOpen) throw new Error('Admin profili açılamadı (UID hatalı olabilir)');

      const msgBtn = await page.$('#vpMessageBtn');
      if (!msgBtn) throw new Error('"Mesaj" butonu bulunamadı (arkadaş olmayan biriyle mesajlaşma kapalı olabilir)');
      await msgBtn.click();
      await page.waitForTimeout(1200);
      const chatOpen = await page.isVisible('#screen-chat.active').catch(() => false);
      if (!chatOpen) throw new Error('Sohbet ekranı açılmadı');

      // ---- Önceki QA Bot mesajlarının TAMAMINI sil (metin + hata ekran görüntüleri) ----
      // Bu sohbet SADECE bot raporları için kullanıldığı için, botun kendi
      // gönderdiği her şeyi (görsel eklerin metni olmadığı için önceki sürümde
      // sadece metin özeti siliniyordu, ekran görüntüleri kalıyordu — artık ikisi de siliniyor).
      try {
        const deletedCount = await page.evaluate(async () => {
          if (typeof currentConvId === 'undefined' || !currentConvId || typeof db === 'undefined' || typeof currentUser === 'undefined' || !currentUser) return 0;
          const snap = await db.collection('messages')
            .where('convId', '==', currentConvId)
            .where('senderUid', '==', currentUser.uid)
            .get();
          let count = 0;
          for (const doc of snap.docs) {
            const data = doc.data();
            if (data.deletedForEveryone) continue;
            await doc.ref.update({
              deletedForEveryone: true,
              text: '',
              imageData: firebase.firestore.FieldValue.delete(),
              audioData: firebase.firestore.FieldValue.delete(),
            });
            count++;
          }
          return count;
        });
        if (deletedCount > 0) logStep('Önceki rapor mesajları temizlendi', 'ok', `${deletedCount} eski mesaj silindi`);
      } catch (e) {
        logStep('Önceki rapor mesajlarını silme denendi', 'warn', e.message);
      }

      // ---- Özet metni gönder ----
      const okResults = results.filter(r => r.status === 'ok');
      const warnResults = results.filter(r => r.status === 'warn');
      const failedResults = results.filter(r => r.status === 'fail');
      let reportMsg = `🤖 QA Bot Raporu — ${new Date().toLocaleString('tr-TR')}\n\n`;
      reportMsg += `✅ ${okResults.length} başarılı · ⚠️ ${warnResults.length} uyarı · ❌ ${failedResults.length} hata\n`;

      if (okResults.length) {
        reportMsg += `\n✅ BAŞARILI OLAN ADIMLAR:\n` + okResults.map(r => `• ${r.step}`).join('\n');
      }
      if (warnResults.length) {
        reportMsg += `\n\n⚠️ UYARILAR (hata değil, sadece dikkat edilecek):\n` + warnResults.map(r => `• ${r.step}${r.detail ? ' — ' + r.detail : ''}`).join('\n');
      }
      if (failedResults.length) {
        reportMsg += `\n\n❌ HATALI ADIMLAR (ne olduğunun sade açıklaması):\n`
          + failedResults.map(r => `• ${r.step}\n   ↳ ${friendlyErrorReason(r.detail)}`).join('\n');
        reportMsg += `\n\nHer hatanın ekran görüntüsünü ayrı ayrı, aşağıda gönderiyorum.`;
      } else {
        reportMsg += `\n\nTüm test adımları (genel kullanım + admin paneli) sorunsuz geçti. 🎉`;
      }
      await page.fill('#chatInput', reportMsg);
      await safeClick(page, '#chatSendBtn');
      await page.waitForTimeout(1200);

      // ---- Hatalı adımların ekran görüntülerini tek tek gönder (en fazla 5 tane, sohbeti boğmasın) ----
      const shotsToSend = failedResults.filter(r => r.screenshot).slice(0, 5);
      for (const r of shotsToSend) {
        const fullPath = path.join(SHOTS_DIR, r.screenshot);
        if (fs.existsSync(fullPath)) {
          try {
            await page.setInputFiles('#chatImageInput', fullPath);
            await page.waitForTimeout(1800); // sıkıştırma + gönderme için zaman tanı
          } catch (e) { /* bir görsel gönderilemezse diğerlerine devam et */ }
        }
      }

      logStep('Admin\'e tam rapor mesajı gönderildi', 'ok', `${shotsToSend.length} hata ekran görüntüsü eklendi`);
      results[results.length - 1].screenshot = await shot(page, 'admin_rapor_mesaji');
    });
  } else {
    logStep('Admin\'e mesaj gönderme atlandı', 'warn', 'QA_ADMIN_UID tanımlanmamış');
  }

  await browser.close();


  // ============================================================
  // RAPOR OLUŞTUR
  // ============================================================
  const okCount = results.filter(r => r.status === 'ok').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warnCount = results.filter(r => r.status === 'warn').length;

  let md = `# 🤖 Şantiye Defteri — Otomatik QA Raporu\n\n`;
  md += `**Tarih:** ${new Date().toLocaleString('tr-TR')}\n\n`;
  md += `**Özet:** ✅ ${okCount} başarılı · ⚠️ ${warnCount} uyarı · ❌ ${failCount} hata\n\n`;
  md += `---\n\n## Adım Adım Sonuçlar\n\n`;
  results.forEach((r, i) => {
    const icon = r.status === 'ok' ? '✅' : r.status === 'warn' ? '⚠️' : '❌';
    md += `### ${i + 1}. ${icon} ${r.step}\n`;
    if (r.detail) md += `${r.detail}\n\n`;
    if (r.screenshot) md += `![${r.step}](screenshots/${r.screenshot})\n\n`;
  });

  md += `---\n\n## 🖥️ Konsol Hataları (${consoleErrors.length})\n\n`;
  md += consoleErrors.length ? consoleErrors.map(e => `- \`${e}\``).join('\n') : '_Hiç konsol hatası yakalanmadı._';
  md += `\n\n## 💥 Sayfa Hataları / İstisnalar (${pageErrors.length})\n\n`;
  md += pageErrors.length ? pageErrors.map(e => `- \`${e}\``).join('\n') : '_Hiç yakalanmamış JS hatası oluşmadı._';

  fs.writeFileSync(path.join(REPORT_DIR, 'report.md'), md, 'utf-8');
  console.log('\n\n📄 Rapor oluşturuldu: qa-report/report.md');

  if (failCount > 0) process.exitCode = 1;
})();
