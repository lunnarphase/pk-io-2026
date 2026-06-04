import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { CuisineType, DietType, RecipeLifecycleStatus } from '../enums';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true, default: null })
  instructions: string | null;

  @Column({ type: 'int', nullable: true, default: null })
  estimatedKcalPerServing: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  servings: number | null;

  @Column({
    type: 'enum',
    enum: RecipeLifecycleStatus,
    default: RecipeLifecycleStatus.DRAFT,
  })
  lifecycleStatus: RecipeLifecycleStatus;

  @Column({ type: 'enum', enum: DietType, nullable: true })
  dietType: DietType | null;

  @Column({ type: 'enum', enum: CuisineType, nullable: true })
  cuisineType: CuisineType | null;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.recipes, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => RecipeIngredient, (ri) => ri.recipe, {
    cascade: true,
    eager: false,
  })
  ingredients: RecipeIngredient[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
