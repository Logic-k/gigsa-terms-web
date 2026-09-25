# -*- coding: utf-8 -*-
"""정보처리기사 용어사전 → Anki .apkg 생성"""
import json, io, os, re, html, sys
import genanki

BASE = "/sessions/eager-lucid-ritchie/mnt/outputs/anki-build"
OUT  = "/sessions/eager-lucid-ritchie/mnt/outputs/정보처리기사_용어사전_Anki.apkg"
D = json.load(io.open(BASE + "/source.json", encoding="utf-8"))
SUBJ = D["subj"]

# ══════════════════════════════ CSS ══════════════════════════════
# Anki 웹뷰(구형 AnkiDroid 포함) 호환 : color-mix() · env() 미사용
CSS = r"""
.card{
  --bg:#fbfaf8; --panel:#ffffff; --line:#e5e0d8; --ink:#1e1f1d; --dim:#6d6860; --dim2:#948e86;
  --ac:#7c3aed; --ac2:#0d9488; --warn:#c2410c; --bad:#dc2626; --good:#15803d;
  --chip:#f2efea; --chip2:#e8e3db;
  --dbox:#f4f1ec; --dline:#cdc6bb; --dtx:#20211f;
  --a0:#eee7fd; --a1:#dff5f2; --a2:#fdeade; --a3:#e3ecfd;
  background:var(--bg); color:var(--ink);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Malgun Gothic","Apple SD Gothic Neo",system-ui,sans-serif;
  font-size:17px; line-height:1.62; text-align:left; padding:14px 12px 26px;
}
.nightMode .card, .night_mode .card{
  --bg:#15161a; --panel:#1d1f24; --line:#33363c; --ink:#e9e7e4; --dim:#a19b93; --dim2:#7a756d;
  --ac:#a78bfa; --ac2:#2dd4bf; --warn:#fb923c; --bad:#f87171; --good:#4ade80;
  --chip:#282b31; --chip2:#33373e;
  --dbox:#242730; --dline:#454a55; --dtx:#e9e7e4;
  --a0:#2e2a3d; --a1:#20343a; --a2:#3a2c22; --a3:#232c3d;
}
*{box-sizing:border-box}
.q{font-size:26px;font-weight:800;letter-spacing:-.5px;line-height:1.35}
.q .en{display:block;font-size:14px;font-weight:500;color:var(--dim2);margin-top:4px;letter-spacing:0}
.ask{margin-top:14px;font-size:14.5px;color:var(--dim)}
.ask b{color:var(--ac)}
.hint{margin-top:8px;display:inline-block;font-size:13px;color:var(--dim);
  background:var(--chip);border-radius:8px;padding:6px 11px}
hr#answer{border:0;border-top:1px solid var(--line);margin:18px 0}
.lb{font-size:10.5px;font-weight:800;letter-spacing:.8px;color:var(--dim2);text-transform:uppercase;margin:16px 0 6px}
.lb:first-child{margin-top:0}
.def{font-size:18px;font-weight:700;background:var(--chip);border-left:4px solid var(--ac);
  padding:11px 13px;border-radius:0 10px 10px 0}
.det{font-size:15.5px;margin:0}
.exam{font-size:14.5px;background:var(--chip);border-left:4px solid var(--ac2);
  padding:10px 13px;border-radius:0 10px 10px 0;margin:0}
.ex{display:flex;flex-direction:column;gap:7px}
.ex .row{display:flex;gap:9px;align-items:flex-start;background:var(--chip);border-radius:10px;padding:10px 12px}
.ex .row.h{background:transparent;border:1px dashed var(--ac2)}
.ex .ic{flex-shrink:0;font-size:10.5px;font-weight:800;letter-spacing:.5px;color:#fff;
  background:var(--ac);border-radius:6px;padding:3px 7px;margin-top:2px}
.ex .row.h .ic{background:var(--ac2)}
.ex .tx{font-size:15px;flex:1;min-width:0}
.vs .cs{font-size:13.5px;margin-top:7px;background:var(--chip);border-radius:8px;padding:8px 10px}
.vs .cs:before{content:"사례 ";font-weight:800;color:var(--ac);font-size:11px}
.cf{display:flex;flex-wrap:wrap;gap:6px}
.cf span{border:1px dashed var(--warn);color:var(--warn);border-radius:9px;padding:5px 10px;font-size:14px;font-weight:700}
.loc{font-size:12px;color:var(--dim2)}
.loc span{background:var(--chip);border-radius:5px;padding:2px 7px;display:inline-block;margin:2px 4px 0 0}
.vs{display:grid;grid-template-columns:1fr;gap:10px}
.vs .col{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px;border-top:4px solid var(--ac)}
.vs .col.b{border-top-color:var(--ac2)}
.vs .nm{font-size:17px;font-weight:800}
.vs .en{font-size:12px;color:var(--dim2);margin-left:5px;font-weight:500}
.vs .sd{font-size:15px;font-weight:700;margin-top:7px}
.vs .dd{font-size:14px;color:var(--dim);margin-top:5px}
.vsq{font-size:22px;font-weight:800;line-height:1.4}
.vsq i{font-style:normal;color:var(--ac);margin:0 6px}
@media (min-width:620px){ .vs{grid-template-columns:1fr 1fr} }

/* ═══ 도식 ═══ */
.dg{margin:0;padding:0}
.dgsvg{background:var(--dbox);border:1px solid var(--dline);border-radius:11px;padding:10px;overflow-x:auto}
.dgsvg svg{width:100%;height:auto;display:block;min-width:270px}
.dgsvg .n{fill:var(--panel);stroke:var(--dline);stroke-width:1.4}
.dgsvg .n.a0{fill:var(--a0)} .dgsvg .n.a1{fill:var(--a1)}
.dgsvg .n.a2{fill:var(--a2)} .dgsvg .n.a3{fill:var(--a3)}
.dgsvg .n.vn{fill:none;stroke:var(--ac)}
.dgsvg .halo{fill:var(--dbox);stroke:none;opacity:.94}
.dgsvg .e{stroke:var(--dim2);stroke-width:1.5;fill:none}
.dgsvg .e.th{stroke-width:.9;opacity:.5}
.dgsvg .e.bus{stroke-width:3}
.dgsvg .ahd{fill:var(--dim2);stroke:none}
.dgsvg text{font-family:inherit;font-size:11.5px;fill:var(--dtx)}
.dgsvg .tn{font-size:9.5px;font-weight:800;fill:var(--ac)}
.dgsvg .tl{font-size:10.5px;fill:var(--dim)}
.dgsvg .tb{font-size:12.5px;font-weight:800;fill:var(--ac)}
.dg-stack{display:flex;flex-direction:column;gap:4px}
.dg-stack .row{background:var(--dbox);border:1px solid var(--dline);border-radius:9px;padding:9px 11px;border-left:4px solid var(--ac)}
.dg-stack .row .k{font-weight:700;font-size:14px;display:block}
.dg-stack .row .v{font-size:12.5px;color:var(--dim);display:block;margin-top:1px}
.dg-rank{background:var(--dbox);border:1px solid var(--dline);border-radius:11px;padding:11px}
.dg-rank .ends{display:flex;justify-content:space-between;font-size:12px;color:var(--dim);margin-bottom:9px}
.dg-rank .ends b{color:var(--ac);font-size:12.5px}
.dg-rank .row{display:table;width:100%;padding:5px 0}
.dg-rank .no{display:table-cell;width:24px;font-size:11.5px;font-weight:800;color:var(--dim2);text-align:center;vertical-align:middle}
.dg-rank .bar{display:table-cell;width:46px;vertical-align:middle}
.dg-rank .bar:before{content:"";display:block;height:8px;border-radius:99px;background:var(--ac);width:100%}
.dg-rank .k{display:table-cell;font-weight:700;font-size:14px;padding-left:9px;vertical-align:middle}
.dg-rank .v{display:block;font-size:12px;color:var(--dim);font-weight:400}
.dg-chain{display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:var(--dbox);border:1px solid var(--dline);border-radius:11px;padding:11px}
.dg-chain .st{background:var(--panel);border:1px solid var(--dline);border-radius:9px;padding:7px 11px;font-size:13.5px}
.dg-chain .st b{font-weight:700;display:block}
.dg-chain .st i{font-style:normal;font-size:12px;color:var(--dim);display:block}
.dg-chain .ar{color:var(--ac);font-weight:800}
.dg-split{display:grid;gap:8px;grid-template-columns:1fr}
.dg-split .col{background:var(--dbox);border:1px solid var(--dline);border-radius:11px;padding:11px;border-top:4px solid var(--ac)}
.dg-split .col.c1{border-top-color:var(--ac2)} .dg-split .col.c2{border-top-color:var(--warn)}
.dg-split .ttl{font-weight:800;font-size:14px;margin-bottom:5px}
.dg-split ul{margin:0;padding-left:18px}
.dg-split li{font-size:13px;color:var(--dim);margin:2px 0}
@media (min-width:620px){ .dg-split{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))} }
.dg-pair{display:table;width:100%;background:var(--dbox);border:1px solid var(--dline);border-radius:11px;padding:11px}
.dg-pair .side{display:table-cell;width:43%;background:var(--panel);border:1px solid var(--dline);border-radius:9px;padding:9px;text-align:center;vertical-align:middle}
.dg-pair .side b{display:block;font-size:14px}
.dg-pair .side i{font-style:normal;font-size:12px;color:var(--dim);display:block;margin-top:2px}
.dg-pair .mid{display:table-cell;width:14%;text-align:center;color:var(--ac);font-weight:800;font-size:16px;vertical-align:middle}
.dg-pair .mid .rev{display:block;color:var(--ac2)}
.dg-bits{display:flex;gap:3px;background:var(--dbox);border:1px solid var(--dline);border-radius:11px;padding:11px;flex-wrap:wrap}
.dg-bits .seg{border-radius:7px;padding:9px 5px;text-align:center;font-size:12px;background:var(--a0);border:1px solid var(--dline);min-width:52px}
.dg-bits .seg.c1{background:var(--a1)} .dg-bits .seg.c2{background:var(--a2)} .dg-bits .seg.c3{background:var(--a3)}
.dg-grid{display:grid;border:1px solid var(--dline);border-radius:11px;overflow:auto;background:var(--dbox);font-size:13px}
.dg-grid .hd{background:var(--chip2);font-weight:800;padding:8px 9px;font-size:12px;border-bottom:1px solid var(--dline)}
.dg-grid .cl{padding:8px 9px;border-bottom:1px solid var(--dline)}
.dg-grid .cl.k{font-weight:700}
.dg-pyr{display:flex;flex-direction:column;gap:4px;align-items:center;background:var(--dbox);border:1px solid var(--dline);border-radius:11px;padding:11px}
.dg-pyr .row{background:var(--panel);border:1px solid var(--dline);border-radius:8px;padding:8px 10px;text-align:center;font-size:13px}
.dg-pyr .row .k{font-weight:700}
.dg-bar{background:var(--dbox);border:1px solid var(--dline);border-radius:11px;padding:11px}
.dg-bar .row{display:table;width:100%;padding:4px 0;font-size:13px}
.dg-bar .k{display:table-cell;width:34%;vertical-align:middle}
.dg-bar .tr{display:table-cell;vertical-align:middle}
.dg-bar .tr i{display:block;height:10px;background:var(--ac);border-radius:99px}
.dg-bar .v{display:table-cell;width:16%;text-align:right;font-size:12px;color:var(--dim);vertical-align:middle}
.dg-nest .lv{border:1.6px solid var(--ac);border-radius:11px;padding:10px}
.dg-nest .lv.l1{border-color:var(--ac2)} .dg-nest .lv.l2{border-color:var(--warn)} .dg-nest .lv.l3{border-color:#2563eb}
.dg-nest .k{font-weight:700;font-size:13.5px;display:block;margin-bottom:7px}
.dg-nest .v{font-size:12px;color:var(--dim);display:block;margin:-5px 0 7px}
.dg-ox{display:flex;flex-direction:column;gap:5px}
.dg-ox .row{background:var(--dbox);border:1px solid var(--dline);border-radius:9px;padding:9px 11px}
.dg-ox .m{display:inline-block;width:24px;height:24px;line-height:24px;border-radius:50%;text-align:center;
  font-weight:800;font-size:13px;color:#fff;margin-right:8px;vertical-align:middle}
.dg-ox .row.o .m{background:var(--good)} .dg-ox .row.x .m{background:var(--bad)}
.dg-ox .k{font-size:13.5px;font-weight:600}
.dg-ox .v{display:block;font-size:12px;color:var(--dim);font-weight:400;margin:3px 0 0 32px}
.dg-code{background:var(--dbox);border:1px solid var(--dline);border-radius:11px;padding:11px;
  overflow-x:auto;font-size:13px;line-height:1.55;margin:0;white-space:pre;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"D2Coding",monospace}
.dgerr{font-size:13px;color:var(--warn)}
"""

