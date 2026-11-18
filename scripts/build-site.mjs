// Assembles the GitHub Pages artifact: landing pages (es/en/pt) at the root and the PWA under /app/.
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { LANGS, REPO, SITE } from '../landing/content.mjs';

const OUT = 'artifact';
if (!existsSync('dist/index.html')) throw new Error('Run `npm run build` first');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync('dist', `${OUT}/app`, { recursive: true });
cpSync('landing/landing.css', `${OUT}/landing.css`);
cpSync('public/favicon.svg', `${OUT}/favicon.svg`);
cpSync('public/pwa-512x512.png', `${OUT}/icon-512.png`);
cpSync('public/apple-touch-icon.png', `${OUT}/apple-touch-icon.png`);
writeFileSync(`${OUT}/.nojekyll`, '');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const codes = Object.keys(LANGS);

function page(code) {
  const L = LANGS[code];
  const depth = L.path ? '../' : './';
  const hreflangs = codes.map((c) => `<link rel="alternate" hreflang="${LANGS[c].htmlLang}" href="${SITE}${LANGS[c].path}">`).join('\n  ')
    + `\n  <link rel="alternate" hreflang="x-default" href="${SITE}">`;
  const switcher = codes.map((c) => `<a href="${L.path ? (LANGS[c].path ? `../${LANGS[c].path}` : '../') : (LANGS[c].path ? LANGS[c].path : './')}" hreflang="${LANGS[c].htmlLang}" lang="${LANGS[c].htmlLang}" data-lang="${c}"${c === code ? ' aria-current="true"' : ''}>${c.toUpperCase()}</a>`).join('');
  const appHref = `${depth}app/?lang=${L.appLang}`;
  const detect = code === 'es' ? `
  <script>
    (function () {
      try {
        var saved = localStorage.getItem('berraco.landing.lang');
        var map = { en: 'en/', pt: 'pt/' };
        if (!saved) {
          var n = (navigator.language || '').slice(0, 2).toLowerCase();
          if (map[n]) location.replace(map[n]);
        } else if (map[saved]) location.replace(map[saved]);
      } catch (e) {}
    })();
  </script>` : '';
  const ring = `<svg viewBox="0 0 260 260" role="img" aria-label="${esc(L.ringElapsed)}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#ea580c"/></linearGradient></defs><circle cx="130" cy="130" r="108" fill="none" stroke="var(--surface-2)" stroke-width="18"/><circle cx="130" cy="130" r="108" fill="none" stroke="url(#g)" stroke-width="18" stroke-linecap="round" stroke-dasharray="678.6" stroke-dashoffset="190" transform="rotate(-90 130 130)"/><text x="130" y="112" text-anchor="middle" font-size="13" fill="var(--muted)" font-family="inherit">${esc(L.ringElapsed)}</text><text x="130" y="148" text-anchor="middle" font-size="36" font-weight="700" fill="var(--text)" font-family="inherit">13:20:00</text><text x="130" y="176" text-anchor="middle" font-size="15" font-weight="700" fill="var(--accent)" font-family="inherit">72 %</text></svg>`;
  return `<!doctype html>
<html lang="${L.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(L.metaTitle)}</title>
  <meta name="description" content="${esc(L.metaDesc)}">
  <meta name="theme-color" content="#f59e0b">
  <link rel="canonical" href="${SITE}${L.path}">
  ${hreflangs}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(L.metaTitle)}">
  <meta property="og:description" content="${esc(L.metaDesc)}">
  <meta property="og:url" content="${SITE}${L.path}">
  <meta property="og:image" content="${SITE}icon-512.png">
  <meta property="og:locale" content="${L.og}">
  <meta name="twitter:card" content="summary">
  <link rel="icon" type="image/svg+xml" href="${depth}favicon.svg">
  <link rel="apple-touch-icon" href="${depth}apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="${depth}landing.css">${detect}
</head>
<body>
  <a class="skip" href="#main">${esc(L.skip)}</a>
  <header class="top"><div class="wrap">
    <a class="logo" href="${depth}${L.path ? L.path : ''}"><img src="${depth}favicon.svg" alt="" width="32" height="32">Berraco</a>
    <nav class="links" aria-label="Menu"><a href="#features">${esc(L.navFeatures)}</a><a href="#phases">${esc(L.navPhases)}</a><a href="#privacy">${esc(L.navPrivacy)}</a><a href="#tech">${esc(L.navTech)}</a></nav>
    <div class="langs" role="group" aria-label="Language">${switcher}</div>
  </div></header>
  <main id="main">
    <div class="wrap hero">
      <div>
        <div class="eyebrow">${esc(L.tagline)}</div>
        <h1><span>Berraco</span></h1>
        <p class="lead">${esc(L.heroText)}</p>
        <p><a class="btn" href="${appHref}">${esc(L.openApp)}</a></p>
        <p class="hint">${esc(L.installHint)}</p>
      </div>
      <div class="mock" aria-hidden="false">${ring}<div class="pill">${esc(L.ringPhase)}</div><div class="c" style="margin-top:8px">${esc(L.ringLeft)}</div></div>
    </div>
    <section class="block" id="features"><div class="wrap">
      <h2>${esc(L.featuresTitle)}</h2>
      <div class="grid">${L.features.map(([t, d]) => `<div class="feat"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
    </div></section>
    <section class="block" id="phases"><div class="wrap">
      <h2>${esc(L.phasesTitle)}</h2>
      <p class="muted">${esc(L.phasesIntro)}</p>
      <table><thead><tr><th scope="col">${esc(L.phaseHead[0])}</th><th scope="col">${esc(L.phaseHead[1])}</th></tr></thead><tbody>${L.phases.map(([h, n]) => `<tr><td>${esc(h)} h</td><td>${esc(n)}</td></tr>`).join('')}</tbody></table>
    </div></section>
    <section class="block" id="privacy"><div class="wrap"><h2>${esc(L.privacyTitle)}</h2><p class="muted">${esc(L.privacyText)}</p></div></section>
    <section class="block" id="tech"><div class="wrap"><h2>${esc(L.techTitle)}</h2><p class="muted">${esc(L.techText)}</p><p><a href="${REPO}" rel="noopener">${esc(L.repo)}</a></p>
      <p class="disclaimer" role="note">${esc(L.disclaimer)}</p></div></section>
  </main>
  <footer><div class="wrap"><span>${esc(L.footer)}</span><a href="${appHref}">${esc(L.openApp)}</a></div></footer>
  <script>
    document.querySelectorAll('.langs a').forEach(function (a) {
      a.addEventListener('click', function () { try { localStorage.setItem('berraco.landing.lang', a.getAttribute('data-lang')); } catch (e) {} });
    });
  </script>
</body>
</html>
`;
}

for (const code of codes) {
  const dir = LANGS[code].path ? `${OUT}/${LANGS[code].path}` : OUT;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, page(code));
}
console.log('site assembled in', OUT);
