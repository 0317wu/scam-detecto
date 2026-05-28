# AI 詐騙辨識系統 App 實作計劃

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推薦）或 superpowers:executing-plans 逐任務實現此計劃。步驟使用複選框（`- [ ]`）語法來跟蹤進度。

**目標：** 在根目錄平行建立 `scam-detector-app` 專案，使用 Expo (React Native) 實作包含詐騙檢測、歷史紀錄與身分驗證的行動 App，並與後端 Laravel API 進行串接。

**架構：** App 作為獨立客戶端，使用 Axios 與後端 API 溝通。使用 `expo-secure-store` 進行 Token 的安全儲存與讀取，透過 `expo-router` 管理頁面路由，並使用 React Context 進行全域登入狀態管理。圖片檢測則透過 `expo-image-picker` 取得照片並上傳至後端進行 OCR 與 AI 判定。

**技術棧：** React Native, Expo, Expo Router, Expo SecureStore, Expo ImagePicker, Axios, TypeScript, Jest

---

## 檔案結構與職責

我們將在新建立的 `scam-detector-app` 目錄中規劃以下核心檔案：

* **[NEW]** `scam-detector-app/services/api.ts`：Axios API 客戶端，設定 `baseURL` 並以攔截器自動處理 Token 及訪客 ID 的 Header。
* **[NEW]** `scam-detector-app/context/AuthContext.tsx`：身分驗證 Context，管理使用者登入狀態、Token 儲存與註冊/登入/登出方法。
* **[NEW]** `scam-detector-app/app/_layout.tsx`：App 最外層 Layout，配置 AuthProvider 與 Expo Router 主題。
* **[NEW]** `scam-detector-app/app/(tabs)/index.tsx`：檢測儀表板頁面，整合文字、網址與圖片分析輸入。
* **[NEW]** `scam-detector-app/app/(tabs)/history.tsx`：歷程紀錄頁面。
* **[NEW]** `scam-detector-app/app/(tabs)/knowledge.tsx`：防詐案例知識庫頁面。
* **[NEW]** `scam-detector-app/app/(auth)/login.tsx` & `register.tsx`：登入與註冊頁面。
* **[NEW]** `scam-detector-app/components/ResultCard.tsx`：科幻風檢測結果呈現卡片。
* **[NEW]** `scam-detector-app/components/ScanningLoader.tsx`：科幻掃描載入動畫。

---

## 實作任務

### 任務 1：初始化 Expo 專案與依賴配置

**檔案：**
- 新增：`scam-detector-app/` 及其目錄結構
- 新增：`scam-detector-app/.env`

- [ ] **步驟 1：初始化專案**

在 `D:\User\Desktop\scam_detecto` 目錄下執行以下指令初始化專案（使用 tabs 範本）：
```powershell
npx -y create-expo-app@latest scam-detector-app --template tabs --yes
```

- [ ] **步驟 2：安裝必要依賴套件**

切換至 `scam-detector-app` 目錄並安裝 Axios、SecureStore、ImagePicker 與環境變數支援套件：
```powershell
cd scam-detector-app
npm install axios expo-secure-store expo-image-picker react-native-dotenv
```

- [ ] **步驟 3：建立與設定環境變數**

在 `scam-detector-app` 下建立 `.env` 檔案，配置後端 API URL（例如本機開發的 URL，在 Android 模擬器中通常為 `http://10.0.2.2:8000/api`，iOS 模擬器為 `http://127.0.0.1:8000/api`）：
```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

- [ ] **步驟 4：執行並驗證專案啟動**

啟動 Expo 開發伺服器以驗證環境是否正常：
```powershell
npx expo start --clear
```
預期結果：開發伺服器成功啟動並顯示 QR Code。

- [ ] **步驟 5：Commit**

```powershell
git add scam-detector-app/
git commit -m "feat: 初始化 scam-detector-app Expo 專案與配置依賴"
```

---

### 任務 2：API 封裝與身分驗證狀態管理

**檔案：**
- 新增：`scam-detector-app/services/api.ts`
- 新增：`scam-detector-app/context/AuthContext.tsx`
- 新增：`scam-detector-app/__tests__/api.test.ts`

- [ ] **步驟 1：實作失敗的測試**

在 `scam-detector-app` 中建立測試 `__tests__/api.test.ts` 驗證 API 客戶端的請求攔截與 Token 附加行為：
```typescript
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
}));

