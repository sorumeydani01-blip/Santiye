
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js').then(async (reg)=>{
      // Yeni bir sürüm bulununca otomatik devreye al ve sayfayı yenile
      reg.addEventListener('updatefound', ()=>{
        const newWorker = reg.installing;
        if(!newWorker) return;
        newWorker.addEventListener('statechange', ()=>{
          if(newWorker.state==='installed' && navigator.serviceWorker.controller){
            newWorker.postMessage({type:'SKIP_WAITING'});
          }
        });
      });
      try{
        if('periodicSync' in reg){
          const status = await navigator.permissions.query({name:'periodic-background-sync'});
          if(status.state === 'granted'){
            await reg.periodicSync.register('yevmiye-reminder-check', {minInterval: 12*60*60*1000});
          }
        }
      }catch(e){} // desteklenmiyorsa sorun değil, ön plan hatırlatıcısı zaten çalışıyor
    }).catch(()=>{});
    let refreshedOnce = false;
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{
      if(refreshedOnce) return;
      refreshedOnce = true;
      window.location.reload();
    });
  });
}
function updateOfflineBanner(){
  const banner = document.getElementById('offlineBanner');
  if(!banner) return;
  banner.style.display = navigator.onLine ? 'none' : 'block';
}
window.addEventListener('online', updateOfflineBanner);
window.addEventListener('offline', updateOfflineBanner);
document.addEventListener('DOMContentLoaded', updateOfflineBanner);
updateOfflineBanner();
const K_ENTRIES='santiye-defteri-kayitlar', K_SETTINGS='santiye-defteri-ayarlar', K_NOTES='santiye-defteri-notlar';

// ========== FIREBASE AYARLARI ==========
// BURAYA kendi Firebase projenin ayarlarını yapıştır (console.firebase.google.com > Proje Ayarları > Web Uygulaması)
const firebaseConfig = {
  apiKey: "AIzaSyD_HgqaB1bQgLuwduTL8lIXKMwK9-HZWZk",
  authDomain: "defterim-bf5a9.firebaseapp.com",
  projectId: "defterim-bf5a9",
  storageBucket: "defterim-bf5a9.firebasestorage.app",
  messagingSenderId: "504570577849",
  appId: "1:504570577849:web:93021a43e37dbce84d6c68"
};

let auth, db, currentUser = null, userDocRef = null;
let firebaseReady = false;
let firebaseSdkMissing = (typeof firebase === 'undefined');
if(!firebaseSdkMissing){
  try{
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
    firebaseReady = true;
  }catch(e){
    console.error('Firebase baslatilamadi', e);
  }
} else {
  console.error('Firebase SDK yuklenemedi (CDN erisimi engellenmis olabilir)');
}
// ========================================
const APP_LOGO_B64 = "icon-192.png"; // Gerçek dosyaya işaret eder, JS içinde dev veri yok
(function applyAppLogo(){
  const targets = [
    ['faviconLink','href'], ['appleTouchIconLink','href'],
    ['authLogoImg','src'], ['headerLogoImg','src']
  ];
  targets.forEach(([id, attr])=>{
    const el = document.getElementById(id);
    if(el) el[attr] = APP_LOGO_B64;
  });
})();
let entries=[], notes=[], settings={defaultWage:0, currency:'₺', darkMode:false, reminder:true, monthlyGoal:0};
let profile = null;
const PROFESSIONS = ['Seramik Ustası','Kalıp Ustası','Boyacı','Sıvacı','Elektrikçi','Tesisatçı','Demirci','Kaynakçı','İnşaat İşçisi','Diğer'];
let editingId=null;
let calYear, calMonth;
let yearForOzet;
let subTab='calisma';
let monthFilterWork='all', monthFilterAvans='all', searchWork='', searchAvans='';

