/**
 * Compares two semver-like version strings (e.g. "0.140.0").
 * Returns positive if v1 > v2, negative if v1 < v2, 0 if equal.
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map((n) => parseInt(n, 10));
  const parts2 = v2.split('.').map((n) => parseInt(n, 10));
  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const a = parts1[i] ?? 0;
    const b = parts2[i] ?? 0;
    if (a !== b) return a - b;
  }
  return 0;
}

/**
 * Returns true if currentVersion satisfies the theme's minimum version requirement.
 * If minVersion is null (no requirement stated), always returns true.
 */
export function isVersionCompatible(
  currentVersion: string,
  minVersion: string | null
): boolean {
  if (!minVersion) return true;
  if (!currentVersion) return true;
  return compareVersions(currentVersion, minVersion) >= 0;
}

export function isValidVersion(v: string): boolean {
  return /^\d+\.\d+(\.\d+)?$/.test(v.trim());
}
