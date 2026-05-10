import { ArgumentsHost, Catch, ExceptionFilter, HttpException, PayloadTooLargeException } from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';
import { UploadErrorResponse } from './upload.types';

@Catch()
export class UploadExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const message = this.getMessage(exception);
    const status = exception instanceof PayloadTooLargeException ? 413 : 400;

    response.status(status).json({
      success: false,
      message
    } satisfies UploadErrorResponse);
  }

  private getMessage(exception: unknown) {
    if (
      (exception instanceof MulterError && exception.code === 'LIMIT_FILE_SIZE') ||
      (exception instanceof Error && exception.message === 'File too large')
    ) {
      return '文件大小不能超过50MB';
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const message = (response as { message?: string | string[] }).message;
        return Array.isArray(message) ? message[0] : message || '上传失败';
      }
    }

    if (exception instanceof Error) {
      return exception.message || '上传失败';
    }

    return '上传失败';
  }
}
