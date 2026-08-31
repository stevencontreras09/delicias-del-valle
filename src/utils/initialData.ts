import { Insumo, Receta, Cotizacion, Pedido, Merma, Usuario } from '../types';

// ==============================================================================
// 93 INSUMOS ÚNICOS NORMALIZADOS DE PASTELERÍA Y PANADERÍA ARTESANAL (DOP / RD$)
// ==============================================================================
export const INITIAL_INSUMOS: Insumo[] = [
  {
    "id": 1,
    "nombre": "Harina de Trigo Todo Uso (Especial Repostería)",
    "categoria": "Harinas y Féculas",
    "unidad_compra": "Saco 50 kg",
    "precio_compra": 2750,
    "presentacion_empaque": 50000,
    "unidad_base": "g",
    "factor_conversion": 50000,
    "costo_unitario_base": 0.055,
    "stock_actual": 100000,
    "stock_minimo": 10000,
    "activo": true
  },
  {
    "id": 2,
    "nombre": "Harina de Trigo Fuerza (Panadería)",
    "categoria": "Harinas y Féculas",
    "unidad_compra": "Saco 50 kg",
    "precio_compra": 2900,
    "presentacion_empaque": 50000,
    "unidad_base": "g",
    "factor_conversion": 50000,
    "costo_unitario_base": 0.058,
    "stock_actual": 100000,
    "stock_minimo": 10000,
    "activo": true
  },
  {
    "id": 3,
    "nombre": "Harina de Almendras Pura Extra Fina",
    "categoria": "Harinas y Féculas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 850,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.85,
    "stock_actual": 50000,
    "stock_minimo": 800,
    "activo": true
  },
  {
    "id": 4,
    "nombre": "Fécula de Maíz (Maicena)",
    "categoria": "Harinas y Féculas",
    "unidad_compra": "Caja 1 kg",
    "precio_compra": 170,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.17,
    "stock_actual": 50000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 5,
    "nombre": "Harina de Avena Integral",
    "categoria": "Harinas y Féculas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 195,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.195,
    "stock_actual": 50000,
    "stock_minimo": 500,
    "activo": true
  },
  {
    "id": 6,
    "nombre": "Harina de Centeno Integral",
    "categoria": "Harinas y Féculas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 250,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.25,
    "stock_actual": 50000,
    "stock_minimo": 500,
    "activo": true
  },
  {
    "id": 7,
    "nombre": "Fécula de Yuca / Almidón Agrio",
    "categoria": "Harinas y Féculas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 210,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.21,
    "stock_actual": 50000,
    "stock_minimo": 600,
    "activo": true
  },
  {
    "id": 8,
    "nombre": "Salvado de Trigo",
    "categoria": "Harinas y Féculas",
    "unidad_compra": "Bolsa 500 g",
    "precio_compra": 95,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 500,
    "costo_unitario_base": 0.19,
    "stock_actual": 50000,
    "stock_minimo": 300,
    "activo": true
  },
  {
    "id": 9,
    "nombre": "Azúcar Blanco Refinado Especial",
    "categoria": "Azúcares y Endulzantes",
    "unidad_compra": "Saco 50 kg",
    "precio_compra": 2550,
    "presentacion_empaque": 50000,
    "unidad_base": "g",
    "factor_conversion": 50000,
    "costo_unitario_base": 0.051,
    "stock_actual": 100000,
    "stock_minimo": 8000,
    "activo": true
  },
  {
    "id": 10,
    "nombre": "Azúcar Morena / Mascabado Artesanal",
    "categoria": "Azúcares y Endulzantes",
    "unidad_compra": "Bolsa 2.5 kg",
    "precio_compra": 340,
    "presentacion_empaque": 2500,
    "unidad_base": "g",
    "factor_conversion": 2500,
    "costo_unitario_base": 0.136,
    "stock_actual": 50000,
    "stock_minimo": 2000,
    "activo": true
  },
  {
    "id": 11,
    "nombre": "Azúcar Glass / Micropulverizada 4X",
    "categoria": "Azúcares y Endulzantes",
    "unidad_compra": "Bolsa 5 kg",
    "precio_compra": 590,
    "presentacion_empaque": 5000,
    "unidad_base": "g",
    "factor_conversion": 5000,
    "costo_unitario_base": 0.118,
    "stock_actual": 50000,
    "stock_minimo": 3000,
    "activo": true
  },
  {
    "id": 12,
    "nombre": "Miel de Abejas 100% Pura",
    "categoria": "Azúcares y Endulzantes",
    "unidad_compra": "Frasco 1000 g",
    "precio_compra": 520,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.52,
    "stock_actual": 50000,
    "stock_minimo": 500,
    "activo": true
  },
  {
    "id": 13,
    "nombre": "Jarabe de Glucosa Repostera",
    "categoria": "Azúcares y Endulzantes",
    "unidad_compra": "Tarro 1000 g",
    "precio_compra": 260,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.26,
    "stock_actual": 50000,
    "stock_minimo": 400,
    "activo": true
  },
  {
    "id": 14,
    "nombre": "Jarabe de Arce Puro (Maple)",
    "categoria": "Azúcares y Endulzantes",
    "unidad_compra": "Botella 500 ml",
    "precio_compra": 690,
    "presentacion_empaque": 500,
    "unidad_base": "ml",
    "factor_conversion": 500,
    "costo_unitario_base": 1.38,
    "stock_actual": 50000,
    "stock_minimo": 200,
    "activo": true
  },
  {
    "id": 15,
    "nombre": "Azúcar Invertido",
    "categoria": "Azúcares y Endulzantes",
    "unidad_compra": "Envase 1 kg",
    "precio_compra": 310,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.31,
    "stock_actual": 50000,
    "stock_minimo": 300,
    "activo": true
  },
  {
    "id": 16,
    "nombre": "Mantequilla Sin Sal 82% Grasa (Pastelera)",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Bloque 5 kg",
    "precio_compra": 2350,
    "presentacion_empaque": 5000,
    "unidad_base": "g",
    "factor_conversion": 5000,
    "costo_unitario_base": 0.47,
    "stock_actual": 10000,
    "stock_minimo": 2500,
    "activo": true
  },
  {
    "id": 17,
    "nombre": "Mantequilla Con Sal Artesanal",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Bloque 1 kg",
    "precio_compra": 495,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.495,
    "stock_actual": 3000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 18,
    "nombre": "Margarina Hojaldre Especial",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Caja 5 kg",
    "precio_compra": 990,
    "presentacion_empaque": 5000,
    "unidad_base": "g",
    "factor_conversion": 5000,
    "costo_unitario_base": 0.198,
    "stock_actual": 10000,
    "stock_minimo": 2000,
    "activo": true
  },
  {
    "id": 19,
    "nombre": "Manteca Vegetal Repostera",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Bloque 2 kg",
    "precio_compra": 420,
    "presentacion_empaque": 2000,
    "unidad_base": "g",
    "factor_conversion": 2000,
    "costo_unitario_base": 0.21,
    "stock_actual": 4000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 20,
    "nombre": "Aceite de Girasol / Canola Neutro",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Garrafa 5 L",
    "precio_compra": 860,
    "presentacion_empaque": 5000,
    "unidad_base": "ml",
    "factor_conversion": 5000,
    "costo_unitario_base": 0.172,
    "stock_actual": 10000,
    "stock_minimo": 2000,
    "activo": true
  },
  {
    "id": 21,
    "nombre": "Aceite de Oliva Extra Virgen",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Botella 1 L",
    "precio_compra": 590,
    "presentacion_empaque": 1000,
    "unidad_base": "ml",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.59,
    "stock_actual": 2000,
    "stock_minimo": 500,
    "activo": true
  },
  {
    "id": 22,
    "nombre": "Aceite de Coco Virgen",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Frasco 500 ml",
    "precio_compra": 390,
    "presentacion_empaque": 500,
    "unidad_base": "ml",
    "factor_conversion": 500,
    "costo_unitario_base": 0.78,
    "stock_actual": 1000,
    "stock_minimo": 200,
    "activo": true
  },
  {
    "id": 23,
    "nombre": "Leche Entera Pasteurizada",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Caja 12 L",
    "precio_compra": 840,
    "presentacion_empaque": 12000,
    "unidad_base": "ml",
    "factor_conversion": 12000,
    "costo_unitario_base": 0.07,
    "stock_actual": 24000,
    "stock_minimo": 4000,
    "activo": true
  },
  {
    "id": 24,
    "nombre": "Crema de Leche 35% Grasa (Heavy Cream)",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Litro 1000 ml",
    "precio_compra": 295,
    "presentacion_empaque": 1000,
    "unidad_base": "ml",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.295,
    "stock_actual": 6000,
    "stock_minimo": 2000,
    "activo": true
  },
  {
    "id": 25,
    "nombre": "Queso Crema Tipo Philadelphia Profesional",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Bloque 2 kg",
    "precio_compra": 1050,
    "presentacion_empaque": 2000,
    "unidad_base": "g",
    "factor_conversion": 2000,
    "costo_unitario_base": 0.525,
    "stock_actual": 6000,
    "stock_minimo": 2000,
    "activo": true
  },
  {
    "id": 26,
    "nombre": "Queso Mascarpone Artesanal",
    "categoria": "Lácteos y Grasas",
    "precio_compra": 420,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 500,
    "costo_unitario_base": 0.84,
    "stock_actual": 1200,
    "stock_minimo": 400,
    "activo": true,
    "unidad_compra": "Pote 500 g"
  },
  {
    "id": 27,
    "nombre": "Leche Condensada Azucarada",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Lata 395 g",
    "precio_compra": 125,
    "presentacion_empaque": 395,
    "unidad_base": "g",
    "factor_conversion": 395,
    "costo_unitario_base": 0.316456,
    "stock_actual": 3600,
    "stock_minimo": 1200,
    "activo": true
  },
  {
    "id": 28,
    "nombre": "Leche Evaporada",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Lata 400 g",
    "precio_compra": 115,
    "presentacion_empaque": 400,
    "unidad_base": "g",
    "factor_conversion": 400,
    "costo_unitario_base": 0.2875,
    "stock_actual": 3600,
    "stock_minimo": 1200,
    "activo": true
  },
  {
    "id": 29,
    "nombre": "Dulce de Leche / Arequipe Repostero Manga",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Manga 1 kg",
    "precio_compra": 290,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.29,
    "stock_actual": 4500,
    "stock_minimo": 1500,
    "activo": true
  },
  {
    "id": 30,
    "nombre": "Suero de Mantequilla / Buttermilk",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Litro 1000 ml",
    "precio_compra": 195,
    "presentacion_empaque": 1000,
    "unidad_base": "ml",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.195,
    "stock_actual": 2400,
    "stock_minimo": 800,
    "activo": true
  },
  {
    "id": 31,
    "nombre": "Crema Chantilly Vegetal Líquida",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Caja 1 L",
    "precio_compra": 230,
    "presentacion_empaque": 1000,
    "unidad_base": "ml",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.23,
    "stock_actual": 4500,
    "stock_minimo": 1500,
    "activo": true
  },
  {
    "id": 32,
    "nombre": "Yogurt Griego Natural Sin Azúcar",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Pote 1 kg",
    "precio_compra": 280,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.28,
    "stock_actual": 2000,
    "stock_minimo": 600,
    "activo": true
  },
  {
    "id": 33,
    "nombre": "Queso Parmesano Rallado Fino",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Bolsa 500 g",
    "precio_compra": 450,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 500,
    "costo_unitario_base": 0.9,
    "stock_actual": 1200,
    "stock_minimo": 400,
    "activo": true
  },
  {
    "id": 34,
    "nombre": "Queso Mozzarella Bloque",
    "categoria": "Lácteos y Grasas",
    "unidad_compra": "Bloque 2.5 kg",
    "precio_compra": 920,
    "presentacion_empaque": 2500,
    "unidad_base": "g",
    "factor_conversion": 2500,
    "costo_unitario_base": 0.368,
    "stock_actual": 5000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 35,
    "nombre": "Huevos Frescos Grado AA (55-60g c/u)",
    "categoria": "Huevos",
    "unidad_compra": "Panal 30 ud",
    "precio_compra": 270,
    "presentacion_empaque": 30,
    "unidad_base": "ud",
    "factor_conversion": 30,
    "costo_unitario_base": 9,
    "stock_actual": 135,
    "stock_minimo": 45,
    "activo": true
  },
  {
    "id": 36,
    "nombre": "Claras de Huevo Pasteurizadas",
    "categoria": "Huevos",
    "unidad_compra": "Botella 1000 ml",
    "precio_compra": 290,
    "presentacion_empaque": 1000,
    "unidad_base": "ml",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.29,
    "stock_actual": 2400,
    "stock_minimo": 800,
    "activo": true
  },
  {
    "id": 37,
    "nombre": "Yemas de Huevo Pasteurizadas",
    "categoria": "Huevos",
    "unidad_compra": "Botella 1000 ml",
    "precio_compra": 375,
    "presentacion_empaque": 1000,
    "unidad_base": "ml",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.375,
    "stock_actual": 2000,
    "stock_minimo": 500,
    "activo": true
  },
  {
    "id": 38,
    "nombre": "Chocolate Cobertura Semiamargo 56% Belga",
    "categoria": "Chocolates y Cacaos",
    "unidad_compra": "Bolsa 2.5 kg",
    "precio_compra": 1680,
    "presentacion_empaque": 2500,
    "unidad_base": "g",
    "factor_conversion": 2500,
    "costo_unitario_base": 0.672,
    "stock_actual": 5000,
    "stock_minimo": 1500,
    "activo": true
  },
  {
    "id": 39,
    "nombre": "Chocolate Cobertura Blanco 30% Belga",
    "categoria": "Chocolates y Cacaos",
    "unidad_compra": "Bolsa 2.5 kg",
    "precio_compra": 1750,
    "presentacion_empaque": 2500,
    "unidad_base": "g",
    "factor_conversion": 2500,
    "costo_unitario_base": 0.7,
    "stock_actual": 5000,
    "stock_minimo": 1200,
    "activo": true
  },
  {
    "id": 40,
    "nombre": "Chocolate Cobertura con Leche 38%",
    "categoria": "Chocolates y Cacaos",
    "unidad_compra": "Bolsa 2.5 kg",
    "precio_compra": 1700,
    "presentacion_empaque": 2500,
    "unidad_base": "g",
    "factor_conversion": 2500,
    "costo_unitario_base": 0.68,
    "stock_actual": 5000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 41,
    "nombre": "Cacao en Polvo Alcalino 100% Puro",
    "categoria": "Chocolates y Cacaos",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 580,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.58,
    "stock_actual": 3000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 42,
    "nombre": "Gotas de Chocolate Horneables Semidulces",
    "categoria": "Chocolates y Cacaos",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 435,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.435,
    "stock_actual": 2400,
    "stock_minimo": 800,
    "activo": true
  },
  {
    "id": 43,
    "nombre": "Gotas de Chocolate Blanco Horneables",
    "categoria": "Chocolates y Cacaos",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 470,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.47,
    "stock_actual": 2000,
    "stock_minimo": 500,
    "activo": true
  },
  {
    "id": 44,
    "nombre": "Nutella / Crema de Avellanas con Cacao",
    "categoria": "Chocolates y Cacaos",
    "unidad_compra": "Frasco 3 kg",
    "precio_compra": 1590,
    "presentacion_empaque": 3000,
    "unidad_base": "g",
    "factor_conversion": 3000,
    "costo_unitario_base": 0.53,
    "stock_actual": 6000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 45,
    "nombre": "Manteca de Cacao Pura",
    "categoria": "Chocolates y Cacaos",
    "unidad_compra": "Bloque 1 kg",
    "precio_compra": 1100,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 1.1,
    "stock_actual": 2000,
    "stock_minimo": 300,
    "activo": true
  },
  {
    "id": 46,
    "nombre": "Fresas Frescas Seleccionadas",
    "categoria": "Frutas y Mermeladas",
    "unidad_compra": "Caja 1 kg",
    "precio_compra": 270,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.27,
    "stock_actual": 4500,
    "stock_minimo": 1500,
    "activo": true
  },
  {
    "id": 47,
    "nombre": "Arándanos Frescos",
    "categoria": "Frutas y Mermeladas",
    "unidad_compra": "Caja 500 g",
    "precio_compra": 315,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 500,
    "costo_unitario_base": 0.63,
    "stock_actual": 1000,
    "stock_minimo": 300,
    "activo": true
  },
  {
    "id": 48,
    "nombre": "Frambuesas Frescas / IQF",
    "categoria": "Frutas y Mermeladas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 590,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.59,
    "stock_actual": 2000,
    "stock_minimo": 600,
    "activo": true
  },
  {
    "id": 49,
    "nombre": "Moras Silvestres",
    "categoria": "Frutas y Mermeladas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 230,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.23,
    "stock_actual": 2400,
    "stock_minimo": 800,
    "activo": true
  },
  {
    "id": 50,
    "nombre": "Pulpa de Maracuyá / Chinola 100% Pura",
    "categoria": "Frutas y Mermeladas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 240,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.24,
    "stock_actual": 3000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 51,
    "nombre": "Limones Frescos (Zumo y Ralladura)",
    "categoria": "Frutas y Mermeladas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 135,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.135,
    "stock_actual": 2400,
    "stock_minimo": 800,
    "activo": true
  },
  {
    "id": 52,
    "nombre": "Manzanas Granny Smith (Verdes)",
    "categoria": "Frutas y Mermeladas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 185,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.185,
    "stock_actual": 3000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 53,
    "nombre": "Zanahoria Fresca Rallada",
    "categoria": "Frutas y Mermeladas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 90,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.09,
    "stock_actual": 3000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 54,
    "nombre": "Banano / Guineo Maduro",
    "categoria": "Frutas y Mermeladas",
    "unidad_compra": "Racimo 1 kg",
    "precio_compra": 85,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.085,
    "stock_actual": 2000,
    "stock_minimo": 600,
    "activo": true
  },
  {
    "id": 55,
    "nombre": "Mermelada Artesanal de Frutos Rojos",
    "categoria": "Frutas y Mermeladas",
    "unidad_compra": "Frasco 1 kg",
    "precio_compra": 375,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.375,
    "stock_actual": 3000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 56,
    "nombre": "Cerezas Marrasquino con Tallo",
    "categoria": "Frutas y Mermeladas",
    "unidad_compra": "Frasco 500 g",
    "precio_compra": 290,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 500,
    "costo_unitario_base": 0.58,
    "stock_actual": 1000,
    "stock_minimo": 250,
    "activo": true
  },
  {
    "id": 57,
    "nombre": "Nueces del Nogal Picadas",
    "categoria": "Frutos Secos y Semillas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 775,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.775,
    "stock_actual": 2000,
    "stock_minimo": 600,
    "activo": true
  },
  {
    "id": 58,
    "nombre": "Almendras Fileteadas Tostadas",
    "categoria": "Frutos Secos y Semillas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 820,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.82,
    "stock_actual": 2000,
    "stock_minimo": 500,
    "activo": true
  },
  {
    "id": 59,
    "nombre": "Pistachos Pelados Sin Sal",
    "categoria": "Frutos Secos y Semillas",
    "unidad_compra": "Bolsa 500 g",
    "precio_compra": 665,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 500,
    "costo_unitario_base": 1.33,
    "stock_actual": 1000,
    "stock_minimo": 200,
    "activo": true
  },
  {
    "id": 60,
    "nombre": "Coco Rallado Deshidratado Sin Azúcar",
    "categoria": "Frutos Secos y Semillas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 290,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.29,
    "stock_actual": 2000,
    "stock_minimo": 600,
    "activo": true
  },
  {
    "id": 61,
    "nombre": "Semillas de Amapola",
    "categoria": "Frutos Secos y Semillas",
    "unidad_compra": "Bolsa 250 g",
    "precio_compra": 210,
    "presentacion_empaque": 250,
    "unidad_base": "g",
    "factor_conversion": 250,
    "costo_unitario_base": 0.84,
    "stock_actual": 500,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 62,
    "nombre": "Semillas de Chía Orgánicas",
    "categoria": "Frutos Secos y Semillas",
    "unidad_compra": "Bolsa 500 g",
    "precio_compra": 195,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 500,
    "costo_unitario_base": 0.39,
    "stock_actual": 1000,
    "stock_minimo": 200,
    "activo": true
  },
  {
    "id": 63,
    "nombre": "Ajonjolí Tostado / Sésamo",
    "categoria": "Frutos Secos y Semillas",
    "unidad_compra": "Bolsa 500 g",
    "precio_compra": 170,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 500,
    "costo_unitario_base": 0.34,
    "stock_actual": 1000,
    "stock_minimo": 300,
    "activo": true
  },
  {
    "id": 64,
    "nombre": "Uvas Pasas Rubias / Morenas",
    "categoria": "Frutos Secos y Semillas",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 270,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.27,
    "stock_actual": 2000,
    "stock_minimo": 500,
    "activo": true
  },
  {
    "id": 65,
    "nombre": "Polvo para Hornear Doble Acción",
    "categoria": "Leudantes y Químicos",
    "unidad_compra": "Lata 1 kg",
    "precio_compra": 335,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.335,
    "stock_actual": 2400,
    "stock_minimo": 800,
    "activo": true
  },
  {
    "id": 66,
    "nombre": "Bicarbonato de Sodio Grado Alimenticio",
    "categoria": "Leudantes y Químicos",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 195,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.195,
    "stock_actual": 2000,
    "stock_minimo": 600,
    "activo": true
  },
  {
    "id": 67,
    "nombre": "Levadura Seca Instantánea de Panadería",
    "categoria": "Leudantes y Químicos",
    "unidad_compra": "Paquete 500 g",
    "precio_compra": 230,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 500,
    "costo_unitario_base": 0.46,
    "stock_actual": 1500,
    "stock_minimo": 500,
    "activo": true
  },
  {
    "id": 68,
    "nombre": "Sal Marina Fina de Cocina",
    "categoria": "Leudantes y Químicos",
    "unidad_compra": "Bolsa 1 kg",
    "precio_compra": 50,
    "presentacion_empaque": 1000,
    "unidad_base": "g",
    "factor_conversion": 1000,
    "costo_unitario_base": 0.05,
    "stock_actual": 3000,
    "stock_minimo": 1000,
    "activo": true
  },
  {
    "id": 69,
    "nombre": "Sal Marina en Escamas (Fleur de Sel)",
    "categoria": "Leudantes y Químicos",
    "unidad_compra": "Tarro 250 g",
    "precio_compra": 270,
    "presentacion_empaque": 250,
    "unidad_base": "g",
    "factor_conversion": 250,
    "costo_unitario_base": 1.08,
    "stock_actual": 500,
    "stock_minimo": 150,
    "activo": true
  },
  {
    "id": 70,
    "nombre": "Gelatina Sin Sabor / Grenetina 250 Bloom",
    "categoria": "Leudantes y Químicos",
    "unidad_compra": "Bolsa 500 g",
    "precio_compra": 435,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 500,
    "costo_unitario_base": 0.87,
    "stock_actual": 1000,
    "stock_minimo": 300,
    "activo": true
  },
  {
    "id": 71,
    "nombre": "Cremor Tártaro",
    "categoria": "Leudantes y Químicos",
    "unidad_compra": "Tarro 250 g",
    "precio_compra": 215,
    "presentacion_empaque": 250,
    "unidad_base": "g",
    "factor_conversion": 250,
    "costo_unitario_base": 0.86,
    "stock_actual": 500,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 72,
    "nombre": "CMC / Goma Xantana",
    "categoria": "Leudantes y Químicos",
    "unidad_compra": "Tarro 200 g",
    "precio_compra": 255,
    "presentacion_empaque": 200,
    "unidad_base": "g",
    "factor_conversion": 200,
    "costo_unitario_base": 1.275,
    "stock_actual": 400,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 73,
    "nombre": "Extracto Puro de Vainilla de Madagascar",
    "categoria": "Esencias y Colorantes",
    "unidad_compra": "Frasco 500 ml",
    "precio_compra": 1120,
    "presentacion_empaque": 500,
    "unidad_base": "ml",
    "factor_conversion": 500,
    "costo_unitario_base": 2.24,
    "stock_actual": 1000,
    "stock_minimo": 200,
    "activo": true
  },
  {
    "id": 74,
    "nombre": "Pasta de Vainilla con Semillas Naturales",
    "categoria": "Esencias y Colorantes",
    "unidad_compra": "Tubo 200 g",
    "precio_compra": 910,
    "presentacion_empaque": 200,
    "unidad_base": "g",
    "factor_conversion": 200,
    "costo_unitario_base": 4.55,
    "stock_actual": 400,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 75,
    "nombre": "Extracto de Almendras Amargas",
    "categoria": "Esencias y Colorantes",
    "unidad_compra": "Frasco 120 ml",
    "precio_compra": 255,
    "presentacion_empaque": 120,
    "unidad_base": "ml",
    "factor_conversion": 120,
    "costo_unitario_base": 2.125,
    "stock_actual": 240,
    "stock_minimo": 50,
    "activo": true
  },
  {
    "id": 76,
    "nombre": "Canela en Polvo Ceilán Extra Fina",
    "categoria": "Esencias y Colorantes",
    "unidad_compra": "Tarro 500 g",
    "precio_compra": 410,
    "presentacion_empaque": 500,
    "unidad_base": "g",
    "factor_conversion": 500,
    "costo_unitario_base": 0.82,
    "stock_actual": 1000,
    "stock_minimo": 200,
    "activo": true
  },
  {
    "id": 77,
    "nombre": "Nuez Moscada Molida",
    "categoria": "Esencias y Colorantes",
    "unidad_compra": "Frasco 100 g",
    "precio_compra": 190,
    "presentacion_empaque": 100,
    "unidad_base": "g",
    "factor_conversion": 100,
    "costo_unitario_base": 1.9,
    "stock_actual": 200,
    "stock_minimo": 40,
    "activo": true
  },
  {
    "id": 78,
    "nombre": "Jengibre en Polvo",
    "categoria": "Esencias y Colorantes",
    "unidad_compra": "Tarro 250 g",
    "precio_compra": 205,
    "presentacion_empaque": 250,
    "unidad_base": "g",
    "factor_conversion": 250,
    "costo_unitario_base": 0.82,
    "stock_actual": 500,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 79,
    "nombre": "Café Espresso Instantáneo Liofilizado",
    "categoria": "Esencias y Colorantes",
    "unidad_compra": "Frasco 200 g",
    "precio_compra": 390,
    "presentacion_empaque": 200,
    "unidad_base": "g",
    "factor_conversion": 200,
    "costo_unitario_base": 1.95,
    "stock_actual": 400,
    "stock_minimo": 100,
    "activo": true
  },
  {
    "id": 80,
    "nombre": "Ron Dominicano Añejo Repostería",
    "categoria": "Esencias y Colorantes",
    "unidad_compra": "Botella 750 ml",
    "precio_compra": 640,
    "presentacion_empaque": 750,
    "unidad_base": "ml",
    "factor_conversion": 750,
    "costo_unitario_base": 0.853333,
    "stock_actual": 1500,
    "stock_minimo": 300,
    "activo": true
  },
  {
    "id": 81,
    "nombre": "Licor de Café / Kahlúa",
    "categoria": "Esencias y Colorantes",
    "unidad_compra": "Botella 700 ml",
    "precio_compra": 790,
    "presentacion_empaque": 700,
    "unidad_base": "ml",
    "factor_conversion": 700,
    "costo_unitario_base": 1.128571,
    "stock_actual": 1400,
    "stock_minimo": 200,
    "activo": true
  },
  {
    "id": 82,
    "nombre": "Colorante en Gel Rojo Navidad / Red Velvet",
    "categoria": "Esencias y Colorantes",
    "unidad_compra": "Frasco 100 g",
    "precio_compra": 230,
    "presentacion_empaque": 100,
    "unidad_base": "g",
    "factor_conversion": 100,
    "costo_unitario_base": 2.3,
    "stock_actual": 200,
    "stock_minimo": 50,
    "activo": true
  },
  {
    "id": 83,
    "nombre": "Colorantes en Gel Surtidos (Kit Profesional)",
    "categoria": "Esencias y Colorantes",
    "unidad_compra": "Kit 12x25g (300g)",
    "precio_compra": 990,
    "presentacion_empaque": 300,
    "unidad_base": "g",
    "factor_conversion": 300,
    "costo_unitario_base": 3.3,
    "stock_actual": 600,
    "stock_minimo": 150,
    "activo": true
  },
  {
    "id": 84,
    "nombre": "Caja de Torta 1 LB con Ventana Transparente",
    "categoria": "Empaques y Desechables",
    "unidad_compra": "Paquete 50 ud",
    "precio_compra": 2100,
    "presentacion_empaque": 50,
    "unidad_base": "ud",
    "factor_conversion": 50,
    "costo_unitario_base": 42,
    "stock_actual": 100,
    "stock_minimo": 25,
    "activo": true
  },
  {
    "id": 85,
    "nombre": "Caja de Torta 1/2 LB con Ventana",
    "categoria": "Empaques y Desechables",
    "unidad_compra": "Paquete 50 ud",
    "precio_compra": 1700,
    "presentacion_empaque": 50,
    "unidad_base": "ud",
    "factor_conversion": 50,
    "costo_unitario_base": 34,
    "stock_actual": 100,
    "stock_minimo": 20,
    "activo": true
  },
  {
    "id": 86,
    "nombre": "Base Rígida para Torta 25 cm",
    "categoria": "Empaques y Desechables",
    "unidad_compra": "Paquete 25 ud",
    "precio_compra": 680,
    "presentacion_empaque": 25,
    "unidad_base": "ud",
    "factor_conversion": 25,
    "costo_unitario_base": 27.2,
    "stock_actual": 50,
    "stock_minimo": 15,
    "activo": true
  },
  {
    "id": 87,
    "nombre": "Base Rígida para Torta 18 cm",
    "categoria": "Empaques y Desechables",
    "unidad_compra": "Paquete 25 ud",
    "precio_compra": 530,
    "presentacion_empaque": 25,
    "unidad_base": "ud",
    "factor_conversion": 25,
    "costo_unitario_base": 21.2,
    "stock_actual": 50,
    "stock_minimo": 15,
    "activo": true
  },
  {
    "id": 88,
    "nombre": "Caja para 6 Cupcakes con Insertos",
    "categoria": "Empaques y Desechables",
    "unidad_compra": "Paquete 25 ud",
    "precio_compra": 830,
    "presentacion_empaque": 25,
    "unidad_base": "ud",
    "factor_conversion": 25,
    "costo_unitario_base": 33.2,
    "stock_actual": 50,
    "stock_minimo": 12,
    "activo": true
  },
  {
    "id": 89,
    "nombre": "Caja para 12 Cupcakes con Insertos",
    "categoria": "Empaques y Desechables",
    "unidad_compra": "Paquete 25 ud",
    "precio_compra": 1130,
    "presentacion_empaque": 25,
    "unidad_base": "ud",
    "factor_conversion": 25,
    "costo_unitario_base": 45.2,
    "stock_actual": 50,
    "stock_minimo": 10,
    "activo": true
  },
  {
    "id": 90,
    "nombre": "Capacillos de Papel Horno #8 para Cupcake",
    "categoria": "Empaques y Desechables",
    "unidad_compra": "Paquete 500 ud",
    "precio_compra": 300,
    "presentacion_empaque": 500,
    "unidad_base": "ud",
    "factor_conversion": 500,
    "costo_unitario_base": 0.6,
    "stock_actual": 1000,
    "stock_minimo": 200,
    "activo": true
  },
  {
    "id": 91,
    "nombre": "Caja Domo Transparente para Postres",
    "categoria": "Empaques y Desechables",
    "unidad_compra": "Paquete 100 ud",
    "precio_compra": 970,
    "presentacion_empaque": 100,
    "unidad_base": "ud",
    "factor_conversion": 100,
    "costo_unitario_base": 9.7,
    "stock_actual": 200,
    "stock_minimo": 40,
    "activo": true
  },
  {
    "id": 92,
    "nombre": "Cinta de Tela Satinada Frambuesa / Dorada",
    "categoria": "Empaques y Desechables",
    "unidad_compra": "Rollo 50 metros",
    "precio_compra": 360,
    "presentacion_empaque": 50,
    "unidad_base": "ud",
    "factor_conversion": 50,
    "costo_unitario_base": 7.2,
    "stock_actual": 100,
    "stock_minimo": 10,
    "activo": true
  },
  {
    "id": 93,
    "nombre": "Stickers de Marca y Cierre Delicias del Valle",
    "categoria": "Empaques y Desechables",
    "unidad_compra": "Rollo 500 ud",
    "precio_compra": 900,
    "presentacion_empaque": 500,
    "unidad_base": "ud",
    "factor_conversion": 500,
    "costo_unitario_base": 1.8,
    "stock_actual": 1000,
    "stock_minimo": 100,
    "activo": true
  }
];

