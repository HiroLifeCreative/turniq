/** Calendario Google: conexión + sincronización de eventos.
 * Con la cuenta conectada, los turnos se sincronizan SOLOS al crear,
 * editar o borrar (ver services/googleSync.ts). El botón sincroniza
 * todo de una vez (primer uso o reparación). */
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ContentSheet, Screen, Card, Btn, Label, TopBar, useTheme, useT } from '../components/ui';
import { GooglePendingCard, GoogleConnectCard, useGoogleConnection } from '../components/GoogleConnect';
import { useNavigation } from '@react-navigation/native';
import { SP } from '../theme/tokens';
import { syncAllShifts } from '../services/googleSync';

export function CalendarScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation();
  const { configured, connected, connect, disconnect } = useGoogleConnection();
  const [busy, setBusy] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');

  const syncAll = async () => {
    setBusy(true);
    setDoneMsg('');
    const n = await syncAllShifts();
    setBusy(false);
    setDoneMsg(`✓ ${t.calendar.synced} (${n})`);
    setTimeout(() => setDoneMsg(''), 4000);
  };

  return (
    <Screen banded>
      <TopBar onDark title={t.calendar.title} onBack={() => nav.goBack()} />
      <ContentSheet>
        <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
          {!configured ? (
            <GooglePendingCard />
          ) : connected ? (
            <Card>
              <Text style={{ color: p.success, fontWeight: '700', marginBottom: SP.md }}>✓ {t.calendar.connected}</Text>
              <Label>{t.calendar.hint}</Label>
              <View style={{ gap: SP.md }}>
                <Btn title={busy ? '…' : t.calendar.sync} onPress={syncAll} disabled={busy} arrow />
                {doneMsg ? <Text style={{ color: p.success, fontWeight: '600' }}>{doneMsg}</Text> : null}
                <Btn title={t.google.disconnect} kind="ghost" onPress={disconnect} />
              </View>
            </Card>
          ) : (
            <GoogleConnectCard hint={t.calendar.hint} onConnect={connect} />
          )}
        </ScrollView>
      </ContentSheet>
    </Screen>
  );
}
