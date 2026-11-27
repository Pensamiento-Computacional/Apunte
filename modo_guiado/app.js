import { crearAlmacenamientoLocal } from "./almacenamiento.js";
import { extraerSeccion, prepararMarkdown, protegerFormulas } from "./apunte.js";
import { indiceQueDefine, nombreNoDefinido } from "./pistas.js";
import { PLAN, SITIO, pasoDeSeccion, textoUnidades } from "./plan.js";
import {
  TIPO_PASO,
  clavePaso,
  completarPaso,
  estaCompleto,
  indiceSiguientePaso,
  lecturaAnterior,
  normalizarUsuario,
  pasoDesbloqueado,
  porcentajeUnidad,
  registrarEjecucion,
  responderChequeo,
  unidadDesbloqueada,
  unidadTerminada,
} from "./progreso.js";
import { ESTADO, crearEjecutor } from "./python/ejecutor.js";

const RAIZ_REPO = new URL("../", import.meta.url);
const ETIQUETA_TIPO = {
  [TIPO_PASO.LECTURA]: "Lectura",
  [TIPO_PASO.CHEQUEO]: "Chequeo",
  [TIPO_PASO.EJERCICIOS]: "Ejercicios",
};

const raiz = document.getElementById("app");
const almacenamiento = crearAlmacenamientoLocal();
let usuario = almacenamiento.usuarioActual();
let progreso = usuario ? almacenamiento.cargarProgreso(usuario) : null;
let ejecutor = null;
let numeroDeRender = 0;

const ahora = () => new Date().toISOString();

function crear(tag, atributos = {}, hijos = []) {
  const elemento = document.createElement(tag);
  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave.startsWith("on")) elemento.addEventListener(clave.slice(2), valor);
    else if (clave === "class") elemento.className = valor;
    else elemento.setAttribute(clave, valor === true ? "" : valor);
  }
  elemento.append(...[hijos].flat().filter((h) => h !== null && h !== undefined && h !== false));
  return elemento;
}

function actualizar(nuevo) {
  if (nuevo === progreso) return;
  progreso = nuevo;
  almacenamiento.guardarProgreso(usuario, progreso);
}

function nombreVisible(nombre) {
  return nombre
    .split(" ")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}

// ---------- Contenido del apunte ----------

const fuentes = new Map();
function leerFuente(ruta) {
  if (!fuentes.has(ruta)) {
    const pedido = fetch(new URL(ruta, RAIZ_REPO)).then((respuesta) => {
      if (!respuesta.ok) throw new Error(`${ruta}: ${respuesta.status}`);
      return respuesta.text();
    });
    pedido.catch(() => fuentes.delete(ruta));
    fuentes.set(ruta, pedido);
  }
  return fuentes.get(ruta);
}

function markdownAHtml(markdown) {
  const { texto, formulas } = protegerFormulas(markdown);
  const html = marked.parse(texto).replace(/FORMULA(\d+)FIN/g, (_, indice) => {
    const { tex, bloque } = formulas[Number(indice)];
    return katex.renderToString(tex, { displayMode: bloque, throwOnError: false });
  });
  const contenedor = crear("div", { class: "contenido" });
  contenedor.innerHTML = html;
  for (const imagen of contenedor.querySelectorAll("img")) {
    const src = imagen.getAttribute("src");
    if (src && !/^[a-z]+:/i.test(src)) imagen.src = new URL(src, RAIZ_REPO).href;
    imagen.loading = "lazy";
  }
  for (const enlace of contenedor.querySelectorAll('a[href^="#"]')) {
    const destino = pasoDeSeccion(PLAN, decodeURIComponent(enlace.getAttribute("href").slice(1)));
    if (destino) enlace.href = ruta(destino.unidad, destino.paso);
    else enlace.replaceWith(...enlace.childNodes);
  }
  for (const enlace of contenedor.querySelectorAll('a[href^="http"]')) {
    enlace.target = "_blank";
    enlace.rel = "noopener";
  }
  return contenedor;
}

function vistaErrorCarga(error) {
  return crear("div", { class: "aviso aviso-error" }, [
    crear("strong", {}, "No se pudo leer el apunte."),
    crear("p", {}, [
      "Esta página tiene que abrirse desde un servidor. Desde la raíz del repo: ",
      crear("code", {}, "python3 -m http.server 8000"),
      " y después ",
      crear("code", {}, "http://localhost:8000/modo_guiado/"),
    ]),
    crear("p", { class: "detalle" }, String(error.message ?? error)),
  ]);
}

