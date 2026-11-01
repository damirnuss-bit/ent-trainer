// node render_ep.js job.json from to  -> кадры в job.frames
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const job = JSON.parse(fs.readFileSync(process.argv[2]));
  const [a, b] = process.argv.slice(3).map(Number);
  fs.mkdirSync(job.frames, { recursive: true });
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await p.goto('file://' + __dirname + '/quiz.html');
  await p.evaluate(() => window.ready);
  await p.evaluate(a => window.setup(...a), [job.ep, job.tl, job.lang]);
  for (let i = a; i < b; i++) {
    await p.evaluate(t => window.render(t), i / 30);
    await p.screenshot({ path: `${job.frames}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  await br.close();
})();
