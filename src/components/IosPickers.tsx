/** Picker estilo iOS con ruedas giratorias (reemplaza el picker nativo de Android). */
import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Sheet, useTheme, useT } from './ui';
import { useStore } from '../store';
import { SP, R, FONT, TYPE } from '../theme/tokens';

const ITEM_H = 44;

function Wheel({
  data,
  selected,
  onSelect,
  width,
}: {
  data: string[];
  selected: number;
  onSelect: (i: number) => void;
  width: number;
}) {
  const p = useTheme();
  const ref = useRef<FlatList>(null);
  const idx = Math.max(0, Math.min(selected, data.length - 1));

  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollToIndex({ index: idx, animated: false }), 50);
    return () => clearTimeout(t);
  }, []);

  const onScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const i = Math.round(y / ITEM_H);
    if (i !== idx && i >= 0 && i < data.length) onSelect(i);
  };

  return (
    <View style={{ width, height: ITEM_H * 5 }}>
      {/* Línea de selección */}
      <View
        style={{
          position: 'absolute',
          top: ITEM_H * 2,
          left: 0,
          right: 0,
          height: ITEM_H,
          backgroundColor: p.primary + '14',
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: p.primary + '30',
          borderRadius: 8,
        }}
        pointerEvents="none"
      />
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onScroll}
        onScrollEndDrag={onScroll}
        getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
        initialScrollIndex={idx}
        renderItem={({ item, index }) => (
          <View style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontFamily: FONT.head,
                fontSize: 20,
                color: index === idx ? p.text : p.text3,
                fontWeight: index === idx ? '700' : '400',
              }}
            >
              {item}
            </Text>
          </View>
        )}
        ListHeaderComponent={<View style={{ height: ITEM_H * 2 }} />}
        ListFooterComponent={<View style={{ height: ITEM_H * 2 }} />}
      />
    </View>
  );
}

export function IosTimePicker({
  visible,
  onClose,
  value,
  onChange,
  title,
  confirmLabel,
  cancelLabel,
  is24h,
}: {
  visible: boolean;
  onClose: () => void;
  value: string; // "HH:MM"
  onChange: (v: string) => void;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  is24h: boolean;
}) {
  const p = useTheme();
  const t = useT();
  const parts = value.split(':').map(Number);
  const h = parts[0] ?? 9;
  const m = parts[1] ?? 0;
  const [hour, setHour] = React.useState(is24h ? h : h % 12 === 0 ? 12 : h % 12);
  const [min, setMin] = React.useState(m);
  const [ampm, setAmpm] = React.useState(h >= 12 ? 1 : 0);

  React.useEffect(() => {
    if (visible) {
      const pp = value.split(':').map(Number);
      const hh = pp[0] ?? 9;
      const mm = pp[1] ?? 0;
      setHour(is24h ? hh : hh % 12 === 0 ? 12 : hh % 12);
      setMin(mm);
      setAmpm(hh >= 12 ? 1 : 0);
    }
  }, [visible]);

  const hours = is24h
    ? Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
    : Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const mins = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const confirm = () => {
    const hh = is24h ? hour : (hour % 12) + ampm * 12;
    onChange(`${String(hh).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: SP.md }}>
        <Wheel data={hours} selected={is24h ? hour : hour - 1} onSelect={(i) => setHour(is24h ? i : i + 1)} width={80} />
        <Text style={{ fontSize: 22, fontWeight: '700', color: p.text, marginHorizontal: 4 }}>:</Text>
        <Wheel data={mins} selected={min} onSelect={setMin} width={80} />
        {!is24h && (
          <Wheel data={['AM', 'PM']} selected={ampm} onSelect={setAmpm} width={80} />
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: SP.sm, marginTop: SP.sm }}>
        <TouchableOpacity
          onPress={onClose}
          style={{ flex: 1, height: 52, borderRadius: R.pill, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontWeight: '700', color: p.text, fontSize: TYPE.body }}>{cancelLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={confirm}
          style={{ flex: 1, height: 52, borderRadius: R.pill, backgroundColor: p.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontWeight: '700', color: '#fff', fontSize: TYPE.body }}>{confirmLabel}</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function IosDatePicker({
  visible,
  onClose,
  value,
  onChange,
  title,
  confirmLabel,
  cancelLabel,
}: {
  visible: boolean;
  onClose: () => void;
  value: string; // "YYYY-MM-DD"
  onChange: (v: string) => void;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
}) {
  const p = useTheme();
  const t = useT();
  const lang = useStore((s) => s.settings.idioma);
  const months = lang === 'es' ? MONTHS_ES : MONTHS_EN;
  const dp = value.split('-').map(Number);
  const [year, setYear] = React.useState(dp[0] ?? 2026);
  const [month, setMonth] = React.useState((dp[1] ?? 1) - 1);
  const [day, setDay] = React.useState(dp[2] ?? 1);

  React.useEffect(() => {
    if (visible) {
      const pp = value.split('-').map(Number);
      setYear(pp[0] ?? 2026);
      setMonth((pp[1] ?? 1) - 1);
      setDay(pp[2] ?? 1);
    }
  }, [visible]);

  const years = Array.from({ length: 11 }, (_, i) => String(2022 + i));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

  const confirm = () => {
    const dd = Math.min(day, daysInMonth);
    onChange(`${year}-${String(month + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: SP.md }}>
        <Wheel data={days} selected={Math.min(day, daysInMonth) - 1} onSelect={(i) => setDay(i + 1)} width={70} />
        <Wheel data={months} selected={month} onSelect={setMonth} width={80} />
        <Wheel data={years} selected={year - 2022} onSelect={(i) => setYear(2022 + i)} width={90} />
      </View>
      <View style={{ flexDirection: 'row', gap: SP.sm, marginTop: SP.sm }}>
        <TouchableOpacity
          onPress={onClose}
          style={{ flex: 1, height: 52, borderRadius: R.pill, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontWeight: '700', color: p.text, fontSize: TYPE.body }}>{cancelLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={confirm}
          style={{ flex: 1, height: 52, borderRadius: R.pill, backgroundColor: p.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontWeight: '700', color: '#fff', fontSize: TYPE.body }}>{confirmLabel}</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}
