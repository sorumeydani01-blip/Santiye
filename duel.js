async function renderDailyQuestsScreen(){
  const box = document.getElementById('dailyQuestsList');
  box.innerHTML = '<div class="hint">Yükleniyor…</div>';
  const data = await getDailyQuestData();
  box.innerHTML = DAILY_QUESTS_DEF.map(q=>{
    const progress = Math.min(q.target, data[q.field]||0);
    const pct = Math.round((progress/q.target)*100);
    const isDone = progress >= q.target;
    const isClaimed = (data.claimed||[]).includes(q.id);
    return `<div class="card" style="margin-bottom:12px; padding:14px;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
        <div style="width:40px;height:40px;border-radius:12px; background:var(--tint-slate); display:flex; align-items:center; justify-content:center; font-size:19px; flex-shrink:0;">${q.icon}</div>
        <div style="flex:1;">
          <div style="font-weight:800; font-size:13.5px;">${escapeHtml(q.label)}</div>
          <div class="hint" style="margin:2px 0 0;">${progress}/${q.target} — Ödül: +${q.reward} pn</div>
        </div>
      </div>
      <div style="height:7px; border-radius:4px; background:var(--concrete); overflow:hidden; margin-bottom:${isDone?'10px':'0'};">
        <div style="height:100%; width:${pct}%; background:${isDone?'#16A34A':'var(--asphalt)'}; border-radius:4px;"></div>
      </div>
      ${isDone ? (isClaimed
        ? '<button class="submit-btn secondary" disabled style="opacity:0.6; padding:9px; font-size:12.5px;">✓ Ödül Alındı</button>'
        : `<button class="submit-btn" data-claim-quest="${q.id}" data-reward="${q.reward}" style="padding:9px; font-size:12.5px; background:#16A34A;">🎁 Ödülü Al (+${q.reward} pn)</button>`)
        : ''}
    </div>`;
  }).join('');
  box.querySelectorAll('[data-claim-quest]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const questId = btn.dataset.claimQuest;
      const reward = parseInt(btn.dataset.reward, 10);
      btn.disabled = true; btn.textContent = 'İşleniyor…';
      try{
        const data = await getDailyQuestData();
        if((data.claimed||[]).includes(questId)) return;
        data.claimed = [...(data.claimed||[]), questId];
        await userDocRef.set({ dailyQuestData: data }, {merge:true});
        await applyQuizPoints(reward, 'gorev_odulu');
        showToast('+' + reward + ' puan kazandın! 🎉');
        renderDailyQuestsScreen();
        refreshDailyQuestBadge();
      }catch(e){ showToast('Ödül alınamadı'); }
    });
  });
}
document.getElementById('btnQuizGoDailyQuests').addEventListener('click', ()=>{
  switchScreen('daily-quests');
  renderDailyQuestsScreen();
});
document.getElementById('btnDailyQuestsBack').addEventListener('click', ()=> switchScreen('quiz'));

// ---------- MARKET (puan ile joker satın alma) ----------
const JOKER_PURCHASE_COST = 20;
document.getElementById('btnQuizGoMarket').addEventListener('click', async ()=>{
  switchScreen('quiz-market');
  const p = profileByUid(currentUser.uid);
  const score = p ? (p.quizScore||0) : 0;
  document.getElementById('marketCurrentScore').textContent = score + ' pn';
  const buyBtn = document.getElementById('btnBuyJoker');
  buyBtn.disabled = score < JOKER_PURCHASE_COST;
  buyBtn.style.opacity = score < JOKER_PURCHASE_COST ? '0.5' : '1';
});
document.getElementById('btnQuizMarketBack').addEventListener('click', ()=> switchScreen('quiz'));
document.getElementById('btnBuyJoker').addEventListener('click', async ()=>{
  const p = profileByUid(currentUser.uid);
  const score = p ? (p.quizScore||0) : 0;
  if(score < JOKER_PURCHASE_COST){ showToast('Yeterli puanın yok'); return; }
  try{
    await applyQuizPoints(-JOKER_PURCHASE_COST, 'market_satinalma');
    const today = todayStr();
    const doc = await userDocRef.get();
    const data = doc.data() || {};
    const curBonus = (data.quizJokerBonusDate === today) ? (data.quizJokerBonusCount||0) : 0;
    await userDocRef.set({ quizJokerBonusDate: today, quizJokerBonusCount: curBonus + 1 }, {merge:true});
    showToast('🃏 +1 Joker satın alındı!');
    quizJokersRemainingToday = await getJokersRemainingToday();
    const jokerCountEl = document.getElementById('quizJokerCount');
    if(jokerCountEl) jokerCountEl.textContent = quizJokersRemainingToday;
    document.getElementById('btnQuizGoMarket').click();
  }catch(e){ showToast('Satın alınamadı: '+(e.message||'')); }
});

async function getJokersRemainingToday(){
  if(!userDocRef) return QUIZ_JOKERS_PER_DAY;
  try{
    const doc = await userDocRef.get();
    const data = doc.data() || {};
    const today = todayStr();
    const bonusToday = (data.quizJokerBonusDate === today) ? (data.quizJokerBonusCount||0) : 0;
    const totalAllowed = QUIZ_JOKERS_PER_DAY + bonusToday;
    if(data.quizJokerDate === today) return Math.max(0, totalAllowed - (data.quizJokerUsedCount||0));
    return totalAllowed;
  }catch(e){ return QUIZ_JOKERS_PER_DAY; }
}
async function useJokerToday(){
  if(!userDocRef) return;
  try{
    const today = todayStr();
    const doc = await userDocRef.get();
    const data = doc.data() || {};
    const cur = (data.quizJokerDate === today) ? (data.quizJokerUsedCount||0) : 0;
    await userDocRef.set({ quizJokerDate: today, quizJokerUsedCount: cur + 1 }, {merge:true});
  }catch(e){ console.error('Joker kaydedilemedi', e); }
}

