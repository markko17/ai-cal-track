import * as FileSystem from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface PreparedImage {
  uri: string;
  base64: string;
}

/**
 * Resizes an image to a max width of 1280px and encodes it as a compact base64 JPEG.
 * Keeping the image small (instead of encoding the full-resolution camera photo)
 * makes both the API payload and the upload dramatically faster.
 */
export async function prepareScannedImage(uri: string): Promise<PreparedImage> {
  try {
    const context = ImageManipulator.manipulate(uri);
    context.resize({ width: 1280 });
    const image = await context.renderAsync();
    const result = await image.saveAsync({
      compress: 0.7,
      format: SaveFormat.JPEG,
      base64: true,
    });

    let base64 = result.base64 || '';
    if (!base64 && result.uri) {
      base64 = await FileSystem.readAsStringAsync(result.uri, {
        encoding: 'base64',
      });
    }

    return { uri: result.uri, base64 };
  } catch (error) {
    console.warn('Image resize failed, falling back to original URI:', error);
    let base64 = '';
    try {
      base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
    } catch (_err) {
      // ignore
    }
    return { uri, base64 };
  }
}
