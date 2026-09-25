/* ══════════════════════════════════════════════════════════════
   도식 엔진
   HTML/CSS 렌더러(모바일에서 자동 리플로우) + SVG 렌더러(기하 도형)
   스펙 문법 : "타입:본문"
   ══════════════════════════════════════════════════════════════ */
(function(global){
"use strict";
const E = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const sp = (s,d) => String(s).split(d).map(x=>x.trim()).filter(x=>x.length);

/* ── 공통 래퍼 ── */
function box(cap, inner, cls){
  return '<figure class="dg '+(cls||"")+'">'+inner+(cap?'<figcaption>'+E(cap)+'</figcaption>':'')+'</figure>';
}
function svgWrap(w,h,inner){
  return '<div class="dgsvg"><svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet" '+
    'style="max-width:'+Math.round(w*1.25)+'px" xmlns="http://www.w3.org/2000/svg" role="img">'+inner+'</svg></div>';
}
/* SVG 부품 */
const R=(x,y,w,h,cls,r)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(r==null?7:r)+'" class="'+(cls||"n")+'"/>';
const C=(x,y,r,cls)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" class="'+(cls||"n")+'"/>';
const Tx=(x,y,t,cls,anc)=>'<text x="'+x+'" y="'+y+'" text-anchor="'+(anc||"middle")+'" class="'+(cls||"t")+'">'+E(t)+'</text>';
const L=(x1,y1,x2,y2,cls)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+(cls||"e")+'"/>';
const PATH=(d,cls)=>'<path d="'+d+'" class="'+(cls||"e")+'"'+(/\bar\b/.test(cls||"")?' marker-end="url(#ah)"':'')+'/>';
/* 글자 폭 추정 : 한글/전각 11.2px, 그 외 6.4px (font-size 11.5 기준) */
const tw = s => { let w=0; for(const ch of String(s)) w += /[\u1100-\uD7FF\u3000-\u303F\uFF00-\uFFEF]/.test(ch)?11.2:6.4; return w; };
const boxW = t => Math.max.apply(null,String(t).split("\n").map(tw));
const lines = t => String(t).split("\n").length;
/* 글자 뒤 배경 (선 위에 얹히는 라벨 가독성) */
const HALO=(x,y,t,cls)=>{ const w=tw(t)+8; return R(x-w/2,y-11,w,15,"halo",4)+Tx(x,y+1,t,cls||"tl"); };
const DEFS='<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ahd"/></marker></defs>';

/* 여러 줄로 쪼갠 SVG 텍스트 */
function multi(x,y,txt,cls,lh){
  const parts=String(txt).split("\n");
  lh=lh||13;
  const y0=y-((parts.length-1)*lh)/2;
  return parts.map((p,i)=>Tx(x,y0+i*lh+4,p,cls)).join("");
}

/* ══════════ HTML/CSS 렌더러 ══════════ */
const H = {

/* stack:최상단|...|최하단        (계층 구조. 위에서 아래로) */
stack(b){
  const it=sp(b,"|");
  return box(null,'<div class="dg-stack">'+it.map((x,i)=>{
    const p=x.split("//");
    return '<div class="row" style="--i:'+i+'"><span class="k">'+E(p[0])+'</span>'+
      (p[1]?'<span class="v">'+E(p[1])+'</span>':'')+'</div>';
  }).join("")+'</div>');
},

/* rank:약함>강함::A|B|C          (순위. 번호 + 그라데이션) */
rank(b){
  const [ends,list]=b.split("::");
  const [lo,hi]=sp(ends||"낮음>높음",">");
  const it=sp(list,"|");
  return box(null,'<div class="dg-rank"><div class="ends"><b>'+E(lo)+'</b><span>'+it.length+'단계</span><b>'+E(hi)+'</b></div>'+
    it.map((x,i)=>{
      const p=x.split("//");
      return '<div class="row"><span class="no">'+(i+1)+'</span><span class="bar" style="--w:'+Math.round((i+1)/it.length*100)+'%"></span>'+
      '<span class="k">'+E(p[0])+'</span>'+(p[1]?'<span class="v">'+E(p[1])+'</span>':'')+'</div>';
    }).join("")+'</div>');
},

/* chain:A|B|C                    (순서 흐름. 좁아지면 줄바꿈) */
chain(b){
  const it=sp(b,"|");
  return box(null,'<div class="dg-chain">'+it.map((x,i)=>{
    const p=x.split("//");
    return (i?'<span class="ar">▸</span>':'')+'<span class="st"><b>'+E(p[0])+'</b>'+(p[1]?'<i>'+E(p[1])+'</i>':'')+'</span>';
  }).join("")+'</div>');
},

/* split:제목A;;a;b//제목B;;a;b   (대비. 모바일에서 1열) */
split(b){
  const cols=sp(b,"//");
  return box(null,'<div class="dg-split" style="--n:'+cols.length+'">'+cols.map((c,i)=>{
    const parts=c.split(";;");
    const items=sp(parts[1]||"",";");
    return '<div class="col c'+(i%3)+'"><div class="ttl">'+E(parts[0])+'</div>'+
      (items.length?'<ul>'+items.map(x=>'<li>'+E(x)+'</li>').join("")+'</ul>':'')+'</div>';
  }).join("")+'</div>');
},

/* pair:왼쪽;설명//오른쪽;설명    (양방향 대응. 화살표 두 개) */
pair(b){
  const [a,c]=sp(b,"//");
  const A=a.split(";"), Cc=c.split(";");
  return box(null,'<div class="dg-pair"><div class="side"><b>'+E(A[0])+'</b><i>'+E(A[1]||"")+'</i></div>'+
   '<div class="mid"><span>'+E(A[2]||"→")+'</span><span class="rev">'+E(Cc[2]||"←")+'</span></div>'+
   '<div class="side"><b>'+E(Cc[0])+'</b><i>'+E(Cc[1]||"")+'</i></div></div>');
},

/* bits:라벨=비중|라벨=비중       (비트/바이트 구조. 폭 비례) */
bits(b){
  const it=sp(b,"|").map(x=>{const [k,w]=x.split("=");return {k:k, w:parseFloat(w||1)};});
  const tot=it.reduce((s,x)=>s+x.w,0);
  return box(null,'<div class="dg-bits">'+it.map((x,i)=>
    '<span class="seg c'+(i%4)+'" style="flex:'+x.w+'"><b>'+E(x.k)+'</b></span>').join("")+'</div>');
},

/* grid:헤더1,헤더2||a,b||c,d     (표 형태) */
grid(b){
  const rows=sp(b,"||").map(r=>r.split(",").map(c=>c.trim()));
  const head=rows.shift();
  return box(null,'<div class="dg-grid" style="--c:'+head.length+'">'+
    head.map(h=>'<div class="hd">'+E(h)+'</div>').join("")+
    rows.map(r=>r.map((c,i)=>'<div class="cl'+(i===0?" k":"")+'">'+E(c)+'</div>').join("")).join("")+
    '</div>');
},

/* pyramid:최상단|...|최하단      (단계 피라미드) */
pyramid(b){
  const it=sp(b,"|");
  const n=it.length;
  return box(null,'<div class="dg-pyr">'+it.map((x,i)=>{
    const p=x.split("//");
    const w=Math.round(46+(i/(n-1||1))*54);
    return '<div class="row" style="--w:'+w+'%"><span class="k">'+E(p[0])+'</span>'+(p[1]?'<span class="v">'+E(p[1])+'</span>':'')+'</div>';
  }).join("")+'</div>');
},

/* bar:라벨=값|라벨=값            (크기 비교) */
bar(b){
  const it=sp(b,"|").map(x=>{const i=x.lastIndexOf("=");return {k:x.slice(0,i), v:parseFloat(x.slice(i+1)), raw:x.slice(i+1)};});
  const mx=Math.max.apply(null,it.map(x=>x.v));
  return box(null,'<div class="dg-bar">'+it.map((x,i)=>
   '<div class="row"><span class="k">'+E(x.k)+'</span><span class="tr"><i class="c'+(i%4)+'" style="width:'+Math.max(4,x.v/mx*100)+'%"></i></span><span class="v">'+E(x.raw)+'</span></div>').join("")+'</div>');
},

/* nest:겉>중간>안               (포함 관계. 중첩 상자) */
nest(b){
  const it=sp(b,">");
  let inner="";
  for(let i=it.length-1;i>=0;i--){
    const p=it[i].split("//");
    inner='<div class="lv l'+(i%4)+'"><span class="k">'+E(p[0])+'</span>'+(p[1]?'<span class="v">'+E(p[1])+'</span>':'')+inner+'</div>';
  }
  return box(null,'<div class="dg-nest">'+inner+'</div>');
},

/* ox:항목=O;설명|항목=X;설명     (O/X 판별표) */
ox(b){
  return box(null,'<div class="dg-ox">'+sp(b,"|").map(x=>{
    const [head,note]=x.split(";");
    const i=head.lastIndexOf("=");
    const k=head.slice(0,i), v=head.slice(i+1).trim();
    return '<div class="row '+(v==="O"?"o":"x")+'"><span class="m">'+(v==="O"?"O":"X")+'</span>'+
      '<span class="k">'+E(k)+'</span>'+(note?'<span class="v">'+E(note)+'</span>':'')+'</div>';
  }).join("")+'</div>');
},

/* code:줄1\n줄2                  (코드/수식 블록) */
code(b){
  return box(null,'<pre class="dg-code">'+E(b.replace(/\\n/g,"\n"))+'</pre>');
}

};

/* ══════════ SVG 렌더러 ══════════ */
const S = {

/* tree:부모>자식|부모>자식        (계층 트리. 노드 폭 자동) */
tree(b){
  const edges=sp(b,"|").map(e=>sp(e,">"));
  const par={}, kids={}, order=[];
  edges.forEach(([a,c])=>{ if(!order.includes(a))order.push(a); if(!order.includes(c))order.push(c);
    par[c]=a; (kids[a]=kids[a]||[]).push(c); });
  const roots=order.filter(n=>!par[n]);
  const lvl={}; const setL=(n,d)=>{ lvl[n]=Math.max(lvl[n]||0,d); (kids[n]||[]).forEach(c=>setL(c,d+1)); };
  roots.forEach(r=>setL(r,0));
  const maxL=Math.max.apply(null,Object.values(lvl));
  const rows=[]; for(let i=0;i<=maxL;i++) rows[i]=order.filter(n=>lvl[n]===i);
  const lab=n=>n.replace(/\{/g,"\n");
  const W_=n=>Math.max(76,boxW(lab(n))+22);
  const H_=n=>lines(lab(n))*14+18;
  const GX=14, GY=Math.max.apply(null,order.map(H_))+30;
  const rowW=rows.map(r=>r.reduce((s,n)=>s+W_(n)+GX,0)-GX);
  const W=Math.max.apply(null,rowW)+GX*2;
  const Hh=(maxL+1)*GY+16;
  const pos={};
  rows.forEach((r,i)=>{ let x=(W-rowW[i])/2;
    r.forEach(n=>{ pos[n]={x:x+W_(n)/2, y:16+i*GY+H_(n)/2, w:W_(n), h:H_(n)}; x+=W_(n)+GX; }); });
  let out=DEFS;
  edges.forEach(([a,c])=>{ const p=pos[a], q=pos[c];
    const y1=p.y+p.h/2, y2=q.y-q.h/2, m=(y1+y2)/2;
    out+=PATH("M"+p.x+","+y1+" C"+p.x+","+m+" "+q.x+","+m+" "+q.x+","+y2,"e ar"); });
  order.forEach((n,i)=>{ const p=pos[n];
    out+=R(p.x-p.w/2,p.y-p.h/2,p.w,p.h,"n a"+(lvl[n]%4))+multi(p.x,p.y,lab(n),"t"); });
  return box(null,svgWrap(W,Hh,out));
},

/* flow:A>B:라벨|B>C:라벨          (상태 전이. 세로 선형 + 우회 간선) */
flow(b){
  const edges=sp(b,"|").map(e=>{ const c=e.split(":"); const [a,z]=sp(c[0],">"); return {a:a,z:z,lab:(c[1]||"").trim()}; });
  const nodes=[]; edges.forEach(e=>{ if(!nodes.includes(e.a))nodes.push(e.a); if(!nodes.includes(e.z))nodes.push(e.z); });
  const lab=n=>n.replace(/\{/g,"\n");
  const NW=Math.max(96,Math.max.apply(null,nodes.map(n=>boxW(lab(n))+26)));
  const NH=Math.max(38,Math.max.apply(null,nodes.map(n=>lines(lab(n))*14+18)));
  const GY=Math.max(46,NH+22);
  const idx={}; nodes.forEach((n,i)=>idx[n]=i);
  /* 인접하지 않은 간선은 좌/우로 번갈아 우회 */
  const side={}; let L=0,Rc=0;
  edges.forEach((e,i)=>{ const d=idx[e.z]-idx[e.a];
    if(d===1){ side[i]=0; return; }
    if(d>0){ Rc++; side[i]=Rc; } else { L++; side[i]=-L; } });
  const maxR=Math.max(0,...Object.values(side).filter(v=>v>0));
  const maxL=Math.max(0,...Object.values(side).map(v=>v<0?-v:0));
  const labW=Math.max(40,Math.max.apply(null,edges.map(e=>tw(e.lab)))+14);
  const padR=Math.max(labW+18, maxR*34+labW+8);
  const padL=maxL? maxL*34+labW+8 : 14;
  const W=NW+padL+padR, Hh=nodes.length*GY+10, cx=padL+NW/2;
  const y=i=>14+i*GY+NH/2;
  let out=DEFS, labs="";
  edges.forEach((e,i)=>{
    const ya=y(idx[e.a]), yz=y(idx[e.z]), sd=side[i];
    if(sd===0){
      out+=PATH("M"+cx+","+(ya+NH/2)+" L"+cx+","+(yz-NH/2),"e ar");
      if(e.lab) labs+=HALO(cx+NW/2+tw(e.lab)/2+10, (ya+yz)/2+4, e.lab);
    } else {
      const dir=sd>0?1:-1, off=Math.abs(sd)*34;
      const ex=cx+dir*(NW/2+off);
      const y1=ya+(yz>ya?NH/2:-NH/2), y2=yz+(yz>ya?-NH/2:NH/2);
      out+=PATH("M"+(cx+dir*NW/2*0.5)+","+y1+" C"+ex+","+y1+" "+ex+","+y2+" "+(cx+dir*NW/2*0.5)+","+y2,"e ar");
      if(e.lab) labs+=HALO(ex+dir*(tw(e.lab)/2+8), (y1+y2)/2+4, e.lab);
    }
  });
  nodes.forEach((n,i)=>{ out+=R(cx-NW/2,y(i)-NH/2,NW,NH,"n a"+(i%4))+multi(cx,y(i),lab(n),"t"); });
  return box(null,svgWrap(W,Hh,out+labs));
},

/* cycle:A|B|C|D                   (반복 사이클. 사각 노드) */
cycle(b){
  const it=sp(b,"|"), n=it.length;
  const lab=x=>x.replace(/\{/g,"\n");
  const NW=Math.max(88,Math.max.apply(null,it.map(x=>boxW(lab(x))+26)));
  const NH=Math.max.apply(null,it.map(x=>lines(lab(x))*14+30));
  const Rr=Math.max(100,(NW+46)*n/(2*Math.PI));
  const W=Rr*2+NW+50, Hh=Rr*2+NH+50, cx=W/2, cy=Hh/2;
  const pts=it.map((x,i)=>{ const a=-Math.PI/2+i*2*Math.PI/n;
    return {x:cx+Rr*Math.cos(a), y:cy+Rr*Math.sin(a), t:x}; });
  const clip=(p,q)=>{ const dx=q.x-p.x, dy=q.y-p.y;
    const tx=dx?(NW/2+7)/Math.abs(dx):1e9, ty=dy?(NH/2+7)/Math.abs(dy):1e9;
    const t=Math.min(tx,ty); return {x:p.x+dx*t, y:p.y+dy*t}; };
  let out=DEFS;
  pts.forEach((p,i)=>{ const q=pts[(i+1)%n]; const a=clip(p,q), c=clip(q,p);
    out+=PATH("M"+a.x+","+a.y+" L"+c.x+","+c.y,"e ar"); });
  pts.forEach((p,i)=>{ out+=R(p.x-NW/2,p.y-NH/2,NW,NH,"n a"+(i%4))+
    Tx(p.x,p.y-NH/2+15,String(i+1),"tn")+multi(p.x,p.y+6,lab(p.t),"t",13); });
  return box(null,svgWrap(W,Hh,out));
},

/* venn:왼쪽|겹침|오른쪽|A라벨|B라벨 */
venn(b){
  const [l,m,r,la,ra]=sp(b,"|");
  const W=460,Hh=210;
  let out=C(170,100,86,"n vn")+C(290,100,86,"n vn")+
    Tx(110,96,la||"","tb")+Tx(350,96,ra||"","tb")+
    multi(108,120,l||"","tl",13)+multi(230,104,m||"","tl",13)+multi(352,120,r||"","tl",13);
  return box(null,svgWrap(W,Hh,out));
},

/* topo:star|ring|bus|mesh|tree|hub */
topo(b){
  const kind=b.trim(), W=380, Hh=210, cx=190, cy=105;
  let out=DEFS;
  const nodes=[];
  if(kind==="star"||kind==="hub"){
    for(let i=0;i<6;i++){ const a=-Math.PI/2+i*Math.PI/3; nodes.push({x:cx+78*Math.cos(a), y:cy+70*Math.sin(a)}); }
    nodes.forEach(p=>out+=L(cx,cy,p.x,p.y,"e"));
    out+=R(cx-30,cy-16,60,32,"n a0")+Tx(cx,cy+4,kind==="hub"?"허브":"중앙","t");
    nodes.forEach((p,i)=>out+=C(p.x,p.y,16,"n")+Tx(p.x,p.y+4,String(i+1),"t"));
  } else if(kind==="ring"){
    for(let i=0;i<7;i++){ const a=-Math.PI/2+i*2*Math.PI/7; nodes.push({x:cx+82*Math.cos(a), y:cy+74*Math.sin(a)}); }
    nodes.forEach((p,i)=>{ const q=nodes[(i+1)%7];
      const dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
      out+=PATH("M"+(p.x+ux*18)+","+(p.y+uy*18)+" L"+(q.x-ux*18)+","+(q.y-uy*18),"e ar"); });
    nodes.forEach((p,i)=>out+=C(p.x,p.y,17,"n")+Tx(p.x,p.y+4,String(i+1),"t"));
  } else if(kind==="bus"){
    out+=L(24,cy,356,cy,"e bus");
    for(let i=0;i<5;i++){ const x=48+i*72; const up=i%2===0;
      out+=L(x,cy,x,up?cy-42:cy+42,"e")+C(x,up?cy-52:cy+52,16,"n")+Tx(x,(up?cy-52:cy+52)+4,String(i+1),"t"); }
    out+=Tx(190,cy+92,"버스(공유 매체)","tl");
  } else if(kind==="mesh"){
    for(let i=0;i<6;i++){ const a=-Math.PI/2+i*Math.PI/3; nodes.push({x:cx+80*Math.cos(a), y:cy+72*Math.sin(a)}); }
    for(let i=0;i<6;i++) for(let j=i+1;j<6;j++) out+=L(nodes[i].x,nodes[i].y,nodes[j].x,nodes[j].y,"e th");
    nodes.forEach((p,i)=>out+=C(p.x,p.y,16,"n")+Tx(p.x,p.y+4,String(i+1),"t"));
  } else { /* tree */
    const P=[{x:190,y:30},{x:110,y:100},{x:270,y:100},{x:70,y:170},{x:150,y:170},{x:230,y:170},{x:310,y:170}];
    [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]].forEach(([a,c])=>out+=L(P[a].x,P[a].y,P[c].x,P[c].y,"e"));
    P.forEach((p,i)=>out+=C(p.x,p.y,16,"n")+Tx(p.x,p.y+4,String(i+1),"t"));
  }
  return box(null,svgWrap(W,Hh,out));
}

};

/* ══════════ 진입점 ══════════ */
function renderDiagram(spec){
  if(!spec) return "";
  const i=spec.indexOf(":");
  if(i<0) return "";
  const type=spec.slice(0,i).trim(), body=spec.slice(i+1);
  try{
    if(H[type]) return H[type](body);
    if(S[type]) return S[type](body);
  }catch(e){ return '<div class="dgerr">도식을 표시할 수 없습니다 ('+E(type)+')</div>'; }
  return '<div class="dgerr">알 수 없는 도식 유형: '+E(type)+'</div>';
}
global.renderDiagram = renderDiagram;
global.DIAGRAM_TYPES = Object.keys(H).concat(Object.keys(S));
})(window);