def esc(s): return html.escape(s or "", quote=False)

# ══════════════════════════════ 노트 타입 ══════════════════════════════
M_TERM = genanki.Model(
    1748392001, "정처기 용어 (용어→설명)",
    fields=[{"name":"용어"},{"name":"영문"},{"name":"한줄정의"},{"name":"상세설명"},
            {"name":"도식"},{"name":"혼동용어"},{"name":"출제형태"},{"name":"위치"},
            {"name":"사례"},{"name":"고리"}],
    templates=[{"name":"용어→설명",
      "qfmt": '<div class="q">{{용어}}{{#영문}}<span class="en">{{영문}}</span>{{/영문}}</div>'
              '<div class="ask">이 용어를 <b>정의 · 핵심 · 혼동 용어</b>까지 말해 보십시오.</div>',
      "afmt": '<div class="q">{{용어}}{{#영문}}<span class="en">{{영문}}</span>{{/영문}}</div>'
              '<hr id="answer">'
              '<div class="lb">한 줄 정의</div><div class="def">{{한줄정의}}</div>'
              '<div class="lb">상세 설명</div><p class="det">{{상세설명}}</p>'
              '{{#사례}}<div class="lb">예시로 붙잡기</div><div class="ex">'
              '<div class="row"><span class="ic">사례</span><span class="tx">{{사례}}</span></div>'
              '{{#고리}}<div class="row h"><span class="ic">고리</span><span class="tx">{{고리}}</span></div>{{/고리}}'
              '</div>{{/사례}}'
              '{{#도식}}<div class="lb">도식</div>{{도식}}{{/도식}}'
              '{{#혼동용어}}<div class="lb">함께 봐야 할 혼동 용어</div><div class="cf">{{혼동용어}}</div>{{/혼동용어}}'
              '{{#출제형태}}<div class="lb">출제 형태</div><p class="exam">{{출제형태}}</p>{{/출제형태}}'
              '<div class="lb">위치</div><div class="loc">{{위치}}</div>'}],
    css=CSS)

