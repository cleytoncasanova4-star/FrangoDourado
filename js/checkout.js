/* ============================================================
   FRANGO DOURADO — CHECKOUT
   ============================================================ */

const Store = {
  get(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

function getConfig(){ return Store.get('frango_config', CONFIG); }

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmtMT = v => `${Number(v||0)} MT`;

/* ============ SUPABASE ============ */
let supabaseClient = null;
try{
  if(window.supabase && CONFIG.supabase && CONFIG.supabase.url.includes('supabase.co')){
    supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
    console.log('✅ Supabase ligado');
  }
}catch(err){ console.error('❌', err); }

/* ============ ESTADO ============ */
const state = {
  carrinho: [],
  modo: 'entrega',
  zona: null,
  entregador: null,
  nome: '',
  telefone: '',
  observacoes: '',
  codigo: ''
};

function arredondar(v){
  const c = Math.round(v*100)/100;
  const i = Math.floor(c);
  return (c - i) >= 0.5 ? i + 1 : i;
}


  document.addEventListener('DOMContentLoaded', () => {
  // ⭐ LÊ de frango_carrinho
  const raw = localStorage.getItem('frango_carrinho');
  console.log('🔍 RAW:', raw);

  let carrinho = [];
  try{
    carrinho = raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('❌ JSON inválido:', e);
    carrinho = [];
  }

  console.log('✅ Carrinho parseado:', carrinho);

  if(!carrinho || !carrinho.length){
    console.warn('⚠️ Carrinho vazio. A mostrar aviso...');
    alert('Carrinho vazio. Volte ao menu.');
    // ⭐ IMPORTANTE: só redireciona, NÃO volta a chamar nada
    window.location.replace('pedido.html');
    return;
  }

  state.carrinho = carrinho;
  console.log('✅ Carrinho com', state.carrinho.length, 'itens');

  // Renderiza tudo
  renderCarrinho();
  renderModos();
  renderZonas();
  renderEntregadores();
  validarBotao();

  // ============ EVENTOS ============
  $('#pdCartBtn')?.addEventListener('click', abrirCarrinho);
  $('#pdCartClose')?.addEventListener('click', fecharCarrinho);
  $('#pdCartOverlay')?.addEventListener('click', fecharCarrinho);

  document.addEventListener('input', e => {
    if(['pdNomeCliente','pdTelefone','pdObs'].includes(e.target.id)){
      validarBotao();
    }
  });

  $('#pdModalResumoClose')?.addEventListener('click', () => $('#pdModalResumo').classList.remove('active'));
  $('#pdResumoEditar')?.addEventListener('click', () => $('#pdModalResumo').classList.remove('active'));
  $('#pdModalResumo')?.addEventListener('click', e => {
    if(e.target.id === 'pdModalResumo') $('#pdModalResumo').classList.remove('active');
  });

  $('#pdVerResumo')?.addEventListener('click', abrirResumo);
  $('#pdResumoEnviar')?.addEventListener('click', () => {
    $('#pdModalResumo').classList.remove('active');
    $('#pdModalAviso').classList.add('active');
  });

  $('#pdModalAvisoCancelar')?.addEventListener('click', () => $('#pdModalAviso').classList.remove('active'));
  $('#pdModalAvisoOk')?.addEventListener('click', () => {
    $('#pdModalAviso').classList.remove('active');
    enviarWhatsAppFinal();
  });
  $('#pdModalAviso')?.addEventListener('click', e => {
    if(e.target.id === 'pdModalAviso') $('#pdModalAviso').classList.remove('active');
  });
});

/* ============================================================
   CARRINHO
   ============================================================ */
function subtotal(){
  return state.carrinho.reduce((s, x) => s + (x.preco * x.quantidade), 0);
}
function totalItens(){
  return state.carrinho.reduce((s, x) => s + x.quantidade, 0);
}

function renderCarrinho(){
  const badge = $('#pdCartBadge');
  if(badge) badge.textContent = totalItens();

  const body = $('#pdCartBody');
  if(!body) return;

  body.innerHTML = state.carrinho.map(item => `
    <div class="pd-cart-item">
      <div class="pd-cart-item-icon">${item.icon || '🍗'}</div>
      <div class="pd-cart-item-info">
        <b>${item.nome}</b>
        <small>${item.preco} MT × ${item.quantidade} = ${item.preco * item.quantidade} MT</small>
      </div>
    </div>
  `).join('');

  const totalEl = $('#pdCartTotal');
  if(totalEl) totalEl.textContent = fmtMT(subtotal());
}

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

/* ============================================================
   MODO (ENTREGA / RETIRADA)
   ============================================================ */
function renderModos(){
  $$('input[name="pd-modo"]').forEach(r => {
    r.checked = r.value === state.modo;
    r.onchange = () => {
      state.modo = r.value;
      toggleSecoesPorModo();
      validarBotao();
    };
  });
  toggleSecoesPorModo();
}

function toggleSecoesPorModo(){
  const isEntrega = state.modo === 'entrega';
  if($('#pdSectionZona'))        $('#pdSectionZona').hidden = !isEntrega;
  if($('#pdSectionEntregador'))  $('#pdSectionEntregador').hidden = !isEntrega;
}

/* ============================================================
   ZONAS
   ============================================================ */
function renderZonas(){
  const cfg = getConfig();
  const el = $('#pdZonas');
  if(!el) return;

  el.innerHTML = cfg.entrega.zonas.map(z => `
    <div class="pd-option ${state.zona?.id === z.id ? 'selected' : ''}" data-zona="${z.id}">
      <span class="pd-option-icon">📍</span>
      <div class="pd-option-info">
        <b>${z.nome}</b>
        <small>${z.desc || ''} · ${z.tempo || ''}</small>
      </div>
      <span class="pd-option-price">${z.valor} MT</span>
    </div>
  `).join('');

  el.querySelectorAll('[data-zona]').forEach(item => {
    item.addEventListener('click', () => {
      const z = cfg.entrega.zonas.find(x => x.id === item.dataset.zona);
      state.zona = z;
      el.querySelectorAll('.pd-option').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      atualizarAvisoZona();
      validarBotao();
    });
  });
}

function atualizarAvisoZona(){
  const aviso = $('#pdZonaAviso');
  if(!aviso) return;
  if(state.zona){
    aviso.innerHTML = `✅ Zona: <b>${state.zona.nome}</b> — Taxa <b>${state.zona.valor} MT</b>`;
    aviso.classList.add('active');
  } else {
    aviso.innerHTML = '';
    aviso.classList.remove('active');
  }
}

/* ============================================================
   ENTREGADORES
   ============================================================ */
function renderEntregadores(){
  const cfg = getConfig();
  const el = $('#pdEntregadores');
  if(!el) return;

  const entregadores = cfg.entregadores || [];

  if(!entregadores.length){
    el.innerHTML = `<p style="color:#C9B8A8;font-size:13px;text-align:center;padding:20px">Nenhum entregador disponível</p>`;
    return;
  }

  el.innerHTML = entregadores.map(e => `
    <div class="pd-entregador ${state.entregador?.id === e.id ? 'selected' : ''}" data-entregador="${e.id}">
      <div class="pd-entregador-avatar">🧑‍🦱</div>
      <div class="pd-entregador-info">
        <b>${e.nome}</b>
        <small>Entregador · 📱 ${e.telefone || '—'}</small>
      </div>
      <span class="pd-entregador-check">✓</span>
    </div>
  `).join('');

  el.querySelectorAll('[data-entregador]').forEach(item => {
    item.addEventListener('click', () => {
      const ent = entregadores.find(x => x.id === item.dataset.entregador);
      state.entregador = ent;
      el.querySelectorAll('.pd-entregador').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      validarBotao();
    });
  });
}

/* ============================================================
   TAXA
   ============================================================ */
function calcularTaxa(){
  const cfg = getConfig();
  if(state.modo === 'retirada') return cfg.entrega.levantamento || 30;
  if(!state.zona) return 0;
  return state.zona.valor || 0;
}

function total(){
  return arredondar(subtotal() + calcularTaxa());
}

/* ============================================================
   VALIDAÇÃO
   ============================================================ */
function validarBotao(){
  const btn = $('#pdVerResumo');
  if(!btn) return;

  const nome = $('#pdNomeCliente')?.value.trim() || '';
  const telefone = $('#pdTelefone')?.value.trim() || '';

  let ok = true;
  let motivo = 'Preencha os dados';

  if(!nome){ ok = false; motivo = 'Preencha o nome'; }
  else if(!telefone){ ok = false; motivo = 'Preencha o telefone'; }
  else if(telefone.replace(/\D/g,'').length < 9){ ok = false; motivo = 'Telefone inválido'; }
  else if(state.modo === 'entrega' && !state.zona){ ok = false; motivo = '⚠️ Escolha a zona de entrega'; }
  else if(state.modo === 'entrega' && !state.entregador){ ok = false; motivo = '⚠️ Escolha o entregador'; }

  btn.disabled = !ok;
  btn.textContent = ok ? 'VER RESUMO →' : motivo;
}

/* ============================================================
   RESUMO
   ============================================================ */
function abrirResumo(){
  state.nome = $('#pdNomeCliente')?.value.trim() || '';
  state.telefone = $('#pdTelefone')?.value.trim() || '';
  state.observacoes = $('#pdObs')?.value.trim() || '';

  if(!state.nome || !state.telefone) return;

  renderResumo();
  $('#pdModalResumo').classList.add('active');
}

function renderResumo(){
  const sub = subtotal();
  const taxa = calcularTaxa();
  const tot = total();

  const itensHTML = state.carrinho.map(item => `
    <div class="pd-resumo-item">
      <span>${item.icon} ${item.nome} × ${item.quantidade}</span>
      <b>${item.preco * item.quantidade} MT</b>
    </div>
  `).join('');

  let entregaHTML = '';
  if(state.modo === 'entrega'){
    entregaHTML = `
      <div class="pd-resumo-item"><span>Modo</span><b>🛵 Entrega</b></div>
      <div class="pd-resumo-item"><span>Zona</span><b>${state.zona?.nome || '—'}</b></div>
      <div class="pd-resumo-item"><span>Entregador</span><b>🧑‍🦱 ${state.entregador?.nome || '—'}</b></div>
      <div class="pd-resumo-item"><span>Taxa de entrega</span><b>${taxa} MT</b></div>
    `;
  } else {
    entregaHTML = `
      <div class="pd-resumo-item"><span>Modo</span><b>🏪 Retirada no restaurante</b></div>
      <div class="pd-resumo-item"><span>Taxa de serviço</span><b>${taxa} MT</b></div>
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
    <div class="pd-resumo-item"><span>Taxa</span><b>${taxa} MT</b></div>
    <div class="pd-resumo-item total"><span>TOTAL</span><b>${tot} MT</b></div>
  `;
}

/* ============================================================
   ENVIAR WHATSAPP
   ============================================================ */
async function enviarWhatsAppFinal(){
  const cfg = getConfig();
  const sub = subtotal();
  const taxa = calcularTaxa();
  const tot = total();

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
    zona: state.modo === 'entrega' ? (state.zona?.nome || '—') : 'Retirada',
    entregador: state.modo === 'entrega' ? (state.entregador?.nome || '—') : '',
    entregador_telefone: state.modo === 'entrega' ? (state.entregador?.telefone || '') : '',
    endereco: '',
    referencia: '',
    observacoes: state.observacoes,
    taxa: taxa,
    total: tot,
    status: 'PENDENTE'
  };

  if(supabaseClient){
    supabaseClient.from('pedidos_frango').insert([pedido]).then(({ error }) => {
      if(error) console.error('❌', error);
      else console.log('✅ Pedido gravado');
    });
  }

  // ===== WHATSAPP =====
  const linhas = [
    cfg.mensagemWhatsApp || 'Olá, Frango Dourado!',
    '',
    `👤 Cliente: ${state.nome}`,
    `📱 Telefone: ${state.telefone}`,
    '',
    '🍗 ITENS DO PEDIDO:',
    itensTexto,
    '',
    `📦 Modo: ${state.modo === 'entrega' ? 'Entrega' : 'Retirada'}`,
    state.modo === 'entrega' ? `📍 Zona: ${state.zona?.nome}` : '',
    state.modo === 'entrega' ? `🧑‍🦱 Entregador: ${state.entregador?.nome}` : '',
    state.modo === 'entrega' ? `📞 Contacto: ${state.entregador?.telefone || '—'}` : '',
    state.observacoes ? `💬 Obs.: ${state.observacoes}` : '',
    '',
    `Subtotal: ${sub} MT`,
    taxa > 0 ? `Taxa: ${taxa} MT` : '',
    '',
    `💰 TOTAL: ${tot} MT`,
    '',
    'Pedido realizado através do site do Frango Dourado.'
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(linhas)}`, '_blank');

  // ⭐ LIMPAR
  localStorage.removeItem('frango_carrinho');
  state.carrinho = [];

  // Volta ao menu após 2 segundos
  setTimeout(() => {
    window.location.href = 'pedido.html';
  }, 2000);
}