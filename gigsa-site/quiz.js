/* ════════════════════════════════════════════════════════════
   실기 필답 훈련 엔진 — 단답 회상 + 나열형 + 간격반복
   ────────────────────────────────────────────────────────────
   - 단답 카드는 DICT(사전 데이터)를 역방향으로 자동 생성:
     한줄정의(+상세설명 힌트)를 보고 용어명을 써내는 형태.
   - 나열형 카드는 quiz-data.js 의 QLISTS.
   - 채점: 완전일치(한글·영문·약어 모두 인정) / 순서일치 / 세트일치.
   - 간격반복: 4단계 상자(모름→즉시 재출제, 이후 1일·3일·7일).
   - 기존 '모름' 표시(gigsa_gloss_v2)는 최초 1회 모름 상자로 이관.
   ════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const T_NAME=0,T_EN=1,T_SHORT=2,T_DETAIL=3,T_CONF=4,T_EXAM=5;
const $=id=>document.getElementById(id);
const DAY=86400000;

/* ── 정규화·채점 ── */
const norm = s => String(s==null?"":s).toLowerCase()
  .replace(/\(.*?\)/g," ")          // 괄호 내 제거 (별도 후보로도 추가)
  .replace(/[^0-9a-z가-힣]/g,"");   // 한글·영문·숫자만
const normKeepParen = s => {        // 괄호 안까지 먹는 변형
  const m=String(s||"").match(/\(([^)]+)\)/);
  return m?norm(m[1]):"";
};
/* 답 구분: 쉼표·세미콜론·슬래시·줄바꿈이 우선. 구분자가 없으면 공백으로 나눔.
   단, 정답이 1개뿐인 카드는 복합어("Watering Hole") 보호를 위해 통째로 1토큰. */
const splitAns = (s,expected) => {
  const str=String(s||"").trim();
  if(!str) return [];
  if(expected===1) return [str];
  const bySep=str.split(/[,，、;；·\/\n\t]+/).map(x=>x.trim()).filter(Boolean);
  if(bySep.length>1) return bySep;
  return str.split(/\s+/).filter(Boolean);
};

/* 단답 카드의 정답 후보 집합 만들기 */
function termAnswers(t){
  const set=new Set();
  const add=v=>{ const n=norm(v); if(n) set.add(n); };
  add(t[T_NAME]);
  const par=normKeepParen(t[T_NAME]); if(par) set.add(par);
  const en=String(t[T_EN]||"");
  if(en){
    add(en);
    en.split(/[\/·,()]/).map(x=>x.trim()).filter(x=>x.length>1).forEach(add);
    const p=normKeepParen(en); if(p) set.add(p);
  }
  return set;
}
/* 프롬프트용: 상세설명에서 용어명·영문명 마스킹 */
function maskDetail(t){
  let d=String(t[T_DETAIL]||"");
  const pats=[t[T_NAME], String(t[T_NAME]||"").replace(/\s+/g,"")];
  if(t[T_EN]){ String(t[T_EN]).split(/[\/·,]/).forEach(x=>{x=x.trim(); if(x.length>1)pats.push(x);}); }
  pats.filter(Boolean).sort((a,b)=>b.length-a.length).forEach(p=>{
    try{ d=d.replace(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"),"____"); }catch(e){}
  });
  return d;
}

/* ── 카드 풀 구축 ── */
const CARDS=[];
DICT.forEach((ch,ci)=>ch.T.forEach((t,ti)=>{
  if(!t[T_SHORT]||!t[T_NAME]) return;
  CARDS.push({k:"t", id:"qt_"+ci+"_"+ti, s:ch.s, chn:ch.n, chc:ch.c,
    name:t[T_NAME], en:t[T_EN]||"", short:t[T_SHORT], detail:maskDetail(t),
    exam:t[T_EXAM]||"", conf:t[T_CONF]||"", ans:termAnswers(t)});
}));
(window.QLISTS||[]).forEach((L,i)=>{
  CARDS.push({k:"l", id:"ql_"+i, s:L.s, name:L.t, title:L.t, ordered:!!L.o,
    items:L.a, alias:L.alias||[], hint:L.h||"", note:L.note||""});
});
(window.QCODE||[]).forEach((P,i)=>{
  CARDS.push({k:"c", id:"qc_"+i, s:P.s, name:P.tag||P.lang, lang:P.lang,
    code:P.code, q:P.q, note:P.note||"", a0:P.a[0]||"", ans:new Set(P.a.map(norm))});
});
const BYID=new Map(CARDS.map(c=>[c.id,c]));

/* ── SRS 저장소 ── */
const KEY="gigsa_quiz_v1";
let ST={};
try{ const r=localStorage.getItem(KEY); if(r) ST=JSON.parse(r)||{}; }catch(e){}
const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(ST)); }catch(e){} };
const rec=id=>ST[id]||(ST[id]={lv:0,due:0,seen:0,ok:0,ng:0});
const INT=[0, DAY, 3*DAY, 7*DAY];      // lv0=즉시 재출제, lv1=1일, lv2=3일, lv3=7일
/* 기존 '모름' 마킹을 한 번만 이관 */
if(!ST.__mig){
  try{
    const u=new Set(JSON.parse(localStorage.getItem("gigsa_gloss_v2")||"[]"));
    CARDS.forEach(c=>{ if(c.k==="t"&&u.has(c.name)){ const r=rec(c.id); r.due=Date.now(); }});
  }catch(e){}
  ST.__mig=1; save();
}