M_PAIR = genanki.Model(
    1748392002, "정처기 혼동 짝 구별",
    fields=[{"name":"짝"},{"name":"용어A"},{"name":"영문A"},{"name":"정의A"},{"name":"상세A"},
            {"name":"용어B"},{"name":"영문B"},{"name":"정의B"},{"name":"상세B"},
            {"name":"함정"},{"name":"도식"},{"name":"위치"},
            {"name":"사례A"},{"name":"사례B"}],
    templates=[{"name":"짝 구별",
      "qfmt": '<div class="vsq">{{용어A}}<i>vs</i>{{용어B}}</div>'
              '<div class="ask">두 용어의 <b>차이</b>를 한 문장으로 말해 보십시오. 시험은 이 둘의 설명을 서로 바꿔 냅니다.</div>',
      "afmt": '<div class="vsq">{{용어A}}<i>vs</i>{{용어B}}</div><hr id="answer">'
              '<div class="vs">'
              '<div class="col"><div class="nm">{{용어A}}{{#영문A}}<span class="en">{{영문A}}</span>{{/영문A}}</div>'
              '<div class="sd">{{정의A}}</div><div class="dd">{{상세A}}</div>'
              '{{#사례A}}<div class="cs">{{사례A}}</div>{{/사례A}}</div>'
              '<div class="col b"><div class="nm">{{용어B}}{{#영문B}}<span class="en">{{영문B}}</span>{{/영문B}}</div>'
              '<div class="sd">{{정의B}}</div><div class="dd">{{상세B}}</div>'
              '{{#사례B}}<div class="cs">{{사례B}}</div>{{/사례B}}</div>'
              '</div>'
              '{{#함정}}<div class="lb">시험이 파는 함정</div><p class="exam">{{함정}}</p>{{/함정}}'
              '{{#도식}}<div class="lb">도식</div>{{도식}}{{/도식}}'
              '<div class="lb">위치</div><div class="loc">{{위치}}</div>'}],
    css=CSS)