// ---------- Python ----------

function obtenerEjecutor() {
  ejecutor ??= crearEjecutor({ alCambiarEstado: pintarEstadoPython });
  return ejecutor;
}

function pintarEstadoPython() {
  const indicador = document.getElementById("estado-python");
  if (!indicador || !ejecutor) return;
  const estado = ejecutor.estado();
  indicador.hidden = false;
  indicador.dataset.estado = estado;
  indicador.textContent = {
    [ESTADO.CARGANDO]: "Python cargando…",
    [ESTADO.LISTO]: "Python listo",
    [ESTADO.CORRIENDO]: "Python corriendo…",
    [ESTADO.ESPERANDO]: "Python esperando un dato…",
  }[estado];
}

// Como la consola de Colab: el campo aparece en la salida, en la misma línea del mensaje de input().
function pedirEntradaEn(salida) {
  return new Promise((resolver) => {
    const campo = crear("input", {
      class: "celda-input",
      type: "text",
      spellcheck: "false",
      autocomplete: "off",
      "aria-label": "Dato para el programa",
    });
    campo.addEventListener("keydown", (evento) => {
      if (evento.key !== "Enter") return;
      evento.preventDefault();
      campo.remove();
      resolver(campo.value);
    });
    salida.append(campo);
    campo.focus();
  });
}

function marcarCelda(celda) {
  celda.scrollIntoView({ behavior: "smooth", block: "center" });
  celda.classList.remove("celda-marcada");
  void celda.offsetWidth;
  celda.classList.add("celda-marcada");
  celda.editor.focus();
}

// Como en Colab, un estudiante puede correr un ejemplo sin haber corrido el bloque que define la función.
function pistaNombreNoDefinido(error, celda) {
  const nombre = nombreNoDefinido(error);
  if (!nombre) return null;
  const celdas = [...document.querySelectorAll(".celda")];
  const indice = indiceQueDefine(
    celdas.map((c) => c.editor.getValue()),
    celdas.indexOf(celda),
    nombre
  );
  if (indice === -1) return null;
  const ir = crear("button", { class: "boton boton-chico celda-pista-boton", type: "button" }, "Ir a ese bloque");
  ir.addEventListener("click", () => marcarCelda(celdas[indice]));
  return crear("div", { class: "celda-pista" }, [
    crear("span", {}, [
      "Python todavía no conoce ",
      crear("code", {}, nombre),
      ". Primero corré el bloque que lo define y después volvé a correr este.",
    ]),
    ir,
  ]);
}

function celdaCodigo({ inicial, espacio, alCorrer }) {
  const salida = crear("pre", { class: "celda-salida", hidden: true, "aria-live": "polite" });
  const botonCorrer = crear("button", { class: "boton boton-correr", type: "button" }, "▶ Ejecutar");
  const botonRestaurar = crear("button", { class: "boton boton-chico", type: "button", title: "Volver al código original" }, "Restaurar");
  const contenedorEditor = crear("div", { class: "celda-editor" });
  const celda = crear("div", { class: "celda" }, [
    crear("div", { class: "celda-barra" }, [
      crear("span", { class: "celda-etiqueta" }, "Python"),
      crear("span", { class: "celda-atajo" }, "Ctrl + Enter"),
      botonRestaurar,
      botonCorrer,
    ]),
    contenedorEditor,
    salida,
  ]);

  async function correr() {
    if (botonCorrer.disabled) return;
    botonCorrer.disabled = true;
    const python = obtenerEjecutor();
    salida.hidden = false;
    salida.replaceChildren();
    if (python.estado() === ESTADO.CARGANDO) {
      salida.append(crear("span", { class: "celda-nota" }, "Cargando Python. La primera vez tarda unos segundos…"));
    }
    let escribio = false;
    const limpiarNota = () => {
      if (!escribio) salida.replaceChildren();
      escribio = true;
    };
    const resultado = await python.correr({
      codigo: editor.getValue(),
      espacio,
      alEscribir(texto, flujo) {
        limpiarNota();
        salida.append(flujo === "error" ? crear("span", { class: "celda-error" }, texto) : texto);
      },
      pedirEntrada() {
        limpiarNota();
        return pedirEntradaEn(salida);
      },
      alReiniciarSalida() {
        salida.replaceChildren();
      },
    });
    if (!escribio) salida.replaceChildren();
    if (!resultado.ok) {
      salida.append(crear("span", { class: "celda-error" }, `${salida.textContent ? "\n" : ""}${resultado.error}`));
      const pista = pistaNombreNoDefinido(resultado.error, celda);
      if (pista) salida.append(pista);
    } else if (!salida.textContent) {
      salida.append(crear("span", { class: "celda-nota" }, "El programa terminó sin imprimir nada."));
    }
    botonCorrer.disabled = false;
    alCorrer?.(resultado.ok);
  }

  const editor = CodeMirror(contenedorEditor, {
    value: inicial,
    mode: "python",
    lineNumbers: true,
    indentUnit: 4,
    viewportMargin: Infinity,
    extraKeys: {
      "Ctrl-Enter": correr,
      "Cmd-Enter": correr,
      Tab: (cm) => cm.execCommand(cm.somethingSelected() ? "indentMore" : "insertSoftTab"),
    },
  });
  botonCorrer.addEventListener("click", correr);
  botonRestaurar.addEventListener("click", () => editor.setValue(inicial));
  celda.editor = editor;
  obtenerEjecutor();
  return celda;
}

