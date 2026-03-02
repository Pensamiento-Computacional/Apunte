# Reporte de Refactoring - Pensamiento Computacional 2026

## Resumen Ejecutivo

Este documento detalla los cambios realizados al material didáctico de la materia Pensamiento Computacional como parte del refactoring 2026. Los cambios responden a la necesidad de actualizar el currículo considerando el nuevo contexto donde los estudiantes trabajan con herramientas de IA.

---

## Cambios Realizados

### 1. Guía 1: Introducción a la Algoritmia y la Programación

**Archivo modificado:** `guias/_guia_1.qmd`

**Cambios:**
- Se agregaron 4 nuevos ejercicios de descomposición (ejercicios 7-10)
- Se reorganizó la estructura con la sección "### Primer programa"

**Nuevos ejercicios agregados:**

| Ejercicio | Descripción |
|-----------|-------------|
| 7 | Instrucciones para usar un cajero automático |
| 8 | Organización de libros en una biblioteca |
| 9 | Robot ordenando cartas numeradas |
| 10 | Asignación de pedidos a repartidores de delivery |

**Justificación:** Los nuevos ejercicios refuerzan el pensamiento algorítmico antes de introducir código, con situaciones más variadas y complejas.

---

### 2. Unidad 5: Entrada y Salida (Contenido Teórico)

**Archivo modificado:** `unidad_5.qmd`

**Cambios:**

- Se reemplazaron los ejemplos que usaban formato CSV por ejemplos con archivos de texto plano
- El ejemplo de "alumnos.txt" (formato CSV) fue reemplazado por "poema.txt" (texto libre)
- El ejemplo de "notas.csv" fue reemplazado por "texto.txt" (conteo de palabras)
- Se actualizó la sección "Tipos de archivos" para indicar que CSV se verá en la Unidad 6 con Pandas

**Justificación:**

- Se separó la enseñanza de archivos de texto (Unidad 5) de archivos CSV (Unidad 6)
- Los archivos CSV se manejan mejor con Pandas que con `open()`/`close()` manual
- Se evita enseñar técnicas que los estudiantes no usarán en la práctica profesional

---

### 3. Guía 5: Entrada y Salida (Ejercicios)

**Archivo modificado:** `guias/_guia_5.qmd`

**Cambios principales:**
- Se eliminaron todos los ejercicios que requerían manejo manual de CSV
- Se crearon nuevos ejercicios enfocados en archivos de texto

**Ejercicios modificados:**

| Ejercicio | Antes | Después |
|-----------|-------|---------|
| 9 | Guardar/cargar diccionario en CSV | Guardar/cargar diccionario con formato "clave: valor" |
| 10 (Desafío) | Procesar CSV de fútbol | Dividir libro en archivos de 50 líneas |
| 13 | - | Gestor de tareas con formato `[ ]`/`[x]` |
| 14 | - | Combinar archivos de estudiantes y notas |
| 15 | - | Diario personal con formato de fecha |
| 5 (Errores) | División con CSV | División con números separados por espacio |

**Justificación:**
- Los ejercicios ahora practican manipulación de texto real
- Se mantiene la complejidad pero con formatos más apropiados para `open()`/`close()`

---

### 4. Unidad 6: Bibliotecas de Python (Contenido Teórico)

**Archivo modificado:** `unidad_6.qmd`

**Cambios estructurales:**
- **Reordenamiento completo:** Pandas → NumPy → Matplotlib (antes: NumPy → Pandas → Matplotlib)

**Nuevas secciones en Pandas:**
1. **Lectura de archivos CSV** con `pd.read_csv()`
2. **Escritura de archivos CSV** con `df.to_csv()`
3. **Tabla comparativa** entre Pandas y `open()` para manejo de datos
4. **Manejo de errores** comunes en Pandas (FileNotFoundError, KeyError, TypeError)
5. **Ejemplo integrador:** Función que filtra notas de un alumno por DNI desde un CSV y las guarda en un nuevo archivo

**Sección eliminada de NumPy:**
- Se eliminó la sección "Reshape" por considerarse un tema avanzado no esencial

**Justificación:**

- Pandas es más relevante para los estudiantes de ingeniería que NumPy puro
- Los estudiantes aprenden CSV cuando tienen la herramienta adecuada (Pandas)
- El orden pedagógico fluye mejor: datos tabulares → cálculo numérico → visualización

---

### 5. Guía 6: Bibliotecas de Python (Ejercicios)

**Archivo modificado:** `guias/_guia_6.qmd`

**Cambios estructurales:**

- Reordenamiento: Sección 1 (Pandas), Sección 2 (NumPy), Sección 3 (Matplotlib)
- Nueva subsección "1.2. Lectura y Escritura de Archivos CSV" con 9 ejercicios
- Ejercicios originales de DataFrames en "1.1. Operaciones Básicas con DataFrames"

