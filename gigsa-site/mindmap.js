/* ════════════════════════════════════════════════════════════
   마인드맵 — 개념 계층 가로 트리
   챕터 안의 상세설명을 분석해 "카테고리 → 하위 용어" 포함관계를
   자동으로 뽑아 계층으로 묶는다. (예: 미들웨어 → WAS·RPC·MOM·TP-Monitor·ORB)
   과목 → 챕터(이름) → 개념 → 세부용어 를 왼쪽→오른쪽으로 펼치는 트리.
   HTML 노드 + SVG 연결선. 이동=스크롤, 선택=클릭. 외부 라이브러리 없음.
   ════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const T_NAME=0,T_EN=1,T_SHORT=2,T_DETAIL=3,T_CONF=4;

/* ── 개념 계층 만들기 ── */
let root=null, TERMBY=new Map(), TERMNODES=[];
function chapterForest(ch,ci){
  const terms=ch.T;
  const nodes=terms.map((t,ti)=>({kind:"term",s:ch.s,label:t[T_NAME],en:t[T_EN]||"",
    short:t[T_SHORT]||"",cn:ch.n,cc:ch.c,ci,ti,children:[],expanded:false,
    conf:(t[T_CONF]||"").split("|").map(x=>x.trim()).filter(Boolean),
    id:"t"+ci+"_"+ti}));
  const byName=new Map(nodes.map(n=>[n.label,n]));
  // 각 용어가 같은 챕터의 다른 용어를 몇 개나 언급하는가(=일반성 점수)
  const score=new Map(), mentions=new Map();
  nodes.forEach((P,pi)=>{
    const blob=(terms[pi][T_SHORT]||"")+" "+(terms[pi][T_DETAIL]||"");
    const s=new Set();
    nodes.forEach(C=>{ if(C===P)return; if(C.label.length>=2 && blob.includes(C.label)) s.add(C.label); });
    mentions.set(P.label,s); score.set(P.label,s.size);
  });
  // 부모 = 나를 언급하는 용어 중 '가장 일반적인(점수 최고, ≥2) 카테고리'
  const roots=[];
  nodes.forEach((C,idxC)=>{
    const cs=score.get(C.label); let best=null,bestScore=-1,bestIdx=0;
    nodes.forEach((P,idxP)=>{ if(P===C)return;
      if(mentions.get(P.label).has(C.label)){ const ps=score.get(P.label);
        if(ps>cs && ps>=2){
          if(ps>bestScore || (ps===bestScore && (P.label.length<best.label.length ||
             (P.label.length===best.label.length && idxP<bestIdx)))){ best=P; bestScore=ps; bestIdx=idxP; }
        }
      }
    });
    if(best) best.children.push(C); else roots.push(C);
  });
  return {roots,nodes};
}
function build(){
  if(root) return;
  root={kind:"root",children:[],expanded:true};
  const bySubj={};
  DICT.forEach((ch,ci)=>{
    const sn=bySubj[ch.s]||(bySubj[ch.s]={kind:"subj",s:ch.s,label:SUBJ[ch.s],children:[],expanded:false,id:"s"+ch.s});
    const chap={kind:"chap",s:ch.s,cn:ch.n,cc:ch.c,label:ch.c,num:ch.n,children:[],expanded:false,id:"c"+ci};
    const {roots,nodes}=chapterForest(ch,ci);
    chap.children=roots;
    nodes.forEach(n=>{ TERMNODES.push(n); if(!TERMBY.has(n.label)) TERMBY.set(n.label,n); });
    sn.children.push(chap);
  });
  [1,2,3,4,5].forEach(s=>{ if(bySubj[s]) root.children.push(bySubj[s]); });
  TERMNODES.forEach(n=>{ n.conf=n.conf.filter(c=>TERMBY.has(c)); });
}
/* ── 레이아웃(가로 tidy 트리) ── */
const COLW=224, ROWH=46, CHIPW=196, CHIPH=34;
let bbox={w:0,h:0};
function eachVisible(fn){ (function walk(n,depth){ if(n.kind!=="root") fn(n,depth);
  if((n.kind==="root"||n.expanded) && n.children.length) n.children.forEach(c=>walk(c,(n.kind==="root"?0:depth+1)));
})(root,0); }
function layout(){
  let cy=8, maxX=0, maxY=0;
  (function place(n,depth){
    const isRoot=n.kind==="root";
    if(n.expanded && n.children.length){
      n.children.forEach(c=>place(c,isRoot?0:depth+1));
      const f=n.children[0], l=n.children[n.children.length-1];
      n.y=(f.y+l.y)/2;
    }else{ n.y=cy; cy+=ROWH; }
    if(!isRoot){ n.x=depth*COLW+8; n.depth=depth;
      maxX=Math.max(maxX,n.x+CHIPW); maxY=Math.max(maxY,n.y+CHIPH); }
  })(root,0);
  bbox={w:maxX+16,h:Math.max(cy,maxY)+16};
}

