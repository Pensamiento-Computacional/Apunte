import { test } from "node:test";
import assert from "node:assert/strict";
import { CANCELADO, correrConEntradas, limpiarTraceback } from "../python/ejecutor.js";

test("limpiarTraceback deja sólo las líneas del código del estudiante", () => {
  const mensaje = [
    "Traceback (most recent call last):",
    '  File "/lib/python312.zip/_pyodide/_base.py", line 523, in eval_code',
    "    .run(globals, locals)",
    '  File "<exec>", line 2, in <module>',
    "NameError: name 'edad' is not defined",
    "",
  ].join("\n");
  assert.equal(
    limpiarTraceback(mensaje),
    "Traceback (most recent call last):\n  Archivo, line 2, in <module>\nNameError: name 'edad' is not defined"
  );
});

test("limpiarTraceback deja la última línea si el error no viene del código", () => {
  assert.equal(limpiarTraceback('  File "<string>", line 1\nSyntaxError: invalid syntax'), "SyntaxError: invalid syntax");
});

test("limpiarTraceback oculta los marcos de código interno", () => {
  const mensaje = [
    "Traceback (most recent call last):",
    '  File "<exec>", line 1, in <module>',
    '  File "<preparar>", line 5, in input',
    "    raise EOFError(\"sin entradas\")",
    "EOFError: sin entradas",
  ].join("\n");
  assert.equal(
    limpiarTraceback(mensaje),
    "Traceback (most recent call last):\n  Archivo, line 1, in <module>\nEOFError: sin entradas"
  );
});

function programaQuePide(cantidad) {
  const corridas = [];
  return {
    corridas,
    correrUnaVez: async (entradas) => {
      corridas.push(entradas);
      return entradas.length < cantidad ? { ok: true, pideEntrada: true } : { ok: true, pideEntrada: false };
    },
  };
}

test("correrConEntradas corre una sola vez si el programa no pide datos", async () => {
  const { corridas, correrUnaVez } = programaQuePide(0);
  const resultado = await correrConEntradas({
    correrUnaVez,
    pedirEntrada: async () => assert.fail("no debería pedir"),
    alReiniciarSalida: () => assert.fail("no debería reiniciar"),
  });
  assert.deepEqual(resultado, { ok: true, pideEntrada: false });
  assert.deepEqual(corridas, [[]]);
});

test("correrConEntradas vuelve a correr con todas las respuestas acumuladas", async () => {
  const { corridas, correrUnaVez } = programaQuePide(2);
  const respuestas = ["Rosita", "19"];
  let reinicios = 0;
  const resultado = await correrConEntradas({
    correrUnaVez,
    pedirEntrada: async () => respuestas.shift(),
    alReiniciarSalida: () => reinicios++,
  });
  assert.equal(resultado.ok, true);
  assert.deepEqual(corridas, [[], ["Rosita"], ["Rosita", "19"]]);
  assert.equal(reinicios, 2);
});

test("correrConEntradas termina si se cancela mientras espera un dato", async () => {
  const { corridas, correrUnaVez } = programaQuePide(3);
  const resultado = await correrConEntradas({
    correrUnaVez,
    pedirEntrada: async () => null,
    alReiniciarSalida: () => {},
  });
  assert.deepEqual(resultado, { ok: false, error: CANCELADO });
  assert.equal(corridas.length, 1);
});

test("correrConEntradas devuelve el error si el programa falla después de un dato", async () => {
  let corrida = 0;
  const resultado = await correrConEntradas({
    correrUnaVez: async () => (corrida++ === 0 ? { ok: true, pideEntrada: true } : { ok: false, error: "TypeError" }),
    pedirEntrada: async () => "20",
    alReiniciarSalida: () => {},
  });
  assert.deepEqual(resultado, { ok: false, error: "TypeError" });
});
