import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

// 定義 User 資料結構
export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

// 定義 AuthContext 的 Props 介面
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 初始化時載入 Token 與使用者資訊
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('user_token');
        const storedUserInfo = await SecureStore.getItemAsync('user_info');

        if (storedToken && storedUserInfo) {
          setToken(storedToken);
          setUser(JSON.parse(storedUserInfo));
          
          // 選用：若有 Token，嘗試跟後端同步最新 User 資訊以確認 Token 仍有效
          try {
            const response = await api.get('/user');
            if (response.data && response.data.success) {
              const freshUser = response.data.data;
              setUser(freshUser);
              await SecureStore.setItemAsync('user_info', JSON.stringify(freshUser));
            }
          } catch (error) {
            // 如果驗證失敗（例如 Token 過期），自動清除本地狀態並登出
            console.warn('Token 驗證失敗，自動登出', error);
            await SecureStore.deleteItemAsync('user_token');
            await SecureStore.deleteItemAsync('user_info');
            setToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.error('無法恢復身份驗證狀態', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // 登入
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/login', { email, password });
      
      if (response.data && response.data.success) {
        const { token: userToken, user: userInfo } = response.data.data;
        
        await SecureStore.setItemAsync('user_token', userToken);
        await SecureStore.setItemAsync('user_info', JSON.stringify(userInfo));
        
        setToken(userToken);
        setUser(userInfo);
        return { success: true };
      } else {
        return { success: false, message: response.data?.message || '登入失敗，請稍後再試。' };
      }
    } catch (error: any) {
      console.error('登入錯誤', error);
      let message = '登入失敗，請檢查您的網路連接。';
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      }
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // 註冊
  const register = async (name: string, email: string, password: string, passwordConfirmation: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (response.data && response.data.success) {
        const { token: userToken, user: userInfo } = response.data.data;

        await SecureStore.setItemAsync('user_token', userToken);
        await SecureStore.setItemAsync('user_info', JSON.stringify(userInfo));

        setToken(userToken);
        setUser(userInfo);
        return { success: true };
      } else {
        return { success: false, message: response.data?.message || '註冊失敗，請稍後再試。' };
      }
    } catch (error: any) {
      console.error('註冊錯誤', error);
      let message = '註冊失敗，請檢查輸入的欄位或網路連接。';
      if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
      }
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const logout = async () => {
    try {
      setIsLoading(true);
      // 發送登出請求給後端 API
      await api.post('/logout');
    } catch (error) {
      console.error('後端登出失敗或 Token 已失效', error);
    } finally {
      // 無論後端是否成功登出，都必須清除本地 Token 與資訊
      await SecureStore.deleteItemAsync('user_token');
      await SecureStore.deleteItemAsync('user_info');
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必須在 AuthProvider 內部使用');
  }
  return context;
};