const TYPE_LABEL={yevmiye:'Yevmiye', alacak:'Alacak', avans:'Avans', odeme:'Ödeme Alındı'};
const MONTH_NAMES=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DOW=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
const DEFAULT_TENURE_RANKS=[
  {icon:'🌱', name:'Yeni Katılan', minDays:0, maxDays:7},
  {icon:'👤', name:'Üye', minDays:8, maxDays:28},
  {icon:'⭐', name:'Aktif Üye', minDays:29, maxDays:60},
  {icon:'🛡️', name:'Deneyimli Üye', minDays:61, maxDays:120},
  {icon:'💎', name:'Uzman', minDays:121, maxDays:180},
  {icon:'👑', name:'Kıdemli Üye', minDays:181, maxDays:365},
  {icon:'🏆', name:'Elit Üye', minDays:366, maxDays:730},
  {icon:'🌟', name:'Usta', minDays:731, maxDays:1095},
  {icon:'⚜️', name:'Efsane Üye', minDays:1096, maxDays:1825},
  {icon:'👑', name:'Ebedî Üye', minDays:1826, maxDays:null}
];
let dynamicTenureRanks = null;
function getTenureBadge(createdAt){
  if(!createdAt) return null;
  const days = Math.floor((Date.now() - new Date(createdAt).getTime())/86400000);
  const ranks = (dynamicTenureRanks && dynamicTenureRanks.length) ? dynamicTenureRanks : DEFAULT_TENURE_RANKS;
  for(const r of ranks){
    if(days >= r.minDays && (r.maxDays==null || r.maxDays==='' || days <= r.maxDays)) return r;
  }
  return ranks.length ? ranks[ranks.length-1] : null;
}
function tenureBadgeHtml(createdAt, extraStyle){
  const r = getTenureBadge(createdAt);
  if(!r) return '';
  return `<span style="font-size:10.5px; font-weight:800; padding:2px 9px; border-radius:20px; background:var(--tint-slate); color:var(--text-slate); ${extraStyle||''}">${r.icon} ${escapeHtml(r.name)}</span>`;
}

const QUOTES=[
  'Alın teri kurumadan hakkını al.',
  'Emek her zaman karşılığını bulur.',
  'Bugünün işini yarına bırakma.',
  'Damlaya damlaya göl olur.',
  'Sabreden derviş muradına ermiş.',
  'Küçük birikimler büyük hedeflere götürür.',
  'Ter dökmeden başarı gelmez.',
  'Bugün attığın her adım, yarının temelidir.',
  'Zahmetsiz rahmet olmaz.',
  'Kazancını bil, harcamanı ölç.',
  'Her gün bir tuğla, sonunda bir duvar olur.',
  'Emeğinin hesabını iyi tut, hakkını kimseye bırakma.',
  '"İnsan için ancak çalıştığının karşılığı vardır." (Necm Suresi, 39. Ayetin meali)',
  '"Namaz kılınınca yeryüzüne dağılın, Allah\'ın lütfundan rızık arayın." (Cuma Suresi, 10. Ayetin meali)',
  '"Kazandıklarınızın temiz ve helal olanından infak edin." (Bakara Suresi, 267. Ayetin meali)',
  '"Mallarınızı aranızda haksız yollarla değil, karşılıklı rızayla yapılan ticaretle kazanın." (Nisa Suresi, 29. Ayetin meali)',
  '"De ki: Çalışın, çünkü Allah yaptıklarınızı görecektir." (Tevbe Suresi, 105. Ayetin meali)',
  '"Yeryüzünün her yanında dolaşın da Allah\'ın rızkından yiyin." (Mülk Suresi, 15. Ayetin meali)'
];
const HALAL_VERSES=[
  '"İnsan için ancak çalıştığının karşılığı vardır." (Necm Suresi, 39. Ayetin meali)',
  '"Namaz kılınınca yeryüzüne dağılın, Allah\'ın lütfundan rızık arayın." (Cuma Suresi, 10. Ayetin meali)',
  '"Kazandıklarınızın temiz ve helal olanından infak edin." (Bakara Suresi, 267. Ayetin meali)',
  '"De ki: Çalışın, çünkü Allah yaptıklarınızı görecektir." (Tevbe Suresi, 105. Ayetin meali)',
  '"Mallarınızı aranızda haksız yollarla değil, karşılıklı rızayla yapılan ticaretle kazanın." (Nisa Suresi, 29. Ayetin meali)'
];

