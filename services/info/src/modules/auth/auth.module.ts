import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { UserModule } from 'src/users/user.module';
import { jwtConstants } from './constants';

@Module({
  controllers: [AuthController],
  imports: [

    UserModule,

    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7d' },
    }),
  ]
})
export class AuthModule { }