// ---------- Kategori seçimi ----------
function quizResetToCategory(){
  if(typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  clearQuizTimer();
  document.getElementById('quizPlayStep').style.display = 'none';
  document.getElementById('quizResultStep').style.display = 'none';
  document.getElementById('quizCategoryStep').style.display = 'block';
  const navTabsEl = document.querySelector('nav.tabs');
  if(navTabsEl) navTabsEl.style.display = 'flex';
  loadQuizQuestions();
  refreshDailyQuestBadge();
}
document.getElementById('btnGoToQuiz').addEventListener('click', ()=>{ quizResetToCategory(); switchScreen('quiz'); });
document.getElementById('btnQuizGoBookmarks').addEventListener('click', ()=>{
  switchScreen('quiz-bookmarks');
  renderQuizBookmarksList();
});
document.getElementById('btnQuizBookmarksBack').addEventListener('click', ()=>{
  quizResetToCategory();
  switchScreen('quiz');
});
document.getElementById('btnHeaderMenuQuiz').addEventListener('click', ()=>{
  document.getElementById('headerProfileMenu').style.display = 'none';
  quizResetToCategory();
  switchScreen('quiz');
});
document.getElementById('btnHeaderMenuOyunlar').addEventListener('click', ()=>{
  document.getElementById('headerProfileMenu').style.display = 'none';
  switchScreen('oyunlar');
});
document.getElementById('quizCategoryGenel').addEventListener('click', ()=>{ quizSelectedCategory='genel_kultur'; startQuizSession(); });
document.getElementById('quizCategoryIslami').addEventListener('click', ()=>{ quizSelectedCategory='islami'; startQuizSession(); });
document.getElementById('btnQuizQuit').addEventListener('click', ()=>{
  if(confirm('Testten çıkmak istediğine emin misin? Bu testteki ilerlemen kaybolur.')) quizResetToCategory();
});
document.getElementById('btnQuizBackHome').addEventListener('click', ()=>{ quizResetToCategory(); switchScreen('ana'); });

// ---------- Test başlat: rastgele, tekrarsız 10 soru seç ----------
async function startQuizSession(){
  await loadQuizQuestions();
  const navTabsEl = document.querySelector('nav.tabs');
  if(navTabsEl) navTabsEl.style.display = 'none';
  const pool = quizQuestions.filter(q => q.category===quizSelectedCategory);
  if(pool.length === 0){
    showToast('Bu kategoride henüz soru eklenmemiş');
    return;
  }
  const seenIds = await getSeenQuestionIds();
  const unseen = pool.filter(q => !seenIds.includes(q.id));
  let selected;
  if(unseen.length >= QUIZ_QUESTIONS_PER_TEST){
    selected = shuffleArr(unseen).slice(0, QUIZ_QUESTIONS_PER_TEST);
  } else if(unseen.length > 0){
    const seenPool = shuffleArr(pool.filter(q => seenIds.includes(q.id)));
    selected = shuffleArr(unseen.concat(seenPool.slice(0, QUIZ_QUESTIONS_PER_TEST - unseen.length)));
  } else {
    // Havuzdaki tüm sorular daha önce görülmüş — baştan başlıyoruz.
    selected = shuffleArr(pool).slice(0, Math.min(QUIZ_QUESTIONS_PER_TEST, pool.length));
  }
  quizSessionQuestions = selected;
  quizCurrentIndex = 0;
  quizSessionScore = 0;
  quizSessionCorrect = 0;
  quizSessionWrong = 0;
  quizJokersRemainingToday = await getJokersRemainingToday();
  document.getElementById('quizCategoryStep').style.display = 'none';
  document.getElementById('quizResultStep').style.display = 'none';
  document.getElementById('quizPlayStep').style.display = 'block';
  renderQuizQuestion();
}

function renderQuizQuestion(){
  if(typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); // önceki sorunun sesi kalmasın
  quizJokerUsedThisQuestion = false;
  const q = quizSessionQuestions[quizCurrentIndex];
  document.getElementById('quizQuestionNumLbl').textContent = (quizCurrentIndex+1) + '. Soru';
  document.getElementById('quizProgressLbl').textContent = (quizCurrentIndex+1) + '/' + quizSessionQuestions.length;
  document.getElementById('quizProgressBar').style.width = Math.round((quizCurrentIndex/quizSessionQuestions.length)*100) + '%';
  document.getElementById('quizWrongCount').textContent = quizSessionWrong;
  document.getElementById('quizCorrectCount').textContent = quizSessionCorrect;
  document.getElementById('quizSessionScoreLbl').textContent = (quizSessionScore>=0?'+':'') + quizSessionScore + ' pn';
  document.getElementById('quizQuestionText').textContent = q.question;
  const wrap = document.getElementById('quizOptionsWrap');
  const letters = ['A','B','C','D','E'];
  wrap.innerHTML = (q.options||[]).map((opt,i)=>
    '<button class="quiz-option-btn" data-index="'+i+'" style="width:100%; margin-bottom:10px; text-align:left; padding:13px 15px; border-radius:16px; border:1.5px solid var(--line); background:var(--paper); color:var(--ink); font-size:14.5px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:12px;">'
      + '<span style="width:27px;height:27px;border-radius:50%; background:var(--concrete); color:var(--ink-soft); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12.5px; flex-shrink:0;">'+letters[i]+'</span>'
      + '<span style="flex:1;">'+escapeHtml(opt)+'</span>'
    + '</button>'
  ).join('');
  wrap.querySelectorAll('.quiz-option-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> selectQuizAnswer(parseInt(btn.dataset.index,10)));
  });
  document.getElementById('quizJokerCount').textContent = quizJokersRemainingToday;
  document.getElementById('btnQuizJoker').style.display = quizJokersRemainingToday > 0 ? 'block' : 'none';
  const hintBtn = document.getElementById('btnQuizHintToggle');
  const hintBox = document.getElementById('quizHintBox');
  hintBox.style.display = 'none';
  hintBtn.textContent = '💡 İpucu';
  hintBtn.style.display = q.hint ? 'block' : 'none';
  document.getElementById('quizExplanationOverlay').style.display = 'none';
  refreshQuizBookmarkBtn(q.id);
  startQuizTimer();
}
document.getElementById('btnQuizHintToggle').addEventListener('click', ()=>{
  const q = quizSessionQuestions[quizCurrentIndex];
  const hintBox = document.getElementById('quizHintBox');
  const showing = hintBox.style.display !== 'none';
  if(showing){
    hintBox.style.display = 'none';
    document.getElementById('btnQuizHintToggle').textContent = '💡 İpucu';
  } else {
    hintBox.textContent = q.hint || '';
    hintBox.style.display = 'block';
    document.getElementById('btnQuizHintToggle').textContent = '💡 İpucu ▲';
  }
});

