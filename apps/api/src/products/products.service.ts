import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseListQuery, type ListQuery } from '../common/crud-query';
import { PrismaService } from '../prisma/prisma.service';

const productStatuses = ['draft', 'on_sale', 'off_sale', 'sold_out'];

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQuery) {
    const parsed = parseListQuery(query);
    const where: Prisma.ProductWhereInput = {
      ...(parsed.ids.length ? { id: { in: parsed.ids } } : {}),
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.category ? { category: { contains: parsed.category } } : {}),
      ...(parsed.search
        ? {
            OR: [
              { title: { contains: parsed.search } },
              { subtitle: { contains: parsed.search } },
              { category: { contains: parsed.search } },
              { tags: { contains: parsed.search } },
              { description: { contains: parsed.search } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: parsed.skip,
        take: parsed.take,
        orderBy: parsed.sort === 'latest' ? [{ createdAt: 'desc' }] : [{ sort: 'desc' }, { createdAt: 'desc' }]
      }),
      this.prisma.product.count({ where })
    ]);

    return { items, total, page: parsed.page, pageSize: parsed.pageSize };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }
    return product;
  }

  create(body: Record<string, unknown>) {
    return this.prisma.product.create({ data: this.toData(body, true) });
  }

  async update(id: string, body: Record<string, unknown>) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: this.toData(body, false) });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    if (!productStatuses.includes(status)) {
      throw new BadRequestException('商品状态无效');
    }
    return this.prisma.product.update({ where: { id }, data: { status } });
  }

  private toData(body: Record<string, unknown>, creating: boolean): Prisma.ProductCreateInput {
    const title = String(body.title || '').trim();
    if (creating && !title) {
      throw new BadRequestException('标题不能为空');
    }

    const data: Prisma.ProductCreateInput = {
      title,
      subtitle: String(body.subtitle || ''),
      cover: String(body.cover || ''),
      category: String(body.category || ''),
      price: Number(body.price || 0),
      originalPrice: Number(body.originalPrice || 0),
      stock: Number(body.stock || 0),
      unit: String(body.unit || ''),
      tags: String(body.tags || ''),
      description: String(body.description || ''),
      sort: Number(body.sort || 0),
      status: productStatuses.includes(String(body.status)) ? String(body.status) : 'draft'
    };

    if (!creating && !title) {
      delete (data as Partial<Prisma.ProductCreateInput>).title;
    }

    return data;
  }
}
