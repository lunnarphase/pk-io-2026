import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ShoppingListItem } from './shopping-list-item.entity';

@Entity('shopping_lists')
export class ShoppingList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.shoppingList, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @OneToMany(() => ShoppingListItem, (item) => item.shoppingList, {
    cascade: true,
  })
  items: ShoppingListItem[];

  @CreateDateColumn()
  createdAt: Date;
}
