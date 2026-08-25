// ---------- SORUYU SESLİ OKUMA (Text-to-Speech) ----------
document.getElementById('btnQuizSpeak').addEventListener('click', ()=>{
  const q = quizSessionQuestions[quizCurrentIndex];
  if(!q || typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(q.question);
  utter.lang = 'tr-TR';
  speechSynthesis.speak(utter);
});

// ---------- SORU KAYDETME / FAVORİLER ----------
async function getBookmarkedQuestionIds(){
  if(!userDocRef) return [];
  try{
    const doc = await userDocRef.get();
    const data = doc.data() || {};
    return Array.isArray(data.quizBookmarkedIds) ? data.quizBookmarkedIds : [];
  }catch(e){ return []; }
}
async function refreshQuizBookmarkBtn(questionId){
  const btn = document.getElementById('btnQuizBookmark');
  if(!btn) return;
  const bookmarked = await getBookmarkedQuestionIds();
  const isSaved = bookmarked.includes(questionId);
  btn.textContent = isSaved ? '★' : '☆';
  btn.style.color = isSaved ? '#F59E0B' : '';
}
document.getElementById('btnQuizBookmark').addEventListener('click', async ()=>{
  const q = quizSessionQuestions[quizCurrentIndex];
  if(!q || !userDocRef) return;
  const bookmarked = await getBookmarkedQuestionIds();
  const isSaved = bookmarked.includes(q.id);
  try{
    if(isSaved){
      await userDocRef.set({ quizBookmarkedIds: firebase.firestore.FieldValue.arrayRemove(q.id) }, {merge:true});
      showToast('Kayıtlardan çıkarıldı');
    } else {
      await userDocRef.set({ quizBookmarkedIds: firebase.firestore.FieldValue.arrayUnion(q.id) }, {merge:true});
      showToast('Soru kaydedildi ⭐');
    }
  }catch(e){ showToast('İşlem başarısız'); }
  refreshQuizBookmarkBtn(q.id);
});

// ---------- SORU BİLDİRME ----------
document.getElementById('btnQuizReport').addEventListener('click', ()=>{
  const q = quizSessionQuestions[quizCurrentIndex];
  if(!q) return;
  document.getElementById('quizReportReason').value = '';
  document.getElementById('quizReportOverlay').style.display = 'flex';
});
document.getElementById('quizReportCancelBtn').addEventListener('click', ()=>{
  document.getElementById('quizReportOverlay').style.display = 'none';
});
document.getElementById('quizReportSendBtn').addEventListener('click', async ()=>{
  const q = quizSessionQuestions[quizCurrentIndex];
  const reason = document.getElementById('quizReportReason').value.trim();
  if(!q) return;
  if(!reason){ showToast('Lütfen kısaca ne yanlış olduğunu yaz'); return; }
  const btn = document.getElementById('quizReportSendBtn');
  btn.disabled = true; btn.textContent = 'Gönderiliyor…';
  try{
    await db.collection('question_reports').add({
      questionId: q.id, questionText: q.question, category: q.category,
      reason, reportedBy: currentUser.uid, status: 'pending', createdAt: new Date().toISOString()
    });
    document.getElementById('quizReportOverlay').style.display = 'none';
    showToast('Bildirdiğin için teşekkürler, yöneticiler kontrol edecek 🚩');
  }catch(e){ showToast('Gönderilemedi: '+(e.message||'')); }
  btn.disabled = false; btn.textContent = '🚩 Bildir';
});
async function renderQuizBookmarksList(){
  const box = document.getElementById('quizBookmarksList');
  if(!box) return;
  box.innerHTML = '<div class="hint">Yükleniyor…</div>';
  const bookmarkedIds = await getBookmarkedQuestionIds();
  if(bookmarkedIds.length === 0){
    box.innerHTML = '<div class="empty"><div class="icon">⭐</div><div class="msg">Henüz kaydettiğin soru yok. Soru çözerken ☆ ikonuna dokunarak kaydedebilirsin.</div></div>';
    return;
  }
  // ÖNEMLİ: Kayıtlı sorular, normal test akışındaki KÜÇÜK rastgele örneklemin
  // içinde olmayabilir — bu yüzden tüm havuzu taramak yerine, sadece bu belirli
  // ID'leri doğrudan çekiyoruz (Firestore'un 'in' sorgusu en fazla 30 ID kabul
  // ettiği için 30'arlık gruplar hâlinde).
  const items = [];
  try{
    for(let i=0; i<bookmarkedIds.length; i+=30){
      const chunk = bookmarkedIds.slice(i, i+30);
      const snap = await db.collection('quiz_questions')
        .where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get();
      snap.docs.forEach(d => items.push({ id: d.id, ...d.data() }));
    }
  }catch(e){ console.error('Kayıtlı sorular çekilemedi', e); }
  if(items.length === 0){
    box.innerHTML = '<div class="empty"><div class="icon">⭐</div><div class="msg">Henüz kaydettiğin soru yok. Soru çözerken ☆ ikonuna dokunarak kaydedebilirsin.</div></div>';
    return;
  }
  box.innerHTML = items.map(q => {
    const correctOpt = (q.options||[])[q.correctIndex] || '';
    return '<div class="card" style="margin-bottom:10px; padding:14px;">'
      + '<div style="font-weight:700; font-size:14px; margin-bottom:8px;">'+escapeHtml(q.question)+'</div>'
      + '<div style="font-size:12.5px; color:#16A34A; font-weight:700; margin-bottom:10px;">✓ '+escapeHtml(correctOpt)+'</div>'
      + '<button class="submit-btn secondary" data-unbookmark="'+escapeHtml(q.id)+'" style="padding:8px; font-size:12px;">☆ Kayıttan Çıkar</button>'
      + '</div>';
  }).join('');
  box.querySelectorAll('[data-unbookmark]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const id = btn.dataset.unbookmark;
      try{
        await userDocRef.set({ quizBookmarkedIds: firebase.firestore.FieldValue.arrayRemove(id) }, {merge:true});
        showToast('Kayıttan çıkarıldı');
        renderQuizBookmarksList();
      }catch(e){ showToast('İşlem başarısız'); }
    });
  });
}

