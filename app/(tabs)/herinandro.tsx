import { getAllBiblio, getAllRepas, LAOKA_IMAGES, LaokaBiblio } from '@/hooks/useDatabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.82;
const RADIUS = WHEEL_SIZE / 2;
const CENTER = RADIUS;

const COLORS = ['#ec7f13', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export default function Herinandro() {
  const [repas, setRepas] = useState<LaokaBiblio[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [resultat, setResultat] = useState<LaokaBiblio | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const biblio = getAllBiblio();
      const planning = getAllRepas();
      const map = new Map<string, LaokaBiblio>();
      biblio.forEach(b => map.set(b.nom, b));
      planning.forEach(r => { if (!map.has(r.nom)) map.set(r.nom, { id: r.id, nom: r.nom, categorie: r.categorie }); });
      setRepas(Array.from(map.values()));
    }, [])
  );

  function spin() {
    if (spinning) return;
    if (repas.length === 0) {
      Alert.alert('Tsy misy laoka', 'Manampia laoka aloha!');
      return;
    }
    setSpinning(true);
    setResultat(null);

    const count = Math.min(repas.length, 8);
    const randomIndex = Math.floor(Math.random() * count);
    const segAngle = 360 / count;
    const extraSpins = 6 + Math.floor(Math.random() * 4);
    const target = extraSpins * 360 + segAngle * randomIndex + segAngle / 2;
    currentRotation.current += target;

    Animated.timing(spinAnim, {
      toValue: currentRotation.current,
      duration: 3500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSpinning(false);
      setResultat(repas[randomIndex]);
      setHasSpun(true);
    });
  }

  const rotate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const displayRepas = repas.slice(0, 8);
  const count = displayRepas.length;
  const segAngle = count > 0 ? 360 / count : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>KISENDRASENDRA</Text>
          <Text style={styles.headerTitle}>Inona no hatao laoka?</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeNum}>{repas.length}</Text>
          <Text style={styles.headerBadgeLabel}>laoka</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Pointer */}
        <View style={styles.pointerWrap}>
          <View style={styles.pointer} />
        </View>

        {/* Wheel */}
        <View style={styles.wheelShadow}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            {count === 0 ? (
              <View style={[styles.emptyWheel, { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: RADIUS }]}>
                <MaterialIcons name="restaurant" size={52} color="#e5e7eb" />
                <Text style={styles.emptyWheelText}>Tsy misy laoka</Text>
              </View>
            ) : (
              <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                <Circle cx={CENTER} cy={CENTER} r={RADIUS - 1} fill="#fff" stroke="#e5e7eb" strokeWidth={2} />

                {displayRepas.map((r, i) => {
                  const startAngle = segAngle * i;
                  const endAngle = segAngle * (i + 1);
                  const midAngle = startAngle + segAngle / 2;
                  const color = COLORS[i % COLORS.length];
                  const path = segmentPath(CENTER, CENTER, RADIUS - 4, startAngle, endAngle);
                  const textR = RADIUS * 0.62;
                  const textPos = polarToCartesian(CENTER, CENTER, textR, midAngle);
                  const starR = RADIUS * 0.84;
                  const starPos = polarToCartesian(CENTER, CENTER, starR, midAngle);
                  const label = r.nom.length > 8 ? r.nom.substring(0, 7) + '…' : r.nom;

                  return (
                    <G key={`seg-${i}`}>
                      <Path d={path} fill={color} />
                      <SvgText x={starPos.x} y={starPos.y + 5} fill="rgba(255,255,255,0.5)" fontSize={14} textAnchor="middle">★</SvgText>
                      <SvgText
                        x={textPos.x} y={textPos.y}
                        fill="#fff" fontSize={count <= 4 ? 13 : 10} fontWeight="bold" textAnchor="middle"
                        transform={`rotate(${midAngle}, ${textPos.x}, ${textPos.y})`}
                      >{label}</SvgText>
                    </G>
                  );
                })}

                {displayRepas.map((_, i) => {
                  const angle = segAngle * i;
                  const outer = polarToCartesian(CENTER, CENTER, RADIUS - 4, angle);
                  return (
                    <Path key={`div-${i}`} d={`M ${CENTER} ${CENTER} L ${outer.x} ${outer.y}`} stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
                  );
                })}

                <Circle cx={CENTER} cy={CENTER} r={36} fill="#fff" />
                <Circle cx={CENTER} cy={CENTER} r={30} fill="#fff" stroke="#ec7f13" strokeWidth={3} />
                <SvgText x={CENTER} y={CENTER + 5} fill="#ec7f13" fontSize={13} fontWeight="bold" textAnchor="middle">SPIN</SvgText>
              </Svg>
            )}
          </Animated.View>
        </View>

        {/* Résultat avec image */}
        {hasSpun && resultat && !spinning && (
          <View style={styles.resultatCard}>
            {LAOKA_IMAGES[resultat.nom] ? (
              <Image source={LAOKA_IMAGES[resultat.nom]} style={styles.resultatImg} />
            ) : (
              <View style={styles.resultatImgPlaceholder}>
                <Text style={{ fontSize: 32 }}>🎉</Text>
              </View>
            )}
            <View style={styles.resultatInfo}>
              <Text style={styles.resultatLabel}>SAKAFO VOAFIDY !</Text>
              <Text style={styles.resultatNom}>{resultat.nom}</Text>
            </View>
            <Text style={styles.resultatTrophy}>🏆</Text>
          </View>
        )}

        {/* Spin button */}
        <TouchableOpacity
          style={[styles.spinBtn, spinning && styles.spinBtnDisabled]}
          onPress={spin}
          disabled={spinning}
          activeOpacity={0.85}
        >
          <MaterialIcons name="casino" size={24} color="#fff" />
          <Text style={styles.spinBtnText}>
            {spinning ? 'Mihodina...' : 'AHODINO IZAO !'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef9f0' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 18,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerSub: { fontSize: 10, fontWeight: '800', color: '#ec7f13', letterSpacing: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1f2937', marginTop: 2 },
  headerBadge: {
    backgroundColor: '#fef3e2', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#fde68a',
  },
  headerBadgeNum: { fontSize: 20, fontWeight: '800', color: '#ec7f13' },
  headerBadgeLabel: { fontSize: 10, color: '#f59e0b', fontWeight: '600' },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'space-evenly',
    paddingVertical: 12, paddingHorizontal: 16,
  },
  pointerWrap: { alignItems: 'center', zIndex: 20, marginBottom: -10 },
  pointer: {
    width: 0, height: 0,
    borderLeftWidth: 14, borderRightWidth: 14, borderBottomWidth: 28,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#ef4444',
  },
  wheelShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 20, elevation: 14,
    borderRadius: RADIUS, backgroundColor: '#fff',
  },
  emptyWheel: {
    alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#f9fafb', borderWidth: 3, borderColor: '#e5e7eb',
  },
  emptyWheelText: { fontSize: 15, color: '#9ca3af', fontWeight: '600' },
  resultatCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 20, padding: 14,
    width: '100%', borderWidth: 2, borderColor: '#ec7f13',
    shadowColor: '#ec7f13', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  resultatImg: {
    width: 64, height: 64, borderRadius: 16,
  },
  resultatImgPlaceholder: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: '#fef3e2', alignItems: 'center', justifyContent: 'center',
  },
  resultatInfo: { flex: 1 },
  resultatLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '800', letterSpacing: 1.5 },
  resultatNom: { fontSize: 17, fontWeight: '800', color: '#1f2937', marginTop: 2 },
  resultatTrophy: { fontSize: 28 },
  spinBtn: {
    width: '100%', borderRadius: 20,
    backgroundColor: '#ec7f13',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingVertical: 20,
    shadowColor: '#ec7f13', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  spinBtnDisabled: { opacity: 0.6 },
  spinBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1.5 },
});