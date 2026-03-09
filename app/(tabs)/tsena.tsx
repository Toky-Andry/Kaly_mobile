import {
  addCourse, clearAchetes, clearCourses,
  CourseItem, deleteCourse, getAllCourses,
  getAllRepas, toggleCourse, updateCourseQuantite
} from '@/hooks/useDatabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Tsena() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [nom, setNom] = useState('');

  useFocusEffect(useCallback(() => { load(); }, []));

  function load() { setCourses(getAllCourses()); }

  function handleAdd() {
    if (!nom.trim()) { Alert.alert('Diso', 'Soraty ny anarana!'); return; }
    addCourse(nom.trim(), 1, 'manuel');
    setNom('');
    load();
  }

  function handleToggle(item: CourseItem) { toggleCourse(item.id, item.achete); load(); }

  function handleQte(id: number, qte: number) {
    const newQte = Math.max(1, Math.floor(Number(qte)));
    updateCourseQuantite(id, newQte);
    load();
  }

  function handleDelete(id: number, nom: string) {
    Alert.alert('Fafana', `Hofafana ve "${nom}"?`, [
      { text: 'Tsia', style: 'cancel' },
      { text: 'Eny', style: 'destructive', onPress: () => { deleteCourse(id); load(); } },
    ]);
  }

  function genererDepuisRepas() {
    Alert.alert('Mamorona Lista', "Hamorona lista avy amin'ny laoka herinandro ve?", [
      { text: 'Tsia', style: 'cancel' },
      {
        text: 'Eny', onPress: () => {
          const repas = getAllRepas();
          if (repas.length === 0) {
            Alert.alert('Tsy misy laoka', "Manampia laoka amin'ny fandaharam-potoana aloha!");
            return;
          }
          repas.forEach(r => addCourse(r.nom, 1, 'auto'));
          load();
        }
      },
    ]);
  }

  function handleClearAchetes() {
    Alert.alert('Fafana', 'Hofafana ny rehetra voividiana?', [
      { text: 'Tsia', style: 'cancel' },
      { text: 'Eny', style: 'destructive', onPress: () => { clearAchetes(); load(); } },
    ]);
  }

  function handleClearAll() {
    Alert.alert('Fafana rehetra', 'Hofafana ny lista manontolo?', [
      { text: 'Tsia', style: 'cancel' },
      { text: 'Eny', style: 'destructive', onPress: () => { clearCourses(); load(); } },
    ]);
  }

  // ─── PARTAGE WHATSAPP ───
  function construireMessage(): string {
    if (courses.length === 0) return '';

    const nonAchetes = courses.filter(c => c.achete === 0);
    const achetes = courses.filter(c => c.achete === 1);

    let msg = '🛒 *Lisitry ny Tsena — Laoka Herinandro*\n';
    msg += `📅 ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}\n\n`;

    if (nonAchetes.length > 0) {
      msg += '📋 *Sisa hividianana :*\n';
      nonAchetes.forEach(c => {
        msg += `▫️ ${c.nom}${c.quantite > 1 ? ` × ${c.quantite}` : ''}\n`;
      });
    }

    if (achetes.length > 0) {
      msg += '\n✅ *Voividiana sahady :*\n';
      achetes.forEach(c => {
        msg += `✓ ~${c.nom}~\n`;
      });
    }

    msg += `\n_Nalefa avy amin'ny app Laoka Herinandro_ 🍛`;
    return msg;
  }

  async function partagerWhatsApp() {
    if (courses.length === 0) {
      Alert.alert('Tsy misy', 'Tsy misy zavatra ao amin\'ny lista!');
      return;
    }

    const message = construireMessage();
    const encoded = encodeURIComponent(message);
    const url = `whatsapp://send?text=${encoded}`;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // WhatsApp pas installé → partage natif
      await Share.share({ message });
    }
  }

  async function partagerAutre() {
    if (courses.length === 0) {
      Alert.alert('Tsy misy', "Tsy misy zavatra ao amin'ny lista!");
      return;
    }
    const message = construireMessage();
    await Share.share({
      message,
      title: 'Lisitry ny Tsena',
    });
  }

  function afficherOptions() {
    if (courses.length === 0) {
      Alert.alert('Tsy misy', "Tsy misy zavatra ao amin'ny lista!");
      return;
    }
    Alert.alert(
      '📤 Hizara ny Lista',
      'Aiza no hizarana?',
      [
        { text: 'Ajanona', style: 'cancel' },
        {
          text: '💬 WhatsApp',
          onPress: partagerWhatsApp,
        },
        {
          text: '📤 Hafa (SMS, Email...)',
          onPress: partagerAutre,
        },
      ]
    );
  }

  const nonAchetes = courses.filter(c => c.achete === 0);
  const achetes = courses.filter(c => c.achete === 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>FIVIDIANANA</Text>
          <Text style={styles.headerTitle}>Lisitry ny Tsena</Text>
        </View>
        <View style={styles.headerActions}>
          {/* Bouton partage WhatsApp */}
          {courses.length > 0 && (
            <TouchableOpacity style={styles.whatsappBtn} onPress={afficherOptions}>
              <MaterialIcons name="share" size={18} color="#fff" />
            </TouchableOpacity>
          )}
          {achetes.length > 0 && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleClearAchetes}>
              <MaterialIcons name="done-all" size={20} color="#10b981" />
            </TouchableOpacity>
          )}
          {courses.length > 0 && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleClearAll}>
              <MaterialIcons name="delete-sweep" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bannière partage si liste non vide */}
      {courses.length > 0 && (
        <TouchableOpacity style={styles.shareBanner} onPress={afficherOptions} activeOpacity={0.85}>
          <View style={styles.shareBannerIcon}>
            <Text style={{ fontSize: 18 }}>💬</Text>
          </View>
          <View style={styles.shareBannerText}>
            <Text style={styles.shareBannerTitle}>Izara ny lista</Text>
            <Text style={styles.shareBannerSub}>WhatsApp, SMS, Email...</Text>
          </View>
          <View style={[styles.shareBadge, nonAchetes.length > 0 && styles.shareBadgeActive]}>
            <Text style={styles.shareBadgeText}>{nonAchetes.length} sisa</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Auto-générer */}
      <TouchableOpacity style={styles.autoBtn} onPress={genererDepuisRepas}>
        <View style={styles.autoBtnIcon}>
          <MaterialIcons name="auto-awesome" size={18} color="#ec7f13" />
        </View>
        <Text style={styles.autoBtnText}>Mamorona avy amin'ny laoka herinandro</Text>
        <MaterialIcons name="arrow-forward-ios" size={14} color="#ec7f13" />
      </TouchableOpacity>

      {/* Form ajouter */}
      <View style={styles.addBox}>
        <TextInput
          style={styles.inputNom}
          placeholder="Manampy zavatra..."
          placeholderTextColor="#d1d5db"
          value={nom}
          onChangeText={setNom}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addBtnStyle} onPress={handleAdd}>
          <MaterialIcons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats + progress */}
      {courses.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statNum}>{nonAchetes.length}</Text>
            <Text style={styles.statLabel}>sisa</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {
              width: courses.length > 0 ? `${(achetes.length / courses.length) * 100}%` : '0%'
            }]} />
          </View>
          <View style={styles.statBadge}>
            <Text style={[styles.statNum, { color: '#10b981' }]}>{achetes.length}</Text>
            <Text style={styles.statLabel}>vita</Text>
          </View>
        </View>
      )}

      <FlatList
        data={courses}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="shopping-cart" size={56} color="#e5e7eb" />
            <Text style={styles.emptyText}>Tsy misy ao amin'ny lista</Text>
            <Text style={styles.emptySubText}>Tsindrio ny bokotra etsy ambony hamorona lista</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.item, item.achete === 1 && styles.itemDone]}>
            {/* Checkbox */}
            <TouchableOpacity
              style={[styles.checkbox, item.achete === 1 && styles.checkboxDone]}
              onPress={() => handleToggle(item)}
            >
              {item.achete === 1 && <MaterialIcons name="check" size={14} color="#fff" />}
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.itemInfo}>
              <Text style={[styles.itemNom, item.achete === 1 && styles.itemNomDone]} numberOfLines={1}>
                {item.nom}
              </Text>
              {item.source === 'auto' && (
                <View style={styles.autoBadge}>
                  <Text style={styles.autoBadgeText}>auto</Text>
                </View>
              )}
            </View>

            {/* Quantité */}
            <View style={styles.qteRow}>
              <TouchableOpacity style={styles.qteBtn} onPress={() => handleQte(item.id, item.quantite - 1)}>
                <MaterialIcons name="remove" size={14} color="#ec7f13" />
              </TouchableOpacity>
              <Text style={styles.qteNum}>{item.quantite}</Text>
              <TouchableOpacity style={[styles.qteBtn, styles.qteBtnPlus]} onPress={() => handleQte(item.id, item.quantite + 1)}>
                <MaterialIcons name="add" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Delete */}
            <TouchableOpacity onPress={() => handleDelete(item.id, item.nom)} style={styles.deleteBtn}>
              <MaterialIcons name="close" size={16} color="#d1d5db" />
            </TouchableOpacity>
          </View>
        )}
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
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  whatsappBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#25d366', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#25d366', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  shareBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f0fdf4', marginHorizontal: 16, marginTop: 14,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#bbf7d0',
  },
  shareBannerIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center',
  },
  shareBannerText: { flex: 1 },
  shareBannerTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
  shareBannerSub: { fontSize: 11, color: '#16a34a', marginTop: 1 },
  shareBadge: {
    backgroundColor: '#d1fae5', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  shareBadgeActive: { backgroundColor: '#ec7f13' },
  shareBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  autoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#fde68a',
    shadowColor: '#ec7f13', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  autoBtnIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#fef3e2', alignItems: 'center', justifyContent: 'center',
  },
  autoBtnText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#92400e' },
  addBox: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14,
  },
  inputNom: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#1f2937', borderWidth: 1.5, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  addBtnStyle: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: '#ec7f13', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ec7f13', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 8,
  },
  statBadge: { alignItems: 'center', minWidth: 32 },
  statNum: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  statLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
  progressBar: {
    flex: 1, height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#9ca3af' },
  emptySubText: { fontSize: 13, color: '#d1d5db', textAlign: 'center', paddingHorizontal: 20 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  itemDone: { opacity: 0.55 },
  checkbox: {
    width: 26, height: 26, borderRadius: 8,
    borderWidth: 2, borderColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  itemInfo: { flex: 1, gap: 3 },
  itemNom: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  itemNomDone: { textDecorationLine: 'line-through', color: '#9ca3af' },
  autoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3e2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
  },
  autoBadgeText: { fontSize: 10, fontWeight: '700', color: '#ec7f13' },
  qteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qteBtn: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#fef3e2', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#fde68a',
  },
  qteBtnPlus: { backgroundColor: '#ec7f13', borderColor: '#ec7f13' },
  qteNum: { fontSize: 14, fontWeight: '800', color: '#1f2937', minWidth: 20, textAlign: 'center' },
  deleteBtn: { padding: 4 },
});