/* ── 세션 상태 ── */
let Q={ list:[], i:0, ok:0, ng:0, wrong:[], missed:new Set(), locked:false, mode:"due", subj:0, live:false };

function dueCards(){ const now=Date.now(); return CARDS.filter(c=>ST[c.id]&&ST[c.id].seen>0&&ST[c.id].due<=now); }
function newCards(){ return CARDS.filter(c=>!(ST[c.id]&&ST[c.id].seen>0)); }
function unseenListCards(){ return CARDS.filter(c=>c.k==="l"&&!(ST[c.id]&&ST[c.id].seen>0)); }

function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function buildQueue(mode,subj){
  let pool=[];
  if(mode==="due") pool=dueCards();
  else if(mode==="new") pool=newCards();
  else if(mode==="list") pool=CARDS.filter(c=>c.k==="l");
  else if(mode==="code") pool=CARDS.filter(c=>c.k==="c");
  else if(mode==="all") pool=dueCards().concat(newCards());
  if(subj) pool=pool.filter(c=>c.s===subj);
  /* 복습은 기한 오래 지난 순, 새 카드는 사전 순서 섞기 */
  pool.sort((a,b)=>{ const ra=ST[a.id],rb=ST[b.id];
    if(ra&&rb) return ra.due-rb.due;
    if(ra) return -1; if(rb) return 1;
    return 0; });
  const duePart=pool.filter(c=>ST[c.id]&&ST[c.id].seen>0);
  const newPart=shuffle(pool.filter(c=>!(ST[c.id]&&ST[c.id].seen>0)));
  return duePart.concat(newPart).slice(0,80);
}

/* ── 화면 ── */
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

/* 모의고사: 단답4+나열형3+코드3 믹스, 45분 타이머 */
function mockQueue(){
  const pick=k=>shuffle(CARDS.filter(c=>c.k===k));
  const terms=pick("t").slice(0,4), lists=pick("l").slice(0,3), codes=pick("c").slice(0,3);
  return shuffle(terms.concat(lists,codes));
}
function fmtLeft(ms){
  ms=Math.max(0,ms); const s=Math.floor(ms/1000);
  return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
}
function tick(){
  const el=$("qztime");
  if(!Q.live||!Q.mockEnd){ if(Q.timer){clearInterval(Q.timer);Q.timer=null;} return; }
  const left=Q.mockEnd-Date.now();
  if(el) el.textContent=fmtLeft(left);
  if(left<=0){ clearInterval(Q.timer); Q.timer=null; renderDone(); }
}

