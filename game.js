const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const bg=new Image(),sprite=new Image();
bg.src='assets/world.png';
sprite.src='assets/player.png';
const keys=new Set(),W=960,H=600,floor=448;
const glyphs= {
  P:['11110','10001','10001','11110','10000','10000','10000'],O:['01110','10001','10001','10001','10001','10001','01110'],R:['11110','10001','10001','11110','10100','10010','10001'],T:['11111','00100','00100','00100','00100','00100','00100'],F:['11111','10000','10000','11110','10000','10000','10000'],L:['10000','10000','10000','10000','10000','10000','11111'],I:['11111','00100','00100','00100','00100','00100','11111']
};
const letters=[...'PORTFOLIO'].map((ch,i)=>( {
  ch,x:107+i*84,y:180,w:70,h:98,bounce:0
}));
const steps=[ {
  x:60,y:378,w:105
}, {
  x:170,y:307,w:92
}, {
  x:70,y:245,w:85
}, {
  x:815,y:380,w:85
}];
let p,coins,particles=[],paused=false,muted=true,audio,t=0,last=0,won=false,near=false;
function reset() {
  p= {
    x:90,y:floor-44,vx:0,vy:0,w:24,h:44,jumps:0,face:1,ground:true,coyote:0
  };
  coins=[ {
    x:190,y:275
  }, {
    x:105,y:214
  }, {
    x:305,y:145
  }, {
    x:557,y:145
  }, {
    x:860,y:346
  }].map(c=>( {
    ...c,got:false
  }));
  particles=[];
  won=false;
  paused=false;
  keys.clear();
  document.querySelector('#pause').textContent='Tạm dừng';
  document.querySelector('#pause').setAttribute('aria-pressed','false');
  document.querySelector('#score').textContent='0 / 5';
  msg('Thu thập 5 tinh thể. Khám phá theo cách của bạn.');
}
function msg(s) {
  document.querySelector('#message').textContent=s;
}
function tone(freq=440) {
  if(muted)return;
  audio??=new(window.AudioContext||window.webkitAudioContext)();
  audio.resume();
  let o=audio.createOscillator(),g=audio.createGain();
  o.type='square';
  o.frequency.value=freq;
  g.gain.setValueAtTime(.035,audio.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.13);
  o.connect(g);
  g.connect(audio.destination);
  o.start();
  o.stop(audio.currentTime+.14);
}
function burst(x,y,color) {
  for(let i=0;i<12;i++)particles.push( {
    x,y,vx:(Math.random()-.5)*180,vy:-Math.random()*180,life:.55,color
  });
}
function jump() {
  if(paused||p.jumps>=2)return;
  p.vy=-430;
  p.ground=false;
  p.jumps++;
  p.coyote=0;
  tone(p.jumps===1?300:440);
  burst(p.x+12,p.y+44,'#a2efd1');
}
function interact() {
  if(near)location.href='projects.html';
  else msg('Cổng Dự án ở phía bên phải. Bạn cũng có thể bấm vào bảng.');
}
const gameKeys=['arrowleft','arrowright','arrowup',' ','a','d','w','e','r'];
window.addEventListener('keydown',e=> {
  if(e.target.closest('button,a,input,textarea'))return;const k=e.key.toLowerCase();if(gameKeys.includes(k))e.preventDefault();keys.add(k);if(!e.repeat) {
    if([' ','w','ArrowUp'].includes(k)||k==='arrowup')jump();if(k==='e')interact();if(k==='r')reset();
  }
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=> {
  keys.clear();last=0;
});
document.querySelector('#reset').onclick=()=> {
  reset();
  canvas.focus();
};
document.querySelector('#pause').onclick=()=> {
  paused=!paused;
  keys.clear();
  document.querySelector('#pause').textContent=paused?'Tiếp tục':'Tạm dừng';
  document.querySelector('#pause').setAttribute('aria-pressed',String(paused));
};
document.querySelector('#sound').onclick=()=> {
  muted=!muted;
  document.querySelector('#sound').textContent=muted?'Âm thanh: tắt':'Âm thanh: bật';
  document.querySelector('#sound').setAttribute('aria-pressed',String(!muted));
  tone(520);
};
document.querySelectorAll('[data-control]').forEach(b=> {
  const k=b.dataset.control==='left'?'a':'d';b.addEventListener('pointerdown',e=> {
    e.preventDefault();b.setPointerCapture(e.pointerId);if(b.dataset.control==='jump')jump();else keys.add(k);
  });['pointerup','pointercancel','lostpointercapture'].forEach(type=>b.addEventListener(type,()=>keys.delete(k)));
});
canvas.addEventListener('pointerdown',e=> {
  canvas.focus();const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;letters.forEach(l=> {
    if(x>l.x&&x<l.x+l.w&&y>l.y&&y<l.y+l.h) {
      l.bounce=15;burst(x,y,'#ffd18c');tone(260);
    }
  });
});
function update(dt) {
  t+=dt;
  let move=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
  p.vx=move*225;
  if(move)p.face=move;
  const oldY=p.y;
  p.x=Math.max(8,Math.min(W-32,p.x+p.vx*dt));
  p.vy+=1050*dt;
  p.y+=p.vy*dt;
  p.ground=false;
  for(const platform of [ {
    x:0,y:floor,w:W
  },...steps,...letters]) {
    if(p.vy>=0&&oldY+p.h<=platform.y+2&&p.y+p.h>=platform.y&&p.x+p.w>platform.x&&p.x<platform.x+platform.w) {
      p.y=platform.y-p.h;
      if(p.vy>300)burst(p.x+12,platform.y,'#d0dcc0');
      p.vy=0;
      p.jumps=0;
      p.ground=true;
      break;
    }
  }
  if(!p.ground&&p.jumps===0)p.jumps=1;
  for(const c of coins) {
    if(!c.got&&Math.hypot(p.x+12-c.x,p.y+22-c.y)<32) {
      c.got=true;
      burst(c.x,c.y,'#ffd18c');
      tone(700+coins.filter(c=>c.got).length*100);
      const n=coins.filter(c=>c.got).length;
      document.querySelector('#score').textContent=n+' / 5';
      if(n===5) {
        won=true;
        msg('LEVEL COMPLETE! Bạn đã tìm đủ tinh thể. Hẹn gặp ở trang Dự án.');
      }
    }
  }
  const next=p.x>790&&p.y>380;
  if(next&&!near&&!won)msg('Nhấn E để khám phá các dự án.');
  if(!next&&near&&!won)msg('Mẹo: nhấn nhảy lần nữa khi đang trên không.');
  near=next;
  particles=particles.filter(q=>q.life>0);
  for(const q of particles) {
    q.x+=q.vx*dt;
    q.y+=q.vy*dt;
    q.vy+=450*dt;
    q.life-=dt;
  }
  for(const l of letters)l.bounce*=Math.pow(.03,dt);
}
function draw() {
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#142637';
  ctx.fillRect(0,0,W,H);
  if(bg.complete&&bg.naturalWidth) {
    ctx.drawImage(bg,0,0,W,H);
  }
  const gradient=ctx.createLinearGradient(0,0,0,600);
  gradient.addColorStop(0,'#0f1c36cc');
  gradient.addColorStop(.5,'#152c4433');
  gradient.addColorStop(1,'#102b3555');
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,W,H);
  for(const l of letters) {
    let by=Math.round(l.y-Math.sin(l.bounce)*l.bounce);
    const shape=glyphs[l.ch];
    for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(shape[row][col]==='1') {
      ctx.fillStyle='#10252c';
      ctx.fillRect(l.x+col*14+5,by+row*14+7,14,14);
      ctx.fillStyle=row<3?'#f0edd8':'#b9d3bc';
      ctx.fillRect(l.x+col*14,by+row*14,14,14);
      ctx.fillStyle='#ffffff24';
      ctx.fillRect(l.x+col*14,by+row*14,14,2);
    }
  }
  for(const s of steps) {
    ctx.fillStyle='#162f3c';
    ctx.fillRect(s.x,s.y,s.w,15);
    ctx.fillStyle='#8dbaa7';
    ctx.fillRect(s.x,s.y,s.w,4);
    ctx.fillStyle='#3d6a67';
    ctx.fillRect(s.x+5,s.y+7,s.w-10,5);
  }
  for(const c of coins)if(!c.got) {
    let y=c.y+Math.sin(t*3+c.x)*4;
    ctx.fillStyle='#ffd18c';
    ctx.beginPath();
    ctx.moveTo(c.x,y-10);
    ctx.lineTo(c.x+7,y);
    ctx.lineTo(c.x,y+10);
    ctx.lineTo(c.x-7,y);
    ctx.fill();
    ctx.fillStyle='#fff6cb';
    ctx.fillRect(c.x-2,y-5,3,5);
  }
  ctx.save();
  ctx.translate(Math.round(p.x+12),Math.round(p.y+22));
  ctx.scale(p.face,1);
  if(sprite.complete&&sprite.naturalWidth) {
    let frames=Math.round(sprite.naturalWidth/sprite.naturalHeight),frame=p.ground&&Math.abs(p.vx)>0?Math.floor(t*10)%frames:0,sz=sprite.naturalHeight;
    ctx.drawImage(sprite,frame*sz,0,sz,sz,-32,-40,64,64);
  }
  ctx.restore();
  for(const q of particles) {
    ctx.globalAlpha=Math.max(0,q.life/.55);
    ctx.fillStyle=q.color;
    ctx.fillRect(Math.round(q.x),Math.round(q.y),3,3);
  }
  ctx.globalAlpha=1;
  ctx.font='10px monospace';
  ctx.textAlign='center';
  ctx.fillStyle='#d5e8d8';
  ctx.fillText('PLAYER 01',p.x+12,p.y-16);
  ctx.textAlign='left';
  if(paused) {
    ctx.fillStyle='#101c34c9';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#f0edd8';
    ctx.font='bold 36px monospace';
    ctx.textAlign='center';
    ctx.fillText('PAUSED',480,310);
    ctx.textAlign='left';
  }
}
function frame(ts) {
  const dt=last?Math.min((ts-last)/1000,.025):0;
  last=ts;
  if(!paused&&!document.hidden)update(dt);
  draw();
  requestAnimationFrame(frame);
}
reset();
requestAnimationFrame(frame);
