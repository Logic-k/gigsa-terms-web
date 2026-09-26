/* 정보처리기사 용어사전 — 앱 로직 */
(function(){
"use strict";
const DIA = window.DIA || {};
const EX  = window.EX  || {};
const T_NAME=0,T_EN=1,T_SHORT=2,T_DETAIL=3,T_CONF=4,T_EXAM=5;
const $ = id => document.getElementById(id);

/* ── 인덱스 ── */
const FLAT=[], BYNAME=new Map(), BYCH=DICT.map(()=>[]);
DICT.forEach((ch,ci)=>ch.T.forEach((t,ti)=>{
  const r={t,ci,ti,s:ch.s,chn:ch.n,chc:ch.c,id:"t"+ci+"_"+ti,dia:DIA[t[T_NAME]]||null,ex:EX[t[T_NAME]]||null};
  FLAT.push(r); BYCH[ci].push(r);
  if(!BYNAME.has(t[T_NAME])) BYNAME.set(t[T_NAME],r);
}));
const conf = t => (t[T_CONF]||"").split("|").map(x=>x.trim()).filter(Boolean);
const nDia = FLAT.filter(r=>r.dia).length;
const nEx  = FLAT.filter(r=>r.ex).length;
const nLink = FLAT.reduce((s,r)=>s+conf(r.t).length,0);

/* ── 저장 ── */
const KEY="gigsa_gloss_v2";
let unk=new Set();
try{ const r=localStorage.getItem(KEY); if(r) unk=new Set(JSON.parse(r)); }catch(e){}
const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify([...unk])); }catch(e){} };
try{ const th=localStorage.getItem(KEY+"_t"); if(th) document.documentElement.setAttribute("data-t",th); }catch(e){}

/* ── 상태 ── */
let curS=0, curQ="", onlyUnk=false;
const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const norm = s => String(s).toLowerCase().replace(/\s+/g,"");
const safeScroll=(el,blk)=>{ try{ if(el&&el.scrollIntoView) el.scrollIntoView({behavior:"smooth",block:blk||"start"}); }catch(e){} };
const toTop=()=>{ try{ window.scrollTo({top:0,behavior:"smooth"}); }catch(e){ try{window.scrollTo(0,0);}catch(_){} } };

