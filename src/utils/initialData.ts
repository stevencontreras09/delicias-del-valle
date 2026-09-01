import { Insumo, Receta, Cotizacion, Pedido, Merma, Usuario } from '../types';

// ==============================================================================
// 106 INSUMOS DEL CATÁLOGO EXACTO DEL TALLER (DOP / RD$)
// ==============================================================================
export const INITIAL_INSUMOS: Insumo[] = [
  {
    "id": 1,
    "nombre": "Mantequilla",
    "categoria": "Grasas",
    "unidad_compra": "unidad",
    "precio_compra": 457.42,
    "presentacion_empaque": 490.91,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.93178,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 2,
    "nombre": "Azucar",
    "categoria": "Endulzantes",
    "unidad_compra": "unidad",
    "precio_compra": 324.8,
    "presentacion_empaque": 4410.72,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.073639,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 3,
    "nombre": "Huevos",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 209.61,
    "presentacion_empaque": 30,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 6.987,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 4,
    "nombre": "Harina",
    "categoria": "Harinas",
    "unidad_compra": "unidad",
    "precio_compra": 174.07,
    "presentacion_empaque": 2267.96,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.076752,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 5,
    "nombre": "Leche",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 350.59,
    "presentacion_empaque": 5529.41,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.063405,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 6,
    "nombre": "Vainilla",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 100,
    "presentacion_empaque": 930.06,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.10752,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 7,
    "nombre": "Polvo de Hornear",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 99,
    "presentacion_empaque": 80,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 1.2375,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 8,
    "nombre": "Limon o naranja",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 46.43,
    "presentacion_empaque": 1,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 46.43,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 9,
    "nombre": "Cacao en polvo amarga",
    "categoria": "Chocolates",
    "unidad_compra": "unidad",
    "precio_compra": 435,
    "presentacion_empaque": 297.76,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 1.460908,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 10,
    "nombre": "Bicarbonato de Sodio",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 21,
    "presentacion_empaque": 80,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.2625,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 11,
    "nombre": "Sal",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 43.4,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.0868,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 12,
    "nombre": "yogurt",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 139,
    "presentacion_empaque": 950,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.146316,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 13,
    "nombre": "agua",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 92.5,
    "presentacion_empaque": 18920,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.004889,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 14,
    "nombre": "DULCE DE LECHE",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 351.43,
    "presentacion_empaque": 601.71,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.584052,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 15,
    "nombre": "Velvet Top",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 528.57,
    "presentacion_empaque": 997.43,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.529932,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 16,
    "nombre": "MERMELADA DE GUAYABA",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 240,
    "presentacion_empaque": 997.9,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.240505,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 17,
    "nombre": "MERMELADA DE FRESA",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 280,
    "presentacion_empaque": 997.9,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.280589,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 18,
    "nombre": "MERMELADA DE PINA",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 275,
    "presentacion_empaque": 997.9,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.275579,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 19,
    "nombre": "Chocolate",
    "categoria": "Chocolates",
    "unidad_compra": "unidad",
    "precio_compra": 673.33,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 1.34666,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 20,
    "nombre": "Crema de leche",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 379,
    "presentacion_empaque": 1000,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.379,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 21,
    "nombre": "Crema Bavarian",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 215,
    "presentacion_empaque": 907.18,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.236998,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 22,
    "nombre": "Crema cacao y chocolate",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 540,
    "presentacion_empaque": 1000,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.54,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 23,
    "nombre": "CAJA",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 62.5,
    "presentacion_empaque": 1,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 62.5,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 24,
    "nombre": "PLATO",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 75,
    "presentacion_empaque": 1,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 75,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 25,
    "nombre": "VELVET TOP CHOCOLATE",
    "categoria": "Chocolates",
    "unidad_compra": "unidad",
    "precio_compra": 650,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.65,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 26,
    "nombre": "crema de cacao y avellanas",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 540,
    "presentacion_empaque": 1000,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.54,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 27,
    "nombre": "crema de cacao y avellanas reen",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 540,
    "presentacion_empaque": 1000,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.54,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 28,
    "nombre": "HARINA (2 TAZAS)",
    "categoria": "Harinas",
    "unidad_compra": "unidad",
    "precio_compra": 175,
    "presentacion_empaque": 2267.96,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.077162,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 29,
    "nombre": "AZUCAR ( 1 3/4 TAZA)",
    "categoria": "Endulzantes",
    "unidad_compra": "unidad",
    "precio_compra": 335,
    "presentacion_empaque": 4500,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.074444,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 30,
    "nombre": "VAINILLA (1 CDA.)",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 105,
    "presentacion_empaque": 946,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.110994,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 31,
    "nombre": "Cacao en polvo",
    "categoria": "Chocolates",
    "unidad_compra": "unidad",
    "precio_compra": 559.95,
    "presentacion_empaque": 453.52,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 1.234675,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 32,
    "nombre": "Capacillo",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 159.75,
    "presentacion_empaque": 111.25,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 1.435955,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 33,
    "nombre": "Capacillo cuadrado",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 18,
    "presentacion_empaque": 350,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 0.051429,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 34,
    "nombre": "Polvo leudante",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 99,
    "presentacion_empaque": 80,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 1.2375,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 35,
    "nombre": "Pizca de sal fina",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 40.67,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.08134,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 36,
    "nombre": "Velvet top Vainilla",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 520,
    "presentacion_empaque": 997,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.521565,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 37,
    "nombre": "envase transparente x 10",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 235,
    "presentacion_empaque": 10,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 23.5,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 38,
    "nombre": "capacillo metalizado",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 210,
    "presentacion_empaque": 100,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 2.1,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 39,
    "nombre": "envase transparente x 6",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 235,
    "presentacion_empaque": 10,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 23.5,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 40,
    "nombre": "RELLENO FRESA",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 280,
    "presentacion_empaque": 997.9,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.280589,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 41,
    "nombre": "Suspiro",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 520,
    "presentacion_empaque": 997,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.521565,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 42,
    "nombre": "Velve top de Chocolate",
    "categoria": "Chocolates",
    "unidad_compra": "unidad",
    "precio_compra": 650,
    "presentacion_empaque": 997,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.651956,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 43,
    "nombre": "Cacao",
    "categoria": "Chocolates",
    "unidad_compra": "unidad",
    "precio_compra": 435,
    "presentacion_empaque": 453.55,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.9591,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 44,
    "nombre": "Cafe",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 25,
    "presentacion_empaque": 25,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 1,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 45,
    "nombre": "Aceite canola o maiz",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 449,
    "presentacion_empaque": 1420,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.316197,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 46,
    "nombre": "Velve top de Vainilla",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 520,
    "presentacion_empaque": 997,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.521565,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 47,
    "nombre": "azucar pulverizada",
    "categoria": "Endulzantes",
    "unidad_compra": "unidad",
    "precio_compra": 165,
    "presentacion_empaque": 453.52,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.363821,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 48,
    "nombre": "huevo",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 209.87,
    "presentacion_empaque": 30,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 6.995667,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 49,
    "nombre": "pizca de sal",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 44,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.088,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 50,
    "nombre": "Harina de Trigo",
    "categoria": "Harinas",
    "unidad_compra": "unidad",
    "precio_compra": 175,
    "presentacion_empaque": 2267.96,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.077162,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 51,
    "nombre": "Limon",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 20,
    "presentacion_empaque": 1,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 20,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 52,
    "nombre": "VARIOS",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 1,
    "presentacion_empaque": 1,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 1,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 53,
    "nombre": "ROYAL ICING MIX",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 215,
    "presentacion_empaque": 400,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.5375,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 54,
    "nombre": "FONDANT",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 390,
    "presentacion_empaque": 454,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.859031,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 55,
    "nombre": "IMPRESION",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 235,
    "presentacion_empaque": 1,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 235,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 56,
    "nombre": "CMC",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 120,
    "presentacion_empaque": 120,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 1,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 57,
    "nombre": "Crema cacao",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 190,
    "presentacion_empaque": 200,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.95,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 58,
    "nombre": "Chocolate sucedaneo, negro o blanco",
    "categoria": "Chocolates",
    "unidad_compra": "unidad",
    "precio_compra": 270,
    "presentacion_empaque": 453.59,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.595251,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 59,
    "nombre": "Mermelada",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 149,
    "presentacion_empaque": 350,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.425714,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 60,
    "nombre": "Mantequilla ( 1 1/2 barra)",
    "categoria": "Grasas",
    "unidad_compra": "unidad",
    "precio_compra": 460,
    "presentacion_empaque": 460,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 1,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 61,
    "nombre": "Harina (1 taza)",
    "categoria": "Harinas",
    "unidad_compra": "unidad",
    "precio_compra": 175,
    "presentacion_empaque": 2267.96,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.077162,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 62,
    "nombre": "Maicena",
    "categoria": "Harinas",
    "unidad_compra": "unidad",
    "precio_compra": 99,
    "presentacion_empaque": 425,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.232941,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 63,
    "nombre": "Azucar Pulverizada ( 3cdas)",
    "categoria": "Endulzantes",
    "unidad_compra": "unidad",
    "precio_compra": 165,
    "presentacion_empaque": 453.52,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.363821,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 64,
    "nombre": "COCO",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 175,
    "presentacion_empaque": 205,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.853659,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 65,
    "nombre": "MERMELADA GUAYABA",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 240,
    "presentacion_empaque": 997.9,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.240505,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 66,
    "nombre": "HARINA panaderia",
    "categoria": "Harinas",
    "unidad_compra": "unidad",
    "precio_compra": 250,
    "presentacion_empaque": 2267.32,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.110262,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 67,
    "nombre": "levadura seca",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 220,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.44,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 68,
    "nombre": "jamon",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 305,
    "presentacion_empaque": 453.59,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.672413,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 69,
    "nombre": "tocineta",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 341.5,
    "presentacion_empaque": 249.84,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 1.366875,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 70,
    "nombre": "aceituna",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 249,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.249,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 71,
    "nombre": "pasas",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 119,
    "presentacion_empaque": 250,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.476,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 72,
    "nombre": "Papel celofan",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 20,
    "presentacion_empaque": 1,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 20,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 73,
    "nombre": "Sticker",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 5,
    "presentacion_empaque": 1,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 5,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 74,
    "nombre": "Papel de horno",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 188,
    "presentacion_empaque": 7475.47,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 0.025149,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 75,
    "nombre": "QUESO CREMA",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 149,
    "presentacion_empaque": 226.79,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.656995,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 76,
    "nombre": "MASA DE HOJALDRE",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 500,
    "presentacion_empaque": 2,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 250,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 77,
    "nombre": "Papel encerado",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 249,
    "presentacion_empaque": 9966.96,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 0.024983,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 78,
    "nombre": "envase",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 96.92,
    "presentacion_empaque": 7.17,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 13.517434,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 79,
    "nombre": "Leche Condensada",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 121.86,
    "presentacion_empaque": 403,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.302382,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 80,
    "nombre": "Ron",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 595,
    "presentacion_empaque": 700,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.85,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 81,
    "nombre": "Azucar (para caramelo)",
    "categoria": "Endulzantes",
    "unidad_compra": "unidad",
    "precio_compra": 320,
    "presentacion_empaque": 4500,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.071111,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 82,
    "nombre": "Cerezas marrasquinos",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 129,
    "presentacion_empaque": 20,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 6.45,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 83,
    "nombre": "Cucharitas",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 155,
    "presentacion_empaque": 48,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 3.229167,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 84,
    "nombre": "Envases de Shot cuadrado",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 160,
    "presentacion_empaque": 12,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 13.333333,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 85,
    "nombre": "Envases de aluminios",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 165,
    "presentacion_empaque": 10,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 16.5,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 86,
    "nombre": "Bizcocho",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 60,
    "presentacion_empaque": 1,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 60,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 87,
    "nombre": "Leche Evaporada (lata)",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 67,
    "presentacion_empaque": 312,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.214744,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 88,
    "nombre": "Crema de Leche (bravo)",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 64,
    "presentacion_empaque": 200,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.32,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 89,
    "nombre": "Topping Crema",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 603.33,
    "presentacion_empaque": 937,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.643895,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 90,
    "nombre": "Vasos Shot (2oz)",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 255,
    "presentacion_empaque": 50,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 5.1,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 91,
    "nombre": "Crema de Coco",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 179,
    "presentacion_empaque": 425,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.421176,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 92,
    "nombre": "Leche de coco",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 144,
    "presentacion_empaque": 444,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.324324,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 93,
    "nombre": "Leche evaporada",
    "categoria": "Lácteos y Huevos",
    "unidad_compra": "unidad",
    "precio_compra": 66,
    "presentacion_empaque": 297,
    "unidad_base": "ml",
    "factor_conversion": 1,
    "costo_unitario_base": 0.222222,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 94,
    "nombre": "Salchichas",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 209,
    "presentacion_empaque": 589,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.354839,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 95,
    "nombre": "Mayonesa",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 149,
    "presentacion_empaque": 425,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.350588,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 96,
    "nombre": "Ajo",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 46,
    "presentacion_empaque": 4,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 11.5,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 97,
    "nombre": "Cilantro",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 34,
    "presentacion_empaque": 1,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 34,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 98,
    "nombre": "Empaque",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 25,
    "presentacion_empaque": 1,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 25,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 99,
    "nombre": "Envase de salsa",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 5,
    "presentacion_empaque": 1,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 5,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 100,
    "nombre": "Palillos",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 20,
    "presentacion_empaque": 206,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.097087,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 101,
    "nombre": "PASTA DE GUAYABA",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 109,
    "presentacion_empaque": 396.89,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.274635,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 102,
    "nombre": "Nueces",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 900,
    "presentacion_empaque": 1130,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.79646,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 103,
    "nombre": "CAPACILLOS PEQUENOS",
    "categoria": "Empaques",
    "unidad_compra": "unidad",
    "precio_compra": 105,
    "presentacion_empaque": 100,
    "unidad_base": "ud",
    "factor_conversion": 1,
    "costo_unitario_base": 1.05,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 104,
    "nombre": "Miel",
    "categoria": "Endulzantes",
    "unidad_compra": "unidad",
    "precio_compra": 199,
    "presentacion_empaque": 453,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.439294,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 105,
    "nombre": "Hojaldritoa",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 500,
    "presentacion_empaque": 2,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 250,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 106,
    "nombre": "JAMON DE PAVO",
    "categoria": "Otros",
    "unidad_compra": "unidad",
    "precio_compra": 359,
    "presentacion_empaque": 453.52,
    "unidad_base": "g",
    "factor_conversion": 1,
    "costo_unitario_base": 0.791586,
    "stock_actual": 0,
    "stock_minimo": 100,
    "activo": true
  }
];

