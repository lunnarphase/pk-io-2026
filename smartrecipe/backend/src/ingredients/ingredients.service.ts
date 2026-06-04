import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Ingredient } from '../domain/entities/ingredient.entity';
import { CreateIngredientDto } from './dto/ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly repo: Repository<Ingredient>,
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
    if (existing) return existing;
    return this.repo.save(this.repo.create({ name: name.trim() }));
  }

  async create(dto: CreateIngredientDto): Promise<Ingredient> {
    const existing = await this.repo.findOne({
      where: { name: ILike(dto.name.trim()) },
    });
    if (existing)
      throw new ConflictException(`Ingredient "${dto.name}" already exists`);
    return this.repo.save(
      this.repo.create({
        name: dto.name.trim(),
        externalFoodId: dto.externalFoodId,
      }),
    );
  }
}
