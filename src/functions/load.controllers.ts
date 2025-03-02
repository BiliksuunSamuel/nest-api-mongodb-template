import { Logger } from '@nestjs/common';
import { readdirSync } from 'fs';
import { join } from 'path';

const controllers = [];
const controllersPath = join(__dirname, '../controllers');
const logger = new Logger('load.controllers');

readdirSync(controllersPath).forEach((file) => {
  if (!file.endsWith('.js')) return; // Ignore non-JavaScript files

  const module = require(join(controllersPath, file));

  Object.keys(module).forEach((key) => {
    const controller = module[key];

    if (typeof controller === 'function') {
      logger.debug(`Registering controller: ${key}`);
      controllers.push(controller);
    }
  });
});

logger.debug(`✅  Registered ${controllers.length} controllers`);

export default controllers;
