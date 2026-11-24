import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import configuration from './configuration';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiResponseInterceptor } from './interceptors/api.response.interceptor';
import { HttpExceptionFilter } from './middlewares/http.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  // behind a reverse proxy, use the real client IP (throttling, sessions)
  (app.getHttpAdapter().getInstance() as any).set(
    'trust proxy',
    configuration().trustProxy,
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: configuration().corsOrigin });
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

  // global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  //
  const config = new DocumentBuilder()
    .setTitle('Nest API MongoDb Template')
    .setDescription('The Nest API MongoDb Template API description')
    .setVersion('1.0')
    .addTag('Nest API MongoDb Template')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'Authorization',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('/', app, document);

  //

  const port = configuration().port;
  await app.listen(port);
  new Logger('Bootstrap').log(`Server is running on http://localhost:${port}`);
}
bootstrap();
