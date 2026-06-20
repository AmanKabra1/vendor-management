import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { UserService } from '../user/user.service';
import { AuthUser } from '../auth/current-user.decorator';
import { Role } from '../auth/role.enum';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly users: UserService,
  ) {}

  create(dto: CreateProductDto, ownerId: string) {
    return this.productModel.create({ ...dto, owner: ownerId });
  }

  /** The current supplier's own catalog. */
  findMine(user: AuthUser) {
    return this.productModel.find({ owner: user.userId }).sort({ createdAt: -1 }).exec();
  }

  /** Active catalog of a given supplier (for buyers to browse). */
  findBySeller(sellerId: string) {
    return this.productModel
      .find({ owner: sellerId, isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  /** All suppliers a buyer can order from. */
  listSuppliers() {
    return this.users.findByRoles([Role.Wholesaler, Role.Distributor]);
  }

  async update(id: string, dto: UpdateProductDto, user: AuthUser) {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('Product not found');
    if (String(product.owner) !== user.userId) {
      throw new ForbiddenException('Not your product');
    }
    Object.assign(product, dto);
    await product.save();
    return product;
  }

  async remove(id: string, user: AuthUser) {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('Product not found');
    if (String(product.owner) !== user.userId) {
      throw new ForbiddenException('Not your product');
    }
    await product.deleteOne();
  }
}
