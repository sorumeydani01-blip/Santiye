// ---------- ADMİN PANELİ ----------
// NOT: Ana admin dokunulmazlığı (madde 16) ayrı bir turda tam kurulacak; UID buraya girilecek.
const MAIN_ADMIN_UID = 'VEajLw5Y17eR1UMYxqIwdJnqSRM2';
let isAdmin = false;
let modPerms = {};
let adminStatusUnsub = null, modStatusUnsub = null;
function updateAdminModButtons(){
  const hasAnyModPerm = Object.values(modPerms).some(v=>v===true);
  const badge = document.getElementById('roleBadgeWrap');
  const letterEl = document.getElementById('roleBadgeLetter');
  const guideBtn = document.getElementById('footerPermGuideAna');
  if(isAdmin){
    badge.style.display = 'flex'; letterEl.textContent = 'A'; badge.title = 'Admin Paneli';
    startPendingAdminCountListener();
    if(guideBtn) guideBtn.style.display = 'block';
  } else if(hasAnyModPerm){
    badge.style.display = 'flex'; letterEl.textContent = 'M'; badge.title = 'Moderatör Paneli';
    startPendingAdminCountListener();
    if(guideBtn) guideBtn.style.display = 'block';
  } else {
    badge.style.display = 'none';
    stopPendingAdminCountListener();
    if(guideBtn) guideBtn.style.display = 'none';
  }
  if(document.getElementById('screen-admin').classList.contains('active') && typeof applyAdminPermVisibility === 'function'){
    applyAdminPermVisibility();
  }
}
const ROLE_BADGE_LINKS = [
  {label:'📊 İstatistikler', id:'adminstats'},
  {label:'👥 Kullanıcılar', id:'adminusers'},
  {label:'🚫 Devre Dışı Bırakılanlar', id:'admindeactivated'},
  {label:'✉️ İtirazlar', id:'adminappeals'},
  {label:'🚩 Şikayetler', id:'adminreports'},
  {label:'💡 Öneriler', id:'adminsuggestions'},
  {label:'📜 Öneriler Geçmişi', id:'adminsuggesthist'},
  {label:'📜 İşlem Geçmişi', id:'adminmodlog'},
  {label:'📢 Toplu Bildirim', id:'adminbroadcast'},
  {label:'📢 Duyuru Bandı', id:'adminannouncements'},
  {label:'📖 Günün Ayeti', id:'adminquotes'},
  {label:'👷 Meslek Listesi', id:'adminprofessions'},
  {label:'🧠 Soru Bankası', id:'adminquiz'},
  {label:'🎖️ Moderatör Rütbeleri', id:'adminranks'},
  {label:'🌱 Kıdem Rütbeleri', id:'admintenureranks'},
  {label:'🌐 IP Engelleme', id:'adminipban'},
  {label:'🛡️ Moderatörler', id:'adminmoderators'},
  {label:'✅ Temel Yetki İçeriği', id:'adminbasemod'},
  {label:'⚠️ Tehlikeli İşlemler', id:'adminbulk'},
];
let roleBadgeOpen = false;
function closeRoleBadgeMenu(){
  roleBadgeOpen = false;
  const menuBox = document.getElementById('roleBadgeMenuItems');
  menuBox.style.width = '0';
  menuBox.style.maxHeight = '0';
  menuBox.style.opacity = '0';
}
function openRoleBadgeMenu(){
  roleBadgeOpen = true;
  const menuBox = document.getElementById('roleBadgeMenuItems');
  menuBox.innerHTML = ROLE_BADGE_LINKS.map(l=>`<span data-role-link="${l.id}" style="display:block; padding:12px 16px; font-size:13px; font-weight:700; color:var(--ink); cursor:pointer; border-bottom:1px solid var(--line); white-space:nowrap;">${l.label}</span>`).join('');
  menuBox.style.width = '210px';
  menuBox.style.maxHeight = 'calc(100vh - 320px)';
  menuBox.style.opacity = '1';
  menuBox.querySelectorAll('[data-role-link]').forEach((el,idx)=>{
    if(idx===ROLE_BADGE_LINKS.length-1) el.style.borderBottom = 'none';
    el.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      closeRoleBadgeMenu();
      navigateToAdminSection(el.dataset.roleLink);
    });
  });
}
// ---------- ADMİN MENÜSÜ: SAYFA NAVİGASYONU ----------
async function renderAdminQuickStats(){
  const box = document.getElementById('adminQuickStats');
  if(!box) return;
  const modCount = allPublicProfiles.filter(u=>u.role==='moderator').length;
  const adminCount = allPublicProfiles.filter(u=>u.role==='admin').length;
  const warnedCount = allPublicProfiles.filter(u=> u.activeWarningUntil && new Date(u.activeWarningUntil).getTime()>Date.now()).length;
  const deactivatedCount = allPublicProfiles.filter(u=>u.deactivated).length;
  let pendingReports = 0, pendingAppeals = 0, pendingSuggestions = 0;
  try{ pendingReports = (await db.collection('reports').where('status','==','pending').get()).size; }catch(e){}
  try{ pendingAppeals = (await db.collection('appeals').where('status','==','pending').get()).size; }catch(e){}
  try{ pendingSuggestions = (await db.collection('suggestions').get()).docs.filter(d=>d.data().status!=='responded').length; }catch(e){}
  box.innerHTML = `
    <div class="stat-box"><div class="icon" style="background:var(--tint-slate);">🛡️</div><div class="val">${adminCount+modCount}</div><div class="lbl">Yönetim Ekibi</div></div>
    <div class="stat-box"><div class="icon" style="background:var(--tint-rust);">⚠️</div><div class="val">${warnedCount}</div><div class="lbl">Uyarılı Hesap</div></div>
    <div class="stat-box"><div class="icon" style="background:var(--danger); color:#fff;">🚫</div><div class="val">${deactivatedCount}</div><div class="lbl">Devre Dışı</div></div>
    <div class="stat-box"><div class="icon" style="background:var(--tint-brass);">🚩</div><div class="val">${pendingReports}</div><div class="lbl">Bekleyen Şikayet</div></div>
    <div class="stat-box"><div class="icon" style="background:var(--tint-slate);">✉️</div><div class="val">${pendingAppeals}</div><div class="lbl">Bekleyen İtiraz</div></div>
    <div class="stat-box"><div class="icon" style="background:var(--tint-forest);">💡</div><div class="val">${pendingSuggestions}</div><div class="lbl">Bekleyen Öneri</div></div>`;
}
function navigateToAdminSection(sid){
  if(sid==='adminbulk'){
    if(!canBulkActions()) return;
    if(!dangerZoneUnlocked){
      const typed = prompt('Bu bölüm, tüm kullanıcıları etkileyen geri alınamaz işlemler içerir. Devam etmek için tam olarak "TEHLİKELİ" yaz:');
      if(typed !== 'TEHLİKELİ'){ showToast('Onay metni yanlış, işlem iptal edildi'); return; }
      dangerZoneUnlocked = true;
    }
  }
  loadAllAdminData();
  switchScreen(sid);
  if(sid==='adminstats'){ renderAdminQuickStats(); const btn = document.getElementById('adminCalcStats'); if(btn) btn.click(); }
}
document.addEventListener('click', (e)=>{
  const navBtn = e.target.closest('[data-admin-nav]');
  if(navBtn){ navigateToAdminSection(navBtn.dataset.adminNav); return; }
  const backBtn = e.target.closest('[data-admin-back]');
  if(backBtn){ switchScreen('admin'); }
});
document.getElementById('roleBadgeToggleBtn').addEventListener('click', (e)=>{
  e.stopPropagation();
  if(roleBadgeOpen) closeRoleBadgeMenu();
  else openRoleBadgeMenu();
});
document.addEventListener('click', (e)=>{
  if(roleBadgeOpen && !document.getElementById('roleBadgeWrap').contains(e.target)) closeRoleBadgeMenu();
});

// ---------- ROZET ÜZERİNDE BEKLEYEN SAYISI ----------
let pendingAppealsUnsub = null, pendingReportsUnsub = null, pendingSuggestionsUnsub = null;
let pendingCounts = {appeals:0, reports:0, suggestions:0};
function updatePendingBadgeDisplay(){
  const total = pendingCounts.appeals + pendingCounts.reports + pendingCounts.suggestions;
  const el = document.getElementById('roleBadgePendingCount');
  if(total > 0){ el.style.display = 'block'; el.textContent = total > 9 ? '9+' : total; }
  else { el.style.display = 'none'; }
}
function startPendingAdminCountListener(){
  stopPendingAdminCountListener();
  if(canViewAppeals()){
    pendingAppealsUnsub = db.collection('appeals').where('status','==','pending').onSnapshot(snap=>{
      pendingCounts.appeals = snap.size; updatePendingBadgeDisplay();
    }, ()=>{});
  }
  if(canViewReports()){
    pendingReportsUnsub = db.collection('reports').where('status','==','pending').onSnapshot(snap=>{
      pendingCounts.reports = snap.size; updatePendingBadgeDisplay();
    }, ()=>{});
  }
  if(canViewSuggestions()){
    pendingSuggestionsUnsub = db.collection('suggestions').onSnapshot(snap=>{
      pendingCounts.suggestions = snap.docs.filter(d=>d.data().status!=='responded').length;
      updatePendingBadgeDisplay();
    }, ()=>{});
  }
}
function stopPendingAdminCountListener(){
  if(pendingAppealsUnsub){ pendingAppealsUnsub(); pendingAppealsUnsub = null; }
  if(pendingReportsUnsub){ pendingReportsUnsub(); pendingReportsUnsub = null; }
  if(pendingSuggestionsUnsub){ pendingSuggestionsUnsub(); pendingSuggestionsUnsub = null; }
  pendingCounts = {appeals:0, reports:0, suggestions:0};
  const el = document.getElementById('roleBadgePendingCount');
  if(el) el.style.display = 'none';
}
function checkIsAdmin(){
  if(!currentUser){ isAdmin = false; modPerms = {}; return; }
  if(adminStatusUnsub) adminStatusUnsub();
  if(modStatusUnsub) modStatusUnsub();
  adminStatusUnsub = db.collection('admins').doc(currentUser.uid).onSnapshot(async (doc)=>{
    const wasAdmin = isAdmin;
    isAdmin = doc.exists;
    if(isAdmin && !wasAdmin){
      try{ await db.collection('public_profiles').doc(currentUser.uid).set({role:'admin'}, {merge:true}); }catch(e){}
    }
    updateAdminModButtons();
    if(document.getElementById('screen-profil').classList.contains('active')) renderProfile();
  }, err=>{ console.error('admin durum dinleyici hatasi', err); isAdmin = false; updateAdminModButtons(); });
  modStatusUnsub = db.collection('moderators').doc(currentUser.uid).onSnapshot(async (doc)=>{
    const prevHadPerm = Object.values(modPerms).some(v=>v===true);
    modPerms = doc.exists ? doc.data() : {};
    const nowHasPerm = Object.values(modPerms).some(v=>v===true);
    if(!isAdmin && nowHasPerm && !prevHadPerm){
      try{ await db.collection('public_profiles').doc(currentUser.uid).set({role:'moderator', rank: modPerms.rank||'Moderatör'}, {merge:true}); }catch(e){}
    }
    updateAdminModButtons();
    if(document.getElementById('screen-profil').classList.contains('active')) renderProfile();
  }, err=>{ console.error('moderator durum dinleyici hatasi', err); modPerms = {}; updateAdminModButtons(); });
}
function canEditProfile(){ return isAdmin || !!modPerms.editProfile || hasTemelPerm('editProfile'); }
function canDeleteAccount(){ return isAdmin || !!modPerms.deleteAccount; }
function canReactivateAccount(){ return isAdmin || !!modPerms.reactivateAccount; }
function canDeletePhoto(){ return isAdmin || !!modPerms.deletePhoto || hasTemelPerm('deletePhoto'); }
function canResetAccount(){ return isAdmin || !!modPerms.resetAccount; }
function canBroadcast(){ return isAdmin || !!modPerms.broadcast; }

function canViewStats(){ return isAdmin || !!modPerms.viewStats || hasTemelPerm('viewStats'); }
function canBanIp(){ return isAdmin || !!modPerms.banIp; }
function canManageWarnings(){ return isAdmin || !!modPerms.manageWarnings; }
function canViewPrivateInfo(){ return isAdmin || !!modPerms.viewPrivateInfo; }
function canViewAppeals(){ return isAdmin || !!modPerms.viewAppeals || hasTemelPerm('viewAppeals'); }
function canBulkActions(){ return isAdmin && currentUser && currentUser.uid === MAIN_ADMIN_UID; }
function canViewModLog(){ return isAdmin || !!modPerms.viewModLog; }
function canPermanentDelete(){ return isAdmin || !!modPerms.permanentDelete; }
function canViewReports(){ return isAdmin || !!modPerms.viewReports || hasTemelPerm('viewReports'); }
function canViewSuggestions(){ return isAdmin || !!modPerms.viewSuggestions || hasTemelPerm('viewSuggestions'); }
function canViewSuggestionHistory(){ return isAdmin || !!modPerms.viewSuggestionHistory || hasTemelPerm('viewSuggestionHistory'); }
function canViewIp(){ return isAdmin || !!modPerms.viewIp; }
function canChangeUsername(){ return isAdmin || !!modPerms.changeUsername; }
function canAssignAdmin(){ return isAdmin; } // sadece admin — moderatöre bu yetki hiç verilemez
function canViewUserNotifications(){ return isAdmin || !!modPerms.viewUserNotifications || hasTemelPerm('viewUserNotifications'); }
function canViewLoginHistory(){ return isAdmin || !!modPerms.viewLoginHistory || hasTemelPerm('viewLoginHistory'); }
function canViewFullMedia(){ return isAdmin || !!modPerms.viewFullMedia || hasTemelPerm('viewFullMedia'); }
function canDeleteArchivedMedia(){ return isAdmin || !!modPerms.deleteArchivedMedia; }
function canEditAnnouncements(){ return isAdmin || !!modPerms.editAnnouncements; }
function canEditQuotes(){ return isAdmin || !!modPerms.editQuotes; }
function canEditProfessions(){ return isAdmin || !!modPerms.editProfessions; }
function canManageQuizQuestions(){ return isAdmin || !!modPerms.manageQuizQuestions; }
function canManageQuizReports(){ return isAdmin || !!modPerms.manageQuizReports; }


