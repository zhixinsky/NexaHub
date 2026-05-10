import { Body, Controller, Post } from '@nestjs/common';
import { AttachmentApiService } from './attachmentapi.service';

@Controller('attachmentapi')
export class AttachmentApiController {
  constructor(private readonly service: AttachmentApiService) {}

  @Post('category')
  async category() {
    const attachment_category = await this.service.getCategoryTree();
    return { attachment_category };
  }

  @Post('categorysave')
  async categorySave(@Body() body: any) {
    await this.service.saveCategory(body ?? {});
    return { success: true };
  }

  @Post('categorydelete')
  async categoryDelete(@Body() body: any) {
    await this.service.deleteCategory(String(body?.id ?? ''));
    return { success: true };
  }

  @Post('list')
  async list(@Body() body: any) {
    return await this.service.listAttachments(body ?? {});
  }

  @Post('save')
  async save(@Body() body: any) {
    await this.service.renameAttachment(String(body?.id ?? ''), String(body?.original ?? ''));
    return { success: true };
  }

  @Post('delete')
  async del(@Body() body: any) {
    await this.service.deleteAttachments(String(body?.ids ?? ''));
    return { success: true };
  }

  @Post('movecategory')
  async moveCategory(@Body() body: any) {
    await this.service.moveCategory(String(body?.ids ?? ''), String(body?.category_id ?? ''));
    return { success: true };
  }

  @Post('iconadd')
  async iconAdd(@Body() body: any) {
    const iconClass = String(body?.icon_class ?? '');
    const categoryId = body?.category_id ? String(body.category_id) : undefined;
    const record = await this.service.addIcon(iconClass, categoryId);
    return { success: true, data: record };
  }

  // shopxo-diy 的扫码上传轮询接口（当前项目未实现扫码上传，先返回空列表避免前端报错）
  @Post('scanuploaddata')
  async scanUploadData() {
    return [];
  }
}

