import { readdirSync } from 'fs';
import { join } from 'path';
import { Logger, Type } from '@nestjs/common';
import { SchemaFactory } from '@nestjs/mongoose';

const SCHEMA_FOLDER = join(__dirname, '../schemas');

export function loadSchemas(): { name: string; schema: any }[] {
  const logger = new Logger('loadSchemas');
  const schemas = [];

  try {
    const files = readdirSync(SCHEMA_FOLDER).filter((file) =>
      file.endsWith('.schema.js'),
    );

    for (const file of files) {
      const modulePath = join(SCHEMA_FOLDER, file);
      const module = require(modulePath);

      Object.keys(module).forEach((key) => {
        const entity = module[key];

        if (
          typeof entity === 'function' &&
          !key.toLowerCase().includes('schema')
        ) {
          logger.debug(`✅ Registering schema: ${key}`);
          schemas.push({
            name: key.replace('Schema', ''),
            schema: SchemaFactory.createForClass(entity as Type<any>),
          });
        } else {
          logger.debug(`Skipping: ${key}`);
        }
      });
    }
  } catch (error) {
    logger.error('Error loading schemas:', error);
  }
  logger.debug(`Loaded ${schemas.length} schemas`);
  return schemas;
}

/*
The load.schemas.ts file is responsible for loading all the schemas in the schemas directory.
ensure that the schemas directory exists and contains at least one schema file.
naming convention for the schema files is to use the name of the schema as the file name.
For example, a schema named UserSchema should be saved in a file named user.schema.ts
nb: All your schemas should prefic with .schema.ts
*/
