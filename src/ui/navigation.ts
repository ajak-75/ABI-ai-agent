import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootTabParamList = {
  Chat: undefined;
  Memory: undefined;
  Tasks: undefined;
  Settings: undefined;
};

export type TabNavigation = BottomTabNavigationProp<RootTabParamList>;

export const TAB_ORDER: Array<keyof RootTabParamList> = ['Chat', 'Memory', 'Tasks', 'Settings'];
