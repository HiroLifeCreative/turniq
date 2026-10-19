/** Pantalla de bloqueo por PIN (+ biometría opcional). */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Screen, H1, Label, useTheme, useT } from '../components/ui';
import { useStore } from '../store';
import { SP, R, FONT } from '../theme/tokens';

export function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const t = useT();
  const p = useTheme();
  const pin = useStore((s) => s.settings.pin) ?? '';
  const biometrico = useStore((s) => s.settings.biometrico);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const tryBiometric = async () => {
    if (Platform.OS === 'web' || !biometrico) return;
    try {
      const LA = require('expo-local-authentication') as typeof import('expo-local-authentication');
      const has = await LA.hasHardwareAsync();
      const enrolled = await LA.isEnrolledAsync();
      if (has && enrolled) {
        const res = await LA.authenticateAsync({ promptMessage: t.pin.title });
        if (res.success) onUnlock();
      }
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    if (biometrico) void tryBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const press = (d: string) => {
    const next = (input + d).slice(0, 4);
    setInput(next);
    setError(false);
    if (next.length === 4) {
      if (next === pin) {
        setInput('');
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setInput(''), 400);
      }
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SP.xxl }}>
        <Text style={{ fontFamily: FONT.headBold, fontSize: 40, color: p.primary, marginBottom: SP.md }}>Turniq</Text>
        <H1 style={{ fontSize: 22, marginBottom: SP.sm }}>{t.pin.enter}</H1>
        <View style={{ flexDirection: 'row', gap: SP.md, marginVertical: SP.xl }}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: input.length > i ? p.primary : p.surface,
                borderWidth: 1,
                borderColor: error ? p.danger : p.line,
              }}
            />
          ))}
        </View>
        {error && <Text style={{ color: p.danger, marginBottom: SP.md }}>{t.pin.wrong}</Text>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280 }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
            <TouchableOpacity
              key={i}
              disabled={k === ''}
              onPress={() => (k === '⌫' ? setInput((v) => v.slice(0, -1)) : press(k))}
              style={{
                width: 84,
                height: 64,
                borderRadius: R.lg,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: k === '' ? 0 : 1,
              }}
            >
              <Text style={{ fontSize: 26, color: p.text, fontFamily: FONT.head }}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {biometrico && Platform.OS !== 'web' && (
          <TouchableOpacity onPress={tryBiometric} style={{ marginTop: SP.xl }}>
            <Label style={{ textAlign: 'center' }}>{t.pin.useBiometric}</Label>
          </TouchableOpacity>
        )}
      </View>
    </Screen>
  );
}
