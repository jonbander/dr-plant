import { readFileSync } from "node:fs";

const file = new URL("../data/knowledge-base.json", import.meta.url);
const data = JSON.parse(readFileSync(file, "utf8"));
const errors = [];
const allowedEvidence = new Set([
  "reference_only",
  "suspected",
  "reported",
  "expert_confirmed",
]);

function requireText(value, path) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${path}: expected a non-empty string`);
  }
}

function requireHttps(value, path) {
  requireText(value, path);
  if (typeof value === "string" && !value.startsWith("https://")) {
    errors.push(`${path}: source URL must use HTTPS`);
  }
}

function checkUniqueIds(items, path) {
  const seen = new Set();
  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== "object") {
      errors.push(`${path}[${index}]: expected an object`);
      continue;
    }
    requireText(item.id, `${path}[${index}].id`);
    if (typeof item.id === "string") {
      if (seen.has(item.id)) errors.push(`${path}: duplicate id "${item.id}"`);
      seen.add(item.id);
    }
  }
}

if (data.schemaVersion !== 1) {
  errors.push("schemaVersion: expected 1");
}
if (!Array.isArray(data.diseases)) errors.push("diseases: expected an array");
if (!Array.isArray(data.datasets)) errors.push("datasets: expected an array");
if (!Array.isArray(data.contributions)) errors.push("contributions: expected an array");

if (Array.isArray(data.diseases)) {
  checkUniqueIds(data.diseases, "diseases");
  for (const [index, disease] of data.diseases.entries()) {
    const path = `diseases[${index}]`;
    requireText(disease.crop, `${path}.crop`);
    requireText(disease.scientificName, `${path}.scientificName`);
    requireText(disease.evidenceStatus, `${path}.evidenceStatus`);
    if (!allowedEvidence.has(disease.evidenceStatus)) {
      errors.push(`${path}.evidenceStatus: unsupported value "${disease.evidenceStatus}"`);
    }
    if (!Array.isArray(disease.commonNames) || disease.commonNames.length === 0) {
      errors.push(`${path}.commonNames: expected a non-empty array`);
    }
    if (!Array.isArray(disease.sources) || disease.sources.length === 0) {
      errors.push(`${path}.sources: expected at least one source`);
    } else {
      for (const [sourceIndex, source] of disease.sources.entries()) {
        requireText(source.title, `${path}.sources[${sourceIndex}].title`);
        requireHttps(source.url, `${path}.sources[${sourceIndex}].url`);
      }
    }
    if (disease.evidenceStatus === "expert_confirmed") {
      requireText(disease.expertReview?.reviewerRole, `${path}.expertReview.reviewerRole`);
      requireText(disease.expertReview?.reviewedAt, `${path}.expertReview.reviewedAt`);
      requireText(disease.expertReview?.method, `${path}.expertReview.method`);
    }
  }
}

if (Array.isArray(data.datasets)) {
  checkUniqueIds(data.datasets, "datasets");
  for (const [index, dataset] of data.datasets.entries()) {
    const path = `datasets[${index}]`;
    requireText(dataset.name, `${path}.name`);
    requireText(dataset.crop, `${path}.crop`);
    requireText(dataset.license, `${path}.license`);
    requireHttps(dataset.source, `${path}.source`);
    if (!Array.isArray(dataset.classes) || dataset.classes.length === 0) {
      errors.push(`${path}.classes: expected a non-empty array`);
    }
    if (dataset.imageCount !== undefined &&
        (!Number.isInteger(dataset.imageCount) || dataset.imageCount < 1)) {
      errors.push(`${path}.imageCount: expected a positive integer when supplied`);
    }
  }
}

if (errors.length) {
  console.error("Knowledge base validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Knowledge base valid: ${data.diseases.length} disease records, ${data.datasets.length} datasets.`,
  );
}
