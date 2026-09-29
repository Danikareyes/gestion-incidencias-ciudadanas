import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'
import { BUCKET_FOTOS } from './config'


export async function comprimirFoto(archivo: File): Promise<File> {
  return imageCompression(archivo, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
    preserveExif: false,
  })
}

export function urlFoto(ruta: string) {
  return supabase?.storage.from(BUCKET_FOTOS).getPublicUrl(ruta).data.publicUrl ?? ''
}