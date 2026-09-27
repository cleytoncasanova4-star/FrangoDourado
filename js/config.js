/* ============================================================
   FRANGO DOURADO — CONFIGURAÇÃO CENTRAL
   ============================================================ */

const CONFIG = {
  marca: {
    corPrincipal: "#FFB800",   // dourado
    corSecundaria: "#E30613",  // vermelho
    corEscura: "#2A1408",      // marrom escuro
    corClara: "#FFD200"        // amarelo claro
  },

  empresa: {
    nome: "Frango Dourado",
    slogan: "O melhor frango de Quelimane",
    tipo: "Restaurante",
    cidade: "Quelimane",
    pais: "Moçambique",
    endereco: "Av. Marginal, Quelimane",
    horario: "Segunda a Domingo — 08h00 às 20h00",
    email: "pedidos@frangodourado.co.mz",
    telefone: "258871632577",
    logo: "assets/images/frango-logo.png"
  },

  whatsapp: "258871632577",

  // ============ LIMITE ============
  limite: {
    ativo: false,
    maxItens: 50,
    mensagem: "Limite de 50 itens por pedido."
  },

  // ============ ENTREGA ============
  entrega: {
    ativa: true,
    gratisAcimaDe: 3000,
    levantamento: 0,
    zonas: [
      { nome: "Centro de Quelimane", valor: 50,  tempo: "até 40 min" },
      { nome: "Arredores",           valor: 30,  tempo: "até 40 min" },
      { nome: "Bairros próximos",    valor: 80,  tempo: "até 1 hora" },
      { nome: "Periferia",           valor: 120, tempo: "até 1 hora" }
    ],
    premium: {
      ativo: false,
      tempo: "até 20 min",
      multiplicador: 1.5
    }
  },

  admin: {
    user: "frango",
    pass: "dourado2025"
  },

  mensagemWhatsApp: "Olá, Frango Dourado! Gostaria de fazer um pedido.",

  supabase: {
    url: "https://sigeclvywhuqwmrhabkw.supabase.co",
    key: "sb_publishable_g_5OUJcLY124VZEAP3-l0g_5nLLr4LT"
  }
};

// ============ MENU ============
const PRODUTOS_PADRAO = [
  // ─── PRATOS ───
  { id: "frango_inteiro",     nome: "Frango Inteiro Grelhado", preco: 500, categoria: "pratos",         icon: "🍗", desc: "Frango inteiro grelhado no carvão", disponivel: true },
  { id: "meio_frango",        nome: "½ Frango Grelhado",       preco: 280, categoria: "pratos",         icon: "🍗", desc: "Meio frango grelhado",             disponivel: true },
  { id: "frango_piri",        nome: "Frango Piri-Piri",        preco: 450, categoria: "pratos",         icon: "🌶️", desc: "Frango picante com molho piri",    disponivel: true },
  { id: "frango_zambeziana",  nome: "Frango à Zambeziana",     preco: 480, categoria: "pratos",         icon: "🥥", desc: "Frango com molho de coco",         disponivel: true },
  { id: "frango_batata",      nome: "Frango com Batata Frita", preco: 380, categoria: "pratos",         icon: "🍟", desc: "Frango + batata frita",            disponivel: true },
  { id: "frango_arroz",       nome: "Frango com Arroz",        preco: 400, categoria: "pratos",         icon: "🍚", desc: "Frango + arroz",                   disponivel: true },

  // ─── ACOMPANHAMENTOS ───
  { id: "batata_frita",       nome: "Batata Frita",            preco: 120, categoria: "acompanhamentos", icon: "🍟", desc: "Porção de batata frita",          disponivel: true },
  { id: "arroz",              nome: "Arroz",                   preco: 80,  categoria: "acompanhamentos", icon: "🍚", desc: "Porção de arroz",                 disponivel: true },
  { id: "salada",             nome: "Salada",                  preco: 100, categoria: "acompanhamentos", icon: "🥗", desc: "Salada fresca",                   disponivel: true },
  { id: "xima",               nome: "Xima",                    preco: 60,  categoria: "acompanhamentos", icon: "🍲", desc: "Xima tradicional",                disponivel: true },

  // ─── REFRIGERANTES ───
  { id: "coca",               nome: "Coca-Cola 330ml",         preco: 60,  categoria: "refrigerantes",  icon: "🥤", desc: "Coca-Cola gelada",                disponivel: true },
  { id: "fanta",              nome: "Fanta Laranja 330ml",     preco: 60,  categoria: "refrigerantes",  icon: "🥤", desc: "Fanta gelada",                    disponivel: true },
  { id: "sprite",             nome: "Sprite 330ml",            preco: 60,  categoria: "refrigerantes",  icon: "🥤", desc: "Sprite gelada",                   disponivel: true },
  { id: "agua",               nome: "Água Mineral 500ml",      preco: 40,  categoria: "refrigerantes",  icon: "💧", desc: "Água mineral",                    disponivel: true },
  { id: "sumo",               nome: "Sumo Natural",            preco: 100, categoria: "refrigerantes",  icon: "🧃", desc: "Sumo natural do dia",             disponivel: true },
  { id: "cerveja",            nome: "Cerveja Laurentina",      preco: 120, categoria: "refrigerantes",  icon: "🍺", desc: "Cerveja gelada",                  disponivel: true }
];

window.CONFIG = CONFIG;
window.PRODUTOS_PADRAO = PRODUTOS_PADRAO;