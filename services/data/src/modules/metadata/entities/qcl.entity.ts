import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('qcl')
export class Qcl {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;
}
