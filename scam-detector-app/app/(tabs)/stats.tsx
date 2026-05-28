import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface StatsData {
  summary: {
    total_scans: number;
    danger_scans: number;
    warning_scans: number;
    safe_scans: number;
  };
  weekly_trend: { date: string; count: number }[];
  scam_type_distribution: { scam_type: string; count: number }[];
  risk_level_distribution: { risk_level: string; count: number }[];
}

export default function StatsScreen() {
  const { user } = useAuth();
  const [visitorId, setVisitorId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  const fetchStats = async () => {
    setLoading(true);
    setError(false);
    try {
      let storedId = await AsyncStorage.getItem('visitor_id');
      setVisitorId(storedId || '');

      const headers: Record<string, string> = {};
      const params: Record<string, string> = {};
      
      if (!user && storedId) {
        headers['X-Visitor-Id'] = storedId;
        params['visitor_id'] = storedId;
      }

      const response = await api.get('/scam/stats', {
        headers,
        params,
      });

      if (response.data && response.data.success) {
        setStats(response.data.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('取得統計數據失敗', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [user])
  );

  if (loading && !stats) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00ff66" />
          <Text style={styles.loadingText}>數據中樞連線中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !stats) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>🚨 數據分析引擎連線失敗</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStats}>
            <Text style={styles.retryButtonText}>重新連線</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 計算週趨勢的最大值以繪製圖表
  const maxTrendCount = Math.max(...stats.weekly_trend.map(t => t.count), 1);
  const maxTypeCount = Math.max(...stats.scam_type_distribution.map(t => t.count), 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>數據中樞</Text>
          <Text style={styles.subtitle}>COMMAND CENTER - ANALYTICS</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person-circle-outline" size={32} color={user ? "#00ff66" : "#00ccff"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 總結卡片 */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>累計掃描</Text>
            <Text style={[styles.summaryValue, { color: '#00ccff' }]}>{stats.summary.total_scans}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>高危險攔截</Text>
            <Text style={[styles.summaryValue, { color: '#ff0055' }]}>{stats.summary.danger_scans}</Text>
          </View>
        </View>
        <View style={[styles.summaryGrid, { marginTop: 10 }]}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>警告</Text>
            <Text style={[styles.summaryValue, { color: '#ffcc00' }]}>{stats.summary.warning_scans}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>安全</Text>
            <Text style={[styles.summaryValue, { color: '#00ff66' }]}>{stats.summary.safe_scans}</Text>
          </View>
        </View>

        {/* 過去七天趨勢 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart" size={18} color="#b967ff" />
            <Text style={styles.cardTitle}>過去七日掃描趨勢</Text>
          </View>
          <View style={styles.trendContainer}>
            {stats.weekly_trend.map((item, index) => {
              const heightPct = (item.count / maxTrendCount) * 100;
              const dateObj = new Date(item.date);
              const dayStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
              return (
                <View key={index} style={styles.trendBarWrapper}>
                  <Text style={styles.trendValue}>{item.count}</Text>
                  <View style={styles.trendBarBg}>
                    <View style={[styles.trendBarFill, { height: `${heightPct}%` }]} />
                  </View>
                  <Text style={styles.trendLabel}>{dayStr}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 詐騙手法分佈 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pie-chart" size={18} color="#00ccff" />
            <Text style={styles.cardTitle}>攔截手法分析 (Top 5)</Text>
          </View>
          <View style={styles.distributionContainer}>
            {stats.scam_type_distribution.length === 0 ? (
              <Text style={styles.emptyDataText}>尚無足夠數據</Text>
            ) : (
              stats.scam_type_distribution.slice(0, 5).map((item, index) => {
                const widthPct = (item.count / maxTypeCount) * 100;
                return (
                  <View key={index} style={styles.distRow}>
                    <View style={styles.distLabelContainer}>
                      <Text style={styles.distLabel}>{item.scam_type}</Text>
                      <Text style={styles.distCount}>{item.count}</Text>
                    </View>
                    <View style={styles.distBarBg}>
                      <View style={[styles.distBarFill, { width: `${widthPct}%` }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

      </ScrollView>
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
  scrollContent: {
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
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryBox: {
    width: '48%',
    backgroundColor: '#12141c',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#8f9cae',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  card: {
    backgroundColor: '#12141c',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  trendBarWrapper: {
    alignItems: 'center',
    width: '12%',
  },
  trendValue: {
    color: '#00ccff',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendBarBg: {
    width: 12,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: {
    width: '100%',
    backgroundColor: '#b967ff',
    borderRadius: 6,
  },
  trendLabel: {
    color: '#5a6578',
    fontSize: 9,
    marginTop: 8,
  },
  distributionContainer: {
    marginTop: 10,
  },
  emptyDataText: {
    color: '#5a6578',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  distRow: {
    marginBottom: 15,
  },
  distLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  distLabel: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  distCount: {
    color: '#00ccff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  distBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    backgroundColor: '#00ccff',
    borderRadius: 4,
  },
});
