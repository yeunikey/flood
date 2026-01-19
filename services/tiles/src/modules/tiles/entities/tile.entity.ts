import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('tiles')
export class Tile {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  geoJsonPath: string;

  @Column({ nullable: true })
  mbtilesPath: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
