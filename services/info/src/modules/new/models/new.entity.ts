import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class New {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @Column({nullable: true})
    titleEn: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'text', nullable: true })
    contentEn: string;

    @Column({nullable: true})
    imageId: string;

    @CreateDateColumn()
    createdAt: Date;
}
