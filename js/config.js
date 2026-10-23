const CONFIG = {
  empresa: {
    nome: "Frango Dourado",
    slogan: "O sabor que bate à porta",
    whatsapp: "258871632577",
    mensagemWhatsApp: "Olá, Frango Dourado! Gostaria de fazer um pedido."
  },
  entrega: {
    gratisAcimaDe: 2000,
    levantamento: 30,
    zonas: [
      { id: "centro", nome: "Centro de Quelimane", valor: 50, tempo: "30-40 min", desc: "Baixa da cidade" },
      { id: "arredores", nome: "Arredores", valor: 30, tempo: "30-40 min", desc: "Zona mais próxima" },
      { id: "bairros", nome: "Bairros Próximos", valor: 80, tempo: "45-60 min", desc: "Bairros residenciais" }
    ]
  },
  entregadores: [
    { 
      id: "ent_1", 
      nome: "Cleyton Casanova",
      telefone: "871632577",
      foto: "assets/images/cleyton.jpg" 
    },
    { 
      id: "ent_2", 
      nome: "Ivota Antonio",
      telefone: "871632577",
      foto: "assets/images/casanova.jpg" 
    }
  ],
  admin: {
    user: "frango",
    pass: "dourado2025"
  },
  // Configuração do Banco de Dados movida para dentro do CONFIG
  supabase: {
    url: "https://sigeclvywhuqwmrhabkw.supabase.co",
    key: "sb_publishable_g_5OUJcLY124VZEAP3-l0g_5nLLr4LT" 
  }
};

const PRODUTOS_PADRAO = [
  // HAMBURGERS
  { id: "h1", cat: "hamburgers", nome: "Hamburger Completo", preco: 250, icon: "🍔", img: "assets/images/hamburguer1.webp", desc: "Carne, queijo, ovo, alface e tomate", disponivel: true },
  { id: "h2", cat: "hamburgers", nome: "Hamburger Duplo", preco: 350, icon: "🍔", img: "assets/images/hamburguer2.jpg", desc: "Dobro de carne e queijo", disponivel: true },
  { id: "h3", cat: "hamburgers", nome: "Hamburger de Frango", preco: 220, icon: "🍔", img: "assets/images/hamburguer4.jpg", desc: "Frango crocante, maionese e alface", disponivel: true },
  
  // FRANGO & WRAPS
  { id: "f1", cat: "frango", nome: "Frango Assado Inteiro", preco: 500, icon: "🍗", img: "assets/images/frango1.jpg", desc: "Frango assado no carvão com piripiri", disponivel: true },
  { id: "f2", cat: "frango", nome: "1/2 Frango Assado", preco: 280, icon: "🍗", img: "assets/images/frango2.jpg", desc: "Meio frango com batata frita", disponivel: true },
  { id: "f3", cat: "frango", nome: "Asa de Coxa", preco: 190, icon: "🍗", img: "assets/images/frango3.jpg", desc: "Porção de asas grelhadas", disponivel: true },
  { id: "w1", cat: "frango", nome: "Wrap de Carne", preco: 180, icon: "🌯", img: "assets/images/comida8.jpg", desc: "Tortilha com carne, queijo e molho", disponivel: true },

  // ACOMPANHAMENTOS (IDs corrigidos e únicos)
  { id: "a1", cat: "acompanhamentos", nome: "Batata Frita Grande", preco: 120, icon: "🍟", img: "assets/images/batatas1.jpg", desc: "Porção grande e crocante", disponivel: true },
  { id: "a2", cat: "acompanhamentos", nome: "Batata Frita Dourada", preco: 150, icon: "🍟", img: "assets/images/batatas2.jpg", desc: "Porção grande e crocante", disponivel: true },
  { id: "a3", cat: "acompanhamentos", nome: "Arroz Frito", preco: 220, icon: "🍚", img: "assets/images/comida8.jpg", desc: "Arroz frito especial da casa", disponivel: true },
  
  // REFRIGERANTES (IDs corrigidos e únicos)
  { id: "r1", cat: "refrigerantes", nome: "Coca-Cola 330ml", preco: 60, icon: "🥤", img: "assets/images/refresco1.jpg", desc: "Bem gelada", disponivel: true },
  { id: "r2", cat: "refrigerantes", nome: "Fanta Laranja 330ml", preco: 60, icon: "🥤", img: "assets/images/refresco2.jpg", desc: "Bem gelada", disponivel: true },
  { id: "r3", cat: "refrigerantes", nome: "Água Mineral 500ml", preco: 40, icon: "💧", img: "assets/images/refresco3.jpg", desc: "Água sem gás", disponivel: true },
  { id: "r4", cat: "refrigerantes", nome: "Laurentina Preta", preco: 50, icon: "🍺", img: "assets/images/vumba.jpg", desc: "Cerveja bem gelada", disponivel: true },
  { id: "r5", cat: "refrigerantes", nome: "Água Vumba 500ml", preco: 50, icon: "💧", img: "assets/images/agua2.jpg", desc: "Água sem gás", disponivel: true }
];

// Força a atualização dos produtos no browser
localStorage.setItem('frango_produtos', JSON.stringify(PRODUTOS_PADRAO));
window.CONFIG = CONFIG;
window.PRODUTOS_PADRAO = PRODUTOS_PADRAO;