function startQuizTimer(){
  clearQuizTimer();
  quizTimeLeft = QUIZ_QUESTION_SECONDS;
  const bar = document.getElementById('quizTimerBar');
  bar.style.transition = 'none';
  bar.style.width = '100%';
  bar.style.background = 'var(--asphalt)';
  requestAnimationFrame(()=>{ bar.style.transition = 'width 1s linear'; });
  quizTimerInterval = setInterval(()=>{
    if(typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking) return; // soru sesle okunurken süre beklesin
    quizTimeLeft--;
    const pct = Math.max(0, (quizTimeLeft/QUIZ_QUESTION_SECONDS)*100);
    bar.style.width = pct + '%';
    if(quizTimeLeft <= 5) bar.style.background = 'var(--danger)';
    if(quizTimeLeft <= 0){
      clearQuizTimer();
      selectQuizAnswer(-1); // süre doldu
    }
  }, 1000);
}
function clearQuizTimer(){
  if(quizTimerInterval){ clearInterval(quizTimerInterval); quizTimerInterval = null; }
}

document.getElementById('btnQuizJoker').addEventListener('click', async ()=>{
  if(quizJokersRemainingToday<=0 || quizJokerUsedThisQuestion) return;
  const q = quizSessionQuestions[quizCurrentIndex];
  const wrongIdx = (q.options||[]).map((_,i)=>i).filter(i=>i!==q.correctIndex);
  const eliminate = shuffleArr(wrongIdx).slice(0,2);
  eliminate.forEach(i=>{
    const btn = document.querySelector('.quiz-option-btn[data-index="'+i+'"]');
    if(btn){ btn.disabled = true; btn.style.opacity = '0.35'; btn.style.textDecoration = 'line-through'; }
  });
  quizJokerUsedThisQuestion = true;
  quizJokersRemainingToday--;
  document.getElementById('quizJokerCount').textContent = quizJokersRemainingToday;
  document.getElementById('btnQuizJoker').style.display = 'none';
  await useJokerToday();
  updateDailyQuestProgress({ jokerUsed: true });
});

async function selectQuizAnswer(index){
  clearQuizTimer();
  const q = quizSessionQuestions[quizCurrentIndex];
  const correct = (index === q.correctIndex);
  const points = correct ? 10 : -15;
  quizSessionScore += points;
  if(correct) quizSessionCorrect++; else quizSessionWrong++;

  document.querySelectorAll('.quiz-option-btn').forEach(btn=>{
    btn.disabled = true;
    const i = parseInt(btn.dataset.index,10);
    if(i === q.correctIndex){ btn.style.background = 'var(--tint-forest)'; btn.style.borderColor = '#16A34A'; }
    else if(i === index){ btn.style.background = 'var(--tint-rust)'; btn.style.borderColor = 'var(--danger)'; }
  });
  document.getElementById('quizSessionScoreLbl').textContent = (quizSessionScore>=0?'+':'') + quizSessionScore + ' pn';
  document.getElementById('quizWrongCount').textContent = quizSessionWrong;
  document.getElementById('quizCorrectCount').textContent = quizSessionCorrect;

  // Cevaplandıktan sonra: joker/ipucu butonları gizlenir, açıklama penceresi açılır,
  // "Anladım" butonuna basılana kadar bir sonraki soruya geçilmez.
  document.getElementById('btnQuizJoker').style.display = 'none';
  document.getElementById('btnQuizHintToggle').style.display = 'none';
  document.getElementById('quizHintBox').style.display = 'none';

  const resultBadge = document.getElementById('quizExplanationResultBadge');
  resultBadge.textContent = correct ? '✅ Doğru cevap!' : '❌ Yanlış cevap';
  resultBadge.style.color = correct ? '#16A34A' : 'var(--danger)';
  const explBox = document.getElementById('quizExplanationBox');
  if(q.explanation){
    document.getElementById('quizExplanationText').textContent = q.explanation;
    explBox.style.display = 'block';
  } else {
    explBox.style.display = 'none';
  }
  document.getElementById('quizExplanationOverlay').style.display = 'flex';

  applyQuizPoints(points, quizSelectedCategory);
  updateDailyQuestProgress({ category: quizSelectedCategory });
}
document.getElementById('btnQuizUnderstood').addEventListener('click', ()=>{
  document.getElementById('quizExplanationOverlay').style.display = 'none';
  quizCurrentIndex++;
  if(quizCurrentIndex < quizSessionQuestions.length) renderQuizQuestion();
  else finishQuizSession();
});

