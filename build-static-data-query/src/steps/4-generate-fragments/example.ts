import { generateFragments } from './generate-fragments';

async function main() {
  console.log('Starting fragments generation...');

  await generateFragments({
    timeoutMs: 600000, // 10 minutes
  });

  console.log('Fragments generation completed');
}

main();
