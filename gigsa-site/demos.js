/* ════════════════════════════════════════════════════════════
   인터랙티브 학습 자료(실습)
   ────────────────────────────────────────────────────────────
   ▶ 새 자료 추가 방법 (딱 두 단계)
     1) HTML 파일을 demos/ 폴더에 넣는다. (독립 실행되는 한 페이지면 됨)
     2) 아래 DEMOS 배열에 한 항목을 추가한다.
        - id     : 고유 문자열
        - title  : 카드/모달 제목
        - icon   : 이모지 하나
        - file   : demos/파일명.html
        - desc   : 한 줄 설명
        - subj   : 관련 과목 번호(1~5) — 카드 색상용
        - terms  : 이 자료와 연결할 용어명들(사전 용어명과 정확히 일치).
                   해당 용어 카드와 마인드맵 패널에 "▶ 인터랙티브" 버튼이 자동으로 붙는다.
     * sw.js 의 CACHE 버전도 올리고 ASSETS 에 새 파일을 추가하면 오프라인에서도 열린다.
   ════════════════════════════════════════════════════════════ */
window.DEMOS = [
  {
    id:"sorting", title:"정렬 알고리즘 시각화", icon:"🔢", file:"demos/sorting.html", subj:2,
    desc:"버블·선택·삽입·쉘·퀵·힙·합병 정렬을 막대 애니메이션으로 비교합니다.",
    terms:["선택 정렬","버블 정렬","삽입 정렬","쉘 정렬","퀵 정렬","합병 정렬","힙 정렬","기수 정렬"]
  },
  {
    id:"db-normal", title:"DB 정규화 익스플로러", icon:"🗂", file:"demos/db-normalization.html", subj:3,
    desc:"제1~5정규형·BCNF 단계와 함수 종속·이상현상을 표로 단계별로 살펴봅니다.",
    terms:["정규화","제1정규형","제2정규형","제3정규형","BCNF","제4정규형","제5정규형",
           "함수적 종속","완전 함수적 종속","부분 함수적 종속","이행적 함수 종속","이상","삽입 이상","반정규화"]
  },
  {
    id:"tcp-udp", title:"TCP vs UDP 인터랙티브 마스터", icon:"🌐", file:"demos/tcp_udp.html", subj:4,
    desc:"TCP·UDP의 통신 방식과 프로토콜 헤더 구조를 시뮬레이터로 비교합니다.",
    terms:["TCP","UDP","TCP/IP","프로토콜","3-way handshaking","IP"]
  },
  {
    id:"tree-order", title:"이진 트리 순회 가이드", icon:"🌲", file:"demos/tree_order.html", subj:2,
    desc:"전위·중위·후위 순회 순서를 트리에서 단계별로 따라갑니다.",
    terms:["트리","이진 트리","전위 순회","중위 순회","후위 순회","이진 탐색 트리",
           "완전 이진 트리","포화 이진 트리","편향 이진 트리","전위 표기법","후위 표기법"]
  },
  {
    id:"board-design", title:"소프트웨어 설계 & 요구사항 마스터보드", icon:"📐",
    file:"demos/board-design.html", subj:1,
    desc:"럼바우 플립카드, UML 관계 6종 도식, 파이프-필터 애니메이션, MVC, 결합도·응집도 그라데이션, GoF 23을 한 판에 정리했습니다.",
    terms:[]
  },
  {
    id:"board-test-quality", title:"SW 테스트 & 품질관리 마스터보드", icon:"✅",
    file:"demos/board-test-quality.html", subj:2,
    desc:"화이트/블랙박스, Stub·Driver, V-모델, 형상관리, ISO 9126·25000·12207, CMMI 5레벨, 유지보수 4유형을 도식으로 정리했습니다.",
    terms:[]
  },
  {
    id:"board-db", title:"데이터베이스 고득점 마스터보드", icon:"🗄",
    file:"demos/board-db.html", subj:3,
    desc:"키 포함관계, 무결성, 관계대수/해석, 함수적 종속, 트랜잭션 상태 전이도 + 로킹 단위 슬라이더 시뮬레이터.",
    terms:[]
  },
  {
    id:"board-os", title:"운영체제 핵심 마스터보드", icon:"⚙️",
    file:"demos/board-os.html", subj:4,
    desc:"페이징 vs 세그멘테이션, FIFO/LRU 페이지 교체 시뮬레이터, 교착상태 4조건, 스케줄링을 직접 돌려보며 익힙니다.",
    terms:[]
  },
  {
    id:"board-net-sec", title:"네트워크 & 보안 마스터보드", icon:"📡",
    file:"demos/board-net-sec.html", subj:4,
    desc:"OSI 계층 장비, ARQ 3종, CSMA/CD vs CA, IEEE 802.x, RIP/OSPF/BGP, 토폴로지, MAC/DAC/RBAC, 암호 분류를 도식화했습니다.",
    terms:[]
  },
  {
    id:"board-newtech", title:"IT 신기술 마스터보드", icon:"🚀",
    file:"demos/board-newtech.html", subj:5,
    desc:"XaaS(SaaS/PaaS/IaaS), 하둡 HDFS·MapReduce, SDN vs NFV, MSA, 도커, 블록체인, BYOD/MDM, 엣지를 다크 테마 보드로 정리했습니다.",
    terms:[]
  },
  {
    id:"board-sec-newtech", title:"보안 & 신기술 마스터보드", icon:"🔐",
    file:"demos/board-sec-newtech.html", subj:5,
    desc:"대칭/비대칭/해시 암호 3분류, DRM 아키텍처(클리어링하우스), XaaS 스택, 신기술 용어를 다크 테마로 정리했습니다.",
    terms:[]
  },
  {
    id:"syllabus-2026", kind:"note", title:"출제기준 완전 요약노트 (2026)", icon:"📋",
    file:"demos/syllabus-2026.html", subj:0,
    desc:"5과목 전체 출제기준을 항목별로 압축 정리한 레퍼런스입니다. 시험 전 훑어보기용.",
    terms:[]
  },
  {
    id:"review-notes", kind:"note", title:"꿈라 오답 · 기억 노트", icon:"🧾",
    file:"demos/review-notes.html", subj:0,
    desc:"CBT에서 틀렸거나 기억해두려고 캡처한 93개 항목을 과목별 카드 + 검색으로 정리했습니다.",
    terms:[]
  }
];

