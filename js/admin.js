const SESSION_KEY = 'frango_admin_session';
if(localStorage.getItem(SESSION_KEY) !== 'ok'){
  window.location.replace('login.html');
}

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const Store = {
  get(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

/* ============ SUPABASE ============ */
let supabaseClient = null;
try{
  if(window.supabase && CONFIG.supabase && CONFIG.supabase.url.includes('supabase.co')){
    supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
    console.log('✅ Admin ligado ao Supabase');
  }
}catch(err){ console.error('❌', err); }

let filtroAtual = 'todos';

/* ============ CARREGAR PEDIDOS ============ */
async function carregarPedidos(){
  if(!supabaseClient) return;
  try{
    const { data, error } = await supabaseClient
      .from('pedidos_frango')
      .select('*')
      .order('created_at', { ascending: false });

    if(error) throw error;

    const pedidos = (data || []).map(p => ({
      id: 'F' + p.id,
      dbId: p.id,
      data: p.created_at,
      cliente: p.cliente,
      telefone: p.telefone,
      itensTexto: p.itens_texto,
      totalItens: p.itens_texto ? p.itens_texto.split(',').length : 0,
      subtotal: p.subtotal,
      modo: p.modo,
      zona: p.zona,
      endereco: p.endereco,
      entregador: p.entregador,
      taxa: p.taxa,
      total: p.total,
      status: p.status
    }));

    Store.set('frango_pedidos', pedidos);
    return pedidos;
  }catch(err){
    console.error('❌ Erro ao carregar:', err);
    return Store.get('frango_pedidos', []);
  }
}

/* ============ INIT ============ */
document.addEventListener('DOMContentLoaded', async () => {
  const app = $('#adminApp');
  if(app) app.style.visibility = 'visible';

  const d = new Date();
  const dataFmt = d.toLocaleDateString('pt-PT', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const horaFmt = d.toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'});
  if($('#welcomeDate')) $('#welcomeDate').textContent = `${dataFmt} · ${horaFmt}`;

  await carregarPedidos();
  renderTudo();

  setInterval(async () => {
    await carregarPedidos();
    renderPendentes();
    renderTabela();
  }, 30000); // Atualiza a cada 30s
});

/* ============ LOGOUT ============ */
$('#logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace('login.html');
});

/* ============ RENDER ============ */
function renderTudo(){
  renderPendentes();
  renderTabela();
}

function renderPendentes(){
  const pedidos = Store.get('frango_pedidos', []);
  const pendentes = pedidos.filter(p => p.status === 'PENDENTE');

  if($('#pendentesCount')) $('#pendentesCount').textContent = pendentes.length;

  const container = $('#pendentesList');
  if(!container) return;

  if(!pendentes.length){
    container.innerHTML = `<p class="empty">✅ Nenhum pedido pendente.</p>`;
    return;
  }

  container.innerHTML = pendentes.map(p => `
    <div class="receipt pending">
      <div class="receipt-head">
        <span class="receipt-id">#${p.id.slice(-6)}</span>
        <span class="receipt-date">${new Date(p.data).toLocaleString('pt-PT')}</span>
      </div>
      <div class="receipt-body">
        <div class="receipt-row"><span>Cliente</span><b>${p.cliente}</b></div>
        <div class="receipt-row"><span>Telefone</span><b>${p.telefone}</b></div>
        <div class="receipt-row"><span>Modo</span><b>${p.modo === 'entrega' ? '🛵 Entrega ('+p.zona+')' : '🏪 Retirada'}</b></div>
        ${p.modo === 'entrega' ? `<div class="receipt-row"><span>Entregador</span><b>${p.entregador || '—'}</b></div>` : ''}
        <div class="receipt-row"><span>Itens</span><b>${p.itensTexto}</b></div>
        <div class="receipt-row total"><span>TOTAL</span><b>${p.total} MT</b></div>
      </div>
      <div class="receipt-foot">
        <div class="action-buttons">
          <button class="btn-action btn-imprimir-mini" data-imprimir="${p.id}">🖨️ Recibo</button>
          <button class="btn-action btn-entregue" data-entregue="${p.id}">✅ Entregue</button>
        </div>
      </div>
    </div>
  `).join('');

  $$('[data-entregue]').forEach(b => b.addEventListener('click', () => {
    if(!confirm('Marcar como ENTREGUE?')) return;
    atualizarStatus(b.dataset.entregue, 'ENTREGUE');
  }));
  
  $$('[data-imprimir]').forEach(b => b.addEventListener('click', () => imprimirRecibo(b.dataset.imprimir)));
}

function renderTabela(){
  const pedidos = Store.get('frango_pedidos', []);
  let filtrados = pedidos;
  if(filtroAtual !== 'todos') filtrados = pedidos.filter(p => p.status === filtroAtual);

  if($('#totalRegistos')) $('#totalRegistos').textContent = `${filtrados.length} registos`;

  const body = $('#tabelaPedidosBody');
  if(!body) return;

  if(!filtrados.length){
    body.innerHTML = `<tr><td colspan="13" class="empty">Sem registos.</td></tr>`;
    if($('#totalGeral')) $('#totalGeral').textContent = '0 MT';
    return;
  }

  body.innerHTML = filtrados.map((p, i) => {
    const isEntregue = p.status === 'ENTREGUE';
    const badgeClass = isEntregue ? 'badge-entregue' : 'badge-pendente';
    const acoes = isEntregue 
      ? `<div class="acoes-linha"><span class="txt-final">✅ Finalizado</span><button class="btn-mini btn-imprimir-mini" data-imprimir="${p.id}">🖨️</button></div>`
      : `<div class="acoes-linha"><button class="btn-mini btn-entregue-mini" data-entregue="${p.id}">✅</button><button class="btn-mini btn-imprimir-mini" data-imprimir="${p.id}">🖨️</button></div>`;

    return `
      <tr>
        <td>${i + 1}</td>
        <td><b>#${p.id.slice(-6)}</b></td>
        <td>${new Date(p.data).toLocaleDateString('pt-PT')}</td>
        <td>${p.cliente}</td>
        <td>${p.telefone || '—'}</td>
        <td style="max-width:200px;white-space:normal;font-size:11px">${p.itensTexto}</td>
        <td>${p.totalItens}</td>
        <td>${p.modo === 'entrega' ? '🛵 Entrega' : '🏪 Retirada'}</td>
        <td>${p.zona || '—'}</td>
        <td>${p.taxa ? p.taxa + ' MT' : '—'}</td>
        <td><b>${p.total} MT</b></td>
        <td><span class="badge ${badgeClass}">${p.status}</span></td>
        <td>${acoes}</td>
      </tr>
    `;
  }).join('');

  const total = filtrados.reduce((s, p) => s + (p.total || 0), 0);
  if($('#totalGeral')) $('#totalGeral').textContent = `${total} MT`;

  body.querySelectorAll('[data-entregue]').forEach(b => b.addEventListener('click', () => {
    if(!confirm('Marcar como ENTREGUE?')) return;
    atualizarStatus(b.dataset.entregue, 'ENTREGUE');
  }));
  body.querySelectorAll('[data-imprimir]').forEach(b => b.addEventListener('click', () => imprimirRecibo(b.dataset.imprimir)));
}

$$('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroAtual = btn.dataset.filtro;
    renderTabela();
  });
});