async function logModAction(action, targetUid, details){
  try{
    await db.collection('mod_actions').add({
      action, targetUid: targetUid||null, details: details||'',
      actorUid: currentUser.uid, createdAt: new Date().toISOString()
    });
  }catch(e){ console.error('log yazilamadi', e); }
}
function canManageUsers(){ return canEditProfile()||canDeleteAccount()||canReactivateAccount()||canDeletePhoto()||canResetAccount(); }
function hasAnyAdminTool(){ return isAdmin || Object.values(modPerms).some(v=>v===true); }
function applyAdminPermVisibility(){
  document.getElementById('adminPanelTitle').textContent = isAdmin ? 'Admin Paneli' : 'Moderatör Paneli';
  document.getElementById('adminMenuRow_adminstats').style.display = canViewStats() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminusers').style.display = canManageUsers() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_admindeactivated').style.display = canReactivateAccount() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminappeals').style.display = canViewAppeals() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminreports').style.display = canViewReports() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminsuggestions').style.display = canViewSuggestions() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminsuggesthist').style.display = canViewSuggestionHistory() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminmodlog').style.display = canViewModLog() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminbroadcast').style.display = canBroadcast() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminannouncements').style.display = canEditAnnouncements() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminquotes').style.display = canEditQuotes() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminprofessions').style.display = canEditProfessions() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminquiz').style.display = canManageQuizQuestions() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminquizreports').style.display = canManageQuizReports() ? 'flex' : 'none';
  if(canManageQuizReports()) refreshQuizReportsBadge();
  document.getElementById('adminMenuRow_adminranks').style.display = isAdmin ? 'flex' : 'none';
  document.getElementById('adminMenuRow_admintenureranks').style.display = isAdmin ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminipban').style.display = canBanIp() ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminmoderators').style.display = isAdmin ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminbasemod').style.display = isAdmin ? 'flex' : 'none';
  document.getElementById('adminMenuRow_adminbulk').style.display = canBulkActions() ? 'flex' : 'none';
  if(isAdmin) renderBaseModPermList();
}

function loadAllAdminData(){
  applyAdminPermVisibility();
  if(canManageUsers()) renderAdminUserList();
  if(canReactivateAccount()) renderDeactivatedUserList();
  if(canViewAppeals()) renderAppealsList();
  if(canViewReports()) renderReportsList();
  if(canViewSuggestions()) renderAdminSuggestionsList();
  if(canViewSuggestionHistory()) renderSuggestionHistoryList();
  if(canViewModLog()) renderModLog();
  if(canEditAnnouncements() || canEditQuotes() || canEditProfessions()) loadAdminContentConfig();
  if(isAdmin){ renderModeratorsList(); loadRankConfig(); loadTenureRankConfig(); }
  if(canBanIp()) renderBannedIpList();
  if(canManageQuizQuestions()) renderQuizAdminList();
  if(canManageQuizReports()) renderQuizReportsList();
}
function openAdminPanel(){
  document.getElementById('settingsOverlay').classList.remove('show');
  document.querySelectorAll('main > .screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-admin').classList.add('active');
  updateFabVisibility();
  document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.toggle('active', b.dataset.screen==='admin'));
  loadAllAdminData();
}

document.getElementById('btnBackFromAdmin').addEventListener('click', ()=>{
  document.getElementById('screen-admin').classList.remove('active');
  document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.toggle('active', b.dataset.screen==='profil'));
  document.getElementById('screen-profil').classList.add('active');
  renderProfile();
});

function adminUserRowHtml(u){
  return `<div class="entry" data-view-user="${escapeHtml(u.uid)}">
      <div style="width:38px;height:38px;border-radius:50%; background:linear-gradient(150deg,var(--asphalt),var(--asphalt-2)); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Manrope'; font-weight:800; font-size:13px; flex-shrink:0;">${escapeHtml(getInitials(u.fullName))}</div>
      <div class="info">
        <div class="ttype" style="color:var(--ink);">${escapeHtml(u.fullName||'İsimsiz')} ${u.username?('· '+escapeHtml(u.username)):''}</div>
        <div class="note">${escapeHtml(u.profession||'-')} ${u.city?('· '+escapeHtml(u.city)):''}</div>
        <div style="margin-top:4px;">${roleOrTenureBadgeHtml(u)}</div>
      </div>
      <div style="font-size:14px; color:var(--ink-soft);">›</div>
    </div>`;
}
function wireAdminUserRows(box){
  box.querySelectorAll('[data-view-user]').forEach(row=>{
    row.addEventListener('click', ()=>{
      document.getElementById('adminListOverlay').classList.remove('show');
      openViewProfile(row.dataset.viewUser);
    });
  });
}
let usersOnlyStaff = false;
function renderAdminUserList(filter){
  const q = (filter||'').toLowerCase();
  const activeProfiles = allPublicProfiles.filter(u=>!u.deactivated);
  let list = activeProfiles.filter(u=>{
    if(!q) return true;
    return (u.fullName||'').toLowerCase().includes(q) || (u.username||'').toLowerCase().includes(q) || (u.uid||'').toLowerCase().includes(q);
  });
  if(usersOnlyStaff) list = list.filter(u=> u.role==='admin' || u.role==='moderator');
  document.getElementById('adminUserCount').textContent = '(' + activeProfiles.length + ' aktif kullanıcı)';
  const box = document.getElementById('adminUserList');
  if(list.length===0){
    box.innerHTML = `<div class="empty"><div class="icon">👤</div><div class="msg">Kullanıcı bulunamadı.</div></div>`;
    return;
  }
  box.innerHTML = list.map(adminUserRowHtml).join('');
  wireAdminUserRows(box);
}
document.getElementById('adminUserSearch').addEventListener('input', (e)=> renderAdminUserList(e.target.value));
document.getElementById('adminUserStaffToggle').addEventListener('click', (e)=>{
  usersOnlyStaff = !usersOnlyStaff;
  e.target.classList.toggle('active', usersOnlyStaff);
  renderAdminUserList(document.getElementById('adminUserSearch').value);
});

let pendingDeactivateUid = null;
document.getElementById('deactivateClose').addEventListener('click', ()=> document.getElementById('deactivateOverlay').classList.remove('show'));
document.getElementById('deactivateConfirm').addEventListener('click', async ()=>{
  if(!pendingDeactivateUid) return;
  const reason = document.getElementById('deactivateReasonSelect').value;
  const note = document.getElementById('deactivateNote').value.trim();
  const uid = pendingDeactivateUid;
  try{
    const meta = {
      deactivated: true, deactivatedReason: reason, deactivatedNote: note,
      deactivatedBy: currentUser.uid, deactivatedAt: new Date().toISOString()
    };
    await db.collection('users').doc(uid).set({profile: meta}, {merge:true});
    await db.collection('public_profiles').doc(uid).set(meta, {merge:true});
    await logModAction('deactivateAccount', uid, `Sebep: ${reason}${note?(' — '+note):''}`);
    showToast('Hesap devre dışı bırakıldı');
    document.getElementById('deactivateOverlay').classList.remove('show');
    pendingDeactivateUid = null;
    await loadPublicProfiles();
    if(document.getElementById('adminUserSearch')) renderAdminUserList(document.getElementById('adminUserSearch').value);
    renderDeactivatedUserList();
    if(document.getElementById('screen-view-profile').classList.contains('active') && currentViewedUid===uid) openViewProfile(uid);
  }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
});

