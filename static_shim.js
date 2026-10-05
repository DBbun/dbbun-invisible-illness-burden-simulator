/* Read-only public demo shim. build_static_demo.py copies this next to a copy of index.html so the same
   interface runs from plain static files (no Python server, no model calls, no API key). It answers the
   page's /api/... requests from pre-built JSON files under data/, turns the download buttons into links to
   pre-built files, and switches off everything that would create, change or delete anything. */
(function () {
  window.DBBUN_STATIC = true;
  const realFetch = window.fetch.bind(window);
  const blocked = () => new Response(JSON.stringify({
    error: 'This is the public read-only demo. Generating, deleting and administration are available in the full tool.'
  }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  const json = (value) => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
  const safe = (id) => String(id).replace(/[^A-Za-z0-9_.-]/g, '_');

  window.fetch = async function (input, init) {
    const raw = typeof input === 'string' ? input : input.url;
    const method = ((init && init.method) || 'GET').toUpperCase();
    const url = new URL(raw, location.href);
    const path = url.pathname;
    if (!path.startsWith('/api/')) return realFetch(input, init);
    if (method === 'POST') {
      let body = {};
      try { body = JSON.parse(init.body); } catch (e) { /* not JSON */ }
      if (path === '/api/bundle') return realFetch('data/downloads/' + safe(body.id) + '.bundle.zip');
      if (path === '/api/structured-export') return realFetch('data/downloads/' + safe(body.id) + '.xlsx');
      return blocked();
    }
    const query = url.searchParams;
    if (path === '/api/library') return realFetch('data/library.json');
    if (path.startsWith('/api/jobs/')) return realFetch('data/jobs/' + safe(path.split('/').pop()) + '.json');
    if (path === '/api/references') return realFetch('data/references/' + safe(query.get('job')) + '.json');
    if (path === '/api/benchmarks') return realFetch('data/benchmarks/' + safe(query.get('job')) + '.json');
    if (path === '/api/evidence-cards') return realFetch('data/evidence_cards.json');
    if (path === '/api/cross-analyses') return realFetch('data/cross_analyses.json');
    if (path === '/api/models') return json({ remote: { available: false } });
    return blocked();
  };

  // Links the page builds as plain anchors into the API are redirected to static files at click time.
  document.addEventListener('click', function (event) {
    const link = event.target.closest && event.target.closest('a[href^="/api/"]');
    if (!link) return;
    const url = new URL(link.getAttribute('href'), location.href);
    if (url.pathname === '/api/federal-knowledge') {
      link.setAttribute('href', 'data/knowledge/' + safe(url.searchParams.get('unit')) + '.txt');
      link.setAttribute('target', '_blank');
    } else if (url.pathname === '/api/evidence-card') {
      link.setAttribute('href', 'data/evidence_card/' + safe(url.searchParams.get('id')) + '.json');
      link.setAttribute('target', '_blank');
    } else if (url.pathname === '/api/federal-source') {
      event.preventDefault();
      alert('The original federal data file is not included in the public demo because of its size. It is available from the agency that publishes it, and in the full tool.');
    }
  }, true);

  window.addEventListener('load', function () {
    const hide = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
    hide('adminToggle');
    hide('libraryToggle');
    window.showGenerateView = function () { window.showLibraryView(); };
    const banner = document.createElement('div');
    banner.setAttribute('role', 'note');
    banner.style.cssText = 'margin:0 0 14px;padding:12px 16px;border:1px solid #bdbdbd;border-radius:10px;background:#f2f2f2;color:#242424;font:16px/1.4 Arial,sans-serif';
    banner.innerHTML = '<b>Public read-only demo.</b> Open any simulator below and change its assumptions, read the forecast and evidence tabs, or download its files. ' +
      'Generating new simulators, deleting and administration are turned off here. These are research prototypes built from published papers, not medical or financial advice. Independent entry by DBbun LLC; not endorsed by HHS or NIH.';
    const main = document.querySelector('main');
    main.insertBefore(banner, main.firstChild);
    // Write controls that would be dead ends in a read-only copy.
    const prune = () => {
      document.querySelectorAll('#libraryList button, #libraryPanel .libTabNav button, #libraryBulkBar').forEach((el) => {
        const label = (el.textContent || '').trim();
        if (el.id === 'libraryBulkBar' || /^(Delete|Delete selected|Select all|Retry writing the Python source|Run Cross-Pollination Analysis)/.test(label)) el.style.display = 'none';
      });
      document.querySelectorAll('#libraryList input[type=checkbox]').forEach((el) => { el.style.display = 'none'; });
      document.querySelectorAll('.crossAnalysisBar').forEach((el) => { el.style.display = 'none'; });
      document.querySelectorAll('#crossAnalysisResults button').forEach((el) => { if (/^Delete/.test((el.textContent || '').trim())) el.style.display = 'none'; });
    };
    new MutationObserver(prune).observe(document.getElementById('libraryPanel'), { childList: true, subtree: true });
    prune();
    window.showLibraryView();
  });
})();
