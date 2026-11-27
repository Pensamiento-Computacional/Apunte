import { TIPO_PASO } from "./progreso.js";

// extra admite:
// bloquesFijos: bloques que son notación o no corren; se muestran fijos.
// imagenesComoCodigo: imágenes del apunte que se reemplazan por código ejecutable.
const lectura = (id, titulo, secciones, extra = {}) => ({
  id,
  tipo: TIPO_PASO.LECTURA,
  titulo,
  secciones,
  ...extra,
});

const chequeo = (id, titulo, pregunta, opciones, correcta, explicacion) => ({
  id,
  tipo: TIPO_PASO.CHEQUEO,
  titulo,
  pregunta,
  opciones,
  correcta,
  explicacion,
});

// Los ejemplos de slicing del apunte son capturas de pantalla; acá se muestran como código ejecutable.
const slice = (lineas) => `#     [start : end : step]\n\npalabra = "pensamiento"\n\n${lineas}`;

const PLANTILLA_IF = "if <expresion>:\n    <cuerpo>";

export const SITIO = "https://pensamientocomputacional.dev.ar/";

// Los ejercicios se resuelven fuera de esta página: el paso sólo indica cuáles
// y enlaza a la sección de la guía en el sitio.
const ejercicios = (id, titulo, consigna, guia, seccion) => ({
  id,
  tipo: TIPO_PASO.EJERCICIOS,
  titulo,
  consigna,
  guia,
  seccion,
});

// Los enlaces internos del apunte (#ciclo-for) nombran una sección; acá se busca el paso que la muestra.
export function pasoDeSeccion(plan, idSeccion) {
  for (const unidad of plan.unidades) {
    const paso = unidad.pasos.find((p) => p.secciones?.some((s) => s.id === idSeccion));
    if (paso) return { unidad, paso };
  }
  return null;
}

export function textoUnidades(unidades) {
  const numeros = unidades.map((u) => u.numero);
  if (numeros.length === 1) return `Unidad ${numeros[0]}`;
  if (numeros.length === 2) return `Unidades ${numeros[0]} y ${numeros[1]}`;
  return `Unidades ${numeros[0]} a ${numeros.at(-1)}`;
}

