/* 오프라인 캐시 — 파일을 수정해 재배포하면 CACHE 버전을 올리세요 */
const CACHE = "gigsa-v15";
const ASSETS = [
  "./", "./index.html", "./app.js", "./data.js", "./diagram.js", "./mindmap.js", "./demos.js",
  "./quiz.js", "./quiz-data.js", "./quiz-code-data.js", "./newtech-data.js",
  "./theory.js", "./theory-data.js",
  "./dia-data-1.js", "./dia-data-2.js", "./dia-data-3.js", "./dia-data-4.js",
  "./ex-data-1.js", "./ex-data-2.js", "./ex-data-3.js", "./ex-data-4.js", "./ex-data-5.js",
  "./demos/sorting.html", "./demos/db-normalization.html",
  "./demos/tcp_udp.html", "./demos/tree_order.html", "./demos/syllabus-2026.html",
  "./demos/review-notes.html",
  "./demos/board-design.html", "./demos/board-test-quality.html", "./demos/board-db.html",
  "./demos/board-os.html", "./demos/board-net-sec.html", "./demos/board-newtech.html",
  "./demos/board-sec-newtech.html",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./icon-maskable-512.png", "./icon-180.png", "./favicon.png"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
/* 캐시 우선 + 백그라운드 갱신 */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
