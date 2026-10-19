/** "Invítame un café": compras dentro de la app (consumibles) para apoyar el desarrollo. */
import { Platform } from 'react-native';
import {
  initConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  type Product,
} from 'react-native-iap';

// IDs de producto — deben crearse igual en Google Play Console (productos gestionados, consumibles)
export const COFFEE_PRODUCTS = [
  { sku: 'turniq_coffee_1', amount: 1 },
  { sku: 'turniq_coffee_2', amount: 2 },
  { sku: 'turniq_coffee_3', amount: 3 },
  { sku: 'turniq_coffee_5', amount: 5 },
  { sku: 'turniq_coffee_10', amount: 10 },
];

let connected = false;

export async function ensureIapConnection(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (connected) return true;
  try {
    await initConnection();
    connected = true;
    return true;
  } catch {
    return false;
  }
}

export async function loadCoffeeProducts(): Promise<Product[]> {
  const ok = await ensureIapConnection();
  if (!ok) return [];
  try {
    const skus = COFFEE_PRODUCTS.map((p) => p.sku);
    const products = (await fetchProducts({ skus, type: 'in-app' })) as Product[] | null;
    return products ?? [];
  } catch {
    return [];
  }
}

export async function buyCoffee(
  sku: string,
  onSuccess: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  const ok = await ensureIapConnection();
  if (!ok) {
    onError('store_unavailable');
    return;
  }
  try {
    const result = (await requestPurchase({
      request: { google: { skus: [sku] }, apple: { sku } },
      type: 'in-app',
    } as never)) as { id?: string } | { id?: string }[] | null;
    const purchase = Array.isArray(result) ? result[0] : result;
    // Consumible: finalizar para permitir recomprar
    if (purchase) {
      await finishTransaction({ purchase: purchase as never, isConsumable: true });
      onSuccess();
    }
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code ?? '';
    // E_USER_CANCELLED = el usuario canceló, no es error
    if (code === 'E_USER_CANCELLED') return;
    onError(code || 'unknown');
  }
}
