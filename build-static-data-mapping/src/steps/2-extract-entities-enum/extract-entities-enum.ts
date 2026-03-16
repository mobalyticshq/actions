import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

export async function extractEntitiesEnum(): Promise<void> {
  try {
    const schemaPath = path.resolve(
      process.cwd(),
      'build',
      'downloaded',
      'cleaned-schema',
      'cleaned-schema.graphql',
    );
    const outputPath = path.resolve(
      process.cwd(),
      'build',
      'downloaded',
      'cleaned-schema',
      'entities.gql',
    );

    const schema = fs.readFileSync(schemaPath, 'utf-8');

    const match = schema.match(/enum\s+\w+EntitiesEnum\s*\{[^}]*\}/);

    if (!match) {
      throw new Error('EntitiesEnum not found in cleaned-schema.graphql');
    }

    fs.writeFileSync(outputPath, match[0], 'utf-8');
    core.info(`✓ Extracted entities enum to ${outputPath}`);
  } catch (error) {
    core.setFailed(`Error in extractEntitiesEnum: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
