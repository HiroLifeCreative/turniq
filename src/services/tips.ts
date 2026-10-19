/** "Invítame un café": temporalmente deshabilitado (react-native-iap removido por conflicto de build).
 *  Se reactivará cuando se resuelva la configuración de sabores de Gradle.
 */
import { Platform } from 'react-native';

export const COFFEE_PRODUCTS = [
  { sku: 'turniq_coffee_1', amount: 1 },
  { sku: 'turniq_coffee_2', amount: 2 },
  { sku: 'turniq_coffee_3', amount: 3 },
  { sku: 'turniq_coffee_5', amount: 5 },
  { sku: 'turniq_coffee_10', amount: 10 },
];

export interface Product {
  productId: string;
  localizedPrice: string;
}

export async function ensureIapConnection(): Promise<boolean> {
  return false;
}

export async function loadCoffeeProducts(): Promise<Product[]> {
  return [];
}

export async function buyCoffee(
  _sku: string,
  _onSuccess: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  if (Platform.OS !== 'web') onError('store_unavailable');
}

export async function confirmCoffeePurchase(_purchase: unknown): Promise<void> {
  /* noop */
}
