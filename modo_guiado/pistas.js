const escapar = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function nombreNoDefinido(error) {
  return error?.match(/NameError: name '([A-Za-z_]\w*)' is not defined/)?.[1] ?? null;
}

export function defineNombre(codigo, nombre) {
  const n = escapar(nombre);
  const patrones = [
    `^\\s*(def|class)\\s+${n}\\b`,
    `^\\s*([\\w\\s,]*,\\s*)?${n}\\s*(,[\\w\\s,]*)?(\\+|-|\\*|/|//|%)?=(?!=)`,
    `^\\s*for\\s+[\\w\\s,()]*\\b${n}\\b[\\w\\s,()]*\\s+in\\b`,
    `^\\s*(from\\s+\\S+\\s+)?import\\s+.*\\b${n}\\b`,
  ];
  return patrones.some((patron) => new RegExp(patron, "m").test(codigo));
}

// Prefiere el bloque más cercano de arriba: es el que el texto espera que corran antes.
export function indiceQueDefine(codigos, indiceActual, nombre) {
  for (let i = indiceActual - 1; i >= 0; i--) if (defineNombre(codigos[i], nombre)) return i;
  for (let i = indiceActual + 1; i < codigos.length; i++) if (defineNombre(codigos[i], nombre)) return i;
  return -1;
}