// ---------- SEVİYE / XP SİSTEMİ ----------
const XP_PER_LEVEL = 100;
const MAX_LEVEL = 50;
function getLevelFromXp(xp){
  const level = Math.min(MAX_LEVEL, Math.floor((xp||0) / XP_PER_LEVEL) + 1);
  return level;
}
function getLevelTier(level){
  if(level >= 50) return { color:'#EC4899', name:'Efsane', frame:'linear-gradient(135deg,#EC4899,#F59E0B,#818CF8,#EC4899)' };
  if(level >= 40) return { color:'#DC2626', name:'Usta', frame:'linear-gradient(135deg,#DC2626,#F87171)' };
  if(level >= 30) return { color:'#F59E0B', name:'Altın', frame:'linear-gradient(135deg,#F59E0B,#FBBF24)' };
  if(level >= 20) return { color:'#8B5CF6', name:'Mor', frame:'linear-gradient(135deg,#8B5CF6,#A78BFA)' };
  if(level >= 10) return { color:'#3B82F6', name:'Mavi', frame:'linear-gradient(135deg,#3B82F6,#60A5FA)' };
  return { color:'#9CA3AF', name:'Yeni', frame:'linear-gradient(135deg,#9CA3AF,#D1D5DB)' };
}
function xpBadgeHtml(xp, extraStyle){
  const level = getLevelFromXp(xp);
  const tier = getLevelTier(level);
  return `<span style="font-size:10.5px; font-weight:800; padding:2px 9px; border-radius:20px; background:${tier.color}22; color:${tier.color}; ${extraStyle||''}">⭐ Lv.${level}</span>`;
}
async function awardXp(amount){
  if(!currentUser || amount<=0) return;
  try{
    const pubRef = db.collection('public_profiles').doc(currentUser.uid);
    const doc = await pubRef.get();
    const currentXp = (doc.exists && typeof doc.data().xp === 'number') ? doc.data().xp : 0;
    const newXp = currentXp + amount;
    await pubRef.set({ xp: newXp }, {merge:true});
    const p = profileByUid(currentUser.uid);
    if(p) p.xp = newXp;
    return newXp;
  }catch(e){ console.error('XP kaydedilemedi', e); }
}
function renderXpProgressBar(xp, elPrefix){
  const level = getLevelFromXp(xp||0);
  const tier = getLevelTier(level);
  const labelEl = document.getElementById(elPrefix+'Label');
  const barEl = document.getElementById(elPrefix+'Bar');
  const pctEl = document.getElementById(elPrefix+'Pct');
  const hintEl = document.getElementById(elPrefix+'Hint');
  if(!labelEl) return;
  labelEl.textContent = '⭐ Seviye ' + level + ' — ' + tier.name;
  if(level >= MAX_LEVEL){
    pctEl.textContent = 'MAX';
    barEl.style.width = '100%';
    hintEl.textContent = 'En yüksek seviyeye ulaştın! 🎉';
  } else {
    const xpIntoLevel = (xp||0) % XP_PER_LEVEL;
    const pct = Math.round((xpIntoLevel/XP_PER_LEVEL)*100);
    pctEl.textContent = pct + '%';
    barEl.style.width = pct + '%';
    hintEl.textContent = 'Sonraki Seviye: ' + xpIntoLevel + ' / ' + XP_PER_LEVEL + ' XP';
  }
  barEl.style.background = tier.frame;
}

async function applyQuizPoints(points, category){
  if(!currentUser) return;
  try{
    const pubRef = db.collection('public_profiles').doc(currentUser.uid);
    const doc = await pubRef.get();
    const current = (doc.exists && typeof doc.data().quizScore === 'number') ? doc.data().quizScore : 0;
    const currentTotal = (doc.exists && typeof doc.data().quizTotalAnswered === 'number') ? doc.data().quizTotalAnswered : 0;
    let newScore = current + points;
    if(newScore < -50) newScore = -50; // taban puan
    const newTotal = currentTotal + 1;
    await pubRef.set({ quizScore: newScore, quizTotalAnswered: newTotal }, {merge:true});
    const p = profileByUid(currentUser.uid);
    if(p){ p.quizScore = newScore; p.quizTotalAnswered = newTotal; } // yerel önbelleği de güncelle
    await db.collection('quiz_score_events').add({ uid: currentUser.uid, points, category, timestamp: Date.now() });
  }catch(e){ console.error('Puan kaydedilemedi', e); }
}

function finishQuizSession(){
  clearQuizTimer();
  markQuestionsSeen(quizSessionQuestions.map(q=>q.id));
  document.getElementById('quizPlayStep').style.display = 'none';
  document.getElementById('quizResultStep').style.display = 'block';
  document.getElementById('quizResultDetail').textContent = quizSessionCorrect + ' doğru, ' + quizSessionWrong + ' yanlış (' + quizSessionQuestions.length + ' soru)';
  document.getElementById('quizResultScore').textContent = (quizSessionScore>=0?'+':'') + quizSessionScore + ' pn';
}
document.getElementById('btnQuizPlayAgain').addEventListener('click', ()=>{
  document.getElementById('quizResultStep').style.display = 'none';
  startQuizSession();
});

// ================= DÜELLO (1v1) SİSTEMİ =================
let duelSetupOpponentUid = null;
let currentDuelId = null;
let currentDuelUnsub = null;
let duelLocalQuestions = [];
let duelLocalIndex = 0;
let duelLocalScore = 0;
let duelTimerInterval = null;
let duelTimeLeft = 0;

