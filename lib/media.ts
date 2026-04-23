import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { VoiceRecorder } from 'capacitor-voice-recorder';

export interface MediaAttachment {
  type: 'image' | 'video' | 'audio';
  path: string;
  name: string;
  base64?: string;
}

export async function pickMedia(): Promise<MediaAttachment | null> {
  const result = await ActionSheet.showActions({
    title: 'Select Media Type',
    message: 'Choose a file to attach',
    options: [
      {
        title: 'Take Photo',
      },
      {
        title: 'Choose from Gallery',
      },
      {
        title: 'Record Voice',
      },
      {
        title: 'Cancel',
        style: ActionSheetButtonStyle.Cancel,
      },
    ],
  });

  if (result.index === 0) {
    return takePhoto();
  } else if (result.index === 1) {
    return pickFromGallery();
  } else if (result.index === 2) {
    return recordAudio();
  }
  return null;
}

async function takePhoto(): Promise<MediaAttachment | null> {
  try {
    const permissions = await Camera.checkPermissions();
    if (permissions.camera !== 'granted') {
      const request = await Camera.requestPermissions();
      if (request.camera !== 'granted') return null;
    }

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });

    return {
      type: 'image',
      path: `data:image/${image.format};base64,${image.base64String}`,
      name: `photo_${Date.now()}.${image.format}`,
      base64: image.base64String,
    };
  } catch (e) {
    console.error('Camera error', e);
    return null;
  }
}

async function pickFromGallery(): Promise<MediaAttachment | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    });

    return {
      type: 'image',
      path: `data:image/${image.format};base64,${image.base64String}`,
      name: `gallery_${Date.now()}.${image.format}`,
      base64: image.base64String,
    };
  } catch (e) {
    console.error('Gallery error', e);
    return null;
  }
}

async function recordAudio(): Promise<MediaAttachment | null> {
  try {
    const canRecord = await VoiceRecorder.canDeviceVoiceRecord();
    if (!canRecord.value) throw new Error('Device cannot record voice');

    // This is a simplified version. A real UI would need Start/Stop buttons.
    // For now, let's just return a placeholder or implement a basic flow.
    // Since we are in a hook/component, we might need a more interactive UI.
    return null;
  } catch (e) {
    console.error('Audio recording error', e);
    return null;
  }
}
