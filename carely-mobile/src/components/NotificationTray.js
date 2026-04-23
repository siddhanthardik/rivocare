import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TYPE_META = {
  BOOKING: { icon: 'calendar-outline', tint: '#0f766e', chip: '#ccfbf1' },
  PAYMENT: { icon: 'card-outline', tint: '#9a3412', chip: '#ffedd5' },
  SYSTEM: { icon: 'notifications-outline', tint: '#1d4ed8', chip: '#dbeafe' },
};

export default function NotificationTray({
  title = 'Notifications',
  notifications = [],
  unreadCount = 0,
  onPressNotification,
  actionLabel = null,
  onPressAction = null,
}) {
  if (!notifications.length) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>LIVE UPDATES</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          ) : null}
          {actionLabel && onPressAction ? (
            <TouchableOpacity onPress={onPressAction} activeOpacity={0.8}>
              <Text style={styles.actionText}>{actionLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {notifications.map((notification) => {
        const meta = TYPE_META[notification.type] || TYPE_META.SYSTEM;

        return (
          <TouchableOpacity
            key={notification._id}
            style={[styles.card, !notification.isRead && styles.cardUnread]}
            onPress={() => onPressNotification?.(notification)}
            activeOpacity={0.88}
          >
            <View style={[styles.iconWrap, { backgroundColor: meta.chip }]}>
              <Ionicons name={meta.icon} size={18} color={meta.tint} />
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{notification.title}</Text>
              <Text style={styles.cardMessage}>{notification.message}</Text>
            </View>

            {!notification.isRead ? <View style={styles.unreadDot} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    minWidth: 24,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 22,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardUnread: {
    borderColor: '#99f6e4',
    backgroundColor: '#f8fffd',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    marginLeft: 10,
    marginTop: 6,
  },
});
