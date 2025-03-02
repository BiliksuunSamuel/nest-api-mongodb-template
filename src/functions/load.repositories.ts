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

/*
The load.repositories.ts file is responsible for loading all the repositories in the repositories directory.
ensure that the repositories directory exists and contains at least one repository file.
naming convention for the repository files is to use the name of the repository as the file name.
For example, a repository named UserRepository should be saved in a file named user.repository.ts
nb: All your repositories should prefix with .repository.ts
*/
