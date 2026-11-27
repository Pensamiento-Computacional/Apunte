export const TIPO_PASO = Object.freeze({
  LECTURA: "lectura",
  CHEQUEO: "chequeo",
  EJERCICIOS: "ejercicios",
});

export const TIPO_EVENTO = Object.freeze({
  PASO_COMPLETADO: "paso_completado",
  RESPUESTA_CHEQUEO: "respuesta_chequeo",
  CODIGO_EJECUTADO: "codigo_ejecutado",
});

export function crearProgresoVacio() {
  return { completados: {}, eventos: [] };
}

export function clavePaso(unidad, paso) {
  return `${unidad.id}/${paso.id}`;
}

export function estaCompleto(progreso, unidad, paso) {
  return Boolean(progreso.completados[clavePaso(unidad, paso)]);
}

function pasosObligatorios(unidad) {
  return unidad.pasos.filter((paso) => !paso.opcional);
}

export function pasoDesbloqueado(progreso, unidad, indice) {
  return unidad.pasos
    .slice(0, indice)
    .filter((paso) => !paso.opcional)
    .every((paso) => estaCompleto(progreso, unidad, paso));
}

export function porcentajeUnidad(progreso, unidad) {
  const obligatorios = pasosObligatorios(unidad);
  if (obligatorios.length === 0) return 100;
  const hechos = obligatorios.filter((paso) => estaCompleto(progreso, unidad, paso));
  return Math.round((hechos.length / obligatorios.length) * 100);
}

export function unidadTerminada(progreso, unidad) {
  return porcentajeUnidad(progreso, unidad) === 100;
}

// Una unidad se abre recién cuando la anterior está terminada: es la regla
// "antes de seguir con los temas, hacé los ejercicios" llevada a nivel unidad.
export function unidadDesbloqueada(progreso, plan, indiceUnidad) {
  return plan.unidades
    .slice(0, indiceUnidad)
    .every((unidad) => unidadTerminada(progreso, unidad));
}

export function indiceSiguientePaso(progreso, unidad) {
  return unidad.pasos.findIndex(
    (paso) => !paso.opcional && !estaCompleto(progreso, unidad, paso)
  );
}

// A dónde mandar a releer cuando una respuesta de chequeo está mal.
export function lecturaAnterior(unidad, indice) {
  return unidad.pasos.slice(0, indice).findLast((paso) => paso.tipo === TIPO_PASO.LECTURA);
}

function conEvento(progreso, evento) {
  return { ...progreso, eventos: [...progreso.eventos, evento] };
}


export function completarPaso(progreso, unidad, paso, ahora) {
  const clave = clavePaso(unidad, paso);
  if (progreso.completados[clave]) return progreso;
  return conEvento({ ...progreso, completados: { ...progreso.completados, [clave]: true } }, {
    tipo: TIPO_EVENTO.PASO_COMPLETADO,
    paso: clave,
    fecha: ahora,
  });
}

export function responderChequeo(progreso, unidad, paso, indiceOpcion, ahora) {
  const clave = clavePaso(unidad, paso);
  const correcta = indiceOpcion === paso.correcta;
  let nuevo = conEvento(progreso, {
    tipo: TIPO_EVENTO.RESPUESTA_CHEQUEO,
    paso: clave,
    opcion: indiceOpcion,
    correcta,
    fecha: ahora,
  });
  if (correcta) nuevo = completarPaso(nuevo, unidad, paso, ahora);
  return { progreso: nuevo, correcta };
}

export function registrarEjecucion(progreso, unidad, paso, bloque, ok, ahora) {
  return conEvento(progreso, {
    tipo: TIPO_EVENTO.CODIGO_EJECUTADO,
    paso: clavePaso(unidad, paso),
    bloque,
    ok,
    fecha: ahora,
  });
}

export function normalizarUsuario(texto) {
  return texto.trim().toLowerCase().replace(/\s+/g, " ");
}
