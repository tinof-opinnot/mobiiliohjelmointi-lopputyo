import { MD3LightTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';

export const theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6B4423',
    onPrimary: '#FFFFFF',
    primaryContainer: '#F3DFCC',
    onPrimaryContainer: '#2B1606',
    secondary: '#4E6B3A',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DCE9CF',
    onSecondaryContainer: '#14210B',
    background: '#FBF7F2',
    surface: '#FFFFFF',
    surfaceVariant: '#F1E7DC',
    onSurfaceVariant: '#5B4B3E',
    outline: '#8C7A6B',
    error: '#B3261E',
  },
};

// Navigaation värit samasta teemasta, jotta otsikot ja välilehdet sopivat yhteen
export const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.onSurface,
    border: theme.colors.surfaceVariant,
  },
};
