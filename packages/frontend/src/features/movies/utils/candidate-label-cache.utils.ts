export type CandidateLabelKind = "person" | "keyword";

const STORAGE_KEY_PREFIX = "catalog-candidate-labels:";

export class CandidateLabelCacheUtils {
  static read(kind: CandidateLabelKind): Record<number, string> {
    const storage = CandidateLabelCacheUtils.getStorage();
    if (storage == null) {
      return {};
    }

    const storageKey = CandidateLabelCacheUtils.buildStorageKey(kind);
    const rawValue = storage.getItem(storageKey);
    if (rawValue == null) {
      return {};
    }

    return CandidateLabelCacheUtils.parseLabels(rawValue);
  }

  static merge(
    kind: CandidateLabelKind,
    nextLabels: Record<number, string>,
  ): Record<number, string> {
    const currentLabels = CandidateLabelCacheUtils.read(kind);
    const mergedLabels = { ...currentLabels, ...nextLabels };
    CandidateLabelCacheUtils.write(kind, mergedLabels);

    return mergedLabels;
  }

  static write(
    kind: CandidateLabelKind,
    labels: Record<number, string>,
  ): void {
    const storage = CandidateLabelCacheUtils.getStorage();
    if (storage == null) {
      return;
    }

    const storageKey = CandidateLabelCacheUtils.buildStorageKey(kind);
    const serializedLabels = JSON.stringify(labels);

    try {
      storage.setItem(storageKey, serializedLabels);
    } catch {
      return;
    }
  }

  private static getStorage(): Storage | null {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }

  private static buildStorageKey(kind: CandidateLabelKind): string {
    return `${STORAGE_KEY_PREFIX}${kind}`;
  }

  private static parseLabels(rawValue: string): Record<number, string> {
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(rawValue);
    } catch {
      return {};
    }

    const isObject =
      parsedValue !== null && typeof parsedValue === "object";
    if (!isObject) {
      return {};
    }

    return CandidateLabelCacheUtils.toNumberKeyedLabels(
      parsedValue as Record<string, unknown>,
    );
  }

  private static toNumberKeyedLabels(
    value: Record<string, unknown>,
  ): Record<number, string> {
    const labels: Record<number, string> = {};
    for (const [rawKey, rawLabel] of Object.entries(value)) {
      const id = Number(rawKey);
      const isValidId = Number.isFinite(id);
      const isValidLabel = typeof rawLabel === "string";
      if (!isValidId || !isValidLabel) continue;

      labels[id] = rawLabel;
    }

    return labels;
  }
}
