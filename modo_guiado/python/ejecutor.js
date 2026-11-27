// Corre Python en un iframe aislado (ver sandbox.html). Si un programa no
// termina a tiempo, se descarta el sandbox entero y se levanta uno nuevo.

export const LIMITE_MS = 10_000;

export const ESTADO = Object.freeze({
  CARGANDO: "cargando",
  LISTO: "listo",
  CORRIENDO: "corriendo",
  ESPERANDO: "esperando",
});

export const CANCELADO = "Se canceló la ejecución.";

// En modo repetir el sandbox corta el programa cuando input() pide un dato nuevo.
// Se pide el dato y se vuelve a correr con todas las respuestas, desde cero.
export async function correrConEntradas({ correrUnaVez, pedirEntrada, alReiniciarSalida }) {
  const entradas = [];
  for (;;) {
    const resultado = await correrUnaVez([...entradas]);
    if (!resultado.pideEntrada) return resultado;
    const valor = await pedirEntrada();
    if (valor === null) return { ok: false, error: CANCELADO };
    entradas.push(valor);
    alReiniciarSalida();
  }
}

// Deja sólo la parte del traceback que habla del código del estudiante.
export function limpiarTraceback(mensaje) {
  const lineas = mensaje.trimEnd().split("\n");
  const inicio = lineas.findIndex((linea) => linea.includes('File "<exec>"'));
  if (inicio === -1) return lineas.at(-1) ?? mensaje;
  const propias = [];
  let saltearCodigo = false;
  for (const linea of lineas.slice(inicio)) {
    const esMarco = /^\s*File "/.test(linea);
    if (esMarco) saltearCodigo = !linea.includes('File "<exec>"');
    else if (saltearCodigo && /^\s{4,}/.test(linea)) continue;
    if (esMarco && saltearCodigo) continue;
    if (!/^\s/.test(linea)) saltearCodigo = false;
    propias.push(linea.replace('File "<exec>"', "Archivo"));
  }
  return ["Traceback (most recent call last):", ...propias].join("\n");
}

export function crearEjecutor({ url = new URL("./sandbox.html", import.meta.url), alCambiarEstado = () => {} } = {}) {
  let iframe = null;
  let estado = ESTADO.CARGANDO;
  let ocupado = false;
  let corridaActual = null;
  let esperaActual = null;
  let siguienteId = 1;
  let avisarListo = () => {};
  let listo = null;

  const cambiarEstado = (nuevo) => {
    estado = nuevo;
    alCambiarEstado(nuevo);
  };

  function arrancarTemporizador() {
    clearTimeout(corridaActual.temporizador);
    corridaActual.temporizador = setTimeout(() => {
      levantar();
      terminarCorrida({
        ok: false,
        error: `Se cortó: tardó más de ${LIMITE_MS / 1000} segundos. ¿Hay un ciclo que no termina? Python se reinició y las variables anteriores se perdieron.`,
      });
      cambiarEstado(ESTADO.CARGANDO);
    }, LIMITE_MS);
  }

  function terminarCorrida(resultado) {
    if (!corridaActual) return;
    clearTimeout(corridaActual.temporizador);
    const { resolver } = corridaActual;
    corridaActual = null;
    cambiarEstado(ESTADO.LISTO);
    resolver(resultado);
  }

  // El tiempo que el estudiante tarda en responder no cuenta para el límite.
  function esperarEntrada(pedirEntrada) {
    return new Promise((resolver) => {
      esperaActual = resolver;
      cambiarEstado(ESTADO.ESPERANDO);
      pedirEntrada().then((valor) => {
        if (esperaActual !== resolver) return;
        esperaActual = null;
        cambiarEstado(ESTADO.CORRIENDO);
        resolver(valor);
      });
    });
  }

  async function responderPedido(corrida) {
    clearTimeout(corrida.temporizador);
    const valor = await esperarEntrada(corrida.pedirEntrada);
    if (valor === null || corridaActual !== corrida) return;
    arrancarTemporizador();
    iframe.contentWindow.postMessage({ tipo: "entrada", valor }, "*");
  }

  function alRecibir(evento) {
    if (!iframe || evento.source !== iframe.contentWindow) return;
    const mensaje = evento.data;
    if (mensaje.tipo === "listo") {
      cambiarEstado(corridaActual ? ESTADO.CORRIENDO : ESTADO.LISTO);
      avisarListo();
      return;
    }
    if (mensaje.tipo === "caido") {
      terminarCorrida({ ok: false, error: `No se pudo cargar Python: ${mensaje.error}` });
      return;
    }
    if (!corridaActual || mensaje.id !== corridaActual.id) return;
    if (mensaje.tipo === "salida" || mensaje.tipo === "error") {
      corridaActual.alEscribir(mensaje.texto, mensaje.tipo);
    } else if (mensaje.tipo === "pide") {
      responderPedido(corridaActual);
    } else if (mensaje.tipo === "fin") {
      terminarCorrida({
        ok: mensaje.ok,
        pideEntrada: Boolean(mensaje.pideEntrada),
        error: mensaje.ok ? null : limpiarTraceback(mensaje.error),
      });
    }
  }

  function levantar() {
    iframe?.remove();
    cambiarEstado(ESTADO.CARGANDO);
    listo = new Promise((resolver) => (avisarListo = resolver));
    iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("aria-hidden", "true");
    iframe.title = "Sandbox de Python";
    iframe.hidden = true;
    // El iframe no se revalida al recargar la página: sin esto queda un sandbox viejo en caché.
    const sinCache = new URL(url);
    sinCache.searchParams.set("v", Date.now());
    iframe.src = sinCache;
    document.body.append(iframe);
  }

  async function correrUnaVez({ codigo, espacio, entradas, alEscribir, pedirEntrada }) {
    const id = siguienteId++;
    const resultado = new Promise((resolver) => {
      corridaActual = { id, resolver, alEscribir, pedirEntrada, temporizador: null };
    });
    cambiarEstado(ESTADO.CORRIENDO);
    await listo;
    if (corridaActual?.id !== id) return resultado;
    arrancarTemporizador();
    iframe.contentWindow.postMessage({ tipo: "correr", id, codigo, espacio, entradas }, "*");
    return resultado;
  }

  window.addEventListener("message", alRecibir);
  levantar();

  return {
    estado: () => estado,

    // espacio: los bloques que comparten espacio comparten variables, como en Colab.
    // pedirEntrada: devuelve una promesa con lo que escribió el estudiante.
    // alReiniciarSalida: el programa se va a volver a correr desde el principio.
    async correr({ codigo, espacio, alEscribir = () => {}, pedirEntrada, alReiniciarSalida = () => {} }) {
      if (ocupado) return { ok: false, error: "Ya hay un programa corriendo." };
      ocupado = true;
      try {
        return await correrConEntradas({
          correrUnaVez: (entradas) => correrUnaVez({ codigo, espacio, entradas, alEscribir, pedirEntrada }),
          pedirEntrada: () => esperarEntrada(pedirEntrada),
          alReiniciarSalida,
        });
      } finally {
        ocupado = false;
      }
    },

    // Para cuando el bloque deja de estar en pantalla (por ejemplo, al cambiar de paso).
    cancelar() {
      if (esperaActual) {
        const resolver = esperaActual;
        esperaActual = null;
        resolver(null);
      }
      if (corridaActual) {
        levantar();
        terminarCorrida({ ok: false, error: CANCELADO });
        cambiarEstado(ESTADO.CARGANDO);
      }
    },

    olvidar(espacio) {
      iframe?.contentWindow?.postMessage({ tipo: "olvidar", espacio }, "*");
    },
  };
}