document.getElementById('btnQuizGoDuel').addEventListener('click', async ()=>{
  switchScreen('duel-pick-friend');
  const box = document.getElementById('duelFriendPickerList');
  box.innerHTML = '<div class="hint">Yükleniyor…</div>';
  const friendUids = await getFriendUids(currentUser.uid);
  if(friendUids.length === 0){
    box.innerHTML = '<div class="empty"><div class="icon">🤝</div><div class="msg">Düello yapabilmek için önce bir arkadaş eklemen lazım. Bir kullanıcının profiline gidip "Arkadaş Ekle" ile davet gönderebilirsin.</div></div>';
    return;
  }
  box.innerHTML = friendUids.map(uid=>{
    const p = profileByUid(uid);
    const name = p ? getDisplayName(p) : 'Kullanıcı';
    const inner = (p && p.photoData) ? `<img src="${safeImageSrc(p.photoData)}" style="width:100%;height:100%; object-fit:cover;">` : escapeHtml(getInitials(p?p.fullName:name));
    return `<div class="toggle-row" data-duel-pick-uid="${escapeHtml(uid)}" style="cursor:pointer;">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:40px;height:40px;border-radius:50%; background:${(p&&p.photoData)?'transparent':avatarGradient(uid)}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; overflow:hidden; flex-shrink:0;">${inner}</div>
        <div class="tlbl">${escapeHtml(name)}</div>
      </div>
      <div style="color:var(--ink-soft); font-size:18px;">›</div>
    </div>`;
  }).join('');
  box.querySelectorAll('[data-duel-pick-uid]').forEach(row=>{
    row.addEventListener('click', ()=> openDuelSetup(row.dataset.duelPickUid));
  });
});
document.getElementById('btnDuelPickFriendBack').addEventListener('click', ()=> switchScreen('quiz'));

