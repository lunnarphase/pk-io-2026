import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ShoppingList } from './shopping-list.entity';
import { Ingredient } from './ingredient.entity';

@Entity('shopping_list_items')
export class ShoppingListItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantityNeeded: number;

  @Column()
  unit: string;

  @Column({ default: false })
  purchased: boolean;

  @Column()
  shoppingListId: string;

  @ManyToOne(() => ShoppingList, (list) => list.items, { onDelete: 'CASCADE' })
  shoppingList: ShoppingList;

  @Column()
  ingredientId: string;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.shoppingListItems)
  ingredient: Ingredient;
}