describe('API Client Token Test', () => {
  it('should not throw when initialized', () => {
    expect(api).toBeDefined();
  });
});
```

- [ ] **步驟 2：執行測試驗證失敗**

在 `scam-detector-app` 下執行：
```powershell
npm test
```
預期結果：測試失敗（因為找不到 `services/api` 檔案）。

- [ ] **步驟 3：實現 API 客戶端與 AuthContext**

建立 `scam-detector-app/services/api.ts`：
```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
```

建立 `scam-detector-app/context/AuthContext.tsx`：
```typescript
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface AuthContextType {
  token: string | null;
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('user_token');
        if (storedToken) {
          setToken(storedToken);
          const response = await api.get('/user');
          if (response.data?.success) {
            setUser(response.data.data);
          }
        }
      } catch (e) {
        console.log('載入 token 失敗', e);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/login', { email, password });
      if (response.data?.success) {
        const userToken = response.data.data.token;
        await SecureStore.setItemAsync('user_token', userToken);
        setToken(userToken);
        setUser(response.data.data.user);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/register', { name, email, password, password_confirmation: password });
      if (response.data?.success) {
        const userToken = response.data.data.token;
        await SecureStore.setItemAsync('user_token', userToken);
        setToken(userToken);
        setUser(response.data.data.user);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      console.log('登出 API 呼叫失敗', e);
    } finally {
      await SecureStore.deleteItemAsync('user_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth 必須在 AuthProvider 下使用');
  return context;
};
```

- [ ] **步驟 4：執行測試驗證通過**

在 `scam-detector-app` 目錄下執行：
```powershell
npm test
```
預期結果：測試成功通過。

- [ ] **步驟 5：Commit**

```powershell
git add scam-detector-app/services/ scam-detector-app/context/
git commit -m "feat: 實作 API Client 與 AuthContext 狀態管理"
```

---

### 任務 3：實作登入與註冊頁面 (Auth UI)

**檔案：**
- 新增：`scam-detector-app/app/(auth)/login.tsx`
- 新增：`scam-detector-app/app/(auth)/register.tsx`
- 修改：`scam-detector-app/app/_layout.tsx`

- [ ] **步驟 1：在 Layout 中整合 AuthProvider**

修改 `scam-detector-app/app/_layout.tsx`，以 `AuthProvider` 包裹整個路由導向，並控制登入狀態的跳轉：
```typescript
import { Stack, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

function NavigationGuard() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/(auth)/login');
    }
  }, [token, loading]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false, title: '登入' }} />
      <Stack.Screen name="(auth)/register" options={{ headerShown: false, title: '註冊' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationGuard />
    </AuthProvider>
  );
}
```

- [ ] **步驟 2：實現登入畫面**

建立 `scam-detector-app/app/(auth)/login.tsx`，設計 Cyberpunk 科幻風格的登入表單（深藍/螢光綠色調）：
```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('請輸入信箱與密碼');
      return;
    }
    setError('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      router.replace('/(tabs)');
    } else {
      setError('登入失敗，請檢查帳號密碼');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>防禦系統登入</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="電子郵件"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="安全密碼"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>認證並登入</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.linkText}>無權限？註冊新核心帳戶</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, color: '#00ffcc', textAlign: 'center', marginBottom: 30, fontWeight: 'bold' },
  input: { backgroundColor: '#161b22', color: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#30363d' },
  button: { backgroundColor: '#00ffcc', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  errorText: { color: '#ff3366', marginBottom: 15, textAlign: 'center' },
  linkText: { color: '#8b949e', textAlign: 'center', marginTop: 20 },
});
```

- [ ] **步驟 3：實現註冊畫面**

建立 `scam-detector-app/app/(auth)/register.tsx`，結構與登入類似，呼叫 `register` 方法。

- [ ] **步驟 4：利用實機或模擬器進行人工測試**

啟動 App，點擊註冊新帳號，並驗證是否成功轉跳至首頁。

- [ ] **步驟 5：Commit**

```powershell
git add scam-detector-app/app/(auth)/ scam-detector-app/app/_layout.tsx
git commit -m "feat: 實作登入與註冊頁面並整合導頁守衛"
```

---

### 任務 4：實作首頁檢測 Dashboard

**檔案：**
- 新增：`scam-detector-app/components/ResultCard.tsx`
- 新增：`scam-detector-app/components/ScanningLoader.tsx`
- 修改：`scam-detector-app/app/(tabs)/index.tsx`

- [ ] **步驟 1：實作科幻結果卡片 (ResultCard)**

建立 `scam-detector-app/components/ResultCard.tsx`，依據 API 回傳的 `risk_level` (Safe, Warning, Danger) 渲染不同顏色的科幻面板：
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ResultCardProps {
  result: {
    risk_level: string;
    risk_score: number;
    scam_type: string;
    summary: string;
    suggestions: string[];
    risk_factors: string[];
  };
}

export default function ResultCard({ result }: ResultCardProps) {
  const getTheme = () => {
    switch (result.risk_level?.toLowerCase()) {
      case 'safe': return { color: '#00ff66', bg: 'rgba(0, 255, 102, 0.1)', border: '#00ff66' };
      case 'warning': return { color: '#ffcc00', bg: 'rgba(255, 204, 0, 0.1)', border: '#ffcc00' };
      default: return { color: '#ff3366', bg: 'rgba(255, 51, 102, 0.1)', border: '#ff3366' };
    }
  };

  const theme = getTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <Text style={[styles.status, { color: theme.color }]}>風險等級：{result.risk_level} ({result.risk_score}分)</Text>
      <Text style={styles.title}>檢測類型：{result.scam_type || '無'}</Text>
      <Text style={styles.summary}>{result.summary}</Text>
      
      {result.risk_factors?.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.color }]}>[ 風險特徵 ]</Text>
          {result.risk_factors.map((item, idx) => <Text key={idx} style={styles.text}>• {item}</Text>)}
        </View>
      )}
      
      {result.suggestions?.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.color }]}>[ 防範指引 ]</Text>
          {result.suggestions.map((item, idx) => <Text key={idx} style={styles.text}>• {item}</Text>)}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 8, borderWidth: 1, marginTop: 20 },
  status: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  title: { color: '#fff', fontSize: 16, marginBottom: 8 },
  summary: { color: '#8b949e', fontSize: 14, marginBottom: 12 },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  text: { color: '#c9d1d9', fontSize: 13 },
});
```

