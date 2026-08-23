// ================= İSİM ŞEHİR ÜLKE: ODA KURMA / LOBİ (Aşama 1) =================
const WG_ROUND_TIME_MAP = { 5: 60, 8: 90, 10: 120 };
const WG_LETTERS = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');
const WG_CATEGORIES = [
  { key:'isim', label:'İsim', icon:'👤', color:'#DBEAFE', iconBg:'#3B82F6' },
  { key:'sehir', label:'Şehir', icon:'🏙️', color:'#CCFBF1', iconBg:'#14B8A6' },
  { key:'ulke', label:'Ülke', icon:'🌍', color:'#DCFCE7', iconBg:'#22C55E' },
  { key:'hayvan', label:'Hayvan', icon:'🦁', color:'#FFEDD5', iconBg:'#F97316' },
  { key:'bitki', label:'Bitki', icon:'🌿', color:'#ECFCCB', iconBg:'#84CC16' },
  { key:'esya', label:'Eşya', icon:'📦', color:'#FEF3C7', iconBg:'#D97706' },
  { key:'meslek', label:'Meslek', icon:'💼', color:'#EDE9FE', iconBg:'#8B5CF6' }
];

let currentWgRoomId = null;
let currentWgRoomUnsub = null;
let wgSelectedInviteUids = [];
let wgSelectedRounds = 8;

document.getElementById('oyunWordGameCard').addEventListener('click', ()=>{
  switchScreen('wg-entry');
});
document.getElementById('btnWgEntryBack').addEventListener('click', ()=> switchScreen('oyunlar'));

document.getElementById('btnWgCreatePrivate').addEventListener('click', ()=>{
  wgSelectedInviteUids = [];
  switchScreen('wg-invite-pick');
  renderWgInvitePicker();
});
document.getElementById('btnWgInvitePickBack').addEventListener('click', ()=> switchScreen('wg-entry'));

let wgInvitePickAllUids = [];
async function renderWgInvitePicker(){
  const box = document.getElementById('wgInvitePickList');
  box.innerHTML = '<div class="hint">Yükleniyor…</div>';
  const friendUids = await getFriendUids(currentUser.uid);
  wgInvitePickAllUids = friendUids;
  if(friendUids.length === 0){
    box.innerHTML = '<div class="empty"><div class="icon">🤝</div><div class="msg">Önce bir arkadaş eklemen lazım.</div></div>';
    return;
  }
  renderWgInvitePickerFiltered('');
}
function renderWgInvitePickerFiltered(searchTerm){
  const box = document.getElementById('wgInvitePickList');
  const term = (searchTerm||'').trim().toLocaleLowerCase('tr');
  const rows = wgInvitePickAllUids.map(uid=>{
    const p = profileByUid(uid);
    const name = p ? getDisplayName(p) : 'Kullanıcı';
    const isOnline = p && p.lastActive && (Date.now() - new Date(p.lastActive).getTime()) < 120000;
    return { uid, p, name, isOnline };
  }).filter(r => !term || r.name.toLocaleLowerCase('tr').includes(term))
    .sort((a,b) => (b.isOnline - a.isOnline) || a.name.localeCompare(b.name, 'tr'));

  if(rows.length === 0){
    box.innerHTML = '<div class="empty"><div class="icon">🔍</div><div class="msg">Eşleşen arkadaş yok.</div></div>';
    return;
  }
  box.innerHTML = rows.map(({uid, p, name, isOnline})=>{
    const inner = (p && p.photoData) ? `<img src="${safeImageSrc(p.photoData)}" style="width:100%;height:100%; object-fit:cover;">` : escapeHtml(getInitials(p?p.fullName:name));
    const checked = wgSelectedInviteUids.includes(uid);
    return `<div class="toggle-row" data-wg-invite-uid="${escapeHtml(uid)}" style="cursor:pointer; ${checked?'background:var(--tint-slate);':''}">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="position:relative; width:40px;height:40px;border-radius:50%; background:${(p&&p.photoData)?'transparent':avatarGradient(uid)}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; overflow:hidden; flex-shrink:0;">${inner}${isOnline?'<span style="position:absolute; bottom:-1px; right:-1px; width:11px;height:11px; border-radius:50%; background:#22C55E; border:2px solid var(--paper);"></span>':''}</div>
        <div class="tlbl">${escapeHtml(name)}</div>
      </div>
      <div style="font-size:20px;">${checked?'✅':'⬜'}</div>
    </div>`;
  }).join('');
  box.querySelectorAll('[data-wg-invite-uid]').forEach(row=>{
    row.addEventListener('click', ()=>{
      const uid = row.dataset.wgInviteUid;
      const idx = wgSelectedInviteUids.indexOf(uid);
      if(idx >= 0){
        wgSelectedInviteUids.splice(idx, 1);
      } else {
        if(wgSelectedInviteUids.length >= 5){ showToast('En fazla 5 arkadaş davet edebilirsin'); return; }
        wgSelectedInviteUids.push(uid);
      }
      renderWgInvitePickerFiltered(document.getElementById('wgInviteSearchInput').value);
    });
  });
}
document.getElementById('wgInviteSearchInput').addEventListener('input', (e)=>{
  renderWgInvitePickerFiltered(e.target.value);
});

function wgFreshRoomData(matchType){
  return {
    hostUid: currentUser.uid,
    status: 'lobby',
    playerUids: [currentUser.uid],
    maxPlayers: 6,
    matchType: matchType,
    totalRounds: null,
    roundTimeSeconds: null,
    currentRound: 0,
    usedLetters: [],
    currentLetter: null,
    letterPickerUid: null,
    roundStartedAt: null,
    roundStopAt: null,
    roundStoppedBy: null,
    scores: { [currentUser.uid]: 0 },
    createdAt: new Date().toISOString()
  };
}

document.getElementById('btnWgSendInvites').addEventListener('click', async ()=>{
  if(wgSelectedInviteUids.length === 0){ showToast('En az 1 arkadaş seçmelisin'); return; }
  try{
    const roomRef = await db.collection('word_game_rooms').add(wgFreshRoomData('private'));
    const myName = (profile && profile.fullName) || 'Bir kullanıcı';
    for(const uid of wgSelectedInviteUids){
      await db.collection('notifications').add({
        toUid: uid, fromUid: currentUser.uid, type:'word_game_invite', roomId: roomRef.id,
        message: '🔤 ' + myName + ' seni İsim Şehir Ülke oynamaya davet etti!',
        read:false, createdAt:new Date().toISOString()
      });
    }
    showToast('Davetler gönderildi 🚀');
    openWgLobby(roomRef.id);
  }catch(e){ console.error(e); showToast('Oda kurulamadı: '+(e.message||'')); }
});

document.getElementById('btnWgJoinRandom').addEventListener('click', async ()=>{
  try{
    const openRoomsSnap = await db.collection('word_game_rooms')
      .where('matchType','==','random')
      .where('status','==','lobby')
      .limit(10).get();
    let joined = false;
    for(const doc of openRoomsSnap.docs){
      const d = doc.data();
      if((d.playerUids||[]).length < (d.maxPlayers||6) && !(d.playerUids||[]).includes(currentUser.uid)){
        try{
          await doc.ref.update({
            playerUids: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
            ['scores.' + currentUser.uid]: 0
          });
          openWgLobby(doc.id);
          joined = true;
          break;
        }catch(e){ continue; } // dolmuş olabilir, sıradaki açık odayı dene
      }
    }
    if(!joined){
      const roomRef = await db.collection('word_game_rooms').add(wgFreshRoomData('random'));
      showToast('Yeni bir oda açtın, başkaları katılabilir 🎲');
      openWgLobby(roomRef.id);
    }
  }catch(e){ console.error(e); showToast('Odaya katılamadı: '+(e.message||'')); }
});