/* ── 렌더 ── */
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const norm=s=>String(s).toLowerCase().replace(/\s+/g,"");
function connector(p,c){
  const x1=p.x+CHIPW, y1=p.y+CHIPH/2, x2=c.x, y2=c.y+CHIPH/2, mx=(x1+x2)/2;
  return `M${x1.toFixed(1)},${y1.toFixed(1)} C${mx.toFixed(1)},${y1.toFixed(1)} ${mx.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}
function nodeHTML(n){
  const kids=n.children.length;
  const cls="mmn k-"+n.kind+" s"+(n.s||0)+(kids?" cat":"")+(n.expanded?" op":"")+
    (focused&&focused.id===n.id?" foc":"")+
    (focused&&n.kind==="term"&&focused.conf.indexOf(n.label)>=0?" lit":"");
  const caret=kids?`<button class="cw" data-act="toggle" aria-label="펼치기">${n.expanded?"▾":"▸"}</button>`:`<span class="cw dot"></span>`;
  const badge=kids?`<span class="bd">${kids}</span>`:"";
  const demo=(n.kind==="term"&&window.DemoHub&&window.DemoHub.forTerm&&window.DemoHub.forTerm(n.label))?`<span class="dm" title="인터랙티브 자료 있음">▶</span>`:"";
  const act=n.kind==="term"?"focus":"toggle";
  return `<div class="${cls}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px" title="${esc(n.label)}">`+
    caret+`<span class="lb" data-act="${act}">${esc(n.label)}</span>${demo}${badge}</div>`;
}
function render(){
  layout();
  let paths="";
  eachVisible(n=>{ if(n.expanded && n.children.length) n.children.forEach(c=>paths+=`<path class="ce" d="${connector(n,c)}"/>`); });
  // 포커스 용어의 혼동 링크(보이는 노드끼리)만
  if(showConf && focused && focused.kind==="term"){
    const vis=new Map(); eachVisible(n=>{ if(n.kind==="term") vis.set(n.label,n); });
    focused.conf.forEach(cn=>{ const b=vis.get(cn); if(!b)return;
      const x1=focused.x+CHIPW/2,y1=focused.y+CHIPH/2,x2=b.x+CHIPW/2,y2=b.y+CHIPH/2;
      paths+=`<path class="cf" d="M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}"/>`;
    });
  }
  let nodes=""; eachVisible(n=>{ nodes+=nodeHTML(n); });
  svg.setAttribute("viewBox",`0 0 ${bbox.w} ${bbox.h}`);
  svg.setAttribute("width",bbox.w); svg.setAttribute("height",bbox.h);
  svg.innerHTML=paths;
  canvas.style.width=bbox.w+"px"; canvas.style.height=bbox.h+"px";
  nodesLayer.innerHTML=nodes;
  applyZoom();
}
function applyZoom(){ canvas.style.transform="scale("+zoom+")"; }

/* ── 조작 ── */
function findById(id){ let f=null;(function w(n){ if(f)return; if(n.id===id){f=n;return;} (n.children||[]).forEach(w);})(root); return f; }
function siblingsOf(n){ // 부모의 children
  let p=null;(function w(x){ if(p)return;(x.children||[]).forEach(c=>{ if(c===n)p=x; else w(c); });})(root);
  return p?p.children:[];
}
function toggle(n){
  const open=!n.expanded;
  if(open && (n.kind==="subj"||n.kind==="chap")) siblingsOf(n).forEach(c=>{ if(c!==n) collapse(c); });
  n.expanded=open;
}
function collapse(n){ n.expanded=false; }
function onNode(n,act){
  if(n.kind==="term"){
    if(n.children.length) toggle(n);
    focused=n; render(); showPanel(n); scrollIntoView(n);
  }else{ toggle(n); if(focused&&focused.kind==="term"){/*keep*/} render(); scrollIntoView(n); }
}
function scrollIntoView(n){
  // 펼친 노드가 보이도록 살짝 스크롤(가로는 오른쪽 컬럼이 보이게)
  const targetX=(n.x+CHIPW+COLW)*zoom, targetY=(n.y)*zoom;
  const w=wrap.clientWidth, h=wrap.clientHeight;
  if(targetX>wrap.scrollLeft+w) wrap.scrollLeft=Math.max(0,targetX-w+40);
  if(targetY<wrap.scrollTop+30||targetY>wrap.scrollTop+h-60)
    wrap.scrollTop=Math.max(0,targetY-h*0.35);
}

/* ── 상세 패널 ── */
function showPanel(n){
  const chips=n.conf.map(c=>`<button type="button" class="mmchip" data-jump="${esc(c)}">${esc(c)}</button>`).join("")||
    '<span class="mmnone">혼동 용어 없음</span>';
  const demo=window.DemoHub&&window.DemoHub.forTerm&&window.DemoHub.forTerm(n.label);
  const demoBtn=demo?`<button type="button" class="mmdemo" data-demo="${esc(demo.id)}">▶ ${esc(demo.icon||"")} 인터랙티브 열기</button>`:"";
  const kidNames=n.children.map(c=>esc(c.label)).join(" · ");
  panel.innerHTML=
    `<button class="mmx" data-close="1" aria-label="닫기">✕</button>`+
    `<div class="mmnm">${esc(n.label)}${n.en?` <span class="mmen">${esc(n.en)}</span>`:""}</div>`+
    `<div class="mmshort">${esc(n.short)}</div>`+
    (n.children.length?`<div class="mmlb">하위 개념 ${n.children.length}</div><div class="mmkids">${kidNames}</div>`:"")+
    `<div class="mmloc"><span class="mmtag s${n.s}">${esc(n.num||n.cn)} ${esc(n.cc)}</span><span class="mmtag">${n.s}과목 ${esc(SUBJ[n.s])}</span></div>`+
    `<div class="mmlb">함께 헷갈리는 용어 · 눌러서 이동</div><div class="mmchips">${chips}</div>`+
    `<div class="mmact">${demoBtn}<button type="button" class="mmopen" data-open="${esc(n.label)}">📖 사전에서 열기</button></div>`;
  panel.classList.add("show");
}
function hidePanel(){ panel.classList.remove("show"); focused=null; render(); }
function jumpTo(name){ const n=TERMBY.get(name); if(n){ revealPath(n); focused=n; render(); showPanel(n); scrollIntoView(n); } }
function revealPath(n){ // n 이 보이도록 조상들 펼치기 + 아코디언 정리
  const chain=[]; (function find(x,path){ for(const c of (x.children||[])){ if(c===n){ chain.push(...path,x,c); return true; }
    if(find(c,[...path,x])) return true; } return false; })(root,[]);
  chain.forEach(node=>{ if(node.kind==="root")return;
    if(node.kind==="subj"||node.kind==="chap") siblingsOf(node).forEach(s=>{ if(s!==node&&chain.indexOf(s)<0) s.expanded=false; });
    if(node!==n) node.expanded=true; });
}

/* ── 확대/맞춤 ── */
function setZoom(z){ zoom=Math.min(2,Math.max(0.4,z)); applyZoom(); }
function fitAll(){ collapseAllToSubjects(); render();
  const zx=(wrap.clientWidth-16)/bbox.w, zy=(wrap.clientHeight-16)/bbox.h;
  setZoom(Math.min(1,Math.min(zx,zy))); wrap.scrollTo(0,0); }
function collapseAllToSubjects(){ root.children.forEach(s=>{ s.expanded=false;
  (function w(n){ n.expanded=false; (n.children||[]).forEach(w); })(s); }); focused=null; panel.classList.remove("show"); }

/* ── 검색 ── */
function doSearch(v){ v=(v||"").trim(); if(!v)return; const nn=norm(v);
  const hit=TERMBY.get(v)||TERMNODES.find(n=>norm(n.label)===nn)||
    TERMNODES.find(n=>norm(n.label).includes(nn))||TERMNODES.find(n=>norm(n.en).includes(nn));
  if(hit) jumpTo(hit.label);
}

/* ── 초기화 ── */
let host,canvas,nodesLayer,svg,panel,wrap,zoom=1,focused=null,showConf=true,inited=false;
function init(container){
  if(inited){ container.hidden=false; return; }
  build(); host=container;
  host.innerHTML=
    `<div class="mmbar">`+
      `<button class="mmbtn" id="mmcollapse" title="모두 접기">⊟ 접기</button>`+
      `<input id="mmq" class="mmq" placeholder="용어 검색 → 트리에서 찾기" autocomplete="off" enterkeyhint="search">`+
      `<label class="mmtog"><input type="checkbox" id="mmconf" checked>혼동 연결</label>`+
      `<span class="mmz"><button class="mmbtn" id="mmzo">−</button><button class="mmbtn" id="mmzi">+</button>`+
      `<button class="mmbtn" id="mmfit" title="전체 맞춤">⤢</button></span>`+
    `</div>`+
    `<div class="mmwrap"><div class="mmcanvas"><svg class="mmedges" xmlns="http://www.w3.org/2000/svg"></svg>`+
      `<div class="mmnodes"></div></div>`+
      `<div class="mmhint">과목을 눌러 펼치고, 하위 개념으로 파고드세요. 용어를 누르면 뜻·혼동 용어·인터랙티브 자료가 열립니다.</div></div>`+
    `<div class="mmpanel" id="mmpanel"></div>`;
  wrap=host.querySelector(".mmwrap");
  canvas=host.querySelector(".mmcanvas");
  svg=host.querySelector(".mmedges");
  nodesLayer=host.querySelector(".mmnodes");
  panel=host.querySelector("#mmpanel");
  // 클릭 위임
  nodesLayer.addEventListener("click",e=>{
    const el=e.target.closest("[data-act]"); const box=e.target.closest(".mmn"); if(!box)return;
    const n=findById(box.getAttribute("data-id")); if(!n)return;
    const act=el?el.getAttribute("data-act"):(n.kind==="term"?"focus":"toggle");
    if(act==="toggle"&&n.kind!=="term"){ toggle(n); render(); scrollIntoView(n); }
    else onNode(n,act);
  });
  panel.addEventListener("click",e=>{
    if(e.target.closest("[data-close]")){ hidePanel(); return; }
    const jp=e.target.closest("[data-jump]"); if(jp){ jumpTo(jp.getAttribute("data-jump")); return; }
    const dm=e.target.closest("[data-demo]"); if(dm&&window.DemoHub){ window.DemoHub.open(dm.getAttribute("data-demo")); return; }
    const op=e.target.closest("[data-open]"); if(op&&window.GIGSA){ window.GIGSA.openInDict(op.getAttribute("data-open")); }
  });
  host.querySelector("#mmcollapse").addEventListener("click",()=>{ collapseAllToSubjects(); render(); wrap.scrollTo(0,0); });
  host.querySelector("#mmconf").addEventListener("change",e=>{ showConf=e.target.checked; render(); });
  host.querySelector("#mmzi").addEventListener("click",()=>setZoom(zoom+0.15));
  host.querySelector("#mmzo").addEventListener("click",()=>setZoom(zoom-0.15));
  host.querySelector("#mmfit").addEventListener("click",fitAll);
  const q=host.querySelector("#mmq"); let deb;
  q.addEventListener("input",e=>{ clearTimeout(deb); deb=setTimeout(()=>doSearch(e.target.value),220); });
  q.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); doSearch(q.value); q.blur(); } });
  wrap.addEventListener("wheel",e=>{ if(e.ctrlKey){ e.preventDefault(); setZoom(zoom+(e.deltaY>0?-0.1:0.1)); } },{passive:false});
  render();
  inited=true;
}

window.Mindmap={
  init,
  show(){ if(host){ host.hidden=false; if(!focused) render(); } },
  hide(){ if(host) host.hidden=true; },
  refresh(){ if(inited) render(); },
  _debug(){ build(); return {subjects:root.children.length,
    chapters:root.children.reduce((a,s)=>a+s.children.length,0),
    terms:TERMNODES.length,
    categories:TERMNODES.filter(n=>n.children.length).length}; }
};
})();
