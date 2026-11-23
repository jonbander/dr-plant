import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(readFileSync(resolve(root, 'public/models/plant-disease/manifest.json'), 'utf8'));
const registry = JSON.parse(readFileSync(resolve(root, 'models/registry.json'), 'utf8'));
const errors = [];
if (manifest.schemaVersion !== 1 || manifest.enabled !== true) errors.push('Model bundle schema/enabled flag is invalid.');
for (const [cropId, route] of Object.entries(manifest.routes ?? {})) {
  const model = route.model;
  if (!model?.modelPath || !model.labelsPath || !model.expectedOutputCount) {
    errors.push(`${cropId}: route metadata is incomplete.`);
    continue;
  }
  const modelPath = resolve(root, 'public', model.modelPath.replace(/^\//, ''));
  const labelsPath = resolve(root, 'public', model.labelsPath.replace(/^\//, ''));
  if (!existsSync(modelPath)) errors.push(`${cropId}: model file missing (${modelPath}).`);
  if (!existsSync(labelsPath)) errors.push(`${cropId}: labels file missing (${labelsPath}).`);
  if (existsSync(labelsPath)) {
    const labels = JSON.parse(readFileSync(labelsPath, 'utf8'));
    if (labels.length !== model.expectedOutputCount) errors.push(`${cropId}: ${labels.length} labels != ${model.expectedOutputCount} outputs.`);
    if (!labels.some(x => x.cropId === cropId)) errors.push(`${cropId}: no labels are routed to this crop.`);
  }
}
for (const artifact of registry.artifacts ?? []) {
  const path = resolve(root, artifact.path);
  if (!existsSync(path)) { errors.push(`Registry artifact missing: ${artifact.path}`); continue; }
  const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (hash !== artifact.sha256) errors.push(`SHA256 mismatch: ${artifact.path}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Model bundle valid: ${Object.keys(manifest.routes).length} routes; registry hashes verified.`);
