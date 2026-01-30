import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type UserRole = 'viewer' | 'editor' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  login: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: ['viewer', 'editor', 'admin'],
    default: 'viewer',
  })
  role: UserRole;

  @Column({ nullable: true })
  image: string;
}