/* ============ ATUALIZAR STATUS ============ */
async function atualizarStatus(id, novoStatus){
  const pedidos = Store.get('frango_pedidos', []);
  const p = pedidos.find(x => x.id === id);
  if(!p) return;

  if(supabaseClient && p.dbId){
    try{
      await supabaseClient.from('pedidos_frango').update({ status: novoStatus }).eq('id', p.dbId);
      p.status = novoStatus;
      Store.set('frango_pedidos', pedidos);
    }catch(err){
      console.error('❌', err);
      alert('Erro ao comunicar com o servidor.');
      return;
    }
  }
  renderPendentes();
  renderTabela();
}

/* ============ IMPRIMIR RECIBO ============ */
function imprimirRecibo(id){
  const pedidos = Store.get('frango_pedidos', []);
  const p = pedidos.find(x => x.id === id);
  if(!p){ alert('Pedido não encontrado.'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });

  const x = 8, w = 148 - 16;
  doc.setFillColor(42, 20, 8); doc.rect(0, 0, 148, 26, 'F');
  doc.setFillColor(255, 184, 0); doc.triangle(0, 26, 30, 26, 0, 10, 'F');

  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('FRANGO DOURADO', x, 11);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text('Quelimane · Moçambique', x, 17);
  
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('PEDIDO', 148 - x, 11, { align: 'right' });
  doc.setFontSize(14); doc.setTextColor(255, 210, 0);
  doc.text(`#${p.id.slice(-6)}`, 148 - x, 18, { align: 'right' });

  let y = 34;
  doc.setTextColor(120, 120, 120); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(`Emitido: ${new Date(p.data).toLocaleString('pt-PT')}`, x, y);
  doc.text(`Estado: ${p.status}`, 148 - x, y, { align: 'right' }); y += 8;

  function caixa(titulo, linhas){
    const altura = 7 + linhas.length * 6 + 4;
    doc.setFillColor(255, 250, 245); doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, altura, 1.5, 1.5, 'FD');
    doc.setFillColor(255, 184, 0); doc.rect(x, y, 1.5, altura, 'F');
    doc.setTextColor(42, 20, 8); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(titulo.toUpperCase(), x + 4, y + 5);
    let ly = y + 11; doc.setFontSize(9);
    linhas.forEach(([c, v]) => {
      doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
      doc.text(c, x + 4, ly);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 30);
      doc.text(String(v).substring(0, 42), x + w - 4, ly, { align: 'right' });
      ly += 6;
    });
    y += altura + 3;
  }

  caixa('Cliente', [['Nome', p.cliente], ['Telefone', p.telefone]]);
  caixa('Itens', p.itensTexto.split(',').map(i => ['Item', i.trim()]));

  const lE = [['Modo', p.modo === 'entrega' ? 'Entrega' : 'Retirada']];
  if(p.modo === 'entrega') {
    lE.push(['Zona', p.zona]);
    lE.push(['Entregador', p.entregador]);
  }
  lE.push(['Taxa', p.taxa ? p.taxa + ' MT' : '—']);
  caixa('Entrega', lE);

  y += 2; const tH = 16;
  doc.setFillColor(42, 20, 8); doc.roundedRect(x, y, w, tH, 2, 2, 'F');
  doc.setFillColor(255, 184, 0); doc.rect(x, y, 2, tH, 'F');
  doc.setTextColor(255, 210, 0); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('TOTAL', x + 5, y + 6);
  doc.setFontSize(20); doc.setTextColor(255, 255, 255);
  doc.text(`${p.total} MT`, x + w - 5, y + 11, { align: 'right' });

  doc.save(`Recibo_Frango_${p.id.slice(-6)}.pdf`);
}

