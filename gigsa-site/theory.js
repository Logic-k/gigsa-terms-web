/* ════════════════════════════════════════════════════════════
   실기 이론 뷰 — THEORY 데이터를 #theoryview 에 렌더
   ────────────────────────────────────────────────────────────
   탭 진입 시 한 번만 그리고, 서브 내비 칩은 각 섹션으로 스크롤.
   ════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const T=window.THEORY||{};
let built=false;

/* 섹션 헤더 */
const sec=(id,icon,title,sub)=>'<section class="thy-sec" id="thy-'+id+'">'+
  '<h2 class="thy-h">'+icon+' '+esc(title)+'</h2>'+(sub?'<p class="thy-sub">'+esc(sub)+'</p>':'');

/* 능력단위 카드 (접고 펼침) */
function unitCard(u){
  const rows=u.hot.map(h=>'<tr><td class="thk">'+esc(h[0])+'</td><td>'+esc(h[1])+
    (h[2]?'<div class="thm">💡 '+esc(h[2])+'</div>':'')+'</td></tr>').join("");
  return '<article class="thu">'+
    '<button type="button" class="thu-h" data-thopen>'+
      '<span class="thu-n">'+esc(String(u.n))+'</span>'+
      '<span class="thu-ic">'+u.icon+'</span>'+
      '<span class="thu-t">'+esc(u.t)+'</span>'+
      '<span class="thu-w">'+esc(u.w)+'</span>'+
      '<span class="thu-c">▾</span></button>'+
    '<div class="thu-b">'+
      '<p class="thu-why">'+esc(u.why)+'</p>'+
      '<table class="tht">'+rows+'</table>'+
      '<p class="thu-ex"><b>출제 유형</b> '+esc(u.exam)+'</p>'+
    '</div></article>';
}

