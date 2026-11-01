// быстрый просмотр кадров: node shot.js ru 1.0 5.5 ...
const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
 const [lang,...ts]=process.argv.slice(2);
 const ep=JSON.parse(fs.readFileSync('episodes.json'))[0].map(q=>({...q[lang],subject:q.subject[lang==='ru'?0:1],correct:q.correct}));
 const tl={tdur:4,ldur:1.4,q:[{show:0,t0:5,reveal:null},{show:12,t0:16,reveal:20},{show:24,t0:28,reveal:32},{show:36,t0:40,reveal:44},{show:48,t0:52,reveal:56}],
   lad:[{t:10.8,lv:1},{t:22.8,lv:2},{t:34.8,lv:3},{t:46.8,lv:4}],heart:21,final:{show:60,t0:null,reveal:61.5},cta:63};
 const br=await chromium.launch();const p=await br.newPage({viewport:{width:540,height:960}});
 await p.goto('file://'+process.cwd()+'/quiz.html');await p.evaluate(()=>window.ready);
 await p.evaluate(a=>window.setup(...a),[ep,tl,lang]);
 for(const t of ts){await p.evaluate(t=>window.render(t),+t);await p.screenshot({path:`/tmp/claude-0/-home-claude/4c6726bb-24d9-505d-89b4-25324472bdd2/scratchpad/s_${lang}_${t}.png`})}
 await br.close();
})();
