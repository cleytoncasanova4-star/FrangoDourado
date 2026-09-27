/* ============================================================
   FRANGO DOURADO — PEDIDO (com carrinho)
   ============================================================ */

const Store = {
  get(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

function getProdutos(){ return Store.get('frango_produtos', PRODUTOS_PADRAO); }
function getConfig(){ return Store.get('frango_config', CONFIG); }

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmtMT = v => `${Number(v||0)} MT`;

/* Supabase */
let supabaseClient = null;
try{
  if(window.supabase && CONFIG.supabase && CONFIG.supabase.url.includes('supabase.co')){
    supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
    console.log('✅ Supabase ligado');
  }
}catch(err){ console.error('❌', err); }

/* Estado */
const state = {
  carrinho: [],     // [{id, nome, preco, quantidade, icon}]
  modo: 'entrega',
  zona: 0,
  endereco: '',
  referencia: '',
  nome: '',
  telefone: '',
  observacoes: ''
};

function arredondar(v){
  const c = Math.round(v*100)/100;
  const i = Math.floor(c);
  return (c - i) >= 0.5 ? i + 1 : i;
}

/* ============================================================
   RENDERIZA MENU
   ============================================================ */
async function renderMenu(){
  const produtos = getProdutos();

  const porCategoria = cat => produtos.filter(p => p.categoria === cat);
  const renderGrid = cat => porCategoria(cat).map(p => `
    <div class="pd-menu-item ${p.disponivel ? '' : 'unavailable'}" data-id="${p.id}">
      <div class="pd-mi-icon">${p.icon}</div>
      <div class="pd-mi-info">
        <b>${p.nome}</b>
        <small>${p.desc || ''}</small>
        <span class="pd-mi-preco">${p.preco} MT</span>
      </div>
      <button class="pd-mi-btn" data-add="${p.id}" ${p.disponivel ? '' : 'disabled'}>+</button>
    </div>
  `).join('');

  if($('#pdCatPratos'))          $('#pdCatPratos').innerHTML = renderGrid('pratos');
  if($('#pdCatAcompanhamentos')) $('#pdCatAcompanhamentos').innerHTML = renderGrid('acompanhamentos');
  if($('#pdCatRefrigerantes'))   $('#pdCatRefrigerantes').innerHTML = renderGrid('refrigerantes');

  // Liga os botões +
  $$('[data-add]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      adicionarAoCarrinho(btn.dataset.add);
    });
  });
}

/* ============================================================
   CARRINHO
   ============================================================ */
function adicionarAoCarrinho(id){
  const p = getProdutos().find(x => x.id === id);
  if(!p || !p.disponivel) return;

  const item = state.carrinho.find(x => x.id === id);
  if(item){
    item.quantidade++;
  } else {
    state.carrinho.push({ id: p.id, nome: p.nome, preco: p.preco, icon: p.icon, quantidade: 1 });
  }
  atualizarCarrinho();

  // Animação feedback
  const badge = $('#pdCartBadge');
  if(badge){
    badge.style.transform = 'scale(1.4)';
    setTimeout(() => badge.style.transform = 'scale(1)', 200);
  }
}

function removerDoCarrinho(id){
  state.carrinho = state.carrinho.filter(x => x.id !== id);
  atualizarCarrinho();
}

function alterarQuantidade(id, delta){
  const item = state.carrinho.find(x => x.id === id);
  if(!item) return;
  item.quantidade += delta;
  if(item.quantidade <= 0){
    removerDoCarrinho(id);
    return;
  }
  atualizarCarrinho();
}

function totalItens(){
  return state.carrinho.reduce((s, x) => s + x.quantidade, 0);
}

function subtotal(){
  return state.carrinho.reduce((s, x) => s + (x.preco * x.quantidade), 0);
}