function build(){
  if(built) return;
  built=true;
  const v=$("theoryview");
  if(!v) return;
  let h='';

  /* 헤더 */
  h+='<div class="thy-head">'+
    '<div class="thy-title">실기 이론 집중 정리</div>'+
    '<p class="thy-lead">필기(5과목)와 다른 실기 전용 범위 — 수행준거 <b>12개 능력단위</b> 기준으로 핵심 이론·암기법·흐름도·공략을 모았습니다. 자료는 수제비·시나공 교재 구조와 합격 후기, 회차별 출제 분석(수제비 총평·정처기 감자 등)을 바탕으로 정리했습니다.</p></div>';

  /* 서브 내비 */
  const navs=[["ov","개요"],["units","과목 이론"],["mne","암기 카드"],["flow","흐름도"],["code","코드·SQL"],["plan","3주 플랜"],["res","자료·당일"]];
  h+='<nav class="thy-nav">'+navs.map(n=>'<button type="button" data-thy="'+n[0]+'">'+n[1]+'</button>').join("")+'</nav>';

  /* 개요 */
  h+=sec("ov","🧭","시험 개요와 출제 경향","");
  h+='<table class="tht thy-ov">'+T.ov.map(r=>'<tr><td class="thk">'+esc(r[0])+'</td><td>'+esc(r[1])+'</td></tr>').join("")+'</table>';
  h+='<div class="thy-card"><div class="thb">최근 출제 경향 (2024~2026 회차 분석)</div><ul class="thy-ul">'+
     T.trend.map(t=>'<li>'+esc(t)+'</li>').join("")+'</ul></div>';

  /* 12 능력단위 */
  h+=sec("units","📚","과목별 이론 — 수행준거 12개 능력단위","카드를 눌러 펼치세요. 비중이 큰 10장(프로그래밍)·8장(SQL)·11장(OS·네트워크)·9장(보안)부터 공략하는 것을 권합니다.");
  h+='<div class="thy-units">'+T.units.map(unitCard).join("")+'</div>';

  /* 암기 카드 */
  h+=sec("mne","🧠","암기 두문자 카드","나열형·단답 문제를 그대로 푸는 암기 장치입니다. 답안에는 반드시 정식 용어를 쓰세요.");
  h+='<div class="thy-mne">'+T.mne.map(m=>'<div class="thm-c"><div class="thm-t">'+esc(m.t)+'</div>'+
    '<div class="thm-p">'+esc(m.p)+'</div><div class="thm-i">'+esc(m.items)+'</div>'+
    '<div class="thm-d">'+esc(m.d)+'</div></div>').join("")+'</div>';

  /* 흐름도 */
  h+=sec("flow","🔀","흐름도 · 절차 정리","순서 문제는 그림으로 기억하는 게 가장 빠릅니다.");
  h+='<div class="thy-flows">'+T.flow.map(f=>'<div class="thf"><div class="thf-t">'+esc(f.t)+'</div>'+
    '<div class="thf-s">'+f.steps.map((s,i)=>
      '<span class="thf-c'+(s.indexOf("→")>=0?' alt':'')+'">'+esc(s)+'</span>'+
      (i<f.steps.length-1?'<span class="thf-a">→</span>':'')).join("")+
    '</div>'+(f.note?'<div class="thf-n">'+esc(f.note)+'</div>':'')+'</div>').join("")+'</div>';

  /* 코드·SQL */
  h+=sec("code","⌨️","코드·SQL 공략","'출력값을 쓰시오' 문제는 이해가 아니라 추적 — 변수표를 그려 한 줄씩 따라가는 연습이 전부입니다.");
  h+='<div class="thy-code">'+T.code.map(c=>'<div class="thc '+c.color+'"><div class="thc-h">'+
    '<span class="thc-l">'+esc(c.lang)+'</span><span class="thc-s">'+esc(c.share)+'</span></div>'+
    '<div class="thb">빈출 패턴</div><ul class="thy-ul">'+c.pat.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>'+
    '<div class="thb thb-warn">자주 틀리는 함정</div><ul class="thy-ul warn">'+c.trap.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul></div>').join("")+'</div>';

  /* 3주 플랜 */
  h+=sec("plan","📅","3주 합격 플랜 (D-21 → D-day)","필기 합격자 기준. 개념 정독보다 '문제 먼저 → 틀린 개념 학습'의 역순이 짧은 기간에 유효합니다.");
  h+='<div class="thy-plan">'+T.plan.map(p=>'<div class="thp"><div class="thp-h"><span class="thp-p">'+esc(p.p)+'</span>'+
    '<span class="thp-d">'+esc(p.d)+'</span><span class="thp-g">'+esc(p.goal)+'</span></div>'+
    '<ul class="thy-ul">'+p.task.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>'+
    '<div class="thp-t">💡 '+esc(p.tip)+'</div></div>').join("")+'</div>';
  h+='<div class="thy-card"><div class="thb">시험 당일</div><ul class="thy-ul">'+
     T.dday.map(t=>'<li>'+esc(t)+'</li>').join("")+'</ul></div>';

  /* 리소스 */
  h+=sec("res","🔗","참고 리소스","");
  h+='<div class="thy-res">'+T.res.map(r=>'<a class="thr" href="'+esc(r.u)+'"'+
    (r.u==="#"?' data-th-quiz':' target="_blank" rel="noopener"')+'>'+
    '<span class="thr-n">'+esc(r.n)+'</span><span class="thr-d">'+esc(r.d)+'</span></a>').join("")+'</div>';
  h+='<p class="thy-foot">콘텐츠는 공개된 출제기준·교재 구조·합격 후기·커뮤니티 자료를 바탕으로 정리했습니다. 최신 출제기준은 Q-net에서 확인하세요.</p>';

  v.innerHTML=h;
}

function show(){ build(); }
function hide(){}

/* 클릭 위임: 단위 카드 펼침 + 서브 내비 스크롤 + 훈련 탭 이동 */
document.addEventListener("click",e=>{
  const op=e.target.closest("[data-thopen]");
  if(op){ op.parentElement.classList.toggle("open"); return; }
  const n=e.target.closest("[data-thy]");
  if(n){ const el=$("thy-"+n.dataset.thy); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); return; }
  if(e.target.closest("[data-th-quiz]")){
    e.preventDefault();
    const b=document.querySelector('#tabs .tab[data-view="quiz"]');
    if(b) b.click();
  }
});

window.Theory={show,hide};
})();
