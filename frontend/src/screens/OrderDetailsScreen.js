import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows, API_URL } from '../theme'; // Adjusted import if API_URL is in config
import { API_URL as URL_CONFIG } from '../config'; // Using config directly if theme doesn't have it

const OrderDetailsScreen = ({ route, navigation }) => {
    const { order: paramOrder, orderId } = route.params || {};
    const { userToken, userInfo } = useContext(AuthContext);
    const [orderData, setOrderData] = useState(paramOrder || null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);

    const BASE_URL = URL_CONFIG || API_URL;
    const activeOrderId = orderId || paramOrder?._id;
    const order = orderData; // Alias to prevent modifying 500 lines of JSX referencing order

    // Fetch Order details if only orderId is passed (e.g. from notification clicks)
    React.useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderData && activeOrderId) {
                try {
                    const response = await axios.get(`${BASE_URL}/orders/${activeOrderId}`, {
                        headers: { Authorization: `Bearer ${userToken}` }
                    });
                    setOrderData(response.data);
                } catch (error) {
                    console.error('Error fetching order details:', error);
                    Alert.alert('Error', 'Failed to retrieve order details.');
                }
            }
        };
        fetchOrderDetails();
    }, [activeOrderId]);

    const fetchBids = async () => {
        if (!activeOrderId) return;
        try {
            const response = await axios.get(`${BASE_URL}/bids/order/${activeOrderId}`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setBids(response.data);
        } catch (error) {
            console.error('Error fetching bids:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (activeOrderId) {
                fetchBids();
            }
        }, [activeOrderId])
    );

    const handleDeleteOrder = () => {
        Alert.alert(
            'Delete Order',
            'Are you sure you want to delete this order?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${BASE_URL}/orders/${order._id}`, {
                                headers: { Authorization: `Bearer ${userToken}` }
                            });
                            Alert.alert('Success', 'Order deleted successfully', [
                                { text: 'OK', onPress: () => navigation.navigate('ExporterDashboard') }
                            ]);
                        } catch (error) {
                            console.error('Error deleting order:', error);
                            Alert.alert('Error', 'Failed to delete order');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return colors.secondary;
            case 'bidding': return '#3B82F6';
            case 'in-progress': return '#8B5CF6';
            case 'completed': return '#10B981';
            default: return colors.textLight;
        }
    };

    if (!order) {
        return (
            <ScreenWrapper>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 10, color: colors.textLight }}>Loading order details...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Order Details</Text>
                    <View style={styles.headerRightSpacer} />
                </View>

                {/* Status Section */}
                <View style={styles.statusSection}>
                    <Text style={styles.statusLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                        <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
                    </View>
                </View>

                {/* Main Details Card */}
                <Card style={styles.detailsCard}>
                    <Text style={styles.detailTitle}>{order.title}</Text>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Category:</Text>
                        <Text style={styles.value}>
                            {Array.isArray(order.category) ? order.category.join(', ') : (order.category || 'N/A')}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Audience:</Text>
                        <Text style={styles.value}>{order.gender || 'Unisex'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Quantity:</Text>
                        <Text style={styles.value}>{order.quantity} units</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Material:</Text>
                        <Text style={styles.value}>{order.material || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Color:</Text>
                        <Text style={styles.value}>{order.color || 'N/A'}</Text>
                    </View>

                    {/* Sizes Array Badges */}
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Sizes:</Text>
                        <View style={styles.badgeRow}>
                            {order.sizes && order.sizes.length > 0 ? (
                                order.sizes.map((sz, index) => (
                                    <View key={index} style={styles.sizeBadgeChip}>
                                        <Text style={styles.sizeBadgeText}>{sz}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={[styles.value, { width: '100%', textAlign: 'right' }]}>
                                    {order.size || 'N/A'}
                                </Text>
                            )}
                        </View>
                    </View>

                    {order.sizeBreakdown ? (
                        <View style={styles.detailRowCol}>
                            <Text style={styles.labelFull}>Size Breakdown:</Text>
                            <Text style={styles.valueFull}>{order.sizeBreakdown}</Text>
                        </View>
                    ) : null}

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Customization:</Text>
                        <Text style={styles.value}>{order.customizationType || 'None'}</Text>
                    </View>

                    {order.customizationType && order.customizationType !== 'None' ? (
                        <>
                            <View style={styles.detailRow}>
                                <Text style={styles.label}>No. of Logos:</Text>
                                <Text style={styles.value}>{order.noOfLogos || '0'}</Text>
                            </View>
                            {order.logoPlacement ? (
                                <View style={styles.detailRow}>
                                    <Text style={styles.label}>Logo Placement:</Text>
                                    <Text style={styles.value}>{order.logoPlacement}</Text>
                                </View>
                            ) : null}
                        </>
                    ) : null}

                    {order.targetPrice ? (
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Target Price:</Text>
                            <Text style={[styles.value, { color: colors.secondary, fontWeight: 'bold' }]}>
                                PKR {order.targetPrice} / unit
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Sample Needed:</Text>
                        <Text style={styles.value}>{order.sampleRequired ? 'Yes' : 'No'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Date Posted:</Text>
                        <Text style={styles.value}>{new Date(order.createdAt).toLocaleDateString('en-GB')}</Text>
                    </View>

                    {order.deadline && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.label, { color: colors.error }]}>Deadline:</Text>
                            <Text style={[styles.value, { color: colors.error, fontWeight: 'bold' }]}>
                                {new Date(order.deadline).toLocaleDateString('en-GB')}
                            </Text>
                        </View>
                    )}
                </Card>

                {/* Description Section */}
                <Text style={styles.sectionHeader}>Description</Text>
                <Card style={styles.descriptionCard}>
                    <Text style={styles.descriptionText}>{order.description}</Text>
                </Card>

                {/* Track Production Button */}
                {(order.status === 'in-progress' || order.status === 'under-qc' || order.status === 'rework' || order.status === 'completed') && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ProductionTracking', { order })}
                        style={styles.trackProductionButton}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.trackProductionButtonText}>Track Production</Text>
                    </TouchableOpacity>
                )}

                {/* Chat Action (Active Orders) */}
                {order.manufacturer && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Chat', { order })}
                        style={styles.chatButton}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.chatButtonText}>💬 Chat with {userInfo?.role === 'manufacturer' ? 'Exporter' : 'Manufacturer'}</Text>
                    </TouchableOpacity>
                )}

                {/* Exporter Specific QC Review Actions */}
                {userInfo?.role !== 'manufacturer' && (
                    <>
                        {order.status === 'under-qc' && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('QcReview', { order })}
                                style={[styles.qcReviewButton, { backgroundColor: colors.primary }]}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.qcButtonText}>Review QC Report</Text>
                            </TouchableOpacity>
                        )}
                        {order.status === 'rework' && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('QcReview', { order })}
                                style={[styles.qcReviewButton, { backgroundColor: colors.error }]}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.qcButtonText}>⚠️ View Rework Defect Log</Text>
                            </TouchableOpacity>
                        )}
                        {order.status === 'completed' && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('QcReview', { order })}
                                style={[styles.qcReviewButton, { backgroundColor: colors.primary }]}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.qcButtonText}>View Approved QC Report</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                {/* Manufacturer Specific QC / Defect Actions */}
                {userInfo?.role === 'manufacturer' && (
                    <>
                        {order.status === 'rework' && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('DefectDetails', { order })}
                                style={[styles.qcReviewButton, { backgroundColor: colors.error }]}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.qcButtonText}>⚠️ View Reported Defects</Text>
                            </TouchableOpacity>
                        )}
                        {(order.status === 'in-progress' || order.status === 'under-qc') && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('UploadQc', { order })}
                                style={[styles.qcReviewButton, { backgroundColor: colors.success }]}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.qcButtonText}>Submit QC Report</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                {/* Action Buttons for Pending Orders */}
                {order.status === 'pending' && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('EditOrder', { order })}
                            style={[styles.actionButton, styles.updateButton]}
                        >
                            <Text style={styles.actionButtonText}>Update</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleDeleteOrder}
                            style={[styles.actionButton, styles.deleteButton]}
                        >
                            <Text style={styles.actionButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bids Section */}
                {userInfo?.role !== 'manufacturer' && (
                    <>
                        <Text style={styles.sectionHeader}>Bids Received ({bids.length})</Text>
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                        ) : bids.length > 0 ? (
                            bids.map((bid) => (
                                <TouchableOpacity
                                    key={bid._id}
                                    activeOpacity={0.7}
                                    onPress={() => navigation.navigate('BidDetails', { bid, order })}
                                >
                                    <Card style={styles.bidCard}>
                                        <View style={styles.bidHeader}>
                                            <Text style={styles.bidderName}>{bid.manufacturer?.name || 'Unknown Manufacturer'}</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bid.status) }]}>
                                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{bid.status.toUpperCase()}</Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                                            <Text style={styles.bidPrice}>PKR {bid.pricePerUnit} / unit</Text>
                                            <Text style={styles.bidTotal}>Total: PKR {bid.price}</Text>
                                        </View>
                                        <Text style={styles.bidDeadline}>Deadline: {new Date(bid.deadline).toLocaleDateString('en-GB')}</Text>
                                        <Text style={{ color: colors.primary, marginTop: 8, textAlign: 'right', fontSize: 12 }}>Tap to view details &gt;</Text>
                                    </Card>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Card style={styles.bidsCard}>
                                <Text style={styles.emptyText}>No bids received yet.</Text>
                            </Card>
                        )}
                    </>
                )}

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.m,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.l,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    backButtonText: {
        color: colors.primary,
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 32,
    },
    title: {
        flex: 1,
        ...typography.header,
        textAlign: 'center',
    },
    headerRightSpacer: {
        width: 44,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: spacing.l,
    },
    actionButton: {
        flex: 1,
        height: 60, // Explicit large height
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.medium,
    },
    updateButton: {
        backgroundColor: colors.primary,
        marginRight: spacing.s, // Spacing between
    },
    deleteButton: {
        backgroundColor: colors.error,
        marginLeft: spacing.s, // Spacing between
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 18, // Increased font size
        fontWeight: 'bold',
    },
    statusSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.m,
        justifyContent: 'center',
    },
    statusLabel: {
        ...typography.body,
        marginRight: spacing.s,
        color: colors.textLight,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    detailsCard: {
        padding: spacing.l,
        marginBottom: spacing.l,
    },
    detailTitle: {
        ...typography.subheader,
        fontSize: 20,
        marginBottom: spacing.m,
        color: colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: spacing.m,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.s,
    },
    label: {
        ...typography.body,
        color: colors.textLight,
        width: '40%',
    },
    value: {
        ...typography.body,
        fontWeight: '600',
        width: '60%',
        textAlign: 'right',
    },
    sectionHeader: {
        ...typography.subheader,
        marginBottom: spacing.s,
        marginLeft: spacing.xs,
    },
    descriptionCard: {
        padding: spacing.m,
        marginBottom: spacing.l,
    },
    descriptionText: {
        ...typography.body,
        lineHeight: 22,
    },
    bidsCard: {
        padding: spacing.l,
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    bidCard: {
        padding: spacing.m,
        marginBottom: spacing.m,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    bidHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    bidderName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
    },
    bidPrice: {
        fontWeight: 'bold',
        color: colors.secondary,
        fontSize: 16,
    },
    bidTotal: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    bidDeadline: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
        fontStyle: 'italic',
    },
    bidProposal: {
        marginTop: 8,
        fontStyle: 'italic',
        color: '#555',
    },
    bidActions: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    emptyText: {
        color: colors.textLight,
        fontStyle: 'italic',
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginLeft: 8,
    },
    acceptButton: {
        backgroundColor: colors.primary,
    },
    rejectButton: {
        backgroundColor: colors.error,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    trackProductionButton: {
        backgroundColor: colors.primary,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.s,
        ...shadows.medium,
    },
    trackProductionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        width: '60%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    sizeBadgeChip: {
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    sizeBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
    },
    detailRowCol: {
        flexDirection: 'column',
        marginBottom: spacing.s,
        marginTop: spacing.s,
    },
    labelFull: {
        ...typography.body,
        color: colors.textLight,
        marginBottom: 4,
    },
    valueFull: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        backgroundColor: colors.background,
        padding: spacing.s,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chatButton: {
        backgroundColor: colors.primary,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.s,
        ...shadows.medium,
    },
    chatButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    qcReviewButton: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.s,
        ...shadows.medium,
    },
    qcButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OrderDetailsScreen;