function openDuelSetup(opponentUid){
  duelSetupOpponentUid = opponentUid;
  const p = profileByUid(opponentUid);
  document.getElementById('duelSetupOpponentName').textContent = (p ? getDisplayName(p) : 'Kullanıcı') + ' kişisine düello daveti gönder';
  document.getElementById('duelSetupOverlay').style.display = 'flex';
}
document.getElementById('duelSetupCancelBtn').addEventListener('click', ()=>{
  document.getElementById('duelSetupOverlay').style.display = 'none';
});
document.getElementById('duelSetupSendBtn').addEventListener('click', async ()=>{
  if(!duelSetupOpponentUid || !currentUser) return;
  const category = document.getElementById('duelSetupCategory').value;
  const categoryLabel = category === 'islami' ? 'İslami Bilgiler' : 'Genel Kültür';
  const questionCount = parseInt(document.getElementById('duelSetupQuestionCount').value, 10);
  const timePerQ = parseInt(document.getElementById('duelSetupTimePerQ').value, 10);
  try{
    const duelRef = await db.collection('duels').add({
      player1Uid: currentUser.uid, player2Uid: duelSetupOpponentUid,
      category, questionCount, timePerQuestion: timePerQ,
      status: 'pending',
      scores: {}, progress: {}, finishedPlayers: [],
      createdAt: new Date().toISOString()
    });
    const myName = (profile && profile.fullName) || 'Bir kullanıcı';
    await db.collection('notifications').add({
      toUid: duelSetupOpponentUid, fromUid: currentUser.uid, type:'duel_invite', duelId: duelRef.id,
      message: '⚔️ ' + myName + ' seni düelloya davet etti! (' + categoryLabel + ' · ' + questionCount + ' soru)',
      read:false, createdAt:new Date().toISOString()
    });
    document.getElementById('duelSetupOverlay').style.display = 'none';
    showToast('Düello daveti gönderildi ⚔️');
    document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
    openDuelRoom(duelRef.id);
  }catch(e){ showToast('Davet gönderilemedi: '+(e.message||'')); }
});
async function openDuelRoom(duelId){
  currentDuelId = duelId;
  document.querySelectorAll('main > .screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-duel').classList.add('active');
  document.getElementById('duelWaitingState').style.display = 'none';
  document.getElementById('duelActiveState').style.display = 'none';
  document.getElementById('duelFinishedState').style.display = 'none';
  await loadQuizQuestions(); // davet eden taraf da soru havuzunu yüklemiş olsun
  if(currentDuelUnsub){ currentDuelUnsub(); currentDuelUnsub = null; }
  currentDuelUnsub = db.collection('duels').doc(duelId).onSnapshot(doc=>{
    if(!doc.exists) return;
    renderDuelRoom({id:doc.id, ...doc.data()});
  });
}
document.getElementById('btnDuelBack').addEventListener('click', ()=>{
  if(currentDuelUnsub){ currentDuelUnsub(); currentDuelUnsub = null; }
  clearInterval(duelTimerInterval);
  switchScreen('ana');
});
document.getElementById('duelBackHomeBtn').addEventListener('click', ()=>{
  if(currentDuelUnsub){ currentDuelUnsub(); currentDuelUnsub = null; }
  switchScreen('ana');
});
document.getElementById('btnDuelSpeak').addEventListener('click', ()=>{
  const q = duelLocalQuestions[duelLocalIndex];
  if(!q || typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(q.question);
  utter.lang = 'tr-TR';
  speechSynthesis.speak(utter);
});
function getDuelOpponentUid(d){
  if(!d || !currentUser) return null;
  return d.player1Uid === currentUser.uid ? d.player2Uid : d.player1Uid;
}
function renderDuelRoom(d){
  window._lastDuelData = d;
  const isP1 = d.player1Uid === currentUser.uid;
  const opponentUid = getDuelOpponentUid(d);
  const opponentP = profileByUid(opponentUid);
  const oppName = opponentP ? getDisplayName(opponentP) : 'Rakip';

  if(d.status === 'pending'){
    document.getElementById('duelWaitingState').style.display = 'block';
    document.getElementById('duelActiveState').style.display = 'none';
    document.getElementById('duelFinishedState').style.display = 'none';
    if(isP1){
      document.getElementById('duelWaitingText').textContent = oppName + ' bekleniyor...';
      document.getElementById('duelWaitingSub').textContent = 'Rakibin daveti kabul etmesini bekliyoruz.';
      document.getElementById('duelInviteActions').style.display = 'none';
    } else {
      document.getElementById('duelWaitingText').textContent = oppName + ' seni düelloya davet etti!';
      document.getElementById('duelWaitingSub').textContent = (d.category==='islami'?'🕌 İslami Bilgiler':'🌍 Genel Kültür') + ' · ' + d.questionCount + ' soru, soru başına ' + d.timePerQuestion + ' saniye.';
      document.getElementById('duelInviteActions').style.display = 'flex';
    }
    return;
  }
  if(d.status === 'declined'){
    document.getElementById('duelWaitingState').style.display = 'block';
    document.getElementById('duelWaitingText').textContent = 'Davet reddedildi';
    document.getElementById('duelWaitingSub').textContent = '';
    document.getElementById('duelInviteActions').style.display = 'none';
    return;
  }
  if(d.status === 'active'){
    document.getElementById('duelWaitingState').style.display = 'none';
    document.getElementById('duelFinishedState').style.display = 'none';
    document.getElementById('duelActiveState').style.display = 'block';
    document.getElementById('duelMeNameLbl').textContent = getDisplayName(profile ? {fullName:profile.fullName, username:profile.username} : null) || 'Sen';
    document.getElementById('duelOppNameLbl').textContent = oppName;
    const myScore = (d.scores && d.scores[currentUser.uid]) || 0;
    const oppScore = (d.scores && d.scores[opponentUid]) || 0;
    const myProgress = (d.progress && d.progress[currentUser.uid]) || 0;
    const oppProgress = (d.progress && d.progress[opponentUid]) || 0;
    document.getElementById('duelMeScoreLbl').textContent = myScore;
    document.getElementById('duelOppScoreLbl').textContent = oppScore;
    document.getElementById('duelMeProgressLbl').textContent = myProgress + '/' + d.questionCount;
    document.getElementById('duelOppProgressLbl').textContent = oppProgress + '/' + d.questionCount;

    if(duelLocalQuestions.length === 0 && Array.isArray(d.questionIds) && d.questionIds.length){
      duelLocalQuestions = d.questionIds.map(qid => quizQuestions.find(q=>q.id===qid)).filter(Boolean);
      duelLocalIndex = 0; duelLocalScore = 0;
      renderDuelQuestion(d);
    }
    return;
  }
  if(d.status === 'finished'){
    clearInterval(duelTimerInterval);
    document.getElementById('duelWaitingState').style.display = 'none';
    document.getElementById('duelActiveState').style.display = 'none';
    document.getElementById('duelFinishedState').style.display = 'block';
    const myScore = (d.scores && d.scores[currentUser.uid]) || 0;
    const oppScore = (d.scores && d.scores[opponentUid]) || 0;
    document.getElementById('duelFinalMeNameLbl').textContent = 'Sen';
    document.getElementById('duelFinalOppNameLbl').textContent = oppName;
    document.getElementById('duelFinalMeScoreLbl').textContent = myScore;
    document.getElementById('duelFinalOppScoreLbl').textContent = oppScore;
    const iWon = d.winnerUid === currentUser.uid;
    const isTie = d.winnerUid === 'tie';
    document.getElementById('duelResultIcon').textContent = isTie ? '🤝' : (iWon ? '🏆' : '💔');
    document.getElementById('duelResultTitle').textContent = isTie ? 'Berabere!' : (iWon ? 'Kazandın!' : 'Kaybettin');
    document.getElementById('duelResultSub').textContent = myScore + ' - ' + oppScore;
    if(iWon && !d._confettiShown){ fireDuelConfetti(); d._confettiShown = true; }
    return;
  }
}
document.getElementById('duelAcceptBtn').addEventListener('click', async ()=>{
  if(!currentDuelId) return;
  try{
    const doc = await db.collection('duels').doc(currentDuelId).get();
    const d = doc.data();
    await loadQuizQuestions();
    const pool = quizQuestions.filter(q => !d.category || q.category === d.category);
    for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    const selected = pool.slice(0, d.questionCount).map(q=>q.id);
    if(selected.length === 0){ showToast('Bu kategoride yeterli soru bulunamadı'); return; }
    await db.collection('duels').doc(currentDuelId).update({ status:'active', questionIds: selected, startedAt: new Date().toISOString() });
  }catch(e){ showToast('Kabul edilemedi: '+(e.message||'')); }
});
document.getElementById('duelDeclineBtn').addEventListener('click', async ()=>{
  if(!currentDuelId) return;
  try{
    await db.collection('duels').doc(currentDuelId).update({ status:'declined' });
  }catch(e){}
});

function renderDuelQuestion(d){
  const q = duelLocalQuestions[duelLocalIndex];
  if(!q) return;
  document.getElementById('duelQNumLbl').textContent = (duelLocalIndex+1) + '. Soru';
  document.getElementById('duelQuestionText').textContent = q.question;
  const wrap = document.getElementById('duelOptionsWrap');
  const letters = ['A','B','C','D','E'];
  wrap.innerHTML = (q.options||[]).map((opt,i)=>
    '<button class="duel-option-btn" data-index="'+i+'" style="width:100%; margin-bottom:10px; text-align:left; padding:13px 15px; border-radius:16px; border:1.5px solid var(--line); background:var(--paper); color:var(--ink); font-size:14.5px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:12px;">'
      + '<span style="width:27px;height:27px;border-radius:50%; background:var(--concrete); color:var(--ink-soft); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12.5px; flex-shrink:0;">'+letters[i]+'</span>'
      + '<span style="flex:1;">'+escapeHtml(opt)+'</span>'
    + '</button>'
  ).join('');
  wrap.querySelectorAll('.duel-option-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> selectDuelAnswer(parseInt(btn.dataset.index,10), d));
  });
  duelTimeLeft = d.timePerQuestion;
  document.getElementById('duelTimerBar').style.transition = 'none';
  document.getElementById('duelTimerBar').style.width = '100%';
  void document.getElementById('duelTimerBar').offsetWidth;
  document.getElementById('duelTimerBar').style.transition = 'width 1s linear';
  clearInterval(duelTimerInterval);
  duelTimerInterval = setInterval(()=>{
    duelTimeLeft--;
    const pct = Math.max(0, (duelTimeLeft/d.timePerQuestion)*100);
    document.getElementById('duelTimerBar').style.width = pct + '%';
    if(duelTimeLeft <= 0){
      clearInterval(duelTimerInterval);
      selectDuelAnswer(-1, d); // süre doldu, yanlış say
    }
  }, 1000);
}
async function selectDuelAnswer(index, d){
  clearInterval(duelTimerInterval);
  const q = duelLocalQuestions[duelLocalIndex];
  if(!q) return;
  document.querySelectorAll('.duel-option-btn').forEach(btn=>{
    btn.disabled = true;
    const i = parseInt(btn.dataset.index,10);
    if(i === q.correctIndex){ btn.style.background = 'var(--tint-forest)'; btn.style.borderColor = '#16A34A'; }
    else if(i === index){ btn.style.background = 'var(--tint-rust)'; btn.style.borderColor = 'var(--danger)'; }
  });
  const isCorrect = index === q.correctIndex;
  if(isCorrect) duelLocalScore += 5;
  try{
    const update = {};
    update['scores.'+currentUser.uid] = duelLocalScore;
    update['progress.'+currentUser.uid] = duelLocalIndex+1;
    await db.collection('duels').doc(currentDuelId).update(update);
  }catch(e){}

  setTimeout(async ()=>{
    duelLocalIndex++;
    if(duelLocalIndex >= duelLocalQuestions.length){
      // Bu oyuncu bitirdi
      try{
        await db.collection('duels').doc(currentDuelId).update({
          finishedPlayers: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });
        const doc = await db.collection('duels').doc(currentDuelId).get();
        const dd = doc.data();
        const opponentUid = getDuelOpponentUid(dd);
        if(Array.isArray(dd.finishedPlayers) && dd.finishedPlayers.includes(opponentUid) && dd.status !== 'finished'){
          const myScore = (dd.scores && dd.scores[currentUser.uid]) || 0;
          const oppScore = (dd.scores && dd.scores[opponentUid]) || 0;
          let winnerUid = 'tie';
          if(myScore > oppScore) winnerUid = currentUser.uid;
          else if(oppScore > myScore) winnerUid = opponentUid;
          await db.collection('duels').doc(currentDuelId).update({ status:'finished', winnerUid });
          if(winnerUid !== 'tie'){
            const loserUid = winnerUid === currentUser.uid ? opponentUid : currentUser.uid;
            await db.collection('notifications').add({
              toUid: loserUid, fromUid: currentUser.uid, type:'duel_result', duelId: currentDuelId,
              message: '⚔️ Düello sona erdi: ' + myScore + ' - ' + oppScore, read:false, createdAt:new Date().toISOString()
            });
          }
        }
      }catch(e){}
    } else {
      renderDuelQuestion(d);
    }
  }, 900);
}
function fireDuelConfetti(){
  const wrap = document.getElementById('duelConfettiWrap');
  wrap.innerHTML = '';
  const colors = ['#F59E0B','#EC4899','#818CF8','#34D399','#60A5FA'];
  for(let i=0;i<40;i++){
    const piece = document.createElement('div');
    const color = colors[Math.floor(Math.random()*colors.length)];
    const left = Math.random()*100;
    const delay = Math.random()*0.6;
    const duration = 1.8 + Math.random()*1.2;
    piece.style.cssText = 'position:absolute; top:-10px; left:'+left+'%; width:8px;height:14px; background:'+color+'; opacity:0.9; transform:rotate('+(Math.random()*360)+'deg); animation:duelConfettiFall '+duration+'s ease-in '+delay+'s forwards;';
    wrap.appendChild(piece);
  }
}

