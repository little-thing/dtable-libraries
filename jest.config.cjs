module.exports =
  require('./packages/jest/output/cjs/index').getAutoGeneratedJestConfigForMonorepo(
    ['packages/*/test'],
  );