// ==============================================================================
// 58 RECETAS MAESTRAS DE PASTELERÍA CON ESTRUCTURA BOM COMPLETA
// Incluye Quesillo Tradicional, Quesillo de Coco, Flan de Queso Crema, Chocoflan y Arequipe
// ==============================================================================
export const INITIAL_RECETAS: Receta[] = [
  {
    "id": 1,
    "nombre": "Torta Tradicional de Vainilla Francesa (1 LB)",
    "categoria": "Tortas y Pasteles",
    "descripcion": "Bizcocho húmedo y esponjoso con extracto puro de vainilla de Madagascar y mantequilla 82%.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 LB (16-20 porciones)",
    "tiempo_preparacion_min": 35,
    "tiempo_horneado_min": 50,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [
      "Batir la mantequilla pomada con el azúcar blanco hasta blanquear y lograr textura cremosa (8-10 min).",
      "Agregar los huevos uno a uno batiendo bien después de cada adición.",
      "Incorporar la vainilla de Madagascar y la sal marina.",
      "Tamizar la harina de repostería con el polvo de hornear y agregar alternando con la leche entera.",
      "Hornear a 175°C por 45-50 min hasta que el palillo salga limpio.",
      "Dejar enfriar completamente antes de desmoldar, rellenar y decorar."
    ],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 500,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 68,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 29,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 31,
        "cantidad": 350,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 92,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 2,
    "nombre": "Torta Red Velvet Terciopelo Rojo (1 LB)",
    "categoria": "Tortas y Pasteles",
    "descripcion": "Elegante bizcocho rojo aterciopelado con un toque sutil de cacao, buttermilk y buttercream de queso crema Philadelphia.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 LB (16-20 porciones)",
    "tiempo_preparacion_min": 40,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "instrucciones": [
      "Mezclar el aceite con el azúcar blanco y los huevos hasta emulsionar.",
      "Añadir el colorante rojo en gel, la vainilla y el cacao tamizado.",
      "Incorporar la harina alternando con el buttermilk.",
      "Al final activar el bicarbonato con vinagre e incorporar de inmediato.",
      "Hornear a 175°C por 40-45 min. Enfriar y rellenar con frosting de queso crema."
    ],
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 400,
        "tipo": "fijo"
      },
      {
        "insumo_id": 20,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 30,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 25,
        "tipo": "fijo"
      },
      {
        "insumo_id": 66,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 82,
        "cantidad": 12,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 25,
        "cantidad": 400,
        "tipo": "variable"
      },
      {
        "insumo_id": 16,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 11,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 3,
    "nombre": "Torta Suprema de Chocolate Suizo 56% (1 LB)",
    "categoria": "Tortas y Pasteles",
    "descripcion": "Para verdaderos amantes del chocolate. Masa húmeda de cacao holandés, rellena de ganache semiamargo y frutos rojos.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 LB (16-20 porciones)",
    "tiempo_preparacion_min": 40,
    "tiempo_horneado_min": 50,
    "temperatura_horno_c": 170,
    "materiales_indirectos_pct": 12,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 400,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 90,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 20,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 79,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 12,
        "tipo": "fijo"
      },
      {
        "insumo_id": 66,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 38,
        "cantidad": 350,
        "tipo": "variable"
      },
      {
        "insumo_id": 24,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 55,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 4,
    "nombre": "Torta de Zanahoria, Nuez y Especias de Ceilán (1 LB)",
    "categoria": "Tortas y Pasteles",
    "descripcion": "Esponjosa y aromática con canela de Ceilán, nuez del nogal crocante y relleno cremoso de queso Philadelphia.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 LB (16-20 porciones)",
    "tiempo_preparacion_min": 45,
    "tiempo_horneado_min": 55,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 53,
        "cantidad": 400,
        "tipo": "fijo"
      },
      {
        "insumo_id": 10,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 20,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 57,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 76,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 77,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 12,
        "tipo": "fijo"
      },
      {
        "insumo_id": 25,
        "cantidad": 350,
        "tipo": "variable"
      },
      {
        "insumo_id": 11,
        "cantidad": 200,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 5,
    "nombre": "Torta Tradicional de Vainilla (½ LB)",
    "categoria": "Tortas y Pasteles",
    "descripcion": "Presentación mediana ideal para reuniones familiares de 8 a 10 personas.",
    "rendimiento_base": 0.5,
    "rendimiento_unidad": "½ LB (8-10 porciones)",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 40,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 225,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 125,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 125,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 68,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 29,
        "cantidad": 140,
        "tipo": "variable"
      },
      {
        "insumo_id": 31,
        "cantidad": 200,
        "tipo": "variable"
      },
      {
        "insumo_id": 85,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 87,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 6,
    "nombre": "Torta Red Velvet (½ LB)",
    "categoria": "Tortas y Pasteles",
    "descripcion": "Versión ½ LB con bizcocho aterciopelado y crema de queso.",
    "rendimiento_base": 0.5,
    "rendimiento_unidad": "½ LB (8-10 porciones)",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 38,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 225,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 20,
        "cantidad": 110,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 30,
        "cantidad": 130,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 13,
        "tipo": "fijo"
      },
      {
        "insumo_id": 66,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 82,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 25,
        "cantidad": 200,
        "tipo": "variable"
      },
      {
        "insumo_id": 16,
        "cantidad": 80,
        "tipo": "variable"
      },
      {
        "insumo_id": 11,
        "cantidad": 130,
        "tipo": "variable"
      },
      {
        "insumo_id": 85,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 87,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 7,
    "nombre": "Torta Suprema de Chocolate (½ LB)",
    "categoria": "Tortas y Pasteles",
    "descripcion": "Presentación ½ LB con ganache de chocolate semiamargo.",
    "rendimiento_base": 0.5,
    "rendimiento_unidad": "½ LB (8-10 porciones)",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 40,
    "temperatura_horno_c": 170,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 45,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 225,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 20,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 38,
        "cantidad": 180,
        "tipo": "variable"
      },
      {
        "insumo_id": 24,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 85,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 87,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 8,
    "nombre": "Torta de Frutos del Bosque y Almendras (1 LB)",
    "categoria": "Tortas y Pasteles",
    "descripcion": "Bizcocho suave de almendras con compota rústica de fresas, moras y frambuesas.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 LB (16-20 porciones)",
    "tiempo_preparacion_min": 40,
    "tiempo_horneado_min": 48,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 380,
        "tipo": "fijo"
      },
      {
        "insumo_id": 3,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 420,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 12,
        "tipo": "fijo"
      },
      {
        "insumo_id": 55,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 46,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 31,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 9,
    "nombre": "Torta Selva Negra Tradicional (1 LB)",
    "categoria": "Tortas y Pasteles",
    "descripcion": "Bizcocho de chocolate humedecido con licor de cerezas, chantilly fresca y cerezas al marrasquino.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 LB (16-20 porciones)",
    "tiempo_preparacion_min": 45,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 80,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 400,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 80,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 24,
        "cantidad": 450,
        "tipo": "variable"
      },
      {
        "insumo_id": 56,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 38,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 10,
    "nombre": "Torta de Naranja y Semillas de Amapola (1 LB)",
    "categoria": "Tortas y Pasteles",
    "descripcion": "Bizcocho aromático con ralladura de cítricos naturales, semillas de amapola y glaseado brillante.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 LB (16-20 porciones)",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 480,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 400,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 61,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 51,
        "cantidad": 50,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 200,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 11,
    "nombre": "Cupcakes de Vainilla Clásicos (Caja x 12)",
    "categoria": "Cupcakes y Muffins",
    "descripcion": "Suaves ponquecitos individuales coronados con buttercream de vainilla y perlas artesanales.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades",
    "tiempo_preparacion_min": 20,
    "tiempo_horneado_min": 22,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 240,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 120,
        "tipo": "variable"
      },
      {
        "insumo_id": 11,
        "cantidad": 240,
        "tipo": "variable"
      },
      {
        "insumo_id": 90,
        "cantidad": 12,
        "tipo": "variable"
      },
      {
        "insumo_id": 89,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 12,
    "nombre": "Cupcakes de Chocolate y Nutella (Caja x 12)",
    "categoria": "Cupcakes y Muffins",
    "descripcion": "Bizcocho húmedo de cacao relleno de Nutella pura y frosting de chocolate semiamargo.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 22,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 45,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 20,
        "cantidad": 90,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 44,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 38,
        "cantidad": 120,
        "tipo": "variable"
      },
      {
        "insumo_id": 90,
        "cantidad": 12,
        "tipo": "variable"
      },
      {
        "insumo_id": 89,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 13,
    "nombre": "Cupcakes Red Velvet con Frosting de Queso (Caja x 12)",
    "categoria": "Cupcakes y Muffins",
    "descripcion": "Terciopelo rojo individual con generoso copete de queso Philadelphia.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 22,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 20,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 30,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 82,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 25,
        "cantidad": 180,
        "tipo": "variable"
      },
      {
        "insumo_id": 16,
        "cantidad": 80,
        "tipo": "variable"
      },
      {
        "insumo_id": 11,
        "cantidad": 120,
        "tipo": "variable"
      },
      {
        "insumo_id": 90,
        "cantidad": 12,
        "tipo": "variable"
      },
      {
        "insumo_id": 89,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 14,
    "nombre": "Cupcakes de Vainilla Clásicos (Caja x 6)",
    "categoria": "Cupcakes y Muffins",
    "descripcion": "Presentación de media docena en caja con ventana.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "6 unidades",
    "tiempo_preparacion_min": 15,
    "tiempo_horneado_min": 22,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 60,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 60,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 60,
        "tipo": "variable"
      },
      {
        "insumo_id": 11,
        "cantidad": 120,
        "tipo": "variable"
      },
      {
        "insumo_id": 90,
        "cantidad": 6,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 15,
    "nombre": "Muffins de Arándanos y Limón (Docena)",
    "categoria": "Cupcakes y Muffins",
    "descripcion": "Muffins esponjosos con arándanos frescos enteros y crumble crocante en la superficie.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades",
    "tiempo_preparacion_min": 20,
    "tiempo_horneado_min": 25,
    "temperatura_horno_c": 190,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 51,
        "cantidad": 20,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 47,
        "cantidad": 180,
        "tipo": "variable"
      },
      {
        "insumo_id": 90,
        "cantidad": 12,
        "tipo": "variable"
      },
      {
        "insumo_id": 89,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 16,
    "nombre": "Muffins de Manzana, Canela y Avena (Docena)",
    "categoria": "Cupcakes y Muffins",
    "descripcion": "Muffins saludables con trozos de manzana verde y avena integral.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades",
    "tiempo_preparacion_min": 20,
    "tiempo_horneado_min": 25,
    "temperatura_horno_c": 185,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 5,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 10,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 20,
        "cantidad": 90,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 76,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 52,
        "cantidad": 200,
        "tipo": "variable"
      },
      {
        "insumo_id": 90,
        "cantidad": 12,
        "tipo": "variable"
      },
      {
        "insumo_id": 89,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 17,
    "nombre": "Muffins de Banano y Chispas de Chocolate (Docena)",
    "categoria": "Cupcakes y Muffins",
    "descripcion": "Masa ultra tierna de banano maduro con gotas de chocolate horneable.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades",
    "tiempo_preparacion_min": 20,
    "tiempo_horneado_min": 25,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 54,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 10,
        "cantidad": 140,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 80,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 42,
        "cantidad": 120,
        "tipo": "variable"
      },
      {
        "insumo_id": 90,
        "cantidad": 12,
        "tipo": "variable"
      },
      {
        "insumo_id": 89,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 18,
    "nombre": "Galletas Choco-Chips estilo New York (Docena)",
    "categoria": "Galletas y Alfajores",
    "descripcion": "Galletas grandes y gruesas: crujientes por fuera y centro chicloso y derretido con nueces y chocolate semiamargo.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades (100g c/u)",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 14,
    "temperatura_horno_c": 190,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 400,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 10,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 66,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 42,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 57,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 19,
    "nombre": "Alfajores de Maicena Tradicionales con Dulce de Leche (Docena)",
    "categoria": "Galletas y Alfajores",
    "descripcion": "Masa ultra suave que se deshace en la boca, rellena de abundante dulce de leche y coco rallado.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades grandes",
    "tiempo_preparacion_min": 35,
    "tiempo_horneado_min": 12,
    "temperatura_horno_c": 160,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 4,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 37,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 51,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 29,
        "cantidad": 350,
        "tipo": "variable"
      },
      {
        "insumo_id": 60,
        "cantidad": 60,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 20,
    "nombre": "Galletas Red Velvet Rellenas de Nutella (Docena)",
    "categoria": "Galletas y Alfajores",
    "descripcion": "Masa aterciopelada roja rellena en el centro con un corazón de Nutella derretida.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 12,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 20,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 10,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 82,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 44,
        "cantidad": 200,
        "tipo": "variable"
      },
      {
        "insumo_id": 43,
        "cantidad": 80,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 21,
    "nombre": "Galletas de Avena, Miel y Pasas (Docena)",
    "categoria": "Galletas y Alfajores",
    "descripcion": "Galletas crocantes y saludables con miel de abejas y canela.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades",
    "tiempo_preparacion_min": 20,
    "tiempo_horneado_min": 15,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 5,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 12,
        "cantidad": 60,
        "tipo": "fijo"
      },
      {
        "insumo_id": 10,
        "cantidad": 80,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 76,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 64,
        "cantidad": 120,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 22,
    "nombre": "Alfajores Marplatenses Bañados en Chocolate 56% (Docena)",
    "categoria": "Galletas y Alfajores",
    "descripcion": "Galletas de cacao y especias, rellenas de abundante arequipe y bañadas en chocolate semiamargo.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades",
    "tiempo_preparacion_min": 45,
    "tiempo_horneado_min": 12,
    "temperatura_horno_c": 170,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 12,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 29,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 38,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 23,
    "nombre": "Galletas de Mantequilla Danesas / Shortbread (Caja x 24)",
    "categoria": "Galletas y Alfajores",
    "descripcion": "Galletitas finas con 100% mantequilla pura y un toque de flor de sal marina.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "24 unidades",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 15,
    "temperatura_horno_c": 165,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 69,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 24,
    "nombre": "Macarons Franceses de Almendra y Frambuesa (Caja x 8)",
    "categoria": "Galletas y Alfajores",
    "descripcion": "Conchas crujientes de harina de almendra con ganache montada de chocolate blanco y frambuesa.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "8 unidades",
    "tiempo_preparacion_min": 50,
    "tiempo_horneado_min": 16,
    "temperatura_horno_c": 150,
    "materiales_indirectos_pct": 12,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 35,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 3,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 36,
        "cantidad": 90,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 82,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 39,
        "cantidad": 120,
        "tipo": "variable"
      },
      {
        "insumo_id": 48,
        "cantidad": 80,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 25,
    "nombre": "Galletas Craqueladas de Chocolate Fudgy (Docena)",
    "categoria": "Galletas y Alfajores",
    "descripcion": "Galletas tipo brownie con costra azucarada blanca y craquelado perfecto.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 12,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 60,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 20,
        "cantidad": 70,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 26,
    "nombre": "Brownie Fudgy de Chocolate Belga y Nuez (Molde 9 porciones)",
    "categoria": "Brownies y Blondies",
    "descripcion": "Brownie denso y melcochudo con 56% chocolate real, mantequilla francesa y nueces crujientes.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "9 porciones (cuadros)",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 30,
    "temperatura_horno_c": 170,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 38,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 10,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 57,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 27,
    "nombre": "Brownie con Remolino de Arequipe Artesanal (Molde 9 porciones)",
    "categoria": "Brownies y Blondies",
    "descripcion": "Base fudgy de chocolate coronada con remolinos dorados de arequipe repostero.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "9 porciones",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 32,
    "temperatura_horno_c": 170,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 38,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 160,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 25,
        "tipo": "fijo"
      },
      {
        "insumo_id": 29,
        "cantidad": 180,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 28,
    "nombre": "Blondie de Vainilla y Chocolate Blanco con Pistachos (Molde 9 porciones)",
    "categoria": "Brownies y Blondies",
    "descripcion": "El primo dorado del brownie: elaborado con azúcar morena, chocolate blanco y pistachos.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "9 porciones",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 28,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 16,
        "cantidad": 160,
        "tipo": "fijo"
      },
      {
        "insumo_id": 10,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 39,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 59,
        "cantidad": 70,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 29,
    "nombre": "Brownie Cheesecake (Molde 9 porciones)",
    "categoria": "Brownies y Blondies",
    "descripcion": "Doble capa sublime: base de brownie húmedo y cubierta horneada de cheesecake cremoso.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "9 porciones",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 35,
    "temperatura_horno_c": 165,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 38,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 3,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 90,
        "tipo": "fijo"
      },
      {
        "insumo_id": 25,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 9,
        "cantidad": 60,
        "tipo": "variable"
      },
      {
        "insumo_id": 35,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 30,
    "nombre": "Brownie Bites para Eventos (Caja x 24 mini cuadros)",
    "categoria": "Brownies y Blondies",
    "descripcion": "Bocaditos de brownie tamaño bocado decorados con topping variado.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "24 mini porciones",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 25,
    "temperatura_horno_c": 170,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 38,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 42,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 31,
    "nombre": "Postre Tres Leches Tradicional Artesanal (Bandeja 12 porciones)",
    "categoria": "Tres Leches y Postres Fríos",
    "descripcion": "Bizcochuelo esponjoso embebido en mezcla de 3 leches premium con canela y merengue tostado.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "Bandeja (12 porciones)",
    "tiempo_preparacion_min": 35,
    "tiempo_horneado_min": 30,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 27,
        "cantidad": 395,
        "tipo": "variable"
      },
      {
        "insumo_id": 28,
        "cantidad": 400,
        "tipo": "variable"
      },
      {
        "insumo_id": 24,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 31,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 76,
        "cantidad": 4,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 32,
    "nombre": "Postre Cuatro Leches con Arequipe (Bandeja 12 porciones)",
    "categoria": "Tres Leches y Postres Fríos",
    "descripcion": "Variación con arequipe artesanal integrado a la mezcla de leches y cobertura.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "Bandeja (12 porciones)",
    "tiempo_preparacion_min": 35,
    "tiempo_horneado_min": 30,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 65,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 27,
        "cantidad": 395,
        "tipo": "variable"
      },
      {
        "insumo_id": 28,
        "cantidad": 400,
        "tipo": "variable"
      },
      {
        "insumo_id": 24,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 29,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 33,
    "nombre": "Tres Leches de Maracuyá Frío (Bandeja 12 porciones)",
    "categoria": "Tres Leches y Postres Fríos",
    "descripcion": "Equilibrio cítrico perfecto con reducción artesanal de pulpa de maracuyá pura.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "Bandeja (12 porciones)",
    "tiempo_preparacion_min": 40,
    "tiempo_horneado_min": 30,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 27,
        "cantidad": 395,
        "tipo": "variable"
      },
      {
        "insumo_id": 28,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 24,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 50,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 31,
        "cantidad": 200,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 34,
    "nombre": "Tiramisú Clásico Italiano con Mascarpone (Bandeja 8 porciones)",
    "categoria": "Tres Leches y Postres Fríos",
    "descripcion": "Capas de bizcochos savoiardi humedecidos en espresso y Kahlúa, crema sedosa de queso mascarpone y cacao holandés.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "Bandeja (8 porciones)",
    "tiempo_preparacion_min": 40,
    "tiempo_horneado_min": 0,
    "temperatura_horno_c": 0,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 26,
        "cantidad": 400,
        "tipo": "fijo"
      },
      {
        "insumo_id": 37,
        "cantidad": 80,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 24,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 79,
        "cantidad": 20,
        "tipo": "fijo"
      },
      {
        "insumo_id": 81,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 41,
        "cantidad": 25,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 35,
    "nombre": "Mousse de Chocolate Belga 56% en Vasitos (Pack x 6)",
    "categoria": "Tres Leches y Postres Fríos",
    "descripcion": "Postre frío individual aireado y ligero con chocolate belga y avellanas.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "6 vasitos",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 0,
    "temperatura_horno_c": 0,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 38,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 24,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 36,
        "cantidad": 80,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 60,
        "tipo": "fijo"
      },
      {
        "insumo_id": 91,
        "cantidad": 6,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 36,
    "nombre": "Mousse de Frutos Rojos y Chocolate Blanco (Pack x 6)",
    "categoria": "Tres Leches y Postres Fríos",
    "descripcion": "Vasitos individuales con crema de chocolate blanco y coulis de frambuesa.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "6 vasitos",
    "tiempo_preparacion_min": 30,
    "tiempo_horneado_min": 0,
    "temperatura_horno_c": 0,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 39,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 24,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 70,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 91,
        "cantidad": 6,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 37,
    "nombre": "New York Cheesecake Horneado con Frutos Rojos (Molde 24cm)",
    "categoria": "Cheesecakes y Tartas",
    "descripcion": "Cheesecake horneado a baño maría, textura densa y cremosa, base de galleta y compota de frutos rojos.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 molde 24cm (12 porciones)",
    "tiempo_preparacion_min": 40,
    "tiempo_horneado_min": 75,
    "temperatura_horno_c": 150,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 18,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 25,
        "cantidad": 800,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 24,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 51,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 16,
        "cantidad": 80,
        "tipo": "variable"
      },
      {
        "insumo_id": 55,
        "cantidad": 250,
        "tipo": "variable"
      },
      {
        "insumo_id": 46,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 38,
    "nombre": "Cheesecake de Maracuyá Frío Sin Horno (Molde 22cm)",
    "categoria": "Cheesecakes y Tartas",
    "descripcion": "Postre refrescante con suave crema de queso y espejo brillante de maracuyá.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 molde 22cm (10 porciones)",
    "tiempo_preparacion_min": 35,
    "tiempo_horneado_min": 0,
    "temperatura_horno_c": 0,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 12,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 25,
        "cantidad": 500,
        "tipo": "fijo"
      },
      {
        "insumo_id": 27,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 24,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 70,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 50,
        "cantidad": 200,
        "tipo": "variable"
      },
      {
        "insumo_id": 1,
        "cantidad": 120,
        "tipo": "variable"
      },
      {
        "insumo_id": 16,
        "cantidad": 60,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 39,
    "nombre": "Tarta de Manzana Caramelizada Rústica (Molde 26cm)",
    "categoria": "Cheesecakes y Tartas",
    "descripcion": "Masa quebrada de mantequilla rellena de manzanas salteadas en canela y azúcar morena.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 molde 26cm (8-10 porciones)",
    "tiempo_preparacion_min": 40,
    "tiempo_horneado_min": 45,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 130,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 50,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 52,
        "cantidad": 600,
        "tipo": "variable"
      },
      {
        "insumo_id": 10,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 76,
        "cantidad": 8,
        "tipo": "variable"
      },
      {
        "insumo_id": 16,
        "cantidad": 30,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 40,
    "nombre": "Tarta de Limón y Merengue Suizo / Lemon Pie (Molde 24cm)",
    "categoria": "Cheesecakes y Tartas",
    "descripcion": "Masa sablé crujiente con cuajada ácida de limón natural y copas de merengue suizo flambeado.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 molde 24cm (10 porciones)",
    "tiempo_preparacion_min": 45,
    "tiempo_horneado_min": 25,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 220,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 110,
        "tipo": "fijo"
      },
      {
        "insumo_id": 11,
        "cantidad": 60,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 51,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 27,
        "cantidad": 395,
        "tipo": "variable"
      },
      {
        "insumo_id": 37,
        "cantidad": 60,
        "tipo": "variable"
      },
      {
        "insumo_id": 36,
        "cantidad": 120,
        "tipo": "variable"
      },
      {
        "insumo_id": 9,
        "cantidad": 200,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 41,
    "nombre": "Cheesecake Vasco Tostado / San Sebastián (Molde 22cm)",
    "categoria": "Cheesecakes y Tartas",
    "descripcion": "El icónico cheesecake tostado por fuera con centro cremoso que fluye suavemente.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 molde 22cm (10 porciones)",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 40,
    "temperatura_horno_c": 210,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 18,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 25,
        "cantidad": 750,
        "tipo": "fijo"
      },
      {
        "insumo_id": 24,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 25,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 42,
    "nombre": "Tarta de Ganache de Chocolate y Caramelo Salado (Molde 24cm)",
    "categoria": "Cheesecakes y Tartas",
    "descripcion": "Base de chocolate, toffee salado artesanal y ganache sedoso de chocolate belga.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 molde 24cm (10 porciones)",
    "tiempo_preparacion_min": 45,
    "tiempo_horneado_min": 20,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 1,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 30,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 150,
        "tipo": "variable"
      },
      {
        "insumo_id": 24,
        "cantidad": 300,
        "tipo": "variable"
      },
      {
        "insumo_id": 16,
        "cantidad": 50,
        "tipo": "variable"
      },
      {
        "insumo_id": 69,
        "cantidad": 4,
        "tipo": "variable"
      },
      {
        "insumo_id": 38,
        "cantidad": 220,
        "tipo": "variable"
      },
      {
        "insumo_id": 84,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 86,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 43,
    "nombre": "Pan Brioche Francés Artesanal de Mantequilla (Molde 600g)",
    "categoria": "Panes y Masas Saladas",
    "descripcion": "Pan enriquecido con 40% mantequilla de alta calidad, miga algodonosa dorada.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 molde 600g (12 rebanadas)",
    "tiempo_preparacion_min": 45,
    "tiempo_horneado_min": 32,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 8,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 35,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 2,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 160,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 4,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 60,
        "tipo": "fijo"
      },
      {
        "insumo_id": 67,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 68,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 44,
    "nombre": "Focaccia Artesanal al Romero, Oliva y Sal Marina (Bandeja 6 porciones)",
    "categoria": "Panes y Masas Saladas",
    "descripcion": "Pan plano italiano de fermentación lenta con abundante aceite de oliva extra virgen y sal marina en escamas.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "Bandeja (6 porciones)",
    "tiempo_preparacion_min": 35,
    "tiempo_horneado_min": 25,
    "temperatura_horno_c": 220,
    "materiales_indirectos_pct": 8,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 2,
        "cantidad": 400,
        "tipo": "fijo"
      },
      {
        "insumo_id": 67,
        "cantidad": 6,
        "tipo": "fijo"
      },
      {
        "insumo_id": 68,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 12,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 21,
        "cantidad": 80,
        "tipo": "variable"
      },
      {
        "insumo_id": 69,
        "cantidad": 5,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 45,
    "nombre": "Pan de Queso / Pandebono Colombiano Artesanal (Docena)",
    "categoria": "Panes y Masas Saladas",
    "descripcion": "Bocados tradicionales con fécula de yuca, queso y maíz, suaves por dentro y dorados por fuera.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "12 unidades",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 18,
    "temperatura_horno_c": 200,
    "materiales_indirectos_pct": 8,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 7,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 50,
        "tipo": "fijo"
      },
      {
        "insumo_id": 34,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 50,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 2,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 50,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 46,
    "nombre": "Rollos de Canela Glaseados estilo Cinnabon (Pack x 6)",
    "categoria": "Panes y Masas Saladas",
    "descripcion": "Masa brioche enrollada con abundante mantequilla, azúcar morena y canela de Ceilán, con glaseado de queso crema.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "6 unidades grandes",
    "tiempo_preparacion_min": 40,
    "tiempo_horneado_min": 24,
    "temperatura_horno_c": 180,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 2,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 140,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 70,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 50,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 1,
        "tipo": "fijo"
      },
      {
        "insumo_id": 67,
        "cantidad": 7,
        "tipo": "fijo"
      },
      {
        "insumo_id": 10,
        "cantidad": 120,
        "tipo": "variable"
      },
      {
        "insumo_id": 16,
        "cantidad": 60,
        "tipo": "variable"
      },
      {
        "insumo_id": 76,
        "cantidad": 15,
        "tipo": "variable"
      },
      {
        "insumo_id": 25,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 11,
        "cantidad": 100,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 47,
    "nombre": "Croissants de Mantequilla Franceses (Pack x 6)",
    "categoria": "Panes y Masas Saladas",
    "descripcion": "Hojaldre laminado artesanal con capas crujientes y alveolos perfectos.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "6 unidades",
    "tiempo_preparacion_min": 60,
    "tiempo_horneado_min": 20,
    "temperatura_horno_c": 195,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 18,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 40,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 2,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 35,
        "tipo": "fijo"
      },
      {
        "insumo_id": 67,
        "cantidad": 7,
        "tipo": "fijo"
      },
      {
        "insumo_id": 68,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 180,
        "tipo": "variable"
      },
      {
        "insumo_id": 88,
        "cantidad": 1,
        "tipo": "variable"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 48,
    "nombre": "Pan Rústico Campesino de Masa Madre (Hogaza 750g)",
    "categoria": "Panes y Masas Saladas",
    "descripcion": "Hogaza crujiente con fermentación natural de 24 horas, corteza tostada y miga abierta.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 hogaza (750g)",
    "tiempo_preparacion_min": 40,
    "tiempo_horneado_min": 40,
    "temperatura_horno_c": 230,
    "materiales_indirectos_pct": 8,
    "costos_operativos_pct": 18,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 35,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 2,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 6,
        "cantidad": 50,
        "tipo": "fijo"
      },
      {
        "insumo_id": 68,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 93,
        "cantidad": 1,
        "tipo": "variable"
      }
    ]
  },
  {
    "id": 49,
    "nombre": "Buttercream Suizo de Vainilla (Lote 1 kg)",
    "categoria": "Rellenos y Coberturas",
    "descripcion": "Crema de mantequilla a base de merengue suizo, sedosa, estable y nada empalagosa.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 kg (rinde para 2 tortas)",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 0,
    "temperatura_horno_c": 0,
    "materiales_indirectos_pct": 8,
    "costos_operativos_pct": 10,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 25,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 36,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 450,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 68,
        "cantidad": 2,
        "tipo": "fijo"
      }
    ]
  },
  {
    "id": 50,
    "nombre": "Ganache de Chocolate Semiamargo 56% (Lote 1 kg)",
    "categoria": "Rellenos y Coberturas",
    "descripcion": "Emulsión perfecta de chocolate belga y crema de leche para relleno o cobertura lisa.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 kg",
    "tiempo_preparacion_min": 15,
    "tiempo_horneado_min": 0,
    "temperatura_horno_c": 0,
    "materiales_indirectos_pct": 8,
    "costos_operativos_pct": 10,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 25,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 38,
        "cantidad": 550,
        "tipo": "fijo"
      },
      {
        "insumo_id": 24,
        "cantidad": 400,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 50,
        "tipo": "fijo"
      }
    ]
  },
  {
    "id": 51,
    "nombre": "Crema Pastelera Artesanal de Vainilla (Lote 1 kg)",
    "categoria": "Rellenos y Coberturas",
    "descripcion": "Crema cocida tradicional con leche entera, yemas, maicena y vainilla natural en vaina.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 kg",
    "tiempo_preparacion_min": 20,
    "tiempo_horneado_min": 0,
    "temperatura_horno_c": 0,
    "materiales_indirectos_pct": 8,
    "costos_operativos_pct": 12,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 25,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 23,
        "cantidad": 700,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 160,
        "tipo": "fijo"
      },
      {
        "insumo_id": 37,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 4,
        "cantidad": 60,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 40,
        "tipo": "fijo"
      },
      {
        "insumo_id": 74,
        "cantidad": 10,
        "tipo": "fijo"
      }
    ]
  },
  {
    "id": 52,
    "nombre": "Compota Rústica de Frutos Rojos Silvestres (Lote 800g)",
    "categoria": "Rellenos y Coberturas",
    "descripcion": "Reducción artesanal de fresas, moras y frambuesas con toque de zumo de limón natural.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "800g",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 0,
    "temperatura_horno_c": 0,
    "materiales_indirectos_pct": 8,
    "costos_operativos_pct": 12,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 25,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 46,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 48,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 49,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 9,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 51,
        "cantidad": 20,
        "tipo": "fijo"
      }
    ]
  },
  {
    "id": 53,
    "nombre": "Caramelo Salado Artesanal / Toffee (Lote 600g)",
    "categoria": "Rellenos y Coberturas",
    "descripcion": "Caramelo dorado cremoso con mantequilla pura, crema y escamas de flor de sal marina.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "600g",
    "tiempo_preparacion_min": 20,
    "tiempo_horneado_min": 0,
    "temperatura_horno_c": 0,
    "materiales_indirectos_pct": 8,
    "costos_operativos_pct": 12,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 25,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 9,
        "cantidad": 300,
        "tipo": "fijo"
      },
      {
        "insumo_id": 16,
        "cantidad": 120,
        "tipo": "fijo"
      },
      {
        "insumo_id": 24,
        "cantidad": 200,
        "tipo": "fijo"
      },
      {
        "insumo_id": 69,
        "cantidad": 6,
        "tipo": "fijo"
      }
    ]
  },
  {
    "id": 54,
    "nombre": "Quesillo Tradicional Casero de Caramelo Dorado (Molde 22cm)",
    "categoria": "Tres Leches y Postres Fríos",
    "descripcion": "Clásico quesillo artesanal de textura sedosa con agujeritos característicos, elaborado a base de leche condensada, leche evaporada y baño generoso de caramelo dorado al punto ámbar.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 Molde 22cm (10-12 porciones)",
    "tiempo_preparacion_min": 20,
    "tiempo_horneado_min": 60,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 9,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 27,
        "cantidad": 395,
        "tipo": "fijo"
      },
      {
        "insumo_id": 28,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 10,
        "tipo": "fijo"
      },
      {
        "insumo_id": 85,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "instrucciones": [
      "1. Elaborar el caramelo en el molde fundiendo el azúcar a fuego medio hasta obtener un color ámbar dorado parejo. Cubrir paredes del molde y dejar enfriar.",
      "2. Licuar la leche condensada, leche evaporada, los huevos enteros y el extracto de vainilla a velocidad baja por 1 minuto.",
      "3. Colar la mezcla y verter dentro del molde caramelizado.",
      "4. Hornear a baño de María tapado con papel aluminio a 175°C durante 60 minutos.",
      "5. Dejar enfriar a temperatura ambiente y refrigerar mínimo 6 horas antes de desmoldar con cuidado."
    ]
  },
  {
    "id": 55,
    "nombre": "Quesillo Cremoso de Coco Caribeño (Molde 22cm)",
    "categoria": "Tres Leches y Postres Fríos",
    "descripcion": "Quesillo tropical infusionado con leche de coco, leche condensada y corona de coco rallado tostado sobre caramelo ámbar brillante.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 Molde 22cm (10-12 porciones)",
    "tiempo_preparacion_min": 25,
    "tiempo_horneado_min": 60,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 9,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 27,
        "cantidad": 395,
        "tipo": "fijo"
      },
      {
        "insumo_id": 28,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 60,
        "cantidad": 100,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 85,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "instrucciones": [
      "1. Caramelizar el molde con azúcar hasta tono ámbar.",
      "2. Licuar leche condensada, evaporada, leche entera, coco rallado, huevos y vainilla.",
      "3. Verter en el molde y hornear a baño de María a 175°C durante 60 minutos.",
      "4. Refrigerar durante la noche y desmoldar decorando con coco tostado."
    ]
  },
  {
    "id": 56,
    "nombre": "Flan / Quesillo de Queso Crema y Vainilla Bourbon (Molde 22cm)",
    "categoria": "Tres Leches y Postres Fríos",
    "descripcion": "Fusión irresistible entre flan de queso y quesillo tradicional: textura ultra cremosa y densa con queso crema Philadelphia y caramelo fundido.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 Molde 22cm (10-12 porciones)",
    "tiempo_preparacion_min": 20,
    "tiempo_horneado_min": 65,
    "temperatura_horno_c": 170,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 9,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 25,
        "cantidad": 225,
        "tipo": "fijo"
      },
      {
        "insumo_id": 27,
        "cantidad": 395,
        "tipo": "fijo"
      },
      {
        "insumo_id": 28,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 12,
        "tipo": "fijo"
      },
      {
        "insumo_id": 85,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "instrucciones": [
      "1. Preparar el caramelo en el molde y dejar enfriar.",
      "2. Batir primero el queso crema con la leche condensada hasta disolver grumos.",
      "3. Añadir leche evaporada, huevos uno a uno y vainilla.",
      "4. Colar la mezcla y hornear a baño de María a 170°C por 65 minutos.",
      "5. Refrigerar 8 horas antes de desmoldar."
    ]
  },
  {
    "id": 57,
    "nombre": "Chocoflan / Torta Imposible Artesanal (Molde Bundt 24cm)",
    "categoria": "Tortas y Pasteles",
    "descripcion": "La legendaria torta imposible: base húmeda de torta de chocolate con cacao puro alcalino y capa superior de suave quesillo de vainilla con caramelo fluido.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 Molde Bundt 24cm (12-14 porciones)",
    "tiempo_preparacion_min": 35,
    "tiempo_horneado_min": 75,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 9,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 1,
        "cantidad": 180,
        "tipo": "fijo"
      },
      {
        "insumo_id": 41,
        "cantidad": 50,
        "tipo": "fijo"
      },
      {
        "insumo_id": 23,
        "cantidad": 150,
        "tipo": "fijo"
      },
      {
        "insumo_id": 27,
        "cantidad": 395,
        "tipo": "fijo"
      },
      {
        "insumo_id": 28,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 7,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 15,
        "tipo": "fijo"
      },
      {
        "insumo_id": 85,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "instrucciones": [
      "1. Caramelizar el molde Bundt con 120g de azúcar y dejar enfriar.",
      "2. Preparar el batido de torta de chocolate: cremar mantequilla con azúcar, huevos, alternar harina y cacao con leche.",
      "3. Verter la mezcla de torta en el fondo del molde.",
      "4. Licuar condensada, evaporada, huevos y vainilla para el quesillo. Verter suavemente sobre la masa de chocolate con una espátula.",
      "5. Hornear a baño de María a 175°C por 75 min (durante el horneado las capas se invierten mágicamente).",
      "6. Enfriar completamente y desmoldar frío."
    ]
  },
  {
    "id": 58,
    "nombre": "Quesillo de Dulce de Leche / Arequipe Artesanal (Molde 22cm)",
    "categoria": "Tres Leches y Postres Fríos",
    "descripcion": "Quesillo enriquecido con arequipe repostero integrado en la mezcla cremosa y bañado en caramelo toffee.",
    "rendimiento_base": 1,
    "rendimiento_unidad": "1 Molde 22cm (10-12 porciones)",
    "tiempo_preparacion_min": 20,
    "tiempo_horneado_min": 60,
    "temperatura_horno_c": 175,
    "materiales_indirectos_pct": 10,
    "costos_operativos_pct": 15,
    "reposicion_equipos_pct": 10,
    "mano_obra_pct": 30,
    "margen_beneficio_pct": 50,
    "activa": true,
    "ingredientes": [
      {
        "insumo_id": 9,
        "cantidad": 160,
        "tipo": "fijo"
      },
      {
        "insumo_id": 29,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 27,
        "cantidad": 250,
        "tipo": "fijo"
      },
      {
        "insumo_id": 28,
        "cantidad": 350,
        "tipo": "fijo"
      },
      {
        "insumo_id": 35,
        "cantidad": 5,
        "tipo": "fijo"
      },
      {
        "insumo_id": 73,
        "cantidad": 8,
        "tipo": "fijo"
      },
      {
        "insumo_id": 85,
        "cantidad": 1,
        "tipo": "variable"
      }
    ],
    "instrucciones": [
      "1. Caramelizar el molde con azúcar.",
      "2. Licuar arequipe, leche condensada, leche evaporada, huevos y vainilla.",
      "3. Colar y verter en el molde caramelizado.",
      "4. Hornear a baño de María a 175°C por 60 minutos.",
      "5. Dejar enfriar y desmoldar bien frío."
    ]
  }
];

