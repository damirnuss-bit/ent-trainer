const { chromium } = require('playwright');
const fs = require('fs');
const [a, b] = process.argv.slice(2).map(Number);
(async () => {
  const FR = process.env.FR || 'frames'; fs.mkdirSync(FR, { recursive: true });
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await p.goto('file://' + process.cwd() + '/' + (process.env.PAGE || 'anim.html'));
  await p.evaluate(() => window.ready);
  for (let i = a; i < b; i++) {
    await p.evaluate(t => window.render(t), i / 36);
    await p.screenshot({ path: `${FR}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 93 });
  }
  fs.writeFileSync(FR + `/../done_${FR}_${a}`, '1');
  await br.close();
})();
