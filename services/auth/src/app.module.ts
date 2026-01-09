import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigurationModule } from './config/configuration.module';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [DatabaseModule, ConfigurationModule, UserModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
