import { join } from 'node:path';

export const UPLOAD_DIR = join(__dirname, '..', '..', '..', 'uploads');
export const MAX_IMAGE_SIZE = 50 * 1024 * 1024;
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'] as const;
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;

export const MAX_FILE_SIZE = 200 * 1024 * 1024;