// ---------- PROFİLDEN YÖNETİCİ ARAÇLARI ----------
document.getElementById('vpDeactivateBtn').addEventListener('click', ()=>{
  const targetP = profileByUid(currentViewedUid);
  if(targetP && targetP.role==='admin'){ showToast('Admin hesapları devre dışı bırakılamaz — önce admin yetkisini kaldır.'); return; }
  pendingDeactivateUid = currentViewedUid;
  document.getElementById('deactivateReasonSelect').value = 'Sahte hesap / kimliğe bürünme';
  document.getElementById('deactivateNote').value = '';
  document.getElementById('deactivateOverlay').classList.add('show');
});
document.getElementById('vpPermanentDeleteBtn').addEventListener('click', async ()=>{
  const uid = currentViewedUid;
  const p = profileByUid(uid);
  if(p && p.role==='admin'){ showToast('Admin hesapları kalıcı olarak silinemez — önce admin yetkisini kaldır.'); return; }
  const targetName = usernameLabel(p);
  if(!confirm(`"${targetName}" adlı hesabı KALICI OLARAK silmek istediğine emin misin? Bu işlem GERİ ALINAMAZ.`)) return;
  try{
    await logModAction('permanentDelete', uid, `Silinen hesap: ${targetName} (${p?p.username:'-'})`);
    await db.collection('users').doc(uid).delete();
    await db.collection('public_profiles').doc(uid).delete();
    await db.collection('moderators').doc(uid).delete().catch(()=>{});
    const asFriendA = await db.collection('friends').where('members','array-contains',uid).get();
    const sentReqs = await db.collection('friend_requests').where('fromUid','==',uid).get();
    const receivedReqs = await db.collection('friend_requests').where('toUid','==',uid).get();
    const batch = db.batch();
    asFriendA.docs.forEach(d=> batch.delete(d.ref));
    sentReqs.docs.forEach(d=> batch.delete(d.ref));
    receivedReqs.docs.forEach(d=> batch.delete(d.ref));
    await batch.commit();
    showToast('Hesap kalıcı olarak silindi');
    await loadPublicProfiles();
    switchScreen('profil');
  }catch(e){ showToast('Silinemedi: '+(e.message||'')); }
});
document.getElementById('vpReactivateBtn').addEventListener('click', async ()=>{
  const uid = currentViewedUid;
  try{
    const clearMeta = {
      deactivated: false,
      deactivatedReason: firebase.firestore.FieldValue.delete(),
      deactivatedNote: firebase.firestore.FieldValue.delete(),
      deactivatedBy: firebase.firestore.FieldValue.delete(),
      deactivatedAt: firebase.firestore.FieldValue.delete()
    };
    await db.collection('users').doc(uid).set({profile: clearMeta}, {merge:true});
    await db.collection('public_profiles').doc(uid).set(clearMeta, {merge:true});
    await logModAction('reactivateAccount', uid, '');
    showToast('Hesap yeniden aktifleştirildi');
    await loadPublicProfiles();
    renderDeactivatedUserList();
    openViewProfile(uid);
  }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
});
document.getElementById('vpDeletePhoto').addEventListener('click', async ()=>{
  if(!confirm('Bu kullanıcının profil fotoğrafını silmek istediğine emin misin?')) return;
  try{
    await db.collection('users').doc(currentViewedUid).set({profile:{
      photoData: firebase.firestore.FieldValue.delete(),
      photoDeletedBy: currentUser.uid, photoDeletedAt: new Date().toISOString()
    }}, {merge:true});
    await db.collection('public_profiles').doc(currentViewedUid).set({
      photoDeletedBy: currentUser.uid, photoDeletedAt: new Date().toISOString()
    }, {merge:true});
    await logModAction('deletePhoto', currentViewedUid, '');
    showToast('Fotoğraf silindi');
    await loadPublicProfiles();
    openViewProfile(currentViewedUid);
  }catch(e){ showToast('Silinemedi: '+(e.message||'')); }
});
document.getElementById('vpResetAccount').addEventListener('click', async ()=>{
  if(!confirm('Bu kullanıcının TÜM kayıtları ve notları silinecek (hesap kalacak). Emin misin?')) return;
  try{
    await db.collection('users').doc(currentViewedUid).set({entries:[], notes:[]}, {merge:true});
    await logModAction('resetAccount', currentViewedUid, '');
    showToast('Hesap sıfırlandı');
  }catch(e){ showToast('Sıfırlanamadı: '+(e.message||'')); }
});
async function checkIpAffectsStaff(ip){
  try{
    const snap = await db.collection('users').where('lastKnownIp','==',ip).get();
    const affected = [];
    snap.docs.forEach(d=>{
      const p = profileByUid(d.id);
      if(d.id===currentUser.uid) affected.push('SEN (kendi hesabın!)');
      else if(p && (p.role==='admin' || p.role==='moderator')) affected.push(usernameLabel(p) + ' (yönetim ekibi)');
    });
    return affected;
  }catch(e){ return []; }
}
document.getElementById('vpBanIp').addEventListener('click', async ()=>{
  const ip = document.getElementById('vpKnownIp').textContent;
  if(!ip || ip==='-'){ showToast('Bilinen IP yok'); return; }
  const affected = await checkIpAffectsStaff(ip);
  if(affected.length>0){
    if(!confirm(`⚠️ DİKKAT: Bu IP adresi şu hesap(lar) tarafından da kullanılıyor:\n${affected.join(', ')}\n\nBu IP'yi engellersen onlar da giriş yapamaz. Yine de devam etmek istiyor musun?`)) return;
  }
  if(!confirm(ip + ' adresini engellemek istediğine emin misin?')) return;
  try{
    await db.collection('banned_ips').doc(ip.replace(/[.:]/g,'_')).set({
      originalIp: ip, reason:'Yönetici tarafından engellendi (kullanıcı profili)', bannedBy: currentUser.uid, bannedAt: new Date().toISOString()
    });
    await logModAction('banIp', currentViewedUid, ip);
    showToast('IP engellendi');
  }catch(e){ showToast('Engellenemedi: '+(e.message||'')); }
});
function renderWarningTool(p, uid){
  const statusBox = document.getElementById('vpWarningStatus');
  const isActive = p && p.activeWarningUntil && new Date(p.activeWarningUntil).getTime() > Date.now();
  if(isActive){
    statusBox.innerHTML = `<div style="background:var(--tint-rust); color:var(--danger); border-radius:10px; padding:10px 12px; font-size:12.5px; font-weight:700;">⚠️ Şu an uyarılı — ${new Date(p.activeWarningUntil).toLocaleString('tr-TR')} tarihine kadar<br><span style="font-weight:400; font-size:11.5px;">Sebep: ${escapeHtml(p.activeWarningReason||'-')}</span></div>`;
    document.getElementById('vpWarningClear').style.display = 'block';
  } else {
    statusBox.innerHTML = `<div class="hint" style="margin:0;">Şu an aktif bir uyarısı yok.</div>`;
    document.getElementById('vpWarningClear').style.display = 'none';
  }
  const history = Array.isArray(p && p.warningHistory) ? p.warningHistory.slice().reverse() : [];
  const histBox = document.getElementById('vpWarningHistory');
  histBox.innerHTML = history.length ? history.map(w=>{
    const issuer = profileByUid(w.issuedBy);
    return `<div class="card" style="padding:10px; margin-bottom:8px;">
      <div style="font-size:12px; font-weight:700;">${w.durationDays} gün — ${new Date(w.issuedAt).toLocaleDateString('tr-TR')}</div>
      <div style="font-size:11.5px; color:var(--ink-soft); margin-top:2px;">Sebep: ${escapeHtml(w.reason||'-')}</div>
      <div style="font-size:10.5px; color:var(--ink-soft); margin-top:2px;">Veren: ${escapeHtml(usernameLabel(issuer))}</div>
    </div>`;
  }).join('') : `<div class="hint" style="margin:0;">Hiç uyarı geçmişi yok.</div>`;
}
document.getElementById('vpWarningCountRow').addEventListener('click', ()=>{
  const details = document.getElementById('vpToolWarning');
  details.open = true;
  details.scrollIntoView({behavior:'smooth', block:'start'});
});
let quickWarningTargetUid = null;
function openQuickWarningModal(targetUid){
  quickWarningTargetUid = targetUid;
  const p = profileByUid(targetUid);
  document.getElementById('quickWarningTargetName').textContent = usernameLabel(p);
  document.getElementById('quickWarningReason').value = '';
  document.getElementById('quickWarningDuration').value = '3';
  document.getElementById('quickWarningOverlay').classList.add('show');
}
document.getElementById('quickWarningClose').addEventListener('click', ()=> document.getElementById('quickWarningOverlay').classList.remove('show'));
document.getElementById('quickWarningIssue').addEventListener('click', async ()=>{
  const uid = quickWarningTargetUid;
  const reason = document.getElementById('quickWarningReason').value.trim();
  const days = parseInt(document.getElementById('quickWarningDuration').value, 10);
  if(!reason){ showToast('Uyarı sebebi yaz'); return; }
  if(!confirm(`Bu kullanıcıya ${days} gün süreyle uyarı vermek istediğine emin misin? Bu süre boyunca mesaj gönderemeyecek/yeni sohbet başlatamayacak.`)) return;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days*24*60*60*1000).toISOString();
  const record = {reason, durationDays: days, issuedAt: now.toISOString(), expiresAt, issuedBy: currentUser.uid};
  try{
    await db.collection('public_profiles').doc(uid).set({
      activeWarningUntil: expiresAt, activeWarningReason: reason,
      warningHistory: firebase.firestore.FieldValue.arrayUnion(record)
    }, {merge:true});
    await logModAction('issueWarning', uid, `${days} gün — ${reason}`);
    await db.collection('notifications').add({toUid:uid, fromUid:currentUser.uid, type:'mod_update', message:`⚠️ Hesabına ${days} günlük uyarı verildi. Sebep: ${reason}. Bu süre içinde mesaj gönderemez/yeni sohbet başlatamazsın.`, read:false, createdAt:new Date().toISOString()});
    showToast('Uyarı verildi');
    await loadPublicProfiles();
    document.getElementById('quickWarningOverlay').classList.remove('show');
  }catch(e){ showToast('Uyarı verilemedi: '+(e.message||'')); }
});
document.getElementById('vpWarningIssue').addEventListener('click', async ()=>{
  const uid = currentViewedUid;
  const reason = document.getElementById('vpWarningReason').value.trim();
  const days = parseInt(document.getElementById('vpWarningDuration').value, 10);
  if(!reason){ showToast('Uyarı sebebi yaz'); return; }
  if(!confirm(`Bu kullanıcıya ${days} gün süreyle uyarı vermek istediğine emin misin? Bu süre boyunca mesaj gönderemeyecek/yeni sohbet başlatamayacak.`)) return;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days*24*60*60*1000).toISOString();
  const record = {reason, durationDays: days, issuedAt: now.toISOString(), expiresAt, issuedBy: currentUser.uid};
  try{
    await db.collection('public_profiles').doc(uid).set({
      activeWarningUntil: expiresAt, activeWarningReason: reason,
      warningHistory: firebase.firestore.FieldValue.arrayUnion(record)
    }, {merge:true});
    await logModAction('issueWarning', uid, `${days} gün — ${reason}`);
    await db.collection('notifications').add({toUid:uid, fromUid:currentUser.uid, type:'mod_update', message:`⚠️ Hesabına ${days} günlük uyarı verildi. Sebep: ${reason}. Bu süre içinde mesaj gönderemez/yeni sohbet başlatamazsın.`, read:false, createdAt:new Date().toISOString()});
    showToast('Uyarı verildi');
    await loadPublicProfiles();
    document.getElementById('vpWarningReason').value = '';
    renderWarningTool(profileByUid(uid), uid);
  }catch(e){ showToast('Uyarı verilemedi: '+(e.message||'')); }
});
document.getElementById('vpWarningClear').addEventListener('click', async ()=>{
  const uid = currentViewedUid;
  if(!confirm('Uyarıyı erken sonlandırmak istediğine emin misin?')) return;
  try{
    await db.collection('public_profiles').doc(uid).set({activeWarningUntil: firebase.firestore.FieldValue.delete(), activeWarningReason: firebase.firestore.FieldValue.delete()}, {merge:true});
    await logModAction('clearWarning', uid, '');
    showToast('Uyarı kaldırıldı');
    await loadPublicProfiles();
    renderWarningTool(profileByUid(uid), uid);
  }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
});
document.getElementById('vpAssignAdminBtn').addEventListener('click', async ()=>{
  if(currentViewedUid === MAIN_ADMIN_UID){ showToast('Bu hesaba işlem yapılamaz'); return; }
  const p = profileByUid(currentViewedUid);
  const alreadyAdmin = p && p.role==='admin';
  if(alreadyAdmin){
    if(!confirm('Bu kişinin admin yetkisini kaldırmak istediğine emin misin?')) return;
    try{
      await db.collection('admins').doc(currentViewedUid).delete();
      await db.collection('public_profiles').doc(currentViewedUid).set({role: firebase.firestore.FieldValue.delete()}, {merge:true});
      await logModAction('removeAdmin', currentViewedUid, '');
      await db.collection('notifications').add({toUid:currentViewedUid, fromUid:currentUser.uid, type:'mod_update', message:'👑 Admin yetkin kaldırıldı.', read:false, createdAt:new Date().toISOString()});
      showToast('Admin yetkisi kaldırıldı');
      await loadPublicProfiles();
      openViewProfile(currentViewedUid);
    }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
  } else {
    if(!confirm('Bu kişiyi admin yapmak istediğine emin misin? Sınırsız yetkiye sahip olacak.')) return;
    try{
      await db.collection('admins').doc(currentViewedUid).set({assignedBy:currentUser.uid, assignedAt:new Date().toISOString()});
      await db.collection('moderators').doc(currentViewedUid).delete().catch(()=>{});
      await db.collection('public_profiles').doc(currentViewedUid).set({role:'admin'}, {merge:true});
      await logModAction('assignAdmin', currentViewedUid, '');
      await db.collection('notifications').add({toUid:currentViewedUid, fromUid:currentUser.uid, type:'mod_update', message:'👑 Tebrikler, admin yetkisi verildi!', read:false, createdAt:new Date().toISOString()});
      showToast('Admin yetkisi verildi');
      await loadPublicProfiles();
      openViewProfile(currentViewedUid);
    }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
  }
});
document.getElementById('vpEditSave').addEventListener('click', async ()=>{
  const onlyUsernamePerm = !canEditProfile() && canChangeUsername();
  const username = document.getElementById('vpEditUsername').value.trim();
  if(!username){ showToast('Kullanıcı adı boş olamaz'); return; }
  try{
    if(onlyUsernamePerm){
      await db.collection('users').doc(currentViewedUid).set({profile:{username}}, {merge:true});
      await db.collection('public_profiles').doc(currentViewedUid).set({username}, {merge:true});
      await logModAction('changeUsername', currentViewedUid, `Yeni kullanıcı adı: ${username}`);
    } else {
      const fullName = document.getElementById('vpEditFullName').value.trim();
      const profession = document.getElementById('vpEditProfession').value;
      const city = document.getElementById('vpEditCity').value.trim();
      if(!fullName){ showToast('Ad soyad boş olamaz'); return; }
      await db.collection('users').doc(currentViewedUid).set({profile:{fullName, username, profession, city}}, {merge:true});
      await db.collection('public_profiles').doc(currentViewedUid).set({fullName, username, profession, city}, {merge:true});
      await logModAction('editProfile', currentViewedUid, `Ad: ${fullName}, Kullanıcı adı: ${username}, Meslek: ${profession}, Şehir: ${city}`);
    }
    showToast('Bilgiler güncellendi');
    await loadPublicProfiles();
    openViewProfile(currentViewedUid);
  }catch(e){ showToast('Güncellenemedi: '+(e.message||'')); }
});

const MOD_RANK_DESCRIPTIONS = {
  '👷 Saha Moderatörü': 'Giriş seviyesi moderatör. Temel moderasyon görevlerini yürütür, günlük şikayet ve önerilere bakar.',
  '🔨 Usta Moderatör': 'Deneyim kazanmış moderatör. Daha karmaşık vakaları çözer, yeni moderatörlere yol gösterir.',
  '🏗️ Şantiye Şefi': 'Orta-üst seviye sorumluluk. Birden fazla vakada koordinasyon kurar, önemli kararlarda söz sahibidir.',
  '📋 Saha Amiri': 'Üst düzey sorumluluk. Genel moderasyon sürecini denetler, kural ihlallerinde nihai kararlara destek olur.',
  '⭐ Baş Moderatör': 'En yüksek moderatör rütbesi. Admin\'e en yakın konum, tüm moderatör ekibinin koordinasyonundan sorumludur.'
};
function updateModRankDesc(){
  const rank = document.getElementById('vpModRankSelect').value;
  document.getElementById('vpModRankDesc').textContent = MOD_RANK_DESCRIPTIONS[rank] || 'Bu rütbe için henüz bir açıklama girilmedi.';
}
document.getElementById('vpModRankSelect').addEventListener('change', updateModRankDesc);
async function fillModeratorRankSelect(selectEl, selected){
  let ranks = ['👷 Saha Moderatörü','🔨 Usta Moderatör','🏗️ Şantiye Şefi','📋 Saha Amiri','⭐ Baş Moderatör'];
  try{
    const doc = await db.collection('app_config').doc('moderatorRanks').get();
    if(doc.exists && Array.isArray(doc.data().ranks) && doc.data().ranks.length) ranks = doc.data().ranks;
  }catch(e){}
  selectEl.innerHTML = ranks.map(r=>`<option value="${escapeHtml(r)}" ${r===selected?'selected':''}>${escapeHtml(r)}</option>`).join('');
}
document.getElementById('vpModSave').addEventListener('click', async ()=>{
  if(!document.getElementById('vpModTemelYetki').checked){
    showToast('Moderatör olabilmesi için "✅ Temel Moderatör Yetkisi" işaretli olmalı');
    return;
  }
  const rank = document.getElementById('vpModRankSelect').value;
  const prevProfile = profileByUid(currentViewedUid);
  const wasAlreadyMod = prevProfile && prevProfile.role==='moderator';
  const prevRank = wasAlreadyMod ? prevProfile.rank : null;
  let prevPerms = {};
  try{
    const prevDoc = await db.collection('moderators').doc(currentViewedUid).get();
    if(prevDoc.exists) prevPerms = prevDoc.data();
  }catch(e){}
  const perms = {
    rank,
    temelYetki: document.getElementById('vpModTemelYetki').checked,
    deleteAccount: document.getElementById('vpModDeleteAccount').checked,
    reactivateAccount: document.getElementById('vpModReactivateAccount').checked,
    resetAccount: document.getElementById('vpModResetAccount').checked,
    broadcast: document.getElementById('vpModBroadcast').checked,
    editAnnouncements: document.getElementById('vpModEditAnnouncements').checked,
    editQuotes: document.getElementById('vpModEditQuotes').checked,
    editProfessions: document.getElementById('vpModEditProfessions').checked,
    manageQuizQuestions: document.getElementById('vpModManageQuizQuestions').checked,
    manageQuizReports: document.getElementById('vpModManageQuizReports').checked,
    banIp: document.getElementById('vpModBanIp').checked,
    manageWarnings: document.getElementById('vpModManageWarnings').checked,
    viewPrivateInfo: document.getElementById('vpModViewPrivateInfo').checked,
    viewModLog: document.getElementById('vpModViewModLog').checked,
    permanentDelete: document.getElementById('vpModPermanentDelete').checked,
    viewIp: document.getElementById('vpModViewIp').checked,
    changeUsername: document.getElementById('vpModChangeUsername').checked,
    deleteArchivedMedia: document.getElementById('vpModDeleteArchivedMedia').checked,
    addedBy: currentUser.uid, addedAt: new Date().toISOString()
  };
  try{
    await db.collection('moderators').doc(currentViewedUid).set(perms);
    await db.collection('public_profiles').doc(currentViewedUid).set({role:'moderator', rank}, {merge:true});
    await logModAction('assignModerator', currentViewedUid, `Rütbe: ${rank}`);
    await loadPublicProfiles();
    let notifMsg;
    if(!wasAlreadyMod){
      notifMsg = `🎉 Tebrikler, "${rank}" rütbesiyle moderatör oldun!`;
    } else {
      const added = Object.keys(PERM_LABELS).filter(k=> perms[k] && !prevPerms[k]);
      const removed = Object.keys(PERM_LABELS).filter(k=> !perms[k] && prevPerms[k]);
      const parts = [];
      if(prevRank !== rank) parts.push(`Rütben "${rank}" olarak güncellendi.`);
      if(added.length) parts.push(`Yeni verilen yetkiler: ${added.map(k=>PERM_LABELS[k]).join(', ')}.`);
      if(removed.length) parts.push(`Kaldırılan yetkiler: ${removed.map(k=>PERM_LABELS[k]).join(', ')}.`);
      notifMsg = parts.length ? `🔧 ${parts.join(' ')}` : null;
    }
    if(notifMsg){
      await db.collection('notifications').add({toUid:currentViewedUid, fromUid:currentUser.uid, type:'mod_update', message:notifMsg, read:false, createdAt:new Date().toISOString()});
    }
    showToast('Moderatör bilgileri kaydedildi');
    document.getElementById('vpModRemove').style.display = 'block';
  }catch(e){ showToast('Kaydedilemedi: '+(e.message||'')); }
});
document.getElementById('vpModRemove').addEventListener('click', async ()=>{
  if(!confirm('Bu kullanıcının moderatörlüğünü kaldırmak istediğine emin misin?')) return;
  try{
    await db.collection('moderators').doc(currentViewedUid).delete();
    await db.collection('public_profiles').doc(currentViewedUid).set({role: firebase.firestore.FieldValue.delete(), rank: firebase.firestore.FieldValue.delete()}, {merge:true});
    await logModAction('removeModerator', currentViewedUid, '');
    await db.collection('notifications').add({toUid:currentViewedUid, fromUid:currentUser.uid, type:'mod_update', message:'🛡️ Moderatörlük yetkin sonlandırıldı.', read:false, createdAt:new Date().toISOString()});
    await loadPublicProfiles();
    showToast('Moderatörlük kaldırıldı');
    openViewProfile(currentViewedUid);
  }catch(e){ showToast('Kaldırılamadı: '+(e.message||'')); }
});

