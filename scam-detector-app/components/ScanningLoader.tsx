import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';

export const ScanningLoader: React.FC = () => {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // 掃描線來回移動動畫
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false, // 涉及 layout 屬性 (top)，故設為 false
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // 文字呼吸閃爍動畫
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanAnim, fadeAnim]);

  // 映射 top 屬性百分比
  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '95%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.scannerBox}>
        {/* 科幻掃描線 */}
        <Animated.View style={[styles.scanLine, { top: translateY }]} />
        
        {/* 科技背景網格微調 */}
        <View style={styles.gridOverlay} />
        
        <View style={styles.content}>
          <Animated.Text style={[styles.scanningText, { opacity: fadeAnim }]}>
            SYSTEM SCANNING...
          </Animated.Text>
          <Text style={styles.subText}>AI 引擎正在分析潛在威脅</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerBox: {
    width: '100%',
    height: 180,
    borderWidth: 1.5,
    borderColor: '#00ff66',
    borderRadius: 16,
    backgroundColor: '#0d1117',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00ff66',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  scanLine: {
    position: 'absolute',
    left: '2%',
    width: '96%',
    height: 3,
    backgroundColor: '#00ff66',
    shadowColor: '#00ff66',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 255, 102, 0.02)',
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    zIndex: 3,
  },
  scanningText: {
    color: '#00ff66',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 102, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subText: {
    color: '#8f9cae',
    fontSize: 13,
    letterSpacing: 1.5,
  },
});

export default ScanningLoader;
