/** "Martín" → "martin". Para buscar sin importar acentos ni mayúsculas. */
export function sinAcentos(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}
