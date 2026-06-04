import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { PantryItem } from './pantry-item.entity';
import { ShoppingListItem } from './shopping-list-item.entity';

@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  externalFoodId: string | null;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value == null ? null : Number.parseFloat(value),
    },
  })
  kcalPer100g: number | null;

  /** Default grams for 1 szt from USDA FDC portions / serving (auto, no user pick). */
  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value == null ? null : Number.parseFloat(value),
    },
  })
  gramsPerPiece: number | null;

  @OneToMany(() => RecipeIngredient, (ri) => ri.ingredient)
  recipeIngredients: RecipeIngredient[];

  @OneToMany(() => PantryItem, (pi) => pi.ingredient)
  pantryItems: PantryItem[];

  @OneToMany(() => ShoppingListItem, (sli) => sli.ingredient)
  shoppingListItems: ShoppingListItem[];
}
