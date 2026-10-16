# Vinos Don Suárez — Sitio Web

Página web de **Vinos Don Suárez**, vino tinto artesanal elaborado a base de Flor de Jamaica en Campeche, México.

## Qué incluye

- **Página principal** con la historia, el producto, la tienda y el contacto.
- **Tienda (demostración):** carrito de ejemplo. Todavía no hay pagos ni pedidos reales.
- **Galería de la comunidad:** los visitantes envían fotos y se publican cuando se aprueban.
- **Panel de administración** (`admin.html`): solo entra la cuenta de Google autorizada, para aprobar, ocultar o eliminar fotos.
- **Contacto:** el formulario abre Gmail con el mensaje ya redactado.

## Estructura del proyecto

```
├── index.html            Página principal
├── admin.html            Panel privado para aprobar fotos
├── css/
│   ├── styles.css        Estilos generales
│   ├── galeria.css       Galería y formulario de fotos
│   ├── tienda.css        Tienda de demostración
│   └── admin.css         Panel de administración
├── js/
│   ├── script.js         Menú móvil y animaciones
│   ├── tienda.js         Carrito de la tienda (demo)
│   ├── contacto.js       Formulario de contacto (abre Gmail)
│   ├── galeria.js        Galería pública y envío de fotos
│   ├── admin.js          Lógica del panel de administración
│   └── firebase-config.js  Datos de Firebase y Cloudinary
├── assets/               Imágenes
└── firebase/
    ├── firestore.rules   Reglas de seguridad de la base de datos
    └── SETUP-FIREBASE.md Guía de configuración de Firebase y Cloudinary
```

## Cómo verla en tu computadora

Hay que abrirla desde un servidor local (no con doble clic), porque el inicio de sesión de Google no funciona en `file://`:

```
python -m http.server 8000
```

Luego entra a `http://localhost:8000`.

## Tecnologías

HTML, CSS y JavaScript sin frameworks. Firebase (Firestore y Authentication) en plan gratuito y Cloudinary (plan gratuito) para las fotos.

## Pendiente

- Precios y datos reales de la tienda.
- Pagos (por ejemplo, Stripe) cuando estén listos los permisos.
- Hosting y dominio.
