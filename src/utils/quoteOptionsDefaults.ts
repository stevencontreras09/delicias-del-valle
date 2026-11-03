import { OpcionConfigurable, CotizacionExtra, CategoriaExtra, QuoteCustomOptions, Insumo } from '../types';

export const OPCIONES_MASA_DETALLADAS: OpcionConfigurable[] = [
  { id: 'masa_estandar', nombre: 'Ninguna / Estándar de la Receta', precio_adicional_base: 0, descripcion: 'Masa base incluida en la receta original' },
  { id: 'masa_vainilla', nombre: 'Vainilla Francesa Tradicional', precio_adicional_base: 0, descripcion: 'Bizcochuelo clásico con vainilla pura' },
  { id: 'masa_red_velvet', nombre: 'Red Velvet Aterciopelado', precio_adicional_base: 250, descripcion: 'Cacao holandés, buttermilk y colorante carmín' },
  { id: 'masa_chocolate', nombre: 'Chocolate Suizo 56% Belga', precio_adicional_base: 350, descripcion: 'Bizcocho intenso con chocolate puro fundido' },
  { id: 'masa_zanahoria', nombre: 'Zanahoria, Nuez y Especias de Ceilán', precio_adicional_base: 300, descripcion: 'Zanahoria fresca, nueces de nogal y canela fina' },
  { id: 'masa_almendras', nombre: 'Almendras y Frutos del Bosque', precio_adicional_base: 400, descripcion: 'Harina de almendras extra fina y arándanos silvestres' },
  { id: 'masa_naranja', nombre: 'Naranja y Semillas de Amapola', precio_adicional_base: 200, descripcion: 'Zumo y ralladura de naranja natural con semillas' },
  { id: 'masa_tres_leches', nombre: 'Masa Tradicional de Tres Leches', precio_adicional_base: 150, descripcion: 'Bizcochuelo absorbente ultra aireado' },
  { id: 'masa_brownie', nombre: 'Masa Húmeda de Brownie Fudgy', precio_adicional_base: 350, descripcion: 'Base densa y melcochuda de chocolate real' },
  { id: 'masa_galleta', nombre: 'Masa de Galleta Choco-Chips', precio_adicional_base: 200, descripcion: 'Masa estilo galletera con trozos de chocolate' },
  { id: 'masa_brioche', nombre: 'Masa Hojaldrada / Brioche Francés', precio_adicional_base: 250, descripcion: 'Masa enriquecida con mantequilla pura' },
];

export const OPCIONES_RELLENO_DETALLADAS: OpcionConfigurable[] = [
  { id: 'relleno_ninguno', nombre: 'Ninguno / Sin Relleno', precio_adicional_base: 0, descripcion: 'Sin capas de relleno' },
  { id: 'relleno_arequipe', nombre: 'Dulce de Leche / Arequipe Repostero', precio_adicional_base: 0, descripcion: 'Cocción lenta tradicional, espeso y caramelizado' },
  { id: 'relleno_crema_pastelera', nombre: 'Crema Pastelera con Vainilla Bourbon', precio_adicional_base: 0, descripcion: 'Suave, sedosa con yemas frescas y vainilla en vaina' },
  { id: 'relleno_queso_crema', nombre: 'Frosting de Queso Crema Philadelphia', precio_adicional_base: 350, descripcion: 'Queso crema auténtico, suave y equilibrado' },
  { id: 'relleno_ganache', nombre: 'Ganache Sedoso de Chocolate Belga 56%', precio_adicional_base: 380, descripcion: 'Emulsión de chocolate amargo con crema 35%' },
  { id: 'relleno_frutos_rojos', nombre: 'Confitura Casera de Frutos Rojos Silvestres', precio_adicional_base: 320, descripcion: 'Frambuesas, moras y arándanos reducidas al fuego' },
  { id: 'relleno_nutella', nombre: 'Nutella Pura con Crujiente de Avellanas', precio_adicional_base: 450, descripcion: 'Capas generosas de avellana y chocolate con praliné' },
  { id: 'relleno_toffee', nombre: 'Caramelo Salado / Toffee Artesanal', precio_adicional_base: 220, descripcion: 'Caramelo cocido con mantequilla y flor de sal' },
  { id: 'relleno_maracuya', nombre: 'Curd Cítrico de Maracuyá / Chinola Fresca', precio_adicional_base: 220, descripcion: 'Contraste ácido tropical perfecto y aromático' },
];

