import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('tiles')
export class Tile {

    @PrimaryColumn()
    id: string;

    @Column()
    name: string;

    @Column()
    geoPath: string;

    @Column()
    mbtilesPath: string;

    @Column({ nullable: true })
    type: 'geojson' | 'geotiff';

    @Column({ default: 'solid' })
    colorMode: 'solid' | 'gradient';

    @Column({ nullable: true })
    selectedVariable: string;

    @Column({ nullable: true })
    solidColor: string;

    @Column({ nullable: true })
    gradientColorA: string;

    @Column({ nullable: true })
    gradientColorB: string;

}

