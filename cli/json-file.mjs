import fs from 'node:fs';

function describePath(file, description) {
  return description || file;
}

export function parseJsonText(text, { description = 'JSON input', validate = null } = {}) {
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${description} is not valid JSON: ${message}`);
  }
  if (validate) {
    const validationError = validate(value);
    if (validationError) throw new Error(`${description} failed validation: ${validationError}`);
  }
  return value;
}

export function readJsonFile(file, { description, validate = null } = {}) {
  return parseJsonText(fs.readFileSync(file, 'utf8'), {
    description: describePath(file, description),
    validate,
  });
}

export function validateJsonObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? null
    : 'expected a JSON object';
}

export function validateStringArray(value) {
  if (!Array.isArray(value)) return 'expected a JSON array';
  const invalidIndex = value.findIndex((item) => typeof item !== 'string' || item.trim() === '');
  return invalidIndex === -1 ? null : `expected a non-empty string at index ${invalidIndex}`;
}
