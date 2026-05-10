import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseListQuery, type ListQuery } from '../common/crud-query';
import { PrismaService } from '../prisma/prisma.service';

const pageStatuses = ['draft', 'published', 'offline'];
const pagePlatforms = ['h5', 'wechat', 'app'];
const pageSources = ['native', 'shopxo_diy'];

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQuery) {
    const parsed = parseListQuery(query);
    const statusFilter = parsed.status && pageStatuses.includes(parsed.status) ? parsed.status : '';
    const where: Prisma.PageWhereInput = {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(parsed.search
        ? {
            OR: [
              { name: { contains: parsed.search } },
              { code: { contains: parsed.search } },
              { platform: { contains: parsed.search } },
              { source: { contains: parsed.search } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.page.findMany({
        where,
        skip: parsed.skip,
        take: parsed.take,
        orderBy: [{ createdAt: 'desc' }]
      }),
      this.prisma.page.count({ where })
    ]);

    return { items, total, page: parsed.page, pageSize: parsed.pageSize };
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) {
      throw new NotFoundException('页面不存在');
    }
    return page;
  }

  async findPublishedByCode(code: string) {
    const page = await this.prisma.page.findFirst({
      where: {
        code,
        status: 'published'
      }
    });

    if (!page) {
      throw new NotFoundException('已发布页面不存在');
    }

    return page;
  }

  async create(body: Record<string, unknown>) {
    try {
      return await this.prisma.page.create({ data: this.toData(body, true) as Prisma.PageCreateInput });
    } catch (error) {
      this.rethrowKnownError(error);
      throw error;
    }
  }

  async update(id: string, body: Record<string, unknown>) {
    await this.findOne(id);
    try {
      return await this.prisma.page.update({ where: { id }, data: this.toData(body, false) as Prisma.PageUpdateInput });
    } catch (error) {
      this.rethrowKnownError(error);
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.page.delete({ where: { id } });
    return { success: true };
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    if (!pageStatuses.includes(status)) {
      throw new BadRequestException('页面状态无效');
    }
    return this.prisma.page.update({ where: { id }, data: { status } });
  }

  private toData(body: Record<string, unknown>, creating: boolean): Prisma.PageCreateInput | Prisma.PageUpdateInput {
    const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
    const name = String(body.name || '').trim();
    const code = String(body.code || '').trim();
    const platform = String(body.platform || 'h5');
    const source = String(body.source || 'native');
    const status = String(body.status || 'draft');
    const dsl = this.normalizeDsl(body.dsl);

    if (creating && !name) {
      throw new BadRequestException('页面名称不能为空');
    }
    if (creating && !code) {
      throw new BadRequestException('页面编码不能为空');
    }
    if (code && !/^[a-z][a-z0-9_-]*$/.test(code)) {
      throw new BadRequestException('页面编码只能使用小写字母、数字、下划线和中划线，并以字母开头');
    }
    if ((creating || has('platform')) && !pagePlatforms.includes(platform)) {
      throw new BadRequestException('平台无效');
    }
    if ((creating || has('source')) && !pageSources.includes(source)) {
      throw new BadRequestException('页面来源无效');
    }
    if ((creating || has('status')) && !pageStatuses.includes(status)) {
      throw new BadRequestException('页面状态无效');
    }

    const data: Prisma.PageCreateInput | Prisma.PageUpdateInput = creating
      ? {
          name,
          code,
          platform,
          dsl,
          source,
          status
        }
      : {};

    if (!creating) {
      if (has('name') && name) {
        data.name = name;
      }
      if (has('code') && code) {
        data.code = code;
      }
      if (has('platform')) {
        data.platform = platform;
      }
      if (has('dsl')) {
        data.dsl = dsl;
      }
      if (has('source')) {
        data.source = source;
      }
      if (has('status')) {
        data.status = status;
      }
    }

    return data;
  }

  private normalizeDsl(value: unknown) {
    const text = typeof value === 'string' && value.trim() ? value.trim() : '{}';

    try {
      JSON.parse(text);
      return text;
    } catch {
      throw new BadRequestException('DSL 必须是合法 JSON 字符串');
    }
  }

  private rethrowKnownError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint
      if (error.code === 'P2002') {
        const targets = (error.meta as any)?.target as string[] | undefined;
        if (Array.isArray(targets) && targets.includes('code')) {
          throw new BadRequestException('页面编码已存在');
        }
        throw new BadRequestException('数据已存在');
      }
    }
  }
}