function deactivatedRowHtml(u){
  if(u.pendingDeletion || u.selfPaused){
    const days = Math.floor((Date.now() - new Date(u.pendingDeletionAt||u.selfPausedAt||Date.now()).getTime())/86400000);
    const kind = u.pendingDeletion ? '🗑️ Silinmeyi bekliyor' : '🌙 Duraklatılmış';
    const overdue = days >= 30;
    return `<div class="card" style="padding:14px; ${overdue?'border-color:var(--danger);':''}">
      <div style="font-weight:700; font-size:13.5px; cursor:pointer;" data-view-pending="${escapeHtml(u.uid)}">${escapeHtml(u.fullName||'İsimsiz')} ${u.username?('· '+escapeHtml(u.username)):''}</div>
      <div style="font-size:11px; color:${overdue?'var(--danger)':'var(--ink-soft)'}; font-weight:${overdue?800:400}; margin:4px 0 10px;">${kind} · ${days} gündür · ${overdue?'30 gün doldu, kalıcı silinmeye uygun':'30 gün dolunca kalıcı silinebilir'}</div>
      ${overdue && canPermanentDelete() ? `<button class="submit-btn danger" data-finalize-delete="${escapeHtml(u.uid)}" style="font-size:12px; padding:9px;">🗑️ Şimdi Kalıcı Sil</button>` : `<div class="hint" style="margin:0;">Kullanıcı tekrar giriş yaparsa otomatik düzelir.</div>`}
    </div>`;
  }
  return `<div class="card" style="padding:14px;">
    <div style="font-weight:700; font-size:13.5px;">${escapeHtml(u.fullName||'İsimsiz')} ${u.username?('· '+escapeHtml(u.username)):''}</div>
    <div style="font-size:11px; color:var(--ink-soft); margin:4px 0 2px;">Sebep: ${escapeHtml(u.deactivatedReason||'-')}</div>
    ${u.deactivatedNote?`<div style="font-size:11px; color:var(--ink-soft); margin-bottom:6px;">Not: ${escapeHtml(u.deactivatedNote)}</div>`:''}
    <div style="font-size:10px; color:var(--ink-soft); margin-bottom:10px;">${u.deactivatedAt ? new Date(u.deactivatedAt).toLocaleDateString('tr-TR') : ''}</div>
    <button class="submit-btn secondary" data-reactivate="${escapeHtml(u.uid)}" style="font-size:12px; padding:9px;">🔁 Yeniden Aktifleştir</button>
  </div>`;
}
function wireDeactivatedRows(box){
  box.querySelectorAll('[data-view-pending]').forEach(el=> el.addEventListener('click', ()=> openViewProfile(el.dataset.viewPending)));
  box.querySelectorAll('[data-finalize-delete]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirm('Bu hesabın verilerini kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz.')) return;
      try{
        await db.collection('users').doc(btn.dataset.finalizeDelete).set({entries:[], notes:[], profile:{fullName:'[Hesap Silindi]', deleted:true}}, {merge:true});
        await db.collection('public_profiles').doc(btn.dataset.finalizeDelete).set({fullName:'[Hesap Silindi]', deleted:true, pendingDeletion:false}, {merge:true});
        await logModAction('permanentDelete', btn.dataset.finalizeDelete, '30 gün dolduğu için otomatik onaylı kalıcı silme');
        showToast('Hesap kalıcı olarak silindi');
        await loadPublicProfiles();
        renderDeactivatedUserList();
      }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
    });
  });
  box.querySelectorAll('[data-reactivate]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const uid = btn.dataset.reactivate;
      try{
        const clearMeta = {
          deactivated: false,
          deactivatedReason: firebase.firestore.FieldValue.delete(),
          deactivatedNote: firebase.firestore.FieldValue.delete(),
          deactivatedBy: firebase.firestore.FieldValue.delete(),
          deactivatedAt: firebase.firestore.FieldValue.delete()
        };
        await db.collection('users').doc(uid).set({profile: clearMeta}, {merge:true});
        await db.collection('public_profiles').doc(uid).set(clearMeta, {merge:true});
        await logModAction('reactivateAccount', uid, '');
        showToast('Hesap yeniden aktifleştirildi');
        await loadPublicProfiles();
        renderAdminUserList(document.getElementById('adminUserSearch').value);
        renderDeactivatedUserList();
        document.getElementById('adminListOverlay').classList.remove('show');
      }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
    });
  });
}
function renderDeactivatedUserList(){
  const box = document.getElementById('adminDeactivatedList');
  const deactivated = allPublicProfiles.filter(u=> u.deactivated || u.pendingDeletion || u.selfPaused);
  if(deactivated.length===0){
    box.innerHTML = `<div class="empty"><div class="icon">🚫</div><div class="msg">Devre dışı bırakılmış hesap yok.</div></div>`;
    return;
  }
  box.innerHTML = deactivated.map(deactivatedRowHtml).join('');
  wireDeactivatedRows(box);
}

// ---------- MESAJ ŞİKAYETLERİ ----------
function reportRowHtml(r){
  const reported = profileByUid(r.reportedUid);
  const reporter = profileByUid(r.reporterUid);
  const time = r.createdAt ? new Date(r.createdAt).toLocaleString('tr-TR') : '';
  const statusBadge = r.status==='resolved' ? '✅ İşlem yapıldı' : (r.status==='dismissed' ? '❌ Reddedildi' : '⏳ Bekliyor');
  const actionsHtml = r.status==='pending' ? `<div class="btn-row" style="flex-wrap:wrap;">
      <button class="submit-btn danger" data-report-deactivate="${escapeHtml(r.id)}" data-report-target="${escapeHtml(r.reportedUid)}" data-report-reporter="${escapeHtml(r.reporterUid)}" style="flex:1; font-size:12px; padding:10px 4px;">🚫 Hesabı Devre Dışı Bırak</button>
      ${canManageWarnings() ? `<button class="submit-btn secondary" data-report-warn="${escapeHtml(r.id)}" data-report-target="${escapeHtml(r.reportedUid)}" style="flex:1; font-size:12px; padding:10px 4px; border-color:var(--danger); color:var(--danger);">⚠️ Uyarı Ver</button>` : ''}
      <button class="submit-btn secondary" data-report-dismiss="${escapeHtml(r.id)}" data-report-reporter="${escapeHtml(r.reporterUid)}" style="flex:1; font-size:12px; padding:10px 4px;">Reddet</button>
    </div>` : '';
  return `<div class="card" style="padding:14px;">
    <div style="font-size:12px; color:var(--ink-soft); margin-bottom:6px;">
      <span style="font-weight:700; color:var(--asphalt); cursor:pointer; text-decoration:underline;" data-view-report-user="${escapeHtml(r.reportedUid)}">${escapeHtml(usernameLabel(reported))}${rankSuffixHtml(reported)}</span> şikayet edildi ·
      Şikayet eden: <span style="font-weight:700; color:var(--asphalt); cursor:pointer; text-decoration:underline;" data-view-report-user="${escapeHtml(r.reporterUid)}">${escapeHtml(usernameLabel(reporter))}${rankSuffixHtml(reporter)}</span>
    </div>
    <div style="font-size:11px; color:var(--ink-soft); margin-bottom:8px;">Sebep: ${escapeHtml(r.reason||'-')}${r.note?(' — '+escapeHtml(r.note)):''} · ${time} · ${statusBadge}</div>
    <div style="font-size:11px; font-weight:800; color:var(--ink-soft); margin-bottom:4px;">📌 KANIT — Şikayet edilen içerik:</div>
    <div style="font-size:13px; background:var(--concrete); border-radius:10px; padding:10px; margin-bottom:12px; white-space:pre-wrap;">"${escapeHtml(r.messageText||'')}"</div>
    <div data-evidence-img-slot="${escapeHtml(r.id)}"></div>
    ${actionsHtml}
  </div>`;
}
function wireReportRows(box){
  box.querySelectorAll('[data-view-report-user]').forEach(el=> el.addEventListener('click', ()=> openViewProfile(el.dataset.viewReportUser)));
  box.querySelectorAll('[data-evidence-img-slot]').forEach(slot=>{
    const report = allReportsCache.find(r=>r.id===slot.dataset.evidenceImgSlot);
    if(!report || !report.messageId) return;
    db.collection('messages').doc(report.messageId).get().then(doc=>{
      if(!doc.exists) return;
      const m = doc.data();
      const img = m.imageData || ((canViewFullMedia()) ? m.imageDataArchived : null);
      if(img) slot.innerHTML = `<div style="margin-bottom:12px;"><img src="${img}" style="max-width:100%; border-radius:10px; display:block;"></div>`;
    }).catch(()=>{});
  });
  box.querySelectorAll('[data-report-warn]').forEach(btn=>{
    btn.addEventListener('click', ()=> openQuickWarningModal(btn.dataset.reportTarget));
  });
  box.querySelectorAll('[data-report-deactivate]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!canDeleteAccount()){ showToast('Hesap devre dışı bırakma yetkin yok'); return; }
      const uid = btn.dataset.reportTarget;
      try{
        const meta = { deactivated:true, deactivatedReason:'Mesaj şikayeti nedeniyle', deactivatedBy:currentUser.uid, deactivatedAt:new Date().toISOString() };
        await db.collection('users').doc(uid).set({profile: meta}, {merge:true});
        await db.collection('public_profiles').doc(uid).set(meta, {merge:true});
        await db.collection('reports').doc(btn.dataset.reportDeactivate).set({status:'resolved', resolvedBy:currentUser.uid, resolvedAt:new Date().toISOString()}, {merge:true});
        await logModAction('reportResolved', uid, 'Mesaj şikayeti nedeniyle devre dışı bırakıldı');
        await db.collection('notifications').add({toUid:btn.dataset.reportReporter, fromUid:currentUser.uid, type:'report_result', message:'🚩 Şikayetiniz incelendi: ilgili hesap kurallar gereği devre dışı bırakıldı (olumlu sonuçlandı).', read:false, createdAt:new Date().toISOString()});
        showToast('Hesap devre dışı bırakıldı');
        await loadPublicProfiles();
        renderReportsList();
        document.getElementById('adminListOverlay').classList.remove('show');
      }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
    });
  });
  box.querySelectorAll('[data-report-dismiss]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      try{
        await db.collection('reports').doc(btn.dataset.reportDismiss).set({status:'dismissed', resolvedBy:currentUser.uid, resolvedAt:new Date().toISOString()}, {merge:true});
        await logModAction('reportDismissed', null, '');
        await db.collection('notifications').add({toUid:btn.dataset.reportReporter, fromUid:currentUser.uid, type:'report_result', message:'🚩 Şikayetiniz incelendi: yeterli kural ihlali bulunamadığı için reddedildi (olumsuz sonuçlandı).', read:false, createdAt:new Date().toISOString()});
        showToast('Şikayet reddedildi');
        renderReportsList();
        document.getElementById('adminListOverlay').classList.remove('show');
      }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
    });
  });
}
let allReportsCache = [];
let reportsCurrentFilter = 'pending';
let reportsSearchQuery = '';
async function renderReportsList(){
  const box = document.getElementById('adminReportsList');
  box.innerHTML = `<div class="hint">Yükleniyor...</div>`;
  try{
    const snap = await db.collection('reports').get();
    allReportsCache = snap.docs.map(d=>({id:d.id, ...d.data()}));
    allReportsCache.sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
    const pendingCount = allReportsCache.filter(r=>r.status==='pending').length;
    document.getElementById('reportsCount').textContent = pendingCount ? `(${pendingCount} bekleyen)` : '';
    renderReportsFiltered();
  }catch(e){ box.innerHTML = `<div class="hint">Yüklenemedi.</div>`; console.error(e); }
}
function renderReportsFiltered(){
  const box = document.getElementById('adminReportsList');
  let list = reportsCurrentFilter==='all' ? allReportsCache : allReportsCache.filter(r=>r.status===reportsCurrentFilter);
  if(reportsSearchQuery){
    const q = reportsSearchQuery;
    list = list.filter(r=>{
      const rp = profileByUid(r.reportedUid), rr = profileByUid(r.reporterUid);
      return (usernameLabel(rp)||'').toLowerCase().includes(q) || (usernameLabel(rr)||'').toLowerCase().includes(q) || (r.reason||'').toLowerCase().includes(q);
    });
  }
  if(list.length===0){
    box.innerHTML = `<div class="empty"><div class="icon">🚩</div><div class="msg">Bu filtrede şikayet yok.</div></div>`;
    return;
  }
  box.innerHTML = list.map(reportRowHtml).join('');
  wireReportRows(box);
}
document.getElementById('reportsSearchInput').addEventListener('input', (e)=>{
  reportsSearchQuery = e.target.value.trim().toLowerCase();
  renderReportsFiltered();
});
document.querySelectorAll('[data-reports-filter]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('[data-reports-filter]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    reportsCurrentFilter = btn.dataset.reportsFilter;
    renderReportsFiltered();
  });
});

