/** Gmail: lista correos de nómina como referencia de cobros. */
import React, { useState } from 'react';
import {  View, Text, ScrollView } from 'react-native';
import { ContentSheet,  Screen, Card, Btn, Label, TopBar, useTheme, useT } from '../components/ui';
import { useNavigation } from '@react-navigation/native';
import { SP, FONT } from '../theme/tokens';
import { getToken, fetchPayrollEmails, type GmailMsg } from '../services/google';

export function GmailScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation();
  const [msgs, setMsgs] = useState<GmailMsg[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await getToken();
      if (!token) {
        setError(true);
        return;
      }
      const list = await fetchPayrollEmails(token);
      setMsgs(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen banded>
      <TopBar onDark title={t.gmail.title} onBack={() => nav.goBack()} />
      <ContentSheet>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <Card style={{ marginBottom: SP.md }}>
          <Label>{t.gmail.hint}</Label>
          <Btn title={loading ? '…' : t.gmail.connect} onPress={load} disabled={loading} arrow />
        </Card>

        {error && (
          <Card>
            <Text style={{ color: p.danger }}>{t.gmail.error}</Text>
          </Card>
        )}

        {msgs !== null && !error && (
          <>
            {msgs.length === 0 && (
              <Text style={{ color: p.text3, fontFamily: FONT.mono, fontSize: 13 }}>{t.gmail.none}</Text>
            )}
            {msgs.map((m) => (
              <Card key={m.id} style={{ marginBottom: SP.sm }}>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 15, color: p.text }} numberOfLines={2}>
                  {m.subject || '(sin asunto)'}
                </Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2, marginTop: 4 }} numberOfLines={1}>
                  {m.from}
                </Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: p.text3, marginTop: 2 }}>{m.date}</Text>
              </Card>
            ))}
          </>
        )}
        <View style={{ height: SP.md }} />
      </ScrollView>
      </ContentSheet>
    </Screen>
  );
}
