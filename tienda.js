/*
  Tienda (SIMULACIÓN) — Vinos Don Suárez
  - Todo ocurre en la página: no hay pagos, no se envía ni se guarda ningún dato,
    no usa Firebase ni Cloudinary (no genera peticiones ni costos).
  - Los precios están en index.html (atributo data-precio de cada tarjeta).
    SON PRECIOS DE EJEMPLO: hay que cambiarlos por los reales.
  - Cuando existan los permisos, el botón "Finalizar pedido" es el punto donde
    se conectaría el pago (por ejemplo, Stripe).
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
  var dialogo = document.getElementById('demoDialog');
  var dResumen = document.getElementById('demoResumen');
  var dTotal = document.getElementById('demoTotal');

  var MAX_POR_PRODUCTO = 12;
  var dinero = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

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

    var precioEl = tarjeta.querySelector('.precio');
    if (precioEl) precioEl.textContent = dinero.format(p.precio);

    var boton = tarjeta.querySelector('.btn-agregar');
    if (boton) {
      boton.addEventListener('click', function () {
        agregar(p.id);
        var original = boton.getAttribute('data-texto') || boton.textContent;
        boton.setAttribute('data-texto', original);
        boton.textContent = 'Agregado ✓';
        boton.classList.add('agregado');
        window.setTimeout(function () {
          boton.textContent = original;
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
      anunciar('Máximo ' + MAX_POR_PRODUCTO + ' botellas por producto en esta demostración.');
      return;
    }
    carrito[id] = actual + 1;
    anunciar(productos[id].nombre + ' agregado al pedido.');
    pintar();
  }

  function cambiar(id, delta) {
    var nueva = (carrito[id] || 0) + delta;
    if (nueva <= 0) { delete carrito[id]; anunciar(productos[id].nombre + ' quitado del pedido.'); }
    else if (nueva > MAX_POR_PRODUCTO) { return; }
    else { carrito[id] = nueva; anunciar(''); }
    pintar();
  }

  function quitar(id) {
    delete carrito[id];
    anunciar(productos[id].nombre + ' quitado del pedido.');
    pintar();
  }

  function vaciar() {
    carrito = {};
    anunciar('Pedido vacío.');
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
      var menos = boton('−', 'qty-btn', 'Quitar una botella de ' + p.nombre, function () { cambiar(id, -1); });
      var qty = document.createElement('span');
      qty.className = 'item-qty';
      qty.textContent = String(cantidad);
      var mas = boton('+', 'qty-btn', 'Agregar una botella de ' + p.nombre, function () { cambiar(id, 1); });
      mas.disabled = cantidad >= MAX_POR_PRODUCTO;
      var quitarBtn = boton('Quitar', 'item-quitar', 'Quitar ' + p.nombre + ' del pedido', function () { quitar(id); });
      ctrl.appendChild(menos);
      ctrl.appendChild(qty);
      ctrl.appendChild(mas);
      ctrl.appendChild(quitarBtn);

      li.appendChild(top);
      li.appendChild(ctrl);
      lista.appendChild(li);
    });

    var suma = total();
    vacio.hidden = hay;
    subtotalEl.textContent = dinero.format(suma);
    totalEl.textContent = dinero.format(suma);
    btnFinalizar.disabled = !hay;
    btnVaciar.hidden = !hay;
  }

  // ---------- Finalizar (solo demostración) ----------
  btnFinalizar.addEventListener('click', function () {
    dResumen.textContent = '';
    orden.forEach(function (id) {
      var cantidad = carrito[id];
      if (!cantidad) return;
      var li = document.createElement('li');
      var izq = document.createElement('span');
      izq.textContent = cantidad + ' × ' + productos[id].nombre;
      var der = document.createElement('span');
      der.textContent = dinero.format(cantidad * productos[id].precio);
      li.appendChild(izq);
      li.appendChild(der);
      dResumen.appendChild(li);
    });
    dTotal.textContent = dinero.format(total());
    if (typeof dialogo.showModal === 'function') dialogo.showModal();
    else dialogo.setAttribute('open', '');
  });

  function cerrarDialogo() {
    if (typeof dialogo.close === 'function') dialogo.close();
    else dialogo.removeAttribute('open');
  }
  document.getElementById('demoCerrar').addEventListener('click', cerrarDialogo);
  dialogo.addEventListener('click', function (e) { if (e.target === dialogo) cerrarDialogo(); });
  btnVaciar.addEventListener('click', vaciar);

  pintar();
})();
