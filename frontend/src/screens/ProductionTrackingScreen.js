import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { API_URL } from '../config';

const ProductionTrackingScreen = ({ navigation, route }) => {
    const { userToken, userInfo } = useContext(AuthContext);
    const { order } = route.params;

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [production, setProduction] = useState(null);

    // Form states for Manufacturer
    const [selectedStatus, setSelectedStatus] = useState('');
    const [note, setNote] = useState('');

    const isManufacturer = userInfo?.role === 'manufacturer';

    const fetchProductionDetails = async () => {
        try {
            const response = await axios.get(`${API_URL}/production/${order._id}`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setProduction(response.data);
            setSelectedStatus(response.data.status);
        } catch (error) {
            console.error('Error fetching production details:', error);
            // Don't show Alert if screen is mounting for the first time and not initialized
            if (error.response?.status !== 404) {
                Alert.alert('Error', 'Failed to load production details');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductionDetails();
    }, [order._id, userToken]);

    const handleUpdateStatus = async () => {
        if (!selectedStatus) {
            Alert.alert('Error', 'Please select a status');
            return;
        }

        setUpdating(true);
        try {
            const response = await axios.put(`${API_URL}/production/${order._id}/status`, {
                status: selectedStatus,
                note: note.trim()
            }, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            setProduction(response.data);
            setNote('');
            Alert.alert('Success', `Production status updated to: ${selectedStatus}`);
        } catch (error) {
            console.error('Update production status error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const productionStatuses = [
        'Production Started',
        'Cutting',
        'Stitching',
        'Finishing',
        'Packing',
        'Production Completed'
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Waiting for Machine Allocation': return '#64748B'; // Gray
            case 'Production Started': return '#3B82F6'; // Blue
            case 'Cutting': return '#F59E0B'; // Amber
            case 'Stitching': return '#8B5CF6'; // Purple
            case 'Finishing': return '#EC4899'; // Pink
            case 'Packing': return '#06B6D4'; // Cyan
            case 'Production Completed': return colors.success; // Green
            default: return colors.primary;
        }
    };

    return (
        <ScreenWrapper>
            <View style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Production Tracking</Text>
                    <View style={styles.headerRightSpacer} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : !production ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Production tracking has not started yet.</Text>
                        {isManufacturer && (
                            <CustomButton
                                title="Allocate Machines to Start"
                                onPress={() => navigation.navigate('AllocateMachines', { order })}
                                style={{ marginTop: spacing.m }}
                            />
                        )}
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        {/* Order & Dates Summary Card */}
                        <Card style={styles.summaryCard}>
                            <Text style={styles.orderTitle}>{order.title}</Text>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Current Status:</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(production.status) + '15' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(production.status) }]}>
                                        {production.status}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={styles.divider} />

                            <View style={styles.datesRow}>
                                <View style={styles.dateBlock}>
                                    <Text style={styles.dateLabel}>EST. START DATE</Text>
                                    <Text style={styles.dateValue}>
                                        {production.estStartDate ? new Date(production.estStartDate).toLocaleDateString() : 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.dateBlock}>
                                    <Text style={styles.dateLabel}>EST. END DATE</Text>
                                    <Text style={styles.dateValue}>
                                        {production.estEndDate ? new Date(production.estEndDate).toLocaleDateString() : 'N/A'}
                                    </Text>
                                </View>
                            </View>

                            {isManufacturer && production.allocatedMachines && production.allocatedMachines.length > 0 && (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.subSectionTitle}>Allocated Machines</Text>
                                    <View style={styles.machinesRow}>
                                        {production.allocatedMachines.map((m, index) => (
                                            <View key={m._id || m.toString() || index} style={styles.machineTag}>
                                                <Text style={styles.machineTagText}>
                                                    {m.name ? `${m.name} (${m.type})` : `Machine ID: ${m}`}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}
                        </Card>

                        {/* Interactive Update Status for Manufacturers */}
                        {isManufacturer && production.status === 'Waiting for Machine Allocation' && (
                            <Card style={styles.updateCard}>
                                <Text style={styles.subSectionTitle}>Action Required</Text>
                                <Text style={{ color: colors.textLight, marginBottom: spacing.m, fontSize: 14 }}>
                                    Please allocate machines and set timelines to start production tracking for this order.
                                </Text>
                                <CustomButton
                                    title="Allocate Machines"
                                    onPress={() => navigation.navigate('AllocateMachines', { order })}
                                />
                            </Card>
                        )}

                        {isManufacturer && production.status !== 'Waiting for Machine Allocation' && production.status !== 'Production Completed' && (
                            <Card style={styles.updateCard}>
                                <Text style={styles.subSectionTitle}>Update Status</Text>
                                
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsRow}>
                                    {productionStatuses.map(status => {
                                        const isSelected = selectedStatus === status;
                                        return (
                                            <TouchableOpacity
                                                key={status}
                                                style={[
                                                    styles.statusChip,
                                                    isSelected && { backgroundColor: getStatusColor(status), borderColor: getStatusColor(status) }
                                                ]}
                                                onPress={() => setSelectedStatus(status)}
                                            >
                                                <Text style={[styles.statusChipText, isSelected && { color: '#fff' }]}>
                                                    {status}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>

                                <TextInput
                                    style={styles.noteInput}
                                    placeholder="Add a progress update note (optional)..."
                                    placeholderTextColor={colors.textLight}
                                    value={note}
                                    onChangeText={setNote}
                                    multiline
                                    numberOfLines={2}
                                />

                                <CustomButton
                                    title={updating ? "Updating..." : "Update Progress"}
                                    onPress={handleUpdateStatus}
                                    disabled={updating}
                                    style={styles.updateButton}
                                />
                            </Card>
                        )}

                        {/* Status Updates Timeline History */}
                        <Text style={styles.timelineSectionTitle}>Production History</Text>
                        
                        <View style={styles.timelineContainer}>
                            {production.history.map((log, index) => {
                                const isLatest = index === production.history.length - 1;
                                return (
                                    <View key={log._id || index} style={styles.timelineItem}>
                                        {/* Connecting Line */}
                                        {index < production.history.length - 1 && <View style={styles.timelineLine} />}
                                        
                                        {/* Bullet Point */}
                                        <View style={[
                                            styles.timelineDot,
                                            { backgroundColor: getStatusColor(log.status) },
                                            isLatest && styles.timelineDotLatest
                                        ]} />

                                        {/* History Card Details */}
                                        <View style={styles.timelineContent}>
                                            <View style={styles.timelineHeader}>
                                                <Text style={styles.timelineStatus}>{log.status}</Text>
                                                <Text style={styles.timelineTime}>
                                                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                            {log.note ? (
                                                <Text style={styles.timelineNote}>{log.note}</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                );
                            }).reverse() /* Newest on top */}
                        </View>
                    </ScrollView>
                )}
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        marginBottom: spacing.m,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.l,
    },
    emptyText: {
        ...typography.body,
        color: colors.textLight,
        textAlign: 'center',
    },
    scrollContainer: {
        paddingHorizontal: spacing.m,
        paddingBottom: spacing.xl,
    },
    summaryCard: {
        padding: spacing.m,
        marginBottom: spacing.m,
    },
    orderTitle: {
        ...typography.subheader,
        color: colors.primary,
        marginBottom: spacing.s,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    metaLabel: {
        fontSize: 14,
        color: colors.textLight,
        marginRight: spacing.s,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.m,
    },
    datesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateBlock: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 11,
        color: colors.textLight,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    subSectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.s,
    },
    machinesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    machineTag: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    machineTagText: {
        fontSize: 12,
        color: colors.text,
        fontWeight: '500',
    },
    updateCard: {
        padding: spacing.m,
        marginBottom: spacing.m,
    },
    statusChipsRow: {
        gap: spacing.s,
        paddingVertical: spacing.s,
        marginBottom: spacing.s,
    },
    statusChip: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    statusChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textLight,
    },
    noteInput: {
        backgroundColor: colors.background,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.s,
        fontSize: 14,
        color: colors.text,
        minHeight: 60,
        marginBottom: spacing.m,
        textAlignVertical: 'top',
    },
    updateButton: {
        paddingVertical: 12,
    },
    timelineSectionTitle: {
        ...typography.subheader,
        fontSize: 16,
        marginTop: spacing.m,
        marginBottom: spacing.m,
        color: colors.primary,
    },
    timelineContainer: {
        paddingLeft: 10,
    },
    timelineItem: {
        flexDirection: 'row',
        paddingBottom: spacing.l,
    },
    timelineLine: {
        position: 'absolute',
        left: 5,
        top: 15,
        bottom: 0,
        width: 2,
        backgroundColor: colors.border,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
        marginRight: 16,
        zIndex: 1,
    },
    timelineDotLatest: {
        borderWidth: 3,
        borderColor: colors.surface,
        width: 14,
        height: 14,
        borderRadius: 7,
        marginLeft: -1,
        ...shadows.small,
    },
    timelineContent: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.small,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.s,
        marginBottom: 6,
    },
    timelineStatus: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
    },
    timelineTime: {
        fontSize: 11,
        color: colors.textLight,
    },
    timelineNote: {
        fontSize: 13,
        color: colors.textLight,
        lineHeight: 18,
    },
});

export default ProductionTrackingScreen;
