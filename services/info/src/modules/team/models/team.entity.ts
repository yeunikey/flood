import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('team')
export class Team {

    @PrimaryGeneratedColumn()
    private id: number;

    @Column()
    private fullName: string;

    @Column({ nullable: true })
    private fullNameEn: string;

    @Column()
    private position: string;

    @Column({ nullable: true })
    private positionEn: string;

    @Column()
    private image: string;

    @Column()
    private priority: number;

}