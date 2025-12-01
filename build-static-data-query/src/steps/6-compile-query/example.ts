import { compileQuery } from './compile-query';

async function main() {
  console.log('Starting query compilation...');

  await compileQuery();

  console.log('Fragments query compilation');
}

main();
