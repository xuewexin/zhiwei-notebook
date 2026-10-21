// User Settings & Profile Persistence Service
export interface UserProfile {
  name: string;
  avatar: string; // base64 or preset key
  motto: string;
  joinDate: string;
}

export type ThemeColorKey = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate';

export interface ThemeConfig {
  key: ThemeColorKey;
  name: string;
  primary: string;       // HEX
  primaryDark: string;   // HEX
  bgSoft: string;        // Tailwind class or color
  textAccent: string;
  gradient: string;
}

export const THEME_PALETTES: Record<ThemeColorKey, ThemeConfig> = {
  blue: {
    key: 'blue',
    name: '经典知微蓝',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    bgSoft: 'bg-blue-50 dark:bg-blue-950/40',
    textAccent: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-600 to-indigo-600'
  },
  violet: {
    key: 'violet',
    name: '极客深邃紫',
    primary: '#7c3aed',
    primaryDark: '#6d28d9',
    bgSoft: 'bg-purple-50 dark:bg-purple-950/40',
    textAccent: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-600 to-indigo-600'
  },
  emerald: {
    key: 'emerald',
    name: '翡翠生机绿',
    primary: '#059669',
    primaryDark: '#047857',
    bgSoft: 'bg-emerald-50 dark:bg-emerald-950/40',
    textAccent: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-600 to-teal-600'
  },
  amber: {
    key: 'amber',
    name: '暖阳落日橙',
    primary: '#ea580c',
    primaryDark: '#c2410c',
    bgSoft: 'bg-orange-50 dark:bg-orange-950/40',
    textAccent: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-amber-600'
  },
  rose: {
    key: 'rose',
    name: '优雅蔷薇粉',
    primary: '#e11d48',
    primaryDark: '#be123c',
    bgSoft: 'bg-rose-50 dark:bg-rose-950/40',
    textAccent: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500 to-pink-600'
  },
  slate: {
    key: 'slate',
    name: '沉稳曜石灰',
    primary: '#475569',
    primaryDark: '#334155',
    bgSoft: 'bg-slate-100 dark:bg-slate-800',
    textAccent: 'text-slate-700 dark:text-slate-300',
    gradient: 'from-slate-700 to-slate-900'
  }
};

export interface BackgroundConfig {
  imageUrl: string;
  opacity: number; // 0.05 to 0.5
  blur: number;    // 0 to 10 px
}

export interface StoragePathConfig {
  customDirectory: string;
  autoBackup: boolean;
}

export interface AiConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  autoAnalyzeErrorCauses: boolean;
  autoStudyPlan: boolean;
  autoClassify: boolean;
}

const STORAGE_KEY_PROFILE = 'zhiwei_user_profile';
const STORAGE_KEY_THEME = 'zhiwei_theme_color';
const STORAGE_KEY_BG = 'zhiwei_background_config';
const STORAGE_KEY_AI = 'zhiwei_ai_config';

export const DEFAULT_PROFILE: UserProfile = {
  name: '知微学者',
  avatar: '/app-icon.png',
  motto: '见微知著，省思改错 · 唯有坚持，终成正果',
  joinDate: new Date().toLocaleDateString('zh-CN')
};

export const DEFAULT_BG: BackgroundConfig = {
  imageUrl: '',
  opacity: 0.15,
  blur: 0
};

export const DEFAULT_STORAGE_PATH: StoragePathConfig = {
  customDirectory: typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent || '')
    ? 'D:\\知微错题库'
    : 'Download/知微错题本',
  autoBackup: true
};

export const DEFAULT_AI_CONFIG: AiConfig = {
  enabled: false,
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.7,
  autoAnalyzeErrorCauses: true,
  autoStudyPlan: true,
  autoClassify: false
};

export const settingsService = {
  // 1. User Profile
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROFILE);
      return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: Partial<UserProfile>): UserProfile {
    const curr = this.getProfile();
    const updated = { ...curr, ...profile };
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  // 2. Theme Color
  getThemeColor(): ThemeColorKey {
    try {
      const key = localStorage.getItem(STORAGE_KEY_THEME) as ThemeColorKey;
      return THEME_PALETTES[key] ? key : 'blue';
    } catch {
      return 'blue';
    }
  },

  saveThemeColor(key: ThemeColorKey): void {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, key);
      this.applyThemeToDOM(key);
    } catch {}
  },

  applyThemeToDOM(key: ThemeColorKey): void {
    if (typeof document === 'undefined') return;
    const theme = THEME_PALETTES[key] || THEME_PALETTES.blue;
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--primary-color-dark', theme.primaryDark);
  },

  // 3. Custom Background
  getBackground(): BackgroundConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEY_BG);
      return data ? { ...DEFAULT_BG, ...JSON.parse(data) } : DEFAULT_BG;
    } catch {
      return DEFAULT_BG;
    }
  },

  saveBackground(bg: Partial<BackgroundConfig>): BackgroundConfig {
    const curr = this.getBackground();
    const updated = { ...curr, ...bg };
    try {
      localStorage.setItem(STORAGE_KEY_BG, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  // 3.5 Custom Storage Directory
  getStoragePath(): StoragePathConfig {
    try {
      const data = localStorage.getItem('zhiwei_custom_storage_path');
      return data ? { ...DEFAULT_STORAGE_PATH, ...JSON.parse(data) } : DEFAULT_STORAGE_PATH;
    } catch {
      return DEFAULT_STORAGE_PATH;
    }
  },

  saveStoragePath(cfg: Partial<StoragePathConfig>): StoragePathConfig {
    const curr = this.getStoragePath();
    const updated = { ...curr, ...cfg };
    try {
      localStorage.setItem('zhiwei_custom_storage_path', JSON.stringify(updated));
    } catch {}
    return updated;
  },

  // 4. AI Configuration
  getAiConfig(): AiConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AI);
      return data ? { ...DEFAULT_AI_CONFIG, ...JSON.parse(data) } : DEFAULT_AI_CONFIG;
    } catch {
      return DEFAULT_AI_CONFIG;
    }
  },

  saveAiConfig(ai: Partial<AiConfig>): AiConfig {
    const curr = this.getAiConfig();
    const updated = { ...curr, ...ai };
    try {
      localStorage.setItem(STORAGE_KEY_AI, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  // Test AI connectivity
  async testAiConnection(config: AiConfig): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const startTime = Date.now();
    try {
      if (!config.apiKey.trim()) {
        return { success: false, message: '请先填写 API Key', latencyMs: 0 };
      }

      const cleanBase = config.baseUrl.replace(/\/+$/, '');
      const endpoint = `${cleanBase}/chat/completions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: config.model.trim() || 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a test ping agent. Answer in under 10 words.' },
            { role: 'user', content: 'Ping! Are you connected?' }
          ],
          max_tokens: 20
        })
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return { 
          success: false, 
          message: `连接失败 (HTTP ${response.status}): ${errorText.slice(0, 100)}`, 
          latencyMs: latency 
        };
      }

      const resData = await response.json();
      const reply = resData?.choices?.[0]?.message?.content || 'OK';

      return {
        success: true,
        message: `连通成功！模型响应: "${reply.trim()}" (延迟 ${latency}ms)`,
        latencyMs: latency
      };
    } catch (err: any) {
      return {
        success: false,
        message: `网络请求异常: ${err?.message || '无法访问该地址'}`,
        latencyMs: Date.now() - startTime
      };
    }
  }
};
