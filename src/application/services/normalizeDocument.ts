export function normalizeDocument(document: string): string {
  return document
    .trim()
    .toUpperCase()
    .replace(new RegExp("[.\\s/-]", "g"), "");
}
