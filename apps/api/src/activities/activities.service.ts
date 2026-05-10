import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseDate, parseListQuery, type ListQuery } from '../common/crud-query';
import { PrismaService } from '../prisma/prisma.service';

const activityStatuses = ['draft', 'published', 'offline', 'ended'];

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQuery) {
    const parsed = parseListQuery(query);
    const where: Prisma.ActivityWhereInput = {
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.search
        ? {
            OR: [
              { title: { contains: parsed.search } },
              { category: { contains: parsed.search } },
              { location: { contains: parsed.search } },
              { description: { contains: parsed.search } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        skip: parsed.skip,
        take: parsed.take,
        orderBy: [{ sort: 'desc' }, { createdAt: 'desc' }]
      }),
      this.prisma.activity.count({ where })
    ]);

    return { items, total, page: parsed.page, pageSize: parsed.pageSize };
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }
    return activity;
  }

  create(body: Record<string, unknown>) {
    return this.prisma.activity.create({ data: this.toData(body, true) });
  }

  async update(id: string, body: Record<string, unknown>) {
    await this.findOne(id);
    return this.prisma.activity.update({ where: { id }, data: this.toData(body, false) });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.activity.delete({ where: { id } });
    return { success: true };
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    if (!activityStatuses.includes(status)) {
      throw new BadRequestException('活动状态无效');
    }
    return this.prisma.activity.update({ where: { id }, data: { status } });
  }

  private toData(body: Record<string, unknown>, creating: boolean): Prisma.ActivityCreateInput {
    const title = String(body.title || '').trim();
    if (creating && !title) {
      throw new BadRequestException('标题不能为空');
    }

    const data: Prisma.ActivityCreateInput = {
      title,
      cover: String(body.cover || ''),
      category: String(body.category || ''),
      location: String(body.location || ''),
      startTime: parseDate(body.startTime),
      endTime: parseDate(body.endTime),
      signupStartTime: parseDate(body.signupStartTime),
      signupEndTime: parseDate(body.signupEndTime),
      capacity: Number(body.capacity || 0),
      signupCount: Number(body.signupCount || 0),
      price: Number(body.price || 0),
      description: String(body.description || ''),
      sort: Number(body.sort || 0),
      status: activityStatuses.includes(String(body.status)) ? String(body.status) : 'draft'
    };

    if (!creating && !title) {
      delete (data as Partial<Prisma.ActivityCreateInput>).title;
    }

    return data;
  }
}
