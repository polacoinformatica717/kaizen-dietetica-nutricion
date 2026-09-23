window.KAIZEN_CATEGORIES = [
  { name: "Frutos secos", image: "frutos-secos.jpeg" },
  { name: "Semillas y mixes", image: "semillas.jpeg" },
  { name: "Harinas", image: "harinas.jpeg" },
  { name: "Sin TACC", image: "sin-gluten.jpeg" },
  { name: "Infusiones y especias", image: "especias.jpeg" },
  { name: "Suplementos", image: "suplementos.jpeg" }
];

window.KAIZEN_PRODUCTS = [
  { id: 1, article: "FS-001", name: "Mix energía", description: "Almendras, nueces, castañas y pasas.", category: "Frutos secos", price: 7800, unit: "500 g", featured: true },
  { id: 2, article: "FS-002", name: "Nueces mariposa", description: "Croccantes, enteras y seleccionadas.", category: "Frutos secos", price: 8900, unit: "250 g" },
  { id: 3, article: "FS-003", name: "Almendras tostadas", description: "Un snack simple, sabroso y nutritivo.", category: "Frutos secos", price: 8200, unit: "250 g" },
  { id: 4, article: "SM-001", name: "Semillas de chía", description: "Para sumar fibra a desayunos y preparaciones.", category: "Semillas y mixes", price: 4100, unit: "250 g", featured: true },
  { id: 5, article: "SM-002", name: "Semillas de lino", description: "Ideales para panes, yogures y desayunos.", category: "Semillas y mixes", price: 3600, unit: "250 g" },
  { id: 6, article: "SM-003", name: "Mix de semillas", description: "Sésamo, chía, lino y girasol.", category: "Semillas y mixes", price: 4400, unit: "250 g" },
  { id: 7, article: "HA-001", name: "Harina de almendras", description: "Molienda fina para recetas dulces y saladas.", category: "Harinas", price: 6900, unit: "500 g", featured: true },
  { id: 8, article: "HA-002", name: "Harina de avena", description: "Práctica para pancakes, panes y licuados.", category: "Harinas", price: 3100, unit: "500 g" },
  { id: 9, article: "HA-003", name: "Premezcla integral", description: "Una base versátil para preparaciones caseras.", category: "Harinas", price: 5200, unit: "500 g" },
  { id: 10, article: "ST-001", name: "Pan de semillas sin TACC", description: "Alternativa práctica y apta sin gluten.", category: "Sin TACC", price: 5400, unit: "400 g" },
  { id: 11, article: "ST-002", name: "Galletitas sin TACC", description: "Crocantes para acompañar todos los momentos.", category: "Sin TACC", price: 3900, unit: "180 g" },
  { id: 12, article: "ST-003", name: "Prepizza sin gluten", description: "Lista para crear tu pizza favorita.", category: "Sin TACC", price: 4300, unit: "2 u." },
  { id: 13, article: "IE-001", name: "Blend de hierbas", description: "Infusión suave de hierbas y flores.", category: "Infusiones y especias", price: 3500, unit: "100 g" },
  { id: 14, article: "IE-002", name: "Cúrcuma molida", description: "Aroma cálido para sumar a tus platos.", category: "Infusiones y especias", price: 2800, unit: "100 g" },
  { id: 15, article: "IE-003", name: "Mix chimichurri", description: "Condimento clásico, fresco y aromático.", category: "Infusiones y especias", price: 2600, unit: "100 g" },
  { id: 16, article: "SU-001", name: "Magnesio + B6", description: "Suplemento para acompañar tu rutina.", category: "Suplementos", price: 14500, unit: "60 cáps." },
  { id: 17, article: "SU-002", name: "Omega 3", description: "Complemento para el bienestar diario.", category: "Suplementos", price: 17000, unit: "60 cáps." },
  { id: 18, article: "SU-003", name: "Proteína vegetal", description: "Para sumar a licuados y preparaciones.", category: "Suplementos", price: 19000, unit: "500 g" }
];

window.KAIZEN_CATEGORY_IMAGE = function (category) {
  const match = window.KAIZEN_CATEGORIES.find((item) => item.name === category);
  return `assets/${match ? match.image : "opciones-especiales.jpeg"}`;
};
