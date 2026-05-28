import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Linking,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// 定義案例型別
interface ScamCaseItem {
  id: number;
  title: string;
  description: string;
  scam_type: string;
  threat_level: 'danger' | 'warning' | 'safe' | string;
  keywords: string[];
  method: string;
  rules: string[];
  source_url: string | null;
  created_at: string;
}

export default function KnowledgeScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [cases, setCases] = useState<ScamCaseItem[]>([]);
  const [filteredCases, setFilteredCases] = useState<ScamCaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('全部');
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();
  const { user } = useAuth();

  // 取得防詐案例資料
  const fetchCases = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get('/scam/cases');
      if (response.data && response.data.success) {
        const fetchedCases = response.data.data.cases || [];
        setCases(fetchedCases);
        setFilteredCases(fetchedCases);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('取得防詐案例庫失敗', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // 搜尋與篩選邏輯
  useEffect(() => {
    let result = cases;

    // 類型篩選
    if (selectedType !== '全部') {
      result = result.filter((item) => item.scam_type === selectedType);
    }

    // 關鍵字搜尋
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.scam_type.toLowerCase().includes(query) ||
          item.method.toLowerCase().includes(query) ||
          item.keywords.some((kw) => kw.toLowerCase().includes(query))
      );
    }

    setFilteredCases(result);
  }, [searchQuery, selectedType, cases]);

  // 獲取所有不重複的詐騙類型
  const scamTypes = ['全部', ...Array.from(new Set(cases.map((c) => c.scam_type)))];

  // 取得威脅等級對應顏色與文字
  const getThreatStyle = (level: string) => {
    const norm = level.toLowerCase();
    if (norm === 'danger') {
      return { label: '極高威脅', color: '#ff0055', bg: 'rgba(255, 0, 85, 0.1)' };
    } else if (norm === 'warning') {
      return { label: '中度威脅', color: '#ffcc00', bg: 'rgba(255, 204, 0, 0.1)' };
    }
    return { label: '低度威脅', color: '#00ff66', bg: 'rgba(0, 255, 102, 0.1)' };
  };

  // 開啟來源網址
  const handleOpenSource = (url: string | null) => {
    if (url) {
      Linking.openURL(url).catch((err) => console.error('無法開啟連結', err));
    }
  };

  // 渲染單個案例卡片
  const renderItem = ({ item }: { item: ScamCaseItem }) => {
    const threatInfo = getThreatStyle(item.threat_level);

    return (
      <View style={[styles.card, { borderColor: threatInfo.color }]}>
        {/* 卡片標頭：標題與威脅級別 */}
        <View style={styles.cardHeader}>
          <View style={styles.titleCol}>
            <Text style={styles.caseTitle}>{item.title}</Text>
            <View style={styles.scamTypeBadge}>
              <Text style={styles.scamTypeBadgeText}>{item.scam_type}</Text>
            </View>
          </View>
          <View style={[styles.threatBadge, { borderColor: threatInfo.color, backgroundColor: threatInfo.bg }]}>
            <Text style={[styles.threatBadgeText, { color: threatInfo.color }]}>
              {threatInfo.label}
            </Text>
          </View>
        </View>

        {/* 簡介 */}
        <Text style={styles.descriptionText}>{item.description}</Text>

        <View style={styles.divider} />

        {/* 發生的特徵 (risk_factors / method) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>[ 手法特徵與跡象 ]</Text>
          <Text style={styles.methodText}>{item.method}</Text>
        </View>

        {/* 關鍵字標籤 */}
        {item.keywords && item.keywords.length > 0 && (
          <View style={styles.keywordRow}>
            {item.keywords.map((kw, index) => (
              <View key={index} style={styles.keywordTag}>
                <Text style={styles.keywordTagText}>#{kw}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* 防範建議 (suggestions / rules) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>[ 核心防禦守則 ]</Text>
          {item.rules && item.rules.length > 0 ? (
            item.rules.map((rule, index) => (
              <View key={index} style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>🛡</Text>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))
          ) : (
            <View style={styles.ruleItem}>
              <Text style={styles.ruleBullet}>🛡</Text>
              <Text style={styles.ruleText}>保持警覺，切勿隨意提供個資或轉帳。</Text>
            </View>
          )}
        </View>

        {/* 外部參考 */}
        {item.source_url && (
          <TouchableOpacity
            style={styles.sourceButton}
            onPress={() => handleOpenSource(item.source_url)}
            activeOpacity={0.7}
          >
            <Text style={styles.sourceButtonText}>🔗 檢視官方通報或參考來源</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 頂部 Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>防詐威脅庫</Text>
          <Text style={styles.subtitle}>THREAT INTELLIGENCE - SCAM CASES</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person-circle-outline" size={32} color={user ? "#00ff66" : "#00ccff"} />
        </TouchableOpacity>
      </View>

      {/* 搜尋與篩選區域 */}
      <View style={styles.filterArea}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜尋威脅、手法或特徵關鍵字..."
          placeholderTextColor="#5a6578"
          value={searchQuery}
          onChangeText={setSearchQuery}
          keyboardAppearance="dark"
        />

        {/* 類型水平滾動篩選列 */}
        {scamTypes.length > 1 && (
          <FlatList
            horizontal
            data={scamTypes}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  selectedType === item && styles.activeFilterTab,
                ]}
                onPress={() => setSelectedType(item)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedType === item && styles.activeFilterTabText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.horizontalTabs}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>

      {/* 內容區 */}
      {loading && cases.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00ccff" />
          <Text style={styles.loadingText}>載入威脅情資中...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>🚨 無法連接威脅情報庫</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCases}>
            <Text style={styles.retryButtonText}>重新連線</Text>
          </TouchableOpacity>
        </View>
      ) : filteredCases.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>[ 無相符情資 ]</Text>
            <Text style={styles.emptyDesc}>
              找不到與關鍵字「{searchQuery}」相符的防詐情資。{"\n"}請更換關鍵字重新查詢。
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredCases}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchCases}
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
    paddingBottom: 10,
  },
  profileButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 204, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#8f9cae',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  filterArea: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchInput: {
    backgroundColor: '#12141c',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 10,
  },
  horizontalTabs: {
    flexGrow: 0,
    marginBottom: 5,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#12141c',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeFilterTab: {
    backgroundColor: 'rgba(0, 204, 255, 0.1)',
    borderColor: '#00ccff',
  },
  filterTabText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterTabText: {
    color: '#00ccff',
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
  card: {
    backgroundColor: '#12141c',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleCol: {
    flex: 1,
    marginRight: 10,
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 24,
  },
  scamTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1f2c',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scamTypeBadgeText: {
    color: '#8f9cae',
    fontSize: 10,
    fontWeight: '600',
  },
  threatBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  threatBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  descriptionText: {
    color: '#a0aec0',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 12,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#00ccff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  methodText: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 22,
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  keywordTag: {
    backgroundColor: '#0a0b0d',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  keywordTagText: {
    color: '#718096',
    fontSize: 11,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  ruleBullet: {
    fontSize: 12,
    marginRight: 8,
    marginTop: 3,
  },
  ruleText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  sourceButton: {
    backgroundColor: '#0a0b0d',
    borderWidth: 1,
    borderColor: 'rgba(0, 204, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  sourceButtonText: {
    color: '#00ccff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
