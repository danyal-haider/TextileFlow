import React, { useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { API_URL } from '../config';

const ManageMachinesScreen = ({ navigation }) => {
    const { userToken } = useContext(AuthContext);
    const insets = useSafeAreaInsets();
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMachines = async () => {
        try {
            const response = await axios.get(`${API_URL}/machines`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setMachines(response.data);
        } catch (error) {
            console.error('Error fetching machines:', error);
            Alert.alert('Error', 'Failed to fetch machines');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMachines();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchMachines();
    };

    const handleDelete = (id, name) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/machines/${id}`, {
                                headers: { Authorization: `Bearer ${userToken}` }
                            });
                            setMachines(prev => prev.filter(m => m._id !== id));
                        } catch (error) {
                            console.error('Delete machine error:', error);
                            Alert.alert('Error', 'Failed to delete machine');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return colors.success;
            case 'Busy': return colors.error;
            case 'Under Maintenance': return colors.secondary;
            default: return colors.textLight;
        }
    };

    const renderMachineItem = ({ item }) => (
        <Card style={styles.machineCard}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.machineName}>{item.name}</Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.actionColumn}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => navigation.navigate('AddEditMachine', { machine: item })}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(item._id, item.name)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Machines</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={machines}
                        keyExtractor={(item) => item._id}
                        renderItem={renderMachineItem}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No machines added yet.</Text>
                                <Text style={styles.emptySubtext}>Add machines to allocate them to your won orders.</Text>
                            </View>
                        }
                    />
                )}

                <CustomButton
                    title="+ Add Machine"
                    onPress={() => navigation.navigate('AddEditMachine')}
                    style={[styles.addButton, { bottom: Math.max(insets.bottom, 16) + 16 }]}
                />
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
        justifyContent: 'center',
        marginBottom: spacing.l,
        marginTop: spacing.s,
        position: 'relative',
    },
    backButton: {
        marginRight: spacing.m,
    },
    backButtonText: {
        fontSize: 16,
        color: colors.textLight,
        fontWeight: '600',
    },
    headerTitle: {
        ...typography.header,
        fontSize: 22,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 100, // Space for floating add button
    },
    machineCard: {
        padding: spacing.m,
        marginBottom: spacing.m,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    machineName: {
        ...typography.subheader,
        fontSize: 18,
        color: colors.primary,
        marginBottom: spacing.s,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    typeBadge: {
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.primary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    actionColumn: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: spacing.s,
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textLight,
    },
    editButton: {
        backgroundColor: colors.surface,
    },
    deleteButton: {
        borderColor: colors.error + '30',
        backgroundColor: colors.error + '05',
    },
    addButton: {
        position: 'absolute',
        bottom: 24,
        left: spacing.m,
        right: spacing.m,
        ...shadows.medium,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        paddingHorizontal: spacing.l,
    },
    emptyText: {
        ...typography.subheader,
        color: colors.text,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    emptySubtext: {
        ...typography.body,
        fontSize: 14,
        color: colors.textLight,
        textAlign: 'center',
    },
});

export default ManageMachinesScreen;
