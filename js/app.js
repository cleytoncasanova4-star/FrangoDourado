document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('menuDestaque');
  
  // ⚠️ AQUI ESTÁ A MÁGICA: Filtra a lista para não mostrar refrigerantes
  const produtosDestaque = PRODUTOS_PADRAO.filter(prod => prod.cat !== 'refrigerantes');

  grid.innerHTML = produtosDestaque.map(prod => {
    const imgHTML = prod.img 
      ? `<img src="${prod.img}" class="menu-card-img" alt="${prod.nome}" onerror="this.outerHTML='<div class=\\'menu-card-img\\'>${prod.icon}</div>'">` 
      : `<div class="menu-card-img">${prod.icon}</div>`;

    return `
      <div class="menu-card">
        ${imgHTML}
        <div class="menu-card-info">
          <h3>${prod.nome}</h3>
          <p>${prod.desc}</p>
          <div class="menu-card-footer">
            <span class="menu-card-price">${prod.preco} MT</span>
            <button class="menu-card-btn" onclick="window.location.href='pedido.html'">Pedir</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Lógica do Lightbox (Zoom)
  const imagens = document.querySelectorAll('.menu-card-img');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  imagens.forEach(img => {
    img.addEventListener('click', () => {
      if(img.tagName === 'IMG') {
        lightboxImg.src = img.src;
        lightbox.classList.add('active');
      }
    });
  });

  if(lightboxClose) lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
  if(lightbox) lightbox.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') lightbox.classList.remove('active');
  });
});