import imageCompression from 'browser-image-compression'

export async function comprimirFoto(archivo: File): Promise<File> {
  return imageCompression(archivo, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
    preserveExif: false,
  })
}