async function joinWordGameRoom(roomId){
  try{
    const doc = await db.collection('word_game_rooms').doc(roomId).get();
    if(!doc.exists){ showToast('Oda bulunamadı, silinmiş olabilir'); return; }
    const d = doc.data();
    if(!(d.playerUids||[]).includes(currentUser.uid)){
      if((d.playerUids||[]).length >= (d.maxPlayers||6)){ showToast('Oda dolu'); return; }
      if(d.status !== 'lobby'){ showToast('Oyun zaten başlamış'); return; }
      await doc.ref.update({
        playerUids: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
        ['scores.' + currentUser.uid]: 0
      });
    }
    document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
    openWgLobby(roomId);
  }catch(e){ console.error(e); showToast('Odaya katılınamadı'); }
}

function wgIsBot(uid){ return typeof uid === 'string' && uid.indexOf('bot_') === 0; }
const WG_BOT_NAMES = { bot_1:'Robot Ahmet 🤖', bot_2:'Robot Zeynep 🤖', bot_3:'Robot Mehmet 🤖', bot_4:'Robot Ayşe 🤖', bot_5:'Robot Can 🤖' };
function wgGetPlayerDisplay(uid){
  if(wgIsBot(uid)){
    return { name: WG_BOT_NAMES[uid] || 'Bot 🤖', inner: '🤖', isPhoto:false, bg:'linear-gradient(145deg,#8B95A6,#5A6472)' };
  }
  const p = profileByUid(uid);
  const name = p ? getDisplayName(p) : 'Kullanıcı';
  const inner = (p && p.photoData) ? `<img src="${safeImageSrc(p.photoData)}" style="width:100%;height:100%; object-fit:cover;">` : escapeHtml(getInitials(p?p.fullName:name));
  return { name, inner, isPhoto: !!(p && p.photoData), bg: (p&&p.photoData)?'transparent':avatarGradient(uid) };
}

function renderWgScoreboard(elementId, d){
  const el = document.getElementById(elementId);
  if(!el) return;
  const entries = (d.playerUids||[]).map(uid=>({ uid, score: (d.scores && d.scores[uid]) || 0 }))
    .sort((a,b)=> b.score - a.score);
  el.innerHTML = entries.map(e=>{
    const disp = wgGetPlayerDisplay(e.uid);
    const isMe = e.uid === currentUser.uid;
    return `<div class="wg-score-chip" style="${isMe?'border-color:#FFD93D;':''}">
      <div class="wg-score-avatar" style="background:${disp.bg};">${disp.inner}</div>
      <div class="wg-score-name">${escapeHtml(disp.name.split(' ')[0])}</div>
      <div class="wg-score-pts">${e.score}</div>
    </div>`;
  }).join('');
}

let wgLastRenderedStatus = null;
let wgCurrentRoomData = null;

function openWgLobby(roomId){
  currentWgRoomId = roomId;
  wgLastRenderedStatus = null;
  document.body.classList.add('wg-open');
  switchScreen('wg-lobby');
  wgLastRenderedStatus = 'lobby';
  if(currentWgRoomUnsub) currentWgRoomUnsub();
  currentWgRoomUnsub = db.collection('word_game_rooms').doc(roomId).onSnapshot(doc=>{
    if(!doc.exists){
      showToast('Oda kapatıldı');
      if(currentWgRoomUnsub){ currentWgRoomUnsub(); currentWgRoomUnsub = null; }
      wgCurrentRoomData = null;
      switchScreen('wg-entry');
      return;
    }
    handleWgRoomUpdate(doc.data());
  }, err=>{ console.error('lobi dinleyici hatası', err); });
}

function handleWgRoomUpdate(d){
  wgCurrentRoomData = d;
  if(d.status === 'lobby'){
    if(wgLastRenderedStatus !== 'lobby'){ switchScreen('wg-lobby'); wgLastRenderedStatus = 'lobby'; }
    renderWgLobby(d);
  } else if(d.status === 'letter_selection'){
    if(wgWritingTimerInterval){ clearInterval(wgWritingTimerInterval); wgWritingTimerInterval = null; }
    if(wgLastRenderedStatus !== 'letter_selection'){ switchScreen('wg-letter'); wgLastRenderedStatus = 'letter_selection'; }
    renderWgLetterSelect(d);
    renderWgScoreboard('wgScoreStripLetter', d);
    maybeRunBotLetterPick(d);
  } else if(d.status === 'writing'){
    if(wgLastRenderedStatus !== 'writing'){
      switchScreen('wg-writing');
      wgLastRenderedStatus = 'writing';
      startWgWritingRound(d);
    }
    renderWgScoreboard('wgScoreStripWriting', d);
    maybeScheduleBotAnswers(d);
  } else if(d.status === 'voting'){
    if(wgWritingTimerInterval){ clearInterval(wgWritingTimerInterval); wgWritingTimerInterval = null; }
    if(wgLastRenderedStatus !== 'voting'){ switchScreen('wg-voting'); wgLastRenderedStatus = 'voting'; }
    renderWgVotingScreen(d);
    renderWgScoreboard('wgScoreStripVoting', d);
    maybeScheduleBotVotes(d);
  } else if(d.status === 'finished'){
    if(wgVotingAnswersUnsub){ wgVotingAnswersUnsub(); wgVotingAnswersUnsub = null; }
    if(wgLastRenderedStatus !== 'finished'){ switchScreen('wg-final'); wgLastRenderedStatus = 'finished'; }
    renderWgFinalResults(d);
  }
}

function renderWgLobby(d){
  const isHost = d.hostUid === currentUser.uid;
  const playersBox = document.getElementById('wgLobbyPlayers');
  playersBox.innerHTML = (d.playerUids||[]).map(uid=>{
    const disp = wgGetPlayerDisplay(uid);
    const isHostBadge = (uid === d.hostUid) ? '<div class="wg-host-chip">👑 KURUCU</div>' : '';
    const score = (d.scores && d.scores[uid]) || 0;
    return `<div style="text-align:center;">
      <div class="wg-avatar-wrap wg-idle">
        <div class="wg-avatar-inner" style="background:${disp.bg};">${disp.inner}</div>
        <div class="wg-online-dot"></div>
        ${score>0?`<div class="wg-points-badge">${score} pts</div>`:''}
      </div>
      <div class="wg-player-name">${escapeHtml(disp.name)}</div>
      ${isHostBadge}
    </div>`;
  }).join('');
  document.getElementById('wgLobbyCountText').textContent = (d.playerUids||[]).length + ' / ' + (d.maxPlayers||6) + ' oyuncu — en az 2 kişiyle başlanabilir';

  const hostSettingsEl = document.getElementById('wgLobbyHostSettings');
  const startBtnEl = document.getElementById('btnWgStartGame');
  const waitingTextEl = document.getElementById('wgLobbyWaitingHostText');

  if(isHost){
    hostSettingsEl.style.display = 'block';
    startBtnEl.style.display = 'block';
    waitingTextEl.style.display = 'none';
    document.querySelectorAll('.wg-round-opt').forEach(btn=>{
      const rounds = parseInt(btn.dataset.rounds, 10);
      btn.classList.toggle('wg-round-active', rounds === wgSelectedRounds);
    });
    const notEnough = (d.playerUids||[]).length < 2;
    startBtnEl.disabled = notEnough;
    startBtnEl.style.opacity = notEnough ? '0.5' : '1';
    const addBotBtn = document.getElementById('btnWgAddBot');
    const roomFull = (d.playerUids||[]).length >= (d.maxPlayers||6);
    addBotBtn.style.display = roomFull ? 'none' : 'block';
  } else {
    hostSettingsEl.style.display = 'none';
    startBtnEl.style.display = 'none';
    waitingTextEl.style.display = 'block';
  }
}

