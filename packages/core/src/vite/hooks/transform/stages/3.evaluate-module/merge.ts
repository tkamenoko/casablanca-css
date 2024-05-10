function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object") {
    return false;
  }
  if (value === null) {
    return false;
  }
  return !Array.isArray(value);
}

export function merge(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(defaults)) {
    if (key in overrides) {
      const overriding = overrides[key];
      if (!isRecord(value)) {
        merged[key] = overriding;
        continue;
      }
      if (!isRecord(overriding)) {
        merged[key] = overriding;
        continue;
      }
      merged[key] = merge({ ...value }, { ...overriding });
    }
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (!(key in defaults)) {
      merged[key] = value;
    }
  }
  return merged;
}