// ---------- KULLANICI ÖNERİLERİ (ADMİN) ----------
function suggestionRowHtml(s){
  const p = profileByUid(s.uid);
  const time = s.createdAt ? new Date(s.createdAt).toLocaleString('tr-TR') : '';
  const responded = s.status==='responded';
  return `<div class="card" style="padding:14px; ${responded?'opacity:0.85;':''}">
    <div style="font-size:12px; color:var(--ink-soft); margin-bottom:6px;">
      <span style="font-weight:700; color:var(--asphalt); cursor:pointer; text-decoration:underline;" data-view-suggestion-user="${escapeHtml(s.uid)}">${escapeHtml(getDisplayName(p))}</span> · ${time}
    </div>
    <div style="font-size:13px; margin-bottom:10px;">${escapeHtml(s.text)}</div>
    ${responded
      ? `<div style="background:var(--concrete); border-radius:10px; padding:10px; font-size:12px;">💬 <strong>Yanıt:</strong> ${escapeHtml(s.response||'')}</div>`
      : `<textarea data-response-input="${escapeHtml(s.id)}" placeholder="Yanıtını yaz..." style="min-height:70px; margin-bottom:8px;"></textarea>
         <button class="submit-btn secondary" data-response-send="${escapeHtml(s.id)}" data-response-uid="${escapeHtml(s.uid)}" style="font-size:12px; padding:9px;">Yanıtla ve Gönder</button>`
    }
  </div>`;
}
function wireSuggestionRows(box){
  box.querySelectorAll('[data-view-suggestion-user]').forEach(el=>{
    el.addEventListener('click', ()=> openViewProfile(el.dataset.viewSuggestionUser));
  });
  box.querySelectorAll('[data-response-send]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const input = document.querySelector(`[data-response-input="${btn.dataset.responseSend}"]`);
      const response = input.value.trim();
      if(!response){ showToast('Yanıt boş olamaz'); return; }
      try{
        await db.collection('suggestions').doc(btn.dataset.responseSend).set({status:'responded', response, respondedBy:currentUser.uid, respondedAt:new Date().toISOString()}, {merge:true});
        await db.collection('notifications').add({
          toUid: btn.dataset.responseUid, fromUid: currentUser.uid, type:'suggestion_response',
          message: `Önerine yanıt geldi: ${response}`, read:false, createdAt:new Date().toISOString()
        });
        await logModAction('suggestionResponded', btn.dataset.responseUid, response.slice(0,120));
        showToast('Yanıt gönderildi');
        renderAdminSuggestionsList();
        if(canViewSuggestionHistory()) renderSuggestionHistoryList();
        document.getElementById('adminListOverlay').classList.remove('show');
      }catch(e){ showToast('Gönderilemedi: '+(e.message||'')); }
    });
  });
}
let allSuggestionsCache = [];
async function renderAdminSuggestionsList(){
  const box = document.getElementById('adminSuggestionsList');
  box.innerHTML = `<div class="hint">Yükleniyor...</div>`;
  try{
    const snap = await db.collection('suggestions').get();
    allSuggestionsCache = snap.docs.map(d=>({id:d.id, ...d.data()})).sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
    const pending = allSuggestionsCache.filter(s=>s.status!=='responded');
    document.getElementById('suggestionsCount').textContent = pending.length ? `(${pending.length} bekleyen)` : '';
    if(pending.length===0){
      box.innerHTML = `<div class="empty"><div class="icon">💡</div><div class="msg">Bekleyen öneri yok.</div></div>`;
      return;
    }
    box.innerHTML = pending.slice(0,3).map(suggestionRowHtml).join('') + (pending.length>3 ? seeAllBtnHtml('btnSeeAllSuggestions') : '');
    wireSuggestionRows(box);
    const seeAllBtn = document.getElementById('btnSeeAllSuggestions');
    if(seeAllBtn){
      seeAllBtn.addEventListener('click', ()=>{
        openAdminList('Bekleyen Öneriler', pending, {
          searchFn: (s,q)=>{ const p=profileByUid(s.uid); return (p&&p.fullName||'').toLowerCase().includes(q) || (s.text||'').toLowerCase().includes(q); },
          renderRowFn: suggestionRowHtml,
          wireRows: wireSuggestionRows
        });
      });
    }
  }catch(e){ box.innerHTML = `<div class="hint">Yüklenemedi.</div>`; console.error(e); }
}
async function renderSuggestionHistoryList(){
  const box = document.getElementById('adminSuggestionHistoryList');
  box.innerHTML = `<div class="hint">Yükleniyor...</div>`;
  try{
    if(!allSuggestionsCache.length){
      const snap = await db.collection('suggestions').get();
      allSuggestionsCache = snap.docs.map(d=>({id:d.id, ...d.data()})).sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
    }
    const responded = allSuggestionsCache.filter(s=>s.status==='responded');
    if(responded.length===0){
      box.innerHTML = `<div class="empty"><div class="icon">📜</div><div class="msg">Henüz yanıtlanan öneri yok.</div></div>`;
      return;
    }
    box.innerHTML = responded.map(suggestionRowHtml).join('');
    wireSuggestionRows(box);
  }catch(e){ box.innerHTML = `<div class="hint">Yüklenemedi.</div>`; }
}

// ---------- ORTAK "TÜMÜNÜ GÖR" LİSTESİ (arama + filtre) ----------
let adminListState = {items:[], filterFn:null, searchFn:null, renderRowFn:null, wireRows:null, activeFilter:'all'};
function openAdminList(title, items, opts){
  adminListState = Object.assign({items, activeFilter:'all'}, opts);
  document.getElementById('adminListTitle').textContent = title;
  document.getElementById('adminListSearch').value = '';
  renderAdminListFilters(opts.filters || []);
  renderAdminListBody();
  document.getElementById('adminListOverlay').classList.add('show');
}
function renderAdminListFilters(filters){
  const box = document.getElementById('adminListFilters');
  if(!filters || filters.length===0){ box.style.display='none'; box.innerHTML=''; return; }
  box.style.display = 'flex';
  box.innerHTML = filters.map(f=>`<button class="month-chip ${f.key===adminListState.activeFilter?'active':''}" data-filter="${escapeHtml(f.key)}" type="button">${escapeHtml(f.label)}</button>`).join('');
  box.querySelectorAll('[data-filter]').forEach(b=>{
    b.addEventListener('click', ()=>{
      adminListState.activeFilter = b.dataset.filter;
      renderAdminListFilters(filters);
      renderAdminListBody();
    });
  });
}
function renderAdminListBody(){
  const q = document.getElementById('adminListSearch').value.trim().toLowerCase();
  let items = adminListState.items || [];
  if(adminListState.filterFn) items = items.filter(it=> adminListState.filterFn(it, adminListState.activeFilter));
  if(q && adminListState.searchFn) items = items.filter(it=> adminListState.searchFn(it, q));
  const box = document.getElementById('adminListBody');
  if(items.length===0){ box.innerHTML = `<div class="hint">Sonuç yok.</div>`; return; }
  box.innerHTML = items.map(adminListState.renderRowFn).join('');
  if(adminListState.wireRows) adminListState.wireRows(box);
}
document.getElementById('adminListSearch').addEventListener('input', renderAdminListBody);
document.getElementById('adminListClose').addEventListener('click', ()=> document.getElementById('adminListOverlay').classList.remove('show'));
function seeAllBtnHtml(id){ return `<div style="text-align:center; margin-top:10px;"><button class="submit-btn secondary" id="${id}" style="max-width:220px; margin:0 auto;">Tümünü Gör</button></div>`; }

// ---------- İŞLEM GEÇMİŞİ ----------
let dynamicBaseModPerms = ['editProfile','deletePhoto','viewStats','viewReports','viewSuggestions','viewSuggestionHistory','viewUserNotifications','viewLoginHistory','viewFullMedia','viewAppeals'];
function hasTemelPerm(key){ return !!modPerms.temelYetki && dynamicBaseModPerms.includes(key); }
const PERM_LABELS = {
  editProfile:'✏️ Profil Düzenleme', deleteAccount:'🚫 Devre Dışı Bırakma', reactivateAccount:'🔁 Yeniden Aktifleştirme',
  deletePhoto:'🖼️ Fotoğraf Silme', resetAccount:'🔄 Hesap Sıfırlama', permanentDelete:'🗑️ Kalıcı Silme',
  broadcast:'📢 Toplu Bildirim', editAnnouncements:'📢 Duyuru Bandı Düzenleme', editQuotes:'📖 Günün Ayeti Düzenleme',
  editProfessions:'👷 Meslek Listesi Düzenleme', viewStats:'📊 İstatistik Görme', banIp:'🌐 IP Engelleme',
  viewPrivateInfo:'👁️ Gizli Bilgi Görme', viewAppeals:'✉️ İtirazları Görme', viewModLog:'📜 İşlem Geçmişini Görme',
  viewReports:'🚩 Şikayetleri Görme', viewSuggestions:'💡 Önerileri Görme', viewSuggestionHistory:'📜 Öneriler Geçmişini Görme',
  viewIp:'🌐 IP Adresi Görme', changeUsername:'✏️ Kullanıcı Adı Değiştirme', viewFullMedia:'🖼️ Tam Medya Görme', deleteArchivedMedia:'🗑️ Arşiv Medya Silme', temelYetki:'✅ Temel Moderatör Yetkisi', manageWarnings:'⚠️ Uyarı Verme',
  viewUserNotifications:'🔔 Kullanıcı Bildirimlerini Görme', viewLoginHistory:'🔑 Giriş Geçmişini Görme', manageQuizQuestions:'🧠 Soru Bankası Yönetimi', manageQuizReports:'🚩 Soru Şikayetlerini Yönetme'
};
const PERM_DESCRIPTIONS = {
  editProfile:'Herhangi bir kullanıcının profil bilgilerini (ad, meslek, şehir vb.) düzenleyebilirsin.',
  deleteAccount:'Bir kullanıcının hesabını devre dışı bırakabilir, giriş yapmasını engelleyebilirsin.',
  reactivateAccount:'Devre dışı bırakılmış bir hesabı tekrar aktif hale getirebilirsin.',
  deletePhoto:'Bir kullanıcının profil fotoğrafını kaldırabilirsin.',
  resetAccount:'Bir kullanıcının hesabını (kayıtları/notları) sıfırlayabilirsin.',
  permanentDelete:'Bir hesabı geri dönüşü olmayacak şekilde kalıcı olarak silebilirsin.',
  broadcast:'Tüm kullanıcılara veya belirli kişilere toplu bildirim gönderebilirsin.',
  editAnnouncements:'Ana sayfadaki duyuru bandının metnini değiştirebilirsin.',
  editQuotes:'"Günün Ayeti" bölümünde gösterilen sözleri ekleyip çıkarabilirsin.',
  editProfessions:'Kayıt olurken seçilebilen meslek listesini düzenleyebilirsin.',
  viewStats:'Platform genelindeki toplam kullanıcı/kayıt istatistiklerini görebilirsin.',
  banIp:'Belirli bir IP adresinin uygulamaya erişimini engelleyebilirsin.',
  viewPrivateInfo:'Kullanıcıların normalde gizli tuttuğu bilgilerini görebilirsin.',
  viewAppeals:'Devre dışı bırakılan hesapların itirazlarını görüp karar verebilirsin.',
  viewModLog:'Yönetim ekibinin geçmişte yaptığı tüm işlemlerin kaydını görebilirsin.',
  viewReports:'Kullanıcıların birbirini şikayet ettiği mesajları inceleyip işlem yapabilirsin.',
  viewSuggestions:'Kullanıcıların gönderdiği önerileri görüp yanıtlayabilirsin.',
  viewSuggestionHistory:'Daha önce yanıtlanmış önerilerin geçmişini görebilirsin.',
  viewIp:'Bir kullanıcının profilinde bilinen IP adresini görebilirsin.',
  changeUsername:'Kullanıcıların 1 kerelik sınırına takılmadan kullanıcı adını değiştirebilirsin.',
  viewFullMedia:'Tek seferlik veya süresi dolmuş fotoğraf/ses kayıtlarını sınırsız görebilirsin.',
  deleteArchivedMedia:'Süresi dolmuş, arşivlenmiş medyayı kalıcı olarak silebilirsin.',
  temelYetki:'Moderatörlüğün temel paketidir — birçok görüntüleme yetkisini tek seferde açar.',
  manageWarnings:'Kullanıcılara süreli uyarı verip, uyarı geçmişlerini görebilirsin.',
  viewUserNotifications:'Bir kullanıcının aldığı bildirimleri görebilirsin.',
  viewLoginHistory:'Bir kullanıcının geçmiş giriş kayıtlarını (şüpheli giriş kontrolü için) görebilirsin.',
  manageQuizQuestions:'"Soru Çöz" bölümündeki soru havuzuna yeni soru ekleyebilir, mevcut soruları düzenleyip silebilirsin.'
};
const MOD_ACTION_LABELS = {
  editProfile:'✏️ Profil düzenledi', deletePhoto:'🖼️ Fotoğraf sildi', resetAccount:'🔄 Hesabı sıfırladı',
  banIp:'🌐 IP engelledi', deactivateAccount:'🚫 Hesabı devre dışı bıraktı', reactivateAccount:'🔁 Hesabı aktifleştirdi',
  assignModerator:'🛡️ Moderatör atadı', removeModerator:'🛡️ Moderatörlüğü kaldırdı', broadcast:'📢 Toplu bildirim gönderdi',
  bulkDeactivateAll:'🚫 Tüm kullanıcıları devre dışı bıraktı', bulkDeletePhotos:'🖼️ Tüm fotoğrafları sildi',
  appealApproved:'✅ İtirazı onayladı', appealRejected:'❌ İtirazı reddetti', permanentDelete:'🗑️ Hesabı kalıcı sildi',
  reportResolved:'🚩 Şikayeti çözümledi', reportDismissed:'🚩 Şikayeti reddetti', suggestionResponded:'💡 Öneriyi yanıtladı', changeUsername:'✏️ Kullanıcı adını değiştirdi',
  assignAdmin:'👑 Admin yaptı', removeAdmin:'👑 Admin yetkisini kaldırdı', emergencyStripMods:'🛑 Tüm moderatör yetkilerini acil durdurdu', wipeAllData:'☢️ Tüm verileri temizledi', issueWarning:'⚠️ Uyarı verdi', clearWarning:'⚠️ Uyarıyı kaldırdı'
};
function modLogRowHtml(l){
  const actorP = profileByUid(l.actorUid);
  const targetP = l.targetUid ? profileByUid(l.targetUid) : null;
  const time = l.createdAt ? new Date(l.createdAt).toLocaleString('tr-TR') : '';
  const label = MOD_ACTION_LABELS[l.action] || l.action;
  return `<div class="card" style="padding:12px;">
    <div style="font-size:13px;"><span style="font-weight:700; color:var(--asphalt); cursor:pointer; text-decoration:underline;" data-actor="${escapeHtml(l.actorUid)}">${escapeHtml(usernameLabel(actorP))}${rankSuffixHtml(actorP)}</span> — ${label}${targetP?` → <span style="font-weight:700; color:var(--asphalt); cursor:pointer; text-decoration:underline;" data-target="${escapeHtml(l.targetUid)}">${escapeHtml(usernameLabel(targetP))}${rankSuffixHtml(targetP)}</span>`:''}</div>
    ${l.details?`<div style="font-size:11.5px; color:var(--ink-soft); margin-top:4px;">${escapeHtml(l.details)}</div>`:''}
    <div style="font-size:10px; color:var(--ink-soft); margin-top:4px;">${time}</div>
  </div>`;
}
function wireModLogRows(box){
  box.querySelectorAll('[data-actor]').forEach(el=> el.addEventListener('click', ()=> openViewProfile(el.dataset.actor)));
  box.querySelectorAll('[data-target]').forEach(el=> el.addEventListener('click', ()=> openViewProfile(el.dataset.target)));
}
let allModLogCache = [];
async function renderModLog(){
  const box = document.getElementById('modLogList');
  box.innerHTML = `<div class="hint">Yükleniyor...</div>`;
  try{
    const snap = await db.collection('mod_actions').orderBy('createdAt','desc').limit(300).get();
    allModLogCache = snap.docs.map(d=>({id:d.id, ...d.data()}));
    renderModLogFiltered();
  }catch(e){ box.innerHTML = `<div class="hint">Yüklenemedi.</div>`; console.error(e); }
}
function renderModLogFiltered(){
  const box = document.getElementById('modLogList');
  const q = (document.getElementById('modLogSearchInput').value||'').trim().toLowerCase();
  let list = allModLogCache;
  if(q){
    list = list.filter(l=>{
      const actorP = profileByUid(l.actorUid), targetP = l.targetUid?profileByUid(l.targetUid):null;
      return (actorP&&(actorP.username||'').toLowerCase().includes(q)) || (targetP&&(targetP.username||'').toLowerCase().includes(q)) || (l.details||'').toLowerCase().includes(q);
    });
  }
  if(list.length===0){ box.innerHTML = `<div class="empty"><div class="icon">📜</div><div class="msg">Kayıt yok.</div></div>`; return; }
  box.innerHTML = list.map(modLogRowHtml).join('');
  wireModLogRows(box);
}
document.getElementById('modLogSearchInput').addEventListener('input', renderModLogFiltered);


