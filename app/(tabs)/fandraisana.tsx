import { getAllBiblio, getAllCourses, getAllRepas, getCustomImages, LAOKA_IMAGES, Repas } from '@/hooks/useDatabase';
import { annulerToutesNotifications, notificationTest, programmerNotifications } from '@/hooks/useNotifications';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const JOURS_MG: Record<string, string> = {
  'Lundi': 'Alatsinainy', 'Mardi': 'Talata', 'Mercredi': 'Alarobia',
  'Jeudi': 'Alakamisy', 'Vendredi': 'Zoma', 'Samedi': 'Sabotsy', 'Dimanche': 'Alahady',
};

const CITATIONS = [
  'Ny sakafo tsara dia fahasalamana !',
  'Omeo sakafo ny fianakaviana, omeo fitiavana ny fo.',
  'Ny vary mafana no hafalian\'ny Malagasy.',
  'Sakafo tsara, andro tsara !',
  'Ny laoka dia fitiavana atolotra.',
];

export default function Fandraisana() {
  const router = useRouter();
  const [repasDuJour, setRepasDuJour] = useState<Repas[]>([]);
  const [repasDeMain, setRepasDeMain] = useState<Repas[]>([]);
  const [totalBiblio, setTotalBiblio] = useState(0);
  const [totalSemaine, setTotalSemaine] = useState(0);
  const [totalTsena, setTotalTsena] = useState(0);
  const [citation] = useState(CITATIONS[Math.floor(Math.random() * CITATIONS.length)]);
  const [notifActive, setNotifActive] = useState(false);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotifActive(status === 'granted');
    });
    programmerNotifications();
    getCustomImages().then(setCustomImages);
  }, []);

  useFocusEffect(useCallback(() => {
    const today = new Date().getDay();
    const jourAujourdhui = JOURS_FR[today];
    const jourDemain = JOURS_FR[(today + 1) % 7];
    const tousRepas = getAllRepas();
    setRepasDuJour(tousRepas.filter(r => r.jour === jourAujourdhui));
    setRepasDeMain(tousRepas.filter(r => r.jour === jourDemain));
    setTotalSemaine(tousRepas.length);
    setTotalBiblio(getAllBiblio().length);
    const courses = getAllCourses();
    setTotalTsena(courses.filter(c => c.achete === 0).length);
    getCustomImages().then(setCustomImages);
  }, []));

  const today = new Date();
  const jourNom = JOURS_FR[today.getDay()];
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  function getImg(nom: string): any {
    if (customImages[nom]) return { uri: customImages[nom] };
    if (LAOKA_IMAGES[nom]) return LAOKA_IMAGES[nom];
    return null;
  }

  const RepasCard = ({ r, demain = false }: { r: Repas; demain?: boolean }) => {
    const img = getImg(r.nom);
    return (
      <View style={[styles.repasCard, demain && styles.repasCardDemain]}>
        {img ? (
          <Image source={img} style={styles.repasCardImg} />
        ) : (
          <View style={[styles.repasCardImg, styles.repasCardImgPlaceholder]}>
            <Text style={{ fontSize: 26 }}>{demain ? '🍲' : '🍛'}</Text>
          </View>
        )}
        <Text style={styles.repasCardNom}>{r.nom}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>TONGASOA !</Text>
          <Text style={styles.headerTitle}>Laoka Herinandro</Text>
          <Text style={styles.headerDate}>{jourNom} · {dateStr}</Text>
        </View>
        <View style={styles.headerEmoji}>
          <Text style={{ fontSize: 36 }}>🍽️</Text>
        </View>
      </View>

      {/* Citation */}
      <View style={styles.citationCard}>
        <MaterialIcons name="format-quote" size={20} color="#ec7f13" />
        <Text style={styles.citationText}>{citation}</Text>
      </View>

      {/* Repas du jour */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌅 Sakafo Androany</Text>
        <Text style={styles.sectionSub}>{jourNom} — {JOURS_MG[jourNom]}</Text>
        {repasDuJour.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={() => router.push({ pathname: '/modal', params: { jour: jourNom } })}
          >
            <MaterialIcons name="add-circle-outline" size={32} color="#ec7f13" />
            <Text style={styles.emptyCardText}>Tsy misy laoka androany</Text>
            <Text style={styles.emptyCardSub}>Tsindrio hanampy laoka</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.repasCards}>
            {repasDuJour.map(r => <RepasCard key={r.id} r={r} />)}
          </View>
        )}
      </View>

      {/* Repas de demain */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌙 Sakafo Rahampitso</Text>
        <Text style={styles.sectionSub}>
          {JOURS_FR[(today.getDay() + 1) % 7]} — {JOURS_MG[JOURS_FR[(today.getDay() + 1) % 7]]}
        </Text>
        {repasDeMain.length === 0 ? (
          <View style={styles.emptyCardSmall}>
            <Text style={styles.emptyCardSmallText}>Tsy misy laoka natokana ho rahampitso</Text>
          </View>
        ) : (
          <View style={styles.repasCards}>
            {repasDeMain.map(r => <RepasCard key={r.id} r={r} demain />)}
          </View>
        )}
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>📊 Fampahalalana</Text>
      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/sakafo' as any)}>
          <Text style={styles.statNum}>{totalSemaine}</Text>
          <Text style={styles.statLabel}>Laoka herinandro</Text>
          <MaterialIcons name="calendar-today" size={20} color="#ec7f13" style={styles.statIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/biblio' as any)}>
          <Text style={styles.statNum}>{totalBiblio}</Text>
          <Text style={styles.statLabel}>Ao amin'ny tahiry</Text>
          <MaterialIcons name="menu-book" size={20} color="#3b82f6" style={styles.statIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, totalTsena > 0 && styles.statCardAlert]}
          onPress={() => router.push('/(tabs)/tsena' as any)}
        >
          <Text style={[styles.statNum, totalTsena > 0 && { color: '#ef4444' }]}>{totalTsena}</Text>
          <Text style={styles.statLabel}>Sisa hividianana</Text>
          <MaterialIcons name="shopping-cart" size={20} color={totalTsena > 0 ? '#ef4444' : '#10b981'} style={styles.statIcon} />
        </TouchableOpacity>
      </View>

      {/* Bouton Spin rapide */}
      <TouchableOpacity style={styles.spinBtn} onPress={() => router.push('/(tabs)/herinandro' as any)}>
        <View style={styles.spinBtnLeft}>
          <MaterialIcons name="casino" size={28} color="#fff" />
        </View>
        <View style={styles.spinBtnText}>
          <Text style={styles.spinBtnTitle}>Tsy mahita hevitra ?</Text>
          <Text style={styles.spinBtnSub}>Ahodino ny kodiarana !</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={16} color="#fff" />
      </TouchableOpacity>

      {/* Section Notifications */}
      <View style={styles.notifSection}>
        <Text style={styles.notifTitle}>🔔 Fampandrenesana</Text>
        <View style={styles.notifRow}>
          <TouchableOpacity
            style={[styles.notifBtn, notifActive && styles.notifBtnActive]}
            onPress={async () => {
              if (notifActive) {
                await annulerToutesNotifications();
                setNotifActive(false);
                Alert.alert('🔕', 'Fampandrenesana voajanona !');
              } else {
                await programmerNotifications();
                setNotifActive(true);
                Alert.alert('🔔', 'Fampandrenesana nalefa !\n8h sy 19h isan\'andro.');
              }
            }}
          >
            <MaterialIcons
              name={notifActive ? 'notifications-active' : 'notifications-off'}
              size={20}
              color={notifActive ? '#fff' : '#9ca3af'}
            />
            <Text style={[styles.notifBtnText, notifActive && styles.notifBtnTextActive]}>
              {notifActive ? 'Aktiva' : 'Tsy aktiva'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notifTestBtn}
            onPress={async () => {
              await notificationTest();
              Alert.alert('✅ Alefa!', 'Fampandrenesana ho avy ao anatin\'ny 3 segondra...');
            }}
          >
            <MaterialIcons name="send" size={18} color="#ec7f13" />
            <Text style={styles.notifTestText}>Andrana</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.notifInfo}>
          {notifActive
            ? " Hampandrenesina ianao amin'ny 8h sy 19h isan'andro"
            : "⚠️ Tsy misy fampandrenesana napetraka"}
        </Text>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef9f0' },
  content: { paddingBottom: 30 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerSub: { fontSize: 10, fontWeight: '800', color: '#ec7f13', letterSpacing: 2 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1f2937', marginTop: 2 },
  headerDate: { fontSize: 13, color: '#9ca3af', fontWeight: '500', marginTop: 4 },
  headerEmoji: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: '#fef3e2', alignItems: 'center', justifyContent: 'center',
  },
  citationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16,
    padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#ec7f13',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  citationText: { flex: 1, fontSize: 13, fontStyle: 'italic', color: '#374151', lineHeight: 20 },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937', marginHorizontal: 16, marginTop: 20, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: '#9ca3af', fontWeight: '500', marginBottom: 10 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 8, borderWidth: 2, borderColor: '#fde68a', borderStyle: 'dashed',
  },
  emptyCardText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  emptyCardSub: { fontSize: 12, color: '#9ca3af' },
  emptyCardSmall: { backgroundColor: '#f9fafb', borderRadius: 14, padding: 16, alignItems: 'center' },
  emptyCardSmallText: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },
  repasCards: { gap: 10 },
  repasCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    shadowColor: '#ec7f13', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: '#ec7f13',
  },
  repasCardDemain: { borderLeftColor: '#8b5cf6', shadowColor: '#8b5cf6' },
  repasCardImg: { width: 56, height: 56, borderRadius: 14 },
  repasCardImgPlaceholder: {
    backgroundColor: '#fef3e2', alignItems: 'center', justifyContent: 'center',
  },
  repasCardNom: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1f2937' },
  statsGrid: { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statCardAlert: { borderWidth: 1.5, borderColor: '#fecaca' },
  statNum: { fontSize: 28, fontWeight: '800', color: '#1f2937' },
  statLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600', textAlign: 'center', marginTop: 2 },
  statIcon: { marginTop: 8 },
  spinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#ec7f13', marginHorizontal: 16, marginTop: 20,
    padding: 18, borderRadius: 20,
    shadowColor: '#ec7f13', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  spinBtnLeft: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  spinBtnText: { flex: 1 },
  spinBtnTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  spinBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  notifSection: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  notifTitle: { fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 12 },
  notifRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  notifBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#f3f4f6', borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  notifBtnActive: { backgroundColor: '#ec7f13', borderColor: '#ec7f13' },
  notifBtnText: { fontSize: 14, fontWeight: '700', color: '#9ca3af' },
  notifBtnTextActive: { color: '#fff' },
  notifTestBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#fef3e2', borderWidth: 1.5, borderColor: '#fde68a',
  },
  notifTestText: { fontSize: 14, fontWeight: '700', color: '#ec7f13' },
  notifInfo: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic' },
});