function refrescarEditores() {
  for (const celda of document.querySelectorAll(".celda")) celda.editor.refresh();
}

// ---------- Tema ----------

function temaActual() {
  return (
    document.documentElement.dataset.theme ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}

function botonTema(claseExtra = "") {
  const icono = crear("i", { class: "bi", "aria-hidden": "true" });
  const boton = crear(
    "button",
    { class: `tema ${claseExtra}`.trim(), type: "button", role: "switch", "aria-label": "Modo oscuro" },
    [icono, crear("span", { class: "tema-pista", "aria-hidden": "true" }, crear("span", { class: "tema-perilla" }))]
  );
  const pintar = () => {
    const oscuro = temaActual() === "dark";
    boton.setAttribute("aria-checked", String(oscuro));
    boton.title = oscuro ? "Pasar a modo claro" : "Pasar a modo oscuro";
    icono.className = `bi ${oscuro ? "bi-moon-stars-fill" : "bi-sun-fill"}`;
  };
  boton.addEventListener("click", () => {
    const nuevo = temaActual() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nuevo;
    almacenamiento.guardarTema(nuevo);
    pintar();
  });
  pintar();
  return boton;
}

// ---------- Navegación ----------

function ruta(unidad, paso) {
  return paso ? `#/${unidad.id}/${encodeURIComponent(paso.id)}` : `#/${unidad.id}`;
}

function ir(destino) {
  if (location.hash === destino) renderizar();
  else location.hash = destino;
}

function siguienteDestino(unidad, indice) {
  const siguiente = unidad.pasos[indice + 1];
  if (siguiente && !siguiente.opcional) return ruta(unidad, siguiente);
  return "#/";
}

function primerPendiente() {
  for (const [indice, unidad] of PLAN.unidades.entries()) {
    if (!unidadDesbloqueada(progreso, PLAN, indice)) break;
    const pendiente = indiceSiguientePaso(progreso, unidad);
    if (pendiente !== -1) return { unidad, paso: unidad.pasos[pendiente] };
  }
  return null;
}

// ---------- Vistas ----------

function encabezado() {
  return crear("header", { class: "barra" }, [
    crear("a", { class: "marca", href: "#/" }, [
      crear("span", { class: "marca-logo", "aria-hidden": "true" }, ">_"),
      crear("span", {}, [crear("strong", {}, "Pensamiento Computacional"), crear("small", {}, "Modo guiado")]),
    ]),
    crear("span", { id: "estado-python", class: "estado-python", hidden: true }),
    crear("div", { class: "menu-usuario" }, [
      botonTema(),
      crear("span", { class: "usuario" }, nombreVisible(usuario)),
      crear("button", { class: "boton boton-chico", type: "button", onclick: exportar }, "Exportar avance"),
      crear("button", { class: "boton boton-chico", type: "button", onclick: salir }, "Salir"),
    ]),
  ]);
}

function vistaIngreso() {
  const campo = crear("input", {
    id: "nombre",
    autocomplete: "name",
    required: true,
    placeholder: "Ej.: Ana López",
  });
  const formulario = crear("form", { class: "ingreso" }, [
    crear("span", { class: "marca-logo grande", "aria-hidden": "true" }, ">_"),
    crear("h1", {}, "Pensamiento Computacional"),
    crear("p", { class: "bajada" }, `Modo guiado · ${textoUnidades(PLAN.unidades)}`),
    crear("p", {}, "Leé el apunte de a partes, corré el código ahí mismo y resolvé los ejercicios de la guía antes de seguir."),
    crear("label", { for: "nombre" }, "Tu nombre y apellido"),
    campo,
    crear("button", { class: "boton boton-principal", type: "submit" }, "Empezar"),
    crear("p", { class: "nota" }, "Borrador: el avance se guarda sólo en este navegador."),
  ]);
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const nombre = normalizarUsuario(campo.value);
    if (!nombre) return;
    usuario = nombre;
    almacenamiento.elegirUsuario(usuario);
    progreso = almacenamiento.cargarProgreso(usuario);
    ir("#/");
  });
  setTimeout(() => campo.focus());
  return crear("main", { class: "pantalla-ingreso" }, [botonTema("ingreso-tema"), formulario]);
}