// ---------- SIRALAMA (Günlük / Haftalık / Aylık / Genel) ----------
let leaderboardPeriod = 'daily';
let leaderboardExpanded = false;

// ---------- PROFİLDEKİ "SORU ÇÖZ İSTATİSTİKLERİ" KARTI ----------
async function loadQuizStats(){
  const totalEl = document.getElementById('quizStatTotal');
  if(!totalEl || !currentUser) return;
  try{
    const snap = await db.collection('quiz_score_events').where('uid','==',currentUser.uid).get();
    let correct = 0, wrong = 0;
    snap.docs.forEach(d=>{
      const points = d.data().points;
      if(points > 0) correct++; else if(points < 0) wrong++;
    });
    const total = correct + wrong;
    const accuracy = total > 0 ? Math.round((correct/total)*100) + '%' : '-';
    totalEl.textContent = total;
    document.getElementById('quizStatCorrect').textContent = correct;
    document.getElementById('quizStatWrong').textContent = wrong;
    document.getElementById('quizStatAccuracy').textContent = accuracy;
    // Rütbe rozetinin gerçek soru sayısıyla senkron kalması için düzelt (eski cevaplar sayılmamış olabilir)
    const p = profileByUid(currentUser.uid);
    if(p && (p.quizTotalAnswered||0) < total){
      p.quizTotalAnswered = total;
      db.collection('public_profiles').doc(currentUser.uid).set({ quizTotalAnswered: total }, {merge:true}).catch(()=>{});
    }
  }catch(e){ console.error('Soru istatistikleri yüklenemedi', e); }
}

async function loadVpQuizStats(uid){
  const totalEl = document.getElementById('vpQuizStatTotal');
  if(!totalEl) return;
  totalEl.textContent = '…';
  try{
    const snap = await db.collection('quiz_score_events').where('uid','==',uid).get();
    let correct = 0, wrong = 0;
    snap.docs.forEach(d=>{
      const points = d.data().points;
      if(points > 0) correct++; else if(points < 0) wrong++;
    });
    const total = correct + wrong;
    const accuracy = total > 0 ? Math.round((correct/total)*100) + '%' : '-';
    totalEl.textContent = total;
    document.getElementById('vpQuizStatCorrect').textContent = correct;
    document.getElementById('vpQuizStatWrong').textContent = wrong;
    document.getElementById('vpQuizStatAccuracy').textContent = accuracy;
  }catch(e){ console.error('Kullanıcının soru istatistikleri yüklenemedi', e); }
}

