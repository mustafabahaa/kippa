import type { Category, PendingFinancialMessage } from '@kippa/domain';

/** Uppercases and collapses everything that isn't a letter, digit or Arabic
 *  character into single spaces, so "SEOUDI-DREAM", "seoudi market dream"
 *  and "SEOUDI MARKET DREAM" all compare equal for substring matching. */
export function normalizeMerchantText(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9\u0600-\u06FF]+/g, ' ').trim();
}

export function normalizeMerchantKeyword(value: string): string {
  return normalizeMerchantText(value);
}

export function dedupeMerchantKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const keyword of keywords) {
    const normalized = normalizeMerchantKeyword(keyword);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(keyword.trim());
  }
  return result;
}

export function merchantText(item: PendingFinancialMessage): string {
  return normalizeMerchantText(item.counterparty || item.description || '');
}

/** All categories whose keyword matches the message's merchant text, ordered
 *  by their longest matching keyword — the most specific merchant first. A
 *  merchant stored on several categories (e.g. a petrol-station shop that is
 *  sometimes fuel, sometimes cigarettes) yields several ids so the review UI
 *  can ask "this or this?". */
export function suggestCategoryIds(
  item: PendingFinancialMessage,
  categories: Category[],
): string[] {
  if (item.kind === 'transfer' || item.suggestedLoanId) return [];
  const expectedType = item.kind === 'income' ? 'income' : 'expense';
  const text = merchantText(item);
  if (!text) return [];

  const matches: { categoryId: string; keywordLength: number }[] = [];
  for (const category of categories) {
    if (!category.isActive || category.type !== expectedType) continue;
    let best: number | null = null;
    for (const keyword of category.merchantKeywords ?? []) {
      const normalized = normalizeMerchantKeyword(keyword);
      if (!normalized || !text.includes(normalized)) continue;
      if (best === null || normalized.length > best) best = normalized.length;
    }
    if (best !== null) matches.push({ categoryId: category.id, keywordLength: best });
  }
  return matches
    .sort((a, b) => b.keywordLength - a.keywordLength)
    .map((match) => match.categoryId);
}

/** Single-category convenience: the best (most specific) match, or null. */
export function suggestCategoryId(
  item: PendingFinancialMessage,
  categories: Category[],
): string | null {
  return suggestCategoryIds(item, categories)[0] ?? null;
}