- [ ] **步驟 2：實作載入動畫 (ScanningLoader)**

建立 `scam-detector-app/components/ScanningLoader.tsx`，以簡單的旋轉或動畫呈現雷達檢測感。

- [ ] **步驟 3：實作主控台檢測邏輯 (Dashboard)**

修改 `scam-detector-app/app/(tabs)/index.tsx`：
* 提供 Tab 切換：文字分析、網址分析、圖片上傳。
* 整合 `expo-image-picker` 進行圖片選取與相機拍照。
* 呼叫後端對應端點，並傳入訪客/會員 Header，成功後渲染 `ResultCard`。

- [ ] **步驟 4：在實機或模擬器進行各功能檢測**

測試文字輸入偵測、貼上網址偵測，以及打開相簿選取圖片上傳進行 OCR 辨識，確認後端均能傳回正確結果。

- [ ] **步驟 5：Commit**

```powershell
git add scam-detector-app/components/ scam-detector-app/app/(tabs)/index.tsx
git commit -m "feat: 實作 Dashboard 首頁三模組檢測及結果渲染"
```

---

### 任務 5：實作歷史紀錄與知識庫頁面

**檔案：**
- 修改：`scam-detector-app/app/(tabs)/history.tsx`
- 修改：`scam-detector-app/app/(tabs)/knowledge.tsx`

- [ ] **步驟 1：實作歷史紀錄載入**

修改 `scam-detector-app/app/(tabs)/history.tsx`，在進入頁面時發送 `GET /api/scam/history`，並以 ScrollView 或 FlatList 條列所有掃描紀錄。提供訪客 ID 備用查詢機制。

- [ ] **步驟 2：實作防詐案例知識庫**

修改 `scam-detector-app/app/(tabs)/knowledge.tsx`，發送 `GET /api/scam/cases`，獲取管理員收錄的最新案例庫，並以美觀卡片呈現給使用者。

- [ ] **步驟 3：在實機上驗證歷史與案例載入**

操作 App 進行幾次掃描，切換到「歷史紀錄」分頁，驗證是否能看到剛才的掃描列表。

- [ ] **步驟 4：Commit**

```powershell
git add scam-detector-app/app/(tabs)/history.tsx scam-detector-app/app/(tabs)/knowledge.tsx
git commit -m "feat: 實作歷史紀錄與防詐知識庫分頁"
```
