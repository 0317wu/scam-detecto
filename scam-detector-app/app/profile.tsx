import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout, updateProfile, isLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 若為訪客模式
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>指揮官設定</Text>
        </View>
        <View style={styles.guestContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#00ff66" />
          <Text style={styles.guestTitle}>未登入系統</Text>
          <Text style={styles.guestDesc}>您目前以訪客身分運行防禦主控台，請登入以解鎖指揮官設定與專屬防禦紀錄。</Text>
          
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>立即登入 / 註冊</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleUpdate = async () => {
    if (password && password !== passwordConfirmation) {
      if (Platform.OS === 'web') {
        window.alert('錯誤: 兩次輸入的密碼不一致');
      } else {
        Alert.alert('錯誤', '兩次輸入的密碼不一致');
      }
      return;
    }

    try {
      setIsUpdating(true);
      const data: any = { name, email };
      if (password) {
        data.password = password;
        data.password_confirmation = passwordConfirmation;
      }
      
      await updateProfile(data);
      if (Platform.OS === 'web') {
        window.alert('系統提示: 指揮官設定已更新');
      } else {
        Alert.alert('系統提示', '指揮官設定已更新');
      }
      setPassword('');
      setPasswordConfirmation('');
    } catch (error: any) {
      const msg = error.response?.data?.message || '更新失敗，請稍後再試';
      if (Platform.OS === 'web') {
        window.alert('更新失敗: ' + msg);
      } else {
        Alert.alert('更新失敗', msg);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('確定要登出防禦主控台嗎？')) {
        logout().then(() => router.replace('/(auth)/login'));
      }
    } else {
      Alert.alert('登出確認', '確定要登出防禦主控台嗎？', [
        { text: '取消', style: 'cancel' },
        { 
          text: '確定登出', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          } 
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>指揮官設定</Text>
            <Text style={styles.subtitle}>系統存取級別：最高權限</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user.name}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>更新指揮官代號 (名稱)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#00ff66" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="輸入新名稱"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>更新通訊端點 (Email)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#00ff66" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="輸入新 Email"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>重設存取金鑰 (密碼) - 若不修改請留空</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#00ff66" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="輸入新密碼"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
            </View>

            {password.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>確認存取金鑰 (確認密碼)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#00ff66" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    secureTextEntry
                    placeholder="再次輸入新密碼"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]} 
              onPress={handleUpdate}
              disabled={isUpdating || isLoading}
            >
              {isUpdating ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.updateButtonText}>套用系統設定</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>危險區域</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#ff3366" />
              <Text style={styles.logoutButtonText}>登出防禦系統</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 102, 0.3)',
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff66',
    textShadowColor: 'rgba(0, 255, 102, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#5a6578',
    marginTop: 8,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  guestDesc: {
    fontSize: 16,
    color: '#8892b0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#00ff66',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    shadowColor: '#00ff66',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: {
    color: '#0a0b10',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.2)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 255, 102, 0.1)',
    borderWidth: 2,
    borderColor: '#00ff66',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff66',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileEmail: {
    fontSize: 14,
    color: '#8892b0',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#8892b0',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.3)',
    borderRadius: 8,
    height: 50,
  },
  inputIcon: {
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  updateButton: {
    backgroundColor: '#00ff66',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#00ff66',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#0a0b10',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerZone: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 51, 102, 0.3)',
  },
  dangerTitle: {
    color: '#ff3366',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: '#ff3366',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ff3366',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