// ==============================================================================
// 60 RECETAS MAESTRAS EXACTAS DEL TALLER (BOM)
// ==============================================================================
export const INITIAL_RECETAS: Receta[] = [
  {
    "id": 1,
    "nombre": "TORTA DE VAINILLA",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "LB",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 660,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 500,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 7,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 2,
    "nombre": "TORTA DE VAINILLA",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "LB",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 660,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 500,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 7,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 3,
    "nombre": "TORTA DE VAINILLA",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 0.5,
    "rendimiento_unidad": "LB",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 225,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 440,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 375,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 7,
        "cantidad": 11,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 4,
    "nombre": "TORTA DE CHCATE",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "B",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 20,
        "tipo": "fijo"
      },
      {
        "insumo_id": 10,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 12,
        "cantidad": 375,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Torta de Chocolate"
  },
  {
    "id": 5,
    "nombre": "TORTA DE CHCATE",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 0.5,
    "rendimiento_unidad": "b",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 175,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 175,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 50,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 20,
        "tipo": "fijo"
      },
      {
        "insumo_id": 10,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 12,
        "cantidad": 187.5,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Torta de Chocolate"
  },
  {
    "id": 6,
    "nombre": "SUSPIRO PARA TORTA",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "LB",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 3,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 500,
        "tipo": "fijo"
      },
      {
        "insumo_id": 13,
        "cantidad": 25,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 480,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 3,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Suspiro para Torta"
  },
  {
    "id": 7,
    "nombre": "TORTA DE VAINILLA SENCILLA/SENCILLA/DULCE DE LECHE",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": ")",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 14,
        "cantidad": 350,
        "tipo": "variable"
      },
      {
        "insumo_id": 15,
        "cantidad": 500,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 8,
    "nombre": "TORTA DE VAINILLA SENCILLA/SENCILLA/Merm Guayaba",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": ")",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 16,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 15,
        "cantidad": 400,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 9,
    "nombre": "TORTA DE VAINILLA SENCILLA/SENCILLA/Merm Fresa",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": ")",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 17,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 15,
        "cantidad": 400,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 10,
    "nombre": "TORTA DE VAINILLA SENCILLA/SENCILLA/MERM PINA",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": ")",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 18,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 15,
        "cantidad": 400,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 11,
    "nombre": "TORTA DE VAINILLA SENCILLA/SENCILLA/Ganac Chocolate",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": ")",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 19,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 20,
        "cantidad": 500,
        "tipo": "variable"
      },
      {
        "insumo_id": 15,
        "cantidad": 400,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 12,
    "nombre": "TORTA DE VAINILLA SENCILLA - Crema pastelera (Bavarian)",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "LB",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 21,
        "cantidad": 315,
        "tipo": "variable"
      },
      {
        "insumo_id": 15,
        "cantidad": 400,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 13,
    "nombre": "TORTA DE VAINILLA SENCILLA - CREMA CACA Y NUECES",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 0.5,
    "rendimiento_unidad": "LB",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 22,
        "cantidad": 350,
        "tipo": "variable"
      },
      {
        "insumo_id": 15,
        "cantidad": 400,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 14,
    "nombre": "TORTA DE VAINILLA SENCILLA/SENCILLA/DULCE DE LECHE",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": ")",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 14,
        "cantidad": 400,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 15,
    "nombre": "TORTA DE VAINILLA SENCILLA/SENCILLA/Merm Guayaba",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": ")",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 660,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 480,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 192,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 7,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 300,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 16,
    "nombre": "TORTA DE VAINILLA SENCILLA/SENCILLA/Merm Fresa",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": ")",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 660,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 480,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 192,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 7,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 17,
        "cantidad": 300,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 17,
    "nombre": "TORTA DE VAINILLA SENCILLA/SENCILLA/MERM PINA",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": ")",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 660,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 480,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 192,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 7,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 18,
        "cantidad": 300,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 18,
    "nombre": "TORTA DE VAINILLA SENCILLA/SENCILLA/Ganac Chocolate",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": ")",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 660,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 480,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 192,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 7,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 19,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 20,
        "cantidad": 500,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 19,
    "nombre": "TORTA DE VAINILLA SENCILLA/SENCILLA/Crema pastelera (Bavarian)",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "LB",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 660,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 480,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 192,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 7,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 19,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 20,
        "cantidad": 500,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 20,
    "nombre": "TORTA DE CHOCOLATE/CUBIERTA GANACHE/DULCE LECHE",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": "TROZOS",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 14,
        "cantidad": 350,
        "tipo": "variable"
      },
      {
        "insumo_id": 19,
        "cantidad": 350,
        "tipo": "variable"
      },
      {
        "insumo_id": 20,
        "cantidad": 600,
        "tipo": "variable"
      },
      {
        "insumo_id": 23,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 24,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Chocolate"
  },
  {
    "id": 21,
    "nombre": "TORTA DE CHOCOLATE/CREMA CHOCOLATE/DULCE LECHE",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 0.5,
    "rendimiento_unidad": "LB",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 14,
        "cantidad": 400,
        "tipo": "variable"
      },
      {
        "insumo_id": 25,
        "cantidad": 400,
        "tipo": "variable"
      },
      {
        "insumo_id": 23,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 24,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Chocolate"
  },
  {
    "id": 22,
    "nombre": "TORTA DE CHOCOLATE/CREMA CHOCOLATE/NUTELLA",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": "TROZOS",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 26,
        "cantidad": 400,
        "tipo": "variable"
      },
      {
        "insumo_id": 25,
        "cantidad": 400,
        "tipo": "variable"
      },
      {
        "insumo_id": 23,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 24,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Chocolate"
  },
  {
    "id": 23,
    "nombre": "TORTA DE CHOCOLATE/GANACHE DE CHOCOLATE /nutella",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 8,
    "rendimiento_unidad": "TROZOS",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 27,
        "cantidad": 400,
        "tipo": "variable"
      },
      {
        "insumo_id": 19,
        "cantidad": 350,
        "tipo": "variable"
      },
      {
        "insumo_id": 20,
        "cantidad": 600,
        "tipo": "variable"
      },
      {
        "insumo_id": 24,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 23,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Chocolate"
  },
  {
    "id": 24,
    "nombre": "BROWNIE",
    "categoria": "Brownies",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 28,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 29,
        "cantidad": 385,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 19,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 30,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 31,
        "cantidad": 10,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Brownie"
  },
  {
    "id": 25,
    "nombre": "BROWNIE CON DULCE DE LECHE",
    "categoria": "Brownies",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 14,
        "cantidad": 80,
        "tipo": "variable"
      },
      {
        "insumo_id": 23,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 32,
        "cantidad": 18,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Brownie"
  },
  {
    "id": 26,
    "nombre": "BROWNIE EN FUNDA EN TROZOS",
    "categoria": "Brownies",
    "descripcion": "",
    "rendimiento_base": 18,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 33,
        "cantidad": 18,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Brownie"
  },
  {
    "id": 27,
    "nombre": "CUPCAKE",
    "categoria": "Cupcakes",
    "descripcion": "",
    "rendimiento_base": 22,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 240,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 240,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 34,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 32,
        "cantidad": 22,
        "tipo": "variable"
      },
      {
        "insumo_id": 23,
        "cantidad": 3,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Cupcake"
  },
  {
    "id": 28,
    "nombre": "CUPCAKE DECORADOS VELVET TOP",
    "categoria": "Cupcakes",
    "descripcion": "",
    "rendimiento_base": 22,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 2,
        "cantidad": 240,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 34,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 32,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 36,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 37,
        "cantidad": 4,
        "tipo": "variable"
      },
      {
        "insumo_id": 1,
        "cantidad": 240,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Cupcake"
  },
  {
    "id": 29,
    "nombre": "CUPCAKE DECORADOS DE VAINILLA RELLENOS FRESA/ VELVEL TOP",
    "categoria": "Cupcakes",
    "descripcion": "",
    "rendimiento_base": 22,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 240,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 240,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 34,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 38,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 36,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 39,
        "cantidad": 4,
        "tipo": "variable"
      },
      {
        "insumo_id": 40,
        "cantidad": 50,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Cupcake"
  },
  {
    "id": 30,
    "nombre": "CUPCAKE DECORADOS DE VAINILLA RELLENOS DULCE LECHE/ VELVEL TOP",
    "categoria": "Cupcakes",
    "descripcion": "",
    "rendimiento_base": 22,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 240,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 240,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 34,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 38,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 41,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 39,
        "cantidad": 4,
        "tipo": "variable"
      },
      {
        "insumo_id": 14,
        "cantidad": 50,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Cupcake"
  },
  {
    "id": 31,
    "nombre": "CUPCAKE DECORADOS DE VAINILLA VELVET TOP DE CHOCOLATE",
    "categoria": "Cupcakes",
    "descripcion": "",
    "rendimiento_base": 22,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 240,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 240,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 34,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 8,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 32,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 42,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 39,
        "cantidad": 2,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Cupcake"
  },
  {
    "id": 32,
    "nombre": "CUPCAKE DECORADOS DE chocolate VELVET TOP DE Vainilla",
    "categoria": "Cupcakes",
    "descripcion": "",
    "rendimiento_base": 12,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 2,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 34,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 43,
        "cantidad": 50,
        "tipo": "fijo"
      },
      {
        "insumo_id": 44,
        "cantidad": 25,
        "tipo": "fijo"
      },
      {
        "insumo_id": 45,
        "cantidad": 125,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 125,
        "tipo": "fijo"
      },
      {
        "insumo_id": 32,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 46,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 39,
        "cantidad": 2,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Cupcake"
  },
  {
    "id": 33,
    "nombre": "PASTA SECA",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 47,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 49,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 7,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 50,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 51,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 52,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 24,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Pasta Seca"
  },
  {
    "id": 34,
    "nombre": "GALLETAS DE MANTEQUILLA PARA DECORAR Royal Icing",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 36,
    "rendimiento_unidad": "MEDIANAS",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 175,
        "tipo": "fijo"
      },
      {
        "insumo_id": 47,
        "cantidad": 225,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 51,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 438,
        "tipo": "fijo"
      },
      {
        "insumo_id": 53,
        "cantidad": 250,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Galletas de Mantequilla"
  },
  {
    "id": 35,
    "nombre": "GALLETAS DE MANTEQUILLA PARA DECORAR Fondant",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 36,
    "rendimiento_unidad": "MEDIANAS",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 175,
        "tipo": "fijo"
      },
      {
        "insumo_id": 47,
        "cantidad": 225,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 51,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 438,
        "tipo": "fijo"
      },
      {
        "insumo_id": 54,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 55,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 56,
        "cantidad": 10,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Galletas de Mantequilla"
  },
  {
    "id": 36,
    "nombre": "GALLETAS DE MANTEQUILLA con nutella y chocolate",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 30,
    "rendimiento_unidad": "MEDIANAS",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 175,
        "tipo": "fijo"
      },
      {
        "insumo_id": 47,
        "cantidad": 225,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 51,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 438,
        "tipo": "fijo"
      },
      {
        "insumo_id": 57,
        "cantidad": 50,
        "tipo": "variable"
      },
      {
        "insumo_id": 58,
        "cantidad": 50,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Galletas de Mantequilla"
  },
  {
    "id": 37,
    "nombre": "GALLETAS DE FORMAS DECORADAS",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 80,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 7,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 165,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 262,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 16,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Galletas de Formas"
  },
  {
    "id": 38,
    "nombre": "GALLETAS LUNETTE VAINILLA",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 13,
    "rendimiento_unidad": "PAR DE 2,5",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 47,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 59,
        "cantidad": 30,
        "tipo": "variable"
      },
      {
        "insumo_id": 47,
        "cantidad": 50,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Galletas Lunette"
  },
  {
    "id": 39,
    "nombre": "GALLETAS LUNETTE CHOCOLATE",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 13,
    "rendimiento_unidad": "PAR DE 2,5",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 47,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 43,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 59,
        "cantidad": 30,
        "tipo": "variable"
      },
      {
        "insumo_id": 47,
        "cantidad": 50,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Galletas Lunette"
  },
  {
    "id": 40,
    "nombre": "ALFAJOR CON DULCE DE LECHE",
    "categoria": "Alfajores",
    "descripcion": "",
    "rendimiento_base": 18,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 60,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 61,
        "cantidad": 110,
        "tipo": "fijo"
      },
      {
        "insumo_id": 62,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 30,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 14,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 47,
        "cantidad": 30,
        "tipo": "variable"
      },
      {
        "insumo_id": 32,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 64,
        "cantidad": 40,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Alfajor"
  },
  {
    "id": 41,
    "nombre": "ALFAJOR CON MERMELADA GUAYABA",
    "categoria": "Alfajores",
    "descripcion": "",
    "rendimiento_base": 18,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 60,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 61,
        "cantidad": 110,
        "tipo": "fijo"
      },
      {
        "insumo_id": 62,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 30,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 47,
        "cantidad": 30,
        "tipo": "variable"
      },
      {
        "insumo_id": 32,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Alfajor"
  },
  {
    "id": 42,
    "nombre": "PAN DE JAMON",
    "categoria": "Panes y Salados",
    "descripcion": "",
    "rendimiento_base": 2,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 66,
        "cantidad": 500,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 67,
        "cantidad": 7,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 260,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 80,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 110,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 68,
        "cantidad": 800,
        "tipo": "variable"
      },
      {
        "insumo_id": 69,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 70,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 71,
        "cantidad": 60,
        "tipo": "variable"
      },
      {
        "insumo_id": 1,
        "cantidad": 10,
        "tipo": "variable"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 72,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 73,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 74,
        "cantidad": 30,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Pan de Jamón"
  },
  {
    "id": 43,
    "nombre": "PAN DE JAMON CON QUESO CREMA",
    "categoria": "Panes y Salados",
    "descripcion": "",
    "rendimiento_base": 2,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 66,
        "cantidad": 500,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 67,
        "cantidad": 7,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 260,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 80,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 110,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 68,
        "cantidad": 800,
        "tipo": "variable"
      },
      {
        "insumo_id": 69,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 70,
        "cantidad": 120,
        "tipo": "variable"
      },
      {
        "insumo_id": 71,
        "cantidad": 60,
        "tipo": "variable"
      },
      {
        "insumo_id": 1,
        "cantidad": 10,
        "tipo": "variable"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 72,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 73,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 75,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 74,
        "cantidad": 30,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Pan de Jamón"
  },
  {
    "id": 44,
    "nombre": "PAN DE JAMON DE HOJALDRE",
    "categoria": "Panes y Salados",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 76,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 68,
        "cantidad": 400,
        "tipo": "variable"
      },
      {
        "insumo_id": 69,
        "cantidad": 80,
        "tipo": "variable"
      },
      {
        "insumo_id": 70,
        "cantidad": 60,
        "tipo": "variable"
      },
      {
        "insumo_id": 71,
        "cantidad": 40,
        "tipo": "variable"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 72,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 73,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 74,
        "cantidad": 30,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Pan de Jamón"
  },
  {
    "id": 45,
    "nombre": "CACHITO",
    "categoria": "Panes y Salados",
    "descripcion": "",
    "rendimiento_base": 16,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 66,
        "cantidad": 630,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 67,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 245,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 105,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 7,
        "tipo": "fijo"
      },
      {
        "insumo_id": 13,
        "cantidad": 60,
        "tipo": "fijo"
      },
      {
        "insumo_id": 68,
        "cantidad": 500,
        "tipo": "variable"
      },
      {
        "insumo_id": 69,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 77,
        "cantidad": 20,
        "tipo": "variable"
      },
      {
        "insumo_id": 78,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Cachito"
  },
  {
    "id": 46,
    "nombre": "QUESILLO",
    "categoria": "Postres",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "COMPLETO",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 79,
        "cantidad": 403,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 403,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 80,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 81,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 82,
        "cantidad": 6,
        "tipo": "variable"
      },
      {
        "insumo_id": 78,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Quesillo"
  },
  {
    "id": 47,
    "nombre": "QUESILLO",
    "categoria": "Postres",
    "descripcion": "",
    "rendimiento_base": 14,
    "rendimiento_unidad": "porciones cortadas",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 2,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 82,
        "cantidad": 6,
        "tipo": "variable"
      },
      {
        "insumo_id": 83,
        "cantidad": 12,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 12,
        "tipo": "variable"
      },
      {
        "insumo_id": 79,
        "cantidad": 403,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 403,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 80,
        "cantidad": 5,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Quesillo"
  },
  {
    "id": 48,
    "nombre": "QUESILLO",
    "categoria": "Postres",
    "descripcion": "",
    "rendimiento_base": 12,
    "rendimiento_unidad": "porciones cortadas",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 79,
        "cantidad": 403,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 403,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 80,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 2,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 85,
        "cantidad": 12,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Quesillo"
  },
  {
    "id": 49,
    "nombre": "BIZCOCHO",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 3,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 64,
        "cantidad": 30,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Bizcocho"
  },
  {
    "id": 50,
    "nombre": "TRES LECHE MEDIANO",
    "categoria": "Tres Leches",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 79,
        "cantidad": 403,
        "tipo": "fijo"
      },
      {
        "insumo_id": 87,
        "cantidad": 312,
        "tipo": "fijo"
      },
      {
        "insumo_id": 78,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 89,
        "cantidad": 250,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Tres Leches"
  },
  {
    "id": 51,
    "nombre": "TRES LECHE SHOTS",
    "categoria": "Tres Leches",
    "descripcion": "",
    "rendimiento_base": 12,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 79,
        "cantidad": 403,
        "tipo": "fijo"
      },
      {
        "insumo_id": 87,
        "cantidad": 312,
        "tipo": "fijo"
      },
      {
        "insumo_id": 89,
        "cantidad": 200,
        "tipo": "variable"
      },
      {
        "insumo_id": 83,
        "cantidad": 12,
        "tipo": "variable"
      },
      {
        "insumo_id": 90,
        "cantidad": 12,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Tres Leches"
  },
  {
    "id": 52,
    "nombre": "TRES LECHES DE COCO",
    "categoria": "Tres Leches",
    "descripcion": "",
    "rendimiento_base": 12,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 79,
        "cantidad": 403,
        "tipo": "fijo"
      },
      {
        "insumo_id": 91,
        "cantidad": 425,
        "tipo": "fijo"
      },
      {
        "insumo_id": 92,
        "cantidad": 444,
        "tipo": "fijo"
      },
      {
        "insumo_id": 93,
        "cantidad": 297,
        "tipo": "fijo"
      },
      {
        "insumo_id": 89,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 78,
        "cantidad": 12,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Tres Leches"
  },
  {
    "id": 53,
    "nombre": "TORTA DE VAINILLA",
    "categoria": "Tortas",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "LB",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 94,
        "cantidad": 453.59,
        "tipo": "fijo"
      },
      {
        "insumo_id": 95,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 96,
        "cantidad": 0.5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 97,
        "cantidad": 0.25,
        "tipo": "fijo"
      },
      {
        "insumo_id": 98,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 99,
        "cantidad": 2,
        "tipo": "variable"
      },
      {
        "insumo_id": 100,
        "cantidad": 100,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Torta de Vainilla"
  },
  {
    "id": 54,
    "nombre": "SUSPIRITOS",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 24,
    "rendimiento_unidad": "MINIMO",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 2,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 98,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Suspiritos"
  },
  {
    "id": 55,
    "nombre": "Marquesa de limon",
    "categoria": "Postres",
    "descripcion": "",
    "rendimiento_base": 1,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 79,
        "cantidad": 403,
        "tipo": "fijo"
      },
      {
        "insumo_id": 82,
        "cantidad": 6,
        "tipo": "variable"
      },
      {
        "insumo_id": 78,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Marquesa de Limón"
  },
  {
    "id": 56,
    "nombre": "DEDITOS DE NOVIA",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 42,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 7,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 101,
        "cantidad": 145,
        "tipo": "fijo"
      },
      {
        "insumo_id": 47,
        "cantidad": 80,
        "tipo": "variable"
      },
      {
        "insumo_id": 32,
        "cantidad": 42,
        "tipo": "variable"
      },
      {
        "insumo_id": 1,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 227,
        "tipo": "fijo"
      }
    ],
    "nombre_base": "Deditos de Novia"
  },
  {
    "id": 57,
    "nombre": "Polvorones",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 45,
    "rendimiento_unidad": "- de 15Grm",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 338,
        "tipo": "fijo"
      },
      {
        "insumo_id": 47,
        "cantidad": 75,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 7,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 102,
        "cantidad": 80,
        "tipo": "fijo"
      },
      {
        "insumo_id": 63,
        "cantidad": 30,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Polvorones"
  },
  {
    "id": 58,
    "nombre": "Polvorones",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 65,
    "rendimiento_unidad": "- de 10Grm",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 338,
        "tipo": "fijo"
      },
      {
        "insumo_id": 47,
        "cantidad": 75,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 7,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 102,
        "cantidad": 80,
        "tipo": "fijo"
      },
      {
        "insumo_id": 63,
        "cantidad": 40,
        "tipo": "variable"
      },
      {
        "insumo_id": 103,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Polvorones"
  },
  {
    "id": 59,
    "nombre": "BESITOS DE NUEZ",
    "categoria": "Galletas",
    "descripcion": "",
    "rendimiento_base": 46,
    "rendimiento_unidad": "- de 16Grm",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 280,
        "tipo": "fijo"
      },
      {
        "insumo_id": 47,
        "cantidad": 90,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 104,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 102,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 63,
        "cantidad": 30,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Besitos de Nuez"
  },
  {
    "id": 60,
    "nombre": "TAQUITOS DE HOJALDRE",
    "categoria": "Panes y Salados",
    "descripcion": "",
    "rendimiento_base": 50,
    "rendimiento_unidad": "unidad",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [],
    "ingredientes": [
      {
        "insumo_id": 105,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 106,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 78,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 74,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 48,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "nombre_base": "Taquitos de Hojaldre"
  }
];

// ==============================================================================
// COTIZACIONES Y PEDIDOS INICIALES (LIMPIOS)
// ==============================================================================
export const INITIAL_COTIZACIONES: Cotizacion[] = [];
export const INITIAL_PEDIDOS: Pedido[] = [];
export const INITIAL_MERMAS: Merma[] = [];

// ==============================================================================
// USUARIOS OFICIALES DEL SISTEMA
// ==============================================================================
export const INITIAL_USUARIOS: Usuario[] = [
  {
    "id": 1,
    "username": "Steven9909",
    "password": "@Manzana0104",
    "nombre_completo": "Steven Contreras (Admin Maestro)",
    "email": "admin@deliciasdelvalle.com",
    "telefono": "+1 (809) 555-0101",
    "rol": "admin",
    "activo": true,
    "created_at": "2026-09-01T18:34:00.071044+00:00"
  },
  {
    "id": 2,
    "username": "Rmarpa",
    "password": "010203aaa",
    "nombre_completo": "Rmarpa (Co-Administrador)",
    "email": "rmarpa@deliciasdelvalle.com",
    "telefono": "+1 (809) 555-0102",
    "rol": "coadmin",
    "activo": true,
    "created_at": "2026-09-01T18:34:00.261566+00:00"
  },
  {
    "id": 3,
    "username": "Vgarcia",
    "password": "010203aaa",
    "nombre_completo": "Vgarcia (Co-Administrador)",
    "email": "vgarcia@deliciasdelvalle.com",
    "telefono": "+1 (809) 555-0103",
    "rol": "coadmin",
    "activo": true,
    "created_at": "2026-09-01T18:42:37.682035+00:00"
  }
];
