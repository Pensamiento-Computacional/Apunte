# Modo guiado (borrador)

Página web independiente de Quarto con un recorrido paso a paso por las Unidades 1 a 4. Muestra el apunte de a partes y permite correr sus ejemplos de código ahí mismo. Entre lecturas indica qué ejercicios de la guía resolver antes de seguir; se resuelven fuera de la página.

## Probarlo

1. Desde la raíz del repo: `python3 -m http.server 8000`.
2. Abrir `http://localhost:8000/modo_guiado/`.

Abierta como archivo no funciona, porque necesita leer los `.qmd`.

## Cómo está armado

1. `plan.js`: los pasos de cada unidad. Las lecturas apuntan a secciones de `unidad_N.qmd`; los pasos de ejercicios, a la sección de la guía en el sitio. El texto no se duplica: se edita en los `.qmd` y se ve acá. Cada lectura puede marcar bloques que son notación o no deben correr, como plantillas y ciclos infinitos (`bloquesFijos`), o reemplazar capturas de código por bloques ejecutables (`imagenesComoCodigo`). Los enlaces internos del apunte (`#ciclo-for`) llevan al paso que muestra esa sección.
2. `apunte.js`: lee los `.qmd` sin Quarto. Separa secciones (con los mismos ids que el sitio), callouts y fórmulas.
3. `progreso.js`: reglas de avance (qué se desbloquea, porcentajes, eventos). No toca el DOM.
4. `almacenamiento.js`: guarda el avance en `localStorage`, por usuario.
5. `python/`: ejecuta Python con Pyodide (WebAssembly) en el navegador de cada estudiante. `input()` pide el dato en la salida del bloque, como Colab:
   1. En Chrome y Edge, Python se pausa hasta que llega la respuesta (JSPI).
   2. En los navegadores sin JSPI, el programa se corta al pedir un dato y se vuelve a correr desde el principio con las respuestas ya dadas. Las variables de una corrida cortada no quedan guardadas.
6. `pistas.js`: si un bloque falla porque usa una función o variable que todavía no se definió (por ejemplo, corrieron la prueba sin correr la definición), la salida indica qué bloque correr primero y tiene un botón para ir a él.
7. `app.js`, `index.html` y `estilos.css`: la interfaz.

## Seguridad del código que corren

1. El código corre en la computadora del estudiante, nunca en un servidor nuestro.
2. Corre dentro de un iframe con `sandbox="allow-scripts"` (origen aislado): no ve la página, ni sus cookies, ni su `localStorage`.
3. Dentro del iframe corre en un Web Worker. Si tarda más de 10 segundos, se descarta y se levanta uno nuevo. Si imprime más de 20.000 caracteres (un ciclo infinito con `print`), se corta para que la página no se congele.
4. La política de seguridad del sandbox sólo le permite conectarse al CDN de Pyodide.

## Tests

`npm test` dentro de esta carpeta (Node 20 o más). Verifican las reglas de avance, el parser de los `.qmd`, que cada sección y bloque fijo del plan exista, que cada enlace a la guía apunte a la guía correcta y que cada enlace interno lleve a un paso.

## Qué falta para usarlo en la cursada

1. Backend con login real: hoy cada navegador guarda su avance y el "usuario" es un nombre libre.
2. Enviar los eventos (`progreso.eventos`) a ese backend para ver quién lo usa y cruzarlo con las notas de los parciales.
3. Definir con la cátedra qué datos de estudiantes se guardan y quién los puede ver.
4. Publicarlo: el deploy actual sólo sube `docs/`, así que hay que copiar `modo_guiado/`, los `.qmd` y `imgs/` al sitio.
5. Unidades 5 y 6.
6. Conectarlo con una guía interactiva (con editor y tests) para resolver y marcar cada ejercicio.
