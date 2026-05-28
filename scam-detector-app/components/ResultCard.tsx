import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export interface ResultCardProps {
  risk_level: 'Safe' | 'Warning' | 'Danger' | string;
  score: number; // 0 - 100
  risk_factors?: string[];
  suggestions?: string[];
}

export const ResultCard: React.FC<ResultCardProps> = ({
  risk_level = 'Safe',
  score = 0,
  risk_factors = [],
  suggestions = [],
}) => {
  // 統一轉為小寫進行風險等級比對
  const normalizedLevel = risk_level.toLowerCase();
  
  let themeColor = '#00ff66'; // 預設安全 (Safe) - 螢光綠
  let levelText = '安全 (Safe)';
  let bgGlow = 'rgba(0, 255, 102, 0.05)';

  if (normalizedLevel === 'warning') {
    themeColor = '#ffcc00'; // 警告 (Warning) - 螢光黃
    levelText = '警告 (Warning)';
    bgGlow = 'rgba(255, 204, 0, 0.05)';
  } else if (normalizedLevel === 'danger') {
    themeColor = '#ff0055'; // 危險 (Danger) - 螢光紅
    levelText = '危險 (Danger)';
    bgGlow = 'rgba(255, 0, 85, 0.05)';
  }

  return (
    <View style={[styles.card, { borderColor: themeColor, shadowColor: themeColor }]}>
      {/* 霓虹發光背景效果 */}
      <View style={[styles.glowContainer, { backgroundColor: bgGlow }]} />
      
      {/* 卡片標頭：風險等級與分數 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>檢測結果報告</Text>
          <Text style={[styles.levelText, { color: themeColor }]}>{levelText}</Text>
        </View>
        <View style={[styles.scoreBadge, { borderColor: themeColor }]}>
          <Text style={[styles.scoreLabel, { color: themeColor }]}>風險分數</Text>
          <Text style={[styles.scoreValue, { color: themeColor }]}>{score}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 風險特徵 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>[ 風險特徵分析 ]</Text>
        {risk_factors && risk_factors.length > 0 ? (
          risk_factors.map((factor, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.bullet, { color: themeColor }]}>⚡</Text>
              <Text style={styles.itemText}>{factor}</Text>
            </View>
          ))
        ) : (
          <View style={styles.listItem}>
            <Text style={[styles.bullet, { color: '#00ff66' }]}>✓</Text>
            <Text style={styles.itemText}>未偵測到明顯的惡意特徵或風險因子。</Text>
          </View>
        )}
      </View>

      {/* 防範建議 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>[ 防禦系統建議 ]</Text>
        {suggestions && suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.bullet, { color: '#00ccff' }]}>🛡</Text>
              <Text style={styles.itemText}>{suggestion}</Text>
            </View>
          ))
        ) : (
          <View style={styles.listItem}>
            <Text style={[styles.bullet, { color: '#00ccff' }]}>🛡</Text>
            <Text style={styles.itemText}>無特定建議，請保持日常警覺並避免隨意提供個資。</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    marginVertical: 15,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#12141c',
    // iOS 霓虹發光陰影
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    // Android 高科技卡片立體感
    elevation: 6,
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    zIndex: 1,
  },
  headerTitle: {
    color: '#8f9cae',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  levelText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1,
  },
  scoreBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0b0d',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
    zIndex: 1,
  },
  section: {
    marginVertical: 10,
    zIndex: 1,
  },
  sectionTitle: {
    color: '#00ccff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  itemText: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});

export default ResultCard;
