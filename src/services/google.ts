/** Google OAuth (Calendar + Gmail readonly). Tokens en SecureStore. */
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import type { Shift, Job } from '../store';

WebBrowser.maybeCompleteAuthSession();

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.readonly',
];

// El usuario debe crear un OAuth client (Android) en Google Cloud Console
// y pegar el client ID aquí (o via Ajustes). Sin esto, la pantalla explica el estado.
export const GOOGLE_CLIENT_ID = '';

let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SecureStore = require('expo-secure-store');
  } catch {
    SecureStore = null;
  }
}

const TOKEN_KEY = 'turniq-google-token';

export async function saveToken(token: string): Promise<void> {
  if (SecureStore) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* noop */
    }
  }
}

export async function getToken(): Promise<string | null> {
  if (SecureStore) return SecureStore.getItemAsync(TOKEN_KEY);
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  if (SecureStore) await SecureStore.deleteItemAsync(TOKEN_KEY);
  else {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
  }
}

export function useGoogleAuth(clientId: string) {
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: SCOPES,
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true } as never),
      codeChallenge: undefined,
    },
    discovery,
  );
  return { request, response, promptAsync };
}

async function gFetch(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Google API ${res.status}`);
  return res.json();
}

const toRfc = (fecha: string, hm: string): string => {
  const [y, m, d] = fecha.split('-').map(Number);
  const [h, mi] = hm.split(':').map(Number);
  const dt = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0);
  const off = -dt.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const p = (n: number) => String(Math.abs(n)).padStart(2, '0');
  return `${y}-${p(m ?? 1)}-${p(d ?? 1)}T${p(h ?? 0)}:${p(mi ?? 0)}:00${sign}${p(Math.floor(Math.abs(off) / 60))}:${p(Math.abs(off) % 60)}`;
};

/** Crea o actualiza el evento del turno. Devuelve el eventId. */
export async function syncShiftEvent(
  token: string,
  shift: Shift,
  job: Job | undefined,
  prevEventId?: string,
): Promise<string | undefined> {
  if (!shift.horaSalida) return prevEventId;
  // Turno overnight (salida <= entrada): el evento termina al día siguiente.
  const overnight = shift.horaSalida <= shift.horaEntrada;
  let endFecha = shift.fecha;
  if (overnight) {
    const [y, m, d] = shift.fecha.split('-').map(Number);
    const dt = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + 1);
    const p = (n: number) => String(n).padStart(2, '0');
    endFecha = `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
  }
  const body = {
    summary: `Turno — ${job?.nombre ?? ''}`,
    description: [shift.notas, shift.propinas ? `Propinas: $${shift.propinas}` : '', shift.bono ? `Bono: $${shift.bono}` : '']
      .filter(Boolean)
      .join('\n'),
    start: { dateTime: toRfc(shift.fecha, shift.horaEntrada) },
    end: { dateTime: toRfc(endFecha, shift.horaSalida) },
  };
  try {
    if (prevEventId) {
      await gFetch(token, `/calendar/v3/calendars/primary/events/${prevEventId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      return prevEventId;
    }
    const created = (await gFetch(token, '/calendar/v3/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify(body),
    })) as { id?: string };
    return created.id;
  } catch {
    return prevEventId;
  }
}

export async function deleteShiftEvent(token: string, eventId: string): Promise<void> {
  try {
    await gFetch(token, `/calendar/v3/calendars/primary/events/${eventId}`, { method: 'DELETE' });
  } catch {
    /* noop */
  }
}

export interface GmailMsg {
  id: string;
  from: string;
  subject: string;
  date: string;
}

export async function fetchPayrollEmails(token: string): Promise<GmailMsg[]> {
  const q = encodeURIComponent('pay stub OR payroll OR nómina OR recibo de pago');
  const list = (await gFetch(token, `/gmail/v1/users/me/messages?q=${q}&maxResults=20`)) as {
    messages?: { id: string }[];
  };
  const out: GmailMsg[] = [];
  for (const m of list.messages ?? []) {
    try {
      const full = (await gFetch(
        token,
        `/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      )) as {
        payload?: { headers?: { name: string; value: string }[] };
      };
      const h = (n: string) => full.payload?.headers?.find((x) => x.name === n)?.value ?? '';
      out.push({ id: m.id, from: h('From'), subject: h('Subject'), date: h('Date') });
    } catch {
      /* salta mensajes ilegibles */
    }
  }
  return out;
}

export { Crypto };
