import { test } from "node:test";
import assert from "node:assert/strict";
import { defineNombre, indiceQueDefine, nombreNoDefinido } from "../pistas.js";

test("nombreNoDefinido saca el nombre de un NameError", () => {
  const error = "Traceback (most recent call last):\n  Archivo, line 1\nNameError: name 'imprimir_si_positivo_2' is not defined. Did you mean: 'imprimir_si_positivo'?";
  assert.equal(nombreNoDefinido(error), "imprimir_si_positivo_2");
  assert.equal(nombreNoDefinido("ZeroDivisionError: division by zero"), null);
  assert.equal(nombreNoDefinido(null), null);
});

test("defineNombre reconoce def, asignaciones, for e import", () => {
  assert.ok(defineNombre("def saludar(x):\n  print(x)", "saludar"));
  assert.ok(defineNombre("class Punto:\n  pass", "Punto"));
  assert.ok(defineNombre("x = 5", "x"));
  assert.ok(defineNombre("a, x = 1, 2", "x"));
  assert.ok(defineNombre("total += 1", "total"));
  assert.ok(defineNombre("for i, x in enumerate(l):\n  pass", "x"));
  assert.ok(defineNombre("import random", "random"));
  assert.ok(defineNombre("from math import sqrt", "sqrt"));
});

test("defineNombre no confunde usos ni nombres parecidos", () => {
  assert.ok(!defineNombre("saludar(5)", "saludar"));
  assert.ok(!defineNombre("if x == 5:\n  pass", "x"));
  assert.ok(!defineNombre("print(x)", "x"));
  assert.ok(!defineNombre("def saludar_2(x):\n  pass", "saludar"));
  assert.ok(!defineNombre("def saludar(x):\n  pass", "saludar_2"));
});

test("indiceQueDefine prefiere el bloque de arriba más cercano", () => {
  const codigos = ["def f(x):\n  pass", "def f(x):\n  return 1", "f(5)", "def f(x):\n  return 2"];
  assert.equal(indiceQueDefine(codigos, 2, "f"), 1);
});

test("indiceQueDefine busca abajo si arriba no hay", () => {
  assert.equal(indiceQueDefine(["f(5)", "def f(x):\n  pass"], 0, "f"), 1);
  assert.equal(indiceQueDefine(["f(5)"], 0, "f"), -1);
});