async function getSeenQuestionIds(){
  if(!userDocRef) return [];
  try{
    const doc = await userDocRef.get();
    const data = doc.data() || {};
    return Array.isArray(data.quizSeenQuestionIds) ? data.quizSeenQuestionIds : [];
  }catch(e){ return []; }
}
async function markQuestionsSeen(ids){
  if(!userDocRef || ids.length===0) return;
  try{ await userDocRef.set({ quizSeenQuestionIds: firebase.firestore.FieldValue.arrayUnion(...ids) }, {merge:true}); }
  catch(e){ console.error('Görülen sorular kaydedilemedi', e); }
}

// ---------- GÜNLÜK GÖREVLER ----------
const DAILY_QUESTS_DEF = [
  { id:'total5', label:'Bugün 5 soru çöz', icon:'🧠', target:5, field:'totalAnswered', reward:15 },
  { id:'genel3', label:'Genel Kültür\'den 3 soru çöz', icon:'🌍', target:3, field:'genelAnswered', reward:10 },
  { id:'islami3', label:'İslami Bilgiler\'den 3 soru çöz', icon:'🕌', target:3, field:'islamiAnswered', reward:10 },
  { id:'joker1', label:'1 kez 50/50 joker kullan', icon:'🃏', target:1, field:'jokerUsed', reward:10 },
];
async function getDailyQuestData(){
  if(!userDocRef) return { date: todayStr(), totalAnswered:0, genelAnswered:0, islamiAnswered:0, jokerUsed:0, claimed:[] };
  try{
    const doc = await userDocRef.get();
    const data = doc.data() || {};
    const today = todayStr();
    if(data.dailyQuestData && data.dailyQuestData.date === today) return data.dailyQuestData;
    return { date: today, totalAnswered:0, genelAnswered:0, islamiAnswered:0, jokerUsed:0, claimed:[] };
  }catch(e){ return { date: todayStr(), totalAnswered:0, genelAnswered:0, islamiAnswered:0, jokerUsed:0, claimed:[] }; }
}
async function updateDailyQuestProgress({ category, jokerUsed }){
  if(!userDocRef) return;
  try{
    const data = await getDailyQuestData();
    data.totalAnswered = (data.totalAnswered||0) + (category ? 1 : 0);
    if(category === 'genel_kultur') data.genelAnswered = (data.genelAnswered||0) + 1;
    if(category === 'islami') data.islamiAnswered = (data.islamiAnswered||0) + 1;
    if(jokerUsed) data.jokerUsed = (data.jokerUsed||0) + 1;
    await userDocRef.set({ dailyQuestData: data }, {merge:true});
    refreshDailyQuestBadge();
  }catch(e){ console.error('Görev ilerlemesi kaydedilemedi', e); }
}
async function refreshDailyQuestBadge(){
  const badge = document.getElementById('dailyQuestBadge');
  if(!badge) return;
  const data = await getDailyQuestData();
  const claimable = DAILY_QUESTS_DEF.filter(q => (data[q.field]||0) >= q.target && !(data.claimed||[]).includes(q.id)).length;
  if(claimable > 0){ badge.style.display = 'block'; badge.textContent = claimable; }
  else badge.style.display = 'none';
}