function renderHome(){
  const due=dueCards().length, unseenL=unseenListCards().length;
  const nList=CARDS.filter(c=>c.k==="l").length, nCode=CARDS.filter(c=>c.k==="c").length;
  const lv=[0,0,0,0];
  CARDS.forEach(c=>{ const r=ST[c.id]; if(r&&r.seen>0) lv[Math.min(r.lv,3)]++; });
  const seen=lv[0]+lv[1]+lv[2]+lv[3];
  $("qzhome").innerHTML =
    '<div class="qzstats">'+
    '<div class="qzs"><b>'+due+'</b>오늘 복습</div>'+
    '<div class="qzs"><b>'+(CARDS.length-seen)+'</b>미학습</div>'+
    '<div class="qzs"><b>'+lv[3]+'</b>완전암기</div>'+
    '<div class="qzs"><b>'+nList+'</b>나열형 목록</div>'+
    '</div>'+
    '<div class="qzgo">'+
    '<button class="qzb primary" data-qmode="due">오늘 복습 시작'+(due?' ('+Math.min(due,80)+'문제)':'')+'</button>'+
    '<div class="qzrow">'+
    '<button class="qzb" data-qmode="new">새 카드 학습</button>'+
    '<button class="qzb" data-qmode="list">나열형·두음만'+(unseenL?' ('+unseenL+'개 새 목록)':'')+'</button>'+
    '<button class="qzb" data-qmode="code">코드·SQL만 ('+nCode+'문제)</button>'+
    '</div>'+
    '<div class="qzrow">'+
    '<button class="qzb warnb" data-qmode="mock">⏱ 모의고사 10문제 · 45분</button>'+
    '<button class="qzb" data-qmode="all">전체 랜덤</button>'+
    '</div></div>'+
    '<div class="qzsub">과목 좁히기 — 시작 전 아래에서 선택</div>'+
    '<div class="qzsubs">'+
    '<button type="button" class="pill'+(Q.subj===0?' on':'')+'" data-qs="0">전체</button>'+
    [1,2,3,4,5].map(i=>'<button type="button" class="pill'+(Q.subj===i?' on':'')+'" data-s="'+i+'" data-qs="'+i+'">'+i+'과목</button>').join("")+
    '</div>'+
    (seen?'<div class="qzmemo">학습 진행: 모름 '+lv[0]+' · 복습중(1일) '+lv[1]+' · 암기중(3일) '+lv[2]+' · 완전암기(7일) '+lv[3]+'</div>':'')+
    '<div class="qzmemo">답은 쉼표·줄바꿈으로 구분해 쓰면 됩니다. 나열형은 순서 표시(①②③)가 있으면 순서대로 써야 합니다. 영문은 한글과 함께 정답으로 인정됩니다.</div>';
}

function renderCard(){
  const c=Q.list[Q.i];
  Q.locked=false;
  const n=Q.i+1, total=Q.list.length;
  let body="";
  if(c.k==="t"){
    body='<div class="qztag">'+c.s+'과목 · '+esc(c.chn+" "+c.chc)+'</div>'+
      '<div class="qzp">'+esc(c.short)+'</div>'+
      '<details class="qzh"><summary>상세 설명 힌트</summary><p>'+esc(c.detail)+'</p></details>'+
      '<label class="qzl">이 용어의 이름을 쓰시오. <span class="qzm">(한글·영문·약어 모두 정답)</span></label>'+
      '<input id="qzans" class="qzinp" autocomplete="off" autocapitalize="none" enterkeyhint="done" placeholder="답 입력">';
  }else if(c.k==="c"){
    body='<div class="qztag">'+(c.lang==="sql"?"SQL":c.lang.toUpperCase())+' · '+c.s+'과목 · '+esc(c.name)+'</div>'+
      '<pre class="qzcode">'+esc(c.code)+'</pre>'+
      '<div class="qzp">'+esc(c.q)+'</div>'+
      '<label class="qzl">결과를 쓰시오. <span class="qzm">(대소문자·공백·기호 무관)</span></label>'+
      '<textarea id="qzans" class="qzinp" rows="2" autocomplete="off" autocapitalize="none" placeholder="출력 또는 빈칸 답"></textarea>';
  }else{
    const seq=c.ordered?'<span class="qzseq">① 순서대로</span>':'<span class="qzseq">개수만큼 정확히</span>';
    body='<div class="qztag">나열형 · '+c.s+'과목</div>'+
      '<div class="qzp">'+esc(c.title)+' '+seq+'</div>'+
      (c.hint?'<details class="qzh"><summary>두음 힌트</summary><p class="qzdu">'+esc(c.hint)+'</p></details>':'')+
      '<label class="qzl">정답 '+c.items.length+'가지를 쉼표로 구분해 쓰시오.</label>'+
      '<textarea id="qzans" class="qzinp" rows="3" autocomplete="off" autocapitalize="none" placeholder="예) 항목1, 항목2, ..."></textarea>';
  }
  $("qzcard").innerHTML =
    '<div class="qzbar"><span>'+n+' / '+total+'</span>'+(Q.mockEnd?'<span class="qztime" id="qztime"></span>':'')+'<span class="qzok">정답 '+Q.ok+'</span><span class="qzno">오답 '+Q.ng+'</span></div>'+
    '<div class="qzpanel">'+body+'</div>'+
    '<div class="qzact"><button class="qzb primary" id="qzgo">제출 (Enter)</button><button class="qzb ghost" id="qzskip">모름 (건너뛰기)</button></div>'+
    '<div id="qzfb"></div>';
  const inp=$("qzans");
  setTimeout(()=>{ try{ inp.focus(); }catch(e){} },80);
  inp.addEventListener("keydown",e=>{
    if(e.key==="Enter"&&(c.k==="t"||e.ctrlKey||e.metaKey)){ e.preventDefault(); grade(); }
  });
  $("qzgo").addEventListener("click",grade);
  $("qzskip").addEventListener("click",()=>mark(c,false,true));
}

