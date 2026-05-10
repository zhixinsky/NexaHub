import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseListQuery, type ListQuery } from '../common/crud-query';
import { PrismaService } from '../prisma/prisma.service';

const contentStatuses = ['draft', 'published', 'offline'];

@Injectable()
export class ContentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQuery) {
    const parsed = parseListQuery(query);
    const where: Prisma.ContentWhereInput = {
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.search
        ? {
            OR: [
              { title: { contains: parsed.search } },
              { subtitle: { contains: parsed.search } },
              { category: { contains: parsed.search } },
              { summary: { contains: parsed.search } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        skip: parsed.skip,
        take: parsed.take,
        orderBy: [{ sort: 'desc' }, { createdAt: 'desc' }]
      }),
      this.prisma.content.count({ where })
    ]);

    return { items, total, page: parsed.page, pageSize: parsed.pageSize };
  }

  async findOne(id: string) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) {
      throw new NotFoundException('内容不存在');
    }
    return content;
  }

  create(body: Record<string, unknown>) {
    return this.prisma.content.create({ data: this.toData(body, true) });
  }

  async update(id: string, body: Record<string, unknown>) {
    await this.findOne(id);
    return this.prisma.content.update({ where: { id }, data: this.toData(body, false) });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.content.delete({ where: { id } });
    return { success: true };
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    if (!contentStatuses.includes(status)) {
      throw new BadRequestException('内容状态无效');
    }
    return this.prisma.content.update({ where: { id }, data: { status } });
  }

  private toData(body: Record<string, unknown>, creating: boolean): Prisma.ContentCreateInput {
    const title = String(body.title || '').trim();
    if (creating && !title) {
      throw new BadRequestException('标题不能为空');
    }

    const data: Prisma.ContentCreateInput = {
      title,
      subtitle: String(body.subtitle || ''),
      cover: String(body.cover || ''),
      category: String(body.category || ''),
      summary: String(body.summary || ''),
      content: String(body.content || ''),
      sort: Number(body.sort || 0),
      status: contentStatuses.includes(String(body.status)) ? String(body.status) : 'draft'
    };

    if (!creating && !title) {
      delete (data as Partial<Prisma.ContentCreateInput>).title;
    }

    return data;
  }
}