async function loadCloudData(){
  if(!userDocRef){ entries=[]; notes=[]; profile=null; return; }
  try{
    const doc = await userDocRef.get();
    if(doc.exists){
      const data = doc.data() || {};
      entries = Array.isArray(data.entries) ? data.entries : [];
      notes = Array.isArray(data.notes) ? data.notes : [];
      settings = Object.assign(settings, data.settings || {});
      profile = data.profile || null;
      if(profile && (profile.pendingDeletion || profile.selfPaused)){
        const clearMeta = {};
        let msg = '';
        if(profile.pendingDeletion){ clearMeta.pendingDeletion=false; clearMeta.pendingDeletionAt=firebase.firestore.FieldValue.delete(); msg = '🎉 Hesap silme talebin iptal edildi, tekrar hoş geldin!'; }
        if(profile.selfPaused){ clearMeta.selfPaused=false; clearMeta.selfPausedAt=firebase.firestore.FieldValue.delete(); msg = '👋 Hesabın tekrar aktif, hoş geldin!'; }
        try{
          await userDocRef.set({profile: clearMeta}, {merge:true});
          await db.collection('public_profiles').doc(currentUser.uid).set(clearMeta, {merge:true});
          profile.pendingDeletion = false; profile.selfPaused = false;
          settings.selfPaused = false;
          setTimeout(()=> showToast(msg), 1200);
        }catch(e){}
      }
    } else {
      entries = []; notes = []; profile = null;
      await userDocRef.set({entries:[], notes:[], settings, lastAsked:'', createdAt:new Date().toISOString()});
    }
  }catch(e){
    console.error(e);
    showToast('Veriler yüklenemedi, internet bağlantını kontrol et');
    entries = []; notes = []; profile = null;
  }
}
async function persistProfile(){
  if(!userDocRef) return;
  try{ await userDocRef.set({profile}, {merge:true}); }catch(e){ showToast('Kaydedilemedi, internet bağlantını kontrol et'); }
  try{
    await db.collection('public_profiles').doc(currentUser.uid).set({
      username: profile.username || '', fullName: profile.fullName || '',
      profession: profile.profession || '', city: profile.city || '',
      userId: profile.userId || '', createdAt: profile.createdAt || '',
      followersVisibility: settings.followersVisibility || 'everyone'
    }, {merge:true});
  }catch(e){ console.error('public_profiles yazilamadi', e); }
}
async function syncPublicBadges(t){
  if(!currentUser || !profile) return;
  const accountDays = profile.createdAt ? Math.floor((Date.now()-new Date(profile.createdAt).getTime())/86400000) : 0;
  const badges = {
    b100days: t.workDays>=100,
    b1m: t.yevmiye>=1000000,
    b365user: accountDays>=365,
    bProfession: !!profile.profession
  };
  try{ await db.collection('public_profiles').doc(currentUser.uid).set({badges}, {merge:true}); }catch(e){}
}
let allPublicProfiles = [];
// ---------- TAKİP SİSTEMİ ----------
function followDocId(followerUid, followedUid){ return followerUid + '__' + followedUid; }
async function isFollowing(targetUid){
  if(!currentUser) return false;
  try{
    const doc = await db.collection('follows').doc(followDocId(currentUser.uid, targetUid)).get();
    return doc.exists;
  }catch(e){ return false; }
}
async function toggleFollow(targetUid){
  const ref = db.collection('follows').doc(followDocId(currentUser.uid, targetUid));
  const doc = await ref.get();
  if(doc.exists){ await ref.delete(); return false; }
  await ref.set({followerUid:currentUser.uid, followedUid:targetUid, createdAt:new Date().toISOString()});
  try{
    const myName = (profile && profile.fullName) || currentUser.email || 'Bir kullanıcı';
    await db.collection('notifications').add({
      toUid: targetUid, fromUid: currentUser.uid, type: 'follow',
      message: myName + ' seni takip etmeye başladı', read: false, createdAt: new Date().toISOString()
    });
  }catch(e){ console.error('bildirim olusturulamadi', e); }
  return true;
}
async function getFollowerUids(uid){
  try{
    const snap = await db.collection('follows').where('followedUid','==',uid).get();
    return snap.docs.map(d=>d.data().followerUid);
  }catch(e){ return []; }
}
function profileByUid(uid){
  return allPublicProfiles.find(p=>p.uid===uid) || null;
}
function getDisplayName(p){
  if(!p) return 'Kullanıcı';
  if(p.deactivated){
    if(hasAnyAdminTool()) return `[Hesap Silindi] (eski: ${p.username||'-'})`;
    return '[Hesap Silindi]';
  }
  return p.fullName || p.username || 'İsimsiz';
}
// Profil sayfası dışındaki HER yerde kullanılacak: sadece kullanıcı adı (+ rütbe varsa)
function usernameLabel(p){
  if(!p) return 'Kullanıcı';
  if(p.deactivated){
    if(hasAnyAdminTool()) return `[Hesap Silindi] (eski: ${p.username||'-'})`;
    return '[Hesap Silindi]';
  }
  return p.username ? p.username : 'kullanici';
}
function rankSuffixHtml(p){
  if(!p || p.deactivated) return '';
  if(p.role==='admin') return ' <span style="font-size:10px;">👑</span>';
  if(p.role==='moderator') return ' <span style="font-size:10px;">🛡️</span>';
  return '';
}
function usernameLabelHtml(p, uid){
  const label = escapeHtml(usernameLabel(p)) + rankSuffixHtml(p);
  return uid ? `<span style="cursor:pointer; text-decoration:underline; font-weight:700;" data-goto-profile="${escapeHtml(uid)}">${label}</span>` : label;
}
document.addEventListener('click', (e)=>{
  const el = e.target.closest('[data-goto-profile]');
  if(el) openViewProfile(el.dataset.gotoProfile);
});
function getDisplayUsername(p){
  if(!p || p.deactivated) return '';
  return p.username || '';
}
function renderFollowerAvatarsInto(containerId, followerUids, max){
  const box = document.getElementById(containerId);
  if(!box) return;
  if(followerUids.length===0){
    box.innerHTML = `<div class="hint" style="margin:0;">Henüz takipçi yok.</div>`;
    return;
  }
  const shown = followerUids.slice(0, max||9);
  box.innerHTML = shown.map(uid=>{
    const p = profileByUid(uid);
    const name = usernameLabel(p);
    return `<div title="${escapeHtml(name)}" data-avatar-uid="${escapeHtml(uid)}" style="cursor:pointer; width:38px;height:38px;border-radius:50%; background:linear-gradient(150deg,var(--asphalt),var(--asphalt-2)); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Manrope'; font-weight:800; font-size:12px;">${escapeHtml(getInitials(p?p.fullName:name))}</div>`;
  }).join('');
  box.querySelectorAll('[data-avatar-uid]').forEach(el=>{
    el.addEventListener('click', ()=>{
      document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
      openViewProfile(el.dataset.avatarUid);
    });
  });
}
function renderFollowerListModal(followerUids){
  const box = document.getElementById('followerListBody');
  if(followerUids.length===0){
    box.innerHTML = `<div class="empty"><div class="icon">👥</div><div class="msg">Henüz takipçi yok.</div></div>`;
  } else {
    box.innerHTML = followerUids.map(uid=>{
      const p = profileByUid(uid);
      const meta = p ? [p.profession, p.city].filter(Boolean).join(' · ') : '';
      return `<div class="toggle-row" data-uid="${escapeHtml(uid)}" style="cursor:pointer;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:36px;height:36px;border-radius:50%; background:linear-gradient(150deg,var(--asphalt),var(--asphalt-2)); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Manrope'; font-weight:800; font-size:13px; flex-shrink:0;">${escapeHtml(getInitials(p?p.username:'?'))}</div>
          <div><div class="tlbl">${escapeHtml(usernameLabel(p))}${rankSuffixHtml(p)}</div><div class="tsub">${escapeHtml(meta||'-')}</div></div>
        </div>
      </div>`;
    }).join('');
    box.querySelectorAll('[data-uid]').forEach(row=>{
      row.addEventListener('click', ()=>{
        const uid = row.dataset.uid;
        document.getElementById('followerListOverlay').classList.remove('show');
        document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
        openViewProfile(uid);
      });
    });
  }
  document.getElementById('followerListOverlay').classList.add('show');
}
document.getElementById('followerListClose').addEventListener('click', ()=> document.getElementById('followerListOverlay').classList.remove('show'));

