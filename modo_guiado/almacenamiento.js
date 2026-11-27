import { crearProgresoVacio } from "./progreso.js";

const PREFIJO = "pc-modo-guiado:v1";
const CLAVE_USUARIO_ACTUAL = `${PREFIJO}:usuario-actual`;
// index.html lee esta misma clave antes de pintar, para no mostrar un tema y cambiarlo.
export const CLAVE_TEMA = `${PREFIJO}:tema`;
export const TEMAS = Object.freeze(["light", "dark"]);

// Borrador: todo vive en el navegador de cada estudiante. Para ver quién la usa
// y cruzarlo con las notas hace falta un backend que implemente esta misma interfaz.
export function crearAlmacenamientoLocal(storage = globalThis.localStorage) {
  const leer = (clave) => {
    try {
      return storage.getItem(clave);
    } catch {
      return null;
    }
  };
  const escribir = (clave, valor) => {
    try {
      if (valor === null) storage.removeItem(clave);
      else storage.setItem(clave, valor);
    } catch {
      // Navegación privada o storage bloqueado: la app sigue andando sin guardar.
    }
  };

  return {
    usuarioActual: () => leer(CLAVE_USUARIO_ACTUAL),
    elegirUsuario: (usuario) => escribir(CLAVE_USUARIO_ACTUAL, usuario),
    cargarProgreso(usuario) {
      const crudo = leer(`${PREFIJO}:progreso:${usuario}`);
      if (!crudo) return crearProgresoVacio();
      try {
        return { ...crearProgresoVacio(), ...JSON.parse(crudo) };
      } catch {
        return crearProgresoVacio();
      }
    },
    temaGuardado() {
      const tema = leer(CLAVE_TEMA);
      return TEMAS.includes(tema) ? tema : null;
    },
    guardarTema: (tema) => escribir(CLAVE_TEMA, tema),
    guardarProgreso: (usuario, progreso) =>
      escribir(`${PREFIJO}:progreso:${usuario}`, JSON.stringify(progreso)),
  };
}
