/*
  CONFIGURACIÓN DE LA GALERÍA DE LA COMUNIDAD
  --------------------------------------------
  Reemplaza los valores que dicen "TU_..." con los de tu proyecto.
  La guía SETUP-FIREBASE.md explica paso a paso de dónde sacar cada uno.

  Nota: estos datos NO son contraseñas. Es normal que estén en un
  repositorio público; la seguridad la dan las reglas de Firestore
  (archivo firestore.rules).
*/
window.DON_SUAREZ_CONFIG = {
  // Firebase Console → Configuración del proyecto → Tus apps → App web
  firebase: {
    apiKey: "AIzaSyDtN0AvHVVKXJQm0am3937rc_z55kQ6640",
    authDomain: "vinos-don-suarez.firebaseapp.com",
    projectId: "vinos-don-suarez",
    appId: "1:474474020049:web:03ed1ddffae9544e4459f0"
  },

  // Cloudinary → Dashboard (cloudName) y Settings → Upload → Upload presets
  cloudinary: {
    cloudName: "sajkpxmd",
    uploadPreset: "galeria_don_suarez"
  },

  // Cuentas de Google que pueden entrar a admin.html (en minúsculas)
  adminEmails: ["wilbertsuarez816@gmail.com"]
};
