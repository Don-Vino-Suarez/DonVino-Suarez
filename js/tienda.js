/*
  Tienda — Vinos Don Suárez
  - El carrito vive en la página; al finalizar se abre WhatsApp (+52 1 981 141 0557)
    con el pedido redactado. No hay pagos ni se guarda ningún dato.
  - Los precios están en index.html (atributo data-precio de cada tarjeta).
  - Los textos cambian según el idioma elegido (js/i18n.js). El mensaje del pedido
    SIEMPRE sale en español, porque quien lo recibe en WhatsApp lee español.
*/
(function () {
  'use strict';

  var tarjetas = document.querySelectorAll('.producto-card');
  var lista = document.getElementById('carritoLista');
  if (!tarjetas.length || !lista) return;

  var vacio = document.getElementById('carritoVacio');
  var subtotalEl = document.getElementById('carritoSubtotal');
  var totalEl = document.getElementById('carritoTotal');
  var btnFinalizar = document.getElementById('carritoFinalizar');
  var btnVaciar = document.getElementById('carritoVaciar');
  var estado = document.getElementById('carritoEstado');

  var MAX_POR_PRODUCTO = 12;
  var I18N = window.DS_I18N;
  function tr(clave, vars) { return I18N ? I18N.t(clave, vars) : clave; }
  var dineroEs = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  var dinero = dineroEs;
  function actualizarMoneda() {
    var loc = I18N ? I18N.locale() : 'es-MX';
    try { dinero = new Intl.NumberFormat(loc, { style: 'currency', currency: 'MXN' }); }
    catch (e) { dinero = dineroEs; }
  }
  actualizarMoneda();

  var productos = {};   // id -> { id, nombre, precio }
  var orden = [];       // ids en el orden en que aparecen en la página
  var carrito = {};     // id -> cantidad

  tarjetas.forEach(function (tarjeta) {
    var p = {
      id: tarjeta.getAttribute('data-id'),
      nombre: tarjeta.getAttribute('data-nombre'),
      precio: Number(tarjeta.getAttribute('data-precio'))
    };
    if (!p.id || !isFinite(p.precio)) return;
    productos[p.id] = p;
    orden.push(p.id);

    p.precioEl = tarjeta.querySelector('.precio');

    var boton = tarjeta.querySelector('.btn-agregar');
    if (boton) {
      boton.addEventListener('click', function () {
        agregar(p.id);
        boton.textContent = tr('tienda.agregado');
        boton.classList.add('agregado');
        window.setTimeout(function () {
          boton.textContent = tr('prod.agregar');
          boton.classList.remove('agregado');
        }, 1200);
      });
    }
  });

  function anunciar(texto) {
    estado.textContent = texto || '';
  }

  function agregar(id) {
    var actual = carrito[id] || 0;
    if (actual >= MAX_POR_PRODUCTO) {
      anunciar(tr('tienda.max', { n: MAX_POR_PRODUCTO }));
      return;
    }
    carrito[id] = actual + 1;
    anunciar(tr('tienda.agregadoMsg', { p: productos[id].nombre }));
    pintar();
  }

  function cambiar(id, delta) {
    var nueva = (carrito[id] || 0) + delta;
    if (nueva <= 0) { delete carrito[id]; anunciar(tr('tienda.quitadoMsg', { p: productos[id].nombre })); }
    else if (nueva > MAX_POR_PRODUCTO) { return; }
    else { carrito[id] = nueva; anunciar(''); }
    pintar();
  }

  function quitar(id) {
    delete carrito[id];
    anunciar(tr('tienda.quitadoMsg', { p: productos[id].nombre }));
    pintar();
  }

  function vaciar() {
    carrito = {};
    anunciar(tr('tienda.vacioMsg'));
    pintar();
  }

  function total() {
    return orden.reduce(function (suma, id) {
      return suma + (carrito[id] || 0) * productos[id].precio;
    }, 0);
  }

  function boton(texto, clase, etiqueta, accion) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = clase;
    b.textContent = texto;
    if (etiqueta) b.setAttribute('aria-label', etiqueta);
    b.addEventListener('click', accion);
    return b;
  }

  function pintar() {
    lista.textContent = '';
    var hay = false;

    orden.forEach(function (id) {
      var cantidad = carrito[id];
      if (!cantidad) return;
      hay = true;
      var p = productos[id];

      var li = document.createElement('li');
      li.className = 'carrito-item';

      var top = document.createElement('div');
      top.className = 'item-top';
      var nombre = document.createElement('span');
      nombre.textContent = p.nombre;
      var linea = document.createElement('span');
      linea.className = 'item-linea';
      linea.textContent = dinero.format(cantidad * p.precio);
      top.appendChild(nombre);
      top.appendChild(linea);

      var ctrl = document.createElement('div');
      ctrl.className = 'item-controles';
      var menos = boton('−', 'qty-btn', tr('tienda.menosAria', { p: p.nombre }), function () { cambiar(id, -1); });
      var qty = document.createElement('span');
      qty.className = 'item-qty';
      qty.textContent = String(cantidad);
      var mas = boton('+', 'qty-btn', tr('tienda.masAria', { p: p.nombre }), function () { cambiar(id, 1); });
      mas.disabled = cantidad >= MAX_POR_PRODUCTO;
      var quitarBtn = boton(tr('tienda.quitar'), 'item-quitar', tr('tienda.quitarAria', { p: p.nombre }), function () { quitar(id); });
      ctrl.appendChild(menos);
      ctrl.appendChild(qty);
      ctrl.appendChild(mas);
      ctrl.appendChild(quitarBtn);

      li.appendChild(top);
      li.appendChild(ctrl);
      lista.appendChild(li);
    });

    orden.forEach(function (id) {
      if (productos[id].precioEl) productos[id].precioEl.textContent = dinero.format(productos[id].precio);
    });

    var suma = total();
    vacio.hidden = hay;
    subtotalEl.textContent = dinero.format(suma);
    totalEl.textContent = dinero.format(suma);
    btnFinalizar.disabled = !hay;
    btnVaciar.hidden = !hay;
  }

  // ---------- Finalizar: abre WhatsApp con el pedido ----------
  var WHATSAPP = '5219811410557';
  btnFinalizar.addEventListener('click', function () {
    var lineas = ['Hola, quiero hacer el siguiente pedido de Vinos Don Suárez:'];
    orden.forEach(function (id) {
      var cantidad = carrito[id];
      if (!cantidad) return;
      lineas.push('• ' + cantidad + ' × ' + productos[id].nombre + ' — ' + dineroEs.format(cantidad * productos[id].precio));
    });
    lineas.push('Total: ' + dineroEs.format(total()));
    if (I18N && I18N.lang() !== 'es') lineas.push('Idioma del cliente / Customer language: ' + I18N.nombre());
    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lineas.join('\n'));
    window.open(url, '_blank', 'noopener');
  });
  btnVaciar.addEventListener('click', vaciar);

  // Al cambiar de idioma se vuelve a pintar el pedido (textos y formato de dinero)
  if (I18N) {
    I18N.onChange(function () {
      actualizarMoneda();
      estado.textContent = '';
      pintar();
    });
  }

  pintar();
})();