function grade(){
  const c=Q.list[Q.i], inp=$("qzans");
  if(!inp||Q.locked) return;
  const raw=inp.value.trim();
  if(!raw){ inp.focus(); return; }
  let correct=false, detail="";
  if(c.k==="t"){
    correct=c.ans.has(norm(raw))||c.ans.has(normKeepParen(raw)||"");
    detail='정답: <b>'+esc(c.name)+'</b>'+(c.en?' <span class="qzen">'+esc(c.en)+'</span>':'');
  }else if(c.k==="c"){
    correct=c.ans.has(norm(raw));
    detail='정답: <b>'+esc(c.a0||"")+'</b>'+(c.note?'<p class="qznote">'+esc(c.note)+'</p>':'');
  }else{
    const toks=splitAns(raw,c.items.length).map(x=>({raw:x,n:norm(x)}));
    const want=c.items.map((x,i)=>[x,...(c.alias[i]||[])]);
    const used=new Array(toks.length).fill(false);
    const res=want.map((cand,idx)=>{
      const norms=cand.map(norm);
      let hit=-1;
      toks.forEach((t,ti)=>{ if(used[ti])return; if(norms.includes(t.n)){ hit=ti; }});
      if(hit>=0) used[hit]=true;
      return {want:c.items[idx], ok:hit>=0, posOk:c.ordered?(hit===idx):hit>=0};
    });
    const allFound=res.every(r=>r.ok);
    const orderOk=c.ordered?res.every(r=>r.posOk):true;
    const extra=toks.filter((t,i)=>!used[i]).length===0;
    correct=allFound&&orderOk&&extra;
    detail='<ol class="qzchk">'+res.map((r,i)=>
      '<li class="'+(r.ok&&(r.posOk||!c.ordered)?'g':'b')+'">'+(i+1)+'. '+esc(r.want)+
      (r.ok?(c.ordered&&!r.posOk?' <span class="qzwarn">(위치 다름)</span>':''):' <span class="qzwarn">(빠짐/오답)</span>')+
      '</li>').join("")+'</ol>';
    if(c.note) detail+='<p class="qznote">'+esc(c.note)+'</p>';
  }
  mark(c,correct,false,raw,detail);
}

function mark(c,correct,skipped,raw,detail){
  const r=rec(c.id); const now=Date.now();
  r.seen++; if(correct) r.ok++; else r.ng++;
  if(correct){ r.lv=Math.min(r.lv+1,3); r.due=now+INT[r.lv]; }
  else{ r.lv=0; r.due=now; Q.wrong.push(c.id); Q.missed.add(c.id); }
  save();
  if(correct) Q.ok++; else Q.ng++;
  const okEl=document.querySelector("#quizview .qzok"), noEl=document.querySelector("#quizview .qzno");
  if(okEl) okEl.textContent="정답 "+Q.ok;
  if(noEl) noEl.textContent="오답 "+Q.ng;
  Q.locked=true;
  ["qzans","qzgo","qzskip"].forEach(id=>{ const b=$(id); if(b) b.disabled=true; });

  let fb;
  if(correct){
    fb='<div class="qzres ok">정답입니다'+(c.k==="t"?': <b>'+esc(c.name)+'</b>'+(c.en?' · '+esc(c.en):''):'')+'</div>';
  }else{
    fb='<div class="qzres bad">'+(skipped?'모름으로 표시했습니다.':'오답입니다.')+'</div>'+
      '<div class="qzans-box">'+(raw?'<div class="qzmine">내 답: '+esc(raw)+'</div>':'')+
      (detail||('정답: <b>'+esc(c.name)+'</b>'+(c.en?' · '+esc(c.en):'')))+
      (c.k==="t"&&c.detail?'<details class="qzh" open><summary>상세 설명</summary><p>'+esc(c.detail)+'</p></details>':'')+
      (c.k==="t"?'<button class="qzb ghost small" id="qzdict">사전에서 보기</button>':'')+'</div>';
  }
  $("qzfb").innerHTML=fb+
    '<div class="qzact"><button class="qzb primary" id="qznext">다음 →</button></div>';
  const bd=$("qzdict");
  if(bd) bd.addEventListener("click",()=>{ if(window.GIGSA) window.GIGSA.openInDict(c.name); });
  $("qznext").addEventListener("click",next);
  $("qznext").focus();
}