document.getElementById('btnWgAddBot').addEventListener('click', async ()=>{
  if(!currentWgRoomId || !wgCurrentRoomData) return;
  const existingBots = (wgCurrentRoomData.playerUids||[]).filter(wgIsBot);
  const nextBotUid = 'bot_' + (existingBots.length + 1);
  if((wgCurrentRoomData.playerUids||[]).length >= (wgCurrentRoomData.maxPlayers||6)){ showToast('Oda dolu'); return; }
  try{
    await db.collection('word_game_rooms').doc(currentWgRoomId).update({
      playerUids: firebase.firestore.FieldValue.arrayUnion(nextBotUid),
      ['scores.' + nextBotUid]: 0
    });
  }catch(e){ console.error(e); showToast('Bot eklenemedi'); }
});

// ================= İSİM ŞEHİR ÜLKE: BOT KELİME LİSTESİ =================
const WG_BOT_WORDS = {
  A:{isim:['Ahmet','Ayşe','Ali'],sehir:['Adana','Ankara','Antalya'],ulke:['Almanya','Amerika','Arnavutluk'],hayvan:['Ayı','Aslan','At'],bitki:['Ardıç','Akasya'],esya:['Ayna','Anahtar'],meslek:['Avukat','Aşçı']},
  B:{isim:['Berkay','Buse','Burak'],sehir:['Bursa','Bolu','Balıkesir'],ulke:['Belçika','Brezilya','Bulgaristan'],hayvan:['Balık','Baykuş','Böcek'],bitki:['Begonya','Bambu'],esya:['Bardak','Bavul'],meslek:['Berber','Bakkal']},
  C:{isim:['Cem','Canan','Caner'],sehir:['Ceyhan'],ulke:['Cezayir'],hayvan:['Ceylan'],bitki:[],esya:['Cüzdan','Cetvel'],meslek:['Cerrah']},
  Ç:{isim:['Çağla','Çağatay'],sehir:['Çanakkale','Çorum'],ulke:['Çin'],hayvan:['Çakal','Çita'],bitki:['Çınar','Çiçek'],esya:['Çanta','Çatal'],meslek:['Çiftçi','Çoban']},
  D:{isim:['Deniz','Duygu','Doğan'],sehir:['Diyarbakır','Denizli'],ulke:['Danimarka'],hayvan:['Deve','Domuz'],bitki:['Defne'],esya:['Defter','Dolap'],meslek:['Doktor']},
  E:{isim:['Emre','Ebru','Ege'],sehir:['Edirne','Erzurum','Elazığ'],ulke:['Endonezya','Ekvador'],hayvan:['Eşek'],bitki:['Erik ağacı'],esya:['Eldiven'],meslek:['Eczacı','Elektrikçi']},
  F:{isim:['Fatma','Furkan'],sehir:['Fethiye'],ulke:['Fransa','Finlandiya'],hayvan:['Fil','Fare'],bitki:['Fesleğen'],esya:['Fincan'],meslek:['Fotoğrafçı','Futbolcu']},
  G:{isim:['Gizem','Gökhan'],sehir:['Gaziantep','Giresun'],ulke:['Gürcistan','Guatemala'],hayvan:['Gergedan','Güvercin'],bitki:['Gül','Gelincik'],esya:['Gözlük'],meslek:['Gazeteci','Garson']},
  Ğ:{isim:[],sehir:[],ulke:[],hayvan:[],bitki:[],esya:[],meslek:[]},
  H:{isim:['Hakan','Hale'],sehir:['Hatay'],ulke:['Hollanda','Hindistan'],hayvan:['Horoz','Hamster'],bitki:[],esya:['Halı'],meslek:['Hemşire','Hakim']},
  I:{isim:['Işık'],sehir:['Isparta'],ulke:[],hayvan:['Iguana'],bitki:['Ispanak'],esya:['Iskarpin'],meslek:[]},
  İ:{isim:['İrem','İlker'],sehir:['İstanbul','İzmir'],ulke:['İtalya','İngiltere'],hayvan:['İnek'],bitki:[],esya:['İp'],meslek:['İtfaiyeci','İşçi']},
  J:{isim:[],sehir:[],ulke:['Jamaika'],hayvan:['Jaguar'],bitki:[],esya:[],meslek:['Jeolog','Jandarma']},
  K:{isim:['Kemal','Kerem'],sehir:['Kayseri','Konya','Kastamonu'],ulke:['Kanada','Kenya'],hayvan:['Kedi','Kaplan','Kurt'],bitki:['Karanfil'],esya:['Kalem','Kitap'],meslek:['Kuaför','Kaptan']},
  L:{isim:['Leyla','Levent'],sehir:[],ulke:['Lübnan','Letonya'],hayvan:['Leopar'],bitki:['Lale'],esya:['Lamba'],meslek:['Lokantacı']},
  M:{isim:['Mehmet','Merve'],sehir:['Mersin','Manisa','Muğla'],ulke:['Meksika','Mısır'],hayvan:['Maymun','Martı'],bitki:['Menekşe'],esya:['Masa'],meslek:['Mühendis','Muhasebeci']},
  N:{isim:['Nihan','Naz'],sehir:['Nevşehir','Niğde'],ulke:['Norveç'],hayvan:[],bitki:['Nergis'],esya:['Not defteri'],meslek:['Noter']},
  O:{isim:['Onur','Oya'],sehir:['Ordu'],ulke:['Özbekistan'],hayvan:['Ördek'],bitki:['Orkide'],esya:['Ocak'],meslek:['Oyuncu']},
  Ö:{isim:['Ömer','Özge'],sehir:[],ulke:[],hayvan:[],bitki:[],esya:['Örtü'],meslek:['Öğretmen']},
  P:{isim:['Pelin','Poyraz'],sehir:[],ulke:['Portekiz','Peru'],hayvan:['Papağan','Panda'],bitki:['Papatya'],esya:['Peçete'],meslek:['Pilot','Polis']},
  R:{isim:['Rüya','Recep'],sehir:['Rize'],ulke:['Rusya','Romanya'],hayvan:['Rakun'],bitki:[],esya:['Radyo'],meslek:['Ressam']},
  S:{isim:['Selin','Serkan'],sehir:['Sivas','Samsun'],ulke:['Suriye'],hayvan:['Serçe','Sincap'],bitki:['Sarmaşık'],esya:['Sandalye'],meslek:['Satıcı','Subay']},
  Ş:{isim:['Şeyma','Şevket'],sehir:['Şanlıurfa','Şırnak'],ulke:[],hayvan:['Şahin'],bitki:[],esya:['Şemsiye'],meslek:['Şoför']},
  T:{isim:['Talha','Tuğba'],sehir:['Trabzon','Tokat'],ulke:['Tayland','Tunus'],hayvan:['Tavşan','Tilki'],bitki:['Turp'],esya:['Televizyon'],meslek:['Terzi','Tercüman']},
  U:{isim:['Utku'],sehir:['Uşak'],ulke:['Uganda','Ukrayna'],hayvan:['Uğur böceği'],bitki:[],esya:['Uçurtma'],meslek:[]},
  Ü:{isim:['Ülkü'],sehir:[],ulke:['Ürdün'],hayvan:[],bitki:['Üzüm'],esya:['Ütü'],meslek:[]},
  V:{isim:['Volkan','Vildan'],sehir:['Van'],ulke:['Venezuela','Vietnam'],hayvan:['Vaşak'],bitki:[],esya:['Vazo'],meslek:['Veteriner']},
  Y:{isim:['Yusuf','Yasemin'],sehir:['Yozgat'],ulke:['Yunanistan'],hayvan:['Yılan','Yunus'],bitki:['Yasemin'],esya:['Yastık'],meslek:['Yazar']},
  Z:{isim:['Zeynep','Zafer'],sehir:['Zonguldak'],ulke:['Zambiya'],hayvan:['Zebra','Zürafa'],bitki:[],esya:['Zil'],meslek:['Zabıta']}
};
function wgPickBotWord(letter, categoryKey, excludeSet){
  const table = WG_BOT_WORDS[letter];
  if(!table) return '';
  const list = table[categoryKey] || [];
  const candidates = list.filter(w => !excludeSet.has(w.toLocaleLowerCase('tr')));
  if(candidates.length === 0) return '';
  return candidates[Math.floor(Math.random()*candidates.length)];
}

