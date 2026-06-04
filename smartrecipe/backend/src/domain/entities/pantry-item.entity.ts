import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Ingredient } from './ingredient.entity';

@Entity('pantry_items')
@Unique(['userId', 'ingredientId'])
export class PantryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column()
  unit: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.pantryItems, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  ingredientId: string;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.pantryItems)
  ingredient: Ingredient;
}
