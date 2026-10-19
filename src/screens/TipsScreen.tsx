/** "Invítame un café": apoyo voluntario al desarrollo. */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, Card, TopBar, useTheme, useT, Field } from '../components/ui';
import { SP, R, FONT, TYPE } from '../theme/tokens';
import { COFFEE_PRODUCTS, CUSTOM_TIP_URL, loadCoffeeProducts, buyCoffee } from '../services/tips';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import type { Product } from 'react-native-iap';

const COFFEE = '☕';

export function TipsScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    loadCoffeeProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const priceFor = (sku: string, fallback: number) => {
    const prod = products.find((x) => x.id === sku);
    return prod?.displayPrice ?? `$${fallback}.00`;
  };

  const handleBuy = (sku: string) => {
    setBuying(sku);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buyCoffee(
      sku,
      () => {
        setBuying(null);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t.tips.thanksTitle, t.tips.thanksMsg);
      },
      (code) => {
        setBuying(null);
        if (code !== 'store_unavailable') Alert.alert(t.tips.errorTitle, t.tips.errorMsg);
      },
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <TopBar title={t.tips.title} onBack={() => nav.goBack()} />

        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }}>
          <Card style={{ alignItems: 'center', padding: SP.xl, marginBottom: SP.md }}>
            <Text style={{ fontSize: 64, marginBottom: SP.md }}>{COFFEE}</Text>
            <Text style={{ fontFamily: FONT.headBold, fontSize: 22, color: p.text, textAlign: 'center', marginBottom: SP.sm }}>
              {t.tips.heading}
            </Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text3, textAlign: 'center', lineHeight: 20 }}>
              {t.tips.desc}
            </Text>
          </Card>
        </MotiView>

        {loading ? (
          <ActivityIndicator size="large" color={p.primary} style={{ marginTop: SP.xl }} />
        ) : (
          COFFEE_PRODUCTS.map((c, i) => (
            <MotiView key={c.sku} from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 100 }}>
              <TouchableOpacity
                onPress={() => handleBuy(c.sku)}
                disabled={buying !== null}
                activeOpacity={0.8}
                style={{
                  backgroundColor: p.card,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: buying === c.sku ? p.primary : p.line,
                  padding: SP.lg,
                  marginBottom: SP.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 32, marginRight: SP.md }}>{COFFEE}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: p.text }}>
                    {t.tips.coffee} × {c.amount === 1 ? 1 : c.amount}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: 2 }}>
                    {t.tips.support}
                  </Text>
                </View>
                {buying === c.sku ? (
                  <ActivityIndicator color={p.primary} />
                ) : (
                  <View style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingHorizontal: 18, paddingVertical: 10 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{priceFor(c.sku, c.amount)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </MotiView>
          ))
        )}

        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: p.text3, textAlign: 'center', marginTop: SP.md, lineHeight: 16 }}>
          {t.tips.note}
        </Text>

        {/* Monto personalizado */}
        <Card style={{ marginTop: SP.md, padding: SP.lg }}>
          <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: p.text, marginBottom: SP.sm }}>
            {t.tips.customTitle}
          </Text>
          <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text3, marginBottom: SP.md, lineHeight: 18 }}>
            {t.tips.customDesc}
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(CUSTOM_TIP_URL)}
            activeOpacity={0.8}
            style={{ backgroundColor: p.surface, borderRadius: 16, borderWidth: 1, borderColor: p.line, padding: SP.lg, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: p.primary }}>
              {t.tips.customButton}
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </Screen>
  );
}
