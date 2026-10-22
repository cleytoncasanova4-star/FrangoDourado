const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
let carrinho = JSON.parse(localStorage.getItem('frango_carrinho')) || [];

let modoAtual = 'entrega';
let zonaSelecionada = null;
let entregadorSelecionado = null;

if(carrinho.length === 0) {
  alert('Carrinho vazio!');
  window.location.href = 'pedido.html';
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
  renderZonas();
  renderEntregadores();
  validarBotao();
});

// TOGGLE ENTREGA/RETIRADA
function toggleModo() {
  const radios = document.getElementsByName('pd-modo');
  for(let r of radios) { if(r.checked) modoAtual = r.value; }

  const campos = $('#pdFieldsEntrega');
  if(modoAtual === 'retirada') {
    campos.style.display = 'none';
    zonaSelecionada = null;
    entregadorSelecionado = null;
  } else {
    campos.style.display = 'block';
  }
  validarBotao();
}

// RENDERIZAR ZONAS
function renderZonas() {
  const div = $('#pdZonas');
  div.innerHTML = CONFIG.entrega.zonas.map(z => `
    <div class="pd-option" onclick="selecionarZona('${z.id}')">
      <span class="pd-option-icon">📍</span>
      <div class="pd-option-info">
        <b>${z.nome}</b>
        <small>${z.tempo} · ${z.desc}</small>
      </div>
      <span class="pd-option-price">${z.valor} MT</span>
    </div>
  `).join('');
}

function selecionarZona(id) {
  zonaSelecionada = CONFIG.entrega.zonas.find(z => z.id === id);
  $$('#pdZonas .pd-option').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  validarBotao();
}

// RENDERIZAR ENTREGADORES
function renderEntregadores() {
  const div = $('#pdEntregadores');
  div.innerHTML = CONFIG.entregadores.map(e => `
    <div class="pd-entregador" onclick="selecionarEntregador('${e.id}')">
      <div class="pd-entregador-avatar">🧑‍🦱</div>
      <div class="pd-entregador-info">
        <b>${e.nome}</b>
        <small>Disponível</small>
      </div>
    </div>
  `).join('');
}

function selecionarEntregador(id) {
  entregadorSelecionado = CONFIG.entregadores.find(e => e.id === id);
  $$('#pdEntregadores .pd-entregador').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  validarBotao();
}

// VALIDAÇÃO
function validarBotao() {
  const nome = $('#pdNomeCliente').value.trim();
  const tel = $('#pdTelefone').value.trim();
  const btn = $('#pdVerResumo');
  
  let ok = true;
  if(!nome || !tel) ok = false;
  if(modoAtual === 'entrega') {
    if(!zonaSelecionada || !entregadorSelecionado || !$('#pdEndereco').value.trim()) ok = false;
  }
  
  btn.disabled = !ok;
}

document.addEventListener('input', validarBotao);

// RESUMO E WHATSAPP
$('#pdVerResumo').addEventListener('click', () => {
  const sub = carrinho.reduce((s, x) => s + (x.preco * x.qtd), 0);
  let taxa = 0;
  let infoEntrega = "Retirada no Restaurante";

  if(modoAtual === 'entrega') {
    taxa = (sub >= CONFIG.entrega.gratisAcimaDe) ? 0 : zonaSelecionada.valor;
    infoEntrega = `Entrega (${zonaSelecionada.nome}) - Entregador: ${entregadorSelecionado.nome}`;
  } else {
    taxa = CONFIG.entrega.levantamento;
  }

  const total = sub + taxa;

  let html = carrinho.map(item => `
    <div class="resumo-item"><span>${item.qtd}x ${item.nome}</span><b>${item.preco * item.qtd} MT</b></div>
  `).join('');

  html += `
    <div class="resumo-item" style="margin-top:10px; color:#666;"><span>Modo</span><b>${infoEntrega}</b></div>
    <div class="resumo-item" style="color:#666;"><span>Taxa</span><b>${taxa} MT</b></div>
    <div class="resumo-total"><span>TOTAL</span><b>${total} MT</b></div>
  `;

  $('#pdResumoBody').innerHTML = html;
  $('#pdModalResumo').classList.add('active');

  // Configurar envio do WhatsApp
  $('#pdResumoEnviar').onclick = () => {
    let msg = `*NOVO PEDIDO - FRANGO DOURADO*\n\n`;
    msg += `*Cliente:* ${$('#pdNomeCliente').value}\n`;
    msg += `*Telefone:* ${$('#pdTelefone').value}\n\n`;
    msg += `*ITENS:*\n`;
    carrinho.forEach(i => { msg += `- ${i.qtd}x ${i.nome} (${i.preco * i.qtd} MT)\n`; });
    msg += `\n*Modo:* ${infoEntrega}\n`;
    if(modoAtual === 'entrega') msg += `*Endereço:* ${$('#pdEndereco').value}\n`;
    msg += `*Taxa:* ${taxa} MT\n`;
    msg += `*TOTAL:* ${total} MT\n`;
    
    window.open(`https://wa.me/${CONFIG.empresa.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    localStorage.removeItem('frango_carrinho');
  };
});