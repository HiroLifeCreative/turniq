/**
 * Plugin propio: sistema de ALARMA real para los avisos de turno.
 * En cada `expo prebuild`:
 *  1. Copia el módulo Kotlin (setAlarmClock + receiver con
 *     full-screen intent) al proyecto Android generado.
 *  2. Registra el paquete en MainApplication.
 *  3. AndroidManifest: permisos (USE_FULL_SCREEN_INTENT, WAKE_LOCK,
 *     VIBRATE), el receiver, y MainActivity con showWhenLocked +
 *     turnScreenOn para que la alarma prenda la pantalla.
 */
const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
  createRunOncePlugin,
} = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const PKG = 'com.hirolifecreative.turniq.alarm';
const KT_FILES = ['TurniqAlarmModule.kt', 'AlarmReceiver.kt', 'TurniqAlarmPackage.kt'];
const PERMISSIONS = [
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.WAKE_LOCK',
  'android.permission.VIBRATE',
];

function withAlarmSources(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const srcDir = path.join(projectRoot, 'plugins', 'alarm');
      const destDir = path.join(
        projectRoot,
        'android', 'app', 'src', 'main', 'java',
        'com', 'hirolifecreative', 'turniq', 'alarm',
      );
      fs.mkdirSync(destDir, { recursive: true });
      for (const f of KT_FILES) {
        fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
      }
      return cfg;
    },
  ]);
}

function withAlarmPackage(config) {
  return withMainApplication(config, (cfg) => {
    const contents = cfg.modResults.contents;
    if (contents.includes('TurniqAlarmPackage')) return cfg;
    const anchor = 'Packages that cannot be autolinked yet can be added manually here';
    const idx = contents.indexOf(anchor);
    if (idx === -1) {
      throw new Error('[withTurniqAlarm] No se encontró el ancla en MainApplication');
    }
    const lineEnd = contents.indexOf('\n', idx);
    cfg.modResults.contents =
      contents.slice(0, lineEnd + 1) +
      `      add(${PKG}.TurniqAlarmPackage())\n` +
      contents.slice(lineEnd + 1);
    return cfg;
  });
}

function withAlarmManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Permisos
    const perms = (manifest['uses-permission'] ??= []);
    for (const name of PERMISSIONS) {
      if (!perms.some((p) => p.$['android:name'] === name)) {
        perms.push({ $: { 'android:name': name } });
      }
    }

    const app = manifest.application[0];

    // Receiver de la alarma
    const receivers = (app.receiver ??= []);
    if (!receivers.some((r) => r.$['android:name'] === `${PKG}.AlarmReceiver`)) {
      receivers.push({
        $: {
          'android:name': `${PKG}.AlarmReceiver`,
          'android:exported': 'false',
          'android:enabled': 'true',
        },
      });
    }

    // MainActivity: mostrar sobre la pantalla de bloqueo y prenderla
    const main = (app.activity ?? []).find((a) => a.$['android:name'] === '.MainActivity');
    if (main) {
      main.$['android:showWhenLocked'] = 'true';
      main.$['android:turnScreenOn'] = 'true';
    }
    return cfg;
  });
}

const withTurniqAlarm = (config) => withAlarmManifest(withAlarmPackage(withAlarmSources(config)));

module.exports = createRunOncePlugin(withTurniqAlarm, 'with-turniq-alarm', '1.0.0');