// ================= İSİM ŞEHİR ÜLKE: HARF SEÇİMİ =================
function renderWgLetterSelect(d){
  const isPicker = d.letterPickerUid === currentUser.uid;
  const pickerDisp = wgGetPlayerDisplay(d.letterPickerUid);
  document.getElementById('wgLetterPickerText').textContent = isPicker ? 'Bir harf seç!' : (pickerDisp.name + ' harf seçiyor…');
  document.getElementById('wgLetterRoundText').textContent = 'Tur ' + d.currentRound + ' / ' + d.totalRounds;
  const grid = document.getElementById('wgLetterGrid');
  const used = d.usedLetters || [];
  grid.innerHTML = WG_LETTERS.map(L=>{
    const isUsed = used.includes(L);
    const disabled = isUsed || !isPicker;
    return `<button class="wg-letter-tile wg-letter-btn" data-letter="${L}" ${disabled?'disabled':''} style="${(!isUsed && !isPicker)?'opacity:0.55; text-decoration:none;':''}">${L}</button>`;
  }).join('');
  if(isPicker){
    grid.querySelectorAll('.wg-letter-btn:not([disabled])').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const letter = btn.dataset.letter;
        try{
          await db.collection('word_game_rooms').doc(currentWgRoomId).update({
            currentLetter: letter,
            usedLetters: firebase.firestore.FieldValue.arrayUnion(letter),
            status: 'writing',
            roundStartedAt: new Date().toISOString(),
            roundStopAt: null,
            roundStoppedBy: null
          });
        }catch(e){ console.error(e); showToast('Harf seçilemedi'); }
      });
    });
  }
}

let wgBotActionScheduledFor = null;
let wgBotAnswersScheduledFor = null;

function maybeRunBotLetterPick(d){
  if(!currentWgRoomId || !wgIsBot(d.letterPickerUid)) return;
  if(d.hostUid !== currentUser.uid) return; // botların hamlesini yalnızca host simüle eder
  const key = d.currentRound + '_letter';
  if(wgBotActionScheduledFor === key) return;
  wgBotActionScheduledFor = key;
  const used = d.usedLetters || [];
  const remaining = WG_LETTERS.filter(L => !used.includes(L));
  if(remaining.length === 0) return;
  setTimeout(async ()=>{
    const letter = remaining[Math.floor(Math.random()*remaining.length)];
    try{
      await db.collection('word_game_rooms').doc(currentWgRoomId).update({
        currentLetter: letter,
        usedLetters: firebase.firestore.FieldValue.arrayUnion(letter),
        status: 'writing',
        roundStartedAt: new Date().toISOString(),
        roundStopAt: null,
        roundStoppedBy: null
      });
    }catch(e){ console.error('bot harf seçemedi', e); }
  }, 1200 + Math.random()*1000);
}

function maybeScheduleBotAnswers(d){
  if(!currentWgRoomId || d.hostUid !== currentUser.uid) return; // botlar adına yalnızca host cevap gönderir
  const bots = (d.playerUids||[]).filter(wgIsBot);
  if(bots.length === 0) return;
  const key = d.currentRound + '_answers';
  if(wgBotAnswersScheduledFor === key) return;
  wgBotAnswersScheduledFor = key;
  bots.forEach(botUid=>{
    const delay = 2000 + Math.random()*Math.max(3000, (d.roundTimeSeconds||90)*1000*0.5);
    setTimeout(async ()=>{
      try{
        const freshDoc = await db.collection('word_game_rooms').doc(currentWgRoomId).get();
        const freshD = freshDoc.data();
        if(!freshD || freshD.status !== 'writing' || freshD.currentRound !== d.currentRound) return;
        const usedWords = new Set();
        const answers = {};
        WG_CATEGORIES.forEach(c=>{
          const w = wgPickBotWord(d.currentLetter, c.key, usedWords);
          answers[c.key] = w;
          if(w) usedWords.add(w.toLocaleLowerCase('tr'));
        });
        await db.collection('word_game_rooms').doc(currentWgRoomId).collection('round_answers')
          .doc(botUid + '_' + d.currentRound).set({
            uid: botUid, round: d.currentRound, letter: d.currentLetter,
            answers, votes: {}, submittedAt: new Date().toISOString()
          });
      }catch(e){ console.error('bot cevabı gönderilemedi', e); }
    }, delay);
  });
}

// ================= İSİM ŞEHİR ÜLKE: YAZMA EKRANI =================
let wgWritingAnswers = {};
let wgWritingSubmitted = false;
let wgWritingTimerInterval = null;
let wgWritingCurrentIndex = 0;

function startWgWritingRound(d){
  wgWritingAnswers = {};
  wgWritingSubmitted = false;
  wgWritingCurrentIndex = 0;
  document.getElementById('wgWritingRoundNum').textContent = d.currentRound;
  document.getElementById('wgWritingTotalRounds').textContent = d.totalRounds;
  document.getElementById('wgWritingLetter').textContent = d.currentLetter;
  document.getElementById('wgWritingStopInfo').style.display = 'none';
  const coinEl = document.getElementById('wgTimerCoin');
  if(coinEl) coinEl.classList.remove('wg-timer-urgent');
  renderWgWritingCategoryCard();
  if(wgWritingTimerInterval) clearInterval(wgWritingTimerInterval);
  wgWritingTimerInterval = setInterval(tickWgWritingTimer, 250);
  tickWgWritingTimer();
}