function barraProgreso(porcentaje) {
  return crear("div", { class: "progreso", role: "progressbar", "aria-valuenow": porcentaje, "aria-valuemin": 0, "aria-valuemax": 100 }, [
    crear("div", { style: `width: ${porcentaje}%` }),
  ]);
}

function vistaInicio() {
  const pendiente = primerPendiente();
  const seguir = pendiente
    ? crear("a", { class: "seguir", href: ruta(pendiente.unidad, pendiente.paso) }, [
        crear("span", { class: "seguir-etiqueta" }, `Seguí donde dejaste · Unidad ${pendiente.unidad.numero}`),
        crear("strong", {}, pendiente.paso.titulo),
        crear("span", { class: "seguir-flecha", "aria-hidden": "true" }, "→"),
      ])
    : crear("div", { class: "seguir seguir-fin" }, [
        crear("strong", {}, `¡Terminaste las ${textoUnidades(PLAN.unidades)}!`),
        crear("span", {}, "Repasá lo que quieras desde las tarjetas."),
      ]);

  const tarjetas = PLAN.unidades.map((unidad, indice) => {
    const abierta = unidadDesbloqueada(progreso, PLAN, indice);
    const porcentaje = porcentajeUnidad(progreso, unidad);
    const obligatorios = unidad.pasos.filter((p) => !p.opcional);
    const hechos = obligatorios.filter((p) => estaCompleto(progreso, unidad, p)).length;
    return crear("article", { class: `tarjeta-unidad${abierta ? "" : " cerrada"}` }, [
      crear("span", { class: "unidad-numero" }, `Unidad ${unidad.numero}`),
      crear("h2", {}, unidad.titulo),
      barraProgreso(porcentaje),
      crear("p", { class: "nota" }, unidadTerminada(progreso, unidad) ? "Completa ✓" : `${hechos} de ${obligatorios.length} pasos`),
      crear("div", { class: "tarjeta-acciones" }, [
        abierta
          ? crear("a", { class: "boton", href: ruta(unidad) }, porcentaje === 0 ? "Empezar" : "Entrar")
          : crear("span", { class: "nota" }, `🔒 Se abre al terminar la Unidad ${PLAN.unidades[indice - 1].numero}`),
        crear("a", { class: "enlace", href: unidad.video, target: "_blank", rel: "noopener" }, "Videos ↗"),
      ]),
    ]);
  });

  return crear("main", { class: "pantalla-inicio" }, [
    crear("h1", {}, `Hola, ${nombreVisible(usuario).split(" ")[0]}`),
    seguir,
    crear("section", { class: "unidades" }, tarjetas),
  ]);
}

function iconoPaso(unidad, paso, indice) {
  if (estaCompleto(progreso, unidad, paso)) return "✓";
  if (!pasoDesbloqueado(progreso, unidad, indice)) return "🔒";
  return String(indice + 1);
}

function riel(unidad, pasoActual) {
  return crear("nav", { class: "riel", "aria-label": "Pasos de la unidad" }, [
    crear("a", { class: "riel-volver", href: "#/" }, "← Inicio"),
    crear("p", { class: "riel-unidad" }, `Unidad ${unidad.numero}`),
    barraProgreso(porcentajeUnidad(progreso, unidad)),
    crear(
      "ol",
      {},
      unidad.pasos.map((paso, indice) => {
        const estado = estaCompleto(progreso, unidad, paso)
          ? "hecho"
          : pasoDesbloqueado(progreso, unidad, indice)
            ? "abierto"
            : "bloqueado";
        return crear("li", { class: `riel-paso ${estado}${paso === pasoActual ? " actual" : ""}` }, [
          crear("a", { href: ruta(unidad, paso), "aria-current": paso === pasoActual ? "step" : null }, [
            crear("span", { class: "riel-icono" }, iconoPaso(unidad, paso, indice)),
            crear("span", { class: "riel-texto" }, [
              crear("span", {}, paso.titulo),
              crear("small", {}, paso.opcional ? `${ETIQUETA_TIPO[paso.tipo]} · opcional` : ETIQUETA_TIPO[paso.tipo]),
            ]),
          ]),
        ]);
      })
    ),
  ]);
}

