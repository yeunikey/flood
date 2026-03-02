import { Module } from '@nestjs/common';
import { New } from './models/new.entity';
import { NewController } from './new.controller';
import { NewService } from './new.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/users/user.module';

@Module({
    imports: [TypeOrmModule.forFeature([New]), UserModule],
    providers: [NewService],
    controllers: [NewController],
})
export class NewModule { }
