const SLUG = 'collection-import-reconciler';
const API = `https://api.sociobot.in/api/v1/products/${SLUG}`;
const LICENSE_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const DAY = 86_400_000;

interface CachedVerdict {
  valid: boolean;
  checkedAt: number;
}

export type LicenseState = 'locked' | 'checking' | 'unlocked' | 'inactive' | 'offline';

export function buyUrl(email = ''): string {
  return `${API}/checkout${email ? `?email=${encodeURIComponent(email)}` : ''}`;
}

export function storedLicense(): string {
  return localStorage.getItem(LICENSE_KEY) ?? '';
}

function cacheVerdict(valid: boolean): void {
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid, checkedAt: Date.now() }));
}

function readVerdict(): CachedVerdict | null {
  try {
    const value = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as CachedVerdict | null;
    return value && typeof value.valid === 'boolean' && typeof value.checkedAt === 'number' ? value : null;
  } catch {
    return null;
  }
}

export function captureReturnedLicense(): boolean {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('license')?.trim();
  if (!token) return false;
  localStorage.setItem(LICENSE_KEY, token);
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export function optimisticLicenseState(): LicenseState {
  if (!storedLicense()) return 'locked';
  const cached = readVerdict();
  if (cached?.valid) return 'unlocked';
  return 'checking';
}

export async function verifyLicense(force = false): Promise<LicenseState> {
  const token = storedLicense();
  if (!token) return 'locked';
  const cached = readVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < DAY) return cached.valid ? 'unlocked' : 'inactive';
  if (!navigator.onLine) return cached?.valid ? 'unlocked' : 'offline';
  try {
    const response = await fetch(`${API}/verify?license=${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Verification request failed');
    const body = (await response.json()) as { valid?: boolean };
    const valid = body.valid === true;
    cacheVerdict(valid);
    return valid ? 'unlocked' : 'inactive';
  } catch {
    return cached?.valid ? 'unlocked' : 'offline';
  }
}

export function saveLicense(token: string): void {
  localStorage.setItem(LICENSE_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function clearLicense(): void {
  localStorage.removeItem(LICENSE_KEY);
  localStorage.removeItem(VERDICT_KEY);
}
