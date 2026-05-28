import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import ResultCard from '../../components/ResultCard';
import ScanningLoader from '../../components/ScanningLoader';
import { useAuth } from '../../context/AuthContext';

type TabType = 'text' | 'url' | 'image';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [visitorId, setVisitorId] = useState<string>('');
  
  // 輸入狀態
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // 請求與結果狀態
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    risk_level: string;
    score: number;
    risk_factors: string[];
    suggestions: string[];
  } | null>(null);
  const [error, setError] = useState(false);

  // 載入或生成 visitor_id
  useEffect(() => {
    const initVisitorId = async () => {
      try {
        let storedId = await AsyncStorage.getItem('visitor_id');
        if (!storedId) {
          // 生成隨機 UUID 替代方案
          storedId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
          await AsyncStorage.setItem('visitor_id', storedId);
        }
        setVisitorId(storedId);
      } catch (err) {
        console.error('初始化 visitor_id 失敗', err);
      }
    };
    initVisitorId();
  }, []);

  // 重置主控台
  const handleReset = () => {
    setTextInput('');
    setUrlInput('');
    setImageUri(null);
    setResult(null);
    setError(false);
  };

  // 當切換 Tab 時，重置結果
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    handleReset();
  };

  // 共用 Header 處理
  const getRequestHeaders = () => {
    const headers: Record<string, string> = {};
    if (!user && visitorId) {
      headers['X-Visitor-Id'] = visitorId;
    }
    return headers;
  };

  // 文字分析
  const handleAnalyzeText = async () => {
    if (!textInput.trim()) {
      Alert.alert('系統提示', '請輸入要分析的文字內容。');
      return;
    }

    setLoading(true);
    setError(false);
    setResult(null);

    try {
      const headers = getRequestHeaders();
      const response = await api.post(
        '/scam/analyze-text',
        {
          content: textInput,
          visitor_id: !user ? visitorId : undefined,
        },
        { headers }
      );

      if (response.data && response.data.success) {
        const data = response.data.data;
        setResult({
          risk_level: data.risk_level,
          score: data.risk_score,
          risk_factors: data.risk_factors,
          suggestions: data.suggestions,
        });
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('文字分析失敗', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 網址分析
  const handleAnalyzeUrl = async () => {
    if (!urlInput.trim()) {
      Alert.alert('系統提示', '請貼上要檢測的網址連結。');
      return;
    }

    let formattedUrl = urlInput.trim();
    // 若無 http/https 前綴，自動提示或補上，後端 validate 要求為 url
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setLoading(true);
    setError(false);
    setResult(null);

    try {
      const headers = getRequestHeaders();
      const response = await api.post(
        '/scam/analyze-url',
        {
          url: formattedUrl,
          visitor_id: !user ? visitorId : undefined,
        },
        { headers }
      );

      if (response.data && response.data.success) {
        const data = response.data.data;
        setResult({
          risk_level: data.risk_level,
          score: data.risk_score,
          risk_factors: data.risk_factors,
          suggestions: data.suggestions,
        });
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('網址分析失敗', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 請求相片庫權限
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('權限不足', '防禦系統需要相簿存取權限來讀取詐騙截圖。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setResult(null);
      setError(false);
    }
  };

  // 請求相機權限
  const handleTakeImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('權限不足', '防禦系統需要相機拍攝權限來捕捉實體影像。');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setResult(null);
      setError(false);
    }
  };

  // 影像上傳分析
  const handleAnalyzeImage = async () => {
    if (!imageUri) {
      Alert.alert('系統提示', '請先拍照或從相簿選擇一張圖片。');
      return;
    }

    setLoading(true);
    setError(false);
    setResult(null);

    try {
      const headers = {
        ...getRequestHeaders(),
        'Content-Type': 'multipart/form-data',
      };

      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'upload.jpg',
        type: 'image/jpeg',
      } as any);

      if (!user && visitorId) {
        formData.append('visitor_id', visitorId);
      }

      const response = await api.post('/scam/analyze-image', formData, {
        headers,
      });

      if (response.data && response.data.success) {
        const data = response.data.data;
        setResult({
          risk_level: data.risk_level,
          score: data.risk_score,
          risk_factors: data.risk_factors,
          suggestions: data.suggestions,
        });
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('影像分析失敗', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* 控制台頂部 */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>AI 防禦主控台</Text>
              <Text style={styles.subtitle}>DEFENSE CONSOLE - SECURE SCANNER</Text>
            </View>
            <View style={styles.badgeContainer}>
              <View style={[styles.statusIndicator, { backgroundColor: user ? '#00ff66' : '#00ccff' }]} />
              <Text style={styles.badgeText}>
                {user ? `使用者: ${user.name}` : '訪客防護模式'}
              </Text>
            </View>
          </View>

          {/* 標籤頁切換區 */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'text' && styles.activeTabItem]}
              onPress={() => handleTabChange('text')}
            >
              <Text style={[styles.tabText, activeTab === 'text' && styles.activeTabText]}>
                文字分析
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'url' && styles.activeTabItem]}
              onPress={() => handleTabChange('url')}
            >
              <Text style={[styles.tabText, activeTab === 'url' && styles.activeTabText]}>
                網址分析
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'image' && styles.activeTabItem]}
              onPress={() => handleTabChange('image')}
            >
              <Text style={[styles.tabText, activeTab === 'image' && styles.activeTabText]}>
                圖片分析
              </Text>
            </TouchableOpacity>
          </View>

          {/* 各標籤頁主畫面 */}
          <View style={styles.contentContainer}>
            {activeTab === 'text' && (
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>[ 輸入檢測內容 ]</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="請在此貼上懷疑是詐騙的簡訊、推廣內容或對話文字..."
                  placeholderTextColor="#5a6578"
                  multiline
                  numberOfLines={5}
                  value={textInput}
                  onChangeText={setTextInput}
                  keyboardAppearance="dark"
                />
                <TouchableOpacity
                  style={[styles.scanButton, { borderColor: '#00ff66', shadowColor: '#00ff66' }]}
                  onPress={handleAnalyzeText}
                  disabled={loading}
                >
                  <Text style={[styles.scanButtonText, { color: '#00ff66' }]}>
                    啟動文字掃描 (LAUNCH SCAN)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'url' && (
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>[ 輸入網站連結 ]</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="例如: https://suspicious-link.com"
                  placeholderTextColor="#5a6578"
                  value={urlInput}
                  onChangeText={setUrlInput}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardAppearance="dark"
                />
                <TouchableOpacity
                  style={[styles.scanButton, { borderColor: '#00ccff', shadowColor: '#00ccff' }]}
                  onPress={handleAnalyzeUrl}
                  disabled={loading}
                >
                  <Text style={[styles.scanButtonText, { color: '#00ccff' }]}>
                    啟動網址掃描 (LAUNCH SCAN)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'image' && (
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>[ 詐騙影像檢測 ]</Text>
                
                {imageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.changeImageBtn} onPress={() => setImageUri(null)}>
                      <Text style={styles.changeImageText}>清除影像</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Text style={styles.uploadText}>[ 未選取影像檔案 ]</Text>
                    <Text style={styles.uploadSubText}>請提供欲檢測的螢幕截圖或相片</Text>
                  </View>
                )}

                <View style={styles.imageActionsRow}>
                  <TouchableOpacity style={styles.imageActionBtn} onPress={handleTakeImage}>
                    <Text style={styles.imageActionBtnText}>📸 拍攝相片</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageActionBtn} onPress={handlePickImage}>
                    <Text style={styles.imageActionBtnText}>📁 選取相簿</Text>
                  </TouchableOpacity>
                </View>

                {imageUri && (
                  <TouchableOpacity
                    style={[styles.scanButton, { borderColor: '#00ff66', shadowColor: '#00ff66' }]}
                    onPress={handleAnalyzeImage}
                    disabled={loading}
                  >
                    <Text style={[styles.scanButtonText, { color: '#00ff66' }]}>
                      啟動影像掃描 (LAUNCH SCAN)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* 掃描載入動畫 */}
          {loading && <ScanningLoader />}

          {/* 檢測結果呈現 */}
          {result && !loading && (
            <View style={styles.resultWrapper}>
              <ResultCard
                risk_level={result.risk_level}
                score={result.score}
                risk_factors={result.risk_factors}
                suggestions={result.suggestions}
              />
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>重置防禦主控台 (RESET CONSOLE)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 連線異常卡片 */}
          {error && !loading && (
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>🚨</Text>
              <View style={styles.errorTextContainer}>
                <Text style={styles.errorTitle}>防禦系統連線異常</Text>
                <Text style={styles.errorDesc}>請檢查您的網路連接，或稍後再試。</Text>
              </View>
              <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
                <Text style={styles.retryButtonText}>重新嘗試</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0b0d',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 255, 102, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#8f9cae',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12141c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#12141c',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabItem: {
    backgroundColor: '#1a1f2c',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.2)',
  },
  tabText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#00ff66',
    textShadowColor: 'rgba(0, 255, 102, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  contentContainer: {
    width: '100%',
  },
  formContainer: {
    backgroundColor: '#12141c',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10,
  },
  inputLabel: {
    color: '#00ccff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#0a0b0d',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  textInput: {
    backgroundColor: '#0a0b0d',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 15,
  },
  scanButton: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    // iOS 霓虹發光
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  scanButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  uploadPlaceholder: {
    height: 160,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0b0d',
    marginBottom: 15,
  },
  uploadText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  uploadSubText: {
    color: '#4a5568',
    fontSize: 11,
    marginTop: 6,
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00ff66',
    marginBottom: 15,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(10, 11, 13, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  changeImageText: {
    color: '#ff0055',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  imageActionBtn: {
    flex: 0.48,
    backgroundColor: '#1a1f2c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  imageActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  resultWrapper: {
    width: '100%',
  },
  resetButton: {
    backgroundColor: '#12141c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  resetButtonText: {
    color: '#8f9cae',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  errorCard: {
    borderWidth: 1.5,
    borderColor: '#ff0055',
    borderRadius: 16,
    padding: 20,
    marginVertical: 15,
    backgroundColor: '#12141c',
    flexDirection: 'column',
    alignItems: 'center',
    shadowColor: '#ff0055',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  errorTextContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  errorTitle: {
    color: '#ff0055',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  errorDesc: {
    color: '#a0aec0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 0, 85, 0.1)',
    borderWidth: 1,
    borderColor: '#ff0055',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ff0055',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
