const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
let carrinho = JSON.parse(localStorage.getItem('frango_carrinho')) || [];

let supabaseClient = null;
try {
  if (window.supabase && CONFIG.supabase) {
    supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
  }
} catch(e) { console.error("Erro Supabase", e); }

let modoAtual = 'entrega';
let zonaSelecionada = null;
let entregadorSelecionado = null;

if(carrinho.length === 0) {
  alert('O seu carrinho está vazio!');
  window.location.href = 'pedido.html';
}

document.addEventListener('DOMContentLoaded', () => {
  renderZonas();
  renderEntregadores();
  validarBotao();
});

function toggleModo() {
  const radios = document.getElementsByName('pd-modo');
  for(let r of radios) { if(r.checked) modoAtual = r.value; }

  const campos = $('#pdFieldsEntrega');
  if(modoAtual === 'retirada') {
    campos.style.display = 'none';
    zonaSelecionada = null;
    entregadorSelecionado = null;
    $$('.pd-option').forEach(el => el.classList.remove('selected'));
    $$('.pd-entregador').forEach(el => el.classList.remove('selected'));
    if($('#entregadorCard')) $('#entregadorCard').classList.remove('active');
  } else {
    campos.style.display = 'block';
  }
  validarBotao();
}

// ZONAS
function renderZonas() {
  const div = $('#pdZonas');
  div.innerHTML = CONFIG.entrega.zonas.map(z => `
    <div class="pd-option" onclick="selecionarZona('${z.id}', this)">
      <span class="pd-option-icon">📍</span>
      <div class="pd-option-info">
        <b>${z.nome}</b>
        <small>${z.tempo} · ${z.desc}</small>
      </div>
      <span class="pd-option-price">${z.valor} MT</span>
    </div>
  `).join('');
}

function selecionarZona(id, el) {
  zonaSelecionada = CONFIG.entrega.zonas.find(z => z.id === id);
  $$('#pdZonas .pd-option').forEach(item => item.classList.remove('selected'));
  el.classList.add('selected');
  validarBotao();
}

// ENTREGADORES
function renderEntregadores() {
  const div = $('#pdEntregadores');
  
  div.innerHTML = CONFIG.entregadores.map(e => {
    const fotoHtml = e.foto 
      ? `<img src="${e.foto}" class="avatar-entregador" onclick="abrirZoom(event, '${e.foto}', '${e.nome}')" onerror="this.outerHTML='<div class=\\'avatar-entregador\\'>${e.nome.charAt(0)}</div>'">`
      : `<div class="avatar-entregador">${e.nome.charAt(0)}</div>`;

    return `
      <div class="pd-entregador" onclick="selecionarEntregador('${e.id}', this)">
        ${fotoHtml}
        <div class="pd-entregador-info">
          <b>${e.nome}</b>
          <small>Toque para escolher</small>
        </div>
      </div>
    `;
  }).join('');

  div.innerHTML += `
    <div class="entregador-info-card" id="entregadorCard">
      <img id="cardFotoEntregador" class="avatar-entregador" src="" onclick="abrirZoomCard()">
      <div class="detalhes">
        <b id="txtEntregadorNome">Nome</b>
        <span id="txtEntregadorTel" style="color: #15803D; font-weight: 700; margin-top: 4px; display: block;">📱 Telefone</span>
      </div>
    </div>
  `;
}

function selecionarEntregador(id, el) {
  entregadorSelecionado = CONFIG.entregadores.find(e => e.id === id);
  $$('#pdEntregadores .pd-entregador').forEach(item => item.classList.remove('selected'));
  el.classList.add('selected');

  const card = $('#entregadorCard');
  const img = $('#cardFotoEntregador');
  
  if(entregadorSelecionado.foto) {
    img.src = entregadorSelecionado.foto;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }

  $('#txtEntregadorNome').textContent = entregadorSelecionado.nome;
  $('#txtEntregadorTel').textContent = `📱 ${entregadorSelecionado.telefone}`;
  
  card.classList.add('active');
  validarBotao();
}

function abrirZoom(event, url, nome) {
  event.stopPropagation();
  const idEntregador = CONFIG.entregadores.find(e => e.nome === nome).id;
  const cardEntregador = event.target.closest('.pd-entregador');
  if (cardEntregador) selecionarEntregador(idEntregador, cardEntregador);

  $('#imgZoomEntregador').src = url;
  $('#nomeZoomEntregador').textContent = nome;
  $('#modalZoomEntregador').classList.add('active');
}
function abrirZoomCard() {
  if(entregadorSelecionado && entregadorSelecionado.foto) {
    $('#imgZoomEntregador').src = entregadorSelecionado.foto;
    $('#nomeZoomEntregador').textContent = entregadorSelecionado.nome;
    $('#modalZoomEntregador').classList.add('active');
  }
}
function fecharZoom() { $('#modalZoomEntregador').classList.remove('active'); }

// VALIDAÇÃO
function validarBotao() {
  const nome = $('#pdNomeCliente').value.trim();
  const tel = $('#pdTelefone').value.trim();
  const btn = $('#pdVerResumo');
  
  let ok = true;
  if(!nome || !tel) ok = false;
  
  if(modoAtual === 'entrega') {
    const endereco = $('#pdEndereco').value.trim();
    const referencia = $('#pdReferencia').value.trim();
    if(!zonaSelecionada || !entregadorSelecionado || !endereco || !referencia) ok = false;
  }
  btn.disabled = !ok;
}

