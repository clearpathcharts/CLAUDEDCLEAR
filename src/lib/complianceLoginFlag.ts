/** Session flag so the Regulatory Compliance dialog appears after Private Login reload. */

export const COMPLIANCE_LOGIN_FLAG_KEY = 'cp_show_compliance_on_login';

export function markCompliancePopupForNextLoad(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(COMPLIANCE_LOGIN_FLAG_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function hasComplianceLoginFlag(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(COMPLIANCE_LOGIN_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearComplianceLoginFlag(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(COMPLIANCE_LOGIN_FLAG_KEY);
  } catch {
    /* ignore */
  }
}
