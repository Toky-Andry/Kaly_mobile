import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('laoka.db');

export interface Repas {
  id: number;
  nom: string;
  jour: string;
  categorie: string;
}

export interface LaokaBiblio {
  id: number;
  nom: string;
  categorie: string;
  image?: string;
}

export interface CourseItem {
  id: number;
  nom: string;
  quantite: number;
  achete: number;
  source: string;
}

// ─── MAP image par nom de laoka ───
export const LAOKA_IMAGES: Record<string, any> = {
  'Akoho fritte': require('../assets/laoka/Akoho fritte.jpg'),
  'Akoho rony': require('../assets/laoka/Akoho rony.jpg'),
  'Akoho sy Haricot vert': require('../assets/laoka/Akoho sy Haricot vert.jpg'),
  'Akoho sy legume': require('../assets/laoka/akoho sy legume.jpg'),
  'Akoho sy sakamalao': require('../assets/laoka/Akoho sy sakamalao.jpg'),
  'Anana sy voanjo': require('../assets/laoka/anana sy voanjo.jpg'),
  'Ananambo sy ravim-bomanga': require('../assets/laoka/ananambo sy ravim-bomanga.jpg'),
  'Ati-kena sy ravim-bomanga': require('../assets/laoka/ati-kena sy ravim-bomanga.jpg'),
  'Atikena sy poirot': require('../assets/laoka/atikena sy poirot.jpg'),
  'Boulette trondro sy legume': require('../assets/laoka/Boulette trondro sy legume.jpg'),
  'Chou-fleur sy henankisoa': require('../assets/laoka/Chou-fleur sy henankisoa.jpg'),
  'Crevette sy romazava': require('../assets/laoka/crevette sy romazava.jpg'),
  "Hen'omby sy anana": require('../assets/laoka/hen\'omby sy anana.jpg'),
  'Henabaolina sy petsay': require('../assets/laoka/Henabaolina sy petsay.jpg'),
  'Henabaolina sy poivrons': require('../assets/laoka/Henabaolina sy poivrons.jpg'),
  "Henan'kisoa sy laisoa": require('../assets/laoka/henan\'kisoa sy laisoa.jpg'),
  "Henan'omby ritra": require('../assets/laoka/henan\'omby ritra.jpg'),
  'Henankisoa sy petit poids': require('../assets/laoka/Henankisoa sy petit poids.jpg'),
  'Kabaro': require('../assets/laoka/Kabaro.jpg'),
  'Katilessy': require('../assets/laoka/Katilessy.jpg'),
  "Laisoa sy hen'omby": require('../assets/laoka/laisoa sy hen\'omby.jpg'),
  'Lasopy legume': require('../assets/laoka/Lasopy legume.jpg'),
  'Legume sauté': require('../assets/laoka/legume sauté.jpg'),
  'Ovy sy patsa': require('../assets/laoka/ovy sy patsa.jpg'),
  'Ovy sy tongolo sauté': require('../assets/laoka/Ovy sy tongolo sauté.jpg'),
  'Patsa mena sy anana': require('../assets/laoka/patsa mena sy anana.jpg'),
  'Petit poid sy toto-kena': require('../assets/laoka/petit poid sy toto-kena.jpg'),
  'Ravimbomanga sy totokena': require('../assets/laoka/ravimbomanga sy totokena.jpg'),
  'Ravimbomanga sy voanjobory': require('../assets/laoka/ravimbomanga sy voanjobory.jpg'),
  'Ravitoto miaro vanio': require('../assets/laoka/Ravitoto miaro vanio.jpg'),
  'Ravitoto sy henankisoa': require('../assets/laoka/ravitoto sy henankisoa.jpg'),
  'Riz cantonais': require('../assets/laoka/riz cantonais.jpg'),
  'Saosisy sy courgette': require('../assets/laoka/Saosisy sy courgette.jpg'),
  'Saosisy sy haricot vert': require('../assets/laoka/Saosisy sy haricot vert.jpg'),
  'Saucette sy patsa be': require('../assets/laoka/saucette sy patsa be.jpg'),
  'Saucisse fumé sy ovy': require('../assets/laoka/saucisse fumé sy ovy.jpg'),
  "Sosety sy hen'omby": require('../assets/laoka/sosety sy hen\'omby.jpg'),
  'Tongokisoa sy poireaux': require('../assets/laoka/Tongokisoa sy poireaux.jpg'),
  'Totokena sy legume': require('../assets/laoka/Totokena sy legume.jpg'),
  'Tottokena sy poivrons': require('../assets/laoka/Tottokena sy poivrons.jpg'),
  'Trondro fritte': require('../assets/laoka/trondro fritte.jpg'),
  'Trondro sauce sy tongolo gasy': require('../assets/laoka/Trondro sauce sy tongolo gasy.jpg'),
  'Trondro sy tsaramaso ritra': require('../assets/laoka/trondro sy tsaramaso ritra.jpg'),
  'Tsaramaso rony': require('../assets/laoka/Tsaramaso rony.jpg'),
  'Tsaramaso sy totokena': require('../assets/laoka/tsaramaso sy totokena.jpg'),
  'Tsiasisa rony': require('../assets/laoka/tsiasisa rony.jpg'),
  "Voatavo sy hen'omby": require('../assets/laoka/Voatavo sy hen\'omby.jpg'),
  'Voatavo sy tsaramaso': require('../assets/laoka/Voatavo sy tsaramaso.jpg'),
  "Votavo sy hen'omby": require('../assets/laoka/Votavo sy hen\'omby.jpg'),
};

