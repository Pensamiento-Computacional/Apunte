import { test } from "node:test";
import assert from "node:assert/strict";
import { CLAVE_TEMA, crearAlmacenamientoLocal } from "../almacenamiento.js";

function storageFalso(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    getItem: (clave) => (datos.has(clave) ? datos.get(clave) : null),
    setItem: (clave, valor) => datos.set(clave, String(valor)),
    removeItem: (clave) => datos.delete(clave),
    datos,
  };
}

test("el tema arranca sin elección y se guarda", () => {
  const storage = storageFalso();
  const almacenamiento = crearAlmacenamientoLocal(storage);
  assert.equal(almacenamiento.temaGuardado(), null);
  almacenamiento.guardarTema("dark");
  assert.equal(almacenamiento.temaGuardado(), "dark");
  assert.equal(storage.datos.get(CLAVE_TEMA), "dark");
});

test("un tema desconocido guardado se ignora", () => {
  const almacenamiento = crearAlmacenamientoLocal(storageFalso({ [CLAVE_TEMA]: "violeta" }));
  assert.equal(almacenamiento.temaGuardado(), null);
});

test("el progreso se guarda por usuario y vuelve igual", () => {
  const almacenamiento = crearAlmacenamientoLocal(storageFalso());
  const progreso = { completados: { "u1/a": true }, eventos: [] };
  almacenamiento.guardarProgreso("ana", progreso);
  assert.deepEqual(almacenamiento.cargarProgreso("ana"), progreso);
  assert.deepEqual(almacenamiento.cargarProgreso("beto"), { completados: {}, eventos: [] });
});

test("un progreso guardado roto vuelve vacío", () => {
  const almacenamiento = crearAlmacenamientoLocal(storageFalso({ "pc-modo-guiado:v1:progreso:ana": "{roto" }));
  assert.deepEqual(almacenamiento.cargarProgreso("ana"), { completados: {}, eventos: [] });
});

test("si el storage falla, nada explota", () => {
  const roto = {
    getItem() {
      throw new Error("bloqueado");
    },
    setItem() {
      throw new Error("bloqueado");
    },
    removeItem() {
      throw new Error("bloqueado");
    },
  };
  const almacenamiento = crearAlmacenamientoLocal(roto);
  assert.doesNotThrow(() => almacenamiento.guardarTema("light"));
  assert.equal(almacenamiento.temaGuardado(), null);
  assert.equal(almacenamiento.usuarioActual(), null);
});