function next(){
  Q.i++;
  if(Q.i>=Q.list.length){
    /* lv0(오답) 카드는 같은 세션 끝에 한 번 더 — 최대 원래 길이만큼 재투입 */
    const again=Q.wrong.map(id=>BYID.get(id)).filter(Boolean).slice(0,30);
    if(again.length){ Q.list=Q.list.concat(again); Q.wrong=[]; $("qzcard").innerHTML='<div class="qzmemo">오답 '+again.length+'개를 다시 풉니다.</div>'; setTimeout(renderCard,900); return; }
    return renderDone();
  }
  renderCard();
}

function renderDone(){
  if(Q.timer){ clearInterval(Q.timer); Q.timer=null; }
  const tot=Q.ok+Q.ng;
  const acc=tot?Math.round(Q.ok/tot*100):0;
  /* 이 세션에서 틀렸고 아직 lv0(자동 재출제에서도 못 맞춘)인 카드만 다시 풀기 */
  const stillWrong=[...Q.missed].map(id=>BYID.get(id)).filter(c=>c&&ST[c.id]&&ST[c.id].lv===0);
  $("qzcard").innerHTML =
    '<div class="qzdone">'+
    '<div class="qzscore">'+Q.ok+' / '+tot+' <span>정답률 '+acc+'%</span></div>'+
    '<div class="qzmemo">오답은 오늘 복습 큐에 유지되고, 맞은 카드는 다음 복습일에 다시 나옵니다.</div>'+
    '<div class="qzact">'+
    '<button class="qzb primary" id="qzagain">홈으로</button>'+
    (stillWrong.length?'<button class="qzb" id="qzretry">오답만 다시 ('+stillWrong.length+'개)</button>':'')+
    '</div></div>';
  $("qzagain").addEventListener("click",()=>{ Q.live=false; renderHome(); $("qzcard").innerHTML=""; $("qzhome").hidden=false; });
  const rt=$("qzretry");
  if(rt) rt.addEventListener("click",()=>{
    Q={list:stillWrong.slice(0,40),i:0,ok:0,ng:0,wrong:[],missed:new Set(),locked:false,mode:Q.mode,subj:Q.subj,live:true};
    $("qzhome").hidden=true; renderCard();
  });
}

/* ── 이벤트 ── */
$("qzhome").addEventListener("click",e=>{
  const m=e.target.closest("[data-qmode]");
  if(m){ start(m.dataset.qmode); return; }
  const s=e.target.closest("[data-qs]");
  if(s){ Q.subj=+s.dataset.qs; renderHome(); }
});
function start(mode){
  const list=(mode==="mock")?mockQueue():buildQueue(mode,Q.subj);
  if(!list.length){
    $("qzcard").innerHTML='<div class="empty">풀 카드가 없습니다.<br>복습할 카드가 도착하거나 새 카드 모드를 이용해 보세요.</div>';
    return;
  }
  if(Q.timer){ clearInterval(Q.timer); Q.timer=null; }
  Q={list,i:0,ok:0,ng:0,wrong:[],missed:new Set(),locked:false,mode,subj:Q.subj,live:true};
  if(mode==="mock"){ Q.mockEnd=Date.now()+45*60*1000; Q.timer=setInterval(tick,1000); }
  $("qzhome").hidden=true;
  renderCard();
}

window.Quiz={ show(){
    if(Q.live){ $("qzhome").hidden=true; if(Q.mockEnd&&!Q.timer) Q.timer=setInterval(tick,1000); }
    else { $("qzhome").hidden=false; renderHome(); }
  },
  hide(){ if(Q.timer){ clearInterval(Q.timer); Q.timer=null; } } };
renderHome();
})();
