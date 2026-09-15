export type MovieQuerySuggestionNormalizedFields = {
  text: string;
  textNormalized: string;
};

export class MovieQuerySuggestionNormalizeUtils {
  static normalize(rawText: string): MovieQuerySuggestionNormalizedFields {
    const text = rawText.trim();
    const textNormalized = text.toLowerCase();

    return { text, textNormalized };
  }
}
