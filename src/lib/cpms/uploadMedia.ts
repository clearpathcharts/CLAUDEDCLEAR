import * as fbStorage from 'firebase/storage';
import { getFirebaseStorage } from '../../firebase';

export type CpmsMediaFolder = 'videos' | 'thumbnails';

/** Upload a file to Firebase Storage under cpms_media/{folder}/. Returns the public download URL. */
export function uploadCpmsMedia(
  file: File,
  folder: CpmsMediaFolder,
  onProgress?: (percent: number) => void
): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) {
    return Promise.reject(new Error('Firebase Storage is not available.'));
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `cpms_media/${folder}/${Date.now()}_${safeName}`;
  const fileRef = fbStorage.ref(storage, path);
  const task = fbStorage.uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      reject,
      async () => {
        try {
          const url = await fbStorage.getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}