export const OPCIONES_DECORACION_DETALLADAS: OpcionConfigurable[] = [
  { id: 'deco_azucar', nombre: 'Glaseado Real / Azúcar Glass Espolvoreado', precio_adicional_base: 100, descripcion: 'Fina lluvia de azúcar micropulverizada' },
  { id: 'deco_chantilly', nombre: 'Chantilly Suave con Virutas de Chocolate', precio_adicional_base: 250, descripcion: 'Crema batida fresca y ralladura de chocolate' },
  { id: 'deco_buttercream_alisado', nombre: 'Buttercream Alisado Perfecto Bicolor', precio_adicional_base: 350, descripcion: 'Alisado profesional en bordes rectos y degradé' },
  { id: 'deco_drip_macarons', nombre: 'Drip Dorado Artesanal con Macarons y Fresas', precio_adicional_base: 550, descripcion: 'Goteo de chocolate dorado, macarons franceses y fresas' },
  { id: 'deco_naked_flores', nombre: 'Naked Cake Rústico con Flores Naturales Comestibles', precio_adicional_base: 450, descripcion: 'Acabado semi-desnudo con flores orgánicas' },
  { id: 'deco_espejo', nombre: 'Cubierta Espejo Brillante de Chocolate Belga', precio_adicional_base: 500, descripcion: 'Glaseado espejo ultra reflectivo de alta pastelería' },
  { id: 'deco_fondant_3d', nombre: 'Fondant Temático Personalizado con Figuras 3D', precio_adicional_base: 850, descripcion: 'Modelado artesanal manual en pasta de azúcar' },
];

export const OPCIONES_EMPAQUE_DETALLADAS: OpcionConfigurable[] = [
  { id: 'empaque_estandar', nombre: 'Ninguno / Estándar de la Receta', precio_adicional_base: 0, descripcion: 'Empaque estándar o incluido en la receta' },
  { id: 'empaque_caja_lujo', nombre: 'Caja de Lujo con Ventana y Lazo Satinado Frambuesa', precio_adicional_base: 175, descripcion: 'Caja de presentación premium con visor transparente y lazo' },
  { id: 'empaque_caja_repostera', nombre: 'Caja Repostera Alta Reforzada con Asa', precio_adicional_base: 140, descripcion: 'Caja de cartón microcorrugado reforzado para transporte seguro' },
  { id: 'empaque_base_rigida', nombre: 'Base Rígida Metalizada Dorada / Plateada', precio_adicional_base: 85, descripcion: 'Base gruesa resistente para tortas pesadas' },
  { id: 'empaque_domo_alto', nombre: 'Domo Plástico Cristalino Alto Antivuelco', precio_adicional_base: 65, descripcion: 'Envase domo transparente con cierre hermético' },
  { id: 'empaque_bolsa_kraft', nombre: 'Bolsa Ecológica Kraft de Regalo con Asas', precio_adicional_base: 45, descripcion: 'Bolsa de papel kraft reforzado para entrega' },
  { id: 'empaque_caja_minis', nombre: 'Caja con Divisiones para Minis / Bocaditos', precio_adicional_base: 120, descripcion: 'Caja con separadores individuales de porciones' },
  { id: 'empaque_plato', nombre: 'Plato Desechable Reforzado', precio_adicional_base: 8, descripcion: 'Plato individual o de base para porción' },
  { id: 'empaque_envase_porcion', nombre: 'Envase Individual de Porción', precio_adicional_base: 10, descripcion: 'Envase tipo domo/clamshell para rebanadas individuales' },
];

export function getExtraCategory(extra: CotizacionExtra): CategoriaExtra {
  if (extra.categoria) return extra.categoria;
  const lowerId = (extra.id || '').toLowerCase();
  const lowerName = (extra.nombre || '').toLowerCase();

  if (lowerId.includes('topper') || lowerName.includes('topper')) {
    return 'topper';
  }
  if (
    lowerId.includes('sticker') ||
    lowerName.includes('sticker') ||
    lowerName.includes('etiqueta') ||
    lowerName.includes('sello')
  ) {
    return 'sticker';
  }
  if (
    lowerId.includes('tarjeta') ||
    lowerName.includes('tarjeta') ||
    lowerName.includes('mensaje') ||
    lowerName.includes('dedicatoria')
  ) {
    return 'tarjeta';
  }
  if (
    lowerId.startsWith('insumo_var_') ||
    lowerId.includes('caja') ||
    lowerId.includes('empaque') ||
    lowerId.includes('base') ||
    lowerId.includes('domo') ||
    lowerId.includes('bolsa') ||
    lowerName.includes('caja') ||
    lowerName.includes('empaque') ||
    lowerName.includes('base') ||
    lowerName.includes('domo') ||
    lowerName.includes('bolsa') ||
    lowerName.includes('plato') ||
    lowerName.includes('envase')
  ) {
    return 'empaque';
  }
  return 'otro';
}

