export type UploadImageData = {
    url: string;
    filename: string;
};

export type UploadImageSuccess = {
    success: true;
    data: UploadImageData;
};

export type UploadImageFailure = {
    success: false;
    message: string;
};

export type UploadImageResponse = UploadImageSuccess | UploadImageFailure;

export type UploadImageOptions = {
    maxSize?: number;
    accept?: readonly string[];
};

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024;
const DEFAULT_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const apiBaseUrl = import.meta.env.VITE_NEXAHUB_API_BASE_URL || '';

const getExtension = (name: string) => {
    const index = name.lastIndexOf('.');
    return index >= 0 ? name.slice(index).toLowerCase() : '';
};

const isAcceptedImage = (file: File, accept: readonly string[]) => {
    const extension = getExtension(file.name);
    const mimeMatched = accept.includes(file.type);
    const extensionMatched = accept.includes(extension);
    return mimeMatched || extensionMatched;
};

export async function uploadImage(file: File, options: UploadImageOptions = {}): Promise<UploadImageData> {
    const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    const accept = options.accept ?? DEFAULT_ACCEPT;

    if (!isAcceptedImage(file, accept)) {
        throw new Error('文件格式错误');
    }

    if (file.size > maxSize) {
        throw new Error('文件大小不能超过50MB');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiBaseUrl}/upload/image`, {
        method: 'POST',
        body: formData,
    });
    const result = (await response.json().catch(() => ({
        success: false,
        message: '上传失败',
    }))) as UploadImageResponse;

    if (!response.ok) {
        throw new Error(result.success ? '上传失败' : result.message || '上传失败');
    }

    if (!result.success) {
        throw new Error(result.message || '上传失败');
    }

    return result.data;
}

export type UploadAssetType = 'image' | 'video' | 'file';

export async function uploadAsset(type: UploadAssetType, file: File, options: UploadImageOptions = {}): Promise<UploadImageData> {
    const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    const accept = options.accept ?? [];

    if (accept.length > 0) {
        const extension = getExtension(file.name);
        const mimeMatched = accept.includes(file.type);
        const extensionMatched = accept.includes(extension);
        if (!mimeMatched && !extensionMatched) {
            throw new Error('文件格式错误');
        }
    }

    if (file.size > maxSize) {
        throw new Error(`文件大小不能超过${Math.ceil(maxSize / (1024 * 1024))}MB`);
    }

    const formData = new FormData();
    formData.append('file', file);
    // 避免 multipart filename 编码导致中文乱码，显式传一次原始文件名
    formData.append('originalname', file.name);
    // 可选分类（后端支持时写入）
    if ((options as any)?.categoryId) {
        formData.append('category_id', String((options as any).categoryId));
    }

    const endpoint = type === 'image' ? '/upload/image' : type === 'video' ? '/upload/video' : '/upload/file';
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
    });
    const result = (await response.json().catch(() => ({
        success: false,
        message: '上传失败',
    }))) as UploadImageResponse;

    if (!response.ok) {
        throw new Error(result.success ? '上传失败' : result.message || '上传失败');
    }

    if (!result.success) {
        throw new Error(result.message || '上传失败');
    }

    return result.data;
}

export function toUploadListItem(data: UploadImageData, file?: File): uploadList {
    const filename = file?.name || data.filename;
    return {
        id: Date.now(),
        url: data.url,
        original: filename,
        title: filename,
        ext: getExtension(filename),
        type: 'img',
        size: file?.size,
    };
}
