import { generateFragments } from './generate-fragments';

async function main() {
  console.log('Starting fragments generation...');

  await generateFragments({
    timeoutMs: 240000, // 4 minutes
  });

  console.log('Fragments generation completed');
}

main();
