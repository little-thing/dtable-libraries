#!/usr/bin/env node

import { program } from 'commander';

import { buildImageCommand } from './commands/build-image.cmd.js';
import { buildNestNextCommand } from './commands/build-nest-next.cmd.js';
import { buildCommand } from './commands/build.cmd.js';
import { publishCommand } from './commands/publish.cmd.js';
import { replaceModuleSuffixCommand } from './commands/replace-module-suffix.cmd.js';
import { serveCommand } from './commands/serve.cmd.js';
import { getCliVersion } from './utils/get-cli-version.util.js';

program.version(getCliVersion(), '-v --version');

program
  .command('build')
  .description('build package')
  .argument('<pkg-relative-path>', 'relative path to pkg root folder')
  .option('--pack', 'pack package after build')
  .option(
    '--app',
    'change default options for application, like disable cjs and dts outputs',
  )
  .action(buildCommand);

program
  .command('build-nest-next')
  .description('build next in nest application')
  .argument('<pkg-relative-path>', 'relative path to pkg root folder')
  .action(buildNestNextCommand);

program
  .command('build-image')
  .description('build docker image')
  .argument('<app-name>', 'name of the app')
  .option('-t, --target <target>', 'target image')
  .action(buildImageCommand);

program
  .command('serve')
  .description('serve package')
  .argument('<pkg-relative-path>', 'relative path to pkg root folder')
  .action(serveCommand);

program
  .command('publish')
  .description('publish package')
  .argument('<pkg-relative-path>', 'relative path to pkg root folder')
  .action(publishCommand);

program
  .command('replace-module-suffix')
  .description('replace module suffix')
  .argument('<relative-path>', 'relative path to file or folder')
  .argument('<old-suffix>', 'old suffix')
  .argument('<new-suffix>', 'new suffix')
  .option('--index-dirs [indexDirs...]', 'replace suffix with index file path')
  .action(replaceModuleSuffixCommand);

program.parse();
