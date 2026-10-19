/** Calendario Google: OAuth + sincronizar eventos de la semana. */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { Screen, Card, Btn, Label, TopBar, useTheme, useT } from '../components/ui';
import { useNavigation } from '@react-navigation/native';
import { useStore, jobsById } from '../store';
import { SP, FONT } from '../theme/tokens';
import { startOfWeek, weekKey, parseYmd } from '../lib/dates';
import {
  useGoogleAuth,
  getToken,
  saveToken,
  clearToken,
  syncShiftEvent,
  GOOGLE_CLIENT_ID,
} from '../services/google';

export function CalendarScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation();
  const shifts = useStore((s) => s.shifts);
  const jobs = useStore((s) => s.jobs);
  const updateShift = useStore((s) => s.updateShift);

  const [clientId, setClientId] = useState(GOOGLE_CLIENT_ID);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const { request, response, promptAsync } = useGoogleAuth(clientId);

  useEffect(() => {
    getToken().then((tok) => setConnected(!!tok));
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const token = (response.params as Record<string, string>)['access_token'];
      if (token) {
        saveToken(token).then(() => setConnected(true));
      }
    }
  }, [response]);

  const sync = async () => {
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    setDone(false);
    const byId = jobsById(jobs);
    const key = weekKey(startOfWeek(new Date()));
    const inWeek = shifts.filter((s) => weekKey(parseYmd(s.fecha)) === key && s.horaSalida);
    for (const s of inWeek) {
      const eventId = await syncShiftEvent(token, s, byId[s.jobId], s.gcalEventId);
      if (eventId && eventId !== s.gcalEventId) updateShift(s.id, { gcalEventId: eventId });
    }
    setBusy(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <TopBar title={t.calendar.title} onBack={() => nav.goBack()} />
        <Card>
          <Label>{t.calendar.hint}</Label>
          {!connected ? (
            <>
              <Label>OAuth Client ID (Google Cloud Console)</Label>
              <TextInput
                value={clientId}
                onChangeText={setClientId}
                placeholder="xxxx.apps.googleusercontent.com"
                placeholderTextColor={p.text3}
                autoCapitalize="none"
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 13,
                  color: p.text,
                  backgroundColor: p.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: p.line,
                  padding: SP.md,
                  marginBottom: SP.md,
                }}
              />
              <Btn title={t.calendar.connect} onPress={() => promptAsync()} disabled={!request || !clientId} arrow />
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: SP.md }}>
                Sin Client ID la conexión no funcionará: créalo en Google Cloud Console (tipo Android) y pégalo aquí.
              </Text>
            </>
          ) : (
            <View style={{ gap: SP.md }}>
              <Text style={{ color: p.success, fontWeight: '700' }}>✓ {t.calendar.connected}</Text>
              <Btn title={busy ? '…' : t.calendar.sync} onPress={sync} disabled={busy} arrow />
              {done && <Text style={{ color: p.success, fontWeight: '600' }}>✓ {t.calendar.synced}</Text>}
              <Btn
                title={t.calendar.disconnect}
                kind="ghost"
                onPress={() => clearToken().then(() => setConnected(false))}
              />
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
