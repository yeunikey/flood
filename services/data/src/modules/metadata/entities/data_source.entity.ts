import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('data_source')
export class DataSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
