import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Ingredient } from '../domain/entities/ingredient.entity';
import { NutritionService } from '../nutrition/nutrition.service';
import { CreateIngredientDto } from './dto/ingredient.dto';

@Injectable()
export class IngredientsService {
  private readonly logger = new Logger(IngredientsService.name);

  constructor(
    @InjectRepository(Ingredient)
    private readonly repo: Repository<Ingredient>,
    private readonly nutritionService: NutritionService,
  ) {}

  findAll(search?: string): Promise<Ingredient[]> {
    if (search) {
      return this.repo.find({
        where: { name: ILike(`%${search}%`) },
        take: 50,
      });
    }
    return this.repo.find({ take: 50 });
  }

  findById(id: string): Promise<Ingredient | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findOrCreate(name: string): Promise<Ingredient> {
    const existing = await this.repo.findOne({
      where: { name: ILike(name.trim()) },
    });
    if (existing) {
      void this.scheduleNutritionEnrich(existing);
      return existing;
    }
    const created = await this.repo.save(
      this.repo.create({ name: name.trim() }),
    );
    void this.scheduleNutritionEnrich(created);
    return created;
  }

  async create(dto: CreateIngredientDto): Promise<Ingredient> {
    const existing = await this.repo.findOne({
      where: { name: ILike(dto.name.trim()) },
    });
    if (existing)
      throw new ConflictException(`Ingredient "${dto.name}" already exists`);
    const created = await this.repo.save(
      this.repo.create({
        name: dto.name.trim(),
        externalFoodId: dto.externalFoodId,
      }),
    );
    void this.scheduleNutritionEnrich(created);
    return created;
  }

  /** Best-effort USDA link; never blocks the caller. */
  private scheduleNutritionEnrich(ingredient: Ingredient): void {
    if (ingredient.kcalPer100g != null && ingredient.gramsPerPiece != null) {
      return;
    }

    void this.nutritionService.enrichIngredient(ingredient.id).catch((err) => {
      this.logger.debug(
        `Nutrition enrich skipped for "${ingredient.name}": ${(err as Error).message}`,
      );
    });
  }
}
