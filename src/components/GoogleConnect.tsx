/** Conexión con Google compartida entre Calendario y Gmail. */
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Card, Btn, Label, useTheme, useT } from './ui';
import { SP, FONT } from '../theme/tokens';
import { googleConfigured, isConnected, clearTokens, useGoogleAuth, saveAuthResponse } from '../services/google';

export function useGoogleConnection() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const { response, promptAsync } = useGoogleAuth();

  useEffect(() => {
    void isConnected().then(setConnected);
  }, []);

  useEffect(() => {
    if (response) {
      void saveAuthResponse(response).then((ok) => {
        if (ok) setConnected(true);
      });
    }
  }, [response]);

  const connect = () => {
    void promptAsync();
  };
  const disconnect = () => {
    void clearTokens().then(() => setConnected(false));
  };
  return { configured: googleConfigured(), connected, connect, disconnect };
}

/** Estado mientras la app aún no tiene los Client ID de Google Cloud. */
export function GooglePendingCard() {
  const t = useT();
  const p = useTheme();
  return (
    <Card>
      <Label>{t.google.pending}</Label>
      <Text style={{ fontFamily: FONT.head, fontSize: 15, color: p.text2, lineHeight: 21 }}>{t.google.pendingBody}</Text>
    </Card>
  );
}

/** Tarjeta de conexión cuando la activación existe pero no hay sesión. */
export function GoogleConnectCard({ hint, onConnect }: { hint: string; onConnect: () => void }) {
  const t = useT();
  return (
    <Card>
      <Label>{hint}</Label>
      <Btn title={t.calendar.connect} onPress={onConnect} arrow />
    </Card>
  );
}
