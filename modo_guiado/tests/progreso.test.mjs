import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TIPO_EVENTO,
  TIPO_PASO,
  completarPaso,
  crearProgresoVacio,
  estaCompleto,
  indiceSiguientePaso,
  lecturaAnterior,
  normalizarUsuario,
  pasoDesbloqueado,
  registrarEjecucion,
  porcentajeUnidad,
  responderChequeo,
  unidadDesbloqueada,
  unidadTerminada,
} from "../progreso.js";

const FECHA = "2026-11-23T22:00:00.000Z";

const lectura = { id: "lectura", tipo: TIPO_PASO.LECTURA, secciones: [] };
const chequeo = {
  id: "chequeo",
  tipo: TIPO_PASO.CHEQUEO,
  opciones: ["a", "b", "c"],
  correcta: 1,
};
const ejercicios = { id: "ejercicios", tipo: TIPO_PASO.EJERCICIOS };
const bonus = { id: "bonus", tipo: TIPO_PASO.LECTURA, secciones: [], opcional: true };

const unidad = { id: "u1", pasos: [lectura, chequeo, ejercicios, bonus] };
const otraUnidad = { id: "u2", pasos: [{ id: "x", tipo: TIPO_PASO.LECTURA, secciones: [] }] };
const plan = { unidades: [unidad, otraUnidad] };

function terminarUnidad(progreso) {
  let p = completarPaso(progreso, unidad, lectura, FECHA);
  p = responderChequeo(p, unidad, chequeo, 1, FECHA).progreso;
  return completarPaso(p, unidad, ejercicios, FECHA);
}

test("un progreso vacío no tiene nada completo", () => {
  const progreso = crearProgresoVacio();
  assert.equal(estaCompleto(progreso, unidad, lectura), false);
  assert.equal(porcentajeUnidad(progreso, unidad), 0);
  assert.equal(indiceSiguientePaso(progreso, unidad), 0);
});

test("sólo el primer paso arranca desbloqueado", () => {
  const progreso = crearProgresoVacio();
  assert.equal(pasoDesbloqueado(progreso, unidad, 0), true);
  assert.equal(pasoDesbloqueado(progreso, unidad, 1), false);
  assert.equal(pasoDesbloqueado(progreso, unidad, 2), false);
});

test("completar una lectura desbloquea el paso siguiente y registra el evento", () => {
  const progreso = completarPaso(crearProgresoVacio(), unidad, lectura, FECHA);
  assert.equal(estaCompleto(progreso, unidad, lectura), true);
  assert.equal(pasoDesbloqueado(progreso, unidad, 1), true);
  assert.deepEqual(progreso.eventos, [
    { tipo: TIPO_EVENTO.PASO_COMPLETADO, paso: "u1/lectura", fecha: FECHA },
  ]);
});

test("completar dos veces el mismo paso no duplica eventos", () => {
  const una = completarPaso(crearProgresoVacio(), unidad, lectura, FECHA);
  const dos = completarPaso(una, unidad, lectura, FECHA);
  assert.equal(dos, una);
});

test("completarPaso no modifica el progreso original", () => {
  const original = crearProgresoVacio();
  completarPaso(original, unidad, lectura, FECHA);
  assert.deepEqual(original, crearProgresoVacio());
});

test("una respuesta incorrecta queda registrada pero no completa el chequeo", () => {
  const { progreso, correcta } = responderChequeo(crearProgresoVacio(), unidad, chequeo, 0, FECHA);
  assert.equal(correcta, false);
  assert.equal(estaCompleto(progreso, unidad, chequeo), false);
  assert.deepEqual(progreso.eventos, [
    { tipo: TIPO_EVENTO.RESPUESTA_CHEQUEO, paso: "u1/chequeo", opcion: 0, correcta: false, fecha: FECHA },
  ]);
});

test("una respuesta correcta completa el chequeo", () => {
  const { progreso, correcta } = responderChequeo(crearProgresoVacio(), unidad, chequeo, 1, FECHA);
  assert.equal(correcta, true);
  assert.equal(estaCompleto(progreso, unidad, chequeo), true);
  assert.equal(progreso.eventos.at(-1).tipo, TIPO_EVENTO.PASO_COMPLETADO);
});

test("los pasos opcionales no cuentan para el porcentaje ni bloquean", () => {
  const progreso = terminarUnidad(crearProgresoVacio());
  assert.equal(porcentajeUnidad(progreso, unidad), 100);
  assert.equal(unidadTerminada(progreso, unidad), true);
  assert.equal(indiceSiguientePaso(progreso, unidad), -1);
});

test("el porcentaje redondea sobre los pasos obligatorios", () => {
  const progreso = completarPaso(crearProgresoVacio(), unidad, lectura, FECHA);
  assert.equal(porcentajeUnidad(progreso, unidad), 33);
});

test("una unidad sin pasos obligatorios está al 100%", () => {
  assert.equal(porcentajeUnidad(crearProgresoVacio(), { id: "u0", pasos: [bonus] }), 100);
});

test("la segunda unidad se abre cuando la primera está terminada", () => {
  const vacio = crearProgresoVacio();
  assert.equal(unidadDesbloqueada(vacio, plan, 0), true);
  assert.equal(unidadDesbloqueada(vacio, plan, 1), false);
  assert.equal(unidadDesbloqueada(terminarUnidad(vacio), plan, 1), true);
});

test("normalizarUsuario ignora mayúsculas y espacios de más", () => {
  assert.equal(normalizarUsuario("  Ana   María  López "), "ana maría lópez");
  assert.equal(normalizarUsuario("   "), "");
});

test("registrarEjecucion anota cada corrida con su resultado", () => {
  const progreso = registrarEjecucion(crearProgresoVacio(), unidad, lectura, "codigo-2", false, FECHA);
  assert.deepEqual(progreso.eventos, [
    { tipo: TIPO_EVENTO.CODIGO_EJECUTADO, paso: "u1/lectura", bloque: "codigo-2", ok: false, fecha: FECHA },
  ]);
});

test("lecturaAnterior devuelve la última lectura antes del paso", () => {
  assert.equal(lecturaAnterior(unidad, 1), lectura);
  assert.equal(lecturaAnterior(unidad, 3), lectura);
  assert.equal(lecturaAnterior(unidad, 0), undefined);
});