function renderWgWritingCategoryCard(){
  const d = wgCurrentRoomData;
  if(!d) return;
  const box = document.getElementById('wgWritingCategories');
  const idx = wgWritingCurrentIndex;
  const c = WG_CATEGORIES[idx];
  const isLast = idx === WG_CATEGORIES.length - 1;
  const dots = WG_CATEGORIES.map((cc,i)=>{
    const answered = !!(wgWritingAnswers[cc.key] && wgWritingAnswers[cc.key].trim());
    const isCurrent = i === idx;
    const color = isCurrent ? '#FFD93D' : (answered ? '#34D399' : 'rgba(255,255,255,0.22)');
    return `<div style="width:${isCurrent?20:8}px; height:8px; border-radius:5px; background:${color}; transition:width .2s ease;"></div>`;
  }).join('');

  box.innerHTML = `
    <div style="display:flex; gap:5px; justify-content:center; margin-bottom:20px;">${dots}</div>
    <div class="wg-cat-row" style="background:${c.color}; flex-direction:column; align-items:stretch; padding:24px 18px; min-height:150px; justify-content:center;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
        <div class="wg-cat-icon" style="background:${c.iconBg};">${c.icon}</div>
        <div>
          <div class="wg-cat-label" style="color:${c.iconBg}; font-size:12px;">${c.label}</div>
          <div style="font-size:10.5px; color:${c.iconBg}; opacity:0.75; font-weight:700;">${idx+1} / ${WG_CATEGORIES.length}</div>
        </div>
      </div>
      <input type="text" id="wgAnswerActive" class="wg-cat-input" style="font-size:23px; padding:8px 0;" placeholder="${d.currentLetter} ile başlayan ${c.label.toLocaleLowerCase('tr')}..." autocomplete="off">
    </div>
    <div style="display:flex; gap:10px; margin-top:16px;">
      ${idx>0?`<button id="btnWgCatPrev" style="flex:1; padding:14px; border-radius:14px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); color:#fff; font-weight:800; cursor:pointer;">← Geri</button>`:''}
      ${!isLast?`<button id="btnWgCatNext" style="flex:2; padding:14px; border-radius:14px; border:none; background:linear-gradient(145deg,#FFEA9E,#FFD93D,#FFA500); color:#4A2E00; font-weight:900; cursor:pointer; box-shadow:0 4px 14px rgba(255,169,0,0.35);">İleri →</button>`:`<button id="btnWgCatStop" style="flex:2; padding:14px; border-radius:14px; border:none; background:linear-gradient(145deg,#FF5A5F,#DC2626); color:#fff; font-weight:900; letter-spacing:0.5px; cursor:pointer; box-shadow:0 4px 14px rgba(220,38,38,0.4);">🛑 DUR!</button>`}
    </div>`;

  const activeInput = document.getElementById('wgAnswerActive');
  activeInput.value = wgWritingAnswers[c.key] || '';
  activeInput.addEventListener('input', ()=>{ wgWritingAnswers[c.key] = activeInput.value; });
  activeInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){ e.preventDefault(); const nb = document.getElementById('btnWgCatNext'); if(nb) nb.click(); else activeInput.blur(); }
  });
  setTimeout(()=>{ try{ activeInput.focus(); }catch(e){} }, 60);

  const prevBtn = document.getElementById('btnWgCatPrev');
  if(prevBtn) prevBtn.addEventListener('click', ()=>{ wgWritingCurrentIndex--; renderWgWritingCategoryCard(); });
  const nextBtn = document.getElementById('btnWgCatNext');
  if(nextBtn) nextBtn.addEventListener('click', ()=>{ wgWritingCurrentIndex++; renderWgWritingCategoryCard(); });
  const catStopBtn = document.getElementById('btnWgCatStop');
  if(catStopBtn) catStopBtn.addEventListener('click', ()=>{ const mainStop = document.getElementById('btnWgStop'); if(mainStop) mainStop.click(); });
}

function tickWgWritingTimer(){
  if(!wgCurrentRoomData || wgCurrentRoomData.status !== 'writing') return;
  const d = wgCurrentRoomData;
  const startedAt = new Date(d.roundStartedAt).getTime();
  const fullDeadline = startedAt + (d.roundTimeSeconds||90)*1000;
  let deadline = fullDeadline;
  if(d.roundStopAt){
    const stopDeadline = new Date(d.roundStopAt).getTime() + 10000;
    deadline = Math.min(fullDeadline, stopDeadline);
    const infoEl = document.getElementById('wgWritingStopInfo');
    if(infoEl){
      const stopperDisp = wgGetPlayerDisplay(d.roundStoppedBy);
      const stopperName = (d.roundStoppedBy === currentUser.uid) ? 'Sen' : stopperDisp.name;
      infoEl.style.display = 'block';
      infoEl.textContent = '🛑 ' + stopperName + ' DUR dedi!';
    }
  }
  const remainingMs = deadline - Date.now();
  const remainingSec = Math.max(0, Math.ceil(remainingMs/1000));
  const cdEl = document.getElementById('wgWritingCountdown');
  if(cdEl) cdEl.textContent = remainingSec + 's';
  const coinEl = document.getElementById('wgTimerCoin');
  if(coinEl) coinEl.classList.toggle('wg-timer-urgent', remainingSec <= 10);

  if(remainingMs <= 0 && !wgWritingSubmitted){
    wgWritingSubmitted = true;
    submitWgAnswers(d);
  }
}

async function submitWgAnswers(d){
  if(wgWritingTimerInterval){ clearInterval(wgWritingTimerInterval); wgWritingTimerInterval = null; }
  try{
    await db.collection('word_game_rooms').doc(currentWgRoomId).collection('round_answers')
      .doc(currentUser.uid + '_' + d.currentRound).set({
        uid: currentUser.uid, round: d.currentRound, letter: d.currentLetter,
        answers: Object.assign({}, wgWritingAnswers), votes: {}, submittedAt: new Date().toISOString()
      });
  }catch(e){ console.error('cevap gönderilemedi', e); }
  try{
    await db.collection('word_game_rooms').doc(currentWgRoomId).update({ status: 'voting' });
  }catch(e){ console.error('oylamaya geçilemedi', e); }
}

document.getElementById('btnWgStop').addEventListener('click', async ()=>{
  if(!currentWgRoomId || !wgCurrentRoomData) return;
  if(wgCurrentRoomData.roundStopAt) return;
  try{
    await db.collection('word_game_rooms').doc(currentWgRoomId).update({
      roundStopAt: new Date().toISOString(),
      roundStoppedBy: currentUser.uid
    });
  }catch(e){ console.error(e); showToast('DUR gönderilemedi'); }
});

function wgLeaveGameToMenu(){
  if(currentWgRoomUnsub){ currentWgRoomUnsub(); currentWgRoomUnsub = null; }
  if(wgWritingTimerInterval){ clearInterval(wgWritingTimerInterval); wgWritingTimerInterval = null; }
  if(wgVotingAnswersUnsub){ wgVotingAnswersUnsub(); wgVotingAnswersUnsub = null; }
  if(wgVoiceActive) stopWgVoice();
  wgCurrentRoomData = null;
  currentWgRoomId = null;
  switchScreen('oyunlar');
}
document.getElementById('btnWgLetterBack').addEventListener('click', wgLeaveGameToMenu);
document.getElementById('btnWgWritingBack').addEventListener('click', wgLeaveGameToMenu);
document.getElementById('btnWgVotingBack').addEventListener('click', wgLeaveGameToMenu);
document.getElementById('btnWgFinalBack').addEventListener('click', wgLeaveGameToMenu);

