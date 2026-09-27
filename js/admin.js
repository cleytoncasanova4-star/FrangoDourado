/* ============================================================
   FRANGO DOURADO — ADMIN
   ============================================================ */

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

function ensureData(){
  if(!localStorage.getItem('frango_config'))   Store.set('frango_config', CONFIG);
  if(!localStorage.getItem('frango_produtos')) Store.set('frango_produtos', PRODUTOS_PADRAO);
  if(!localStorage.getItem('frango_pedidos'))  Store.set('frango_pedidos', []);
}
ensureData();

let supabaseClient = null;
try{
  if(window.supabase && CONFIG.supabase && CONFIG.supabase.url.includes('supabase.co')){
    supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
    console.log('✅ Admin ligado ao Supabase');
  }
}catch(err){ console.error('❌', err); }

let filtroAtual = 'todos';

/* ============================================================
   CARREGAR DO SUPABASE
   ============================================================ */
async function carregarProdutos(){
  if(!supabaseClient) return;
  try{
    const { data, error } = await supabaseClient.from('frango_produtos_config').select('*').order('id');
    if(error) throw error;
    const produtos = (data || []).map(p => ({
      id: p.id, nome: p.nome, preco: Number(p.preco), categoria: p.categoria,
      icon: p.icon, desc: p.descricao, disponivel: p.disponivel
    }));
    Store.set('frango_produtos', produtos);
  }catch(err){ console.error('❌ Erro produtos:', err); }
}

async function carregarPedidos(){
  if(!supabaseClient) return;
  try{
    const { data, error } = await supabaseClient.from('pedidos_frango').select('*').order('created_at', { ascending: false });
    if(error) throw error;
    const pedidos = (data || []).map(p => ({
      id: 'F' + p.id, dbId: p.id, data: p.created_at,
      cliente: p.cliente, telefone: p.telefone,
      itensTexto: p.itens_texto, totalItens: p.total_itens,
      subtotal: p.subtotal, modo: p.modo, zona: p.zona,
      endereco: p.endereco, referencia: p.referencia, observacoes: p.observacoes,
      entrega: p.taxa, total: p.total, status: p.status
    }));
    Store.set('frango_pedidos', pedidos);
    return pedidos;
  }catch(err){ console.error('❌', err); return Store.get('frango_pedidos', []); }
}

/* INIT */
document.addEventListener('DOMContentLoaded', async () => {
  const app = $('#adminApp');
  if(app) app.style.visibility = 'visible';

  const d = new Date();
  if($('#welcomeDate')){
    $('#welcomeDate').textContent = d.toLocaleDateString('pt-PT', {weekday:'long', day:'numeric', month:'long'}) + ' · ' + d.toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'});
  }

  await carregarProdutos();
  await carregarPedidos();
  renderTudo();

  setInterval(async () => {
    await carregarPedidos();
    renderPendentes();
    renderTabela();
  }, 30000);
});

$('#logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace('login.html');
});

/* RENDER */
function renderTudo(){
  renderSwitches();
  renderPendentes();
  renderTabela();
}

/* SWITCHES PRODUTOS */
function renderSwitches(){
  const lista = Store.get('frango_produtos', PRODUTOS_PADRAO);
  const el = $('#switchList');
  if(!el) return;

  el.innerHTML = lista.map(p => `
    <div class="switch-row">
      <div class="switch-info">
        <span class="sw-icon">${p.icon || '🍗'}</span>
        <div>
          <b>${p.nome}</b>
          <small>${p.disponivel ? '🟢 Disponível' : '⚪ Indisponível'} · ${p.preco} MT</small>
        </div>
      </div>
      <label class="switch">
        <input type="checkbox" data-id="${p.id}" ${p.disponivel ? 'checked' : ''}/>
        <span class="slider"></span>
      </label>
    </div>
  `).join('');

  $$('[data-id]').forEach(chk => {
    chk.addEventListener('change', async () => {
      const novo = chk.checked;
      if(supabaseClient){
        const { error } = await supabaseClient.from('frango_produtos_config').update({ disponivel: novo }).eq('id', chk.dataset.id);
        if(error){ alert('Erro.'); chk.checked = !novo; return; }
      }
      const lista = Store.get('frango_produtos', PRODUTOS_PADRAO);
      const p = lista.find(x => x.id === chk.dataset.id);
      if(p){ p.disponivel = novo; Store.set('frango_produtos', lista); }
      renderSwitches();
    });
  });
}

