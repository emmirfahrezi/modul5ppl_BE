import { Module } from '@nestjs/common';
import { CartController } from './controllers/v1/cart.controller';
import { CartService } from './cart.service';

@Module({
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}

