(() => {
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduced&&'IntersectionObserver'in window){const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');o.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('[data-reveal]').forEach(el=>o.observe(el))}else document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('is-visible'));
const glow=document.querySelector('.cursor-glow');if(glow&&!reduced)window.addEventListener('pointermove',e=>{glow.style.setProperty('--x',e.clientX+'px');glow.style.setProperty('--y',e.clientY+'px')},{passive:true});
if(!reduced)document.querySelectorAll('[data-tilt]').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),rx=((e.clientY-r.top)/r.height-.5)*-5,ry=((e.clientX-r.left)/r.width-.5)*7;card.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`});card.addEventListener('pointerleave',()=>card.style.transform='')});
const navToggle=document.querySelector('[data-nav-toggle]'),nav=document.querySelector('header nav');navToggle?.addEventListener('click',()=>{const opened=nav?.classList.toggle('open');navToggle.setAttribute('aria-expanded',String(Boolean(opened)))});
const canTilt=!reduced&&window.matchMedia('(hover:hover) and (pointer:fine)').matches;
if(canTilt){
  document.querySelectorAll('[data-tilt-card]').forEach((wrap)=>{
    const shell=wrap.querySelector('.terminal-shell');
    const glare=wrap.querySelector('.terminal-card-glare');
    if(!shell)return;
    wrap.addEventListener('pointermove',(e)=>{
      const r=wrap.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width;
      const py=(e.clientY-r.top)/r.height;
      const ry=(px-.5)*16;
      const rx=(.5-py)*14;
      shell.style.transform=`rotateX(${rx}deg) rotateY(${ry}deg) translateY(-7px) scale(1.012)`;
      if(glare){
        glare.style.setProperty('--mx',`${px*100}%`);
        glare.style.setProperty('--my',`${py*100}%`);
      }
      wrap.classList.add('is-hovering');
    });
    wrap.addEventListener('pointerleave',()=>{
      shell.style.transform='';
      wrap.classList.remove('is-hovering');
    });
  });
}
const contactToggle=document.querySelector('[data-contact-toggle]');
const contactCard=contactToggle?.closest('.hero-terminal-card');
contactToggle?.addEventListener('click',(e)=>{
  e.stopPropagation();
  const open=contactCard?.classList.toggle('is-contact-open');
  contactToggle.setAttribute('aria-expanded',String(Boolean(open)));
  contactToggle.setAttribute('aria-label',open?'Ẩn thông tin liên hệ':'Hiện thông tin liên hệ');
});
/* Best-effort browser shortcut deterrence.
   This cannot truly disable DevTools; it only blocks common shortcuts/context menu. */
document.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  const devtoolsShortcut=
    e.key==='F12' ||
    (e.ctrlKey&&e.shiftKey&&['i','j','c'].includes(key)) ||
    (e.metaKey&&e.altKey&&['i','j','c'].includes(key)) ||
    ((e.ctrlKey||e.metaKey)&&key==='u');
  if(devtoolsShortcut){
    e.preventDefault();
    e.stopPropagation();
  }
},{capture:true});
})();