// ================= İSİM ŞEHİR ÜLKE: OYLAMA EKRANI =================
let wgVotingAnswersUnsub = null;
let wgVotingAnswersData = [];
let wgBotVotesScheduledFor = null;

function renderWgVotingScreen(d){
  document.getElementById('wgVotingRoundNum').textContent = d.currentRound;
  document.getElementById('wgVotingTotalRounds').textContent = d.totalRounds;
  document.getElementById('wgVotingLetter').textContent = d.currentLetter;

  const isHost = d.hostUid === currentUser.uid;
  const finishBtn = document.getElementById('btnWgFinishVoting');
  finishBtn.style.display = isHost ? 'block' : 'none';
  finishBtn.disabled = false;
  finishBtn.textContent = 'Turu Bitir ve Puanla ✅';
  document.getElementById('wgVotingWaitingHost').style.display = isHost ? 'none' : 'block';

  if(wgVotingAnswersUnsub) wgVotingAnswersUnsub();
  wgVotingAnswersUnsub = db.collection('word_game_rooms').doc(currentWgRoomId)
    .collection('round_answers').where('round','==', d.currentRound)
    .onSnapshot(snap=>{
      wgVotingAnswersData = snap.docs.map(doc=>doc.data());
      renderWgVotingCategories(d);
    }, err=>{ console.error('oylama verisi alınamadı', err); });
}

function renderWgVotingCategories(d){
  const box = document.getElementById('wgVotingCategories');
  const answersByUid = {};
  wgVotingAnswersData.forEach(ans=>{ answersByUid[ans.uid] = ans; });
  const orderedUids = (d.playerUids||[]).filter(uid => answersByUid[uid]);

  box.innerHTML = orderedUids.map(uid=>{
    const ans = answersByUid[uid];
    const disp = wgGetPlayerDisplay(uid);
    const isOwn = uid === currentUser.uid;
    const rows = WG_CATEGORIES.map(c=>{
      const raw = (ans.answers && ans.answers[c.key]) || '';
      const trimmed = raw.trim();
      const votesForCat = (ans.votes && ans.votes[c.key]) || {};
      const myVote = votesForCat[currentUser.uid];
      let yes = 0, no = 0;
      Object.keys(votesForCat).forEach(v=>{ if(v === uid) return; if(votesForCat[v]) yes++; else no++; });
      const displayText = trimmed || '(boş)';
      const wrongLetter = !!trimmed && trimmed.charAt(0).toLocaleUpperCase('tr') !== d.currentLetter;
      const canVote = !isOwn && !!trimmed;
      return `<div style="display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.08);">
        <div class="wg-cat-icon" style="width:26px;height:26px; font-size:12px; background:${c.iconBg}; flex-shrink:0;">${c.icon}</div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:9px; color:rgba(255,255,255,0.5); font-weight:700;">${c.label}</div>
          <div style="font-size:14px; font-weight:800; color:${wrongLetter?'#FF6B6B':(trimmed?'#fff':'rgba(255,255,255,0.35)')}; ${wrongLetter?'text-decoration:line-through;':''}">${escapeHtml(displayText)}</div>
        </div>
        ${canVote ? `
          <button class="wg-vote-btn" data-uid="${escapeHtml(uid)}" data-cat="${c.key}" data-val="1" style="width:30px;height:30px; border-radius:9px; border:none; font-size:14px; cursor:pointer; background:${myVote===true?'#22C55E':'rgba(255,255,255,0.1)'}; color:#fff; flex-shrink:0;">✓</button>
          <button class="wg-vote-btn" data-uid="${escapeHtml(uid)}" data-cat="${c.key}" data-val="0" style="width:30px;height:30px; border-radius:9px; border:none; font-size:14px; cursor:pointer; background:${myVote===false?'#DC2626':'rgba(255,255,255,0.1)'}; color:#fff; flex-shrink:0;">✗</button>
          <div style="font-size:9px; color:rgba(255,255,255,0.4); min-width:24px; text-align:center; flex-shrink:0;">${yes}/${no}</div>
        ` : ''}
      </div>`;
    }).join('');
    return `<div class="wg-glow-card" style="padding:14px 16px; margin-bottom:12px; ${isOwn?'border-color:#FFD93D;':''}">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
        <div style="width:34px;height:34px;border-radius:50%; background:${disp.bg}; display:flex; align-items:center; justify-content:center; font-size:14px; color:#fff; overflow:hidden; flex-shrink:0;">${disp.inner}</div>
        <div style="color:#fff; font-weight:800; font-size:14px;">${escapeHtml(disp.name)}</div>
        ${isOwn?'<div style="margin-left:auto; font-size:9px; color:#FFD93D; font-weight:800;">SEN</div>':''}
      </div>
      ${rows}
    </div>`;
  }).join('');

  box.querySelectorAll('.wg-vote-btn').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const uid = btn.dataset.uid, cat = btn.dataset.cat, val = (btn.dataset.val === '1');
      // Önce yerel veriyi güncelleyip ekranı hemen yeniden çiziyoruz — Firestore'un
      // geri dönüşünü beklemek gecikme hissi/"hiçbir şey olmadı" izlenimi yaratıyordu.
      const ans = wgVotingAnswersData.find(a => a.uid === uid);
      if(ans){
        if(!ans.votes) ans.votes = {};
        if(!ans.votes[cat]) ans.votes[cat] = {};
        ans.votes[cat][currentUser.uid] = val;
        renderWgVotingCategories(d);
      }
      try{
        await db.collection('word_game_rooms').doc(currentWgRoomId)
          .collection('round_answers').doc(uid + '_' + d.currentRound)
          .update({ ['votes.' + cat + '.' + currentUser.uid]: val });
      }catch(e){ console.error('oy verilemedi', e); showToast('Oy kaydedilemedi, tekrar dene'); }
    });
  });
}

function maybeScheduleBotVotes(d){
  if(!currentWgRoomId || d.hostUid !== currentUser.uid) return;
  const bots = (d.playerUids||[]).filter(wgIsBot);
  if(bots.length === 0) return;
  const key = d.currentRound + '_votes';
  if(wgBotVotesScheduledFor === key) return;
  wgBotVotesScheduledFor = key;
  setTimeout(async ()=>{
    try{
      const snap = await db.collection('word_game_rooms').doc(currentWgRoomId)
        .collection('round_answers').where('round','==', d.currentRound).get();
      for(const doc of snap.docs){
        const ans = doc.data();
        const updateData = {};
        bots.forEach(bot=>{
          if(ans.uid === bot) return; // kendi cevabına oy vermez
          WG_CATEGORIES.forEach(c=>{
            const raw = (ans.answers && ans.answers[c.key]) || '';
            const trimmed = raw.trim();
            const firstChar = trimmed.charAt(0).toLocaleUpperCase('tr');
            const accept = !!trimmed && firstChar === d.currentLetter;
            updateData['votes.' + c.key + '.' + bot] = accept;
          });
        });
        if(Object.keys(updateData).length > 0){ await doc.ref.update(updateData); }
      }
    }catch(e){ console.error('bot oylayamadı', e); }
  }, 2500 + Math.random()*2000);
}