// ---------- İTİRAZLAR ----------
function appealRowHtml(a){
  const p = profileByUid(a.uid);
  const name = escapeHtml(usernameLabel(p)) + rankSuffixHtml(p);
  const time = a.createdAt ? new Date(a.createdAt).toLocaleDateString('tr-TR') : '';
  const statusBadge = a.status==='approved' ? '✅ Onaylandı' : (a.status==='rejected' ? '❌ Reddedildi' : '⏳ Bekliyor');
  const actionsHtml = a.status==='pending' ? `<div class="btn-row" style="flex-wrap:wrap;">
      <button class="submit-btn" data-appeal-approve="${escapeHtml(a.id)}" data-appeal-uid="${escapeHtml(a.uid)}" style="flex:1; font-size:12px; padding:10px 4px;">✅ Aktifleştir</button>
      <button class="submit-btn danger" data-appeal-reject="${escapeHtml(a.id)}" data-appeal-uid="${escapeHtml(a.uid)}" style="flex:1; font-size:12px; padding:10px 4px;">❌ Reddet</button>
      ${canManageWarnings() ? `<button class="submit-btn secondary" data-appeal-warn="${escapeHtml(a.uid)}" style="flex:1; font-size:12px; padding:10px 4px; border-color:var(--danger); color:var(--danger);">⚠️ Uyarı Ver</button>` : ''}
    </div>` : '';
  return `<div class="card" style="padding:14px;">
    <div style="font-weight:700; font-size:13.5px; cursor:pointer;" data-view-appeal-user="${escapeHtml(a.uid)}">${name} ›</div>
    <div style="font-size:11px; color:var(--ink-soft); margin:4px 0 8px;">Devre dışı sebebi: ${escapeHtml(a.deactivatedReason||'-')} · ${time} · ${statusBadge}</div>
    <div style="font-size:13px; background:var(--concrete); border-radius:10px; padding:10px; margin-bottom:12px; white-space:pre-wrap;">${escapeHtml(a.appealText||'')}</div>
    ${actionsHtml}
  </div>`;
}
function wireAppealRows(box){
  box.querySelectorAll('[data-view-appeal-user]').forEach(el=>{
    el.addEventListener('click', ()=> openViewProfile(el.dataset.viewAppealUser));
  });
  box.querySelectorAll('[data-appeal-warn]').forEach(btn=>{
    btn.addEventListener('click', ()=> openQuickWarningModal(btn.dataset.appealWarn));
  });
  box.querySelectorAll('[data-appeal-approve]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const uid = btn.dataset.appealUid;
      try{
        const clearMeta = {
          deactivated: false,
          deactivatedReason: firebase.firestore.FieldValue.delete(),
          deactivatedNote: firebase.firestore.FieldValue.delete(),
          deactivatedBy: firebase.firestore.FieldValue.delete(),
          deactivatedAt: firebase.firestore.FieldValue.delete()
        };
        await db.collection('users').doc(uid).set({profile: clearMeta}, {merge:true});
        await db.collection('public_profiles').doc(uid).set(clearMeta, {merge:true});
        await db.collection('appeals').doc(btn.dataset.appealApprove).set({status:'approved', resolvedBy:currentUser.uid, resolvedAt:new Date().toISOString()}, {merge:true});
        await logModAction('appealApproved', uid, '');
        showToast('Hesap aktifleştirildi, itiraz onaylandı');
        await loadPublicProfiles();
        renderAppealsList();
        renderDeactivatedUserList();
        document.getElementById('adminListOverlay').classList.remove('show');
      }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
    });
  });
  box.querySelectorAll('[data-appeal-reject]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirm('Bu itirazı reddetmek istediğine emin misin? Hesap devre dışı kalmaya devam edecek.')) return;
      try{
        await db.collection('appeals').doc(btn.dataset.appealReject).set({status:'rejected', resolvedBy:currentUser.uid, resolvedAt:new Date().toISOString()}, {merge:true});
        await logModAction('appealRejected', btn.dataset.appealUid||null, '');
        showToast('İtiraz reddedildi');
        renderAppealsList();
        document.getElementById('adminListOverlay').classList.remove('show');
      }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
    });
  });
}
let allAppealsCache = [];
let appealsCurrentFilter = 'pending';
let appealsSearchQuery = '';
async function renderAppealsList(){
  const box = document.getElementById('adminAppealsList');
  box.innerHTML = `<div class="hint">Yükleniyor...</div>`;
  try{
    const snap = await db.collection('appeals').get();
    allAppealsCache = snap.docs.map(d=>({id:d.id, ...d.data()}));
    allAppealsCache.sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
    const pendingCount = allAppealsCache.filter(a=>a.status==='pending').length;
    document.getElementById('appealsCount').textContent = pendingCount ? `(${pendingCount} bekleyen)` : '';
    renderAppealsFiltered();
  }catch(e){ box.innerHTML = `<div class="hint">Yüklenemedi.</div>`; console.error(e); }
}
function renderAppealsFiltered(){
  const box = document.getElementById('adminAppealsList');
  let list = appealsCurrentFilter==='all' ? allAppealsCache : allAppealsCache.filter(a=>a.status===appealsCurrentFilter);
  if(appealsSearchQuery){
    const q = appealsSearchQuery;
    list = list.filter(a=>{
      const p = profileByUid(a.uid);
      return (usernameLabel(p)||'').toLowerCase().includes(q) || (a.appealText||'').toLowerCase().includes(q);
    });
  }
  if(list.length===0){
    box.innerHTML = `<div class="empty"><div class="icon">✉️</div><div class="msg">Bu filtrede itiraz yok.</div></div>`;
    return;
  }
  box.innerHTML = list.map(appealRowHtml).join('');
  wireAppealRows(box);
}
document.getElementById('appealsSearchInput').addEventListener('input', (e)=>{
  appealsSearchQuery = e.target.value.trim().toLowerCase();
  renderAppealsFiltered();
});
document.querySelectorAll('[data-appeals-filter]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('[data-appeals-filter]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    appealsCurrentFilter = btn.dataset.appealsFilter;
    renderAppealsFiltered();
  });
});

document.getElementById('adminCalcStats').addEventListener('click', async ()=>{
  document.getElementById('adminStats').innerHTML = `<div class="hint" style="grid-column:span 3; text-align:center;">Hesaplanıyor...</div>`;
  let totalEntries = 0, totalNotes = 0, totalYevmiye = 0, totalWorkDays = 0;
  try{
    for(const u of allPublicProfiles){
      try{
        const doc = await db.collection('users').doc(u.uid).get();
        if(doc.exists){
          const data = doc.data();
          const es = Array.isArray(data.entries) ? data.entries : [];
          totalEntries += es.length;
          totalNotes += Array.isArray(data.notes) ? data.notes.length : 0;
          const t = computeTotals(es);
          totalYevmiye += t.yevmiye;
          totalWorkDays += t.workDays;
        }
      }catch(e){}
    }
  }catch(e){}
  document.getElementById('adminStats').innerHTML = `
    <div class="stat-box"><div class="icon" style="background:var(--tint-slate);">👥</div><div class="val">${allPublicProfiles.length}</div><div class="lbl">Toplam Kullanıcı</div></div>
    <div class="stat-box"><div class="icon" style="background:var(--tint-forest);">📋</div><div class="val">${totalEntries}</div><div class="lbl">Toplam Kayıt</div></div>
    <div class="stat-box"><div class="icon" style="background:var(--tint-brass);">📝</div><div class="val">${totalNotes}</div><div class="lbl">Toplam Not</div></div>
    <div class="stat-box"><div class="icon" style="background:var(--tint-rust);">📅</div><div class="val">${totalWorkDays}</div><div class="lbl">Toplam Çalışma Günü</div></div>
    <div class="stat-box balance" style="grid-column:span 3;"><div class="icon" style="background:var(--tint-forest);">💰</div><div class="valwrap"><div class="lbl">Platform Genelinde Toplam Yevmiye</div><div class="val pos">${fmt(totalYevmiye)}</div></div></div>`;
});

