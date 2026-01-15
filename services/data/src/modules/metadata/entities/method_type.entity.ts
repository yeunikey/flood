import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('method_type')
export class MethodType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}
