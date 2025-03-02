import { Logger } from '@nestjs/common';
import { readdirSync } from 'fs';
import { join } from 'path';

const repositories = [];
const repositoriesPath = join(__dirname, '../repositories');
const logger = new Logger('load.repositories');
readdirSync(repositoriesPath).forEach((file) => {
  if (!file.endsWith('.js')) return; // Ignore non-JavaScript files

  const module = require(join(repositoriesPath, file));

  Object.keys(module).forEach((key) => {
    const repository = module[key];

    if (typeof repository === 'function') {
      logger.debug(`Registering repository: ${key}`);
      repositories.push(repository);
    }
  });
});

logger.debug(`✅  Registered ${repositories.length} repositories`);
export default repositories;
