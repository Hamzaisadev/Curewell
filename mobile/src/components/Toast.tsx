import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  const { theme, isDark } = useTheme();

  if (!message) return null;

  return (
    <View style={styles.floatingWrapper} pointerEvents="none">
      <View
        style={[
          styles.toastBanner,
          {
            backgroundColor: theme.primary,
            borderColor: theme.accent,
          },
        ]}
      >
        <View style={[styles.indicatorDot, { backgroundColor: '#A7F3D0' }]} />
        <Text style={styles.toastBannerText}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '96%',
    gap: 8,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
});

export default Toast;