// ================= İSİM ŞEHİR ÜLKE: PUANLAMA + TUR İLERLETME =================
async function computeAndAdvanceWgRound(d){
  try{
    const answersSnap = await db.collection('word_game_rooms').doc(currentWgRoomId)
      .collection('round_answers').where('round','==', d.currentRound).get();
    const roundPoints = {};
    (d.playerUids||[]).forEach(uid=>{ roundPoints[uid] = 0; });

    WG_CATEGORIES.forEach(c=>{
      const acceptedByUid = {};
      answersSnap.docs.forEach(doc=>{
        const ans = doc.data();
        const raw = (ans.answers && ans.answers[c.key]) || '';
        const trimmed = raw.trim();
        if(!trimmed) return;
        const firstChar = trimmed.charAt(0).toLocaleUpperCase('tr');
        if(firstChar !== d.currentLetter) return; // yanlış harf, otomatik red
        const votesForCat = (ans.votes && ans.votes[c.key]) || {};
        let yes = 0, no = 0;
        Object.keys(votesForCat).forEach(voterUid=>{
          if(voterUid === ans.uid) return;
          if(votesForCat[voterUid]) yes++; else no++;
        });
        if(no > yes) return; // oy çoğunluğu reddetti
        acceptedByUid[ans.uid] = trimmed.toLocaleLowerCase('tr');
      });
      const groups = {};
      Object.keys(acceptedByUid).forEach(uid=>{
        const norm = acceptedByUid[uid];
        if(!groups[norm]) groups[norm] = [];
        groups[norm].push(uid);
      });
      Object.values(groups).forEach(uidsInGroup=>{
        const pts = uidsInGroup.length === 1 ? 10 : 5;
        uidsInGroup.forEach(uid=>{ roundPoints[uid] = (roundPoints[uid]||0) + pts; });
      });
    });

    const newScores = Object.assign({}, d.scores||{});
    Object.keys(roundPoints).forEach(uid=>{ newScores[uid] = (newScores[uid]||0) + roundPoints[uid]; });

    const isLastRound = d.currentRound >= d.totalRounds;
    if(isLastRound){
      await db.collection('word_game_rooms').doc(currentWgRoomId).update({ scores: newScores, status: 'finished' });
    } else {
      const pickerIdx = (d.playerUids||[]).indexOf(d.letterPickerUid);
      const nextPickerUid = (d.playerUids||[])[(pickerIdx + 1) % (d.playerUids||[]).length];
      await db.collection('word_game_rooms').doc(currentWgRoomId).update({
        scores: newScores,
        currentRound: d.currentRound + 1,
        letterPickerUid: nextPickerUid,
        status: 'letter_selection',
        currentLetter: null,
        roundStartedAt: null,
        roundStopAt: null,
        roundStoppedBy: null
      });
    }
    const summaryLines = (d.playerUids||[]).filter(uid=>roundPoints[uid]>0).map(uid=>{
      const disp = wgGetPlayerDisplay(uid);
      return disp.name + ' +' + roundPoints[uid];
    }).join(' · ');
    showToast('Tur bitti! ' + (summaryLines || 'Kimse puan alamadı 😅'));
  }catch(e){
    console.error('tur puanlanamadı', e);
    showToast('Puanlama başarısız, tekrar dene');
    const btn = document.getElementById('btnWgFinishVoting');
    if(btn){ btn.disabled = false; btn.textContent = 'Turu Bitir ve Puanla ✅'; }
  }
}

document.getElementById('btnWgFinishVoting').addEventListener('click', async ()=>{
  if(!wgCurrentRoomData) return;
  const btn = document.getElementById('btnWgFinishVoting');
  btn.disabled = true;
  btn.textContent = 'Hesaplanıyor…';
  await computeAndAdvanceWgRound(wgCurrentRoomData);
});

// ================= İSİM ŞEHİR ÜLKE: GRUP SESLİ SOHBET (mesh, 2-6 kişi) =================
// Her oyuncu çifti için ayrı bir WebRTC bağlantısı kurulur (mesh). Kim teklif eden
// olacağı iki tarafın da aynı sonuca varması için uid karşılaştırmasıyla belirlenir —
// satrançtaki 1v1 sesli sohbetle aynı prensip, sadece burada N-1 bağlantı aynı anda kurulur.
let wgVoiceActive = false;
let wgVoiceLocalStream = null;
let wgVoicePeers = {}; // otherUid -> { pc, audioEl, role, appliedRemoteCandidates, unsub }

function wgVoicePairId(uidA, uidB){ return [uidA, uidB].sort().join('__'); }

async function toggleWgVoice(){
  if(wgVoiceActive){ stopWgVoice(); return; }
  if(!currentWgRoomId || !wgCurrentRoomData){ showToast('Aktif bir oda yok'); return; }
  setWgVoiceStatus('Mikrofon izni isteniyor…');
  try{
    wgVoiceLocalStream = await navigator.mediaDevices.getUserMedia({ audio:true, video:false });
  }catch(e){
    showToast('Mikrofon izni verilmedi');
    setWgVoiceStatus('');
    return;
  }
  wgVoiceActive = true;
  updateWgVoiceButtonUI();
  setWgVoiceStatus('Bağlanıyor…');
  const others = (wgCurrentRoomData.playerUids||[]).filter(uid => uid !== currentUser.uid && !wgIsBot(uid));
  if(others.length === 0){ setWgVoiceStatus('Odada başka gerçek oyuncu yok'); return; }
  others.forEach(uid => connectWgVoicePeer(uid));
}