document.addEventListener('input', validarBotao);

// RESUMO E ENVIO
$('#pdVerResumo').addEventListener('click', () => {
  // 1. MATEMÁTICA CORRETA
  const sub = carrinho.reduce((s, x) => s + (x.preco * x.qtd), 0);
  let taxa = 0;
  let infoEntrega = "Retirada no Restaurante";

  if(modoAtual === 'entrega') {
    taxa = (sub >= CONFIG.entrega.gratisAcimaDe) ? 0 : zonaSelecionada.valor;
    infoEntrega = `Entrega (${zonaSelecionada.nome})`;
  } else {
    taxa = CONFIG.entrega.levantamento; // Taxa de 30 MT para retirada
    infoEntrega = "Retirada no Restaurante";
  }

  const total = sub + taxa; // Soma correta

  // 2. MOSTRAR NO RESUMO DO ECRÃ
  let html = carrinho.map(item => `
    <div class="resumo-item"><span>${item.qtd}x ${item.nome}</span><b>${item.preco * item.qtd} MT</b></div>
  `).join('');

  html += `
    <div class="resumo-item" style="margin-top:10px; color:#666;"><span>Modo</span><b>${infoEntrega}</b></div>
    <div class="resumo-item" style="color:#666;"><span>Subtotal</span><b>${sub} MT</b></div>
    <div class="resumo-item" style="color:#666;"><span>Taxa de Entrega/Serviço</span><b>${taxa} MT</b></div>
    <div class="resumo-total"><span>TOTAL</span><b>${total} MT</b></div>
  `;

  if(modoAtual === 'entrega') {
    html += `
      <div style="margin-top:15px; padding:10px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; font-size:13px; color:#166534;">
        <b>Entregador:</b> ${entregadorSelecionado.nome} <br>
        <b>Contacto:</b> ${entregadorSelecionado.telefone}
      </div>
    `;
  }

  $('#pdResumoBody').innerHTML = html;
  $('#pdModalResumo').classList.add('active');

  // 3. ENVIAR PARA O SUPABASE E WHATSAPP
  $('#pdResumoEnviar').onclick = async () => {
    const btn = $('#pdResumoEnviar');
    const textoOriginal = btn.textContent;
    btn.textContent = "A enviar...";
    btn.disabled = true;

    const pedido = {
      cliente: $('#pdNomeCliente').value,
      telefone: $('#pdTelefone').value,
      itens_texto: carrinho.map(i => `${i.qtd}x ${i.nome}`).join(', '),
      subtotal: sub,
      modo: modoAtual,
      zona: modoAtual === 'entrega' ? zonaSelecionada.nome : 'Retirada',
      endereco: modoAtual === 'entrega' ? $('#pdEndereco').value : '',
      referencia: modoAtual === 'entrega' ? $('#pdReferencia').value : '',
      entregador_nome: modoAtual === 'entrega' ? entregadorSelecionado.nome : '',
      entregador_telefone: modoAtual === 'entrega' ? entregadorSelecionado.telefone : '',
      taxa: taxa,
      total: total,
      status: 'PENDENTE'
    };

    // TENTA GRAVAR NO SUPABASE
    if(supabaseClient) {
      const { error } = await supabaseClient.from('pedidos_frango').insert([pedido]);
      if(error) {
        // Se der erro no banco, avisa e PARA aqui (não envia WhatsApp)
        alert("❌ Erro ao gravar no sistema:\n" + error.message + "\n\nVerifique a tabela do Supabase.");
        btn.textContent = textoOriginal;
        btn.disabled = false;
        return; 
      }
    }

    // SE GRAVOU BEM, GERA O WHATSAPP PROFISSIONAL
    let msg = `*NOVO PEDIDO - FRANGO DOURADO*\n`;
    msg += `-----------------------------------\n`;
    msg += `👤 *Cliente:* ${pedido.cliente}\n`;
    msg += `📱 *Telefone:* ${pedido.telefone}\n`;
    msg += `🛵 *Modo:* ${infoEntrega}\n`;
    
    if(modoAtual === 'entrega') {
      msg += `📍 *Endereço:* ${pedido.endereco}\n`;
      msg += `🏠 *Referência:* ${pedido.referencia}\n`;
      msg += `🧑‍🦱 *Entregador:* ${pedido.entregador_nome} (${pedido.entregador_telefone})\n`;
    }
    
    msg += `-----------------------------------\n`;
    msg += `🍔 *ITENS DO PEDIDO:*\n`;
    carrinho.forEach(i => { msg += `• ${i.qtd}x ${i.nome} — ${i.preco * i.qtd} MT\n`; });
    msg += `-----------------------------------\n`;
    msg += `Subtotal: ${sub} MT\n`;
    msg += `Taxa de Serviço: ${taxa} MT\n`;
    msg += `💰 *TOTAL A PAGAR: ${total} MT*\n`;
    
    if($('#pdObs').value) msg += `\n📝 *Observações:* ${$('#pdObs').value}\n`;
    
    window.open(`https://wa.me/${CONFIG.empresa.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    
    // Limpa e volta
    localStorage.removeItem('frango_carrinho');
    window.location.href = 'index.html';
  };
});