import { supabase } from './supabaseClient';

export interface UploadAvatarResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Sube una foto de perfil a Supabase Storage en el bucket 'avatars',
 * elimina el archivo anterior si existe y actualiza la tabla profiles.
 *
 * @param userId - El ID del usuario autenticado
 * @param file - El objeto File de la imagen a subir
 * @param currentAvatarUrl - La URL del avatar actual del usuario (si tiene), para eliminar el archivo viejo
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  currentAvatarUrl?: string | null
): Promise<UploadAvatarResult> {
  try {
    // 1. Validaciones de tipo y tamaño
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de archivo no permitido. Solo se aceptan imágenes JPG, JPEG, PNG y WEBP.',
      };
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'El tamaño de la imagen no debe superar los 5 MB.',
      };
    }

    // 2. Extraer extensión y generar nombre de archivo único para evitar cacheo del navegador
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `avatar_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // 3. Eliminar el archivo viejo del bucket si existe
    if (currentAvatarUrl) {
      try {
        if (currentAvatarUrl.includes('/avatars/')) {
          const pathParts = currentAvatarUrl.split('/avatars/');
          if (pathParts.length > 1) {
            const oldFilePath = decodeURIComponent(pathParts[1]);
            const cleanOldFilePath = oldFilePath.split('?')[0]; // Limpiar query params
            await supabase.storage.from('avatars').remove([cleanOldFilePath]);
          }
        }
      } catch (removeErr) {
        console.error('Error al eliminar avatar anterior:', removeErr);
        // No bloqueamos la subida si falla la eliminación del viejo archivo
      }
    }

    // 4. Subir la nueva imagen a storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: `Error al subir la imagen: ${uploadError.message}` };
    }

    // 5. Obtener la URL pública del archivo
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    if (!data || !data.publicUrl) {
      return { success: false, error: 'No se pudo obtener la URL pública del avatar subido.' };
    }

    const publicUrl = data.publicUrl;

    // 6. Actualizar el campo avatar_url en la tabla profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      return {
        success: false,
        error: `Imagen subida con éxito, pero falló la actualización del perfil: ${updateError.message}`,
      };
    }

    return { success: true, url: publicUrl };
  } catch (err: any) {
    console.error('Error en uploadAvatar:', err);
    return { success: false, error: err.message || 'Error inesperado durante la subida.' };
  }
}
