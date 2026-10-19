import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabsParamList = {
  Inicio: undefined;
  Semana: undefined;
  Trabajos: undefined;
  Ganancias: undefined;
};

export type MasStackParamList = {
  MasHome: undefined;
  Reports: undefined;
  Stats: undefined;
  Tips: undefined;
  Settings: undefined;
  CalendarSync: undefined;
  Gmail: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  Mas: NavigatorScreenParams<MasStackParamList>;
};