function atualizarCarrinho(){
  // Badge
  const total = totalItens();
  const badge = $('#pdCartBadge');
  if(badge) badge.textContent = total;

  // Corpo do carrinho
  const body = $('#pdCartBody');
  if(!body) return;

  if(!state.carrinho.length){
    body.innerHTML = `<p class="pd-cart-empty">🛒 O carrinho está vazio.<br><small style="font-size:12px;opacity:.7">Toque no + dos itens para adicionar</small></p>`;
  } else {
    body.innerHTML = state.carrinho.map(item => `
      <div class="pd-cart-item">
        <div class="pd-cart-item-icon">${item.icon || '🍗'}</div>
        <div class="pd-cart-item-info">
          <b>${item.nome}</b>
          <small>${item.preco} MT × ${item.quantidade} = ${item.preco * item.quantidade} MT</small>
        </div>
        <div class="pd-cart-item-qty">
          <button data-qty-menos="${item.id}">−</button>
          <span>${item.quantidade}</span>
          <button data-qty-mais="${item.id}">+</button>
        </div>
        <button class="pd-cart-item-remove" data-remove="${item.id}">🗑️</button>
      </div>
    `).join('');

    // Eventos
    body.querySelectorAll('[data-qty-mais]').forEach(b => b.addEventListener('click', () => alterarQuantidade(b.dataset.qtyMais, 1)));
    body.querySelectorAll('[data-qty-menos]').forEach(b => b.addEventListener('click', () => alterarQuantidade(b.dataset.qtyMenos, -1)));
    body.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => removerDoCarrinho(b.dataset.remove)));
  }

  // Total
  const subEl = $('#pdCartTotal');
  if(subEl) subEl.textContent = fmtMT(subtotal());

  // Botão checkout
  const checkout = $('#pdCartCheckout');
  if(checkout) checkout.disabled = !state.carrinho.length;

  // Se já estamos na secção de dados, atualiza a validação
  validarBotaoFinal();
}

/* ============================================================
   DRAWER DO CARRINHO
   ============================================================ */
