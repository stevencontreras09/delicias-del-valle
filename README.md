# Delicias del Valle — Pastelería & Panadería Artesanal
### Sistema Integral de Gestión Gastronómica, Escandallos (BOM), Cotizaciones y Modo Cocina

Una solución web completa, moderna y altamente ergonómica diseñada para la administración, costeo preciso, cotización interactiva y producción en taller de repostería artesanal.

---

## 🎨 Identidad Visual y Paleta Oficial
- **Frambuesa Viva (CTA / Acentos)**: `#E91E63`
- **Chocolate Oscuro (Cabeceras / Textos Destacados)**: `#5D4037`
- **Trigo Dorado (Neutro de Apoyo / Badges)**: `#C5A076`
- **Crema Suave (Superficies / Cards)**: `#FDF4E0`
- **Blanco Hueso Cálido (Fondo Canvas)**: `#FDFBF7`
- **Gris Panadero (Texto Base)**: `#333333`
- **Tipografías**: `Montserrat` + Estilo cursiva artesanal (`Great Vibes` / `Playfair Display`).

---

## 🚀 Inicio Rápido

1. **Instalar Dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar Entorno de Desarrollo**:
   ```bash
   npm run dev
   ```
   Accede en tu navegador a: `http://localhost:5173`

3. **Compilar para Producción**:
   ```bash
   npm run build
   ```

---

## 🍰 Módulos Principales

1. **Dashboard Principal**:
   - KPIs financieros (Ventas, Anticipos, Saldo por cobrar).
   - Alertas automáticas de insumos por debajo del stock mínimo.
   - Pipeline de pedidos activos y ranking de recetas más rentables.

2. **Gestión de Insumos (93 Materias Primas)**:
   - Catálogo exhaustivo con conversión automática a unidades base ($/g, $/ml, $/ud).
   - Registro de mermas y pérdidas con cálculo de costo financiero.
   - Reabastecimiento rápido de inventario.

3. **Recetario Maestro & Escandallos (53 Recetas BOM)**:
   - Separación de ingredientes fijos (masa base) y variables (relleno/decoración).
   - Cascada de costos: Indirectos (10%), Operativos (15%), Reposición (10%), Mano de Obra (30%).
   - Margen de ganancia comercial (50%) y precio sugerido.
   - Escalador en vivo ($0.5\times$, $1\times$, $2\times$, $3\times$, $5\times$, $10\times$).

4. **Generador de Cotizaciones Interactivas**:
   - Asistente de cotizaciones por porción/tamaño con personalización de relleno, masa, extras y dedicatoria.
   - Exportación de PDF profesional membretado.
   - Compartir por WhatsApp con enlace directo y emojis.
   - Conversión a Pedido en 1 clic con anticipo del 50%.

5. **Facturación & Control de Pedidos**:
   - Pipeline Kanban de 4 fases: `Confirmado` $\to$ `En Producción` $\to$ `Listo` $\to$ `Entregado`.
   - **Deducción automática e inmediata de stock** en el almacén al confirmar pedidos.
   - Control de anticipo del 50% y cobro de saldo del 50% contra entrega.

6. **Modo Cocina Táctil (Tablet / Manos Enharinadas)**:
   - Botones y tarjetas gigantes para taller.
   - Checklist interactivo de pesaje para tachar ingredientes con un toque.
   - Temporizadores de horneado múltiples con alarma acústica (Web Audio API).

7. **Base de Datos SQL & Backups**:
   - Scripts `database/schema.sql` y `database/seed.sql` listos para PostgreSQL.
   - Visor de tablas y exportador de copias de seguridad en JSON.
