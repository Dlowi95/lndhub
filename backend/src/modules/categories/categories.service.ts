import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  findPublic(): Promise<CategoryDocument[]> {
    return this.categoryModel.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).exec();
  }

  findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().sort({ sortOrder: 1, name: 1 }).exec();
  }

  async create(input: Partial<Category>): Promise<CategoryDocument> {
    try {
      return await new this.categoryModel(input).save();
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Slug danh mục đã tồn tại');
      }
      throw error;
    }
  }

  async update(id: string, input: Partial<Category>): Promise<CategoryDocument> {
    try {
      const category = await this.categoryModel
        .findByIdAndUpdate(id, input, { new: true, runValidators: true })
        .exec();
      if (!category) throw new NotFoundException('Danh mục không tồn tại');
      return category;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Slug danh mục đã tồn tại');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Danh mục không tồn tại');
  }
}
