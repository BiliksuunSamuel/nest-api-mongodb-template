import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '../configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { loadSchemas } from '../functions/load.schemas';
import controllers from 'src/functions/load.controllers';
import repositories from 'src/functions/load.repositories';
import services from 'src/functions/load.services';
import { JwtStrategy } from 'src/providers/jwt.strategy';
import { LocalStrategy } from 'src/providers/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import constants from 'src/constants';
import { AuthMiddleware } from 'src/middlewares/auth.middleware';
import { RolesGuard } from 'src/providers/roles.guard';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
      load: [configuration],
    }),
    MongooseModule.forRoot(configuration().connectionString),
    MongooseModule.forFeature(loadSchemas()),
    JwtModule.register({
      global: true,
      secret: constants().secret,
      signOptions: { expiresIn: configuration().jwtExpiresIn },
    }),
    // per-IP limits; routes opt in with ThrottlerGuard + @Throttle
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
  ],
  controllers: [...controllers],
  providers: [
    ...repositories,
    ...services,
    LocalStrategy,
    JwtStrategy,
    RolesGuard,
  ],
})
export class AppModule {
  // session check + request normalisation for every route except login, so a
  // stale token never blocks signing in again
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: 'api/authentication/login', method: RequestMethod.POST })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
