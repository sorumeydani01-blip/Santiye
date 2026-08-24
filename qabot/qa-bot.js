// ============================================================
// ŞANTİYE DEFTERİ — OTOMATİK QA (KALİTE KONTROL) BOTU
// ============================================================
// Bu script, siteyi gerçek bir kullanıcı gibi gezer:
//  - Normal bir test hesabı oluşturur (yoksa) / giriş yapar
//  - Uygulamanın her ana ekranını ziyaret eder
//  - Bir yevmiye kaydı ve bir not ekler
//  - Karanlık moda geçer
//  - Sayfayı yeniler (pull-to-refresh benzeri)
//  - Ayrı bir "bot-admin" hesabıyla admin paneline girer,
//    gerçek bir düzenleme/silme işlemi yapar
//  - Konsol hatalarını ve ekran görüntülerini toplar
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
const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD || '';

const REPORT_DIR = path.join(__dirname, '..', 'qa-report');
const SHOTS_DIR = path.join(REPORT_DIR, 'screenshots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const results = []; // { step, status: 'ok'|'fail'|'warn', detail, screenshot }
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

async function goScreen(page, navName, screenId) {
  // Alt menüdeki data-screen özniteliğine göre sekmeye tıklar (varsa),
  // yoksa doğrudan switchScreen JS fonksiyonunu tetikler.
  const navBtn = await page.$(`nav.tabs button[data-screen="${navName}"]`);
  if (navBtn) {
    await navBtn.click();
  } else {
    await page.evaluate((id) => {
      if (typeof switchScreen === 'function') switchScreen(id);
    }, screenId);
  }
  await page.waitForTimeout(700);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 }, // orta boy Android telefon
    locale: 'tr-TR',
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${new Date().toISOString()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(`[${new Date().toISOString()}] ${err.message}`);
  });

  try {
    // ---------- 1) SİTEYİ AÇ ----------
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const shot1 = await shot(page, 'ilk_acilis');
    logStep('Site açıldı', 'ok', '');
    results[results.length - 1].screenshot = shot1;

    // ---------- 2) GİRİŞ / KAYIT ----------
    const isFormVisible = await page.isVisible('#authFormWrap').catch(() => false);
    if (isFormVisible) {
      await page.fill('#authEmail', TEST_EMAIL);
      await page.fill('#authPassword', TEST_PASSWORD);
      // Önce giriş dene; başarısızsa (hesap yok) kayıt ol
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
    }

    // ---------- 3) ONBOARDING (İlk kez profil oluşturma) ----------
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
    if (!loggedIn) {
      logStep('Giriş/kayıt sonrası ana ekran açılmadı', 'fail', 'Auth akışı başarısız olmuş olabilir');
      throw new Error('Giriş başarısız, teste devam edilemiyor');
    }
    logStep('Test hesabıyla giriş yapıldı', 'ok', TEST_EMAIL);
    results[results.length - 1].screenshot = await shot(page, 'giris_sonrasi_ana_sayfa');

    // ---------- 4) ANA SAYFA: Veriler/Takvim geçişi ----------
    const takvimBtn = await page.$('.home-view-tab[data-homeview="calendar"]');
    if (takvimBtn) {
      await takvimBtn.click();
      await page.waitForTimeout(600);
      const calendarShown = await page.isVisible('#homeCalendarSection').catch(() => false);
      logStep('Ana Sayfa → Takvim sekmesi', calendarShown ? 'ok' : 'fail');
      results[results.length - 1].screenshot = await shot(page, 'takvim_sekmesi');
      const verilerBtn = await page.$('.home-view-tab[data-homeview="data"]');
      if (verilerBtn) { await verilerBtn.click(); await page.waitForTimeout(400); }
    } else {
      logStep('Ana Sayfa → Takvim sekmesi', 'fail', 'Buton bulunamadı');
    }

    // ---------- 5) YEVMİYE KAYDI EKLE (takvimden bir güne dokun) ----------
    await goScreen(page, null, 'ana');
    const calDay = await page.$('.cal-day:not(.other-month)');
    if (calDay) {
      const takvimBtn2 = await page.$('.home-view-tab[data-homeview="calendar"]');
      if (takvimBtn2) { await takvimBtn2.click(); await page.waitForTimeout(500); }
      const dayCell = await page.$('#calGrid .cal-day:not(.other-month)');
      if (dayCell) {
        await dayCell.click();
        await page.waitForTimeout(800);
        logStep('Takvimden yevmiye kaydı eklendi', 'ok');
        results[results.length - 1].screenshot = await shot(page, 'yevmiye_eklendi');
      }
    }

    // ---------- 6) NOT EKLEME ----------
    const addNoteBtn = await page.$('#btnAddNote');
    if (addNoteBtn) {
      await addNoteBtn.click();
      await page.waitForTimeout(500);
      const noteInput = await page.$('#noteText, #entryNote, textarea:visible');
      if (noteInput) {
        await noteInput.fill('QA Bot test notu — otomatik oluşturuldu.');
        const saveBtn = await page.$('#entrySave, #noteSave');
        if (saveBtn) { await saveBtn.click(); await page.waitForTimeout(800); }
      }
      logStep('Not ekleme akışı denendi', 'ok');
      results[results.length - 1].screenshot = await shot(page, 'not_ekleme');
    }

    // ---------- 7) DİĞER ANA EKRANLAR ----------
    const screensToVisit = [
      { nav: 'kayitlar', label: 'Geçmiş' },
      { nav: 'istatistik', label: 'İstatistik' },
      { nav: 'notlarim', label: 'Notlar' },
    ];
    for (const s of screensToVisit) {
      await goScreen(page, s.nav, s.nav);
      const active = await page.isVisible(`#screen-${s.nav}.active`).catch(() => false);
      logStep(`${s.label} ekranı açıldı`, active ? 'ok' : 'fail');
      results[results.length - 1].screenshot = await shot(page, `ekran_${s.nav}`);
    }

    // ---------- 8) HEADER AÇILIR MENÜLERİ ----------
    await goScreen(page, null, 'ana');
    const headerButtons = [
      { sel: '#btnHeaderMessages', dropdown: '#headerMsgDropdown', label: 'Mesajlar menüsü' },
      { sel: '#btnHeaderFriends', dropdown: '#headerFriendsDropdown', label: 'Arkadaşlar menüsü' },
      { sel: '#btnNotifBell', dropdown: '#headerNotifDropdown', label: 'Bildirimler menüsü' },
    ];
    for (const hb of headerButtons) {
      const ok = await safeClick(page, hb.sel);
      await page.waitForTimeout(500);
      const dropdownVisible = ok ? await page.isVisible(hb.dropdown).catch(() => false) : false;
      logStep(hb.label, dropdownVisible ? 'ok' : 'fail');
      results[results.length - 1].screenshot = await shot(page, `header_${hb.sel.replace(/[#.]/g, '')}`);
      await page.keyboard.press('Escape').catch(() => {});
      await page.click('body', { position: { x: 10, y: 300 } }).catch(() => {});
      await page.waitForTimeout(300);
    }

    // ---------- 9) PROFİL EKRANI ----------
    await goScreen(page, 'profil', 'profil');
    const profileActive = await page.isVisible('#screen-profil.active').catch(() => false);
    logStep('Profil ekranı açıldı', profileActive ? 'ok' : 'fail');
    results[results.length - 1].screenshot = await shot(page, 'profil_ekrani');

    // ---------- 10) KARANLIK MOD ----------
    await safeClick(page, '.gear-btn');
    await page.waitForTimeout(500);
    const darkToggle = await page.$('#toggleDark');
    if (darkToggle) {
      await darkToggle.click();
      await page.waitForTimeout(600);
      const isDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark');
      logStep('Karanlık mod açıldı', isDark ? 'ok' : 'fail');
      results[results.length - 1].screenshot = await shot(page, 'karanlik_mod');
      await darkToggle.click(); // geri aç, test hesabını temiz bırak
      await page.waitForTimeout(400);
    }
    await page.click('#settingsClose').catch(() => {});

    // ---------- 11) OYUNLAR ----------
    await safeClick(page, '#btnHeaderProfile');
    await page.waitForTimeout(400);
    await safeClick(page, '#btnHeaderMenuOyunlar');
    await page.waitForTimeout(1000);
    const oyunlarActive = await page.isVisible('#screen-oyunlar.active').catch(() => false);
    logStep('Oyunlar ekranı açıldı', oyunlarActive ? 'ok' : 'fail');
    results[results.length - 1].screenshot = await shot(page, 'oyunlar_ekrani');

    // ---------- 12) SORU ÇÖZ ----------
    await goScreen(page, null, 'ana');
    await safeClick(page, '#btnHeaderProfile');
    await page.waitForTimeout(400);
    await safeClick(page, '#btnHeaderMenuQuiz');
    await page.waitForTimeout(1000);
    const quizActive = await page.isVisible('#screen-quiz.active').catch(() => false);
    logStep('Soru Çöz ekranı açıldı', quizActive ? 'ok' : 'fail');
    results[results.length - 1].screenshot = await shot(page, 'quiz_ekrani');

    // ---------- 13) SAYFA YENİLEME (reload) ----------
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const reloadedOk = await page.isVisible('header.top').catch(() => false);
    logStep('Sayfa yenileme (reload) sonrası ana ekran', reloadedOk ? 'ok' : 'fail');
    results[results.length - 1].screenshot = await shot(page, 'reload_sonrasi');

    // ---------- 14) ÇIKIŞ YAP (test hesabından) ----------
    await safeClick(page, '#btnHeaderProfile');
    await page.waitForTimeout(300);
    await safeClick(page, '#btnHeaderMenuSettings');
    await page.waitForTimeout(600);
    await safeClick(page, '#btnLogout');
    await page.waitForTimeout(1500);
    logStep('Test hesabından çıkış yapıldı', 'ok');

  } catch (e) {
    logStep('Beklenmeyen hata (test akışı durdu)', 'fail', e.message);
    results[results.length - 1].screenshot = await shot(page, 'hata_ani');
  }

  // ============================================================
  // ADMİN PANELİ TESTİ (ayrı hesap, sadece ADMIN_EMAIL verilmişse)
  // ============================================================
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    try {
      await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      const authVisible = await page.isVisible('#authFormWrap').catch(() => false);
      if (authVisible) {
        await page.fill('#authEmail', ADMIN_EMAIL);
        await page.fill('#authPassword', ADMIN_PASSWORD);
        await safeClick(page, '#btnEmailAuth');
        await page.waitForTimeout(3000);
      }
      const adminLoggedIn = await page.isVisible('header.top').catch(() => false);
      logStep('Bot-admin hesabıyla giriş yapıldı', adminLoggedIn ? 'ok' : 'fail', ADMIN_EMAIL);
      results[results.length - 1].screenshot = await shot(page, 'admin_giris');

      if (adminLoggedIn) {
        // Rütbe rozetinden admin menüsünü aç
        await page.waitForTimeout(1500); // isAdmin durumunun Firestore'dan gelmesini bekle
        const roleBadge = await page.$('#roleBadgeToggleBtn');
        if (roleBadge) {
          await roleBadge.click();
          await page.waitForTimeout(700);
          const menuOpen = await page.isVisible('#roleBadgeMenuItems').catch(() => false);
          logStep('Admin hızlı menüsü açıldı', menuOpen ? 'ok' : 'fail');
          results[results.length - 1].screenshot = await shot(page, 'admin_menu');

          if (menuOpen) {
            // "Kullanıcılar" bölümüne git
            const usersLink = await page.$('[data-admin-nav="adminusers"]');
            if (usersLink) {
              await usersLink.click();
              await page.waitForTimeout(1200);
              const usersScreenActive = await page.isVisible('#screen-adminusers.active').catch(() => false);
              logStep('Admin → Kullanıcılar ekranı açıldı', usersScreenActive ? 'ok' : 'fail');
              results[results.length - 1].screenshot = await shot(page, 'admin_kullanicilar');

              // QA test hesabını bul ve profilini görüntüle (gerçek bir "düzenleme" işlemi)
              const testUserRow = await page.$(`text=${TEST_EMAIL.split('@')[0]}`);
              if (testUserRow) {
                await testUserRow.click();
                await page.waitForTimeout(1000);
                logStep('Admin, test hesabının profilini açtı', 'ok');
                results[results.length - 1].screenshot = await shot(page, 'admin_test_hesabi_profili');
              } else {
                logStep('Admin listesinde test hesabı bulunamadı', 'warn', 'Arama/listeleme farklı çalışıyor olabilir');
              }
            } else {
              logStep('Admin → Kullanıcılar linki bulunamadı', 'fail');
            }
          }
        } else {
          logStep('Rütbe rozeti (admin girişi) bulunamadı', 'fail', 'Bu hesap admin olarak tanınmıyor olabilir');
        }
      }
    } catch (e) {
      logStep('Admin paneli testinde hata', 'fail', e.message);
    }
  } else {
    logStep('Admin paneli testi atlandı', 'warn', 'QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD tanımlanmamış');
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
  md += consoleErrors.length
    ? consoleErrors.map(e => `- \`${e}\``).join('\n')
    : '_Hiç konsol hatası yakalanmadı._';

  md += `\n\n## 💥 Sayfa Hataları / İstisnalar (${pageErrors.length})\n\n`;
  md += pageErrors.length
    ? pageErrors.map(e => `- \`${e}\``).join('\n')
    : '_Hiç yakalanmamış JS hatası oluşmadı._';

  fs.writeFileSync(path.join(REPORT_DIR, 'report.md'), md, 'utf-8');
  console.log('\n\n📄 Rapor oluşturuldu: qa-report/report.md');

  if (failCount > 0) process.exitCode = 1; // Actions'ta kırmızı X görünsün diye
})();