async function renderOwnFollowers(){
  if(!currentUser) return;
  const followerUids = await getFollowerUids(currentUser.uid);
  document.getElementById('ownFollowerCount').textContent = followerUids.length;
  renderFollowerAvatarsInto('ownFollowerAvatars', followerUids, 9);
}
document.getElementById('ownSeeAllFollowers').addEventListener('click', async ()=>{
  const followerUids = await getFollowerUids(currentUser.uid);
  renderFollowerListModal(followerUids);
});

let currentViewedUid = null;
function renderBadgesFromFlags(containerId, badges, profession){
  const defs = [
    {key:'b100days', label:'100 Gün Çalıştı', icon:'🏆', tint:'var(--tint-brass)'},
    {key:'b1m', label:'1.000.000 ₺ Kazanç', icon:'💰', tint:'var(--tint-forest)'},
    {key:'b365user', label:'365 Günlük Kullanıcı', icon:'📅', tint:'var(--tint-slate)'},
    {key:'bProfession', label:profession||'Meslek', icon:'👷', tint:'var(--tint-rust)'}
  ];
  document.getElementById(containerId).innerHTML = defs.map(b=>{
    const done = badges && badges[b.key];
    return `<div style="flex:1 1 45%; text-align:center; padding:14px 8px; border-radius:14px; background:${done?b.tint:'var(--concrete)'}; opacity:${done?1:0.45};">
      <div style="font-size:24px;">${b.icon}</div>
      <div style="font-size:11px; font-weight:700; margin-top:5px;">${escapeHtml(b.label)}</div>
      ${!done?'<div style="font-size:9px; color:var(--ink-soft); margin-top:2px;">🔒 henüz kilitli</div>':''}
    </div>`;
  }).join('');
}