document.getElementById('adminBroadcastTarget').addEventListener('change', (e)=>{
  document.getElementById('adminBroadcastSpecificWrap').style.display = e.target.value==='specific' ? 'block' : 'none';
});
let broadcastSpecificSelected = {};
document.getElementById('adminBroadcastSpecificSearch').addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  const box = document.getElementById('adminBroadcastSpecificResults');
  if(!q){ box.innerHTML = ''; return; }
  const matches = allPublicProfiles.filter(u=> !u.deactivated &&
    ((u.fullName||'').toLowerCase().includes(q) || (u.username||'').toLowerCase().includes(q))
  ).slice(0, 8);
  box.innerHTML = matches.map(u=>`<div class="toggle-row" data-pick-uid="${escapeHtml(u.uid)}" style="cursor:pointer; padding:8px 10px;">
    <div class="tlbl" style="font-size:13px;">${escapeHtml(u.fullName||u.username)} <span style="color:var(--ink-soft); font-weight:400;">${escapeHtml(u.username||'-')}</span></div>
  </div>`).join('');
  box.querySelectorAll('[data-pick-uid]').forEach(row=>{
    row.addEventListener('click', ()=>{
      const u = allPublicProfiles.find(x=>x.uid===row.dataset.pickUid);
      if(u) broadcastSpecificSelected[u.uid] = u;
      document.getElementById('adminBroadcastSpecificSearch').value = '';
      box.innerHTML = '';
      renderBroadcastChips();
    });
  });
});
function renderBroadcastChips(){
  const box = document.getElementById('adminBroadcastSpecificChips');
  box.innerHTML = Object.values(broadcastSpecificSelected).map(u=>`
    <span style="display:inline-flex; align-items:center; gap:5px; background:var(--concrete); border-radius:16px; padding:5px 6px 5px 12px; font-size:12px; font-weight:700;">
      ${escapeHtml(u.fullName||u.username)}
      <button data-unpick="${escapeHtml(u.uid)}" style="border:none; background:var(--danger); color:#fff; width:18px;height:18px; border-radius:50%; cursor:pointer; font-size:11px; line-height:1;">✕</button>
    </span>`).join('');
  box.querySelectorAll('[data-unpick]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ delete broadcastSpecificSelected[btn.dataset.unpick]; renderBroadcastChips(); });
  });
}
document.getElementById('adminBroadcastSend').addEventListener('click', async ()=>{
  const msg = document.getElementById('adminBroadcastText').value.trim();
  if(!msg){ showToast('Mesaj boş olamaz'); return; }
  const target = document.getElementById('adminBroadcastTarget').value;
  let recipients = [];
  let targetLabel = '';
  if(target==='all'){ recipients = allPublicProfiles; targetLabel = 'herkese'; }
  else if(target==='staff'){ recipients = allPublicProfiles.filter(u=> u.role==='admin' || u.role==='moderator'); targetLabel = 'yönetim ekibine'; }
  else { recipients = Object.values(broadcastSpecificSelected); targetLabel = 'seçilen ' + recipients.length + ' kullanıcıya'; }
  if(recipients.length===0){ showToast('Gönderilecek kimse seçilmedi'); return; }
  if(!confirm(recipients.length + ' kullanıcıya (' + targetLabel + ') bu bildirim gönderilecek. Emin misin?')) return;
  try{
    const batch = db.batch();
    recipients.forEach(u=>{
      const ref = db.collection('notifications').doc();
      batch.set(ref, {toUid:u.uid, fromUid:currentUser.uid, type:'broadcast', message:msg, read:false, createdAt:new Date().toISOString()});
    });
    await batch.commit();
    await logModAction('broadcast', null, `[${targetLabel}] ` + msg.slice(0,120));
    showToast('Duyuru gönderildi');
    document.getElementById('adminBroadcastText').value = '';
    broadcastSpecificSelected = {};
    renderBroadcastChips();
  }catch(e){ showToast('Gönderilemedi: '+(e.message||'')); }
});

let currentProfessionsList = [];
let currentQuotesList = [];
async function loadAdminContentConfig(){
  try{
    const doc = await db.collection('app_config').doc('content').get();
    const data = doc.exists ? doc.data() : {};
    document.getElementById('adminBannerText').value = data.banner || '';
    document.getElementById('adminBannerDuration').value = '0';
    currentQuotesList = (data.quotes && data.quotes.length ? data.quotes.slice() : QUOTES.slice());
    renderQuoteListDisplay();
    currentProfessionsList = (data.professions && data.professions.length ? data.professions.slice() : PROFESSIONS.slice());
    renderProfessionListDisplay();
  }catch(e){}
}
function renderQuoteListDisplay(){
  const box = document.getElementById('quoteListDisplay');
  if(currentQuotesList.length===0){
    box.innerHTML = `<div class="hint" style="margin:0;">Henüz ayet/söz eklenmedi.</div>`;
    return;
  }
  box.innerHTML = currentQuotesList.map((q, idx)=>`
    <div class="toggle-row" style="margin-bottom:8px; align-items:flex-start;">
      <div class="tlbl" style="font-size:12.5px; line-height:1.4;">📖 ${escapeHtml(q)}</div>
      <button class="mini-btn" style="background:var(--danger); flex-shrink:0;" data-remove-quote="${idx}">🗑️</button>
    </div>`).join('');
  box.querySelectorAll('[data-remove-quote]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      currentQuotesList.splice(parseInt(btn.dataset.removeQuote,10), 1);
      renderQuoteListDisplay();
      await saveQuotesList();
    });
  });
}
async function saveQuotesList(){
  try{
    await db.collection('app_config').doc('content').set({quotes: currentQuotesList}, {merge:true});
    loadAppConfig();
  }catch(e){ showToast('Kaydedilemedi: '+(e.message||'')); }
}
document.getElementById('adminQuoteAddBtn').addEventListener('click', async ()=>{
  const input = document.getElementById('adminQuoteAddInput');
  const val = input.value.trim();
  if(!val){ showToast('Bir ayet/söz gir'); return; }
  const alreadyExists = currentQuotesList.some(q => q.trim().toLowerCase() === val.toLowerCase());
  if(alreadyExists){ showToast('Bu ayet/söz zaten listede var'); return; }
  currentQuotesList.push(val);
  input.value = '';
  renderQuoteListDisplay();
  await saveQuotesList();
  showToast('Eklendi');
});
function renderProfessionListDisplay(){
  const box = document.getElementById('professionListDisplay');
  if(currentProfessionsList.length===0){
    box.innerHTML = `<div class="hint" style="margin:0;">Henüz meslek eklenmedi.</div>`;
    return;
  }
  box.innerHTML = currentProfessionsList.map((prof, idx)=>`
    <div class="toggle-row" style="margin-bottom:8px;">
      <div class="tlbl">👷 ${escapeHtml(prof)}</div>
      <button class="mini-btn" style="background:var(--danger);" data-remove-prof="${idx}">🗑️</button>
    </div>`).join('');
  box.querySelectorAll('[data-remove-prof]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      currentProfessionsList.splice(parseInt(btn.dataset.removeProf,10), 1);
      renderProfessionListDisplay();
      await saveProfessionsList();
    });
  });
}
async function saveProfessionsList(){
  try{
    await db.collection('app_config').doc('content').set({professions: currentProfessionsList}, {merge:true});
    loadAppConfig();
  }catch(e){ showToast('Kaydedilemedi: '+(e.message||'')); }
}
document.getElementById('adminProfessionAddBtn').addEventListener('click', async ()=>{
  const input = document.getElementById('adminProfessionAddInput');
  const val = input.value.trim();
  if(!val){ showToast('Meslek adı gir'); return; }
  if(currentProfessionsList.includes(val)){ showToast('Bu meslek zaten listede'); return; }
  currentProfessionsList.push(val);
  input.value = '';
  renderProfessionListDisplay();
  await saveProfessionsList();
  showToast('Meslek eklendi');
});

// ---------- RÜTBE YÖNETİMİ (admin) ----------
let currentModRanksList = [];
async function loadRankConfig(){
  try{
    const doc = await db.collection('app_config').doc('moderatorRanks').get();
    currentModRanksList = (doc.exists && Array.isArray(doc.data().ranks) && doc.data().ranks.length) ? doc.data().ranks.slice() : ['👷 Saha Moderatörü','🔨 Usta Moderatör','🏗️ Şantiye Şefi','📋 Saha Amiri','⭐ Baş Moderatör'];
    renderModRankDisplay();
  }catch(e){}
}
function renderModRankDisplay(){
  const box = document.getElementById('modRankDisplay');
  if(currentModRanksList.length===0){
    box.innerHTML = `<div class="hint" style="margin:0;">Henüz rütbe eklenmedi.</div>`;
    return;
  }
  box.innerHTML = currentModRanksList.map((rank, idx)=>`
    <div class="toggle-row" style="margin-bottom:8px;">
      <div class="tlbl">🎖️ ${escapeHtml(rank)}</div>
      <button class="mini-btn" style="background:var(--danger);" data-remove-rank="${idx}">🗑️</button>
    </div>`).join('');
  box.querySelectorAll('[data-remove-rank]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      currentModRanksList.splice(parseInt(btn.dataset.removeRank,10), 1);
      renderModRankDisplay();
      await saveModRanksList();
    });
  });
}
async function saveModRanksList(){
  try{ await db.collection('app_config').doc('moderatorRanks').set({ranks: currentModRanksList}); }
  catch(e){ showToast('Kaydedilemedi: '+(e.message||'')); }
}
document.getElementById('adminRankAddBtn').addEventListener('click', async ()=>{
  const input = document.getElementById('adminRankAddInput');
  const val = input.value.trim();
  if(!val){ showToast('Rütbe adı gir'); return; }
  if(currentModRanksList.includes(val)){ showToast('Bu rütbe zaten listede'); return; }
  currentModRanksList.push(val);
  input.value = '';
  renderModRankDisplay();
  await saveModRanksList();
  showToast('Rütbe eklendi');
});

// ---------- ÜYELİK (KIDEM) RÜTBELERİ ----------
let currentTenureRanksList = [];
function renderTenureRankDisplay(){
  const box = document.getElementById('tenureRankDisplay');
  if(currentTenureRanksList.length===0){
    box.innerHTML = `<div class="hint" style="margin:0;">Henüz rütbe eklenmedi.</div>`;
    return;
  }
  box.innerHTML = currentTenureRanksList.map((r, idx)=>{
    const rangeText = r.maxDays==null ? `${r.minDays}+ gün` : `${r.minDays}–${r.maxDays} gün`;
    return `<div class="toggle-row" style="margin-bottom:8px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:20px;">${escapeHtml(r.icon||'🏅')}</span>
        <div><div class="tlbl">${escapeHtml(r.name)}</div><div class="tsub">${escapeHtml(rangeText)}</div></div>
      </div>
      <button class="mini-btn" style="background:var(--danger);" data-remove-tenure="${idx}">🗑️</button>
    </div>`;
  }).join('');
  box.querySelectorAll('[data-remove-tenure]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      currentTenureRanksList.splice(parseInt(btn.dataset.removeTenure,10), 1);
      renderTenureRankDisplay();
      await saveTenureRanksList();
    });
  });
}
async function loadTenureRankConfig(){
  currentTenureRanksList = DEFAULT_TENURE_RANKS.slice();
  try{
    const doc = await db.collection('app_config').doc('tenureRanks').get();
    if(doc.exists && Array.isArray(doc.data().ranks) && doc.data().ranks.length) currentTenureRanksList = doc.data().ranks.slice();
  }catch(e){}
  renderTenureRankDisplay();
}
async function saveTenureRanksList(){
  currentTenureRanksList.sort((a,b)=> a.minDays - b.minDays);
  try{
    await db.collection('app_config').doc('tenureRanks').set({ranks: currentTenureRanksList});
    dynamicTenureRanks = currentTenureRanksList;
  }catch(e){ showToast('Kaydedilemedi: '+(e.message||'')); }
}
document.getElementById('tenureRankAddRow').addEventListener('click', async ()=>{
  const icon = document.getElementById('trIconInput').value.trim() || '🏅';
  const name = document.getElementById('trNameInput').value.trim();
  const minDays = parseInt(document.getElementById('trMinInput').value, 10) || 0;
  const maxRaw = document.getElementById('trMaxInput').value.trim();
  const maxDays = maxRaw==='' ? null : parseInt(maxRaw, 10);
  if(!name){ showToast('Rütbe adı gir'); return; }
  currentTenureRanksList.push({icon, name, minDays, maxDays});
  document.getElementById('trIconInput').value = '';
  document.getElementById('trNameInput').value = '';
  document.getElementById('trMinInput').value = '';
  document.getElementById('trMaxInput').value = '';
  renderTenureRankDisplay();
  await saveTenureRanksList();
  showToast('Rütbe eklendi');
});

// ---------- IP ENGELLEME ----------
function wireIpBanRows(box){
  box.querySelectorAll('[data-same-ip-uid]').forEach(el=>{
    el.addEventListener('click', ()=> openViewProfile(el.dataset.sameIpUid));
  });
  box.querySelectorAll('[data-unban]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      try{ await db.collection('banned_ips').doc(btn.dataset.unban).delete(); showToast('IP engeli kaldırıldı'); renderBannedIpList(); document.getElementById('adminListOverlay').classList.remove('show'); }
      catch(e){ showToast('Kaldırılamadı: '+(e.message||'')); }
    });
  });
}
let allIpBansCache = [];
async function renderBannedIpList(){
  const box = document.getElementById('adminBannedIpList');
  box.innerHTML = `<div class="hint">Yükleniyor...</div>`;
  try{
    const snap = await db.collection('banned_ips').get();
    if(snap.empty){
      box.innerHTML = `<div class="empty"><div class="icon">🌐</div><div class="msg">Engelli IP yok.</div></div>`;
      return;
    }
    allIpBansCache = await Promise.all(snap.docs.map(async d=>{
      const data = d.data();
      const ip = data.originalIp || d.id;
      let accountsHtml = '';
      try{
        const usersSnap = await db.collection('users').where('lastKnownIp','==',ip).get();
        if(!usersSnap.empty){
          accountsHtml = `<div style="margin-top:8px; font-size:11px;">Bu IP'yi kullanan hesaplar: ` + usersSnap.docs.map(ud=>{
            const op = profileByUid(ud.id);
            return `<span style="font-weight:700; text-decoration:underline; cursor:pointer;" data-same-ip-uid="${escapeHtml(ud.id)}">${escapeHtml(usernameLabel(op))}${rankSuffixHtml(op)}</span>`;
          }).join(', ') + `</div>`;
        }
      }catch(e){}
      const html = `<div class="card" style="padding:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div><div class="tlbl">${escapeHtml(ip)}</div><div class="tsub">${escapeHtml(data.reason||'-')}</div></div>
          <button class="mini-btn" style="background:var(--danger);" data-unban="${escapeHtml(d.id)}">Kaldır</button>
        </div>
        ${accountsHtml}
      </div>`;
      return {id:d.id, ip, reason:data.reason||'', html};
    }));
    box.innerHTML = allIpBansCache.map(r=>r.html).join('');
    wireIpBanRows(box);
  }catch(e){ box.innerHTML = `<div class="hint">Yüklenemedi.</div>`; }
}
document.getElementById('adminManualIpAdd').addEventListener('click', async ()=>{
  const ip = document.getElementById('adminManualIp').value.trim();
  if(!ip){ showToast('IP adresi gir'); return; }
  const affected = await checkIpAffectsStaff(ip);
  if(affected.length>0){
    if(!confirm(`⚠️ DİKKAT: Bu IP adresi şu hesap(lar) tarafından da kullanılıyor:\n${affected.join(', ')}\n\nBu IP'yi engellersen onlar da giriş yapamaz. Yine de devam etmek istiyor musun?`)) return;
  }
  try{
    await db.collection('banned_ips').doc(ip.replace(/[.:]/g,'_')).set({
      originalIp: ip, reason:'Yönetici tarafından manuel eklendi', bannedBy: currentUser.uid, bannedAt: new Date().toISOString()
    });
    showToast('IP engellendi');
    document.getElementById('adminManualIp').value = '';
    renderBannedIpList();
  }catch(e){ showToast('Engellenemedi: '+(e.message||'')); }
});

