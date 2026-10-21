// Auto Update Service for ZhiWei Notebook
// Checks latest releases from official GitHub repository: xuewexin/zhiwei-notebook

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  htmlUrl: string;
  windowsExeUrl?: string;
  windowsZipUrl?: string;
  androidApkUrl?: string;
  ipadIpaUrl?: string;
}

export const CURRENT_VERSION = '1.5.0';
const GITHUB_REPO = 'xuewexin/zhiwei-notebook';
const LAST_IGNORED_VERSION_KEY = 'zhiwei_ignored_update_version';

/**
 * Compare two semver strings: e.g. "1.5.0" vs "1.4.0" or "v1.5.0" vs "v1.4.0"
 * Returns true if vRemote > vLocal
 */
export function isNewerVersion(remoteVer: string, localVer: string): boolean {
  const clean = (v: string) => v.replace(/^v/i, '').trim();
  const rParts = clean(remoteVer).split('.').map(n => parseInt(n, 10) || 0);
  const lParts = clean(localVer).split('.').map(n => parseInt(n, 10) || 0);

  const len = Math.max(rParts.length, lParts.length);
  for (let i = 0; i < len; i++) {
    const r = rParts[i] || 0;
    const l = lParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

/**
 * Check if the user has chosen to ignore this specific version
 */
export function isVersionIgnored(version: string): boolean {
  try {
    return localStorage.getItem(LAST_IGNORED_VERSION_KEY) === version;
  } catch {
    return false;
  }
}

/**
 * Ignore a specific update version
 */
export function setVersionIgnored(version: string): void {
  try {
    localStorage.setItem(LAST_IGNORED_VERSION_KEY, version);
  } catch {}
}

/**
 * Reset ignored version
 */
export function clearIgnoredVersion(): void {
  try {
    localStorage.removeItem(LAST_IGNORED_VERSION_KEY);
  } catch {}
}

/**
 * Fetch latest release information from GitHub API
 */
export async function checkForUpdates(options: { checkIgnored?: boolean } = {}): Promise<UpdateInfo | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const latestTag = data.tag_name || '';
    const cleanLatest = latestTag.replace(/^v/i, '');

    const hasUpdate = isNewerVersion(cleanLatest, CURRENT_VERSION);

    if (options.checkIgnored && isVersionIgnored(cleanLatest)) {
      return null;
    }

    // Locate release assets for platforms
    const assets: ReleaseAsset[] = data.assets || [];
    let windowsExeUrl: string | undefined;
    let windowsZipUrl: string | undefined;
    let androidApkUrl: string | undefined;
    let ipadIpaUrl: string | undefined;

    for (const a of assets) {
      const name = a.name.toLowerCase();
      if (name.endsWith('.exe')) {
        windowsExeUrl = a.browser_download_url;
      } else if (name.endsWith('.zip') && (name.includes('win') || name.includes('windows'))) {
        windowsZipUrl = a.browser_download_url;
      } else if (name.endsWith('.apk')) {
        if (!androidApkUrl || name.includes('pure') || name.includes('纯净')) {
          androidApkUrl = a.browser_download_url;
        }
      } else if (name.endsWith('.ipa')) {
        ipadIpaUrl = a.browser_download_url;
      }
    }

    return {
      hasUpdate,
      currentVersion: CURRENT_VERSION,
      latestVersion: cleanLatest,
      releaseName: data.name || `知微错题本 v${cleanLatest}`,
      releaseNotes: data.body || '包含多项体验优化与功能更新。',
      publishedAt: data.published_at || '',
      htmlUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases`,
      windowsExeUrl,
      windowsZipUrl,
      androidApkUrl,
      ipadIpaUrl
    };
  } catch (err) {
    console.warn('Update check failed:', err);
    return null;
  }
}