export const PLAN = {
  version: 1,
  unidades: [
    {
      id: "u1",
      numero: 1,
      titulo: "Introducción a la Algoritmia y a la Programación",
      fuente: "unidad_1.qmd",
      video: "https://www.youtube.com/watch?v=94kWDFmxUak&list=PLREanPs7CWghISlGW_nXf-pTbtnBpveow",
      pasos: [
        lectura("computadora", "La computadora", [
          { id: "introducción", soloIntro: true },
          { id: "la-computadora" },
          { id: "software-y-hardware" },
          { id: "sistema-operativo" },
        ]),
        lectura("algoritmo", "Algoritmos", [{ id: "algoritmo" }]),
        chequeo(
          "chequeo-algoritmo",
          "Chequeo rápido",
          "¿Cuál de estas frases describe a un algoritmo?",
          [
            "Una serie finita de pasos precisos para alcanzar un objetivo.",
            "Un programa que sólo puede ejecutar una computadora.",
            "Una lista de pasos que puede ser ambigua si el objetivo queda claro.",
          ],
          0,
          "Un algoritmo no necesita una computadora, y sus pasos tienen que ser precisos: nada de ambigüedades."
        ),
        ejercicios(
          "guia-1-descomposicion",
          "Ejercicios de descomposición",
          "Antes de pasar a programas y lenguajes, resolvé los ejercicios 1 al 10 de la Guía 1. Son sin código: alcanza con escribir los pasos.",
          "guias/_guia_1.qmd",
          "ejercicios-de-descomposición"
        ),
        lectura("programas", "Programas y lenguajes", [
          { id: "programa" },
          { id: "lenguaje-de-programación" },
          { id: "entorno-de-desarrollo" },
        ]),
        lectura("python", "Python y el primer programa", [
          { id: "lenguaje-python", soloIntro: true },
          { id: "hola-mundo" },
        ]),
        chequeo(
          "chequeo-print",
          "Chequeo rápido",
          'Si ejecutás print("Hola, Mundo!"), ¿qué aparece en pantalla?',
          ["Hola, Mundo!", '"Hola, Mundo!" (con las comillas)', "Nada: hace falta un return"],
          0,
          "Las comillas indican que es un texto literal, pero no se imprimen."
        ),
        lectura("colab", "Google Colab", [{ id: "anexo-google-colab" }]),
        ejercicios(
          "guia-1-primer-programa",
          "Tu primer programa",
          "Para cerrar la unidad, resolvé el ejercicio 11 de la Guía 1: tu primer programa en Colab.",
          "guias/_guia_1.qmd",
          "primer-programa"
        ),
      ],
    },
    {
      id: "u2",
      numero: 2,
      // En la Unidad 1 todavía no vieron Colab ni variables: el aviso de los bloques no las nombra.
      yaVieronVariables: true,
      titulo: "Tipos de Datos, Expresiones y Funciones",
      fuente: "unidad_2.qmd",
      video: "https://www.youtube.com/watch?v=prcbKZAof0I&list=PLREanPs7CWghIQVmvKHdMOW1sAtdbuHDs",
      pasos: [
        lectura("flujo", "Flujo de control", [
          { id: "sentencias-básicas", soloIntro: true },
          { id: "flujo-de-control-de-un-programa" },
        ]),
        lectura("valores", "Valores y tipos", [{ id: "valores-y-tipos" }]),
        lectura("variables", "Variables", [{ id: "variables" }]),
        chequeo(
          "chequeo-variables",
          "Chequeo rápido",
          "x = 5\ny = x + 2\nprint(y * 2)\n\n¿Qué se imprime?",
          ["7", "14", "x + 2 * 2"],
          1,
          "y guarda 7 (5 + 2), y después se imprime 7 * 2 = 14."
        ),
        ejercicios(
          "guia-2-primeros",
          "Primeros programas",
          "Antes de ver funciones, resolvé los ejercicios 1 al 7 de la Guía 2.",
          "guias/_guia_2.qmd",
          "ejercicios-de-programación"
        ),
        lectura("funciones", "Funciones", [{ id: "funciones" }]),
        chequeo(
          "chequeo-return",
          "Chequeo rápido",
          "¿Qué diferencia hay entre return y print dentro de una función?",
          [
            "Ninguna: las dos muestran el resultado.",
            "return devuelve el valor a quien llamó la función; print sólo lo muestra en pantalla.",
            "print devuelve el valor y return lo muestra en pantalla.",
          ],
          1,
          "Las funciones de la guía devuelven con return, salvo que el enunciado diga \"imprimir\"."
        ),
        lectura("input", "Ingreso de datos", [{ id: "ingreso-de-datos-por-consola" }]),
        lectura("buenas-practicas", "Buenas prácticas", [
          { id: "sobre-comentarios" },
          { id: "sobre-convención-de-nombres" },
          { id: "sobre-ordenamiento-de-código" },
          { id: "sobre-uso-de-parámetros-en-funciones" },
        ]),
        ejercicios(
          "guia-2-funciones",
          "Funciones",
          "Antes de seguir con tipos de datos, resolvé los ejercicios 8 al 15 de la Guía 2. Desde acá, todo va dentro de funciones.",
          "guias/_guia_2.qmd",
          "ejercicios-de-programación"
        ),
        lectura(
          "tipos",
          "Tipos de datos y operadores",
          [{ id: "datos-simples" }, { id: "operadores-numéricos" }, { id: "operadores-de-texto" }],
          {
            bloquesFijos: ["[start : end : step]"],
            imagenesComoCodigo: {
              "./imgs/unidad_2/slice1.png": slice("print(palabra[1:3])"),
              "./imgs/unidad_2/slice2.png": slice("print(palabra[3:7])"),
              "./imgs/unidad_2/slice3.png": slice("print(palabra[:3])\nprint(palabra[3:])"),
              "./imgs/unidad_2/slice4.png": slice("print(palabra[0:10:2])"),
            },
          }
        ),
        chequeo(
          "chequeo-slices",
          "Chequeo rápido",
          '¿Qué devuelve "Hola"[1:3]?',
          ['"Ho"', '"ol"', '"ola"'],
          1,
          "Arranca en el índice 1 (incluido) y termina en el 3 (excluido): las posiciones 1 y 2."
        ),
        lectura("casteo", "Input y casteo", [{ id: "input-y-casteo" }], {
          // Errata del apunte: usa edad_nueva sin definirla, y el texto dice que este código funciona.
          bloquesFijos: ['edad = input("Indique su edad: ")\nprint("Su edad es:", edad_nueva)'],
        }),
        chequeo(
          "chequeo-casteo",
          "Chequeo rápido",
          'edad = input("Edad: ")\nprint(edad + 1)\n\nSi el usuario escribe 20, ¿qué pasa?',
          ["Imprime 21", "Imprime 201", "Da un error: input devuelve un string"],
          2,
          "input siempre devuelve un str. Para sumar hay que castear: int(input(...))."
        ),
        ejercicios(
          "guia-2-cierre",
          "Cierre de la unidad",
          "Para terminar la unidad, resolvé los ejercicios 16 al 19 y los 3 de Evaluación de Código de la Guía 2.",
          "guias/_guia_2.qmd",
          "ejercicios-de-programación"
        ),
        lectura(
          "bonus",
          "Bonus: funciones predefinidas",
          [{ id: "bonus-track-algunas-funciones-predefinidas-de-python" }],
          { opcional: true }
        ),
      ],
    },
    {
      id: "u3",
      numero: 3,
      yaVieronVariables: true,
      titulo: "Estructuras de Control",
      fuente: "unidad_3.qmd",
      video: "https://www.youtube.com/watch?v=PVMbwW373pM&list=PLREanPs7CWggJ7WeWBg2mnI4U7jvzaPhT",
      pasos: [
        lectura(
          "booleanos",
          "Expresiones booleanas",
          [{ id: "decisiones", soloIntro: true }, { id: "expresiones-booleanas" }, { id: "operadores-de-comparación" }],
          { bloquesFijos: [PLANTILLA_IF] }
        ),
        lectura("logicos", "Operadores lógicos", [{ id: "operadores-lógicos" }]),
        chequeo(
          "chequeo-logicos",
          "Chequeo rápido",
          "x = 15\nprint(x > 10 and x % 2 == 0)\n\n¿Qué se imprime?",
          ["True", "False", "15"],
          1,
          "x > 10 es True, pero x % 2 == 0 es False porque 15 es impar. Con and, alcanza un False para que todo sea False."
        ),
        lectura(
          "if",
          "If, else y elif",
          [{ id: "comparaciones-simples" }, { id: "múltiples-decisiones-consecutivas." }],
          {
            bloquesFijos: [
              PLANTILLA_IF,
              "if <expresion>:\n    <cuerpo>\nelse:\n    <cuerpo>",
              "if x == 0:",
              "if not x:",
              "if x is None:",
            ],
          }
        ),
        chequeo(
          "chequeo-elif",
          "Chequeo rápido",
          'def clasificar(x):\n    if x > 10:\n        return "grande"\n    elif x > 5:\n        return "mediano"\n    else:\n        return "chico"\n\n¿Qué devuelve clasificar(20)?',
          ['"grande"', '"mediano"', '"grande" y después "mediano"'],
          0,
          "20 > 10 es True, así que se ejecuta el cuerpo del if y no se evalúa nada más. De un if-elif-else se ejecuta una sola rama."
        ),
        ejercicios(
          "guia-3-decisiones",
          "Decisiones",
          "Antes de ver ciclos, resolvé los ejercicios 1 al 7 de Decisiones (3.1) de la Guía 3.",
          "guias/_guia_3.qmd",
          "decisiones"
        ),
        lectura(
          "for",
          "Ciclo for",
          [{ id: "ciclos-y-rangos", soloIntro: true }, { id: "ciclo-for" }],
          { bloquesFijos: ["for <nombre> in <expresion>:\n    <cuerpo>"] }
        ),
        chequeo(
          "chequeo-range",
          "Chequeo rápido",
          "for i in range(2, 10, 3):\n    print(i)\n\n¿Qué números se imprimen?",
          ["2, 5, 8", "2, 5, 8, 11", "3, 6, 9"],
          0,
          "Arranca en 2 y suma de a 3 mientras no llegue a 10: 2, 5 y 8. El 10 nunca se incluye."
        ),
        lectura("while", "Ciclo while", [{ id: "ciclo-while" }], {
          // Ciclos infinitos a propósito: se muestran, no se corren.
          bloquesFijos: [
            "while <expresion>:\n    <cuerpo>",
            'while True: # más adelante sobre el uso de `while True`\n    print("Hola")',
            "i = 0\nwhile i < 10:\n    print(i) # el valor de i nunca cambia",
          ],
        }),
        chequeo(
          "chequeo-while",
          "Chequeo rápido",
          "i = 0\nwhile i < 3:\n    print(i)\n\n¿Qué pasa al ejecutarlo?",
          ["Imprime 0, 1 y 2", "Imprime 0 para siempre", "No imprime nada"],
          1,
          "Falta el paso: i nunca cambia, la condición siempre es True y el ciclo no termina."
        ),
        ejercicios(
          "guia-3-ciclos-primeros",
          "Primeros ciclos",
          "Antes de ver break y continue, resolvé los ejercicios 1 al 5 de Ciclos (3.2) de la Guía 3.",
          "guias/_guia_3.qmd",
          "ciclos"
        ),
        lectura("break-continue", "Break, continue y return", [{ id: "break-continue-y-return" }]),
        lectura("consideraciones", "Buenas prácticas con while", [{ id: "consideraciones-del-while" }], {
          bloquesFijos: [
            "while <condicion>:\n  <cuerpo>\n\n<codigo cuando ya no se cumple la condición>",
            'if numero == 3:\n  print("El número es 3")',
            'else:\n  print("El número no es 3")',
            "while <condicion>:\n  <cuerpo>",
            "<setear condición>\n\nwhile <condición>:\n  <hacer algo>\n  <actualizar condición/es>",
          ],
        }),
        ejercicios(
          "guia-3-cierre",
          "Cierre de la unidad",
          "Para terminar la unidad, resolvé los ejercicios 6 al 12 de Ciclos (3.2) y los 3 de Evaluación de Código (3.3) de la Guía 3.",
          "guias/_guia_3.qmd",
          "ciclos"
        ),
      ],
    },
    {
      id: "u4",
      numero: 4,
      yaVieronVariables: true,
      titulo: "Tipos de Estructuras de Datos",
      fuente: "unidad_4.qmd",
      video: "https://www.youtube.com/watch?v=PreFwGCD5xM&list=PLREanPs7CWggmxukv8izOFXpvlM2NLT43",
      pasos: [
        lectura("secuencias", "Secuencias y cadenas", [
          { id: "introducción-secuencias" },
          { id: "rangos" },
          { id: "cadenas-de-caracteres", soloIntro: true },
        ]),
        lectura("metodos-cadenas", "Métodos de cadenas", [{ id: "métodos-de-cadenas-de-caracteres" }]),
        chequeo(
          "chequeo-cadenas",
          "Chequeo rápido",
          's = "Python"\nprint(s[-1] + s[:2])\n\n¿Qué se imprime?',
          ["nPy", "nPyt", "Pyn"],
          0,
          's[-1] es el último caracter ("n") y s[:2] son los dos primeros ("Py").'
        ),
        ejercicios(
          "guia-4-cadenas",
          "Cadenas de caracteres",
          "Antes de ver tuplas y listas, resolvé los ejercicios 1 al 4 de Cadenas de caracteres (4.1) de la Guía 4.",
          "guias/_guia_4.qmd",
          "cadenas-de-caracteres"
        ),
        lectura("tuplas", "Tuplas", [{ id: "tuplas" }]),
        chequeo(
          "chequeo-tuplas",
          "Chequeo rápido",
          "¿Cuál de estas es una tupla de un solo elemento?",
          ["(5)", "(5,)", "[5]"],
          1,
          "Sin la coma, (5) es el número 5 entre paréntesis. [5] es una lista."
        ),
        lectura("listas", "Listas", [
          { id: "listas", soloIntro: true },
          { id: "longitud-de-una-lista" },
          { id: "listas-como-secuencias" },
          { id: "listas-como-mutables" },
          { id: "referencias-de-listas" },
        ]),
        chequeo(
          "chequeo-referencias",
          "Chequeo rápido",
          "a = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)\n\n¿Qué se imprime?",
          ["[1, 2, 3]", "[1, 2, 3, 4]", "Da un error"],
          1,
          "b = a no copia la lista: a y b son la misma lista. Para tener una copia hay que usar a.copy()."
        ),
        lectura("listas-recorrer", "Buscar, recorrer y ordenar listas", [
          { id: "búsqueda-de-elementos-en-una-lista" },
          { id: "iterando-sobre-listas" },
          { id: "ordenando-listas" },
          { id: "listas-anidadas" },
        ]),
        ejercicios(
          "guia-4-listas",
          "Tuplas y listas",
          "Antes de seguir, resolvé los ejercicios 5 al 9 de Cadenas de caracteres (4.1) y los ejercicios 1 al 11 de Rangos, Tuplas y Listas (4.2) de la Guía 4.",
          "guias/_guia_4.qmd",
          "rangos-tuplas-y-listas"
        ),
        lectura(
          "operaciones",
          "Listas, cadenas y operaciones",
          [{ id: "listas-y-cadenas" }, { id: "operaciones-de-las-secuencias", soloIntro: true }],
          { bloquesFijos: ["<separador>.join(<lista>)"] }
        ),
        lectura("map-filter", "Map y filter", [{ id: "map" }, { id: "filter" }], {
          bloquesFijos: ["map(<funcion>, <secuencia>)", "filter(<funcion>, <secuencia>)"],
        }),
        chequeo(
          "chequeo-filter",
          "Chequeo rápido",
          'def es_corta(palabra):\n    return len(palabra) <= 3\n\nprint(list(filter(es_corta, ["sol", "luna", "mar"])))\n\n¿Qué se imprime?',
          ["['sol', 'mar']", "[True, False, True]", "['luna']"],
          0,
          "filter se queda con los elementos para los que la función devuelve True. [True, False, True] es lo que daría map."
        ),
        ejercicios(
          "guia-4-operaciones",
          "Más listas",
          "Antes de ver diccionarios, resolvé los ejercicios 12 al 20 de Rangos, Tuplas y Listas (4.2) de la Guía 4.",
          "guias/_guia_4.qmd",
          "rangos-tuplas-y-listas"
        ),
        lectura("diccionarios", "Diccionarios", [
          { id: "diccionarios", soloIntro: true },
          { id: "diccionarios-en-python" },
          { id: "accediendo-a-los-valores-de-un-diccionario" },
          { id: "iterando-elementos-del-diccionario" },
        ]),
        chequeo(
          "chequeo-get",
          "Chequeo rápido",
          'notas = {"Ana": 8, "Luis": 6}\nprint(notas.get("Sol", 0))\n\n¿Qué se imprime?',
          ["0", "Da un KeyError", "None"],
          0,
          'get devuelve el valor por omisión (0) cuando la clave no existe. notas["Sol"], en cambio, daría KeyError.'
        ),
        lectura("diccionarios-usos", "Usos y operaciones de diccionarios", [
          { id: "usos-de-un-diccionario" },
          { id: "operaciones-de-los-diccionarios" },
          { id: "diccionarios-y-funciones" },
          { id: "ordenamiento-de-diccionarios" },
        ]),
        ejercicios(
          "guia-4-cierre",
          "Cierre de la unidad",
          "Para terminar la unidad, resolvé los ejercicios 1 al 16 de Diccionarios (4.3) y los 4 de Evaluación de Código (4.4) de la Guía 4.",
          "guias/_guia_4.qmd",
          "diccionarios"
        ),
      ],
    },
  ],
};
