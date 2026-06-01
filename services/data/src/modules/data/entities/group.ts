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

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @ManyToOne(() => MethodType)
  @JoinColumn({ name: 'method_id' })
  method: MethodType;

  @ManyToOne(() => DataSource)
  @JoinColumn({ name: 'source_id' })
  source: DataSource;

  @ManyToOne(() => Qcl, { nullable: true })
  @JoinColumn({ name: 'qcl' })
  qcl: Qcl;

  @OneToMany(() => DataValue, (dataValue) => dataValue.group)
  dataValues: DataValue[];
}
