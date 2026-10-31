import { Injectable, HttpStatus, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { M4Service } from '../integrations/m4.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly m4Service: M4Service,
  ) {}

  private async getOrCreateCart(customerId: number) {
    let cart = await this.prisma.cart.findUnique({
      where: { customer_id: customerId },
      include: { items: true },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { customer_id: customerId },
        include: { items: true },
      });
    }

    return cart;
  }

  /**
   * Mengambil isi keranjang belanja beserta rincian produk dari Modul M4
   */
  async getCart(customerId: number) {
    const cart = await this.getOrCreateCart(customerId);

    // Ambil detail produk dari M4
    const products = await this.m4Service.getActiveProducts();
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    let badgeCount = 0;

    const items = cart.items.map((item) => {
      const product = productMap.get(item.product_id);
      const unitPrice = product ? product.price : 0;
      const subtotal = unitPrice * item.qty;

      totalAmount += subtotal;
      badgeCount += item.qty;

      return {
        id: item.id,
        product_id: item.product_id,
        product_name: product ? product.name : `Produk #${item.product_id}`,
        unit_price: unitPrice,
        qty: item.qty,
        subtotal,
        is_active: product ? product.is_active : false,
      };
    });

    return {
      cart_id: cart.id,
      customer_id: customerId,
      items,
      badge_count: badgeCount,
      total_items: cart.items.length,
      total_amount: totalAmount,
    };
  }

  /**
   * M5-US3: Menambahkan produk ke keranjang
   * AC 1: Item tersimpan & badge bertambah
   * AC 2: Bila produk sudah ada di keranjang, qty bertambah (bukan entri baru)
   */
  async addItem(customerId: number, dto: AddToCartDto) {
    const qtyToAdd = dto.qty && dto.qty > 0 ? dto.qty : 1;

    // Cek apakah produk aktif di M4
    const product = await this.m4Service.getProductById(dto.product_id);
    if (!product || !product.is_active) {
      throw new BusinessException('PRODUCT_INACTIVE', 'Ada produk yang sudah tidak aktif', HttpStatus.CONFLICT);
    }

    const cart = await this.getOrCreateCart(customerId);

    // Cek apakah item sudah ada di keranjang
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cart_id_product_id: {
          cart_id: cart.id,
          product_id: dto.product_id,
        },
      },
    });

    if (existingItem) {
      // AC 2: Tambah kuantitas pada entri yang sudah ada
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: existingItem.qty + qtyToAdd },
      });
    } else {
      // AC 1: Buat entri baru di keranjang
      await this.prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          product_id: dto.product_id,
          qty: qtyToAdd,
        },
      });
    }

    // Kembalikan status keranjang terupdate beserta total badge
    return this.getCart(customerId);
  }

  /**
   * Mengubah jumlah kuantitas item dalam keranjang
   */
  async updateItemQty(customerId: number, itemId: number, qty: number) {
    const cart = await this.getOrCreateCart(customerId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart_id: cart.id },
    });

    if (!item) {
      throw new NotFoundException(`Item keranjang #${itemId} tidak ditemukan`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { qty },
    });

    return this.getCart(customerId);
  }

  /**
   * Menghapus 1 item dari keranjang
   */
  async removeItem(customerId: number, itemId: number) {
    const cart = await this.getOrCreateCart(customerId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart_id: cart.id },
    });

    if (!item) {
      throw new NotFoundException(`Item keranjang #${itemId} tidak ditemukan`);
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(customerId);
  }

  /**
   * Mengosongkan seluruh keranjang
   */
  async clearCart(customerId: number) {
    const cart = await this.getOrCreateCart(customerId);
    await this.prisma.cartItem.deleteMany({
      where: { cart_id: cart.id },
    });

    return { message: 'Keranjang berhasil dikosongkan' };
  }

  /**
   * M5-US4: Checkout dari keranjang menjadi Order (Kontrak K-04 M5 -> M4)
   * AC 1: Given keranjang berisi item, When checkout, Then Order terbentuk lewat kontrak M4
   * AC 2: Given keranjang kosong, When coba checkout, Then sistem cegah & tampilkan pesan (ITEMS_EMPTY)
   */
  async checkout(customerId: number, dto: CheckoutDto, authHeader?: string) {
    const cart = await this.getOrCreateCart(customerId);

    // AC 2: Cek keranjang kosong
    if (!cart.items || cart.items.length === 0) {
      throw new BusinessException(
        'ITEMS_EMPTY',
        'Keranjang masih kosong',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Siapkan payload sesuai spesifikasi kontrak K-04
    const orderPayload = {
      customer_id: customerId,
      source: dto.source || 'website',
      items: cart.items.map((item) => ({
        product_id: item.product_id,
        qty: item.qty,
      })),
    };

    // AC 1: Kirim order ke Modul M4
    const createdOrder = await this.m4Service.createOrderFromCart(orderPayload, authHeader);

    // Setelah Order berhasil dibentuk di M4, kosongkan keranjang customer di M5
    await this.prisma.cartItem.deleteMany({
      where: { cart_id: cart.id },
    });

    return createdOrder;
  }
}