/* PENDENTES */
function renderPendentes(){
  const pedidos = Store.get('frango_pedidos', []);
  const pendentes = pedidos.filter(p => p.status === 'PENDENTE');
  $('#pendentesCount').textContent = pendentes.length;

  const container = $('#pendentesList');
  if(!container) return;

  if(!pendentes.length){
    container.innerHTML = `<p class="empty">✅ Nenhum pedido pendente.</p>`;
    return;
  }

  container.innerHTML = pendentes.map(p => {
    const itens = p.itensTexto ? p.itensTexto.split('\n').map(l => `<div class="receipt-row"><span>•</span><b>${l.replace('• ', '')}</b></div>`).join('') : '';
    return `
      <div class="receipt pending">
        <div class="receipt-head">
          <span class="receipt-id">${p.id.slice(-6)}</span>
          <span class="receipt-date">${new Date(p.data).toLocaleString('pt-PT')}</span>
        </div>
        <div class="receipt-body">
          <div class="receipt-row"><span>Cliente</span><b>${p.cliente}</b></div>
          <div class="receipt-row"><span>Telefone</span><b>${p.telefone}</b></div>
          <div class="receipt-row"><span>Modo</span><b>${p.modo === 'entrega' ? '🛵 Entrega — ' + (p.zona || '—') : '🏪 Retirada'}</b></div>
          ${p.modo === 'entrega' ? `<div class="receipt-row"><span>Local</span><b>${p.endereco || '—'}</b></div>` : ''}
          ${p.observacoes ? `<div class="receipt-row"><span>Obs.</span><b>${p.observacoes}</b></div>` : ''}
        </div>
        <div style="padding:12px 16px;border-top:1px dashed rgba(255,255,255,.06);background:rgba(0,0,0,.2)">
          <div style="font-size:11px;letter-spacing:1px;color:var(--dourado);font-weight:800;margin-bottom:6px">🍗 ITENS (${p.totalItens || 0})</div>
          ${itens}
          <div class="receipt-row"><span>Taxa</span><b>${p.entrega ? p.entrega + ' MT' : '—'}</b></div>
          <div class="receipt-row total"><span>TOTAL</span><b>${p.total} MT</b></div>
        </div>
        <div class="receipt-foot">
          <div class="action-buttons">
            <button class="btn-action btn-imprimir-mini" data-imprimir="${p.id}">🖨️ Recibo</button>
            <button class="btn-action btn-entregue" data-entregue="${p.id}">✅ Entregue</button>
            <button class="btn-action btn-cancelar" data-cancelar="${p.id}">❌ Cancelado</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  $$('[data-entregue]').forEach(b => b.addEventListener('click', () => {
    if(!confirm('Marcar como ENTREGUE?')) return;
    atualizarStatus(b.dataset.entregue, 'ENTREGUE');
  }));
  $$('[data-cancelar]').forEach(b => b.addEventListener('click', () => {
    if(!confirm('Cancelar este pedido?')) return;
    atualizarStatus(b.dataset.cancelar, 'CANCELADO');
  }));
  $$('[data-imprimir]').forEach(b => b.addEventListener('click', () => imprimirRecibo(b.dataset.imprimir)));
}

/* TABELA */
function renderTabela(){
  const pedidos = Store.get('frango_pedidos', []);
  let filtrados = pedidos;
  if(filtroAtual !== 'todos') filtrados = pedidos.filter(p => p.status === filtroAtual);

  $('#totalRegistos').textContent = `${filtrados.length} registos`;

  const body = $('#tabelaPedidosBody');
  if(!body) return;

  if(!filtrados.length){
    body.innerHTML = `<tr><td colspan="13" class="empty">Sem registos.</td></tr>`;
    $('#totalGeral').textContent = '0 MT';
    return;
  }

  body.innerHTML = filtrados.map((p, i) => {
    const isEntregue = p.status === 'ENTREGUE';
    const isCancelado = p.status === 'CANCELADO';
    const isPendente = !isEntregue && !isCancelado;
    const badgeClass = isEntregue ? 'badge-entregue' : isCancelado ? 'badge-cancelado' : 'badge-pendente';

    const acoes = isPendente
      ? `<div class="acoes-linha">
          <button class="btn-mini btn-entregue-mini" data-entregue="${p.id}">✅</button>
          <button class="btn-mini btn-cancelar-mini" data-cancelar="${p.id}">❌</button>
          <button class="btn-mini btn-imprimir-mini" data-imprimir="${p.id}">🖨️</button>
        </div>`
      : `<div class="acoes-linha">
          <span class="txt-final">${isEntregue ? '✅ Finalizado' : '❌ Cancelado'}</span>
          <button class="btn-mini btn-imprimir-mini" data-imprimir="${p.id}">🖨️</button>
        </div>`;

    return `
      <tr>
        <td>${i + 1}</td>
        <td><b>${p.id.slice(-6)}</b></td>
        <td>${new Date(p.data).toLocaleDateString('pt-PT')}</td>
        <td>${p.cliente}</td>
        <td>${p.telefone || '—'}</td>
        <td style="max-width:220px;white-space:normal;font-size:11px">${(p.itensTexto || '').replace(/\n/g, ' · ')}</td>
        <td>${p.totalItens || 0}</td>
        <td>${p.modo === 'entrega' ? '🛵 Entrega' : '🏪 Retirada'}</td>
        <td>${p.zona || '—'}</td>
        <td>${p.entrega ? p.entrega + ' MT' : '—'}</td>
        <td><b>${p.total} MT</b></td>
        <td><span class="badge ${badgeClass}">${p.status}</span></td>
        <td>${acoes}</td>
      </tr>
    `;
  }).join('');

  const total = filtrados.reduce((s, p) => s + (p.total || 0), 0);
  $('#totalGeral').textContent = `${total} MT`;

  body.querySelectorAll('[data-entregue]').forEach(b => b.addEventListener('click', () => {
    if(!confirm('Marcar como ENTREGUE?')) return;
    atualizarStatus(b.dataset.entregue, 'ENTREGUE');
  }));
  body.querySelectorAll('[data-cancelar]').forEach(b => b.addEventListener('click', () => {
    if(!confirm('Cancelar?')) return;
    atualizarStatus(b.dataset.cancelar, 'CANCELADO');
  }));
  body.querySelectorAll('[data-imprimir]').forEach(b => b.addEventListener('click', () => imprimirRecibo(b.dataset.imprimir)));
}

/* FILTROS */
$$('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroAtual = btn.dataset.filtro;
    renderTabela();
  });
});

/* ATUALIZAR STATUS */
async function atualizarStatus(id, novoStatus){
  const pedidos = Store.get('frango_pedidos', []);
  const p = pedidos.find(x => x.id === id);
  if(!p) return;

  if(supabaseClient && p.dbId){
    try{
      if(novoStatus === 'CANCELADO'){
        await supabaseClient.from('pedidos_frango').delete().eq('id', p.dbId);
        Store.set('frango_pedidos', pedidos.filter(x => x.id !== id));
      } else {
        await supabaseClient.from('pedidos_frango').update({ status: novoStatus }).eq('id', p.dbId);
        p.status = novoStatus;
        Store.set('frango_pedidos', pedidos);
      }
    }catch(err){ console.error('❌', err); alert('Erro.'); return; }
  } else {
    if(novoStatus === 'CANCELADO'){
      Store.set('frango_pedidos', pedidos.filter(x => x.id !== id));
    } else {
      p.status = novoStatus;
      Store.set('frango_pedidos', pedidos);
    }
  }

  renderPendentes();
  renderTabela();
}

/* RECARREGAR */
$('#resetBtn')?.addEventListener('click', () => {
  if(!confirm('Recarregar?')) return;
  localStorage.removeItem('frango_config');
  localStorage.removeItem('frango_produtos');
  Store.set('frango_config', CONFIG);
  Store.set('frango_produtos', PRODUTOS_PADRAO);
  location.reload();
});

/* RECIBO PDF */
function imprimirRecibo(id){
  const pedidos = Store.get('frango_pedidos', []);
  const p = pedidos.find(x => x.id === id);
  if(!p){ alert('Pedido não encontrado.'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });

  const x = 8, w = 148 - 16;
  doc.setFillColor(42, 20, 8);
  doc.rect(0, 0, 148, 26, 'F');
  doc.setFillColor(255, 184, 0);
  doc.triangle(0, 26, 30, 26, 0, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FRANGO DOURADO', x, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Quelimane · Moçambique', x, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PEDIDO', 148 - x, 11, { align: 'right' });
  doc.setFontSize(14);
  doc.setTextColor(255, 210, 0);
  doc.text(`#${p.id.slice(-6)}`, 148 - x, 18, { align: 'right' });

  let y = 34;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text(`Emitido: ${new Date(p.data).toLocaleString('pt-PT')}`, x, y);
  doc.text(`Estado: ${p.status}`, 148 - x, y, { align: 'right' });
  y += 8;

  function caixa(titulo, linhas){
    const altura = 7 + linhas.length * 6 + 4;
    doc.setFillColor(255, 250, 245);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(x, y, w, altura, 1.5, 1.5, 'FD');
    doc.setFillColor(255, 184, 0);
    doc.rect(x, y, 1.5, altura, 'F');
    doc.setTextColor(42, 20, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(titulo.toUpperCase(), x + 4, y + 5);
    let ly = y + 11;
    doc.setFontSize(9);
    linhas.forEach(([c, v]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(c, x + 4, ly);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 30);
      doc.text(String(v).substring(0, 42), x + w - 4, ly, { align: 'right' });
      ly += 6;
    });
    y += altura + 3;
  }

  caixa('Cliente', [['Nome', p.cliente], ['Telefone', p.telefone]]);

  const itens = (p.itensTexto || '').split('\n').map(l => {
    const partes = l.replace('• ', '').split(' — ');
    return [partes[0] || '', partes[1] || ''];
  });
  caixa('Itens', itens);

  const linhasEnt = [['Modo', p.modo === 'entrega' ? 'Entrega' : 'Retirada']];
  if(p.modo === 'entrega'){
    linhasEnt.push(['Zona', p.zona || '—']);
    linhasEnt.push(['Endereço', p.endereco || '—']);
    if(p.referencia) linhasEnt.push(['Referência', p.referencia]);
  }
  linhasEnt.push(['Taxa', p.entrega ? p.entrega + ' MT' : '—']);
  caixa('Entrega', linhasEnt);

  y += 2;
  doc.setFillColor(42, 20, 8);
  doc.roundedRect(x, y, w, 16, 2, 2, 'F');
  doc.setFillColor(255, 184, 0);
  doc.rect(x, y, 2, 16, 'F');
  doc.setTextColor(255, 210, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL', x + 5, y + 6);
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(`${p.total} MT`, x + w - 5, y + 11, { align: 'right' });

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Frango Dourado · Documento gerado automaticamente', 74, 200, { align: 'center' });

  doc.save(`Recibo_Frango_${p.id.slice(-6)}.pdf`);
}

/* EXTRATO */
$('#imprimirExtrato')?.addEventListener('click', () => {
  const pedidos = Store.get('frango_pedidos', []);
  let filtrados = pedidos;
  if(filtroAtual !== 'todos') filtrados = pedidos.filter(p => p.status === filtroAtual);
  if(!filtrados.length){ alert('Sem pedidos.'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pageW = 297, margin = 10;

  doc.setFillColor(42, 20, 8);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setFillColor(255, 184, 0);
  doc.triangle(0, 22, 35, 22, 0, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FRANGO DOURADO', margin, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Quelimane · Moçambique', margin, 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('EXTRATO DE PEDIDOS', pageW - margin, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Emitido: ${new Date().toLocaleString('pt-PT')}`, margin, 30);

  const linhas = filtrados.map((p, i) => [
    i + 1, p.id.slice(-6), new Date(p.data).toLocaleDateString('pt-PT'),
    p.cliente, p.telefone || '—',
    (p.itensTexto || '').replace(/\n/g, ' · ').substring(0, 60),
    p.totalItens || 0,
    p.modo === 'entrega' ? 'Entrega' : 'Retirada',
    p.zona || '—',
    p.entrega ? `${p.entrega} MT` : '—',
    `${p.total} MT`,
    p.status
  ]);
  const total = filtrados.reduce((s, p) => s + (p.total || 0), 0);

  doc.autoTable({
    startY: 36,
    head: [['#','ID','Data','Cliente','Telefone','Itens','Qtd','Modo','Zona','Taxa','Total','Estado']],
    body: linhas,
    foot: [['','','','','','','','','','TOTAL:',`${total} MT`,'']],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor:[42,20,8], textColor:[255,255,255], fontStyle:'bold', halign:'center' },
    footStyles: { fillColor:[255,210,0], textColor:[42,20,8], fontStyle:'bold' },
    alternateRowStyles: { fillColor:[255,250,245] },
    margin: { left: margin, right: margin }
  });

  doc.save(`Extrato_Frango_${new Date().toISOString().slice(0,10)}.pdf`);
});

/* RECIBOS MINI */
$('#imprimirMini')?.addEventListener('click', () => {
  const pedidos = Store.get('frango_pedidos', []);
  let filtrados = pedidos;
  if(filtroAtual !== 'todos') filtrados = pedidos.filter(p => p.status === filtroAtual);
  if(!filtrados.length){ alert('Sem pedidos.'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const cols = 4, rows = 5, porPagina = cols * rows;
  const mX = 6, mY = 6, gX = 2, gY = 2;
  const cW = (210 - mX*2 - gX*(cols-1)) / cols;
  const cH = (297 - mY*2 - gY*(rows-1)) / rows;

  filtrados.forEach((p, i) => {
    const pos = i % porPagina;
    const col = pos % cols;
    const row = Math.floor(pos / cols);
    const x = mX + col * (cW + gX);
    const y = mY + row * (cH + gY);
    if(i > 0 && pos === 0) doc.addPage();

    // Cartão mini
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.setLineDash([1, 1], 0);
    doc.roundedRect(x, y, cW, cH, 1, 1, 'S');
    doc.setLineDash([], 0);

    doc.setFillColor(42, 20, 8);
    doc.rect(x, y, cW, 7, 'F');
    doc.setFillColor(255, 184, 0);
    doc.rect(x, y, 2, 7, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('FRANGO DOURADO', x + 3, y + 4.5);
    doc.setFontSize(5);
    doc.setTextColor(255, 210, 0);
    doc.text(`#${p.id.slice(-6)}`, x + cW - 1.5, y + 4.5, { align: 'right' });

    let cy = y + 10;
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text((p.cliente || '—').substring(0, 24), x + 2, cy);
    cy += 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text(p.telefone || '—', x + 2, cy);
    cy += 4;

    // Itens (compacto)
    doc.setFontSize(5);
    const linhasItens = (p.itensTexto || '').split('\n').slice(0, 5);
    linhasItens.forEach(l => {
      doc.setTextColor(40, 40, 40);
      doc.text(l.replace('• ', '').substring(0, 40), x + 2, cy);
      cy += 2.6;
    });
    if((p.itensTexto || '').split('\n').length > 5){
      doc.setTextColor(120, 120, 120);
      doc.text(`+ ${(p.itensTexto || '').split('\n').length - 5} mais`, x + 2, cy);
    }

    // Total no fundo
    const totalY = y + cH - 8;
    doc.setFillColor(42, 20, 8);
    doc.rect(x, totalY, cW, 8, 'F');
    doc.setFillColor(255, 184, 0);
    doc.rect(x, totalY, 2, 8, 'F');

    doc.setTextColor(255, 210, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text('TOTAL', x + 3, totalY + 3);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`${p.total} MT`, x + cW - 2, totalY + 5.5, { align: 'right' });
  });

  doc.save(`Recibos_Frango_${filtrados.length}.pdf`);
});

/* FECHAR DIA / APAGAR */
document.addEventListener('click', async e => {
  if(e.target.closest('#fecharDia')){
    const pedidos = Store.get('frango_pedidos', []);
    const entregues = pedidos.filter(p => p.status === 'ENTREGUE');
    if(!entregues.length){ alert('Sem entregues.'); return; }
    if(!confirm(`Apagar ${entregues.length} entregues?`)) return;
    if(supabaseClient){
      for(const p of entregues){
        if(p.dbId) await supabaseClient.from('pedidos_frango').delete().eq('id', p.dbId);
      }
    }
    Store.set('frango_pedidos', pedidos.filter(p => p.status !== 'ENTREGUE'));
    renderPendentes(); renderTabela();
  }
});
document.addEventListener('click', async e => {
  if(e.target.closest('#apagarTudo')){
    if(!confirm('⚠️ Apagar TODOS os pedidos?')) return;
    if(supabaseClient) await supabaseClient.from('pedidos_frango').delete().neq('id', 0);
    Store.set('frango_pedidos', []);
    renderPendentes(); renderTabela();
  }
});