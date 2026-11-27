import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  encabezados,
  extraerSeccion,
  limpiarSaltos,
  prepararMarkdown,
  protegerFormulas,
  quitarFrontMatter,
  slug,
} from "../apunte.js";

const raizRepo = fileURLToPath(new URL("../../", import.meta.url));

const QMD = `---
title: "Prueba"
---

:::{.callout-note}
### Título del callout
Texto del callout.
:::

## Introducción

Intro.

### Hola, Mundo!

\`\`\`{python}
# esto no es un encabezado
print("hola")
\`\`\`

#### Detalle

Más.

### ¡Cuidado!

Uno.

### ¡Cuidado!

Dos.

## Otra parte {.unnumbered}

Fin.
`;

test("quitarFrontMatter saca sólo el bloque inicial", () => {
  assert.equal(quitarFrontMatter("---\na: 1\n---\nhola"), "hola");
  assert.equal(quitarFrontMatter("hola\n---"), "hola\n---");
});

test("slug sigue las reglas de Pandoc", () => {
  assert.equal(slug("Hola, Mundo!"), "hola-mundo");
  assert.equal(slug("¡Cuidado!"), "cuidado");
  assert.equal(slug("1.1. Ejercicios de descomposición"), "ejercicios-de-descomposición");
  assert.equal(slug("Guía de Ejercicios {.unnumbered}"), "guía-de-ejercicios");
  assert.equal(slug("Con id {#sec-propio}"), "sec-propio");
  assert.equal(slug("Imprimiendo (interpolación de Cadenas)"), "imprimiendo-interpolación-de-cadenas");
});

test("encabezados ignora código y callouts, y numera repetidos", () => {
  const ids = encabezados(quitarFrontMatter(QMD).split("\n")).map((e) => e.id);
  assert.deepEqual(ids, ["introducción", "hola-mundo", "detalle", "cuidado", "cuidado-1", "otra-parte"]);
});

test("extraerSeccion incluye subsecciones y lleva el título a nivel 2", () => {
  const md = extraerSeccion(QMD, "hola-mundo");
  assert.ok(md.startsWith("## Hola, Mundo!"));
  assert.ok(md.includes("## Detalle"));
  assert.ok(md.includes("# esto no es un encabezado"));
  assert.ok(!md.includes("Uno."));
});

test("extraerSeccion con soloIntro corta en el primer subtítulo", () => {
  const md = extraerSeccion(QMD, "introducción", { soloIntro: true });
  assert.equal(md, "## Introducción\n\nIntro.");
});

test("extraerSeccion falla con un id inexistente", () => {
  assert.throws(() => extraerSeccion(QMD, "no-existe"), /no-existe/);
});

test("prepararMarkdown convierte callouts y marca el código ejecutable", () => {
  const md = prepararMarkdown(":::{.callout-tip}\n### Ojo\nTexto\n:::\n\n```{python}\nx = 1\n```\n\n```{txt}\nsalida\n```");
  assert.ok(md.includes('<div class="callout callout-tip">'));
  assert.ok(md.includes('<div class="callout-titulo">\n\nOjo\n\n</div>'));
  assert.ok(md.includes("```python-ejecutable\nx = 1"));
  assert.ok(md.includes("```txt\nsalida"));
});

test("protegerFormulas saca las fórmulas fuera del código", () => {
  const { texto, formulas } = protegerFormulas("Sea $v_1$ y\n$$x^2$$\n```\nprint('$a$')\n```");
  assert.equal(texto, "Sea FORMULA0FIN y\nFORMULA1FIN\n```\nprint('$a$')\n```");
  assert.deepEqual(formulas, [
    { tex: "v_1", bloque: false },
    { tex: "x^2", bloque: true },
  ]);
});

test("protegerFormulas toma fórmulas $$ de varias líneas", () => {
  const md = "La matriz:\n\n$$\n\\begin{bmatrix}\n1 & 2 \\\\\n3 & 4\n\\end{bmatrix}\n$$\n\nsigue";
  const { texto, formulas } = protegerFormulas(md);
  assert.equal(texto, "La matriz:\n\nFORMULA0FIN\n\nsigue");
  assert.deepEqual(formulas, [{ tex: "\\begin{bmatrix}\n1 & 2 \\\\\n3 & 4\n\\end{bmatrix}", bloque: true }]);
});

test("limpiarSaltos no toca las barras dentro de una fórmula $$", () => {
  const md = "$$\n1 & 2 \\\\\n3 & 4 \\\\\n$$";
  assert.equal(limpiarSaltos(md), md);
});

test("los ids del parser coinciden con los del sitio publicado", (t) => {
  let html;
  try {
    html = readFileSync(`${raizRepo}docs/unidad_2.html`, "utf8");
  } catch {
    t.skip("falta docs/: correr quarto render para comparar");
    return;
  }
  const publicados = [...html.matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]);
  const texto = quitarFrontMatter(readFileSync(`${raizRepo}unidad_2.qmd`, "utf8"));
  assert.deepEqual(encabezados(texto.split("\n")).map((e) => e.id), publicados);
});

test("limpiarSaltos deja la barra sólo cuando el párrafo sigue", () => {
  const md = [
    "1. Uno.\\",
    "2. Dos.\\",
    "",
    "Línea A.\\",
    "Línea B.\\ ",
    "Línea C.\\",
    "",
    "```python",
    "x = 1 \\",
    "```",
  ].join("\n");
  assert.equal(
    limpiarSaltos(md),
    ["1. Uno.", "2. Dos.", "", "Línea A.\\", "Línea B.\\", "Línea C.", "", "```python", "x = 1 \\", "```"].join("\n")
  );
});

test("limpiarSaltos saca las barras sueltas que empiezan un párrafo", () => {
  assert.equal(limpiarSaltos("Texto.\n\n\\\n\\\n\nOtro."), "Texto.\n\n\n\n\nOtro.");
  assert.equal(limpiarSaltos("Texto.\n\n\\\nSigue."), "Texto.\n\n\nSigue.");
  assert.equal(limpiarSaltos("\\\nSigue."), "\nSigue.");
});

test("limpiarSaltos convierte el espacio escapado de Pandoc salvo en código", () => {
  assert.equal(limpiarSaltos("Hola".concat("\\ chau y `a\\ b`")), "Hola chau y `a\\ b`");
});
