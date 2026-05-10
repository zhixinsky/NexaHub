import { BadRequestException, Controller, Post, Req, UploadedFile, UseFilters, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { existsSync, mkdirSync, promises as fs } from 'node:fs';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';
import {
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  UPLOAD_DIR,
  VIDEO_EXTENSIONS,
  VIDEO_MIME_TYPES
} from './upload.constants';
import { UploadExceptionFilter } from './upload.filter';
import { UploadSuccessResponse } from './upload.types';
import { PrismaService } from '../../prisma/prisma.service';

const createFilename = (originalname: string) => {
  const ext = extname(originalname).toLowerCase();
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${random}${ext}`;
};

const ensureUploadDir = () => {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const imageFileFilter = (_request: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
  const ext = extname(file.originalname).toLowerCase();
  const validExt = IMAGE_EXTENSIONS.includes(ext as (typeof IMAGE_EXTENSIONS)[number]);
  const validMime = IMAGE_MIME_TYPES.includes(file.mimetype as (typeof IMAGE_MIME_TYPES)[number]);
  const extMatchesMime =
    (file.mimetype === 'image/jpeg' && ['.jpg', '.jpeg'].includes(ext)) ||
    (file.mimetype === 'image/png' && ext === '.png') ||
    (file.mimetype === 'image/webp' && ext === '.webp');

  if (!validExt || !validMime || !extMatchesMime) {
    callback(new BadRequestException('文件格式错误'), false);
    return;
  }

  callback(null, true);
};

const isValidImageContent = async (path: string, mimeType: string) => {
  const file = await fs.open(path, 'r');
  try {
    const buffer = Buffer.alloc(16);
    await file.read(buffer, 0, buffer.length, 0);
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && mimeType === 'image/jpeg';
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      mimeType === 'image/png';
    const isWebp =
      buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
      buffer.slice(8, 12).toString('ascii') === 'WEBP' &&
      mimeType === 'image/webp';
    return isJpeg || isPng || isWebp;
  } finally {
    await file.close();
  }
};

const normalizeOriginalName = (value: string) => {
  // multer 在部分环境下会把 filename 按 latin1 解码，导致中文乱码；这里做一次兜底转换
  try {
    const converted = Buffer.from(value, 'latin1').toString('utf8');
    // 如果转换后包含明显的替换字符，说明不适用，退回原值
    if (converted.includes('\uFFFD')) return value;
    // 简单启发：转换后有更多非 ASCII 字符，就采用转换值
    const nonAscii = (s: string) => (s.match(/[^\x00-\x7F]/g) || []).length;
    return nonAscii(converted) >= nonAscii(value) ? converted : value;
  } catch {
    return value;
  }
};

const simpleFileFilter =
  (allowedExts: readonly string[], allowedMimes: readonly string[]) =>
  (_request: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
    const ext = extname(file.originalname).toLowerCase();
    const validExt = allowedExts.includes(ext as never);
    const validMime = allowedMimes.includes(file.mimetype as never);
    if (!validExt || !validMime) {
      callback(new BadRequestException('文件格式错误'), false);
      return;
    }
    callback(null, true);
  };

@Controller('upload')
@UseFilters(UploadExceptionFilter)
export class UploadController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_IMAGE_SIZE
      },
      fileFilter: imageFileFilter,
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          ensureUploadDir();
          callback(null, UPLOAD_DIR);
        },
        filename: (_request, file, callback) => {
          callback(null, createFilename(file.originalname));
        }
      })
    })
  )
  async uploadImage(@UploadedFile() file?: Express.Multer.File, @Req() req?: Request): Promise<UploadSuccessResponse> {
    if (!file) {
      throw new BadRequestException('请选择图片文件');
    }

    const validContent = await isValidImageContent(file.path, file.mimetype);
    if (!validContent) {
      await fs.unlink(file.path).catch(() => undefined);
      throw new BadRequestException('文件格式错误');
    }

    const bodyOriginal = req?.body && typeof (req.body as any).originalname === 'string' ? String((req.body as any).originalname) : '';
    const originalname = bodyOriginal ? bodyOriginal : normalizeOriginalName(file.originalname);
    const categoryId = req?.body && typeof (req.body as any).category_id === 'string' ? String((req.body as any).category_id) : '';
    const url = `http://localhost:3000/uploads/${file.filename}`;
    await this.prisma.attachment.create({
      data: {
        type: 'image',
        url,
        filename: file.filename,
        original: originalname,
        title: originalname,
        ext: extname(originalname).toLowerCase(),
        size: file.size,
        categoryId: categoryId || null
      }
    });

    return {
      success: true,
      data: {
        url,
        filename: file.filename
      }
    };
  }

  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_VIDEO_SIZE
      },
      fileFilter: simpleFileFilter(VIDEO_EXTENSIONS, VIDEO_MIME_TYPES),
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          ensureUploadDir();
          callback(null, UPLOAD_DIR);
        },
        filename: (_request, file, callback) => {
          callback(null, createFilename(file.originalname));
        }
      })
    })
  )
  async uploadVideo(@UploadedFile() file?: Express.Multer.File, @Req() req?: Request): Promise<UploadSuccessResponse> {
    if (!file) {
      throw new BadRequestException('请选择视频文件');
    }

    const bodyOriginal = req?.body && typeof (req.body as any).originalname === 'string' ? String((req.body as any).originalname) : '';
    const originalname = bodyOriginal ? bodyOriginal : normalizeOriginalName(file.originalname);
    const categoryId = req?.body && typeof (req.body as any).category_id === 'string' ? String((req.body as any).category_id) : '';
    const url = `http://localhost:3000/uploads/${file.filename}`;
    await this.prisma.attachment.create({
      data: {
        type: 'video',
        url,
        filename: file.filename,
        original: originalname,
        title: originalname,
        ext: extname(originalname).toLowerCase(),
        size: file.size,
        categoryId: categoryId || null
      }
    });

    return {
      success: true,
      data: {
        url,
        filename: file.filename
      }
    };
  }

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_FILE_SIZE
      },
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          ensureUploadDir();
          callback(null, UPLOAD_DIR);
        },
        filename: (_request, file, callback) => {
          callback(null, createFilename(file.originalname));
        }
      })
    })
  )
  async uploadFile(@UploadedFile() file?: Express.Multer.File, @Req() req?: Request): Promise<UploadSuccessResponse> {
    if (!file) {
      throw new BadRequestException('请选择文件');
    }

    const bodyOriginal = req?.body && typeof (req.body as any).originalname === 'string' ? String((req.body as any).originalname) : '';
    const originalname = bodyOriginal ? bodyOriginal : normalizeOriginalName(file.originalname);
    const categoryId = req?.body && typeof (req.body as any).category_id === 'string' ? String((req.body as any).category_id) : '';
    const url = `http://localhost:3000/uploads/${file.filename}`;
    await this.prisma.attachment.create({
      data: {
        type: 'file',
        url,
        filename: file.filename,
        original: originalname,
        title: originalname,
        ext: extname(originalname).toLowerCase(),
        size: file.size,
        categoryId: categoryId || null
      }
    });

    return {
      success: true,
      data: {
        url,
        filename: file.filename
      }
    };
  }
}
