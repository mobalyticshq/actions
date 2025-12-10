import { DynamicModuleSlug } from '../types/dynamic-modules.types';

export function generateModulePath(env: string, game: string, moduleSlug: DynamicModuleSlug): string {
  return `dynamic-modules/${env}/${game}/${moduleSlug}`;
}

export function generateModuleFolderName(version: string) {
  return `v${version}`;
}
