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

// Low-saturation, soft, muted Morandi & scholar bookish palette ("素雅护眼、不刺眼、纸质书卷感")
export const THEME_SHADES: Record<ThemeColorKey, Record<string, string>> = {
  blue: {
    '50': '#f2f6f9',
    '100': '#e3ecf2',
    '200': '#cad9e4',
    '300': '#a2bed3',
    '400': '#719dbf',
    '500': '#527e9f',
    '600': '#416788',
    '700': '#34526d',
    '800': '#2c4358',
    '900': '#273849',
    '950': '#192430',
  },
  violet: {
    '50': '#f7f6f9',
    '100': '#eeeaf1',
    '200': '#ded6e3',
    '300': '#c4b6cd',
    '400': '#a390b0',
    '500': '#837093',
    '600': '#6b5b7b',
    '700': '#564863',
    '800': '#463c50',
    '900': '#3c3444',
    '950': '#251f2b',
  },
  emerald: {
    '50': '#f3f7f4',
    '100': '#e4eee6',
    '200': '#cbdccf',
    '300': '#a4c2ab',
    '400': '#76a181',
    '500': '#588365',
    '600': '#4d725a',
    '700': '#3d5c47',
    '800': '#344b3c',
    '900': '#2c3e32',
    '950': '#16221b',
  },
  amber: {
    '50': '#fbf8f5',
    '100': '#f5ede4',
    '200': '#ebdccb',
    '300': '#d9c0a6',
    '400': '#c09d7c',
    '500': '#ab8360',
    '600': '#966844',
    '700': '#7a5236',
    '800': '#65442f',
    '900': '#553a2a',
    '950': '#312015',
  },
  rose: {
    '50': '#fcf6f7',
    '100': '#f7ebed',
    '200': '#eed8db',
    '300': '#dfb8bf',
    '400': '#c9919c',
    '500': '#b17582',
    '600': '#9b626e',
    '700': '#7f4e58',
    '800': '#6a434b',
    '900': '#5b3c42',
    '950': '#362024',
  },
  slate: {
    '50': '#f6f7f9',
    '100': '#eceef2',
    '200': '#d9dde4',
    '300': '#bcc3ce',
    '400': '#8f9aa9',
    '500': '#6b7888',
    '600': '#4a5568',
    '700': '#3b4353',
    '800': '#323945',
    '900': '#2c313a',
    '950': '#1b1e24',
  }
};

export const THEME_PALETTES: Record<ThemeColorKey, ThemeConfig> = {
  blue: {
    key: 'blue',
    name: '素雅知微蓝',
    primary: '#416788',
    primaryDark: '#34526d',
    bgSoft: 'bg-slate-100/80 dark:bg-slate-800/60',
    textAccent: 'text-[#416788] dark:text-[#719dbf]',
    gradient: 'from-[#416788] to-[#34526d]'
  },
  violet: {
    key: 'violet',
    name: '晚烟黛灰紫',
    primary: '#6b5b7b',
    primaryDark: '#564863',
    bgSoft: 'bg-purple-50/60 dark:bg-purple-950/30',
    textAccent: 'text-[#6b5b7b] dark:text-[#a390b0]',
    gradient: 'from-[#6b5b7b] to-[#564863]'
  },
  emerald: {
    key: 'emerald',
    name: '莫兰迪竹青',
    primary: '#4d725a',
    primaryDark: '#3d5c47',
    bgSoft: 'bg-emerald-50/60 dark:bg-emerald-950/30',
    textAccent: 'text-[#4d725a] dark:text-[#76a181]',
    gradient: 'from-[#4d725a] to-[#3d5c47]'
  },
  amber: {
    key: 'amber',
    name: '纸书暖茶棕',
    primary: '#966844',
    primaryDark: '#7a5236',
    bgSoft: 'bg-amber-50/60 dark:bg-amber-950/30',
    textAccent: 'text-[#966844] dark:text-[#c09d7c]',
    gradient: 'from-[#966844] to-[#7a5236]'
  },
  rose: {
    key: 'rose',
    name: '温润豆沙粉',
    primary: '#9b626e',
    primaryDark: '#7f4e58',
    bgSoft: 'bg-rose-50/60 dark:bg-rose-950/30',
    textAccent: 'text-[#9b626e] dark:text-[#c9919c]',
    gradient: 'from-[#9b626e] to-[#7f4e58]'
  },
  slate: {
    key: 'slate',
    name: '素朴水墨灰',
    primary: '#4a5568',
    primaryDark: '#3b4353',
    bgSoft: 'bg-slate-100/70 dark:bg-slate-800/50',
    textAccent: 'text-[#4a5568] dark:text-[#8f9aa9]',
    gradient: 'from-[#4a5568] to-[#323945]'
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