**Ejercicios de CSV (sección 1.2):**

| Ejercicio | Tema | Conceptos |
|-----------|------|-----------|
| 1 | Archivo `futbol.csv` - filtrar goleadores | `read_csv`, filtrado, `to_csv` |
| 2 | Archivo `compras_supermercado.csv` - calcular totales | Columnas calculadas, `sum()` |
| 3 | Archivo de stock de librería | Agregar datos con `input()` |
| 3 | Archivo `peliculas.csv` - filtrar por calificación | Filtrado, promedio |
| 4 | Archivo de temperaturas - promedios y filtros | Columnas calculadas, `to_csv` |
| 5 (Desafío) | Archivo `cine.csv` - análisis de ventas | `sort_values`, `head` |
| 6 | Yerba "La Hoja Verde" - control de calidad | Filtrado por rangos, asignación de columnas |
| 7 | Logística "Rapiflash" - cumplimiento de rutas | Múltiples archivos, `try/except`, diferencias |
| 8 | Fábrica de alimentos - datos faltantes | `notnull()`, `isnull()`, porcentajes |
| 9 | Bibliotecas Abiertas - registro de voluntarios | Múltiples archivos, `try/except`, errores a CSV |

**Justificación:**

- Los ejercicios de CSV que antes estaban en la Guía 5 ahora están donde corresponden
- Se mantiene consistencia con el contenido teórico de la Unidad 6
- Los ejercicios 6-9 practican casos más complejos: múltiples archivos, manejo de errores, datos faltantes

---

### 6. Sección "Evaluación de Código" en todas las guías

**Archivos modificados:** `_guia_2.qmd`, `_guia_3.qmd`, `_guia_4.qmd`, `_guia_5.qmd`, `_guia_6.qmd`

**Descripción:**
Se agregó una nueva sección al final de cada guía (excepto Guía 1) con ejercicios de código con errores para que los estudiantes identifiquen y corrijan.

**Ejercicios por guía:**

| Guía | Ejercicio 1 | Ejercicio 2 | Ejercicio 3 | Ejercicio 4 |
|------|-------------|-------------|-------------|-------------|
| 2 | Función sin `return` | Error de tipo en `input()` | Concatenación int+str | - |
| 3 | Error en condición de rango | Bucle infinito (falta incremento) | `return` mal indentado | - |
| 4 | Error de índice (off-by-one) | Intento de modificar tupla | KeyError en diccionario | Modificar diccionario mientras se itera |
| 5 | Archivo no cerrado | Modo de apertura incorrecto | Manejo de excepciones incompleto | - |
| 6 | Comparación string vs int en Pandas | Uso ineficiente de NumPy | Typo en nombre de columna | Análisis de control de calidad (múltiples errores) |

**Justificación:**

- Responde a la nueva realidad donde los estudiantes usan IA para generar código
- Desarrolla habilidades críticas de evaluación y depuración
- Los estudiantes pueden opcionalmente usar herramientas de IA para verificar su análisis

---

## Archivos Afectados

```
guias/
├── _guia_1.qmd    (ejercicios agregados)
├── _guia_2.qmd    (sección Evaluación de Código)
├── _guia_3.qmd    (sección Evaluación de Código)
├── _guia_4.qmd    (sección Evaluación de Código)
├── _guia_5.qmd    (ejercicios modificados + Evaluación de Código)
└── _guia_6.qmd    (reordenado + CSV + Evaluación de Código)

unidad_5.qmd       (ejemplos modificados)
unidad_6.qmd       (reordenado + CSV en Pandas)
```

---

## Consideraciones Pedagógicas

### Sobre el manejo de CSV

**Antes:** Los estudiantes aprendían a manejar CSV manualmente con `open()`, `split()`, etc.

**Ahora:** Los estudiantes aprenden:

1. Archivos de texto plano con `open()` (Unidad 5)
2. Archivos CSV con Pandas (Unidad 6)

**Ventajas:**
- Se enseña la herramienta correcta para cada tarea
- Pandas es el estándar en la industria para datos tabulares
- Se evita enseñar patrones que los estudiantes no usarán

### Sobre la sección de Evaluación de Código

Esta nueva sección prepara a los estudiantes para:
- Evaluar código generado por IA
- Desarrollar pensamiento crítico sobre código ajeno
- Identificar errores comunes en Python
- Practicar debugging sin necesidad de escribir código desde cero

---

## Notas Finales

- Todos los cambios mantienen la coherencia con los objetivos de la materia
- Se preservó la dificultad progresiva de los ejercicios
- Los ejercicios marcados como "Desafío (obligatorio)" se mantienen en cada guía
- La estructura de includes (`{{< include >}}`) permite mantener el archivo `guia.qmd` unificado

---

*Documento generado como parte del refactoring 2026 de Pensamiento Computacional*
