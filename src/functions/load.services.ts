import { Logger } from '@nestjs/common';
import { readdirSync } from 'fs';
import { join } from 'path';

const services = [];
const servicesPath = join(__dirname, '../services');
const logger = new Logger('load.services');
readdirSync(servicesPath).forEach((file) => {
  if (!file.endsWith('.js')) return; // Ignore non-JavaScript files

  const module = require(join(servicesPath, file));

  Object.keys(module).forEach((key) => {
    const service = module[key];

    if (typeof service === 'function') {
      logger.debug(`Registering service: ${key}`);
      services.push(service);
    }
  });
});

logger.debug(`✅ Registered ${services.length} services`);

export default services;

/*
The load.services.ts file is responsible for loading all the services in the services directory.
ensure that the services directory exists and contains at least one service file.
naming convention for the service files is to use the name of the service as the file name.
For example, a service named UserService should be saved in a file named user.service.ts
nb:All your services should prefix with .service.ts
*/