M_DIA = genanki.Model(
    1748392003, "정처기 도식 재생",
    fields=[{"name":"용어"},{"name":"질문"},{"name":"힌트"},{"name":"도식"},{"name":"한줄정의"},{"name":"위치"},
            {"name":"사례"}],
    templates=[{"name":"도식 재생",
      "qfmt": '<div class="q">{{용어}}</div><div class="ask">{{질문}}</div>'
              '{{#힌트}}<div class="hint">{{힌트}}</div>{{/힌트}}',
      "afmt": '<div class="q">{{용어}}</div><hr id="answer">'
              '{{도식}}'
              '<div class="lb">한 줄 정의</div><div class="def">{{한줄정의}}</div>'
              '{{#사례}}<div class="lb">사례</div><div class="ex"><div class="row">'
              '<span class="ic">사례</span><span class="tx">{{사례}}</span></div></div>{{/사례}}'
              '<div class="lb">위치</div><div class="loc">{{위치}}</div>'}],
    css=CSS)

M_ABBR = genanki.Model(
    1748392004, "정처기 약어→풀네임",
    fields=[{"name":"약어"},{"name":"풀네임"},{"name":"한줄정의"},{"name":"위치"},
            {"name":"사례"}],
    templates=[{"name":"약어→풀네임",
      "qfmt": '<div class="q">{{약어}}</div><div class="ask">풀네임을 <b>철자까지</b> 말해 보십시오.</div>',
      "afmt": '<div class="q">{{약어}}</div><hr id="answer">'
              '<div class="def">{{풀네임}}</div>'
              '<div class="lb">한 줄 정의</div><p class="det">{{한줄정의}}</p>'
              '{{#사례}}<div class="lb">사례</div><div class="ex"><div class="row">'
              '<span class="ic">사례</span><span class="tx">{{사례}}</span></div></div>{{/사례}}'
              '<div class="lb">위치</div><div class="loc">{{위치}}</div>'}],
    css=CSS)

