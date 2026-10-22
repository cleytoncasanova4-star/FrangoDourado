const Store = {
  get(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

function getProdutos(){ return Store.get('frango_produtos', PRODUTOS_PADRAO); }
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmtMT = v => `${Number(v||0)} MT`;

let carrinho = Store.get('frango_carrinho', []);
let timerFecharCarrinho = null; // Variável para controlar o tempo

// RENDERIZAR O MENU
// ============================================================
function renderMenu(){
  const produtos = getProdutos();

  const renderGrid = cat => produtos.filter(p => p.cat === cat).map(p => {
    const imgHTML = p.img 
      ? `<img src="${p.img}" style="width:100%;height:140px;object-fit:cover;border-radius:12px;margin-bottom:10px;" onerror="this.outerHTML='<div style=\\'font-size:50px;margin-bottom:10px;text-align:center;background:#f0f0f0;border-radius:12px;height:140px;display:flex;align-items:center;justify-content:center\\'>${p.icon}</div>'">` 
      : `<div style="font-size:50px;margin-bottom:10px;text-align:center;background:#f0f0f0;border-radius:12px;height:140px;display:flex;align-items:center;justify-content:center">${p.icon}</div>`;

    return `
    <div class="pd-menu-item" data-id="${p.id}">
      ${imgHTML}
      <div class="pd-mi-info" style="text-align:center;">
        <b>${p.nome}</b>
        <small style="display:block;margin:5px 0;font-size:12px;color:#777;">${p.desc || ''}</small>
        <span class="pd-mi-preco">${p.preco} MT</span>
      </div>
      <button class="pd-mi-btn" data-add="${p.id}" style="margin-top:10px;width:100%;border-radius:8px;height:40px;">ADICIONAR +</button>
    </div>
  `}).join('');

  if($('#pdCatHamburgers'))      $('#pdCatHamburgers').innerHTML = renderGrid('hamburgers');
  if($('#pdCatFrango'))          $('#pdCatFrango').innerHTML = renderGrid('frango');
  if($('#pdCatAcompanhamentos')) $('#pdCatAcompanhamentos').innerHTML = renderGrid('acompanhamentos');
  if($('#pdCatRefrigerantes'))   $('#pdCatRefrigerantes').innerHTML = renderGrid('refrigerantes');

  // Evento de clicar no botão +
  $$('[data-add]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      adicionarAoCarrinho(btn.dataset.add);
      
      // 🚀 ABRE O MINI CARRINHO AUTOMATICAMENTE
      abrirCarrinhoAuto();
    });
  });
}

function adicionarAoCarrinho(id){
  const p = getProdutos().find(x => x.id === id);
  if(!p) return;

  const item = carrinho.find(x => x.id === id);
  if(item){
    item.qtd++;
  } else {
    carrinho.push({ id: p.id, nome: p.nome, preco: p.preco, icon: p.icon, qtd: 1 });
  }
  
  atualizarCarrinho();
  animarBadgeCarrinho(); // ⭐ CHAMA A ANIMAÇÃO AQUI
}

// ⭐ FUNÇÃO NOVA DE ANIMAÇÃO
function animarBadgeCarrinho(){
  const badge = $('#pdCartBadge');
  if(!badge) return;
  
  // Remove a classe se já estiver a animar (para reiniciar)
  badge.classList.remove('animate');
  
  // Força o navegador a "ver" a remoção antes de adicionar de novo
  void badge.offsetWidth; 
  
  // Adiciona a classe de animação
  badge.classList.add('animate');
  
  // Remove a classe após a animação terminar (400ms)
  setTimeout(() => {
    badge.classList.remove('animate');
  }, 2400);
}

function alterarQtd(id, delta){
  const item = carrinho.find(x => x.id === id);
  if(!item) return;
  item.qtd += delta;
  if(item.qtd <= 0){
    carrinho = carrinho.filter(x => x.id !== id);
  }
  atualizarCarrinho();
}

function atualizarCarrinho(){
  Store.set('frango_carrinho', carrinho);
  
  const totalItens = carrinho.reduce((s, x) => s + x.qtd, 0);
  if($('#pdCartBadge')) $('#pdCartBadge').textContent = totalItens;

  const body = $('#pdCartBody');
  if(body){
    if(carrinho.length === 0){
      body.innerHTML = `<p style="text-align:center;color:#999;padding:30px;">O carrinho está vazio.</p>`;
    } else {
      body.innerHTML = carrinho.map(item => `
        <div class="pd-cart-item">
          <div class="pd-cart-item-icon">${item.icon}</div>
          <div class="pd-cart-item-info">
            <b>${item.nome}</b>
            <small>${item.preco} MT</small>
          </div>
          <div class="pd-cart-item-qty">
            <button onclick="alterarQtd('${item.id}', -1)">−</button>
            <span>${item.qtd}</span>
            <button onclick="alterarQtd('${item.id}', 1)">+</button>
          </div>
        </div>
      `).join('');
    }
  }

  const total = carrinho.reduce((s, x) => s + (x.preco * x.qtd), 0);
  if($('#pdCartTotal')) $('#pdCartTotal').textContent = fmtMT(total);
  
  const btnCheckout = $('#pdCartCheckout');
  if(btnCheckout) btnCheckout.disabled = carrinho.length === 0;
}

// ============================================================
// CONTROLO DE ABRIR E FECHAR O CARRINHO
// ============================================================

// Abre e fecha automaticamente após 1 segundo (usado ao clicar em Adicionar)
function abrirCarrinhoAuto(){
  const drawer = $('#pdCartDrawer');
  const overlay = $('#pdCartOverlay');
  
  if(drawer && overlay){
    drawer.classList.add('open');
    overlay.classList.add('active');
    
    // Cancela qualquer timer anterior para não haver conflito
    clearTimeout(timerFecharCarrinho);
    
    // Fecha após 1 segundo (1000 milissegundos)
    timerFecharCarrinho = setTimeout(() => {
      drawer.classList.remove('open');
      overlay.classList.remove('active');
    }, 1000);
  }
}

// Abre manualmente e mantém aberto (usado ao clicar no ícone do carrinho)
function abrirCarrinhoManual(){
  const drawer = $('#pdCartDrawer');
  const overlay = $('#pdCartOverlay');
  
  if(drawer && overlay){
    // Cancela o fecho automático se estiver ativo
    clearTimeout(timerFecharCarrinho);
    
    drawer.classList.add('open');
    overlay.classList.add('active');
  }
}

// Fecha o carrinho (botão X ou clicar fora)
function fecharCarrinho(){
  const drawer = $('#pdCartDrawer');
  const overlay = $('#pdCartOverlay');
  
  if(drawer && overlay){
    clearTimeout(timerFecharCarrinho);
    drawer.classList.remove('open');
    overlay.classList.remove('active');
  }
}

// Eventos de botões
if($('#pdCartBtn')) $('#pdCartBtn').addEventListener('click', abrirCarrinhoManual);
if($('#pdCartClose')) $('#pdCartClose').addEventListener('click', fecharCarrinho);
if($('#pdCartOverlay')) $('#pdCartOverlay').addEventListener('click', fecharCarrinho);

if($('#pdCartCheckout')) {
  $('#pdCartCheckout').addEventListener('click', () => {
    if(carrinho.length > 0){
      window.location.href = 'checkout.html';
    }
  });
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  atualizarCarrinho();
});