function repintarRiel(unidad, paso) {
  document.querySelector(".riel")?.replaceWith(riel(unidad, paso));
}

function accionSeguir(unidad, paso, indice, texto) {
  const seguir = () => {
    actualizar(completarPaso(progreso, unidad, paso, ahora()));
    ir(siguienteDestino(unidad, indice));
  };
  return crear(
    "div",
    { class: "accion" },
    crear("button", { class: "boton boton-principal", type: "button", onclick: seguir }, texto)
  );
}

function vistaBloqueado(unidad, indice) {
  const pendiente = unidad.pasos.find(
    (paso, i) => i < indice && !paso.opcional && !estaCompleto(progreso, unidad, paso)
  );
  return crear("div", { class: "paso-bloqueado" }, [
    crear("span", { class: "paso-bloqueado-icono", "aria-hidden": "true" }, "🔒"),
    crear("h2", {}, "Todavía no"),
    crear("p", {}, ["Este paso se abre cuando termines ", crear("strong", {}, pendiente.titulo), "."]),
    crear("a", { class: "boton boton-principal", href: ruta(unidad, pendiente) }, "Ir a ese paso"),
  ]);
}

async function vistaLectura(unidad, paso, indice) {
  const texto = await leerFuente(unidad.fuente);
  const clave = clavePaso(unidad, paso);
  const secciones = paso.secciones.map((seccion) => {
    const contenido = markdownAHtml(prepararMarkdown(extraerSeccion(texto, seccion.id, seccion)));
    const celda = (codigo, bloque) =>
      celdaCodigo({
        inicial: codigo,
        espacio: clave,
        alCorrer: (ok) => actualizar(registrarEjecucion(progreso, unidad, paso, bloque, ok, ahora())),
      });
    contenido.querySelectorAll("pre > code.language-python-ejecutable").forEach((codigo, numero) => {
      const fuente = codigo.textContent.replace(/\n$/, "");
      if (paso.bloquesFijos?.includes(fuente)) return;
      codigo.parentElement.replaceWith(celda(fuente, `${seccion.id}#${numero}`));
    });
    for (const [imagen, codigo] of Object.entries(paso.imagenesComoCodigo ?? {})) {
      const destino = new URL(imagen, RAIZ_REPO).href;
      for (const img of contenido.querySelectorAll("img")) {
        if (img.src === destino) img.replaceWith(celda(codigo, imagen));
      }
    }
    return contenido;
  });
  const tieneCodigo = secciones.some((s) => s.querySelector(".celda"));

  return [
    tieneCodigo
      ? crear(
          "p",
          { class: "aviso" },
          unidad.yaVieronVariables
            ? "Los bloques de código se pueden editar y ejecutar. Comparten variables entre sí, como en Colab: corrélos de arriba hacia abajo."
            : "Los bloques de código se pueden editar y ejecutar."
        )
      : null,
    ...secciones,
    accionSeguir(unidad, paso, indice, "Siguiente →"),
  ];
}

function vistaChequeo(unidad, paso, indice) {
  const hecho = estaCompleto(progreso, unidad, paso);
  const devolucion = crear("div", { class: "devolucion", "aria-live": "polite" });
  const siguiente = () =>
    crear("button", { class: "boton boton-principal", type: "button", onclick: () => ir(siguienteDestino(unidad, indice)) }, "Siguiente →");

  const mostrarCorrecta = () => {
    devolucion.replaceChildren(
      crear("p", { class: "bien" }, "¡Bien!"),
      crear("p", {}, paso.explicacion),
      crear("div", { class: "accion" }, siguiente())
    );
  };

  const opciones = paso.opciones.map((texto, i) =>
    crear(
      "button",
      {
        class: `opcion${hecho && i === paso.correcta ? " correcta" : ""}`,
        type: "button",
        onclick: (evento) => {
          const resultado = responderChequeo(progreso, unidad, paso, i, ahora());
          actualizar(resultado.progreso);
          for (const boton of opciones) boton.classList.remove("correcta", "incorrecta");
          evento.currentTarget.classList.add(resultado.correcta ? "correcta" : "incorrecta");
          if (resultado.correcta) {
            mostrarCorrecta();
            repintarRiel(unidad, paso);
          } else {
            const lectura = lecturaAnterior(unidad, indice);
            devolucion.replaceChildren(
              crear("p", { class: "mal" }, "No es esa. Releé la parte anterior y probá otra vez."),
              lectura
                ? crear("a", { class: "boton", href: ruta(unidad, lectura) }, `← Volver a leer: ${lectura.titulo}`)
                : null
            );
          }
        },
      },
      [crear("span", { class: "opcion-letra" }, String.fromCharCode(65 + i)), crear("span", {}, texto)]
    )
  );
  if (hecho) mostrarCorrecta();

  const [enunciado, ...codigo] = paso.pregunta.split("\n\n").reverse();
  return [
    codigo.length ? crear("pre", { class: "pregunta-codigo" }, codigo.reverse().join("\n\n")) : null,
    crear("p", { class: "pregunta" }, enunciado),
    crear("div", { class: "opciones" }, opciones),
    devolucion,
  ];
}