export function buildDefaultExtrasList(insumosMap?: Map<number, Insumo>): CotizacionExtra[] {
  const baseList: CotizacionExtra[] = [
    // 📦 Empaques
    { id: 'empaque_caja_lujo', nombre: 'Caja de Lujo con Ventana y Lazo Satinado Frambuesa', precio: 175, categoria: 'empaque' },
    { id: 'empaque_caja_repostera', nombre: 'Caja Repostera Alta Reforzada con Asa de Transporte', precio: 140, categoria: 'empaque' },
    { id: 'empaque_base_rigida', nombre: 'Base Rígida Metalizada Dorada / Plateada Reforzada', precio: 85, categoria: 'empaque' },
    { id: 'empaque_domo_alto', nombre: 'Domo Plástico Cristalino Alto Antivuelco', precio: 65, categoria: 'empaque' },
    { id: 'empaque_bolsa_kraft', nombre: 'Bolsa Ecológica Kraft de Regalo con Asas de Cinta', precio: 45, categoria: 'empaque' },

    // 🎂 Toppers
    { id: 'topper_acrilico_feliz_cumple', nombre: "Topper Acrílico 'Feliz Cumpleaños' Espejado Dorado/Plateado", precio: 250, categoria: 'topper' },
    { id: 'topper_personalizado_nombre', nombre: 'Topper Personalizado con Nombre & Edad (Corte Láser)', precio: 350, categoria: 'topper' },
    { id: 'topper_madera_elegante', nombre: 'Topper Rústico Elegante en Madera Calada', precio: 280, categoria: 'topper' },
    { id: 'topper_mini_cupcakes', nombre: 'Mini Toppers Temáticos para Cupcakes (Pack x 6 ud)', precio: 160, categoria: 'topper' },

    // 🏷️ Stickers
    { id: 'sticker_personalizado_evento', nombre: 'Sticker / Etiqueta Adhesiva Personalizada (Nombre & Ocasión)', precio: 60, categoria: 'sticker' },
    { id: 'sticker_hecho_con_amor', nombre: "Sticker Circular Artesanal 'Hecho a Mano con Amor'", precio: 40, categoria: 'sticker' },
    { id: 'sticker_sello_seguridad', nombre: 'Sello Adhesivo de Garantía para Caja / Cinta con Logo', precio: 35, categoria: 'sticker' },

    // 💌 Tarjeta con Mensaje
    { id: 'tarjeta_caligrafia_artesanal', nombre: 'Tarjeta Artesanal Caligrafiada a Mano con Dedicatoria', precio: 90, categoria: 'tarjeta' },
    { id: 'tarjeta_regalo_sobre_satinado', nombre: 'Tarjeta de Regalo Premium en Sobre Satinado Sellado', precio: 120, categoria: 'tarjeta' },
    { id: 'tarjeta_postal_mini', nombre: 'Mini Tarjeta Postal con Mensaje y Broche Dorado', precio: 75, categoria: 'tarjeta' },

    // ✨ Otros / Detalles
    { id: 'vela_volcan', nombre: 'Vela Volcán Chispas Doradas', precio: 120, categoria: 'otro' },
    { id: 'vela_numerica', nombre: 'Vela Numérica Metalizada Dorada / Oro Rosa', precio: 80, categoria: 'otro' },
    { id: 'macarons_extra', nombre: 'Set de 4 Macarons de Frambuesa y Pistacho Extra', precio: 290, categoria: 'otro' },
  ];

  if (insumosMap) {
    const existingIds = new Set(baseList.map((e) => e.id));
    insumosMap.forEach((insumo) => {
      if (insumo.tipo_costo === 'variable' && insumo.activo) {
        const id = `insumo_var_${insumo.id}`;
        if (!existingIds.has(id)) {
          let precio = 5;
          if (insumo.costo_unitario_base > 0) {
            precio = Math.max(5, Math.ceil(insumo.costo_unitario_base));
          } else if (insumo.precio_compra > 0) {
            precio = Math.max(5, Math.ceil(insumo.precio_compra / (insumo.presentacion_empaque || 1)));
          }
          const lowerName = (insumo.nombre || '').toLowerCase();
          let cat: CategoriaExtra = 'otro';
          if (
            lowerName.includes('caja') ||
            lowerName.includes('base') ||
            lowerName.includes('domo') ||
            lowerName.includes('bolsa') ||
            lowerName.includes('empaque') ||
            lowerName.includes('envase') ||
            lowerName.includes('plato')
          ) {
            cat = 'empaque';
          } else if (lowerName.includes('topper')) {
            cat = 'topper';
          } else if (lowerName.includes('sticker') || lowerName.includes('etiqueta')) {
            cat = 'sticker';
          } else if (lowerName.includes('tarjeta') || lowerName.includes('mensaje')) {
            cat = 'tarjeta';
          }
          baseList.push({
            id,
            nombre: `${insumo.nombre} (${insumo.unidad_compra})`,
            precio,
            categoria: cat,
          });
        }
      }
    });
  }

  return baseList;
}

export function getDefaultQuoteOptions(insumosMap?: Map<number, Insumo>): QuoteCustomOptions {
  return {
    masas: OPCIONES_MASA_DETALLADAS,
    rellenos: OPCIONES_RELLENO_DETALLADAS,
    decoraciones: OPCIONES_DECORACION_DETALLADAS,
    empaques: OPCIONES_EMPAQUE_DETALLADAS,
    extras: buildDefaultExtrasList(insumosMap),
  };
}
