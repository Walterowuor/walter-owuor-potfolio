// sw.js - Full Offline Support
const CACHE = "cybrshujaa-v1";
const ASSETS = [
    "/",
    "/index.html",
    "/script.js",
    "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js",
    "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.asm.js",
    "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.asm.wasm",
    "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.asm.data",
    "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.asm.memory.wasm"
];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener("fetch", e => {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
