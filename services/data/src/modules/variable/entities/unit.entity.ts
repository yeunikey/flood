import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('unit')
export class Unit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  symbol: string;

  @Column({ nullable: true })
  description: string;
}
