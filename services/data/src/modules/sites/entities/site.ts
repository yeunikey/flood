import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { SiteType } from './site_type';
import { Pool } from 'src/modules/pools/entities/pool.entity';

@Entity('site')
export class Site {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  name: string;

  @ManyToOne(() => SiteType, { eager: true })
  @JoinColumn({ name: 'site_type_id' })
  siteType: SiteType;

  @Column('float')
  longtitude: number;

  @Column('float')
  latitude: number;

  @ManyToOne(() => Pool, (pool) => pool.sites, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pool_id' })
  pool: Pool | null;
}
