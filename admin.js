/*
  Panel de administración de la galería (admin.html)
  - Solo entran las cuentas de Google listadas en adminEmails (firebase-config.js).
  - La seguridad REAL la dan las reglas de Firestore (firestore.rules): aunque alguien
    modificara este archivo, no podría leer ni aprobar fotos sin ser admin.
*/
(function () {
  'use strict';

  var cfg = window.DON_SUAREZ_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  var vistas = { login: $('vistaLogin'), noaut: $('vistaNoAut'), panel: $('vistaPanel') };
  var loginMsg = $('loginMsg');
  var lista = $('lista');
  var panelMsg = $('panelMsg');
  var tabPend = $('tabPend');
  var tabAprob = $('tabAprob');
  var tituloBase = document.title;

  function mostrar(cual) {
    Object.keys(vistas).forEach(function (k) { vistas[k].hidden = (k !== cual); });
    $('adminUser').hidden = (cual === 'login');
  }

  function valido(v) { return typeof v === 'string' && v !== '' && v.indexOf('TU_') !== 0; }

  var f = cfg.firebase || {};
  if (!window.firebase || !valido(f.apiKey) || !valido(f.projectId) || !valido(f.appId)) {
    mostrar('login');
    $('btnGoogle').disabled = true;
    loginMsg.textContent = 'Falta configurar firebase-config.js (revisa la guía SETUP-FIREBASE.md).';
    return;
  }

  firebase.initializeApp(cfg.firebase);
  var auth = firebase.auth();
  var db = firebase.firestore();
  var admins = (cfg.adminEmails || []).map(function (e) { return String(e).toLowerCase(); });

  var fotos = [];
  var pestana = 'pendientes';
  var dejarDeEscuchar = null;

  // ---------- Entrar / salir ----------
  function entrar() {
    loginMsg.textContent = '';
    var proveedor = new firebase.auth.GoogleAuthProvider();
    proveedor.setCustomParameters({ prompt: 'select_account' });
    auth.signInWithPopup(proveedor).catch(function (e) {
      if (e.code === 'auth/popup-blocked') return auth.signInWithRedirect(proveedor);
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return null;
      loginMsg.textContent = 'No se pudo iniciar sesión (' + e.code + ').';
      return null;
    });
  }
  function salir() { auth.signOut(); }

  $('btnGoogle').addEventListener('click', entrar);
  $('btnSalir').addEventListener('click', salir);
  $('btnOtra').addEventListener('click', function () { auth.signOut().then(entrar); });

  auth.onAuthStateChanged(function (user) {
    if (dejarDeEscuchar) { dejarDeEscuchar(); dejarDeEscuchar = null; }
    fotos = [];
    document.title = tituloBase;

    if (!user) { mostrar('login'); return; }

    var correo = String(user.email || '').toLowerCase();
    $('adminEmail').textContent = user.email || '';
    if (!user.emailVerified || admins.indexOf(correo) === -1) {
      $('noAutEmail').textContent = user.email || '';
      mostrar('noaut');
      return;
    }

    mostrar('panel');
    panelMsg.textContent = 'Cargando…';
    dejarDeEscuchar = db.collection('fotos').orderBy('fecha', 'desc').limit(100).onSnapshot(
      function (snap) {
        fotos = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
        pintar();
      },
      function () { panelMsg.textContent = 'No se pudieron cargar las fotos. Revisa las reglas de Firestore.'; }
    );
  });

  // ---------- Pestañas ----------
  function elegirPestana(nueva) {
    pestana = nueva;
    tabPend.setAttribute('aria-selected', String(nueva === 'pendientes'));
    tabAprob.setAttribute('aria-selected', String(nueva === 'aprobadas'));
    pintar();
  }
  tabPend.addEventListener('click', function () { elegirPestana('pendientes'); });
  tabAprob.addEventListener('click', function () { elegirPestana('aprobadas'); });

  // ---------- Lista ----------
  function ms(fecha) { return fecha && typeof fecha.toMillis === 'function' ? fecha.toMillis() : Date.now(); }

  function miniatura(url, ancho) {
    return url.replace('/upload/', '/upload/c_limit,w_' + ancho + ',q_auto,f_auto/');
  }

  function boton(texto, clase, accion) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = clase;
    b.textContent = texto;
    b.addEventListener('click', function () {
      var hermanos = b.parentNode.querySelectorAll('button');
      hermanos.forEach(function (x) { x.disabled = true; });
      accion().catch(function (e) {
        hermanos.forEach(function (x) { x.disabled = false; });
        if (e && e.message === 'cancelado') return;
        window.alert('No se pudo completar la acción. Revisa tu conexión e inténtalo de nuevo.');
      });
    });
    return b;
  }

  function tarjeta(foto) {
    var ref = db.collection('fotos').doc(foto.id);
    var art = document.createElement('article');
    art.className = 'admin-foto';

    var enlace = document.createElement('a');
    enlace.className = 'thumb';
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    enlace.href = foto.url;
    enlace.title = 'Abrir foto completa';
    var img = document.createElement('img');
    img.loading = 'lazy';
    img.src = miniatura(foto.url, 600);
    img.alt = 'Foto enviada por ' + foto.nombre;
    enlace.appendChild(img);
    art.appendChild(enlace);

    var info = document.createElement('div');
    info.className = 'info';
    var quien = document.createElement('div');
    quien.className = 'quien';
    quien.textContent = foto.nombre || '(sin nombre)';
    var meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = (foto.ciudad ? foto.ciudad + ' · ' : '') +
      new Date(ms(foto.fecha)).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
    info.appendChild(quien);
    info.appendChild(meta);
    if (foto.mensaje) {
      var texto = document.createElement('p');
      texto.className = 'texto';
      texto.textContent = foto.mensaje;
      info.appendChild(texto);
    }
    art.appendChild(info);

    var acciones = document.createElement('div');
    acciones.className = 'acciones';
    if (foto.aprobada) {
      acciones.appendChild(boton('Ocultar', 'btn-ocultar', function () { return ref.update({ aprobada: false }); }));
    } else {
      acciones.appendChild(boton('Aprobar', 'btn-aprobar', function () { return ref.update({ aprobada: true }); }));
    }
    acciones.appendChild(boton('Eliminar', 'btn-eliminar', function () {
      if (!window.confirm('¿Eliminar esta foto de ' + (foto.nombre || 'alguien') + '? No se puede deshacer.')) {
        return Promise.reject(new Error('cancelado'));
      }
      return ref.delete();
    }));
    art.appendChild(acciones);
    return art;
  }

  function pintar() {
    var pendientes = fotos.filter(function (x) { return x.aprobada !== true; });
    var aprobadas = fotos.filter(function (x) { return x.aprobada === true; });
    $('cntPend').textContent = pendientes.length;
    $('cntAprob').textContent = aprobadas.length;
    document.title = (pendientes.length ? '(' + pendientes.length + ') ' : '') + tituloBase;

    var visibles = (pestana === 'pendientes' ? pendientes : aprobadas)
      .filter(function (x) { return typeof x.url === 'string' && x.url.indexOf('https://res.cloudinary.com/') === 0; })
      .sort(function (a, b) { return ms(b.fecha) - ms(a.fecha); });

    lista.textContent = '';
    if (!visibles.length) {
      panelMsg.textContent = pestana === 'pendientes'
        ? 'No hay fotos pendientes por revisar.'
        : 'Todavía no hay fotos aprobadas.';
      return;
    }
    panelMsg.textContent = '';
    visibles.forEach(function (x) { lista.appendChild(tarjeta(x)); });
  }
})();
