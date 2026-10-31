import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Request,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { CartService } from '../../cart.service';
import { AddToCartDto } from '../../dto/add-to-cart.dto';
import { UpdateCartItemDto } from '../../dto/update-cart-item.dto';
import { CheckoutDto } from '../../dto/checkout.dto';

@ApiTags('Cart')
@ApiBearerAuth('bearerAuth')
@Controller({
  path: 'cart',
  version: '1',
})
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private extractCustomerId(req: any): number {
    return req.user?.userId || req.user?.user_id || 1;
  }

  @Public() // Allow access for testing & guest demo, while reading JWT if present
  @Get()
  @ApiOperation({
    summary: 'Melihat isi keranjang belanja customer',
    description: 'Menampilkan seluruh item keranjang, subtotal, badge_count, dan total_amount',
  })
  async getCart(@Request() req: any) {
    const customerId = this.extractCustomerId(req);
    return this.cartService.getCart(customerId);
  }

  @Public()
  @Post('items')
  @ApiOperation({
    summary: 'Menambahkan produk ke keranjang belanja (M5-US3)',
    description: 'Menambahkan item ke keranjang. Jika produk sudah ada, kuantitas bertambah (bukan entri baru)',
  })
  async addItem(@Body() dto: AddToCartDto, @Request() req: any) {
    const customerId = this.extractCustomerId(req);
    return this.cartService.addItem(customerId, dto);
  }

  @Public()
  @Patch('items/:id')
  @ApiOperation({
    summary: 'Memperbarui kuantitas item dalam keranjang',
    description: 'Mengubah jumlah kuantitas produk yang ada di keranjang',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  async updateItemQty(
    @Param('id', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto,
    @Request() req: any,
  ) {
    const customerId = this.extractCustomerId(req);
    return this.cartService.updateItemQty(customerId, itemId, dto.qty);
  }

  @Public()
  @Delete('items/:id')
  @ApiOperation({
    summary: 'Menghapus satu item dari keranjang',
    description: 'Menghapus produk tertentu dari keranjang belanja',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  async removeItem(@Param('id', ParseIntPipe) itemId: number, @Request() req: any) {
    const customerId = this.extractCustomerId(req);
    return this.cartService.removeItem(customerId, itemId);
  }

  @Public()
  @Delete()
  @ApiOperation({
    summary: 'Mengosongkan keranjang belanja',
    description: 'Menghapus semua produk di keranjang belanja customer',
  })
  async clearCart(@Request() req: any) {
    const customerId = this.extractCustomerId(req);
    return this.cartService.clearCart(customerId);
  }

  @Public()
  @Post('checkout')
  @ApiOperation({
    summary: 'Checkout keranjang menjadi Order ke Modul M4 (M5-US4 / Kontrak K-04)',
    description: 'Validasi keranjang (ITEMS_EMPTY bila kosong), lalu kirim order ke Modul M4 dan kosongkan keranjang',
  })
  async checkout(
    @Body() dto: CheckoutDto,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const customerId = this.extractCustomerId(req);
    return this.cartService.checkout(customerId, dto, authHeader);
  }
}

