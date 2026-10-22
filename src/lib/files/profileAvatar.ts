import { supabase } from '../supabase/client';
import { profilesRepo } from '../db';
import type { Tables } from '../supabase/types';

const BUCKET_NAME = 'profile-images';
const MAX_AVATAR_DIMENSION = 512;
const AVATAR_QUALITY = 0.85;

/**
 * Loads an image file or blob into an HTMLImageElement.
 */
function loadImage(file: Blob | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file'));
    };
    img.src = url;
  });
}

/**
 * Resizes and center-crops an image into a clean square format
 * optimized for profile avatars.
 */
export async function processAvatarImage(file: Blob | File): Promise<Blob> {
  const img = await loadImage(file);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  if (!srcWidth || !srcHeight) {
    throw new Error('Invalid image dimensions');
  }

  // Calculate center square crop
  const minDim = Math.min(srcWidth, srcHeight);
  const cropX = (srcWidth - minDim) / 2;
  const cropY = (srcHeight - minDim) / 2;

  const targetDim = Math.min(minDim, MAX_AVATAR_DIMENSION);

  const canvas = document.createElement('canvas');
  canvas.width = targetDim;
  canvas.height = targetDim;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // High quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, cropX, cropY, minDim, minDim, 0, 0, targetDim, targetDim);

  return new Promise((resolve, reject) => {
    // Attempt WebP, fallback to JPEG
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          canvas.toBlob(
            (fallbackBlob) => {
              if (fallbackBlob) resolve(fallbackBlob);
              else reject(new Error('Failed to convert canvas to image blob'));
            },
            'image/jpeg',
            AVATAR_QUALITY
          );
        }
      },
      'image/webp',
      AVATAR_QUALITY
    );
  });
}

/**
 * Uploads a profile avatar image to Supabase Storage and updates the profile record.
 * Stores under: profile-images/{userId}/{profileId}_{timestamp}.webp
 */
export async function uploadProfileAvatar(
  file: File | Blob,
  userId: string,
  profileId: string
): Promise<{ publicUrl: string; updatedProfile: Tables<'profiles'> }> {
  if (!userId) throw new Error('User ID is required for avatar upload');
  if (!profileId) throw new Error('Profile ID is required for avatar upload');

  // Process & compress client side
  const processedBlob = await processAvatarImage(file);
  const fileExt = processedBlob.type === 'image/webp' ? 'webp' : 'jpg';
  const timestamp = Date.now();
  const filePath = `${userId}/${profileId}_${timestamp}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, processedBlob, {
      contentType: processedBlob.type,
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Failed to upload avatar to Supabase storage:', uploadError);
    throw new Error(`Avatar upload failed: ${uploadError.message}`);
  }

  // Get Public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  // Update profile record with new avatar_url
  const updatedProfile = await profilesRepo.updateProfile(profileId, {
    user_id: userId,
    avatar_url: publicUrl,
  });

  return { publicUrl, updatedProfile };
}

/**
 * Removes the profile avatar from storage (if hosted on Supabase) and updates the profile.
 */
export async function removeProfileAvatar(
  userId: string,
  profileId: string,
  currentAvatarUrl?: string | null
): Promise<Tables<'profiles'>> {
  if (currentAvatarUrl && currentAvatarUrl.includes(`/${BUCKET_NAME}/`)) {
    try {
      const parts = currentAvatarUrl.split(`/${BUCKET_NAME}/`);
      if (parts[1]) {
        const rawSegment = parts[1].split('?')[0];
        if (rawSegment) {
          const objectPath = decodeURIComponent(rawSegment);
          await supabase.storage.from(BUCKET_NAME).remove([objectPath]);
        }
      }
    } catch (err) {
      console.warn('Failed to clean up old avatar storage object:', err);
    }
  }

  return await profilesRepo.updateProfile(profileId, {
    user_id: userId,
    avatar_url: null,
  });
}
