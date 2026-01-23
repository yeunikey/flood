import type { FeatureCollection } from 'geojson';
import { Site } from 'src/modules/sites/entities/site';
import { Spatial } from 'src/modules/spatial/entity/spatial.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('pools')
export class Pool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'jsonb',
    nullable: false,
  })
  geojson: FeatureCollection;

  @OneToMany(() => Site, (site) => site.pool)
  sites: Site[];

  @OneToMany(() => Spatial, (spatial) => spatial.pool)
  spatials: Spatial[];
}
