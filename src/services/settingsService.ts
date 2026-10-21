// User Settings & Profile Persistence Service
export interface UserProfile {
  name: string;
  avatar: string; // base64 or preset key
  motto: string;
  joinDate: string;
}

export type ThemeColorKey = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate' | 'pink';

export interface ThemeConfig {
  key: ThemeColorKey;
  name: string;
  primary: string;       // HEX
  primaryDark: string;   // HEX
  bgSoft: string;        // Tailwind class or color
  textAccent: string;
  solidBg: string;       // Pure solid background
  gradient: string;      // Compatibility (pure solid)
}

// Pure vibrant yet comfortable scholar palette (鲜明典雅、不刺眼、无渐变纯色)
export const THEME_SHADES: Record<ThemeColorKey, Record<string, string>> = {
  blue: {
    '50': '#eff6ff',
    '100': '#dbeafe',
    '200': '#bfdbfe',
    '300': '#93c5fd',
    '400': '#60a5fa',
    '500': '#3b82f6',
    '600': '#1e56a0', // 纯正静谧知微蓝，鲜明而不刺目
    '700': '#16427d',
    '800': '#123463',
    '900': '#0d2446',
    '950': '#08172c',
  },
  violet: {
    '50': '#faf5ff',
    '100': '#f3e8ff',
    '200': '#e9d5ff',
    '300': '#d8b4fe',
    '400': '#c084fc',
    '500': '#a855f7',
    '600': '#6d28d9', // 高雅纯净紫罗兰
    '700': '#5b21b6',
    '800': '#4c1d95',
    '900': '#3b1474',
    '950': '#230b46',
  },
  emerald: {
    '50': '#ecfdf5',
    '100': '#d1fae5',
    '200': '#a7f3d0',
    '300': '#6ee7b7',
    '400': '#34d399',
    '500': '#10b981',
    '600': '#047857', // 生机翡翠绿，清爽护眼
    '700': '#065f46',
    '800': '#064e3b',
    '900': '#043b2c',
    '950': '#02241b',
  },
  amber: {
    '50': '#fffbeb',
    '100': '#fef3c7',
    '200': '#fde68a',
    '300': '#fcd34d',
    '400': '#fbbf24',
    '500': '#f59e0b',
    '600': '#b45309', // 温暖琥珀橙金，明快沉实
    '700': '#92400e',
    '800': '#78350f',
    '900': '#58270b',
    '950': '#381807',
  },
  rose: {
    '50': '#fff1f2',
    '100': '#ffe4e6',
    '200': '#fecdd3',
    '300': '#fda4af',
    '400': '#fb7185',
    '500': '#f43f5e',
    '600': '#be123c', // 柔润蔷薇红，典雅大方
    '700': '#9f1239',
    '800': '#881337',
    '900': '#640d28',
    '950': '#3e0618',
  },
  slate: {
    '50': '#f8fafc',
    '100': '#f1f5f9',
    '200': '#e2e8f0',
    '300': '#cbd5e1',
    '400': '#94a3b8',
    '500': '#64748b',
    '600': '#334155', // 洗炼水墨玄青灰
    '700': '#1e293b',
    '800': '#0f172a',
    '900': '#090d16',
    '950': '#04070c',
  },
  pink: {
    '50': '#fdf2f8',
    '100': '#fce7f3',
    '200': '#fbcfe8',
    '300': '#f9a8d4',
    '400': '#f472b6',
    '500': '#ec4899',
    '600': '#db2777', // 纯正樱花粉，鲜艳典雅不刺眼
    '700': '#be185d',
    '800': '#9d174d',
    '900': '#831843',
    '950': '#500724',
  }
};

export const THEME_PALETTES: Record<ThemeColorKey, ThemeConfig> = {
  blue: {
    key: 'blue',
    name: '经典知微蓝',
    primary: '#1e56a0',
    primaryDark: '#16427d',
    bgSoft: 'bg-blue-50/80 dark:bg-blue-950/40',
    textAccent: 'text-[#1e56a0] dark:text-[#60a5fa]',
    solidBg: 'bg-[#1e56a0]',
    gradient: 'from-[#1e56a0] to-[#1e56a0]'
  },
  violet: {
    key: 'violet',
    name: '高雅紫罗兰',
    primary: '#6d28d9',
    primaryDark: '#5b21b6',
    bgSoft: 'bg-purple-50/80 dark:bg-purple-950/40',
    textAccent: 'text-[#6d28d9] dark:text-[#a78bfa]',
    solidBg: 'bg-[#6d28d9]',
    gradient: 'from-[#6d28d9] to-[#6d28d9]'
  },
  emerald: {
    key: 'emerald',
    name: '清雅翡翠绿',
    primary: '#047857',
    primaryDark: '#065f46',
    bgSoft: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    textAccent: 'text-[#047857] dark:text-[#34d399]',
    solidBg: 'bg-[#047857]',
    gradient: 'from-[#047857] to-[#047857]'
  },
  amber: {
    key: 'amber',
    name: '温暖琥珀橙',
    primary: '#b45309',
    primaryDark: '#92400e',
    bgSoft: 'bg-amber-50/80 dark:bg-amber-950/40',
    textAccent: 'text-[#b45309] dark:text-[#fbbf24]',
    solidBg: 'bg-[#b45309]',
    gradient: 'from-[#b45309] to-[#b45309]'
  },
  rose: {
    key: 'rose',
    name: '柔润蔷薇红',
    primary: '#be123c',
    primaryDark: '#9f1239',
    bgSoft: 'bg-rose-50/80 dark:bg-rose-950/40',
    textAccent: 'text-[#be123c] dark:text-[#fb7185]',
    solidBg: 'bg-[#be123c]',
    gradient: 'from-[#be123c] to-[#be123c]'
  },
  slate: {
    key: 'slate',
    name: '洗炼水墨灰',
    primary: '#334155',
    primaryDark: '#1e293b',
    bgSoft: 'bg-slate-100/80 dark:bg-slate-800/60',
    textAccent: 'text-[#334155] dark:text-[#94a3b8]',
    solidBg: 'bg-[#334155]',
    gradient: 'from-[#334155] to-[#334155]'
  },
  pink: {
    key: 'pink',
    name: '浪漫樱花粉',
    primary: '#db2777',
    primaryDark: '#be185d',
    bgSoft: 'bg-pink-50/80 dark:bg-pink-950/40',
    textAccent: 'text-[#db2777] dark:text-[#f472b6]',
    solidBg: 'bg-[#db2777]',
    gradient: 'from-[#db2777] to-[#db2777]'
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
    const shades = THEME_SHADES[key] || THEME_SHADES.blue;
    const root = document.documentElement;

    root.setAttribute('data-theme', key);
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--primary-color-dark', theme.primaryDark);

    // Override Tailwind's blue palette variables so the whole app adapts globally
    Object.entries(shades).forEach(([shade, hex]) => {
      root.style.setProperty(`--color-blue-${shade}`, hex);
    });
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
