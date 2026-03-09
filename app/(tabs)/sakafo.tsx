import { addRepas, deleteRepas, getAllBiblio, getAllRepas, getCustomImages, initDatabase, LAOKA_IMAGES, Repas } from '@/hooks/useDatabase';
import { programmerNotifications } from '@/hooks/useNotifications';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const JOURS_MG: Record<string, string> = {
  'Lundi': 'Alatsinainy', 'Mardi': 'Talata', 'Mercredi': 'Alarobia',
  'Jeudi': 'Alakamisy', 'Vendredi': 'Zoma', 'Samedi': 'Sabotsy', 'Dimanche': 'Alahady',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Sakafo() {
  const [repas, setRepas] = useState<Repas[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [autoFilling, setAutoFilling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    initDatabase();
    loadAll();
  }, []);

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  function loadAll() {
    setRepas(getAllRepas());
    getCustomImages().then(setCustomImages);
  }

  function onRefresh() {
    setRefreshing(true);
    loadAll();
    setRefreshing(false);
  }

  function confirmDelete(id: number, nom: string) {
    Alert.alert('Fafana', `Hofafana ve "${nom}"?`, [
      { text: 'Tsia', style: 'cancel' },
      {
        text: 'Eny', style: 'destructive', onPress: () => {
          deleteRepas(id);
          loadAll();
          programmerNotifications();
        }
      },
    ]);
  }

  function getImg(nom: string): any {
    if (customImages[nom]) return { uri: customImages[nom] };
    if (LAOKA_IMAGES[nom]) return LAOKA_IMAGES[nom];
    return null;
  }

  // ─── AUTO-REMPLIR ───
  function autoRemplir(remplacerTout: boolean) {
    const biblio = getAllBiblio();
    if (biblio.length < 7) {
      Alert.alert('Tsy ampy laoka', `Mila laoka 7 farafahakeliny ao amin'ny tahiry (${biblio.length} sisa).`);
      return;
    }

    setAutoFilling(true);

    const tousRepas = getAllRepas();
    const joursSansLaoka = remplacerTout
      ? JOURS
      : JOURS.filter(j => !tousRepas.some(r => r.jour === j));

    if (joursSansLaoka.length === 0) {
      Alert.alert('Feno sahady !', 'Efa misy laoka ny andro rehetra.\nHofafana daholo ve bola hamenoana indray?', [
        { text: 'Tsia', style: 'cancel', onPress: () => setAutoFilling(false) },
        {
          text: 'Eny, hamenoana indray', onPress: () => {
            doAutoRemplir(JOURS, biblio);
          }
        },
      ]);
      return;
    }

    doAutoRemplir(joursSansLaoka, biblio);
  }

  function doAutoRemplir(jours: string[], biblio: any[]) {
    // Mélanger la biblio
    const melange = shuffle(biblio);
    let index = 0;

    jours.forEach((jour) => {
      // Supprimer les repas existants de ce jour si on remplace
      const existing = getAllRepas().filter(r => r.jour === jour);
      existing.forEach(r => deleteRepas(r.id));

      // Ajouter 1 ou 2 laoka aléatoirement (80% chance d'1 seul, 20% de 2)
      const nbLaoka = Math.random() < 0.2 ? 2 : 1;
      for (let k = 0; k < nbLaoka; k++) {
        const laoka = melange[index % melange.length];
        index++;
        addRepas(laoka.nom, jour, laoka.categorie);
      }
    });

    loadAll();
    programmerNotifications();
    setAutoFilling(false);
    Alert.alert('✅ Vita!', `Andro ${jours.length} no nohamenoina!\nFampandrenesana novaina koa.`);
  }

  function confirmAutoRemplir() {
    const tousRepas = getAllRepas();
    const joursFenos = JOURS.filter(j => tousRepas.some(r => r.jour === j));

    if (joursFenos.length === 0) {
      // Aucun jour rempli, on remplit directement
      autoRemplir(false);
      return;
    }

    Alert.alert(
      '📅 Auto-remplir',
      `${joursFenos.length} andro efa misy laoka.\nInona no atao?`,
      [
        { text: 'Ajanona', style: 'cancel' },
        {
          text: 'Feno ny tsy misy laoka',
          onPress: () => autoRemplir(false),
        },
        {
          text: 'Hanova daholo',
          style: 'destructive',
          onPress: () => autoRemplir(true),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>FANDAHARAM-POTOANA</Text>
          <Text style={styles.headerTitle}>Laoka Herinandro</Text>
        </View>
        <View style={styles.headerBtns}>
          {/* Bouton auto-remplir */}
          <TouchableOpacity
            style={[styles.autoBtn, autoFilling && styles.autoBtnDisabled]}
            onPress={confirmAutoRemplir}
            disabled={autoFilling}
            activeOpacity={0.8}
          >
            <MaterialIcons name="auto-awesome" size={20} color="#ec7f13" />
          </TouchableOpacity>

          {/* Bouton ajouter */}
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/modal')}>
            <MaterialIcons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bannière auto-remplir */}
      <TouchableOpacity style={styles.autoBanner} onPress={confirmAutoRemplir} activeOpacity={0.85}>
        <MaterialIcons name="auto-awesome" size={18} color="#8b5cf6" />
        <Text style={styles.autoBannerText}>Hamenoana otomatika ny herinandro</Text>
        <MaterialIcons name="arrow-forward-ios" size={12} color="#8b5cf6" />
      </TouchableOpacity>

      <FlatList
        data={JOURS}
        keyExtractor={(item) => item}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ec7f13" />}
        contentContainerStyle={styles.list}
        renderItem={({ item: jour }) => {
          const repasDuJour = repas.filter(r => r.jour === jour);
          const estAujourdhui = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).charAt(0).toUpperCase() +
            new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).slice(1) === jour;

          return (
            <View style={[styles.jourCard, estAujourdhui && styles.jourCardToday]}>
              <View style={styles.jourHeader}>
                <View style={[styles.jourBadge, estAujourdhui && styles.jourBadgeToday]}>
                  <Text style={[styles.jourBadgeText, estAujourdhui && styles.jourBadgeTextToday]}>
                    {jour.substring(0, 3).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.jourNom}>
                    {jour} {estAujourdhui ? '· Androany' : ''}
                  </Text>
                  <Text style={styles.jourMg}>{JOURS_MG[jour]}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addJourBtn}
                  onPress={() => router.push({ pathname: '/modal', params: { jour } })}
                >
                  <MaterialIcons name="add-circle-outline" size={22} color="#ec7f13" />
                </TouchableOpacity>
              </View>

              {repasDuJour.length === 0 ? (
                <TouchableOpacity
                  style={styles.emptyJour}
                  onPress={() => router.push({ pathname: '/modal', params: { jour } })}
                >
                  <MaterialIcons name="add" size={14} color="#d1d5db" />
                  <Text style={styles.emptyText}>Tsy misy laoka napetraka</Text>
                </TouchableOpacity>
              ) : (
                repasDuJour.map(r => {
                  const img = getImg(r.nom);
                  return (
                    <View key={r.id} style={styles.repasRow}>
                      {img ? (
                        <Image source={img} style={styles.repasImg} />
                      ) : (
                        <View style={styles.repasImgPlaceholder}>
                          <MaterialIcons name="restaurant" size={16} color="#ec7f13" />
                        </View>
                      )}
                      <Text style={styles.repasNom} numberOfLines={1}>{r.nom}</Text>
                      <TouchableOpacity onPress={() => router.push({
                        pathname: '/modal',
                        params: { id: r.id, nom: r.nom, jour: r.jour, categorie: r.categorie }
                      })}>
                        <MaterialIcons name="edit" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => confirmDelete(r.id, r.nom)}>
                        <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef9f0' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerSub: { fontSize: 10, fontWeight: '800', color: '#ec7f13', letterSpacing: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
  headerBtns: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  autoBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#fef3e2', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fde68a',
  },
  autoBtnDisabled: { opacity: 0.5 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ec7f13', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ec7f13', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  autoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f5f3ff', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#ede9fe',
  },
  autoBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#7c3aed' },
  list: { padding: 16, gap: 12 },
  jourCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  jourCardToday: {
    borderWidth: 2, borderColor: '#ec7f13',
    shadowColor: '#ec7f13', shadowOpacity: 0.12,
  },
  jourHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  jourBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#fef3e2', alignItems: 'center', justifyContent: 'center',
  },
  jourBadgeToday: { backgroundColor: '#ec7f13' },
  jourBadgeText: { fontSize: 11, fontWeight: '800', color: '#ec7f13' },
  jourBadgeTextToday: { color: '#fff' },
  jourNom: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  jourMg: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  addJourBtn: { marginLeft: 'auto' },
  emptyJour: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingLeft: 4,
  },
  emptyText: { fontSize: 12, color: '#d1d5db', fontStyle: 'italic' },
  repasRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 4,
    borderTopWidth: 1, borderTopColor: '#f9fafb',
  },
  repasImg: { width: 44, height: 44, borderRadius: 10 },
  repasImgPlaceholder: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#fef3e2', alignItems: 'center', justifyContent: 'center',
  },
  repasNom: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
});