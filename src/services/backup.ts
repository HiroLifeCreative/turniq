/** Respaldo local: exportar/importar todos los datos como JSON. */
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

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

export async function importBackup(): Promise<BackupData | null> {
  if (Platform.OS === 'web') return null;
  const res = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const json = await FileSystem.readAsStringAsync(res.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const data = JSON.parse(json) as BackupData;
  if (!data || !Array.isArray(data.jobs) || !Array.isArray(data.shifts)) {
    throw new Error('invalid');
  }
  return data;
}
