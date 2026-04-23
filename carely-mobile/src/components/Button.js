import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reusable Button Component
 * @param {string} title - Button text
 * @param {function} onPress - Callback on press
 * @param {boolean} loading - Show loading state
 * @param {boolean} disabled - Disable button
 * @param {string} variant - 'primary' | 'secondary' | 'danger'
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {string} icon - Icon name from Ionicons
 * @param {object} style - Additional styles
 */
export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  icon = null,
  style = {},
}) {
  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    let base = [styles.button, styles[`button_${size}`], styles[`button_${variant}`]];
    if (isDisabled) base.push(styles.buttonDisabled);
    return [...base, style];
  };

  const getTextStyle = () => {
    return [styles.buttonText, styles[`text_${size}`], styles[`text_${variant}`]];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#fff' : '#10b981'}
          size="small"
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 16 : 20}
              color={variant === 'primary' ? '#fff' : '#10b981'}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  button_large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 58,
  },
  button_primary: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  button_secondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  button_danger: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '700',
  },
  text_small: {
    fontSize: 13,
    color: '#fff',
  },
  text_medium: {
    fontSize: 15,
    color: '#fff',
  },
  text_large: {
    fontSize: 16,
    color: '#fff',
  },
  text_secondary: {
    color: '#374151',
  },
  text_danger: {
    color: '#fff',
  },
});
