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

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmationError, setPasswordConfirmationError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  // 驗證名稱
  const validateName = (text: string) => {
    if (!text.trim()) {
      setNameError('請輸入姓名或代號');
      return false;
    }
    setNameError('');
    return true;
  };

  // 驗證 Email
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

  // 驗證密碼確認
  const validatePasswordConfirmation = (text: string, originalPass: string) => {
    if (!text) {
      setPasswordConfirmationError('請再次輸入密碼');
      return false;
    } else if (text !== originalPass) {
      setPasswordConfirmationError('兩次輸入的密碼不一致');
      return false;
    }
    setPasswordConfirmationError('');
    return true;
  };

  // 執行註冊
  const handleRegister = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validatePasswordConfirmation(passwordConfirmation, password);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      const result = await register(
        name.trim(),
        email.trim(),
        password,
        passwordConfirmation
      );
      if (result.success) {
        // 註冊成功，導向主頁
        router.replace('/(tabs)');
      } else {
        setGeneralError(result.message || '註冊失敗，請填寫正確欄位。');
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
            <Text style={styles.cyberTag}>[ DEFENDER REGISTRATION ]</Text>
            <Text style={styles.title}>SIGN UP</Text>
            <Text style={styles.subtitle}>建立防禦者控制台帳號</Text>
          </View>

          <View style={styles.formContainer}>
            {generalError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{generalError}</Text>
              </View>
            ) : null}

            {/* 名稱欄位 */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>OPERATOR NAME (代號/姓名)</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputErrorBorder : null]}
                placeholder="請輸入代號或姓名"
                placeholderTextColor="#475569"
                autoCorrect={false}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) validateName(text);
                }}
                onBlur={() => validateName(name)}
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            {/* Email 欄位 */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>COMMUNICATION PORT (EMAIL)</Text>
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
              <Text style={styles.inputLabel}>ENCRYPTED PASSWORD (密碼)</Text>
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

            {/* 密碼確認欄位 */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD (確認密碼)</Text>
              <TextInput
                style={[styles.input, passwordConfirmationError ? styles.inputErrorBorder : null]}
                placeholder="請再次輸入密碼"
                placeholderTextColor="#475569"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={passwordConfirmation}
                onChangeText={(text) => {
                  setPasswordConfirmation(text);
                  if (passwordConfirmationError) validatePasswordConfirmation(text, password);
                }}
                onBlur={() => validatePasswordConfirmation(passwordConfirmation, password)}
              />
              {passwordConfirmationError ? (
                <Text style={styles.errorText}>{passwordConfirmationError}</Text>
              ) : null}
            </View>

            {/* 註冊按鈕 */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.registerButtonText}>ESTABLISH CONSOLE LINK</Text>
              )}
            </TouchableOpacity>

            {/* 跳轉到登入 */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>已有防禦權限？ </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>安全登入 [LOGIN]</Text>
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
    marginBottom: 30,
  },
  cyberTag: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#ff0055', // 霓虹粉
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
    textShadowColor: 'rgba(255, 0, 85, 0.4)',
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
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#ff0055',
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
  registerButton: {
    backgroundColor: '#ff0055',
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#ff0055',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  registerButtonText: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
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
  loginLink: {
    fontFamily: 'SpaceMono',
    color: '#00f0ff', // 螢光藍
    fontSize: 14,
    fontWeight: 'bold',
  },
});
