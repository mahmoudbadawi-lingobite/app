// ============================================================
// LingoBite - Cloudinary Audio Upload (replaces Firebase Storage)
// ============================================================

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

/**
 * Upload an audio Blob to Cloudinary.
 * Returns the permanent secure URL to store in Firestore.
 */
export const uploadAudioRecording = async (
  blob: Blob,
  filename: string
): Promise<string> => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Missing Cloudinary env vars. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    );
  }

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('resource_type', 'video'); // Cloudinary uses 'video' for audio
  formData.append('folder', 'lingobite/audio');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Audio upload failed: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.secure_url as string;
};

/**
 * Upload an image File to Cloudinary (used by the Image Annotation
 * question editor in the teacher's Lesson Creator).
 * Returns the permanent secure URL to store in Firestore.
 */
export const uploadImage = async (
  file: File
): Promise<string> => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Missing Cloudinary env vars. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'lingobite/images');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Image upload failed: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.secure_url as string;
};

/**
 * Deletion requires a signed server-side request.
 * On the free tier, manage files manually via the Cloudinary dashboard.
 */
export const deleteAudioRecording = async (publicId: string): Promise<void> => {
  console.warn('Audio deletion skipped (free tier — manage via Cloudinary dashboard):', publicId);
};
