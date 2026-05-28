import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * 跨平台獲取 Token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('user_token');
      }
      return null;
    }
    return await SecureStore.getItemAsync('user_token');
  } catch (e) {
    console.error('獲取 Token 失敗', e);
    return null;
  }
};

/**
 * 跨平台儲存 Token
 */
export const setToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_token', token);
      }
      return;
    }
    await SecureStore.setItemAsync('user_token', token);
  } catch (e) {
    console.error('儲存 Token 失敗', e);
  }
};

/**
 * 跨平台移除 Token
 */
export const removeToken = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_token');
      }
      return;
    }
    await SecureStore.deleteItemAsync('user_token');
  } catch (e) {
    console.error('移除 Token 失敗', e);
  }
};

/**
 * 跨平台獲取 User Info
 */
export const getUserInfo = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('user_info');
      }
      return null;
    }
    return await SecureStore.getItemAsync('user_info');
  } catch (e) {
    console.error('獲取 User Info 失敗', e);
    return null;
  }
};

/**
 * 跨平台儲存 User Info
 */
export const setUserInfo = async (userInfo: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_info', userInfo);
      }
      return;
    }
    await SecureStore.setItemAsync('user_info', userInfo);
  } catch (e) {
    console.error('儲存 User Info 失敗', e);
  }
};

/**
 * 跨平台移除 User Info
 */
export const removeUserInfo = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_info');
      }
      return;
    }
    await SecureStore.deleteItemAsync('user_info');
  } catch (e) {
    console.error('移除 User Info 失敗', e);
  }
};
