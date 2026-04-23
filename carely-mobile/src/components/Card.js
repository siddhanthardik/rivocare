import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

/**
 * Reusable Card Component
 * @param {ReactNode} children - Card content
 * @param {boolean} pressable - Make card pressable
 * @param {function} onPress - Callback on press
 * @param {string} variant - 'default' | 'outlined' | 'elevated'
 * @param {object} style - Additional styles
 */
export default function Card({
  children,
  pressable = false,
  onPress = null,
  variant = 'default',
  style = {},
}) {
  const cardStyle = [
    styles.card,
    styles[`card_${variant}`],
    style,
  ];

  const content = (
    <View style={cardStyle}>
      {children}
    </View>
  );

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    marginVertical: 8,
  },
  card_default: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  card_outlined: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  card_elevated: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
    elevation: 8,
  },
});
