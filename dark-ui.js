(() => {
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduced&&'IntersectionObserver'in window){const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');o.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('[data-reveal]').forEach(el=>o.observe(el))}else document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('is-visible'));
const glow=document.querySelector('.cursor-glow');if(glow&&!reduced)window.addEventListener('pointermove',e=>{glow.style.setProperty('--x',e.clientX+'px');glow.style.setProperty('--y',e.clientY+'px')},{passive:true});
if(!reduced)document.querySelectorAll('[data-tilt]').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),rx=((e.clientY-r.top)/r.height-.5)*-5,ry=((e.clientX-r.left)/r.width-.5)*7;card.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`});card.addEventListener('pointerleave',()=>card.style.transform='')});
const palette=document.querySelector('#command-palette'),search=document.querySelector('#command-search'),results=document.querySelector('#command-results');
const commands=[
{label:'Trang chủ',meta:'Giới thiệu nhanh',href:'index.html'},
{label:'Dự án',meta:'3 dự án tiêu biểu',href:'projects.html'},
{label:'Oops-Brake',meta:'Trưởng nhóm · Lập trình viên',href:'project.html'},
{label:'GameBooth Lật Hình',meta:'Lập trình viên',href:'https://github.com/XTH-CNTT-FPOLY-HCM/GameBooth_LatHinh',external:true},
{label:'Pixel-Survivor',meta:'Dự án cá nhân · Đang phát triển',href:'https://github.com/Dev-GiaPhu/Pixel-Survivor',external:true},
{label:'Giới thiệu',meta:'Kỹ năng và định hướng',href:'about.html'},
{label:'Liên hệ',meta:'GitHub · Email · Facebook',href:'contact.html'}];
function render(q=''){if(!results)return;const s=q.trim().toLowerCase(),f=commands.filter(c=>(c.label+' '+c.meta).toLowerCase().includes(s));results.innerHTML=f.map((c,i)=>`<a class="command-item ${i===0?'active':''}" href="${c.href}" ${c.external?'target="_blank" rel="noopener"':''}><span>${c.label}</span><small>${c.meta}</small></a>`).join('')||'<p class="command-empty">Không tìm thấy nội dung phù hợp.</p>'}
function open(){if(!palette)return;palette.hidden=false;document.body.classList.add('palette-open');render();setTimeout(()=>search?.focus(),30)}function close(){if(!palette)return;palette.hidden=true;document.body.classList.remove('palette-open')}
document.querySelectorAll('[data-command-open]').forEach(b=>b.addEventListener('click',open));search?.addEventListener('input',e=>render(e.target.value));palette?.addEventListener('click',e=>{if(e.target===palette||e.target.matches('[data-close-palette]'))close()});
window.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();palette?.hidden?open():close()}if(e.key==='Escape')close();if(e.key==='Enter'&&palette&&!palette.hidden&&document.activeElement===search){const a=results?.querySelector('a');if(a){e.preventDefault();a.click()}}});
const navToggle=document.querySelector('[data-nav-toggle]'),nav=document.querySelector('header nav');navToggle?.addEventListener('click',()=>{const opened=nav?.classList.toggle('open');navToggle.setAttribute('aria-expanded',String(Boolean(opened)))});
})();