// ---------- TEHLİKELİ TOPLU İŞLEMLER ----------
let dangerZoneUnlocked = false;
document.getElementById('adminBulkDeactivate').addEventListener('click', async ()=>{
  const confirmText = prompt('TÜM normal kullanıcıları devre dışı bırakmak üzeresin (yönetici/moderatör hesapları hariç tutulacak). Onaylamak için aşağıya tam olarak "HEPSINI DEVRE DISI BIRAK" yaz:');
  if(confirmText !== 'HEPSINI DEVRE DISI BIRAK'){ showToast('İşlem iptal edildi'); return; }
  try{
    const meta = { deactivated:true, deactivatedReason:'Toplu işlem', deactivatedBy:currentUser.uid, deactivatedAt:new Date().toISOString() };
    const targets = allPublicProfiles.filter(u=> u.uid!==currentUser.uid && u.role!=='admin' && u.role!=='moderator');
    const batch = db.batch();
    targets.forEach(u=> batch.set(db.collection('public_profiles').doc(u.uid), meta, {merge:true}));
    await batch.commit();
    for(const u of targets){
      try{ await db.collection('users').doc(u.uid).set({profile: meta}, {merge:true}); }catch(e){}
    }
    await logModAction('bulkDeactivateAll', null, targets.length + ' kullanıcı (yönetim ekibi hariç)');
    showToast(targets.length + ' kullanıcı devre dışı bırakıldı');
    await loadPublicProfiles();
    renderAdminUserList(); renderDeactivatedUserList();
  }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
});
document.getElementById('adminBulkDeletePhotos').addEventListener('click', async ()=>{
  const confirmText = prompt('TÜM kullanıcıların profil fotoğraflarını silmek üzeresin. Onaylamak için aşağıya tam olarak "TUM FOTOGRAFLARI SIL" yaz:');
  if(confirmText !== 'TUM FOTOGRAFLARI SIL'){ showToast('İşlem iptal edildi'); return; }
  try{
    for(const u of allPublicProfiles){
      try{ await db.collection('users').doc(u.uid).set({profile:{photoData: firebase.firestore.FieldValue.delete()}}, {merge:true}); }catch(e){}
    }
    await logModAction('bulkDeletePhotos', null, allPublicProfiles.length + ' kullanıcı');
    showToast('Tüm profil fotoğrafları silindi');
  }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
});
document.getElementById('adminBulkStripMods').addEventListener('click', async ()=>{
  if(!confirm('TÜM moderatörlerin yetkileri acilen sıfırlanacak (moderatörlükleri kalır ama hiçbir yetkileri kalmaz). Emin misin?')) return;
  try{
    const snap = await db.collection('moderators').get();
    const batch = db.batch();
    let count = 0;
    snap.docs.forEach(d=>{
      const cleared = {};
      Object.keys(PERM_LABELS).forEach(k=> cleared[k] = false);
      batch.set(d.ref, cleared, {merge:true});
      count++;
    });
    await batch.commit();
    await logModAction('emergencyStripMods', null, count + ' moderatörün tüm yetkileri durduruldu');
    showToast(count + ' moderatörün yetkileri durduruldu');
    renderModeratorsList();
  }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
});
document.getElementById('adminWipeAllData').addEventListener('click', async ()=>{
  const step1 = confirm('Bu, TÜM kullanıcıların yevmiye/avans/alacak/ödeme kayıtlarını ve notlarını kalıcı olarak siler. Hesaplar kalır ama içindeki veriler yok olur. Devam etmek istiyor musun?');
  if(!step1) return;
  const confirmText = prompt('Bunu onaylamak için tam olarak "TUM VERILERI SIL" yaz. Bu işlem GERİ ALINAMAZ:');
  if(confirmText !== 'TUM VERILERI SIL'){ showToast('İşlem iptal edildi'); return; }
  const confirmText2 = prompt('Son kez soruyorum. Yazdığın "' + confirmText + '" doğru. Kesinleştirmek için "EVET SIL" yaz:');
  if(confirmText2 !== 'EVET SIL'){ showToast('İşlem iptal edildi'); return; }
  try{
    let count = 0;
    for(const u of allPublicProfiles){
      try{ await db.collection('users').doc(u.uid).set({entries:[], notes:[]}, {merge:true}); count++; }catch(e){}
    }
    await logModAction('wipeAllData', null, count + ' kullanıcının verileri temizlendi');
    showToast(count + ' kullanıcının verileri temizlendi');
  }catch(e){ showToast('İşlem başarısız: '+(e.message||'')); }
});
document.getElementById('adminBannerSave').addEventListener('click', async ()=>{
  try{
    const hours = parseInt(document.getElementById('adminBannerDuration').value, 10) || 0;
    const expiresAt = hours>0 ? new Date(Date.now() + hours*3600*1000).toISOString() : null;
    await db.collection('app_config').doc('content').set({
      banner: document.getElementById('adminBannerText').value.trim(),
      bannerExpiresAt: expiresAt
    }, {merge:true});
    showToast('Duyuru bandı kaydedildi');
    loadAppConfig();
  }catch(e){ showToast('Kaydedilemedi: '+(e.message||'')); }
});
document.getElementById('adminBannerClear').addEventListener('click', async ()=>{
  if(!confirm('Duyuru bandını kaldırmak istediğine emin misin?')) return;
  try{
    await db.collection('app_config').doc('content').set({
      banner: '', bannerExpiresAt: null
    }, {merge:true});
    document.getElementById('adminBannerText').value = '';
    document.getElementById('adminBannerDuration').value = '0';
    showToast('Duyuru kaldırıldı');
    loadAppConfig();
  }catch(e){ showToast('Kaldırılamadı: '+(e.message||'')); }
});
let dynamicQuotes = null, homeBanner = '', homeBannerExpiresAt = null;
async function loadAppConfig(){
  try{
    const doc = await db.collection('app_config').doc('content').get();
    if(doc.exists){
      const data = doc.data();
      if(Array.isArray(data.quotes) && data.quotes.length) dynamicQuotes = data.quotes;
      if(Array.isArray(data.professions) && data.professions.length) dynamicProfessions = data.professions;
      if(Array.isArray(data.baseModPermKeys)) dynamicBaseModPerms = data.baseModPermKeys;
      const expired = data.bannerExpiresAt && new Date(data.bannerExpiresAt).getTime() < Date.now();
      homeBanner = expired ? '' : (data.banner || '');
      homeBannerExpiresAt = expired ? null : (data.bannerExpiresAt || null);
    }
  }catch(e){}
  try{
    const tenureDoc = await db.collection('app_config').doc('tenureRanks').get();
    if(tenureDoc.exists && Array.isArray(tenureDoc.data().ranks) && tenureDoc.data().ranks.length){
      dynamicTenureRanks = tenureDoc.data().ranks;
    }
  }catch(e){}
  renderHomeBanner();
  if(document.getElementById('screen-ana').classList.contains('active')) renderQuote();
}
function renderReceivableReminder(all){
  const box = document.getElementById('receivableReminderBox');
  if(!box) return;
  const remaining = all.alacak - all.odeme;
  if(remaining <= 0){ box.style.display = 'none'; return; }
  const alacakEntries = entries.filter(e=>e.type==='alacak').sort((a,b)=> b.date.localeCompare(a.date));
  if(alacakEntries.length===0){ box.style.display = 'none'; return; }
  const lastDate = alacakEntries[0].date;
  const days = daysBetweenInclusive(lastDate, todayStr()) - 1;
  if(days < 10){ box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.textContent = `⏰ ${days} gündür ${fmt(remaining)} alacağın var, unutma!`;
  box.onclick = ()=> switchScreen('istatistik');
}
function renderAvansCard(){
  const box = document.getElementById('avansCard');
  if(!box) return;
  const avansEntries = entries.filter(e=>e.type==='avans').sort((a,b)=> b.date.localeCompare(a.date)).slice(0,5);
  if(avansEntries.length===0){
    box.innerHTML = `<div class="empty"><div class="icon">💵</div><div class="msg">Henüz avans kaydın yok.</div></div>`;
    return;
  }
  box.innerHTML = avansEntries.map(e=>{
    const [y,m,d] = e.date.split('-');
    return `<div class="entry avans" data-id="${escapeHtml(e.id)}">
      <div class="bar"></div>
      <div class="info"><div class="ttype">Avans${e.receiptData?' 📎':''}</div><div class="date">${d}.${m}.${y}</div>${e.site?`<div class="site-tag">${escapeHtml(e.site)}</div>`:''}</div>
      <div class="amount">−${fmt(e.amount)}</div>
    </div>`;
  }).join('');
  box.querySelectorAll('.entry').forEach(row=>{
    row.addEventListener('click', ()=>{
      const entry = entries.find(x=>x.id===row.dataset.id);
      if(entry) openEntryModal(entry);
    });
  });
}
document.getElementById('btnAddAvans').addEventListener('click', ()=>{
  openEntryModal(null, todayStr(), 'avans');
});
function activeMemberRowHtml(u){
  const isOnline = u.lastActive && (Date.now() - new Date(u.lastActive).getTime()) < 120000;
  return `<div class="entry" data-view-member="${escapeHtml(u.uid)}">
      <div style="position:relative; flex-shrink:0;">
        <div style="width:38px;height:38px;border-radius:50%; background:linear-gradient(150deg,var(--asphalt),var(--asphalt-2)); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Manrope'; font-weight:800; font-size:13px;">${escapeHtml(getInitials(u.fullName))}</div>
        ${isOnline?'<span style="position:absolute; bottom:0; right:0; width:11px;height:11px; border-radius:50%; background:#22C55E; border:2px solid var(--paper);"></span>':''}
      </div>
      <div class="info">
        <div class="ttype" style="color:var(--ink); display:flex; align-items:center; gap:6px; flex-wrap:wrap;">${escapeHtml(u.username||'kullanici')}${roleOrTenureBadgeHtml(u, 'font-size:10px; padding:2px 8px;')}</div>
        <div class="note">${escapeHtml(formatLastActive(u.lastActive))}</div>
      </div>
      <div style="flex-shrink:0; font-weight:800; font-size:12px; color:var(--danger);">${(typeof u.quizScore==='number'?u.quizScore:0)} pn</div>
    </div>`;
}
function wireActiveMemberRows(box){
  box.querySelectorAll('[data-view-member]').forEach(row=>{
    row.addEventListener('click', ()=>{
      document.getElementById('adminListOverlay').classList.remove('show');
      openViewProfile(row.dataset.viewMember);
    });
  });
}
function renderActiveMembers(){
  const box = document.getElementById('activeMembersList');
  if(!box) return;
  const active = allPublicProfiles
    .filter(u=> u.uid!==currentUser.uid && !u.deactivated && !u.selfPaused && u.lastActive)
    .sort((a,b)=> new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
  if(active.length===0){
    box.innerHTML = `<div class="empty"><div class="icon">👷</div><div class="msg">Henüz aktif üye yok.</div></div>`;
    return;
  }
  box.innerHTML = active.slice(0,6).map(activeMemberRowHtml).join('');
  wireActiveMemberRows(box);
  const seeAllBtn = document.getElementById('btnSeeAllActiveMembers');
  if(seeAllBtn){
    seeAllBtn.onclick = ()=>{
      openAdminList('Aktif Üyeler', active, {
        searchFn: (u,q)=> (u.fullName||'').toLowerCase().includes(q) || (u.username||'').toLowerCase().includes(q),
        renderRowFn: activeMemberRowHtml,
        wireRows: wireActiveMemberRows
      });
    };
  }
}
let homeBannerCountdownInterval = null;
function formatBannerCountdown(expiresAtIso){
  const msLeft = new Date(expiresAtIso).getTime() - Date.now();
  if(msLeft <= 0) return null;
  const hours = Math.floor(msLeft / 3600000);
  const mins = Math.floor((msLeft % 3600000) / 60000);
  if(hours >= 24){
    const days = Math.floor(hours/24);
    return days + ' gün ' + (hours%24) + ' sa kaldı';
  }
  if(hours >= 1) return hours + ' sa ' + mins + ' dk kaldı';
  return mins + ' dk kaldı';
}
function renderHomeBanner(){
  const el = document.getElementById('homeBannerBox');
  if(!el) return;
  if(homeBannerCountdownInterval){ clearInterval(homeBannerCountdownInterval); homeBannerCountdownInterval = null; }
  if(homeBanner){
    el.style.display='block';
    const renderText = () => {
      let html = '📢 ' + escapeHtml(homeBanner);
      if(homeBannerExpiresAt){
        const countdown = formatBannerCountdown(homeBannerExpiresAt);
        if(countdown) html += ' <span style="color:var(--danger); font-size:10.5px; font-weight:800;">· ' + countdown + '</span>';
        else { homeBanner = ''; renderHomeBanner(); return; }
      }
      el.innerHTML = html;
    };
    renderText();
    if(homeBannerExpiresAt) homeBannerCountdownInterval = setInterval(renderText, 60000);
  }
  else { el.style.display='none'; }
}

// ---------- MESAJLAŞMA ----------
