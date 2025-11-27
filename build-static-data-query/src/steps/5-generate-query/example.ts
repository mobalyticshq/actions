import { generateQuery } from './generate-query';

async function main() {
  console.log('Starting query generation...');

  await generateQuery({
    timeoutMs: 240000, // 4 minutes
  });

  console.log('Fragments query completed');
}

main();