/* ── 검색/필터 ── */
function match(r){
  if(curS && r.s!==curS) return false;
  if(onlyUnk && !unk.has(r.t[T_NAME])) return false;
  if(!curQ) return true;
  const blob = norm(r.t.join(" ")+" "+r.chc+" "+r.chn+" "+(r.ex?r.ex.join(" "):""));
  return norm(curQ).split(",").filter(Boolean).every(w=>blob.includes(w));
}
function hl(s){
  const q=curQ.trim(); if(!q) return esc(s);
  try{
    const re=new RegExp("("+q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","gi");
    return esc(s).replace(re,'<mark class="hit">$1</mark>');
  }catch(e){ return esc(s); }
}

/* ── 용어 카드 ── */
function card(r){
  const t=r.t, name=t[T_NAME], u=unk.has(name);
  const cf = conf(t).map(c=>{
    const dead=!BYNAME.has(c);
    return '<button type="button" class="'+(dead?'dead':'')+'" data-go="'+esc(c)+'"'+(dead?' disabled':'')+'>'+esc(c)+(dead?' (미등록)':'')+'</button>';
  }).join("");
  let bd='<div class="lb">상세 설명</div><p class="dt">'+hl(t[T_DETAIL])+'</p>';
  if(r.ex) bd+='<div class="lb">예시로 붙잡기</div><div class="ex">'+
    '<div class="row"><span class="ic">사례</span><span class="tx">'+hl(r.ex[0])+'</span></div>'+
    '<div class="row h"><span class="ic">고리</span><span class="tx">'+hl(r.ex[1])+'</span></div></div>';
  if(r.dia) bd+='<div class="lb">도식</div><div class="dgslot" data-spec="1"></div>';
  const demo=window.DemoHub&&window.DemoHub.forTerm&&window.DemoHub.forTerm(name);
  if(demo) bd+='<div class="lb">인터랙티브 자료</div><button type="button" class="demobtn" data-demo="'+esc(demo.id)+'">▶ '+esc(demo.icon||'')+' '+esc(demo.title)+' 열기</button>';
  if(cf) bd+='<div class="lb">함께 봐야 할 혼동 용어</div><div class="cf">'+cf+'</div>';
  if(t[T_EXAM]) bd+='<div class="lb">출제 형태</div><p class="xp">'+hl(t[T_EXAM])+'</p>';
  bd+='<div class="lb">위치</div><p class="dt"><span class="tag">'+r.chn+' '+esc(r.chc)+'</span><span class="tag">'+r.s+'과목 '+esc(SUBJ[r.s])+'</span></p>';
  return '<article class="tm'+(u?' unk':'')+'" id="'+r.id+'" data-n="'+esc(name)+'" data-ci="'+r.ci+'" data-ti="'+r.ti+'">'+
    '<div class="th"><button type="button" class="mk'+(u?' on':'')+'" aria-label="모르는 용어 표시">?</button>'+
    '<div class="hd"><span class="nm">'+hl(name)+'</span>'+(t[T_EN]?'<span class="en">'+hl(t[T_EN])+'</span>':'')+
    '<span class="sh1">'+hl(t[T_SHORT])+'</span></div>'+
    (r.ex?'<span class="exico">예시</span>':'')+(r.dia?'<span class="dgico">그림</span>':'')+'</div>'+
    '<div class="bd">'+bd+'</div></article>';
}

function render(){
  let html="", shown=0;
  DICT.forEach((ch,ci)=>{
    const recs=BYCH[ci].filter(match);
    if(!recs.length) return;
    shown+=recs.length;
    html+='<section class="chap" id="c'+ci+'" data-s="'+ch.s+'">'+
      '<h2><span class="num">'+ch.n+'</span>'+esc(ch.c)+'</h2>'+
      '<p class="cm">'+ch.s+'과목 '+esc(SUBJ[ch.s])+' · 출제기준 「'+esc(ch.g)+'」 · 용어 '+recs.length+'개'+
      (recs.filter(r=>r.dia).length?' · 도식 '+recs.filter(r=>r.dia).length+'개':'')+'</p>'+
      recs.map(card).join("")+'</section>';
  });
  $("list").innerHTML = html || '<div class="empty">조건에 맞는 용어가 없습니다.<br>검색어를 줄이거나 과목 필터를 해제해 보세요.</div>';
  $("stat").textContent = "표시 "+shown+" / 전체 "+FLAT.length+"개 · 모름 "+unk.size+"개"+(curS?" · "+curS+"과목":"");
}

/* ── 도식 지연 렌더 ── */
function fillDia(tm){
  const slot=tm.querySelector(".dgslot[data-spec]");
  if(!slot) return;
  const r=BYCH[+tm.dataset.ci][ +tm.dataset.ti ];
  slot.removeAttribute("data-spec");
  try{ slot.innerHTML = window.renderDiagram(r.dia)||""; }
  catch(e){ slot.innerHTML='<div class="dgerr">도식을 표시할 수 없습니다.</div>'; }
}

/* ── 사이드바 / 과목 필터 ── */
function chips(){
  const c={0:FLAT.length}; for(let i=1;i<=5;i++) c[i]=FLAT.filter(r=>r.s===i).length;
  $("snav").innerHTML =
    '<button type="button" class="pill'+(curS===0?' on':'')+'" data-s="0">전체<span class="n">'+c[0]+'</span></button>'+
    [1,2,3,4,5].map(i=>'<button type="button" class="pill'+(curS===i?' on':'')+'" data-s="'+i+'">'+i+'과목<span class="n">'+c[i]+'</span></button>').join("")+
    '<button type="button" class="pill'+(onlyUnk?' on':'')+'" id="bUnk">모름 '+unk.size+'</button>';
}
function nav(){
  let last=0,h="";
  DICT.forEach((ch,ci)=>{
    if(curS&&ch.s!==curS) return;
    if(ch.s!==last){ h+='<div class="sh">'+ch.s+'과목 '+esc(SUBJ[ch.s])+'</div>'; last=ch.s; }
    const dc=BYCH[ci].filter(r=>r.dia).length;
    h+='<a data-c="c'+ci+'"><span>'+ch.n+' '+esc(ch.c)+'</span><b>'+ch.T.length+(dc?' · 그림'+dc:'')+'</b></a>';
  });
  $("cnav").innerHTML=h;
}
const drawer = on => { $("side").classList.toggle("show",on); $("scrim").classList.toggle("show",on);
  document.body.style.overflow = on?"hidden":""; };

/* ── 색인 ── */
const CHO=["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const CM={"ㄲ":"ㄱ","ㄸ":"ㄷ","ㅃ":"ㅂ","ㅆ":"ㅅ","ㅉ":"ㅈ"};
function initial(s){
  const c=String(s).trim()[0]; if(!c) return "#";
  const k=c.charCodeAt(0);
  if(k>=0xAC00&&k<=0xD7A3){ const x=CHO[Math.floor((k-0xAC00)/588)]; return CM[x]||x; }
  if(/[A-Za-z]/.test(c)) return c.toUpperCase();
  return "#";
}
function buildIdx(){
  const g={}; FLAT.forEach(r=>{ const k=initial(r.t[T_NAME]); (g[k]=g[k]||[]).push(r); });
  const order=["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]
    .concat("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")).concat(["#"]).filter(k=>g[k]);
  $("idx").innerHTML =
    '<div style="font-size:12.5px;color:var(--dim)">전체 '+FLAT.length+'개 용어 색인 — 글자를 눌러 이동</div>'+
    '<div class="jump">'+order.map(k=>'<button type="button" data-j="g'+encodeURIComponent(k)+'">'+esc(k)+'</button>').join("")+'</div>'+
    order.map(k=>'<div class="grp" id="g'+encodeURIComponent(k)+'"><div class="gl">'+esc(k)+' · '+g[k].length+'개</div><div class="il">'+
      g[k].sort((a,b)=>a.t[T_NAME].localeCompare(b.t[T_NAME],"ko"))
        .map(r=>'<button type="button" data-go="'+esc(r.t[T_NAME])+'">'+esc(r.t[T_NAME])+(r.dia?' ▤':'')+'</button>').join("")+
      '</div></div>').join("");
}

/* ── 이동 ── */
function goTo(name){
  const r=BYNAME.get(name); if(!r) return;
  $("idx").classList.remove("on");
  drawer(false);
  let need=false;
  if(curS && r.s!==curS){ curS=0; need=true; }
  if(curQ){ curQ=""; $("q").value=""; need=true; }
  if(onlyUnk && !unk.has(name)){ onlyUnk=false; need=true; }
  if(need){ chips(); nav(); render(); }
  const el=$(r.id); if(!el) return;
  el.classList.add("open"); fillDia(el);
  el.classList.remove("flash");
  safeScroll(el,"center");
  void el.offsetWidth; el.classList.add("flash");
}

/* ── 이벤트 ── */
$("list").addEventListener("click",e=>{
  const dm=e.target.closest("[data-demo]"); if(dm){ e.stopPropagation(); if(window.DemoHub) window.DemoHub.open(dm.dataset.demo); return; }
  const go=e.target.closest("[data-go]"); if(go){ goTo(go.dataset.go); return; }
  const tm=e.target.closest(".tm"); if(!tm) return;
  if(e.target.closest(".mk")){
    const n=tm.dataset.n;
    if(unk.has(n)) unk.delete(n); else unk.add(n);
    save();
    tm.classList.toggle("unk",unk.has(n));
    tm.querySelector(".mk").classList.toggle("on",unk.has(n));
    chips();
    $("stat").textContent="표시 "+document.querySelectorAll(".tm").length+" / 전체 "+FLAT.length+"개 · 모름 "+unk.size+"개";
    if(onlyUnk) render();
    return;
  }
  if(e.target.closest(".th")){
    const on=tm.classList.toggle("open");
    if(on) fillDia(tm);
  }
});
$("idx").addEventListener("click",e=>{
  const j=e.target.closest("[data-j]"); if(j){ safeScroll($(j.dataset.j)); return; }
  const go=e.target.closest("[data-go]"); if(go) goTo(go.dataset.go);
});
$("snav").addEventListener("click",e=>{
  const b=e.target.closest(".pill"); if(!b) return;
  if(b.id==="bUnk"){ onlyUnk=!onlyUnk; chips(); render(); toTop(); return; }
  curS=+b.dataset.s; chips(); nav(); render(); toTop();
});
$("cnav").addEventListener("click",e=>{
  const a=e.target.closest("a"); if(!a) return;
  drawer(false); setTimeout(()=>safeScroll($(a.dataset.c)),60);
});
let deb; const qEl=$("q");
qEl.addEventListener("input",e=>{ clearTimeout(deb); deb=setTimeout(()=>{ curQ=e.target.value.trim(); render(); },180); });
qEl.addEventListener("keydown",e=>{ if(e.key==="Enter") qEl.blur(); });
document.addEventListener("keydown",e=>{
  if(e.key==="/"&&document.activeElement!==qEl){ e.preventDefault(); qEl.focus(); }
  if(e.key==="Escape"){ if(document.activeElement===qEl){ qEl.value=""; curQ=""; render(); qEl.blur(); } else drawer(false); }
});
$("menuBtn").addEventListener("click",()=>drawer(true));
$("closeBtn").addEventListener("click",()=>drawer(false));
$("scrim").addEventListener("click",()=>drawer(false));
$("bIdx").addEventListener("click",e=>{ const on=$("idx").classList.toggle("on"); e.currentTarget.style.background=on?"var(--chip2)":""; if(on) toTop(); });
$("bTheme").addEventListener("click",()=>{
  const v=document.documentElement.getAttribute("data-t")==="dark"?"light":"dark";
  document.documentElement.setAttribute("data-t",v);
  try{ localStorage.setItem(KEY+"_t",v); }catch(e){}
});
$("fab").addEventListener("click",toTop);
window.addEventListener("scroll",()=>{ $("fab").classList.toggle("show",window.scrollY>600); },{passive:true});

/* ── 뷰 전환: 사전 · 마인드맵 · 실습 · 이론 · 훈련 ── */
let curView="dict";
function setView(v){
  curView=v;
  document.body.classList.toggle("mapview",v==="map");
  document.body.classList.toggle("demoview",v==="demo");
  document.body.classList.toggle("theoryview",v==="theory");
  document.body.classList.toggle("quizview",v==="quiz");
  document.querySelectorAll("#tabs .tab").forEach(b=>b.classList.toggle("on",b.dataset.view===v));
  const mm=$("mmview"), dv=$("demoview"), tv=$("theoryview"), qv=$("quizview");
  mm.hidden=(v!=="map"); dv.hidden=(v!=="demo"); tv.hidden=(v!=="theory"); qv.hidden=(v!=="quiz");
  if(v==="map"){ if(window.Mindmap){ window.Mindmap.init(mm); window.Mindmap.show(); } }
  else if(window.Mindmap){ window.Mindmap.hide(); }
  if(v==="demo" && window.DemoHub){ window.DemoHub.renderList(dv); toTop(); }
  if(v==="theory" && window.Theory){ window.Theory.show(); toTop(); }
  else if(window.Theory){ window.Theory.hide(); }
  if(v==="quiz" && window.Quiz){ window.Quiz.show(); toTop(); }
  if(v==="dict") toTop();
  syncHead();
}
$("tabs").addEventListener("click",e=>{ const b=e.target.closest(".tab"); if(b) setView(b.dataset.view); });
/* 마인드맵/실습에서 "사전에서 열기" → 사전으로 전환 후 해당 용어로 이동 */
window.GIGSA={ openInDict(name){ setView("dict"); requestAnimationFrame(()=>goTo(name)); } };

/* 상단 바 높이를 sticky 오프셋으로 반영 */
function syncHead(){
  const h=$("topbar").offsetHeight;
  document.documentElement.style.setProperty("--hh",h+"px");
  document.querySelectorAll(".chap,.tm,#idx .grp").forEach(()=>{});
  const st=document.createElement("style"); st.id="hoff";
  const old=$("hoff"); if(old) old.remove();
  st.textContent=".chap,.tm,#idx .grp{scroll-margin-top:"+(h+12)+"px}";
  document.head.appendChild(st);
}
window.addEventListener("resize",syncHead);

/* ── PWA ── */
if("serviceWorker" in navigator && location.protocol!=="file:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
let deferred=null;
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferred=e; $("install").classList.add("show"); });
$("install").addEventListener("click",async()=>{
  if(deferred){ deferred.prompt(); deferred=null; $("install").classList.remove("show"); }
});
function isStandalone(){
  try{ if(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true; }catch(e){}
  return !!(window.navigator && window.navigator.standalone);
}
if(isStandalone()) $("install").classList.remove("show");

/* ── 검증 리포트 ── */
function verify(){
  const out=[];
  const seen={},dup=[];
  FLAT.forEach(r=>{ const n=r.t[T_NAME]; if(seen[n])dup.push(n); else seen[n]=1; });
  const dead=[]; FLAT.forEach(r=>conf(r.t).forEach(c=>{ if(!BYNAME.has(c)) dead.push(r.t[T_NAME]+" → "+c); }));
  const miss=FLAT.filter(r=>!r.t[T_SHORT]||!r.t[T_DETAIL]||!r.t[T_EXAM]).map(r=>r.t[T_NAME]);
  const orphan=Object.keys(DIA).filter(k=>!BYNAME.has(k));
  let bad=0, badList=[];
  Object.keys(DIA).forEach(k=>{ let h=""; try{ h=window.renderDiagram(DIA[k]); }catch(e){ h=""; }
    if(!h||/dgerr/.test(h)){ bad++; if(badList.length<8) badList.push(k); } });
  const bys={},bds={};
  FLAT.forEach(r=>{ bys[r.s]=(bys[r.s]||0)+1; if(r.dia) bds[r.s]=(bds[r.s]||0)+1; });
  const ok=s=>'<span style="color:var(--good)">'+s+'</span>', no=s=>'<span style="color:var(--bad)">'+s+'</span>';

  const noEx=FLAT.filter(r=>!r.ex).map(r=>r.t[T_NAME]);
  out.push('<b>1. 규모</b><ul><li>용어 <b>'+FLAT.length+'개</b> · 예시 <b>'+nEx+'개</b> · 도식 <b>'+nDia+'개</b> · 챕터 <b>'+DICT.length+'개</b> · 혼동 링크 <b>'+nLink+'건</b></li>'+
   '<li>과목별 도식 보유율: '+[1,2,3,4,5].map(i=>i+'과목 '+(bds[i]||0)+'/'+bys[i]+' ('+Math.round((bds[i]||0)/bys[i]*100)+'%)').join(' · ')+'</li></ul>');
  out.push('<b>2. 자동 정합성 검사</b><ul>'+
   '<li>용어명 중복: '+(dup.length?no(dup.length+'건 — '+dup.join(", ")):ok('0건'))+'</li>'+
   '<li>혼동 링크 무효 참조: '+(dead.length?no(dead.length+'건 — '+dead.slice(0,12).join(" / ")):ok('0건'))+'</li>'+
   '<li>필수 필드 누락: '+(miss.length?no(miss.length+'건'):ok('0건'))+'</li>'+
   '<li>존재하지 않는 용어를 가리키는 도식: '+(orphan.length?no(orphan.length+'건 — '+orphan.join(", ")):ok('0건'))+'</li>'+
   '<li>렌더 실패 도식: '+(bad?no(bad+'건 — '+badList.join(", ")):ok('0건'))+'</li>'+
   '<li>예시가 없는 용어: '+(noEx.length?no(noEx.length+'건 — '+noEx.slice(0,10).join(", ")):ok('0건'))+'</li></ul>');
  out.push('<b>3. 자체 논박 — 알려진 한계</b>');
  out.push('<div class="vr"><b>예시는 제 지식으로 작성했습니다.</b> 1,008개 용어를 각각 웹 검색하는 것은 현실적이지 않아, 실무 사례는 제가 아는 실제 사용 맥락으로 쓰고 <b>사실이 낡을 수 있는 항목만 표적 검증</b>했습니다(CI 도구 현황, WPA2 KRACK 취약점과 WPA3 SAE 등). 제품 점유율·버전 같은 수치는 시간이 지나면 달라집니다.</div>');
  out.push('<div class="vr"><b>암기 고리는 시험 용어가 아닙니다.</b> 기억을 붙잡기 위한 장치이므로 답안에는 정식 용어를 쓰셔야 합니다.</div>');
  out.push('<div class="vr"><b>도식은 전체 용어의 약 46%에만 있습니다.</b> 도구 이름, 단일 정의어처럼 그림이 이해를 돕지 않는 용어에는 넣지 않았습니다. 넣는 편이 오히려 지면을 늘려 방해가 되기 때문입니다. 필요한 용어가 빠졌다면 <code>dia-data-*.js</code> 에 한 줄로 추가할 수 있습니다.</div>');
  out.push('<div class="vr"><b>도식은 시험지에 나오는 그림과 다릅니다.</b> 개념 구조를 기억에 붙이기 위한 정리 도식이며, 실제 문항의 도표를 재현한 것이 아닙니다. UML 표기법처럼 기호가 정답을 가르는 항목은 도식이 아니라 <b>표</b>로 정리해 기호를 문자로 확인할 수 있게 했습니다.</div>');
  out.push('<div class="vr"><b>오프라인 캐시는 첫 방문 시 저장됩니다.</b> 배포 후 한 번 온라인에서 열어야 서비스 워커가 파일을 받습니다. 또 파일을 수정해 재배포하면 <code>sw.js</code> 의 <code>CACHE</code> 버전을 올려야 새 내용이 반영됩니다.</div>');
  out.push('<div class="vr"><b>출제기준 정리본은 2022년 3월 편집판을 근거로 했습니다.</b> 시행 연도에 따라 개정될 수 있으니 Q-net 자료실의 최신 출제기준과 대조해 보시길 권합니다.</div>');
  $("vrpt").innerHTML=out.join("");
}

/* ── 시작 ── */
$("kv1").textContent=FLAT.length; $("kv2").textContent=nDia; $("kv5").textContent=nEx;
$("kv3").textContent=DICT.length; $("kv4").textContent=nLink;
$("bsub").textContent="용어 "+FLAT.length+" · 예시 "+nEx+" · 도식 "+nDia;
chips(); nav(); buildIdx(); render(); verify(); syncHead();
})();
