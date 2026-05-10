import { Module } from '@nestjs/common';
import { ProductsController, PublicProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController, PublicProductsController],
  providers: [ProductsService]
})
export class ProductsModule {}
