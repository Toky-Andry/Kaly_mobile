import { addBiblio, deleteBiblio, getAllBiblio, LAOKA_IMAGES, LaokaBiblio, updateBiblio } from '@/hooks/useDatabase';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CUSTOM_IMAGES_KEY = 'custom_laoka_images';

export default function Biblio() {
  const [liste, setListe] = useState<LaokaBiblio[]>([]);
  const [nom, setNom] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editNom, setEditNom] = useState('');
  const [customImages, setCustomImages] = useState<Record<string, string>>({});

  // Charger images custom depuis AsyncStorage au démarrage
  useEffect(() => {
    AsyncStorage.getItem(CUSTOM_IMAGES_KEY).then(data => {
      if (data) setCustomImages(JSON.parse(data));
    });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  function load() { setListe(getAllBiblio()); }

  async function saveCustomImages(images: Record<string, string>) {
    setCustomImages(images);
    await AsyncStorage.setItem(CUSTOM_IMAGES_KEY, JSON.stringify(images));
  }

  function handleAdd() {
    if (!nom.trim()) { Alert.alert('Diso', 'Soraty ny anarana ny laoka!'); return; }
    addBiblio(nom.trim(), 'gasy');
    setNom('');
    load();
  }

  function handleEdit() {
    if (!editNom.trim()) return;
    if (editId !== null) {
      const ancien = liste.find(l => l.id === editId)?.nom;
      if (ancien && customImages[ancien] && editNom !== ancien) {
        const next = { ...customImages, [editNom]: customImages[ancien] };
        delete next[ancien];
        saveCustomImages(next);
      }
    }
    updateBiblio(editId!, editNom.trim(), 'gasy');
    setEditId(null);
    setEditNom('');
    load();
  }

  function confirmDelete(id: number, nom: string) {
    Alert.alert('Fafana', `Hofafana ve "${nom}"?`, [
      { text: 'Tsia', style: 'cancel' },
      { text: 'Eny', style: 'destructive', onPress: () => { deleteBiblio(id); load(); } },
    ]);
  }

  async function pickImage(nomLaoka: string) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Tsy azo atao', 'Mila alalana haka sary!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const next = { ...customImages, [nomLaoka]: result.assets[0].uri };
      await saveCustomImages(next);
      Alert.alert('✅ Vita!', `Sary novan'ny "${nomLaoka}" vita!`);
    }
  }

  function getImage(nom: string): any {
    if (customImages[nom]) return { uri: customImages[nom] };
    if (LAOKA_IMAGES[nom]) return LAOKA_IMAGES[nom];
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>TAHIRY NY LAOKA</Text>
        <Text style={styles.headerTitle}>Lisitry ny Laoka</Text>
      </View>

      <View style={styles.addBox}>
        <TextInput
          style={styles.input}
          placeholder="Anarana ny laoka vaovao..."
          placeholderTextColor="#d1d5db"
          value={nom}
          onChangeText={setNom}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <MaterialIcons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.counter}>{liste.length} laoka ao amin'ny tahiry</Text>

      <FlatList
        data={liste}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="restaurant-menu" size={48} color="#e5e7eb" />
            <Text style={styles.emptyText}>Tsy misy laoka mbola napetraka</Text>
          </View>
        }
        renderItem={({ item }) => {
          const img = getImage(item.nom);
          const hasDefault = !!LAOKA_IMAGES[item.nom];
          const hasCustom = !!customImages[item.nom];

          return (
            <View style={styles.item}>
              {editId === item.id ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={editNom}
                    onChangeText={setEditNom}
                    autoFocus
                    onSubmitEditing={handleEdit}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={handleEdit} style={styles.editSaveBtn}>
                    <MaterialIcons name="check" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditId(null)} style={styles.editCancelBtn}>
                    <MaterialIcons name="close" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.itemRow}>
                  {/* Image — cliquable seulement si pas d'image par défaut OU pour remplacer */}
                  <TouchableOpacity
                    onPress={() => pickImage(item.nom)}
                    style={styles.imgWrapper}
                    activeOpacity={0.8}
                  >
                    {img ? (
                      <Image source={img} style={styles.itemImg} />
                    ) : (
                      <View style={styles.itemImgPlaceholder}>
                        <MaterialIcons name="add-a-photo" size={22} color="#ec7f13" />
                      </View>
                    )}

                    {/* Icône caméra — toujours visible pour changer */}
                    <View style={styles.imgOverlay}>
                      <MaterialIcons name="camera-alt" size={10} color="#fff" />
                    </View>

                    {/* Badge vert UNIQUEMENT si image custom ajoutée par user */}
                    {hasCustom && (
                      <View style={styles.customBadge}>
                        <MaterialIcons name="check" size={8} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemNom} numberOfLines={1}>{item.nom}</Text>
                    {/* Indication sous le nom */}
                    {!hasDefault && !hasCustom && (
                      <Text style={styles.itemHint}>Tsindrio sary hanampy sary</Text>
                    )}
                  </View>

                  <TouchableOpacity onPress={() => { setEditId(item.id); setEditNom(item.nom); }} style={styles.iconBtn}>
                    <MaterialIcons name="edit" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(item.id, item.nom)} style={styles.iconBtn}>
                    <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
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
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerSub: { fontSize: 10, fontWeight: '800', color: '#ec7f13', letterSpacing: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
  addBox: {
    flexDirection: 'row', gap: 10, padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  input: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#1f2937', borderWidth: 1.5, borderColor: '#f3f4f6',
  },
  addBtn: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: '#ec7f13', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ec7f13', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  counter: { fontSize: 12, color: '#9ca3af', fontWeight: '600', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  list: { padding: 16, gap: 8 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#9ca3af' },
  item: {
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 12 },
  imgWrapper: { position: 'relative' },
  itemImg: { width: 52, height: 52, borderRadius: 12 },
  itemImgPlaceholder: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: '#fef3e2', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fde68a', borderStyle: 'dashed',
  },
  imgOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#ec7f13', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  customBadge: {
    position: 'absolute', top: 0, left: 0,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  itemInfo: { flex: 1 },
  itemNom: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  itemHint: { fontSize: 10, color: '#d1d5db', marginTop: 2, fontStyle: 'italic' },
  iconBtn: { padding: 6 },
  editRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8 },
  editInput: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: 10, padding: 10,
    fontSize: 15, color: '#1f2937', borderWidth: 1.5, borderColor: '#ec7f13',
  },
  editSaveBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ec7f13', alignItems: 'center', justifyContent: 'center',
  },
  editCancelBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
  },
});