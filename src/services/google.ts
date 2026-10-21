/** Google OAuth (Calendar + Gmail readonly) con el provider oficial de
 * expo-auth-session: flujo por código + PKCE con intercambio automático
 * y refresh token. Los tokens viven en SecureStore.
 *
 * ACTIVADO el 20 oct 2026: proyecto Google Cloud "Turniq"
 * (tidy-apricot-512301-q7), APIs de Calendar y Gmail habilitadas,
 * consentimiento en modo Prueba con Nelson como usuario de prueba, y
 * los dos clientes OAuth de abajo (Android con la SHA-1 del keystore
 * y Web). Los Client ID no son secretos: viajan dentro de la app.
 */
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import type { Shift, Job } from '../store';

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_ANDROID_CLIENT_ID = '264084279710-qe2fe6ul9dgvdkpbv667eghm6l1n6rsj.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '264084279710-ueg1mt9kk45fps701va58jc5n4edv1j6.apps.googleusercontent.com';
export const GOOGLE_WEB_CLIENT_ID = '264084279710-p0etnr9drj326faqifm8i9cvbmkm9l4d.apps.googleusercontent.com';
/** Esquema invertido del cliente iOS (lo exige Google en iPhone y
 * está registrado en el array `scheme` de app.json). */
export const GOOGLE_IOS_REVERSED_SCHEME = 'com.googleusercontent.apps.264084279710-ueg1mt9kk45fps701va58jc5n4edv1j6';
export const googleConfigured = (): boolean => GOOGLE_ANDROID_CLIENT_ID.length > 10;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.readonly',
];

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

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

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

async function rawGet(): Promise<string | null> {
  if (SecureStore) return SecureStore.getItemAsync(TOKEN_KEY);
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function rawSet(v: string): Promise<void> {
  if (SecureStore) await SecureStore.setItemAsync(TOKEN_KEY, v);
  else {
    try {
      localStorage.setItem(TOKEN_KEY, v);
    } catch {
      /* noop */
    }
  }
}

async function readTokens(): Promise<StoredTokens | null> {
  const raw = await rawGet();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredTokens;
    if (parsed && typeof parsed.accessToken === 'string') return parsed;
  } catch {
    /* formato viejo: el string era el access token a secas */
  }
  return { accessToken: raw, expiresAt: 0 };
}

async function storeTokens(accessToken: string, refreshToken?: string, expiresIn?: number): Promise<void> {
  const prev = await readTokens();
  const data: StoredTokens = {
    accessToken,
    refreshToken: refreshToken ?? prev?.refreshToken,
    expiresAt: Date.now() + (expiresIn ?? 3600) * 1000,
  };
  await rawSet(JSON.stringify(data));
}

export async function isConnected(): Promise<boolean> {
  const t = await readTokens();
  return !!t?.accessToken;
}

export async function clearTokens(): Promise<void> {
  if (SecureStore) await SecureStore.deleteItemAsync(TOKEN_KEY);
  else {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
  }
}

/** Access token válido: refresca solo si está por vencer. */
export async function getAccessToken(): Promise<string | null> {
  const t = await readTokens();
  if (!t) return null;
  if (t.expiresAt - Date.now() > 5 * 60 * 1000) return t.accessToken;
  if (!t.refreshToken || !googleConfigured()) return t.accessToken;
  try {
    const r = await AuthSession.refreshAsync(
      {
        clientId: Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_ANDROID_CLIENT_ID,
        refreshToken: t.refreshToken,
      },
      GOOGLE_DISCOVERY,
    );
    await storeTokens(r.accessToken, r.refreshToken, r.expiresIn);
    return r.accessToken;
  } catch {
    return null;
  }
}

/**
 * Hook de conexión. El provider EXIGE un clientId no vacío (lanza si
 * falta): sin activación se le pasa uno de relleno y la UI bloquea el
 * botón con el estado "activación pendiente".
 */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || 'pending.apps.googleusercontent.com',
    iosClientId: GOOGLE_IOS_CLIENT_ID || 'pending.apps.googleusercontent.com',
    webClientId: GOOGLE_WEB_CLIENT_ID || 'pending.apps.googleusercontent.com',
    // Redirección FIJA por plataforma: con el array de esquemas de
    // app.json, AuthSession elegía "turniq" y Google bloquea la
    // solicitud (Error 400 invalid_request: la política de OAuth
    // exige un esquema tipo DNS inverso, y en el cliente Android el
    // esquema personalizado debe estar ACTIVADO en consola — hecho
    // el 20 oct 2026). Android → esquema del paquete; iOS → esquema
    // invertido de su cliente; web → la que el provider calcule.
    ...(Platform.OS === 'ios'
      ? { redirectUri: AuthSession.makeRedirectUri({ scheme: GOOGLE_IOS_REVERSED_SCHEME }) }
      : Platform.OS === 'android'
        ? { redirectUri: AuthSession.makeRedirectUri({ scheme: 'com.hirolifecreative.turniq' }) }
        : {}),
    scopes: SCOPES,
    selectAccount: true,
    shouldAutoExchangeCode: true,
  });
  return { request, response, promptAsync };
}

/** Guarda los tokens si la respuesta del login fue exitosa. */
export async function saveAuthResponse(response: AuthSession.AuthSessionResult | null): Promise<boolean> {
  if (response?.type !== 'success') return false;
  const auth = response.authentication;
  if (!auth?.accessToken) return false;
  await storeTokens(auth.accessToken, auth.refreshToken, auth.expiresIn);
  return true;
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
