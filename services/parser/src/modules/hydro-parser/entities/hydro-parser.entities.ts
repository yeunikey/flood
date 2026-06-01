import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('site_type')
export class SiteType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}

@Entity('site')
export class Site {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  name: string;

  @ManyToOne(() => SiteType)
  @JoinColumn({ name: 'site_type_id' })
  siteType: SiteType;

  @Column('float')
  longtitude: number;

  @Column('float')
  latitude: number;
}

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}

@Entity('method_type')
export class MethodType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}

@Entity('qcl')
export class Qcl {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}

@Entity('data_source')
export class DataSourceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}

@Entity('unit')
export class Unit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  symbol: string;

  @Column({ nullable: true })
  description: string;
}

@Entity('variable')
export class Variable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ nullable: true })
  description: string;
}

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

  @ManyToOne(() => DataSourceEntity)
  @JoinColumn({ name: 'source_id' })
  source: DataSourceEntity;

  @ManyToOne(() => Qcl, { nullable: true })
  @JoinColumn({ name: 'qcl' })
  qcl: Qcl;

  @OneToMany(() => DataValue, (dataValue) => dataValue.group)
  dataValues: DataValue[];
}

@Entity('data_value')
export class DataValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  value: string;

  @ManyToOne(() => Group, (group) => group.dataValues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => Variable)
  @JoinColumn({ name: 'variable_id' })
  variable: Variable;
}
