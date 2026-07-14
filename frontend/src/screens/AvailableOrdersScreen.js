import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { API_URL } from '../config';

const AvailableOrdersScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { userToken } = useContext(AuthContext);

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${API_URL}/orders`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            // Filter to show only available orders (pending or bidding) AND ensure user exists
            const availableOrders = response.data.filter(order =>
                (order.status === 'pending' || order.status === 'bidding') &&
                order.user // Check if user object exists (is not null/orphaned)
            );
            setOrders(availableOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return colors.secondary;
            case 'bidding': return '#3B82F6';
            default: return colors.textLight;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('SubmitBid', { order: item })}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText} numberOfLines={1} ellipsizeMode="tail">
                        {Array.isArray(item.category) ? item.category.join(', ') : (item.category || 'Order')}
                    </Text>
                </View>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                    {item.status === 'pending' ? 'PENDING' : 'OPEN FOR BIDS'}
                </Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            
            {item.description ? (
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            ) : null}

            {/* Spec Details Highlights */}
            <View style={styles.specsContainer}>
                <View style={styles.specItem}>
                    <Text style={styles.specLabel}>GENDER</Text>
                    <Text style={styles.specVal}>{item.gender || 'Unisex'}</Text>
                </View>
                <View style={styles.specItem}>
                    <Text style={styles.specLabel}>QUANTITY</Text>
                    <Text style={styles.specVal}>{item.quantity} pcs</Text>
                </View>
                {item.targetPrice ? (
                    <View style={styles.specItem}>
                        <Text style={styles.specLabel}>TARGET PRICE</Text>
                        <Text style={[styles.specVal, { color: colors.secondary }]}>PKR {item.targetPrice}</Text>
                    </View>
                ) : null}
            </View>

            {/* Sizes highlights */}
            {item.sizes && item.sizes.length > 0 ? (
                <View style={styles.sizesRow}>
                    <Text style={styles.sizesLabel}>Sizes: </Text>
                    {item.sizes.map((sz, index) => (
                        <View key={index} style={styles.sizeChip}>
                            <Text style={styles.sizeChipText}>{sz}</Text>
                        </View>
                    ))}
                </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <Text style={styles.exporterText}>By: {item.user?.name || 'Unknown'}</Text>
                <Text style={styles.deadlineText}>
                    Deadline: {item.deadline ? new Date(item.deadline).toLocaleDateString('en-GB') : 'N/A'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Available Orders</Text>
                    <View style={styles.headerRightSpacer} />
                </View>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                        }
                        ListEmptyComponent={<Text style={styles.emptyText}>No available orders found.</Text>}
                    />
                )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.l,
        marginTop: spacing.s,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    backButtonText: {
        fontSize: 32,
        color: colors.text,
        fontWeight: 'bold',
        lineHeight: 32,
    },
    headerTitle: {
        flex: 1,
        ...typography.header,
        fontSize: 22,
        textAlign: 'center',
    },
    headerRightSpacer: {
        width: 44,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: spacing.xl,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.m,
        marginBottom: spacing.m,
        ...shadows.small,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    categoryBadge: {
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        maxWidth: '65%',
    },
    categoryBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
    },
    status: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    title: {
        ...typography.subheader,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    description: {
        ...typography.body,
        color: colors.textLight,
        fontSize: 14,
        marginBottom: spacing.s,
    },
    specsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: spacing.s,
        marginBottom: spacing.s,
        justifyContent: 'space-around',
    },
    specItem: {
        alignItems: 'center',
    },
    specLabel: {
        fontSize: 10,
        color: colors.textLight,
        fontWeight: '600',
        marginBottom: 2,
    },
    specVal: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.text,
    },
    sizesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: spacing.s,
    },
    sizesLabel: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '600',
    },
    sizeChip: {
        backgroundColor: colors.border,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginHorizontal: 3,
        marginVertical: 2,
    },
    sizeChipText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.s,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exporterText: {
        fontSize: 12,
        color: colors.textLight,
    },
    deadlineText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.error,
    },
    emptyText: {
        ...typography.body,
        textAlign: 'center',
        marginTop: 50,
        color: colors.textLight,
    },
});

export default AvailableOrdersScreen;
