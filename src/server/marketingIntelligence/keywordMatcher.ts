import {
  getAllKeywordRouteAssignments,
  type KeywordRouteAssignment,
} from '../../lib/marketingRouteRegistry';

function normalize(value: string): string {
  return value.trim().replace(/^#/, '').replace(/\s+/g, ' ').toLowerCase();
}

export function matchMarketingKeyword(
  keyword: string,
  options?: { platform?: string; limit?: number },
): KeywordRouteAssignment[] {
  const needle = normalize(keyword);
  if (!needle) return [];
  const platform = normalize(options?.platform || '');
  const limit = Math.max(1, Math.min(50, Number(options?.limit) || 10));

  return getAllKeywordRouteAssignments()
    .filter((assignment) => {
      if (platform && normalize(assignment.platform || '') !== platform) return false;
      return (
        assignment.normalizedKeyword === needle ||
        assignment.normalizedKeyword.includes(needle) ||
        needle.includes(assignment.normalizedKeyword)
      );
    })
    .sort((left, right) => {
      const leftExact = left.normalizedKeyword === needle ? 0 : 1;
      const rightExact = right.normalizedKeyword === needle ? 0 : 1;
      return leftExact - rightExact || left.keyword.length - right.keyword.length;
    })
    .slice(0, limit);
}
