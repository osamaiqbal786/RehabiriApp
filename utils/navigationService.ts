import { NavigationContainerRef } from '@react-navigation/native';

let navigationRef: NavigationContainerRef<any> | null = null;

export const setNavigationRef = (ref: NavigationContainerRef<any>) => {
  navigationRef = ref;
};

export const navigate = (screen: string, params?: any) => {
  if (navigationRef) {
    navigationRef.navigate(screen, params);
  }
};

export const getNavigationRef = () => navigationRef;
