import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getPublicCategories() {
    return { success: true, data: await this.categoriesService.findPublic() };
  }
}
