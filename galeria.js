/*
  Galería de la comunidad — parte pública (index.html)
  - Muestra las fotos que ya fueron APROBADAS.
  - Recibe fotos nuevas: las sube a Cloudinary y guarda el registro en Firestore
    como "pendiente" (aprobada: false). Nada se publica hasta que se aprueba
    en admin.html.
*/
(function () {
  'use strict';

  var cfg = window.DON_SUAREZ_CONFIG || {};
  var grid = document.getElementById('galeriaGrid');
  var vacia = document.getElementById('galeriaVacia');
  var form = document.getElementById('fotoForm');
  if (!grid || !vacia || !form) return;

  var estado = document.getElementById('fotoEstado');
  var boton = document.getElementById('fotoEnviar');
  var progreso = document.getElementById('fotoProgreso');
  var barra = progreso.firstElementChild;
  var inputFoto = document.getElementById('fotoArchivo');
  var preview = document.getElementById('fotoPreview');
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');

  var MAX_LADO = 1600;            // px: se reduce la foto antes de subirla
  var MAX_BYTES = 10 * 1024 * 1024; // límite de Cloudinary (plan gratuito)
  var ESPERA_MS = 60 * 1000;      // tiempo mínimo entre envíos desde un mismo navegador
  var MAX_FOTOS = 24;             // fotos que se leen y muestran (cuida las lecturas de Firebase)
  var CLAVE_ULTIMO = 'ds_ultimo_envio';

  function valido(v) { return typeof v === 'string' && v !== '' && v.indexOf('TU_') !== 0; }

  function configurado() {
    var f = cfg.firebase || {};
    var c = cfg.cloudinary || {};
    return !!window.firebase && valido(f.apiKey) && valido(f.projectId) &&
           valido(f.appId) && valido(c.cloudName) && valido(c.uploadPreset);
  }

  function mostrarEstado(texto, tipo) {
    estado.textContent = texto || '';
    estado.className = 'foto-estado' + (tipo ? ' ' + tipo : '');
  }

  // ---------- Modo "sin configurar": la página sigue funcionando ----------
  if (!configurado()) {
    vacia.textContent = 'La galería de la comunidad estará disponible muy pronto.';
    boton.disabled = true;
    mostrarEstado('El envío de fotos aún no está activo.', '');
    return;
  }

  if (!firebase.apps.length) firebase.initializeApp(cfg.firebase);
  var db = firebase.firestore();

  // ---------- Utilidades ----------
  function urlSegura(u) {
    return typeof u === 'string' && u.indexOf('https://res.cloudinary.com/') === 0;
  }

  // Cloudinary entrega la imagen ya reducida y optimizada si se lo pedimos en la URL
  function miniatura(url, ancho) {
    return url.replace('/upload/', '/upload/c_limit,w_' + ancho + ',q_auto,f_auto/');
  }

  function limpiar(texto, max) {
    return String(texto || '').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function milisegundos(fecha) {
    return fecha && typeof fecha.toMillis === 'function' ? fecha.toMillis() : Date.now();
  }

  // ---------- Galería ----------
  function tarjeta(f) {
    var fig = document.createElement('figure');
    fig.className = 'foto-card';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'foto-btn';
    btn.setAttribute('aria-label', 'Ver foto de ' + f.nombre);
    var img = document.createElement('img');
    img.loading = 'lazy';
    img.src = miniatura(f.url, 700);
    img.alt = 'Foto compartida por ' + f.nombre;
    btn.appendChild(img);
    btn.addEventListener('click', function () { abrirFoto(f); });
    fig.appendChild(btn);

    var cap = document.createElement('figcaption');
    var quien = document.createElement('strong');
    quien.textContent = f.nombre;
    cap.appendChild(quien);
    if (f.ciudad) cap.appendChild(document.createTextNode(' · ' + f.ciudad));
    if (f.mensaje) {
      var p = document.createElement('p');
      p.textContent = f.mensaje;
      cap.appendChild(p);
    }
    fig.appendChild(cap);
    return fig;
  }

  function pintar(docs) {
    var fotos = docs
      .map(function (d) { return d.data(); })
      .filter(function (f) { return urlSegura(f.url) && f.nombre; })
      .sort(function (a, b) { return milisegundos(b.fecha) - milisegundos(a.fecha); });

    grid.textContent = '';
    if (!fotos.length) {
      vacia.textContent = 'Aún no hay fotos. ¡Sé el primero en compartir tu momento Suárez!';
      vacia.hidden = false;
      return;
    }
    vacia.hidden = true;
    fotos.forEach(function (f) { grid.appendChild(tarjeta(f)); });
  }

  // Una sola lectura al abrir la página (sin escucha en vivo) y solo las más recientes:
  // así cada visita cuesta como máximo MAX_FOTOS lecturas, sin importar cuántas fotos haya.
  db.collection('fotos')
    .where('aprobada', '==', true)
    .orderBy('fecha', 'desc')
    .limit(MAX_FOTOS)
    .get()
    .then(function (snap) { pintar(snap.docs); })
    .catch(function () {
      vacia.textContent = 'No pudimos cargar la galería en este momento.';
      vacia.hidden = false;
    });

  // ---------- Foto ampliada ----------
  function abrirFoto(f) {
    if (typeof lightbox.showModal !== 'function') { window.open(f.url, '_blank', 'noopener'); return; }
    lbImg.src = miniatura(f.url, 1400);
    lbImg.alt = 'Foto compartida por ' + f.nombre;
    lbCap.textContent = f.nombre + (f.ciudad ? ' · ' + f.ciudad : '') + (f.mensaje ? ' — ' + f.mensaje : '');
    lightbox.showModal();
  }
  document.getElementById('lbCerrar').addEventListener('click', function () { lightbox.close(); });
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });

  // ---------- Vista previa de la foto elegida ----------
  inputFoto.addEventListener('change', function () {
    var archivo = inputFoto.files[0];
    if (preview.src && preview.src.indexOf('blob:') === 0) URL.revokeObjectURL(preview.src);
    if (archivo && /^image\/(jpeg|png|webp)$/.test(archivo.type)) {
      preview.src = URL.createObjectURL(archivo);
      preview.hidden = false;
    } else {
      preview.removeAttribute('src');
      preview.hidden = true;
    }
  });

  // ---------- Envío ----------
  // Reduce la foto en el navegador (una foto de celular puede pesar 8 MB)
  function reducir(archivo) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(archivo);
      var img = new Image();
      img.onload = function () {
        var escala = Math.min(1, MAX_LADO / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * escala);
        c.height = Math.round(img.naturalHeight * escala);
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { resolve(b || archivo); }, 'image/jpeg', 0.85);
      };
      // Si el navegador no puede leerla (p. ej. HEIC), se sube tal cual
      img.onerror = function () { URL.revokeObjectURL(url); resolve(archivo); };
      img.src = url;
    });
  }

  function subirACloudinary(blob, alProgreso) {
    return new Promise(function (resolve, reject) {
      var datos = new FormData();
      datos.append('file', blob);
      datos.append('upload_preset', cfg.cloudinary.uploadPreset);
      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.cloudinary.com/v1_1/' + encodeURIComponent(cfg.cloudinary.cloudName) + '/image/upload');
      xhr.upload.onprogress = function (e) { if (e.lengthComputable) alProgreso(e.loaded / e.total); };
      xhr.onload = function () {
        var r = null;
        try { r = JSON.parse(xhr.responseText); } catch (err) { /* respuesta no válida */ }
        if (xhr.status >= 200 && xhr.status < 300 && r && r.secure_url) resolve(r.secure_url);
        else reject(new Error('cloudinary'));
      };
      xhr.onerror = function () { reject(new Error('red')); };
      xhr.send(datos);
    });
  }

  function ultimoEnvio() {
    try { return Number(localStorage.getItem(CLAVE_ULTIMO)) || 0; } catch (e) { return 0; }
  }
  function guardarEnvio() {
    try { localStorage.setItem(CLAVE_ULTIMO, String(Date.now())); } catch (e) { /* sin almacenamiento */ }
  }

  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();

    // Campo trampa: si un robot lo llenó, finge éxito y no envía nada
    if (document.getElementById('fotoWeb').value) {
      mostrarEstado('¡Gracias! Tu foto fue recibida.', 'ok');
      form.reset();
      return;
    }

    var archivo = inputFoto.files[0];
    if (!archivo) { mostrarEstado('Elige una foto para continuar.', 'error'); return; }
    if (!/^image\//.test(archivo.type) && !/\.(heic|heif)$/i.test(archivo.name)) {
      mostrarEstado('El archivo debe ser una imagen (JPG, PNG, WEBP o HEIC).', 'error');
      return;
    }
    if (Date.now() - ultimoEnvio() < ESPERA_MS) {
      mostrarEstado('Espera un minuto antes de enviar otra foto.', 'error');
      return;
    }

    boton.disabled = true;
    progreso.hidden = false;
    barra.style.width = '0%';
    mostrarEstado('Preparando tu foto…', '');

    try {
      var blob = await reducir(archivo);
      if (blob.size > MAX_BYTES) {
        mostrarEstado('La foto pesa demasiado. Elige una de menos de 10 MB.', 'error');
        return;
      }
      mostrarEstado('Subiendo tu foto…', '');
      var url = await subirACloudinary(blob, function (p) { barra.style.width = Math.round(p * 100) + '%'; });

      var registro = {
        nombre: limpiar(document.getElementById('fotoNombre').value, 60),
        url: url,
        aprobada: false,
        fecha: firebase.firestore.FieldValue.serverTimestamp()
      };
      var ciudad = limpiar(document.getElementById('fotoCiudad').value, 60);
      var mensaje = limpiar(document.getElementById('fotoMensaje').value, 240);
      if (ciudad) registro.ciudad = ciudad;
      if (mensaje) registro.mensaje = mensaje;

      await db.collection('fotos').add(registro);

      guardarEnvio();
      form.reset();
      preview.removeAttribute('src');
      preview.hidden = true;
      mostrarEstado('¡Gracias! Recibimos tu foto y se publicará en cuanto la revisemos.', 'ok');
    } catch (err) {
      mostrarEstado('No pudimos enviar tu foto. Revisa tu conexión e inténtalo de nuevo.', 'error');
    } finally {
      boton.disabled = false;
      progreso.hidden = true;
    }
  });
})();
