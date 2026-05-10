import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'node:path';
import { PrismaService } from '../../prisma/prisma.service';
import type { AttachmentCategoryTreeItem, AttachmentListItem } from './attachmentapi.types';

type CategorySaveInput = {
  id?: string;
  pid?: string | number;
  name?: string;
  path?: string;
  sort?: number | string;
  is_enable?: number | string;
};

type AttachmentListInput = {
  page?: number | string;
  page_size?: number | string;
  type?: string;
  keywords?: string;
  category_id?: string;
};

@Injectable()
export class AttachmentApiService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeMaybeMojibake(value: string) {
    try {
      const converted = Buffer.from(value, 'latin1').toString('utf8');
      if (converted.includes('\uFFFD')) return value;
      const nonAscii = (s: string) => (s.match(/[^\x00-\x7F]/g) || []).length;
      return nonAscii(converted) >= nonAscii(value) ? converted : value;
    } catch {
      return value;
    }
  }

  async getCategoryTree(): Promise<AttachmentCategoryTreeItem[]> {
    const categories = await this.prisma.attachmentCategory.findMany({
      orderBy: [{ sort: 'desc' }, { createdAt: 'desc' }]
    });

    const items: AttachmentCategoryTreeItem[] = categories.map((c) => ({
      id: c.id,
      pid: c.pid,
      name: c.name,
      path: c.path,
      sort: c.sort,
      is_enable: c.isEnable,
      items: []
    }));

    const byId = new Map<string, AttachmentCategoryTreeItem>();
    for (const item of items) byId.set(item.id, item);

    const roots: AttachmentCategoryTreeItem[] = [];
    for (const item of items) {
      const parentId = item.pid;
      if (!parentId || parentId === '0' || !byId.has(parentId)) {
        roots.push(item);
      } else {
        byId.get(parentId)!.items ??= [];
        byId.get(parentId)!.items!.push(item);
      }
    }

    return roots;
  }

  async saveCategory(input: CategorySaveInput) {
    const name = String(input.name ?? '').trim();
    const path = String(input.path ?? '').trim();
    if (!name) throw new BadRequestException('请输入名称');
    if (!path) throw new BadRequestException('请输入路径');

    const pid = input.pid == null || String(input.pid) === '' ? '0' : String(input.pid);
    const sort = Number(input.sort ?? 0) || 0;
    const isEnable = String(input.is_enable ?? '1') === '0' ? 0 : 1;

    const id = String(input.id ?? '').trim();
    if (!id) {
      await this.prisma.attachmentCategory.create({
        data: {
          pid,
          name,
          path,
          sort,
          isEnable
        }
      });
      return;
    }

    await this.prisma.attachmentCategory.update({
      where: { id },
      data: {
        pid,
        name,
        path,
        sort,
        isEnable
      }
    });
  }

  async deleteCategory(id: string) {
    const categoryId = String(id ?? '').trim();
    if (!categoryId) throw new BadRequestException('缺少分类 id');

    // 将附件转为未分组，避免级联删除
    await this.prisma.attachment.updateMany({
      where: { categoryId },
      data: { categoryId: null }
    });

    await this.prisma.attachmentCategory.delete({ where: { id: categoryId } });
  }

  async listAttachments(input: AttachmentListInput): Promise<{ data_total: number; data_list: AttachmentListItem[] }> {
    const page = Math.max(1, Number(input.page ?? 1) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(input.page_size ?? 21) || 21));
    const keywords = String(input.keywords ?? '').trim();
    const categoryId = String(input.category_id ?? '').trim();

    const type = String(input.type ?? '').trim();
    const normalizedType = type === 'video' || type === 'file' || type === 'image' || type === 'icon' ? type : undefined;

    const where: any = {};
    if (normalizedType) {
      where.type = normalizedType;
    } else {
      // 文件管理默认不展示 icon（仅在明确筛选 icon 时返回）
      where.type = { not: 'icon' };
    }
    if (categoryId) where.categoryId = categoryId;
    if (keywords) {
      where.OR = [{ original: { contains: keywords } }, { title: { contains: keywords } }, { filename: { contains: keywords } }];
    }

    const [total, rows] = await Promise.all([
      this.prisma.attachment.count({ where }),
      this.prisma.attachment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    const dataList: AttachmentListItem[] = rows.map((row) => ({
      id: row.id,
      category_id: row.categoryId,
      url: row.url,
      original: this.normalizeMaybeMojibake(row.original || row.title || row.filename),
      title: this.normalizeMaybeMojibake(row.title || row.original || row.filename),
      ext: row.ext || extname(row.original || row.filename || ''),
      type: (row.type as AttachmentListItem['type']) ?? 'image',
      size: row.size,
      add_time: Math.floor(row.createdAt.getTime() / 1000),
      icon_class: row.iconClass || undefined
    }));

    return { data_total: total, data_list: dataList };
  }

  async renameAttachment(id: string, original: string) {
    const attachmentId = String(id ?? '').trim();
    if (!attachmentId) throw new BadRequestException('缺少附件 id');
    const name = String(original ?? '').trim();
    await this.prisma.attachment.update({
      where: { id: attachmentId },
      data: { original: name, title: name }
    });
  }

  async deleteAttachments(ids: string) {
    const list = String(ids ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (list.length < 1) throw new BadRequestException('缺少 ids');

    await this.prisma.attachment.deleteMany({
      where: { id: { in: list } }
    });
  }

  async moveCategory(ids: string, categoryId: string) {
    const list = String(ids ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (list.length < 1) throw new BadRequestException('缺少 ids');

    const target = String(categoryId ?? '').trim();
    if (!target) throw new BadRequestException('缺少 category_id');

    await this.prisma.attachment.updateMany({
      where: { id: { in: list } },
      data: { categoryId: target }
    });
  }

  async addIcon(iconClass: string, categoryId?: string) {
    const value = String(iconClass ?? '').trim();
    if (!value) throw new BadRequestException('缺少 icon_class');

    const existing = await this.prisma.attachment.findFirst({
      where: {
        type: 'icon',
        iconClass: value
      }
    });
    if (existing) return existing;

    return await this.prisma.attachment.create({
      data: {
        type: 'icon',
        iconClass: value,
        original: value,
        title: value,
        categoryId: categoryId ? String(categoryId) : null
      }
    });
  }
}