# ══════════════════════════════ 덱 ══════════════════════════════
ROOT = "정보처리기사 용어사전"
DECK_IDS = {1:1748393001, 2:1748393002, 3:1748393003, 4:1748393004, 5:1748393005}
decks = {s: genanki.Deck(DECK_IDS[s], "%s::%d과목 %s" % (ROOT, s, SUBJ[str(s)]))
         for s in range(1,6)}

SWAP = re.compile(r"바꿔|혼동|서로|반대|구별|함정|섞어|잘못")
def loc(t):
    return '<span>%s %s</span><span>%d과목 %s</span>' % (esc(t["chn"]), esc(t["chc"]), t["s"], esc(t["subj"]))
def base_tags(t, kind):
    tg = ["유형_"+kind, "과목%d" % t["s"], "챕터_"+t["chn"].replace("-","_")]
    if t.get("oab"): tg.append("오답노트출처")
    return tg

stats = {"용어":0,"혼동짝":0,"도식":0,"약어":0,"핵심짝":0,"보조짝":0,"도식포함":0,"예시포함":0}

# 1. 용어
for t in D["terms"]:
    dia = t["dia"] or ""
    cf = "".join('<span>%s</span>' % esc(c) for c in t["conf"])
    tags = base_tags(t, "용어")
    if dia: tags.append("도식있음"); stats["도식포함"] += 1
    if t.get("exCase"): tags.append("예시있음"); stats["예시포함"] += 1
    n = genanki.Note(model=M_TERM,
        fields=[esc(t["name"]), esc(t["en"]), esc(t["short"]), esc(t["detail"]),
                dia, cf, esc(t["exam"]), loc(t),
                esc(t.get("exCase","")), esc(t.get("exHook",""))],
        tags=tags, guid=genanki.guid_for("gigsa-term", t["name"]))
    decks[t["s"]].add_note(n); stats["용어"] += 1

