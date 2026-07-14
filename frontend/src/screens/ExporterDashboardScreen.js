import React, { useContext, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import CustomInput from '../components/CustomInput';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { API_URL } from '../config';

const ExporterDashboardScreen = ({ navigation }) => {
    const { userInfo, userToken } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            const count = response.data.filter(n => !n.read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching notifications count:', error);
        }
    };

    const fetchOrders = async () => {
        try {
            console.log('Fetching orders...');
            console.log('Current User ID:', userInfo?._id);

            const response = await axios.get(`${API_URL}/orders`, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            // Filter logic debugging
            const allOrders = response.data;
            console.log('Total Orders Fetched:', allOrders.length);

            const myOrders = allOrders.filter(order => {
                // Handle populated user object OR raw ID string
                const orderUserId = order.user?._id || order.user;
                const isMatch = orderUserId?.toString() === userInfo?._id?.toString();
                // console.log(`Order ${order._id} User: ${orderUserId} vs MyID: ${userInfo?._id} -> ${isMatch}`);
                return isMatch;
            });

            console.log('My Orders Count:', myOrders.length);
            setOrders(myOrders.reverse());
        } catch (e) {
            console.log('Error fetching orders:', e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
            fetchUnreadCount();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    const renderOrderItem = ({ item }) => (
        <Card
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetails', { order: item })}
        >
            <View style={styles.orderHeader}>
                <Text style={styles.orderTitle}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            <Text style={styles.orderDetail}>Quantity: {item.quantity}</Text>
            <Text style={styles.orderDetail}>Material: {item.material || 'N/A'}</Text>
            <Text style={styles.orderDate}>Posted: {new Date(item.createdAt).toLocaleDateString()}</Text>
        </Card>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return colors.secondary; // Orange/Coral
            case 'bidding': return '#3B82F6'; // Blue
            case 'in-progress': return '#8B5CF6'; // Purple
            case 'completed': return '#10B981'; // Green
            default: return colors.textLight;
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello,</Text>
                        <Text style={styles.username}>{userInfo?.name || 'Exporter'}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        {/* Bell Icon */}
                        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notificationBell}>
                            <Text style={styles.bellIcon}>🔔</Text>
                            {unreadCount > 0 && (
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('ExporterProfile')}>
                            <Image
                                source={{ uri: userInfo?.profilePic || 'https://ui-avatars.com/api/?name=' + (userInfo?.name || 'User') + '&background=0F172A&color=fff' }}
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <CustomInput
                        placeholder="Search your orders..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Orders List */}
                <Text style={styles.sectionTitle}>Your Orders</Text>
                <FlatList
                    data={orders.filter(o => o.title.toLowerCase().includes(searchQuery.toLowerCase()))}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No orders found. Create one!</Text>
                        </View>
                    }
                />

                {/* FAB: Create New Order */}
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('CreateOrder')}
                >
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacing.m,
        paddingTop: spacing.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    greeting: {
        ...typography.subheader,
        color: colors.textLight,
    },
    username: {
        ...typography.header,
        color: colors.primary,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.border,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationBell: {
        position: 'relative',
        padding: 6,
    },
    bellIcon: {
        fontSize: 22,
    },
    badgeContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.secondary,
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    searchContainer: {
        marginBottom: spacing.s,
    },
    sectionTitle: {
        ...typography.subheader,
        fontSize: 18,
        marginBottom: spacing.s,
        marginTop: spacing.s,
    },
    listContent: {
        paddingBottom: 80, // Space for FAB
    },
    orderCard: {
        padding: spacing.m,
        marginBottom: spacing.m,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    orderTitle: {
        ...typography.subheader,
        fontSize: 16,
        flex: 1,
        marginRight: spacing.s,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        ...typography.caption,
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 10,
    },
    orderDetail: {
        ...typography.body,
        fontSize: 14,
        color: colors.text,
    },
    orderDate: {
        ...typography.caption,
        marginTop: spacing.s,
        color: colors.textLight,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: colors.textLight,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.medium,
        elevation: 6, // Android shadow
    },
    fabIcon: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: Platform.OS === 'android' ? -2 : 0,
    },
});

export default ExporterDashboardScreen;