async function openViewProfile(uid){
  if(uid===currentUser.uid){ switchScreen('profil'); return; }
  currentViewedUid = uid;
  refreshVpBlockBtn(uid);
  document.querySelectorAll('main > .screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-view-profile').classList.add('active');
  updateFabVisibility();

  const p = profileByUid(uid);
  document.getElementById('vpAvatar').textContent = getInitials(p ? p.fullName : '?');
  document.getElementById('vpName').textContent = getDisplayName(p);
  document.getElementById('vpLastActive').textContent = (p && !p.deactivated) ? formatLastActive(p.lastActive) : '';
  document.getElementById('vpUsername').textContent = getDisplayUsername(p) ? getDisplayUsername(p) : '';
  document.getElementById('vpMeta').textContent = p ? ['👷 '+(p.profession||'-'), p.city].filter(Boolean).join(' · ') : '-';
  document.getElementById('vpUserId').textContent = p && p.userId ? p.userId : '-';
  document.getElementById('vpCreatedAt').textContent = p && p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR') : '-';
  renderBadgesFromFlags('vpBadges', p ? p.badges : null, p ? p.profession : null);

  // Rütbe rozeti
  const rankBadge = document.getElementById('vpRankBadge');
  if(p && p.role==='admin'){ rankBadge.style.display='inline-block'; rankBadge.textContent = '👑 Yönetici'; }
  else if(p && p.role==='moderator'){ rankBadge.style.display='inline-block'; rankBadge.textContent = '🛡️ ' + (p.rank || 'Moderatör'); }
  else { rankBadge.style.display='none'; }
  document.getElementById('vpTenureBadge').innerHTML = tenureBadgeHtml(p ? p.createdAt : null, 'margin-left:6px;');
  const sameIpBadge = document.getElementById('vpSameIpBadge');
  const ipRow = document.getElementById('vpIpAddressRow');
  if(canViewIp()){
    try{
      const userDoc = await db.collection('users').doc(uid).get();
      const ip = userDoc.exists ? userDoc.data().lastKnownIp : null;
      if(ip){ ipRow.style.display = 'block'; document.getElementById('vpIpAddressVal').textContent = ip; }
      else { ipRow.style.display = 'none'; }
    }catch(e){ ipRow.style.display = 'none'; }
  } else { ipRow.style.display = 'none'; }
  if(canBanIp()){
    const sameIpCount = await getSameIpAccountCount(uid);
    if(sameIpCount>0){
      sameIpBadge.style.display = 'inline-block';
      sameIpBadge.textContent = `⚠️ ${sameIpCount} hesap aynı IP`;
      sameIpBadge.onclick = ()=>{
        document.querySelectorAll('#vpAdminToolsSection details').forEach(d=>{ if(d.id==='vpToolIp') d.open = true; });
        document.getElementById('vpToolIp').scrollIntoView({behavior:'smooth', block:'center'});
      };
    } else { sameIpBadge.style.display = 'none'; }
  } else { sameIpBadge.style.display = 'none'; }
  let isTargetAdmin = (p && p.role==='admin');
  let targetModDoc = null;
  if(isAdmin){
    try{ const md = await db.collection('moderators').doc(uid).get(); if(md.exists) targetModDoc = md.data(); }catch(e){}
  }

  const bypassPrivacy = canViewPrivateInfo();
  const visibility = bypassPrivacy ? 'everyone' : ((p && p.followersVisibility) || 'everyone');

  if(visibility === 'nobody'){
    document.getElementById('vpFollowRow').style.display = 'none';
    document.getElementById('vpFollowerSectionTitle').style.display = 'none';
    document.getElementById('vpFollowerCard').style.display = 'none';
    document.getElementById('vpHiddenNote').style.display = 'block';
  } els
