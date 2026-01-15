import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('site_type')
export class SiteType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;
}
