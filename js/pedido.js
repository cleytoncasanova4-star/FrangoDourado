const Store = {
  get(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

function getProdutos(){ return Store.get('frango_produtos', PRODUTOS_PADRAO); }
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmtMT = v => `${Number(v||0)} MT`;

let carrinho = Store.get('frango_carrinho', []);
let timerFecharCarrinho = null;

// ============================================================
// RENDERIZAR O MENU
// ============================================================
  function renderMenu(){
  const produtos = getProdutos();

  const renderGrid = cat => produtos.filter(p => p.cat === cat).map(p => {
    // Código limpo, sem tags soltas no ecrã
    const imgHTML = p.img 
      ? `<img src="${p.img}" onclick="processarAdicao('${p.id}')" style="width:100%;height:140px;object-fit:cover;border-radius:12px;margin-bottom:10px;cursor:pointer;">` 
      : `<div onclick="processarAdicao('${p.id}')" style="font-size:50px;margin-bottom:10px;text-align:center;background:#f0f0f0;border-radius:12px;height:140px;display:flex;align-items:center;justify-content:center;cursor:pointer;">${p.icon}</div>`;

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

  // Evento do botão ADICIONAR
  $$('[data-add]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      processarAdicao(btn.dataset.add);
    });
  });
}

// ============================================================
// A FUNÇÃO MESTRA (Verifica se abre ou não o carrinho)
// ============================================================
function processarAdicao(id) {
  // 1. Verifica quantos itens existiam ANTES de adicionar
  const qtdAnterior = carrinho.reduce((s, x) => s + x.qtd, 0);
  
  // 2. Adiciona o item de facto
  adicionarAoCarrinho(id);
  
  // 3. Se o carrinho estava VAZIO (0 itens), abre a gaveta automaticamente
  if(qtdAnterior === 0) {
    abrirCarrinhoAuto();
  }
  // Se já tinha itens, NÃO ABRE NADA. Só a animação do número (que já está no adicionarAoCarrinho) acontece.
}

// ============================================================
// LÓGICA BASE DO CARRINHO
// ============================================================
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
  animarBadgeCarrinho(); // Dá o pulo dourado no número
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

function animarBadgeCarrinho(){
  const badge = $('#pdCartBadge');
  if(!badge) return;
  badge.classList.remove('animate');
  void badge.offsetWidth; 
  badge.classList.add('animate');
  setTimeout(() => { badge.classList.remove('animate'); }, 1000);
}

// ============================================================
// CONTROLO DE ABRIR E FECHAR O CARRINHO
// ============================================================
function abrirCarrinhoAuto(){
  const drawer = $('#pdCartDrawer');
  const overlay = $('#pdCartOverlay');
  if(drawer && overlay){
    drawer.classList.add('open');
    overlay.classList.add('active');
    clearTimeout(timerFecharCarrinho);
    timerFecharCarrinho = setTimeout(() => {
      drawer.classList.remove('open');
      overlay.classList.remove('active');
    }, 1500); 
  }
}

function abrirCarrinhoManual(){
  const drawer = $('#pdCartDrawer');
  const overlay = $('#pdCartOverlay');
  if(drawer && overlay){
    clearTimeout(timerFecharCarrinho);
    drawer.classList.add('open');
    overlay.classList.add('active');
  }
}

function fecharCarrinho(){
  const drawer = $('#pdCartDrawer');
  const overlay = $('#pdCartOverlay');
  if(drawer && overlay){
    clearTimeout(timerFecharCarrinho);
    drawer.classList.remove('open');
    overlay.classList.remove('active');
  }
}

if($('#pdCartBtn')) $('#pdCartBtn').addEventListener('click', abrirCarrinhoManual);
if($('#pdCartClose')) $('#pdCartClose').addEventListener('click', fecharCarrinho);
if($('#pdCartOverlay')) $('#pdCartOverlay').addEventListener('click', fecharCarrinho);

if($('#pdCartCheckout')) {
  $('#pdCartCheckout').addEventListener('click', () => {
    if(carrinho.length > 0) window.location.href = 'checkout.html';
  });
}

// ============================================================
// INIT (Vindo do Index)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  atualizarCarrinho();

  const urlParams = new URLSearchParams(window.location.search);
  const produtoAdd = urlParams.get('add');

  if(produtoAdd) {
    // No caso de vir do Index, a gaveta abre porque a função processarAdicao vai entender que o carrinho estava a 0
    processarAdicao(produtoAdd);
    
    // E garantimos que se fecha após 3 segundos (para ele começar a ver o menu)
    clearTimeout(timerFecharCarrinho);
    timerFecharCarrinho = setTimeout(() => {
      $('#pdCartDrawer').classList.remove('open');
      $('#pdCartOverlay').classList.remove('active');
    }, 3000);

    window.history.replaceState({}, document.title, window.location.pathname);
  }
});