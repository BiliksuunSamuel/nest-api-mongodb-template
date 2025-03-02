import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import configuration from './configuration';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({ origin: '*' });
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  //
  const config = new DocumentBuilder()
    .setTitle('Nest API MongoDb Template')
    .setDescription('The Nest API MongoDb Template API description')
    .setVersion('1.0')
    .addTag('Nest API MongoDb Template')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('/', app, document);

  //

  await app.listen(configuration().port, () => {
    console.log(
      `Server is running on http://localhost:${configuration().port}`,
    );
  });
}
bootstrap();
