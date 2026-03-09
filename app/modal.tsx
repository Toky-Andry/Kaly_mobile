import { addRepas, getAllBiblio, LaokaBiblio, updateRepas } from '@/hooks/useDatabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const JOURS_MG: Record<string, string> = {
  'Lundi': 'Alatsinainy', 'Mardi': 'Talata', 'Mercredi': 'Alarobia',
  'Jeudi': 'Alakamisy', 'Vendredi': 'Zoma', 'Samedi': 'Sabotsy', 'Dimanche': 'Alahady',
};

export default function Modal() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const isEdit = !!params.id;
  const [nom, setNom] = useState(params.nom as string || '');
  const [jourChoisi, setJourChoisi] = useState(params.jour as string || 'Lundi');
  const [biblio, setBiblio] = useState<LaokaBiblio[]>([]);
  const [recherche, setRecherche] = useState('');

  useFocusEffect(useCallback(() => {
    setBiblio(getAllBiblio());
  }, []));

  const biblioFiltre = biblio.filter(b =>
    b.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  function handleSave() {
    if (!nom.trim()) {
      Alert.alert('Diso', 'Soraty ny anarana ny laoka!');
      return;
    }
    if (isEdit) {
      updateRepas(Number(params.id), nom.trim(), jourChoisi, 'gasy');
    } else {
      addRepas(nom.trim(), jourChoisi, 'gasy');
    }
    router.back();
  }

  function selectFromBiblio(item: LaokaBiblio) {
    setNom(item.nom);
    setRecherche('');
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Hanova Laoka' : 'Hanampy Laoka'}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Tehirizo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Choix du jour */}
        <Text style={styles.label}>📅 Andro</Text>
        <View style={styles.joursGrid}>
          {JOURS.map(jour => (
            <TouchableOpacity
              key={jour}
              style={[styles.jourBtn, jourChoisi === jour && styles.jourBtnActive]}
              onPress={() => setJourChoisi(jour)}
            >
              <Text style={[styles.jourBtnText, jourChoisi === jour && styles.jourBtnTextActive]}>
                {jour}
              </Text>
              <Text style={[styles.jourBtnMg, jourChoisi === jour && styles.jourBtnMgActive]}>
                {JOURS_MG[jour]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nom manuel */}
        <Text style={styles.label}>🍽️ Anarana ny Laoka</Text>
        <TextInput
          style={styles.input}
          placeholder="Soraty na safidio eto ambany..."
          placeholderTextColor="#d1d5db"
          value={nom}
          onChangeText={setNom}
        />

        {/* Recherche biblio */}
        <Text style={styles.label}>📚 Safidio avy amin'ny Tahiry</Text>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Hikaroka laoka..."
            placeholderTextColor="#d1d5db"
            value={recherche}
            onChangeText={setRecherche}
          />
        </View>

        {/* Liste biblio */}
        {biblio.length === 0 ? (
          <View style={styles.emptyBiblio}>
            <MaterialIcons name="info-outline" size={20} color="#d1d5db" />
            <Text style={styles.emptyBiblioText}>
              Tsy misy laoka ao amin'ny tahiry.{'\n'}Manampia amin'ny tab "Laoka" aloha!
            </Text>
          </View>
        ) : (
          <View style={styles.biblioList}>
            {(recherche ? biblioFiltre : biblio).map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.biblioItem, nom === item.nom && styles.biblioItemActive]}
                onPress={() => selectFromBiblio(item)}
              >
                <MaterialIcons
                  name="restaurant"
                  size={16}
                  color={nom === item.nom ? '#fff' : '#ec7f13'}
                />
                <Text style={[styles.biblioItemText, nom === item.nom && styles.biblioItemTextActive]}>
                  {item.nom}
                </Text>
                {nom === item.nom && (
                  <MaterialIcons name="check" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bouton principal */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.mainBtn} onPress={handleSave}>
          <MaterialIcons name={isEdit ? 'check' : 'add'} size={22} color="#fff" />
          <Text style={styles.mainBtnText}>
            {isEdit ? 'Hanova' : 'Hanampy'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef9f0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  saveBtn: {
    backgroundColor: '#fef3e2', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  saveBtnText: { color: '#ec7f13', fontWeight: '700', fontSize: 14 },
  content: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  input: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    fontSize: 16, color: '#1f2937', fontWeight: '500',
    borderWidth: 1.5, borderColor: '#f3f4f6',
  },
  joursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  jourBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#f3f4f6',
    alignItems: 'center', minWidth: '30%',
  },
  jourBtnActive: { backgroundColor: '#ec7f13', borderColor: '#ec7f13' },
  jourBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  jourBtnTextActive: { color: '#fff' },
  jourBtnMg: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  jourBtnMgActive: { color: '#fff9' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: '#f3f4f6',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1f2937' },
  emptyBiblio: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginTop: 4,
  },
  emptyBiblioText: { fontSize: 13, color: '#9ca3af', flex: 1, lineHeight: 20 },
  biblioList: { gap: 8, marginTop: 4 },
  biblioItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#f3f4f6',
  },
  biblioItemActive: { backgroundColor: '#ec7f13', borderColor: '#ec7f13' },
  biblioItemText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1f2937' },
  biblioItemTextActive: { color: '#fff' },
  footer: { padding: 20, paddingBottom: 36, backgroundColor: '#fef9f0' },
  mainBtn: {
    backgroundColor: '#ec7f13', borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#ec7f13', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  mainBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});