(function(){
"use strict";
const DEMOS = window.DEMOS;
const byId = new Map(DEMOS.map(d=>[d.id,d]));
const byTerm = new Map();
DEMOS.forEach(d=>(d.terms||[]).forEach(t=>{ if(!byTerm.has(t)) byTerm.set(t,d); }));
const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

let modal=null, frame=null;
function ensureModal(){
  if(modal) return;
  modal=document.createElement("div");
  modal.className="dmodal"; modal.id="dmodal";
  modal.innerHTML=
    `<div class="dmpanel">`+
      `<div class="dmhead"><span class="dmtitle"></span>`+
        `<a class="dmnew" target="_blank" rel="noopener">새 탭 ↗</a>`+
        `<button class="dmclose" aria-label="닫기">✕</button></div>`+
      `<div class="dmbody"><iframe class="dmframe" title="인터랙티브 자료" referrerpolicy="no-referrer"></iframe></div>`+
    `</div>`;
  document.body.appendChild(modal);
  frame=modal.querySelector(".dmframe");
  modal.addEventListener("click",e=>{ if(e.target===modal||e.target.closest(".dmclose")) close(); });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&modal.classList.contains("show")) close(); });
}
function open(id){
  const d=byId.get(id); if(!d) return;
  ensureModal();
  modal.querySelector(".dmtitle").textContent=(d.icon?d.icon+" ":"")+d.title;
  modal.querySelector(".dmnew").href=d.file;
  frame.src=d.file;
  modal.classList.add("show");
  document.body.style.overflow="hidden";
}
function close(){
  if(!modal) return;
  modal.classList.remove("show");
  if(frame) frame.src="about:blank";
  document.body.style.overflow="";
}
function card(d){
  const tags=(d.terms||[]).slice(0,6).map(t=>`<span class="dmtag">${esc(t)}</span>`).join("")+
    ((d.terms||[]).length>6?`<span class="dmtag more">+${d.terms.length-6}</span>`:"");
  return `<button type="button" class="dmcard s${d.subj||0}${d.kind==="note"?" note":""}" data-demo="${esc(d.id)}">`+
    `<span class="dmic">${esc(d.icon||"▶")}</span>`+
    `<span class="dmtitle2">${esc(d.title)}</span>`+
    `<span class="dmdesc">${esc(d.desc||"")}</span>`+
    (tags?`<span class="dmtags">${tags}</span>`:"")+`</button>`;
}
function renderList(container){
  const demos=DEMOS.filter(d=>d.kind!=="note");
  const notes=DEMOS.filter(d=>d.kind==="note");
  const sect=(title,sub,items)=> items.length
    ? `<div class="dmsec"><h3>${esc(title)}</h3><span>${esc(sub)}</span></div><div class="dmgrid">${items.map(card).join("")}</div>` : "";
  container.innerHTML=
    `<div class="dmintro"><h2>학습 자료</h2>`+
    `<p>개념을 직접 조작하는 <b>인터랙티브 실습</b>과 훑어보는 <b>요약노트</b>입니다. 실습은 관련 용어의 사전 카드·마인드맵에서도 <b>▶</b> 버튼으로 바로 열 수 있습니다.</p></div>`+
    sect("🧪 인터랙티브 실습","조작하며 이해하기",demos)+
    sect("📋 요약노트 · 레퍼런스","훑어보기·정리",notes)+
    `<p class="dmadd">새 자료는 <code>demos/</code> 에 HTML 을 넣고 <code>demos.js</code> 의 <code>DEMOS</code> 에 한 줄 추가하면 됩니다. 요약처럼 조작이 없는 자료는 <code>kind:"note"</code> 를 붙이세요.</p>`;
  if(!container._wired){
    container.addEventListener("click",e=>{ const b=e.target.closest("[data-demo]"); if(b) open(b.getAttribute("data-demo")); });
    container._wired=true;
  }
}

window.DemoHub = {
  forTerm: name => byTerm.get(name) || null,
  open, close, renderList,
  list: () => DEMOS.slice()
};
})();
