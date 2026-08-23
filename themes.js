// ============================================================
// ŞANTİYE DEFTERİ — TEMA MOTORU (JS)
// ============================================================
// Bu dosya sadece tema SEÇME/ÖNİZLEME/KAYDETME mantığını içerir.
// Renk tanımları themes.css'te. Hiçbir çekirdek işlevi değiştirmez —
// sadece <html> etiketine data-app-theme="..." ekler/kaldırır.

const APP_THEMES = [
  { id: null, name: 'Klasik (Varsayılan)', desc: 'Uygulamanın orijinal indigo/mor teması', swatches: ['#4F46E5','#F59E0B','#F3F4F8'] },
  { id: 'sicak_toprak', name: 'Sıcak Toprak', desc: 'Amber/terracotta tonlarıyla sıcak bir mesajlaşma deneyimi', swatches: ['#E8830F','#FDE6BC','#F7EDE0'] },
  { id: 'kompakt', name: 'Kompakt', desc: 'Üst menüdeki ikonlar alt gezinme çubuğunun üstüne taşınır (deneysel)', swatches: ['#4F46E5','#FFFFFF','#F3F4F8'] },
  { id: 'gece', name: 'Gece', desc: 'Canlı mor/pembe kontrastlı, göz alıcı bir tema', swatches: ['#8B5CF6','#D946EF','#1E1B2E'] },
  { id: 'okyanus', name: 'Okyanus', desc: 'Serin mavi/turkuaz tonlarıyla ferah bir görünüm', swatches: ['#0EA5E9','#7DD3FC','#EAF7FC'] },
  { id: 'doga', name: 'Doğa', desc: 'Canlı yeşil tonlarıyla doğal ve dinlendirici bir his', swatches: ['#22C55E','#A7EBC1','#EBF8EF'] }
];

let appThemePreviewId = undefined; // undefined = önizleme yok, kayıtlı temayı göster

function applyAppTheme(themeId){
  if(themeId){
    document.documentElement.setAttribute('data-app-theme', themeId);
  } else {
    document.documentElement.removeAttribute('data-app-theme');
  }
}

function getSavedAppTheme(){
  try{
    return localStorage.getItem('sd_app_theme') || null;
  }catch(e){ return null; }
}

function loadAppThemeOnStart(){
  const saved = getSavedAppTheme();
  applyAppTheme(saved);
}
// Sayfa açılır açılmaz (kullanıcı girişini beklemeden) kayıtlı temayı uygula —
// localStorage anında erişilebilir olduğu için Firestore'u beklemeye gerek yok.
loadAppThemeOnStart();

async function saveAppTheme(themeId){
  try{ localStorage.setItem('sd_app_theme', themeId || ''); }catch(e){}
  applyAppTheme(themeId);
  appThemePreviewId = undefined;
  if(typeof userDocRef !== 'undefined' && userDocRef){
    try{ await userDocRef.set({ appTheme: themeId || null }, { merge:true }); }catch(e){ console.error('Tema kaydedilemedi (Firestore)', e); }
  }
  renderThemePickerScreen();
  if(typeof showToast === 'function') showToast('🎨 Tema kaydedildi!');
}

function previewAppTheme(themeId){
  appThemePreviewId = themeId;
  applyAppTheme(themeId);
  renderThemePickerScreen();
}

function renderThemePickerScreen(){
  const box = document.getElementById('themePickerList');
  if(!box) return;
  const activeId = appThemePreviewId !== undefined ? appThemePreviewId : getSavedAppTheme();
  box.innerHTML = APP_THEMES.map(t=>{
    const isActive = (t.id||null) === (activeId||null);
    return `<div class="theme-card ${isActive?'theme-card-active':''}" data-theme-id="${t.id||''}">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div style="font-weight:800; font-size:14.5px;">${escapeHtml(t.name)}</div>
        ${isActive?'<div style="color:var(--asphalt); font-size:12px; font-weight:800;">✓ Seçili</div>':''}
      </div>
      <div class="hint" style="margin:4px 0 0;">${escapeHtml(t.desc)}</div>
      <div class="theme-card-swatches">${t.swatches.map(c=>`<div class="theme-card-swatch" style="background:${c};"></div>`).join('')}</div>
    </div>`;
  }).join('');
  box.querySelectorAll('[data-theme-id]').forEach(card=>{
    card.addEventListener('click', ()=>{
      const id = card.dataset.themeId || null;
      previewAppTheme(id);
    });
  });
  const saveBtn = document.getElementById('btnSaveAppTheme');
  const savedId = getSavedAppTheme();
  const previewingDifferent = appThemePreviewId !== undefined && (appThemePreviewId||null) !== (savedId||null);
  if(saveBtn){
    saveBtn.style.display = previewingDifferent ? 'block' : 'none';
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const saveBtn = document.getElementById('btnSaveAppTheme');
  if(saveBtn){
    saveBtn.addEventListener('click', ()=>{
      const idToSave = appThemePreviewId !== undefined ? appThemePreviewId : getSavedAppTheme();
      saveAppTheme(idToSave);
    });
  }
  const backBtn = document.getElementById('btnThemePickerBack');
  if(backBtn){
    backBtn.addEventListener('click', ()=>{
      // Kaydedilmemiş önizleme varsa, ekrandan çıkarken kayıtlı temaya geri dön
      appThemePreviewId = undefined;
      applyAppTheme(getSavedAppTheme());
      switchScreen('ana');
    });
  }
  const openBtn = document.getElementById('btnOpenThemePicker');
  if(openBtn){
    openBtn.addEventListener('click', ()=>{
      appThemePreviewId = undefined;
      switchScreen('theme-picker');
      renderThemePickerScreen();
    });
  }
});
