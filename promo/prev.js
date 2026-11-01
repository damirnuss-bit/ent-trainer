const { chromium } = require('playwright');
(async () => {
  const ts = process.argv[2].split(',');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + process.cwd() + '/' + (process.env.PAGE || 'anim.html'));
  await p.evaluate(() => window.ready);
  for (const t of ts) { await p.evaluate(t => window.render(+t), t); await p.screenshot({ path: `pv/p_${t}.png` }); }
  await b.close();
})();