function vistaEjercicios(unidad, paso, indice) {
  return [
    crear("div", { class: "consigna" }, [
      crear("p", {}, paso.consigna),
      crear(
        "a",
        { class: "enlace", href: `${SITIO}guia.html#${encodeURIComponent(paso.seccion)}`, target: "_blank", rel: "noopener" },
        "Abrir la guía ↗"
      ),
    ]),
    accionSeguir(unidad, paso, indice, estaCompleto(progreso, unidad, paso) ? "Siguiente →" : "Ya resolví los ejercicios →"),
  ];
}

async function vistaPaso(unidad, paso, indice) {
  if (!pasoDesbloqueado(progreso, unidad, indice)) return [vistaBloqueado(unidad, indice)];
  if (paso.tipo === TIPO_PASO.LECTURA) return vistaLectura(unidad, paso, indice);
  if (paso.tipo === TIPO_PASO.CHEQUEO) return vistaChequeo(unidad, paso, indice);
  return vistaEjercicios(unidad, paso, indice);
}

async function vistaUnidad(unidad, paso, indice) {
  const contenido = crear("article", { class: "paso" }, [
    crear("p", { class: "paso-tipo" }, `${ETIQUETA_TIPO[paso.tipo]} · Paso ${indice + 1} de ${unidad.pasos.length}`),
    crear("h1", {}, paso.titulo),
  ]);
  try {
    contenido.append(...(await vistaPaso(unidad, paso, indice)).filter(Boolean));
  } catch (error) {
    contenido.append(vistaErrorCarga(error));
  }
  return crear("main", { class: "pantalla-unidad" }, [riel(unidad, paso), contenido]);
}

// ---------- Acciones ----------

function exportar() {
  const datos = JSON.stringify({ usuario, plan: PLAN.version, exportado: ahora(), progreso }, null, 2);
  const enlace = crear("a", {
    href: URL.createObjectURL(new Blob([datos], { type: "application/json" })),
    download: `modo-guiado-${usuario.replace(/\s+/g, "-")}.json`,
  });
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

function salir() {
  almacenamiento.elegirUsuario(null);
  usuario = null;
  progreso = null;
  ir("#/");
}

// ---------- Render ----------

async function renderizar() {
  const esteRender = ++numeroDeRender;
  ejecutor?.cancelar();
  if (!usuario) {
    raiz.replaceChildren(vistaIngreso());
    return;
  }

  const [, idUnidad, idPaso] = location.hash.split("/");
  const indiceUnidad = PLAN.unidades.findIndex((u) => u.id === idUnidad);
  const unidad = PLAN.unidades[indiceUnidad];
  if (!unidad || !unidadDesbloqueada(progreso, PLAN, indiceUnidad)) {
    raiz.replaceChildren(encabezado(), vistaInicio());
    pintarEstadoPython();
    return;
  }

  let indicePaso = unidad.pasos.findIndex((p) => p.id === decodeURIComponent(idPaso ?? ""));
  if (indicePaso === -1) {
    const pendiente = indiceSiguientePaso(progreso, unidad);
    location.replace(ruta(unidad, unidad.pasos[pendiente === -1 ? 0 : pendiente]));
    return;
  }

  const vista = await vistaUnidad(unidad, unidad.pasos[indicePaso], indicePaso);
  if (esteRender !== numeroDeRender) return;
  raiz.replaceChildren(encabezado(), vista);
  pintarEstadoPython();
  refrescarEditores();
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", renderizar);
renderizar();
