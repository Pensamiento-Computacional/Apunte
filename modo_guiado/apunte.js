// Lee los .qmd del apunte y de la guía sin pasar por Quarto.

const FENCE = /^\s*```/;
const APERTURA_CALLOUT = /^:::\s*\{\.callout-([a-z]+)[^}]*\}\s*$/;
const CIERRE_CALLOUT = /^:::\s*$/;
const ENCABEZADO = /^(#{1,6})\s+(.*?)\s*$/;

export function quitarFrontMatter(texto) {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  if (lineas[0] !== "---") return lineas.join("\n");
  const fin = lineas.indexOf("---", 1);
  return lineas.slice(fin + 1).join("\n");
}

// Mismo criterio que los identificadores automáticos de Pandoc, para que los
// ids del plan sean los mismos que los del sitio publicado.
export function slug(titulo) {
  const explicito = titulo.match(/\{#([^}\s]+)[^}]*\}\s*$/);
  if (explicito) return explicito[1];
  const plano = titulo
    .replace(/\{[^}]*\}\s*$/, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*`]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\-.\s]/gu, "")
    .replace(/\s/g, "-");
  return plano.replace(/^[^\p{L}]+/u, "") || "section";
}

function tituloLimpio(titulo) {
  return titulo.replace(/\{[^}]*\}\s*$/, "").replace(/\s*\\$/, "").trim();
}

// Encabezados que son secciones: los de adentro de bloques de código o de
// callouts no cuentan (Quarto usa el del callout como su título).
export function encabezados(lineas) {
  const resultado = [];
  const usados = new Map();
  let enCodigo = false;
  let profundidadCallout = 0;
  lineas.forEach((linea, indice) => {
    if (FENCE.test(linea)) {
      enCodigo = !enCodigo;
      return;
    }
    if (enCodigo) return;
    if (APERTURA_CALLOUT.test(linea)) profundidadCallout += 1;
    else if (CIERRE_CALLOUT.test(linea) && profundidadCallout > 0) profundidadCallout -= 1;
    if (profundidadCallout > 0) return;
    const coincidencia = linea.match(ENCABEZADO);
    if (!coincidencia) return;
    const base = slug(coincidencia[2]);
    const repeticiones = usados.get(base) ?? 0;
    usados.set(base, repeticiones + 1);
    resultado.push({
      nivel: coincidencia[1].length,
      id: repeticiones === 0 ? base : `${base}-${repeticiones}`,
      titulo: tituloLimpio(coincidencia[2]),
      linea: indice,
    });
  });
  return resultado;
}

function rangoSeccion(texto, id, soloIntro) {
  const lineas = quitarFrontMatter(texto).split("\n");
  const lista = encabezados(lineas);
  const posicion = lista.findIndex((e) => e.id === id);
  if (posicion === -1) throw new Error(`No existe la sección "${id}"`);
  const actual = lista[posicion];
  const siguiente = lista
    .slice(posicion + 1)
    .find((e) => soloIntro || e.nivel <= actual.nivel);
  return { lineas, actual, fin: siguiente ? siguiente.linea : lineas.length };
}

// Devuelve el markdown de una sección con su título llevado a nivel 2.
export function extraerSeccion(texto, id, { soloIntro = false } = {}) {
  const { lineas, actual, fin } = rangoSeccion(texto, id, soloIntro);
  const desplazamiento = 2 - actual.nivel;
  let enCodigo = false;
  const cuerpo = lineas.slice(actual.linea + 1, fin).map((linea) => {
    if (FENCE.test(linea)) enCodigo = !enCodigo;
    const coincidencia = !enCodigo && linea.match(ENCABEZADO);
    if (!coincidencia) return linea;
    const nivel = Math.min(6, Math.max(2, coincidencia[1].length + desplazamiento));
    return `${"#".repeat(nivel)} ${tituloLimpio(coincidencia[2])}`;
  });
  return [`## ${actual.titulo}`, ...cuerpo].join("\n").trim();
}