// ─── Clé AsyncStorage images custom ───
export const CUSTOM_IMAGES_KEY = 'custom_laoka_images';

export async function getCustomImages(): Promise<Record<string, string>> {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_IMAGES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// Retourne la bonne image pour un nom donné (custom > défaut > null)
export async function getImageForNom(nom: string): Promise<any> {
  const custom = await getCustomImages();
  if (custom[nom]) return { uri: custom[nom] };
  if (LAOKA_IMAGES[nom]) return LAOKA_IMAGES[nom];
  return null;
}

const LAOKA_DEFAUT = Object.keys(LAOKA_IMAGES);

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS repas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      jour TEXT NOT NULL,
      categorie TEXT DEFAULT 'gasy'
    );
    CREATE TABLE IF NOT EXISTS biblio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      categorie TEXT DEFAULT 'gasy'
    );
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      quantite INTEGER DEFAULT 1,
      achete INTEGER DEFAULT 0,
      source TEXT DEFAULT 'manuel'
    );
    CREATE TABLE IF NOT EXISTS meta (
      cle TEXT PRIMARY KEY,
      valeur TEXT
    );
  `);

  const done = db.getFirstSync("SELECT valeur FROM meta WHERE cle = 'biblio_init'") as any;
  if (!done) {
    LAOKA_DEFAUT.forEach(nom => {
      db.runSync('INSERT INTO biblio (nom, categorie) VALUES (?, ?)', [nom, 'gasy']);
    });
    db.runSync("INSERT INTO meta (cle, valeur) VALUES ('biblio_init', '1')");
  }
}

// ─── REPAS ───
export function getAllRepas(): Repas[] {
  return db.getAllSync('SELECT * FROM repas ORDER BY id DESC') as Repas[];
}
export function addRepas(nom: string, jour: string, categorie: string): void {
  db.runSync('INSERT INTO repas (nom, jour, categorie) VALUES (?, ?, ?)', [nom, jour, categorie]);
}
export function updateRepas(id: number, nom: string, jour: string, categorie: string): void {
  db.runSync('UPDATE repas SET nom = ?, jour = ?, categorie = ? WHERE id = ?', [nom, jour, categorie, id]);
}
export function deleteRepas(id: number): void {
  db.runSync('DELETE FROM repas WHERE id = ?', [id]);
}

// ─── BIBLIO ───
export function getAllBiblio(): LaokaBiblio[] {
  return db.getAllSync('SELECT * FROM biblio ORDER BY nom ASC') as LaokaBiblio[];
}
export function addBiblio(nom: string, categorie: string): void {
  db.runSync('INSERT INTO biblio (nom, categorie) VALUES (?, ?)', [nom, categorie]);
}
export function updateBiblio(id: number, nom: string, categorie: string): void {
  db.runSync('UPDATE biblio SET nom = ?, categorie = ? WHERE id = ?', [nom, categorie, id]);
}
export function deleteBiblio(id: number): void {
  db.runSync('DELETE FROM biblio WHERE id = ?', [id]);
}

// ─── COURSES ───
export function getAllCourses(): CourseItem[] {
  const rows = db.getAllSync('SELECT * FROM courses ORDER BY achete ASC, id DESC') as any[];
  return rows.map(r => ({ ...r, quantite: Number(r.quantite) || 1 }));
}
export function addCourse(nom: string, quantite: number, source: string): void {
  db.runSync('INSERT INTO courses (nom, quantite, source) VALUES (?, ?, ?)', [nom, quantite, source]);
}
export function toggleCourse(id: number, achete: number): void {
  db.runSync('UPDATE courses SET achete = ? WHERE id = ?', [achete ? 0 : 1, id]);
}
export function updateCourseQuantite(id: number, quantite: number): void {
  db.runSync('UPDATE courses SET quantite = ? WHERE id = ?', [Math.floor(Number(quantite)), id]);
}
export function deleteCourse(id: number): void {
  db.runSync('DELETE FROM courses WHERE id = ?', [id]);
}
export function clearCourses(): void {
  db.runSync('DELETE FROM courses');
}
export function clearAchetes(): void {
  db.runSync('DELETE FROM courses WHERE achete = 1');
}