function abrirCarrinho(){
  $('#pdCartDrawer')?.classList.add('open');
  $('#pdCartOverlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function fecharCarrinho(){
  $('#pdCartDrawer')?.classList.remove('open');
  $('#pdCartOverlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

$('#pdCartBtn')?.addEventListener('click', abrirCarrinho);
$('#pdCartClose')?.addEventListener('click', fecharCarrinho);
$('#pdCartOverlay')?.addEventListener('click', fecharCarrinho);

/* ============================================================
   CHECKOUT — vai para secção de entrega + dados
   ============================================================ */
$('#pdCartCheckout')?.addEventListener('click', () => {
  if(!state.carrinho.length) return;
  fecharCarrinho();

  const sec = $('#pdSectionDados');
  sec.hidden = false;

  renderZonas();
  renderModos();

  setTimeout(() => {
    sec.scrollIntoView({behavior:'smooth', block:'start'});
  }, 100);
});

/* ============================================================
   MODOS DE ENTREGA
   ============================================================ */
function renderModos(){
  $$('input[name="pd-modo"]').forEach(r => {
    r.checked = r.value === state.modo;
    r.onchange = () => {
      state.modo = r.value;
      $('#pdEntregaFields').hidden = state.modo !== 'entrega';
      validarBotaoFinal();
    };
  });
  $('#pdEntregaFields').hidden = state.modo !== 'entrega';
}

function renderZonas(){
  const cfg = getConfig();
  const sel = $('#pdZona');
  if(!sel) return;

  sel.innerHTML = cfg.entrega.zonas.map((z,i) =>
    `<option value="${i}">${z.nome} — ${z.valor} MT</option>`
  ).join('');

  state.zona = 0;
  sel.onchange = () => { state.zona = Number(sel.value); };
}

/* ============================================================
   TAXA DE ENTREGA
   ============================================================ */
function calcularTaxa(){
  const cfg = getConfig();
  if(state.modo === 'retirada') return cfg.entrega.levantamento || 0;
  const z = cfg.entrega.zonas[state.zona];
  if(!z) return 0;
  // Frete grátis acima de X
  if(cfg.entrega.gratisAcimaDe && subtotal() >= cfg.entrega.gratisAcimaDe) return 0;
  return z.valor;
}

/* ============================================================
   LOCALIZAÇÃO
   ============================================================ */
$('#pdUseLocation')?.addEventListener('click', () => {
  if(!navigator.geolocation){
    alert('Geolocalização não suportada.');
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    $('#pdEndereco').value = `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`;
    validarBotaoFinal();
  }, () => alert('Não foi possível obter. Escreva manualmente.'));
});

/* ============================================================
   VALIDAÇÃO
   ============================================================ */
function validarBotaoFinal(){
  const btn = $('#pdVerResumo');
  if(!btn) return;

  const nome = $('#pdNomeCliente')?.value.trim() || '';
  const telefone = $('#pdTelefone')?.value.trim() || '';
  const endereco = $('#pdEndereco')?.value.trim() || '';

  let ok = true;
  let motivo = 'Preencha os dados';

  if(!state.carrinho.length){ ok = false; motivo = 'Carrinho vazio'; }
  else if(!nome){ ok = false; motivo = 'Preencha o nome'; }
  else if(!telefone){ ok = false; motivo = 'Preencha o telefone'; }
  else if(telefone.replace(/\D/g,'').length < 9){ ok = false; motivo = 'Telefone inválido'; }
  else if(state.modo === 'entrega' && !endereco){ ok = false; motivo = 'Preencha o endereço'; }

  btn.disabled = !ok;
  btn.textContent = ok ? 'VER RESUMO →' : motivo;
}

document.addEventListener('input', e => {
  if(['pdNomeCliente','pdTelefone','pdEndereco','pdReferencia','pdObs'].includes(e.target.id)){
    validarBotaoFinal();
  }
});

/* ============================================================
   MODAL RESUMO
   ============================================================ */
$('#pdVerResumo')?.addEventListener('click', () => {
  state.endereco = $('#pdEndereco')?.value.trim() || '';
  state.referencia = $('#pdReferencia')?.value.trim() || '';
  state.nome = $('#pdNomeCliente')?.value.trim() || '';
  state.telefone = $('#pdTelefone')?.value.trim() || '';
  state.observacoes = $('#pdObs')?.value.trim() || '';

  if(!state.carrinho.length || !state.nome || !state.telefone) return;

  renderResumo();
  $('#pdModalResumo').classList.add('active');
});

function renderResumo(){
  const cfg = getConfig();
  const sub = subtotal();
  const taxa = calcularTaxa();
  const total = arredondar(sub + taxa);

  const itensHTML = state.carrinho.map(item => `
    <div class="pd-resumo-item">
      <span>${item.icon} ${item.nome} × ${item.quantidade}</span>
      <b>${item.preco * item.quantidade} MT</b>
    </div>
  `).join('');

  let entregaHTML = '';
  if(state.modo === 'retirada'){
    entregaHTML = `
      <div class="pd-resumo-item"><span>Modo</span><b>🏪 Retirar</b></div>
      <div class="pd-resumo-item"><span>Taxa</span><b>—</b></div>
    `;
  } else {
    const zonaNome = cfg.entrega.zonas[state.zona]?.nome || '—';
    entregaHTML = `
      <div class="pd-resumo-item"><span>Modo</span><b>🛵 Entrega</b></div>
      <div class="pd-resumo-item"><span>Zona</span><b>${zonaNome}</b></div>
      <div class="pd-resumo-item"><span>Endereço</span><b>${state.endereco}</b></div>
      ${state.referencia ? `<div class="pd-resumo-item"><span>Referência</span><b>${state.referencia}</b></div>` : ''}
      <div class="pd-resumo-item"><span>Taxa de entrega</span><b>${taxa > 0 ? taxa + ' MT' : 'GRÁTIS 🎉'}</b></div>
    `;
  }

  $('#pdResumoBody').innerHTML = `
    <div class="pd-resumo-titulo">🍗 Itens</div>
    ${itensHTML}

    <div class="pd-resumo-titulo">📦 Entrega</div>
    ${entregaHTML}

    <div class="pd-resumo-titulo">👤 Cliente</div>
    <div class="pd-resumo-item"><span>Nome</span><b>${state.nome}</b></div>
    <div class="pd-resumo-item"><span>Telefone</span><b>${state.telefone}</b></div>
    ${state.observacoes ? `<div class="pd-resumo-item"><span>Obs.</span><b>${state.observacoes}</b></div>` : ''}

    <div style="margin-top:14px;padding-top:12px;border-top:1px dashed rgba(255,255,255,.15)"></div>
    <div class="pd-resumo-item"><span>Subtotal</span><b>${sub} MT</b></div>
    <div class="pd-resumo-item"><span>Taxa de entrega</span><b>${taxa > 0 ? taxa + ' MT' : '—'}</b></div>
    <div class="pd-resumo-item total"><span>TOTAL</span><b>${total} MT</b></div>
  `;
}

/* Fechar modal resumo */
$('#pdModalResumoClose')?.addEventListener('click', () => $('#pdModalResumo').classList.remove('active'));
$('#pdResumoEditar')?.addEventListener('click', () => $('#pdModalResumo').classList.remove('active'));
$('#pdModalResumo')?.addEventListener('click', e => {
  if(e.target.id === 'pdModalResumo') $('#pdModalResumo').classList.remove('active');
});

/* Enviar → abre modal de aviso */
$('#pdResumoEnviar')?.addEventListener('click', () => {
  $('#pdModalResumo').classList.remove('active');
  $('#pdModalAviso').classList.add('active');
});

/* ============================================================
   MODAL AVISO
   ============================================================ */
$('#pdModalAvisoCancelar')?.addEventListener('click', () => $('#pdModalAviso').classList.remove('active'));
$('#pdModalAvisoOk')?.addEventListener('click', () => {
  $('#pdModalAviso').classList.remove('active');
  enviarWhatsAppFinal();
});
$('#pdModalAviso')?.addEventListener('click', e => {
  if(e.target.id === 'pdModalAviso') $('#pdModalAviso').classList.remove('active');
});

/* ============================================================
   ENVIAR DE VERDADE
   ============================================================ */
async function enviarWhatsAppFinal(){
  const cfg = getConfig();
  const sub = subtotal();
  const taxa = calcularTaxa();
  const total = arredondar(sub + taxa);
  const zonaNome = state.modo === 'entrega'
    ? (cfg.entrega.zonas[state.zona]?.nome || '—')
    : 'Retirada';

  // Itens formatados
  const itensTexto = state.carrinho.map(item =>
    `• ${item.quantidade}x ${item.nome} — ${item.preco * item.quantidade} MT`
  ).join('\n');

  const pedido = {
    cliente: state.nome,
    telefone: state.telefone,
    itens: JSON.stringify(state.carrinho),
    itens_texto: itensTexto,
    total_itens: totalItens(),
    subtotal: sub,
    modo: state.modo,
    zona: zonaNome,
    endereco: state.endereco,
    referencia: state.referencia,
    observacoes: state.observacoes,
    taxa: taxa,
    total: total,
    status: 'PENDENTE'
  };

  if(supabaseClient){
    supabaseClient.from('pedidos_frango').insert([pedido]).then(({ error }) => {
      if(error) console.error('❌ Supabase:', error);
      else console.log('✅ Pedido gravado');
    });
  }

  // WhatsApp
  const linhas = [
    cfg.mensagemWhatsApp || 'Olá, Frango Dourado!',
    '',
    `👤 Cliente: ${state.nome}`,
    `📱 Telefone: ${state.telefone}`,
    '',
    '🍗 ITENS DO PEDIDO:',
    itensTexto,
    '',
    `📦 Modo: ${state.modo === 'entrega' ? 'Entrega' : 'Retirar no restaurante'}`,
    state.modo === 'entrega' ? `📍 Zona: ${zonaNome}` : '',
    state.modo === 'entrega' ? `🏠 Endereço: ${state.endereco}` : '',
    state.referencia ? `📌 Referência: ${state.referencia}` : '',
    state.observacoes ? `💬 Obs.: ${state.observacoes}` : '',
    '',
    `Subtotal: ${sub} MT`,
    taxa > 0 ? `Taxa de entrega: ${taxa} MT` : '',
    '',
    `💰 TOTAL: ${total} MT`,
    '',
    '⚠️ Tenho até 40 minutos para receber ou levantar o pedido.',
    '',
    'Pedido realizado através do site do Frango Dourado.'
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(linhas)}`, '_blank');
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  atualizarCarrinho();
  validarBotaoFinal();
});