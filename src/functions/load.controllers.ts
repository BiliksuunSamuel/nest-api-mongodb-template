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

/*

The load.controllers.ts file is responsible for loading all the controllers in the controllers directory.
ensure that the controllers directory exists and contains at least one controller file.
naming convention for the controller files is to use the name of the controller as the file name.
For example, a controller named UsersController should be saved in a file named users.controller.ts
nb: All your controllers should prefic with .controller.ts
*/
