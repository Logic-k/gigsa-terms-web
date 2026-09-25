# -*- coding: utf-8 -*-
"""Anki 텍스트 가져오기용 TSV (노트타입을 직접 만들고 싶을 때 / 다른 앱용)"""
import json, io, re, html
D=json.load(io.open("source.json",encoding="utf-8"))
def cl(s):  # 태그 제거 + 탭/개행 정리
    s=re.sub(r"<[^>]+>"," ",s or ""); s=html.unescape(s)
    return re.sub(r"\s+"," ",s).strip()
def tsv(path, header, rows):
    with io.open(path,"w",encoding="utf-8",newline="\n") as f:
        f.write("#separator:tab\n#html:false\n#columns:"+"\t".join(header)+"\n")
        for r in rows: f.write("\t".join(cl(x) for x in r)+"\n")
    print(path, len(rows), "행")

tsv("../정보처리기사_Anki_용어.tsv",
    ["용어","영문","한줄정의","상세설명","사례","고리","혼동용어","출제형태","위치","태그"],
    [[t["name"],t["en"],t["short"],t["detail"],t.get("exCase",""),t.get("exHook","")," / ".join(t["conf"]),t["exam"],
      "%s %s (%d과목)"%(t["chn"],t["chc"],t["s"]),
      " ".join(["유형_용어","과목%d"%t["s"],"챕터_"+t["chn"].replace("-","_")]+(["오답노트출처"] if t["oab"] else []))]
     for t in D["terms"]])
tsv("../정보처리기사_Anki_혼동짝.tsv",
    ["짝","용어A","정의A","상세A","사례A","용어B","정의B","상세B","사례B","함정","위치","태그"],
    [[p["a"]+" vs "+p["b"],p["a"],p["aShort"],p["aDetail"],p.get("aCase",""),p["b"],p["bShort"],p["bDetail"],p.get("bCase",""),
      (p.get("aExam") or "")+" | "+(p.get("bExam") or ""),
      "%s %s (%d과목)"%(p["chn"],p["chc"],p["s"]),
      " ".join(["유형_혼동짝","과목%d"%p["s"]])]
     for p in D["pairs"]])
tsv("../정보처리기사_Anki_약어.tsv",
    ["약어","풀네임","한줄정의","사례","위치","태그"],
    [[a["name"],a["en"],a["short"],a.get("exCase",""),"%s %s (%d과목)"%(a["chn"],a["chc"],a["s"]),
      " ".join(["유형_약어","과목%d"%a["s"]])]
     for a in D["abbr"]])