# 2. 혼동 짝
for p in D["pairs"]:
    exam_blob = (p.get("aExam") or "") + " " + (p.get("bExam") or "")
    core = bool(SWAP.search(exam_blob))
    trap = ""
    if p.get("aExam"): trap += "<b>%s</b> — %s" % (esc(p["a"]), esc(p["aExam"]))
    if p.get("bExam"): trap += ("<br><br>" if trap else "") + "<b>%s</b> — %s" % (esc(p["b"]), esc(p["bExam"]))
    tags = base_tags(p, "혼동짝")
    tags.append("혼동짝_핵심" if core else "혼동짝_보조")
    stats["핵심짝" if core else "보조짝"] += 1
    n = genanki.Note(model=M_PAIR,
        fields=[esc(p["a"]+" vs "+p["b"]), esc(p["a"]), esc(p["aEn"]), esc(p["aShort"]), esc(p["aDetail"]),
                esc(p["b"]), esc(p["bEn"]), esc(p["bShort"]), esc(p["bDetail"]),
                trap, p["dia"] or "", loc(p),
                esc(p.get("aCase","")), esc(p.get("bCase",""))],
        tags=tags, guid=genanki.guid_for("gigsa-pair", p["a"], p["b"]))
    decks[p["s"]].add_note(n); stats["혼동짝"] += 1

# 3. 도식 재생
for c in D["diaCards"]:
    tags = base_tags(c, "도식") + ["도식_"+c["diaType"]]
    n = genanki.Note(model=M_DIA,
        fields=[esc(c["name"]), esc(c["ask"]), esc(c["hint"]), c["dia"] or "", esc(c["short"]), loc(c),
                esc(c.get("exCase",""))],
        tags=tags, guid=genanki.guid_for("gigsa-dia", c["name"]))
    decks[c["s"]].add_note(n); stats["도식"] += 1

# 4. 약어
for a in D["abbr"]:
    n = genanki.Note(model=M_ABBR,
        fields=[esc(a["name"]), esc(a["en"]), esc(a["short"]), loc(a), esc(a.get("exCase",""))],
        tags=base_tags(a, "약어"), guid=genanki.guid_for("gigsa-abbr", a["name"]))
    decks[a["s"]].add_note(n); stats["약어"] += 1

pkg = genanki.Package([decks[s] for s in range(1,6)])
pkg.write_to_file(OUT)
print("생성:", OUT, os.path.getsize(OUT), "bytes")
print("노트 수:", stats)
print("총 노트:", stats["용어"]+stats["혼동짝"]+stats["도식"]+stats["약어"])
for s in range(1,6):
    print("  %d과목 %s : %d 노트" % (s, SUBJ[str(s)], len(decks[s].notes)))