// ==============================================================================
// COTIZACIONES (INICIALMENTE VACÍO - 0 DATOS FICTICIOS)
// ==============================================================================
export const INITIAL_COTIZACIONES: Cotizacion[] = [];

// ==============================================================================
// PEDIDOS Y FACTURAS (INICIALMENTE VACÍO - 0 DATOS FICTICIOS)
// ==============================================================================
export const INITIAL_PEDIDOS: Pedido[] = [];

// ==============================================================================
// MERMAS REGISTRADAS (INICIALMENTE VACÍO - 0 DATOS FICTICIOS)
// ==============================================================================
export const INITIAL_MERMAS: Merma[] = [];

// ==============================================================================
// USUARIOS DEL TALLER (2 USUARIOS: ADMIN MAESTRO Y PERSONAL DEL TALLER)
// ==============================================================================
export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 1,
    username: 'Steven9909',
    password: '@Manzana0104',
    nombre_completo: 'Steven (Administrador Maestro)',
    email: 'steven@deliciasdelvalle.com',
    telefono: '+1 (809) 555-0142',
    rol: 'admin',
    activo: true,
    created_at: '2026-08-01T08:00:00Z',
    ultimo_acceso: '2026-08-31T17:00:00Z',
  },
  {
    id: 2,
    username: 'taller_delicias',
    password: 'Delicias2026*',
    nombre_completo: 'Equipo del Taller (Acceso Operativo)',
    email: 'taller@deliciasdelvalle.com',
    telefono: '+1 (809) 555-0142',
    rol: 'operador',
    activo: true,
    created_at: '2026-08-10T08:00:00Z',
    ultimo_acceso: '2026-08-31T15:30:00Z',
  },
];
