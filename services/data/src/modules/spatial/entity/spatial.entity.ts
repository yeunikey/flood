import { Pool } from 'src/modules/pools/entities/pool.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export interface SpatialStyle {
  type: 'solid' | 'gradient';

  borderColor: string;
  borderWidth: number;
  opacity: number;

  fillColor?: string;

  gradient?: {
    variable: string;
    minColor: string;
    maxColor: string;
  };
}

export interface SpatialLegendItem {
  value: string | number;
  color: string;
  label: string;
}

export interface SpatialLegend {
  enabled: boolean;
  title?: string;
  items: SpatialLegendItem[];
}

@Entity()
export class Spatial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('simple-array', { nullable: true })
  tileIds: string[];

  @Column({ type: 'jsonb', default: {} })
  style: SpatialStyle;

  @Column({ type: 'jsonb', nullable: true })
  legend: SpatialLegend;

  @ManyToOne(() => Pool, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'poolId' })
  pool: Pool | null;
}
