/**
 * Prepara una foto de perfil antes de subirla: la recorta en cuadrado (desde el centro),
 * la reduce a `tamano` x `tamano` píxeles y la convierte a WebP.
 * Así pesa unos 20-40 KB aunque la foto original sea de varios MB.
 *
 * Devuelve el texto "data:image/webp;base64,..." que espera el backend.
 */
export async function prepararFotoDePerfil(archivo: File, tamano = 256): Promise<string> {
  if (!archivo.type.startsWith('image/')) throw new Error('Elige un archivo de imagen (JPG, PNG o WebP)')
  if (archivo.size > 15 * 1024 * 1024) throw new Error('La imagen es demasiado grande (máximo 15 MB)')

  const imagen = await createImageBitmap(archivo)
  const lado = Math.min(imagen.width, imagen.height)
  const x = (imagen.width - lado) / 2
  const y = (imagen.height - lado) / 2

  const lienzo = document.createElement('canvas')
  lienzo.width = tamano
  lienzo.height = tamano
  const contexto = lienzo.getContext('2d')
  if (!contexto) throw new Error('Tu navegador no pudo procesar la imagen')
  contexto.drawImage(imagen, x, y, lado, lado, 0, 0, tamano, tamano)
  imagen.close()

  return lienzo.toDataURL('image/webp', 0.85)
}
