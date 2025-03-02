import configuration from 'src/configuration';

export default () => ({
  secret: configuration().jwtSecret,
});
