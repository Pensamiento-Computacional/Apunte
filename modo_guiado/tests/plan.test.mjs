import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { encabezados, extraerSeccion } from "../apunte.js";
import { PLAN, pasoDeSeccion, textoUnidades } from "../plan.js";
import { TIPO_PASO } from "../progreso.js";

const raizRepo = fileURLToPath(new URL("../../", import.meta.url));

test("los ids de unidades y pasos son únicos", () => {
  const idsUnidades = PLAN.unidades.map((u) => u.id);
  assert.equal(new Set(idsUnidades).size, idsUnidades.length);
  for (const unidad of PLAN.unidades) {
    const idsPasos = unidad.pasos.map((p) => p.id);
    assert.equal(new Set(idsPasos).size, idsPasos.length, unidad.id);
  }
});

const leer = (ruta) => readFileSync(`${raizRepo}${ruta}`, "utf8");

// Contenido de cada bloque de código como lo ve el navegador: sin la sangría del fence.
function bloquesDeCodigo(markdown) {
  const bloques = [];
  const patron = /^( *)```[^\n]*\n([\s\S]*?)^ *```/gm;
  for (const [, sangria, cuerpo] of markdown.matchAll(patron)) {
    const lineas = cuerpo.replace(/\n$/, "").split("\n");
    bloques.push(lineas.map((linea) => linea.replace(new RegExp(`^ {0,${sangria.length}}`), "")).join("\n"));
  }
  return bloques;
}

test("bloquesDeCodigo saca la sangría del fence", () => {
  const markdown = "texto\n\n  ```python\n  for x in y:\n      pass\n  ```\n\n```\nplano\n```";
  assert.deepEqual(bloquesDeCodigo(markdown), ["for x in y:\n    pass", "plano"]);
});

test("cada paso tiene un tipo conocido y datos válidos", () => {
  for (const unidad of PLAN.unidades) {
    for (const paso of unidad.pasos) {
      const contexto = `${unidad.id}/${paso.id}`;
      assert.ok(Object.values(TIPO_PASO).includes(paso.tipo), contexto);
      if (paso.tipo === TIPO_PASO.LECTURA) {
        assert.ok(paso.secciones.length > 0, contexto);
        const markdown = paso.secciones.map((s) => extraerSeccion(leer(unidad.fuente), s.id, s)).join("\n");
        const bloques = bloquesDeCodigo(markdown);
        for (const bloque of paso.bloquesFijos ?? []) {
          assert.ok(bloques.includes(bloque), `${contexto}: no existe el bloque ${bloque}`);
        }
        for (const imagen of Object.keys(paso.imagenesComoCodigo ?? {})) {
          assert.ok(markdown.includes(imagen), `${contexto}: no existe la imagen ${imagen}`);
        }
      }
      if (paso.tipo === TIPO_PASO.CHEQUEO) {
        assert.ok(paso.correcta >= 0 && paso.correcta < paso.opciones.length, contexto);
        assert.ok(paso.explicacion, contexto);
      }
      if (paso.tipo === TIPO_PASO.EJERCICIOS) assert.ok(paso.consigna && paso.guia && paso.seccion, contexto);
    }
  }
});

// guia.html junta todas las guías: los títulos repetidos ("Evaluación de Código")
// reciben ids con sufijo, así que el enlace depende de la guía completa.
function seccionesDeLaGuia() {
  const archivos = [...leer("guia.qmd").matchAll(/\{\{< include (\S+) >\}\}/g)].map((m) => m[1]);
  const lineas = [];
  const archivoDeLinea = [];
  for (const archivo of archivos) {
    for (const linea of leer(archivo).split("\n")) {
      lineas.push(linea);
      archivoDeLinea.push(archivo);
    }
  }
  return encabezados(lineas).map((e) => ({ id: e.id, archivo: archivoDeLinea[e.linea] }));
}

test("seccionesDeLaGuia numera los títulos repetidos como el sitio", () => {
  const ids = seccionesDeLaGuia().map((s) => s.id);
  assert.ok(ids.includes("evaluación-de-código"));
  assert.ok(ids.includes("evaluación-de-código-1"));
});

test("cada sección del plan existe en los .qmd", () => {
  for (const unidad of PLAN.unidades) {
    const apunte = leer(unidad.fuente);
    for (const paso of unidad.pasos) {
      for (const seccion of paso.secciones ?? []) {
        assert.doesNotThrow(() => extraerSeccion(apunte, seccion.id, seccion), `${unidad.fuente}#${seccion.id}`);
      }
      if (paso.tipo === TIPO_PASO.EJERCICIOS) {
        const destino = seccionesDeLaGuia().find((s) => s.id === paso.seccion);
        assert.equal(destino?.archivo, paso.guia, `guia.html#${paso.seccion} no es de ${paso.guia}`);
      }
    }
  }
});

test("textoUnidades nombra el rango de unidades", () => {
  const u = (numero) => ({ numero });
  assert.equal(textoUnidades([u(1)]), "Unidad 1");
  assert.equal(textoUnidades([u(1), u(2)]), "Unidades 1 y 2");
  assert.equal(textoUnidades([u(1), u(2), u(3)]), "Unidades 1 a 3");
});

test("pasoDeSeccion encuentra el paso que muestra una sección", () => {
  const destino = pasoDeSeccion(PLAN, "variables");
  assert.equal(destino.unidad.id, "u2");
  assert.equal(destino.paso.id, "variables");
  assert.equal(pasoDeSeccion(PLAN, "no-existe"), null);
});

test("cada enlace interno del apunte lleva a un paso del plan", () => {
  for (const unidad of PLAN.unidades) {
    for (const [, id] of leer(unidad.fuente).matchAll(/\]\(#([^)]+)\)/g)) {
      assert.ok(pasoDeSeccion(PLAN, id), `${unidad.fuente}: el enlace #${id} no lleva a ningún paso`);
    }
  }
});