async function loadLeaderboard(){
  const listEl = document.getElementById('leaderboardList');
  if(!listEl) return;
  const mainScrollEl = document.querySelector('main');
  const preservedScrollTop = mainScrollEl ? mainScrollEl.scrollTop : 0;
  listEl.style.minHeight = listEl.offsetHeight + 'px'; // içerik yenilenirken yükseklik aniden çökmesin
  listEl.innerHTML = '<div class="hint">Yükleniyor…</div>';
  let ranked = [];
  try{
    if(leaderboardPeriod === 'alltime'){
      const snap = await db.collection('public_profiles').orderBy('quizScore','desc').limit(14).get();
      ranked = snap.docs.map(d => ({ uid: d.id, score: d.data().quizScore||0 }));
    } else {
      const now = new Date();
      let periodStart;
      if(leaderboardPeriod === 'daily'){
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      } else if(leaderboardPeriod === 'weekly'){
        const day = now.getDay();
        const diffToMonday = (day===0?6:day-1);
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()-diffToMonday).getTime();
      } else {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      }
      const snap = await db.collection('quiz_score_events').where('timestamp','>=',periodStart).get();
      const totals = {};
      snap.docs.forEach(d=>{ const data=d.data(); totals[data.uid] = (totals[data.uid]||0) + data.points; });
      ranked = Object.keys(totals).map(uid=>({uid, score: totals[uid]})).sort((a,b)=>b.score-a.score).slice(0,14);
    }
  }catch(e){ console.error('Sıralama yüklenemedi', e); }
  // Sıralamadaki kullanıcılardan önbellekte olmayanları tamamla (isimler eksik gelmesin diye)
  const missingUids = ranked.map(r=>r.uid).filter(uid => !allPublicProfiles.some(p=>p.uid===uid));
  if(missingUids.length > 0){
    try{
      const chunks = [];
      for(let i=0;i<missingUids.length;i+=10) chunks.push(missingUids.slice(i,i+10));
      const results = await Promise.all(chunks.map(chunk => db.collection('public_profiles').where(firebase.firestore.FieldPath.documentId(),'in',chunk).get()));
      results.forEach(snap => snap.docs.forEach(d => {
        if(!allPublicProfiles.some(p=>p.uid===d.id)) allPublicProfiles.push({uid:d.id, ...d.data()});
      }));
    }catch(e){ console.error('Eksik profiller yüklenemedi', e); }
  }
  renderLeaderboardList(ranked);
  listEl.style.minHeight = '';
  if(mainScrollEl) mainScrollEl.scrollTop = preservedScrollTop;
}
function renderLeaderboardList(ranked){
  const visibleCount = leaderboardExpanded ? 14 : 7;
  const shown = ranked.slice(0, visibleCount);
  const listEl = document.getElementById('leaderboardList');
  const expandBtn = document.getElementById('btnExpandLeaderboard');
  if(shown.length === 0){
    listEl.innerHTML = '<div class="hint">Henüz veri yok.</div>';
    expandBtn.style.display = 'none';
    return;
  }
  listEl.innerHTML = shown.map((row,i)=>{
    const p = profileByUid(row.uid);
    const username = (p && p.username) ? p.username : 'kullanici';
    const initials = getInitials(username);
    const rankBadge = quizRankBadgeHtml(row.score, 'font-size:9.5px; padding:1px 7px;', p ? p.quizTotalAnswered : 0);
    const medal = i===0?'🥇':(i===1?'🥈':(i===2?'🥉':(i+1)));
    const borderStyle = (i < shown.length-1) ? 'border-bottom:1px solid var(--line);' : '';
    const avatarInner = (p && p.photoData)
      ? '<img src="'+safeImageSrc(p.photoData)+'" style="width:100%;height:100%; border-radius:50%; object-fit:cover;">'
      : escapeHtml(initials);
    const avatarBg = (p && p.photoData) ? 'transparent' : avatarGradient(row.uid);
    return '<div class="leaderboard-row" data-lb-uid="'+escapeHtml(row.uid)+'" style="display:flex; align-items:center; gap:10px; padding:8px 0; cursor:pointer; '+borderStyle+'">'
      + '<div style="width:24px; text-align:center; font-weight:800; font-size:13px;">'+medal+'</div>'
      + '<div style="width:34px;height:34px;border-radius:50%; background:'+avatarBg+'; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; flex-shrink:0; overflow:hidden;">'+avatarInner+'</div>'
      + '<div style="flex:1; min-width:0;">'
        + '<div style="font-weight:700; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">'+escapeHtml(username)+'</div>'
        + (rankBadge ? '<div style="margin-top:2px;">'+rankBadge+'</div>' : '')
      + '</div>'
      + '<div style="font-weight:800; font-size:13px; color:var(--asphalt);">'+row.score+' pn</div>'
      + '</div>';
  }).join('');
  listEl.querySelectorAll('[data-lb-uid]').forEach(row=>{
    row.addEventListener('click', ()=>{
      const uid = row.dataset.lbUid;
      if(currentUser && uid === currentUser.uid) switchScreen('profil');
      else openViewProfile(uid);
    });
  });
  expandBtn.style.display = (ranked.length > 7) ? 'block' : 'none';
  expandBtn.textContent = leaderboardExpanded ? 'Daralt' : 'Genişlet (14 kişi göster)';
}
document.querySelectorAll('.leaderboard-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.leaderboard-tab').forEach(t=>{ t.classList.remove('active'); });
    tab.classList.add('active');
    leaderboardPeriod = tab.dataset.period;
    leaderboardExpanded = false;
    loadLeaderboard();
  });
});
document.getElementById('btnExpandLeaderboard').addEventListener('click', ()=>{
  leaderboardExpanded = !leaderboardExpanded;
  loadLeaderboard();
});

