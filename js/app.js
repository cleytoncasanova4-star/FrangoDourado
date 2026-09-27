/* ============================================================
   FRANGO DOURADO — APP PRINCIPAL (index.html)
   ============================================================ */

const Store = {
  get(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

function getProdutos(){ return Store.get('frango_produtos', PRODUTOS_PADRAO); }
function getConfig(){ return Store.get('frango_config', CONFIG); }

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* Navbar mobile */
const hamburger = $('#hamburger');
const navLinks = $('#navLinks');

function fecharMenu(){
  navLinks?.classList.remove('open');
  hamburger?.classList.remove('active');
  document.querySelector('.nav-overlay')?.classList.remove('active');
  document.body.style.overflow = '';
}
function abrirMenu(){
  navLinks?.classList.add('open');
  hamburger?.classList.add('active');
  document.querySelector('.nav-overlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
hamburger?.addEventListener('click', () => {
  if(navLinks.classList.contains('open')) fecharMenu();
  else abrirMenu();
});
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', fecharMenu));
document.querySelector('.nav-overlay')?.addEventListener('click', fecharMenu);

/* Renderização do menu no index (preview) */
function renderMenuPreview(){
  const produtos = getProdutos();

  const porCategoria = cat => produtos.filter(p => p.categoria === cat);
  const renderLista = (cat) => porCategoria(cat).map(p => `
    <div class="menu-item-mini">
      <b>${p.icon} ${p.nome}</b>
      <span>${p.preco} MT</span>
    </div>
  `).join('');

  if($('#catPratos'))          $('#catPratos').innerHTML = renderLista('pratos');
  if($('#catAcompanhamentos')) $('#catAcompanhamentos').innerHTML = renderLista('acompanhamentos');
  if($('#catRefrigerantes'))   $('#catRefrigerantes').innerHTML = renderLista('refrigerantes');
}

/* Scroll reveal */
function setupReveal(){
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold:.15 });
  $$('.fade-up, .step-card').forEach(el => { el.classList.add('fade-up'); io.observe(el); });
}

/* Config na UI */
function aplicarConfig(){
  const cfg = getConfig();
  const fw = $('#floatWhats');
  if(fw) fw.href = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(cfg.mensagemWhatsApp)}`;
  const lw = $('#locWhatsApp');
  if(lw) lw.href = `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de saber mais.')}`;
  if($('#locEndereco')) $('#locEndereco').textContent = cfg.empresa?.endereco || '';
  if($('#locTelefone')) $('#locTelefone').textContent = cfg.telefone || cfg.whatsapp;
  if($('#locHorario'))  $('#locHorario').textContent  = cfg.empresa?.horario || '';
  if($('#year')) $('#year').textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', () => {
  aplicarConfig();
  renderMenuPreview();
  setupReveal();
});