/** Respaldo local: exportar/importar todos los datos como JSON. */
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { normalizeBackup, type NormalizedBackup } from './backupConvert';

export interface BackupData {
  version: 1;
  exportedAt: string;
  jobs: unknown[];
  shifts: unknown[];
  templates: unknown[];
  settings: unknown;
}

export async function exportBackup(data: BackupData): Promise<void> {
  if (Platform.OS === 'web') return;
  const json = JSON.stringify(data, null, 2);
  const path = `${FileSystem.cacheDirectory}turniq-backup-${data.exportedAt.slice(0, 10)}.json`;
  await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(path, { mimeType: 'application/json' });
  } else {
    Alert.alert('Turniq', path);
  }
}

export async function importBackup(): Promise<NormalizedBackup | null> {
  if (Platform.OS === 'web') return null;
  const res = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const json = await FileSystem.readAsStringAsync(res.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const raw = JSON.parse(json) as BackupData;
  // Acepta respaldos de Turniq y de la app anterior (Mis Horarios, convertidos aquí).
  const data = normalizeBackup(raw);
  if (!data) throw new Error('invalid');
  return data;
}
