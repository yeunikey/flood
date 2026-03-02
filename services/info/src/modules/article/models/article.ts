import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Article {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    authorName: string;

    @Column()
    title: string;

    @Column({ default: 'Нет' })
    journal: string;

    @Column({ default: 'Нет' })
    type: string;

    @Column()
    doi: string;

    @Column({ type: 'timestamp' })
    publishedAt: Date;

}
