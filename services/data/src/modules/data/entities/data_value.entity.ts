import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Group } from './group';
import { Variable } from 'src/modules/variable/entities/variable.entity';

@Entity('data_value')
export class DataValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  value: string;

  @ManyToOne(() => Group, (group) => group.dataValues, { eager: true })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => Variable, { eager: true })
  @JoinColumn({ name: 'variable_id' })
  variable: Variable;
}