/* ============ IMPRIMIR EXTRATO ============ */
$('#imprimirExtrato')?.addEventListener('click', () => {
  const pedidos = Store.get('frango_pedidos', []);
  let filtrados = pedidos;
  if(filtroAtual !== 'todos') filtrados = pedidos.filter(p => p.status === filtroAtual);
  if(!filtrados.length){ alert('Sem pedidos.'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pageW = 297, margin = 10;

  doc.setFillColor(42, 20, 8); doc.rect(0, 0, pageW, 22, 'F');
  doc.setFillColor(255, 184, 0); doc.triangle(0, 22, 35, 22, 0, 8, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('FRANGO DOURADO', margin, 10);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Quelimane · Moçambique', margin, 16);
  
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('EXTRATO DE PEDIDOS', pageW - margin, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`Emitido: ${new Date().toLocaleString('pt-PT')}`, margin, 30);

  const linhas = filtrados.map((p, i) => [
    i + 1, p.id.slice(-6), new Date(p.data).toLocaleDateString('pt-PT'),
    p.cliente, p.telefone || '—', p.itensTexto,
    p.modo === 'entrega' ? 'Entrega' : 'Retirada',
    p.zona || '—',
    p.taxa ? `${p.taxa} MT` : '—',
    `${p.total} MT`,
    p.status
  ]);
  const total = filtrados.reduce((s, p) => s + (p.total || 0), 0);

  doc.autoTable({
    startY: 36,
    head: [['#','ID','Data','Cliente','Telefone','Itens','Modo','Zona','Taxa','Total','Estado']],
    body: linhas,
    foot: [['','','','','','','','','TOTAL:',`${total} MT`,'']],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor:[42,20,8], textColor:[255,255,255], fontStyle:'bold' },
    footStyles: { fillColor:[255,210,0], textColor:[42,20,8], fontStyle:'bold' },
    margin: { left: margin, right: margin }
  });

  doc.save(`Extrato_Frango_${new Date().toISOString().slice(0,10)}.pdf`);
});

/* ============ FECHAR DIA ============ */
document.addEventListener('click', async e => {
  if(e.target.closest('#fecharDia')){
    const pedidos = Store.get('frango_pedidos', []);
    const entregues = pedidos.filter(p => p.status === 'ENTREGUE');
    if(!entregues.length){ alert('Não há entregues.'); return; }
    if(!confirm(`Apagar ${entregues.length} pedidos entregues do histórico?`)) return;
    
    if(supabaseClient){
      for(const p of entregues){
        if(p.dbId) await supabaseClient.from('pedidos_frango').delete().eq('id', p.dbId);
      }
    }
    Store.set('frango_pedidos', pedidos.filter(p => p.status !== 'ENTREGUE'));
    renderPendentes(); renderTabela();
    alert('✅ Dia fechado.');
  }
});