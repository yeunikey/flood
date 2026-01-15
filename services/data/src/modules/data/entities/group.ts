import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DataValue } from './data_value.entity';
import { Category } from './category.entity';
import { MethodType } from 'src/modules/metadata/entities/method_type.entity';
import { Qcl } from 'src/modules/metadata/entities/qcl.entity';
import { Site } from 'src/modules/sites/entities/site';
import { DataSource } from 'src/modules/metadata/entities/data_source.entity';

@Entity('group')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  date_utc: Date;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Site, { eager: true })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @ManyToOne(() => MethodType, { eager: true })
  @JoinColumn({ name: 'method_id' })
  method: MethodType;

  @ManyToOne(() => DataSource, { eager: true })
  @JoinColumn({ name: 'source_id' })
  source: DataSource;

  @ManyToOne(() => Qcl, { eager: true, nullable: true })
  @JoinColumn({ name: 'qcl' })
  qcl: Qcl;

  @OneToMany(() => DataValue, (dataValue) => dataValue.group)
  dataValues: DataValue[];
}
