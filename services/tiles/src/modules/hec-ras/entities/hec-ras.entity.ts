import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('hec_ras')
export class HecRas {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  originalFilename: string;

  @Column()
  dbPath: string;

  @CreateDateColumn()
  createdAt: Date;
}
