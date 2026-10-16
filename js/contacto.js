/*
  Formulario de contacto: abre Gmail (en el navegador) con el mensaje ya redactado.
  No guarda ni envía nada por su cuenta: la persona revisa y manda el correo desde Gmail.
  Para cambiar el destinatario, edita DESTINO.
*/
(function () {
  'use strict';
  var form = document.getElementById('contactoForm');
  if (!form) return;
  var DESTINO = 'vinosdonsuarez@gmail.com';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nombre = form.elements.nombre.value.trim();
    var correo = form.elements.correo.value.trim();
    var mensaje = form.elements.mensaje.value.trim();
    var cuerpo = mensaje + '\n\n— ' + nombre + '\nCorreo: ' + correo;
    var url = 'https://mail.google.com/mail/?view=cm&fs=1' +
      '&to=' + encodeURIComponent(DESTINO) +
      '&su=' + encodeURIComponent('Mensaje desde la página de Don Suárez') +
      '&body=' + encodeURIComponent(cuerpo);
    window.open(url, '_blank', 'noopener');
  });
})();
