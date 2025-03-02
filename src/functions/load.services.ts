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
