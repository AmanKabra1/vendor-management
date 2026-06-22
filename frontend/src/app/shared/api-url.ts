import { environment } from '../../environments/environment';

const OVERRIDE_KEY = 'vm_api_url';

/**
 * Effective backend base URL (no trailing slash).
 *
 * Order of precedence:
 *  1. A runtime override saved in localStorage (set via `?apiUrl=` — see main.ts).
 *  2. The build-time value baked into environment.apiUrl.
 *
 * The override lets a deployed frontend point at a new backend URL WITHOUT a
 * rebuild/redeploy — useful when the backend host (e.g. Back4app free) hands
 * out a fresh URL on every deploy.
 */
export function apiBaseUrl(): string {
  let override = '';
  try {
    override = localStorage.getItem(OVERRIDE_KEY) || '';
  } catch {
    /* localStorage unavailable (SSR/again) — ignore */
  }
  return (override || environment.apiUrl).replace(/\/+$/, '');
}

/** Persist a runtime backend URL override (empty string clears it). */
export function setApiOverride(url: string): void {
  try {
    if (url) localStorage.setItem(OVERRIDE_KEY, url);
    else localStorage.removeItem(OVERRIDE_KEY);
  } catch {
    /* ignore */
  }
}