function connectWgVoicePeer(otherUid){
  if(wgVoicePeers[otherUid]) return;
  const role = (currentUser.uid < otherUid) ? 'offerer' : 'answerer';
  const pairId = wgVoicePairId(currentUser.uid, otherUid);
  const sigRef = db.collection('word_game_rooms').doc(currentWgRoomId).collection('voice_signals').doc(pairId);

  const pc = new RTCPeerConnection({ iceServers: CALL_ICE_SERVERS });
  wgVoiceLocalStream.getTracks().forEach(t => pc.addTrack(t, wgVoiceLocalStream));
  const audioEl = document.createElement('audio');
  audioEl.autoplay = true; audioEl.setAttribute('playsinline','');
  audioEl.id = 'wgVoiceAudio_' + otherUid;
  document.body.appendChild(audioEl);
  pc.ontrack = (event) => { audioEl.srcObject = event.streams[0]; setWgVoiceStatus('Bağlandı ✅'); };

  const myCandField = (role === 'offerer') ? 'callerCandidates' : 'calleeCandidates';
  const remoteCandField = (role === 'offerer') ? 'calleeCandidates' : 'callerCandidates';

  pc.onicecandidate = (event) => {
    if(event.candidate){
      sigRef.set({ [myCandField]: firebase.firestore.FieldValue.arrayUnion(event.candidate.toJSON()) }, { merge:true }).catch(e=>console.error('wg ses candidate yazılamadı', e));
    }
  };
  pc.oniceconnectionstatechange = () => {
    console.log('wg voice ICE (' + otherUid + '):', pc.iceConnectionState);
  };

  const peerObj = { pc, audioEl, role, appliedRemoteCandidates: 0, unsub: null };
  wgVoicePeers[otherUid] = peerObj;

  (async ()=>{
    try{
      if(role === 'offerer'){
        // Önce olası eski sinyalleri temizle — bunu description yazmadan AYRI yapıyoruz
        // ki hemen ardından hızlı gelmeye başlayacak ICE candidate'ları silinmesin
        // (satranç sesli sohbetinde bulduğumuz yarış durumu hatasının aynısı burada da geçerli).
        await sigRef.set({ offer: null, answer: null, callerCandidates: [], calleeCandidates: [] }, { merge:true });
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sigRef.set({ offer: { type: offer.type, sdp: offer.sdp } }, { merge:true });
      }
      peerObj.unsub = sigRef.onSnapshot(async (docSnap)=>{
        if(!wgVoicePeers[otherUid]) return;
        const sd = docSnap.data();
        if(!sd) return;
        try{
          if(role === 'answerer' && sd.offer && !pc.currentRemoteDescription){
            await pc.setRemoteDescription(new RTCSessionDescription(sd.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sigRef.set({ answer: { type: answer.type, sdp: answer.sdp } }, { merge:true });
          }
          if(role === 'offerer' && sd.answer && pc.currentLocalDescription && !pc.currentRemoteDescription){
            await pc.setRemoteDescription(new RTCSessionDescription(sd.answer));
          }
        }catch(e){ console.error('wg ses SDP hatası', e); }
        const remoteCandidates = sd[remoteCandField] || [];
        if(remoteCandidates.length > peerObj.appliedRemoteCandidates){
          const newOnes = remoteCandidates.slice(peerObj.appliedRemoteCandidates);
          peerObj.appliedRemoteCandidates = remoteCandidates.length;
          newOnes.forEach(c => { pc.addIceCandidate(new RTCIceCandidate(c)).catch(e=>console.error('wg ses candidate eklenemedi', e)); });
        }
      }, err=>console.error('wg ses dinleyici hatası', err));
    }catch(e){ console.error('wg ses bağlantısı kurulamadı (' + otherUid + ')', e); }
  })();
}

function disconnectWgVoicePeer(otherUid){
  const peer = wgVoicePeers[otherUid];
  if(!peer) return;
  if(peer.unsub){ peer.unsub(); }
  try{ peer.pc.close(); }catch(e){}
  if(peer.audioEl){ peer.audioEl.srcObject = null; peer.audioEl.remove(); }
  delete wgVoicePeers[otherUid];
}

function stopWgVoice(){
  const wasActive = wgVoiceActive;
  wgVoiceActive = false;
  if(wgVoiceLocalStream){ wgVoiceLocalStream.getTracks().forEach(t=>t.stop()); wgVoiceLocalStream = null; }
  Object.keys(wgVoicePeers).forEach(uid => disconnectWgVoicePeer(uid));
  updateWgVoiceButtonUI();
  setWgVoiceStatus('');
  if(wasActive) showToast('Sesli sohbetten çıktın');
}

function updateWgVoiceButtonUI(){
  const btn = document.getElementById('btnWgVoiceToggle');
  if(!btn) return;
  btn.textContent = wgVoiceActive ? '🔴' : '🎤';
}
function setWgVoiceStatus(text){
  const el = document.getElementById('wgVoiceStatus');
  if(!el) return;
  if(!text){ el.style.display = 'none'; el.textContent = ''; return; }
  el.style.display = 'block';
  el.textContent = text;
}

document.getElementById('btnWgVoiceToggle').addEventListener('click', toggleWgVoice);

// ================= İSİM ŞEHİR ÜLKE: FİNAL SIRALAMA =================
function renderWgFinalResults(d){
  const box = document.getElementById('wgFinalStandings');
  const entries = Object.keys(d.scores||{}).map(uid=>({ uid, score: d.scores[uid]||0 }))
    .sort((a,b)=> b.score - a.score);
  box.innerHTML = entries.map((e,i)=>{
    const disp = wgGetPlayerDisplay(e.uid);
    const medal = i===0 ? '🥇' : (i===1 ? '🥈' : (i===2 ? '🥉' : (i+1)+'.'));
    return `<div class="wg-glow-card" style="display:flex; align-items:center; gap:12px; padding:14px 16px; margin-bottom:8px; ${i===0?'border-color:#FFD93D; box-shadow:0 0 20px rgba(255,217,61,0.3);':''}">
      <div style="font-size:20px; width:34px; text-align:center;">${medal}</div>
      <div style="width:40px;height:40px;border-radius:50%; background:${disp.bg}; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; overflow:hidden; flex-shrink:0;">${disp.inner}</div>
      <div style="flex:1; color:#fff; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(disp.name)}</div>
      <div style="color:#FFD93D; font-weight:900; font-size:16px; flex-shrink:0;">${e.score} pts</div>
    </div>`;
  }).join('');
}

document.getElementById('btnWgFinalDone').addEventListener('click', async ()=>{
  if(currentWgRoomUnsub){ currentWgRoomUnsub(); currentWgRoomUnsub = null; }
  if(wgVotingAnswersUnsub){ wgVotingAnswersUnsub(); wgVotingAnswersUnsub = null; }
  if(wgVoiceActive) stopWgVoice();
  if(currentWgRoomId && wgCurrentRoomData && wgCurrentRoomData.hostUid === currentUser.uid){
    try{ await db.collection('word_game_rooms').doc(currentWgRoomId).delete(); }catch(e){ console.error(e); }
  }
  wgCurrentRoomData = null;
  currentWgRoomId = null;
  switchScreen('oyunlar');
});

document.querySelectorAll('.wg-round-opt').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    wgSelectedRounds = parseInt(btn.dataset.rounds, 10);
    document.querySelectorAll('.wg-round-opt').forEach(b=>{
      const r = parseInt(b.dataset.rounds, 10);
      b.style.outline = (r === wgSelectedRounds) ? '2px solid #FF7A45' : 'none';
    });
  });
});

document.getElementById('btnWgStartGame').addEventListener('click', async ()=>{
  if(!currentWgRoomId) return;
  try{
    const doc = await db.collection('word_game_rooms').doc(currentWgRoomId).get();
    const d = doc.data();
    if((d.playerUids||[]).length < 2){ showToast('En az 2 oyuncu gerekli'); return; }
    await doc.ref.update({
      status: 'letter_selection',
      totalRounds: wgSelectedRounds,
      roundTimeSeconds: WG_ROUND_TIME_MAP[wgSelectedRounds],
      currentRound: 1,
      letterPickerUid: d.playerUids[0]
    });
  }catch(e){ console.error(e); showToast('Oyun başlatılamadı'); }
});

document.getElementById('btnWgLobbyBack').addEventListener('click', async ()=>{
  if(currentWgRoomUnsub){ currentWgRoomUnsub(); currentWgRoomUnsub = null; }
  if(currentWgRoomId){
    try{
      const doc = await db.collection('word_game_rooms').doc(currentWgRoomId).get();
      const d = doc.data();
      if(d && d.hostUid === currentUser.uid){
        await doc.ref.delete(); // host çıkarsa oda kapanır
      } else if(d) {
        await doc.ref.update({ playerUids: firebase.firestore.FieldValue.arrayRemove(currentUser.uid) });
      }
    }catch(e){ console.error(e); }
  }
  currentWgRoomId = null;
  switchScreen('oyunlar');
});
