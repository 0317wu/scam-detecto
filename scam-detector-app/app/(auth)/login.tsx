import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  // 驗證 Email 格式
  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError('請輸入電子信箱');
      return false;
    } else if (!emailRegex.test(text)) {
      setEmailError('請輸入有效的電子信箱格式');
      return false;
    }
    setEmailError('');
    return true;
  };

  // 驗證密碼
  const validatePassword = (text: string) => {
    if (!text) {
      setPasswordError('請輸入密碼');
      return false;
    } else if (text.length < 6) {
      setPasswordError('密碼長度至少需要 6 個字元');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // 執行登入
  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        // 登入成功，導向主頁
        router.replace('/(tabs)');
      } else {
        setGeneralError(result.message || '登入失敗，請檢查您的帳號密碼。');
      }
    } catch (error) {
      setGeneralError('系統錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Text style={styles.cyberTag}>[ SECURE PROTOCOL ]</Text>
            <Text style={styles.title}>SCAM DETECTO</Text>
            <Text style={styles.subtitle}>反詐騙威脅情資防禦系統</Text>
          </View>

          <View style={styles.formContainer}>
            {generalError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{generalError}</Text>
              </View>
            ) : null}

            {/* Email 欄位 */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>ACCESS KEY (EMAIL)</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputErrorBorder : null]}
                placeholder="請輸入電子信箱"
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) validateEmail(text);
                }}
                onBlur={() => validateEmail(email)}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* 密碼欄位 */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>SECURITY PASSWORD</Text>
              <TextInput
                style={[styles.input, passwordError ? styles.inputErrorBorder : null]}
                placeholder="請輸入密碼"
                placeholderTextColor="#475569"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) validatePassword(text);
                }}
                onBlur={() => validatePassword(password)}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {/* 登入按鈕 */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.loginButtonText}>INITIALIZE SESSION</Text>
              )}
            </TouchableOpacity>

            {/* 跳轉到註冊 */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>尚未開通權限？ </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>申請帳號 [REGISTER]</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0d', // 極深色背景
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cyberTag: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#00f0ff', // 螢光藍
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 240, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    letterSpacing: 1,
  },
  formContainer: {
    width: '100%',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  errorBoxText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#00f0ff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#111318',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 4,
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputErrorBorder: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 6,
  },
  loginButton: {
    backgroundColor: '#00f0ff',
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  registerLink: {
    fontFamily: 'SpaceMono',
    color: '#ff0055', // 霓虹粉紅
    fontSize: 14,
    fontWeight: 'bold',
  },
});
