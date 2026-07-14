import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { BASE_URL } from '../config';

const NotificationScreen = ({ navigation }) => {
    const { userToken } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/notifications`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.put(`${BASE_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            Alert.alert('Success', 'All notifications marked as read');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to mark all as read');
        }
    };

    const handleNotificationClick = async (item) => {
        try {
            if (!item.read) {
                // Mark as read in backend
                await axios.put(`${BASE_URL}/notifications/${item._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                
                // Update local state
                setNotifications(prev => prev.map(n => n._id === item._id ? { ...n, read: true } : n));
            }

            // Navigate to associated order details
            if (item.order) {
                // Check if order details page requires passing order ID or object.
                // Normally we fetch order details or pass order object. We will navigate to OrderDetails
                navigation.navigate('OrderDetails', { orderId: item.order._id || item.order });
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const getIconForNotification = (title) => {
        const t = title.toLowerCase();
        if (t.includes('chat') || t.includes('message')) return '💬';
        if (t.includes('qc') || t.includes('quality')) return '🛡️';
        if (t.includes('bid')) return '💰';
        if (t.includes('machine') || t.includes('allocated')) return '⚙️';
        if (t.includes('started') || t.includes('production')) return '🏭';
        return '🔔';
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.notificationCard, !item.read && styles.notificationUnread]}
            onPress={() => handleNotificationClick(item)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{getIconForNotification(item.title)}</Text>
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, !item.read && styles.textBold]}>{item.title}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.timestamp}>
                    {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {notifications.some(n => !n.read) ? (
                        <TouchableOpacity onPress={handleMarkAllRead}>
                            <Text style={styles.readAllText}>Read All</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 60 }} />
                    )}
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>🔔</Text>
                                <Text style={styles.emptyText}>You have no notifications yet.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    backButton: {
        padding: spacing.xs,
        width: 60,
    },
    backText: {
        fontSize: 22,
        color: colors.text,
        fontWeight: 'bold',
    },
    headerTitle: {
        ...typography.subheader,
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 18,
    },
    readAllText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.secondary,
        width: 60,
        textAlign: 'right',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: spacing.m,
        paddingBottom: spacing.xl,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: spacing.m,
        marginBottom: spacing.s,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.small,
    },
    notificationUnread: {
        backgroundColor: '#EFF6FF', // Soft blue tint for unread
        borderColor: '#BFDBFE',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.s,
    },
    icon: {
        fontSize: 20,
    },
    contentContainer: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    textBold: {
        fontWeight: 'bold',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.secondary,
    },
    description: {
        fontSize: 13,
        color: colors.textLight,
        lineHeight: 18,
        marginBottom: 6,
    },
    timestamp: {
        fontSize: 10,
        color: colors.textLight,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.s,
        opacity: 0.5,
    },
    emptyText: {
        ...typography.body,
        color: colors.textLight,
    },
});

export default NotificationScreen;
