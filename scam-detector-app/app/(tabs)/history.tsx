import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import ResultCard from '../../components/ResultCard';
import { useAuth } from '../../context/AuthContext';

// 定義歷史紀錄項目型別
interface HistoryItem {
  id: number;
  user_id: number | null;
  input_type: 'text' | 'url' | 'image' | string;
  content: string | null;
  url: string | null;
  image_path: string | null;
  ocr_text: string | null;
  risk_level: string;
  risk_score: number;
  scam_type: string | null;
  summary: string | null;
  risk_factors: string[];
  suggestions: string[];
  created_at: string;
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [visitorId, setVisitorId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<boolean>(false);

  // 取得歷史資料
  const fetchHistory = async () => {
    setLoading(true);
    setError(false);
    try {
      let storedId = await AsyncStorage.getItem('visitor_id');
      if (!storedId) {
        // 若無 visitor_id，則生成一個 UUID
        storedId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
        await AsyncStorage.setItem('visitor_id', storedId);
      }
      setVisitorId(storedId);

      const headers: Record<string, string> = {};
      const params: Record<string, string> = {};
      
      // 若使用者未登入，才帶入訪客參數
      if (!user && storedId) {
        headers['X-Visitor-Id'] = storedId;
        params['visitor_id'] = storedId;
      }

      // 取得歷史紀錄 API (每頁多拉一些，預設拉 50 筆)
      const response = await api.get('/scam/history', {
        headers,
        params: {
          ...params,
          per_page: 50,
        },
      });

      if (response.data && response.data.success) {
        setHistoryItems(response.data.data.items || []);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('取得防禦日誌失敗', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 當分頁獲得焦點時，重新取得歷史資料
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [user])
  );

  // 切換展開狀態
  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 轉換檢測類型文字與顏色
  const getInputTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'text':
        return { label: '文字分析', color: '#00ff66' };
      case 'url':
        return { label: '網址連結', color: '#00ccff' };
      case 'image':
        return { label: '影像辨識', color: '#b967ff' };
      default:
        return { label: '未知來源', color: '#a0aec0' };
    }
  };

  // 取得風險級別對應顏色與文字
  const getRiskStyle = (level: string) => {
    const norm = level.toLowerCase();
    if (norm === 'danger') {
      return { label: '危險 (Danger)', color: '#ff0055', bg: 'rgba(255, 0, 85, 0.1)' };
    } else if (norm === 'warning') {
      return { label: '警告 (Warning)', color: '#ffcc00', bg: 'rgba(255, 204, 0, 0.1)' };
    }
    return { label: '安全 (Safe)', color: '#00ff66', bg: 'rgba(0, 255, 102, 0.1)' };
  };

  // 渲染單個歷史紀錄項目
  const renderItem = ({ item }: { item: HistoryItem }) => {
    const isExpanded = expandedId === item.id;
    const typeInfo = getInputTypeLabel(item.input_type);
    const riskInfo = getRiskStyle(item.risk_level);

    // 格式化顯示的內容簡介，完整內容會在展開後呈現。
    let fullContent = '';
    if (item.input_type === 'text') {
      fullContent = item.content || '';
    } else if (item.input_type === 'url') {
      fullContent = item.url || '';
    } else if (item.input_type === 'image') {
      fullContent = item.ocr_text ? `[OCR]: ${item.ocr_text}` : '[影像已加密儲存]';
    }

    let previewContent = fullContent;
    if (previewContent.length > 50) {
      previewContent = previewContent.substring(0, 50) + '...';
    }

    return (
      <View style={[styles.cardContainer, { borderColor: riskInfo.color }]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          {/* 頂部資訊列 */}
          <View style={styles.cardMetaRow}>
            <View style={[styles.typeBadge, { borderColor: typeInfo.color }]}>
              <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                {typeInfo.label}
              </Text>
            </View>
            <Text style={styles.dateText}>{item.created_at}</Text>
          </View>

          {/* 主體資訊 */}
          <View style={styles.cardMainRow}>
            <View style={styles.contentCol}>
              <View style={styles.previewRow}>
                <Text style={styles.expandSymbol}>{isExpanded ? '-' : '+'}</Text>
                <Text style={styles.previewText} numberOfLines={2}>
                  {previewContent || '[無可顯示內容]'}
                </Text>
              </View>
              {item.scam_type && (
                <Text style={styles.scamTypeTag}>
                  詐騙類型：{item.scam_type}
                </Text>
              )}
            </View>

            {/* 分數圓形指示器 */}
            <View style={[styles.scoreBadge, { borderColor: riskInfo.color, backgroundColor: riskInfo.bg }]}>
              <Text style={[styles.scoreValue, { color: riskInfo.color }]}>
                {item.risk_score}
              </Text>
              <Text style={[styles.scoreUnit, { color: riskInfo.color }]}>分</Text>
            </View>
          </View>

          {/* 展開摺疊按鈕與提示 */}
          <View style={styles.expandRow}>
            <Text style={[styles.riskLevelText, { color: riskInfo.color }]}>
              系統判定：{riskInfo.label}
            </Text>
            <Text style={styles.expandToggleText}>
              {isExpanded ? '點擊收合' : '點擊看詳細報告'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 展開後的 ResultCard 區塊 */}
        {isExpanded && (
          <View style={styles.detailWrapper}>
            <View style={styles.detailDivider} />
            <View style={styles.fullContentPanel}>
              <Text style={styles.fullContentTitle}>INPUT_CONTENT</Text>
              <Text style={styles.fullContentText}>
                {fullContent || '[無可顯示內容]'}
              </Text>
            </View>
            {item.summary && (
              <View style={styles.fullContentPanel}>
                <Text style={styles.fullContentTitle}>AI_SUMMARY</Text>
                <Text style={styles.fullContentText}>{item.summary}</Text>
              </View>
            )}
            <ResultCard
              risk_level={item.risk_level}
              score={item.risk_score}
              risk_factors={item.risk_factors}
              suggestions={item.suggestions}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 頂部 Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>防禦日誌</Text>
          <Text style={styles.subtitle}>DEFENSE LOGS - THREAT HISTORY</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person-circle-outline" size={32} color={user ? "#00ff66" : "#00ccff"} />
        </TouchableOpacity>
      </View>

      {/* 內容區 */}
      {loading && historyItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00ff66" />
          <Text style={styles.loadingText}>讀取威脅日誌中...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>🚨 防禦核心連線中斷</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchHistory}>
            <Text style={styles.retryButtonText}>重啟連接</Text>
          </TouchableOpacity>
        </View>
      ) : historyItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyIcon}>🛡</Text>
            <Text style={styles.emptyTitle}>[ 無掃描紀錄 ]</Text>
            <Text style={styles.emptyDesc}>
              目前尚未留下任何潛在威脅檢測日誌。{"\n"}請返回首頁「安全檢測」啟動 AI 防禦掃描。
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={historyItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchHistory}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0b0d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 15 : 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileButton: {
    padding: 5,
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
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#8f9cae',
    fontSize: 14,
    marginTop: 12,
    letterSpacing: 1,
  },
  errorText: {
    color: '#ff0055',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: '#ff0055',
    backgroundColor: 'rgba(255, 0, 85, 0.05)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#ff0055',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyPanel: {
    width: '100%',
    backgroundColor: '#12141c',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    color: '#718096',
    marginBottom: 15,
  },
  emptyTitle: {
    color: '#718096',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  emptyDesc: {
    color: '#4a5568',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardContainer: {
    backgroundColor: '#12141c',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 15,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#0a0b0d',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 11,
    color: '#4a5568',
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentCol: {
    flex: 1,
    marginRight: 15,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  expandSymbol: {
    color: '#00ff66',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
    marginRight: 8,
    width: 10,
  },
  previewText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  scamTypeTag: {
    color: '#00ccff',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },
  scoreBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  scoreUnit: {
    fontSize: 9,
    marginTop: -2,
    fontWeight: 'bold',
  },
  expandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 10,
  },
  riskLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  expandToggleText: {
    color: '#8f9cae',
    fontSize: 11,
  },
  detailWrapper: {
    backgroundColor: '#0a0b0d',
    paddingHorizontal: 10,
    paddingBottom: 15,
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 5,
  },
  fullContentPanel: {
    backgroundColor: '#12141c',
    borderLeftWidth: 2,
    borderLeftColor: '#00ff66',
    borderRadius: 10,
    marginHorizontal: 6,
    marginTop: 10,
    padding: 12,
  },
  fullContentTitle: {
    color: '#8f9cae',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  fullContentText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 20,
  },
});