const CORTA_PARRAFO = /^\s*($|[-*+]\s|\d+\.\s|#{1,6}\s|:::|```|<\/?div)/;

// Para Pandoc "\ " es un espacio. Fuera del código inline se reemplaza.
function espaciosEscapados(linea) {
  return linea
    .split("`")
    .map((parte, indice) => (indice % 2 === 0 ? parte.replace(/\\ (?=\S)/g, " ") : parte))
    .join("`");
}

// Una "\" al final de línea es un salto sólo si el párrafo sigue en la línea
// siguiente y ya tiene texto antes. Pandoc descarta las demás; los parsers de
// markdown las muestran.
export function limpiarSaltos(markdown) {
  const lineas = markdown.split("\n");
  const salida = [];
  let enCodigo = false;
  let enFormula = false;
  lineas.forEach((linea, indice) => {
    if (FENCE.test(linea)) enCodigo = !enCodigo;
    if (enCodigo) return salida.push(linea);
    if ((linea.match(/\$\$/g) ?? []).length % 2 === 1) enFormula = !enFormula;
    if (enFormula) return salida.push(linea);
    linea = espaciosEscapados(linea);
    if (!/\\\s*$/.test(linea)) return salida.push(linea);
    const siguiente = lineas[indice + 1];
    const sigueElParrafo = siguiente !== undefined && !CORTA_PARRAFO.test(siguiente);
    const empiezaParrafo = /^\s*\\\s*$/.test(linea) && CORTA_PARRAFO.test(salida.at(-1) ?? "");
    salida.push(linea.replace(/\s*\\\s*$/, sigueElParrafo && !empiezaParrafo ? "\\" : ""));
  });
  return salida.join("\n");
}

// Pasa la sintaxis propia de Quarto a markdown + HTML que entiende cualquier parser.
export function prepararMarkdown(markdown) {
  const salida = [];
  let enCodigo = false;
  let esperandoTitulo = false;
  for (const linea of markdown.split("\n")) {
    if (FENCE.test(linea)) {
      if (!enCodigo) {
        const lenguaje = linea.trim().slice(3).replace(/[{}]/g, "").trim();
        const sangria = linea.match(/^\s*/)[0];
        salida.push(`${sangria}\`\`\`${lenguaje === "python" ? "python-ejecutable" : lenguaje || "text"}`);
      } else {
        salida.push(linea);
      }
      enCodigo = !enCodigo;
      esperandoTitulo = false;
      continue;
    }
    if (enCodigo) {
      salida.push(linea);
      continue;
    }
    const apertura = linea.match(APERTURA_CALLOUT);
    if (apertura) {
      salida.push("", `<div class="callout callout-${apertura[1]}">`, "");
      esperandoTitulo = true;
      continue;
    }
    if (CIERRE_CALLOUT.test(linea)) {
      salida.push("", "</div>", "");
      esperandoTitulo = false;
      continue;
    }
    if (esperandoTitulo && linea.trim() !== "") {
      esperandoTitulo = false;
      const titulo = linea.match(ENCABEZADO);
      if (titulo) {
        salida.push('<div class="callout-titulo">', "", tituloLimpio(titulo[2]), "", "</div>", "");
        continue;
      }
    }
    salida.push(linea);
  }
  return limpiarSaltos(salida.join("\n"));
}

// Saca las fórmulas antes del parser de markdown, que si no rompe los "_" y "\".
export function protegerFormulas(markdown) {
  const formulas = [];
  const proteger = (texto) =>
    texto.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+)\$/g, (_, bloque, enLinea) => {
      formulas.push({ tex: (bloque ?? enLinea).trim(), bloque: bloque !== undefined });
      return `FORMULA${formulas.length - 1}FIN`;
    });
  const texto = partirPorCodigo(markdown)
    .map(({ codigo, texto }) => (codigo ? texto : proteger(texto)))
    .join("\n");
  return { texto, formulas };
}

function partirPorCodigo(markdown) {
  const partes = [];
  let enCodigo = false;
  for (const linea of markdown.split("\n")) {
    const esFence = FENCE.test(linea);
    const codigo = enCodigo || esFence;
    if (esFence) enCodigo = !enCodigo;
    const ultima = partes.at(-1);
    if (ultima?.codigo === codigo) ultima.texto += `\n${linea}`;
    else partes.push({ codigo, texto: linea });
  }
  return partes;
}
