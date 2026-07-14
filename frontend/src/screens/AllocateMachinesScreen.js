import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Card from '../components/Card';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme';
import { API_URL } from '../config';

const AllocateMachinesScreen = ({ navigation, route }) => {
    const { userToken } = useContext(AuthContext);
    const { order } = route.params;

    const [loading, setLoading] = useState(false);
    const [machinesLoading, setMachinesLoading] = useState(true);
    const [availableMachines, setAvailableMachines] = useState([]);
    const [selectedMachineIds, setSelectedMachineIds] = useState([]);
    
    // Date fields
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [startDateSelected, setStartDateSelected] = useState(false);
    const [endDateSelected, setEndDateSelected] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const onStartChange = (event, selectedDate) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartDate(selectedDate);
            setStartDateSelected(true);
        }
    };

    const onEndChange = (event, selectedDate) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndDate(selectedDate);
            setEndDateSelected(true);
        }
    };

    useEffect(() => {
        const fetchAvailableMachines = async () => {
            try {
                const response = await axios.get(`${API_URL}/machines`, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                // Filter only Available machines
                const available = response.data.filter(m => m.status === 'Available');
                setAvailableMachines(available);
            } catch (error) {
                console.error('Error fetching available machines:', error);
                Alert.alert('Error', 'Failed to load available machines');
            } finally {
                setMachinesLoading(false);
            }
        };

        fetchAvailableMachines();
    }, [userToken]);

    const toggleMachineSelection = (id) => {
        setSelectedMachineIds(prev => 
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    const handleAllocate = async () => {
        if (selectedMachineIds.length === 0) {
            Alert.alert('Error', 'Please select at least one machine to allocate');
            return;
        }

        if (!startDateSelected) {
            Alert.alert('Error', 'Please select an estimated start date');
            return;
        }
        if (!endDateSelected) {
            Alert.alert('Error', 'Please select an estimated completion date');
            return;
        }

        // Compare dates (ignoring time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startCompare = new Date(startDate);
        startCompare.setHours(0, 0, 0, 0);

        const endCompare = new Date(endDate);
        endCompare.setHours(0, 0, 0, 0);

        if (startCompare < today) {
            Alert.alert('Error', 'Start date cannot be in the past');
            return;
        }
        if (endCompare < startCompare) {
            Alert.alert('Error', 'Completion date must be on or after the start date');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/production/${order._id}/allocate`, {
                machineIds: selectedMachineIds,
                estStartDate: startDate.toISOString(),
                estEndDate: endDate.toISOString()
            }, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            Alert.alert('Success', 'Machines allocated and production started!', [
                { text: 'OK', onPress: () => navigation.replace('ManufacturerDashboard') }
            ]);
        } catch (error) {
            console.error('Allocation error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to allocate machines.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Allocate Machines</Text>
                </View>

                {/* Order Summary Card */}
                <Card style={styles.orderCard}>
                    <Text style={styles.orderTitle}>{order.title}</Text>
                    <Text style={styles.orderDetail}>Quantity: {order.quantity} pcs</Text>
                    <Text style={styles.orderDetail}>Deadline: {order.deadline ? new Date(order.deadline).toLocaleDateString() : 'N/A'}</Text>
                </Card>

                {/* Date Inputs */}
                <View style={styles.formGroup}>
                    <View style={{ marginBottom: spacing.m }}>
                        <Text style={styles.inputLabel}>Estimated Start Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)} activeOpacity={0.7}>
                            <Text style={startDateSelected ? styles.dateText : styles.datePlaceholderText}>
                                {startDateSelected ? startDate.toLocaleDateString('en-GB') : 'Select Date (DD/MM/YYYY)'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {Platform.OS === 'ios' ? (
                        <Modal visible={showStartPicker} transparent animationType="slide" onRequestClose={() => setShowStartPicker(false)}>
                            <View style={styles.modalOverlay}>
                                <View style={styles.pickerContainer}>
                                    <DateTimePicker
                                        value={startDate}
                                        mode="date"
                                        display="spinner"
                                        minimumDate={new Date()}
                                        onChange={onStartChange}
                                        textColor="#000000"
                                    />
                                    <TouchableOpacity style={styles.modalCloseButton} onPress={() => {
                                        setShowStartPicker(false);
                                        setStartDateSelected(true);
                                    }}>
                                        <Text style={styles.modalCloseText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    ) : (
                        showStartPicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                onChange={onStartChange}
                            />
                        )
                    )}

                    <View style={{ marginBottom: spacing.m }}>
                        <Text style={styles.inputLabel}>Estimated Completion Date</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)} activeOpacity={0.7}>
                            <Text style={endDateSelected ? styles.dateText : styles.datePlaceholderText}>
                                {endDateSelected ? endDate.toLocaleDateString('en-GB') : 'Select Date (DD/MM/YYYY)'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {Platform.OS === 'ios' ? (
                        <Modal visible={showEndPicker} transparent animationType="slide" onRequestClose={() => setShowEndPicker(false)}>
                            <View style={styles.modalOverlay}>
                                <View style={styles.pickerContainer}>
                                    <DateTimePicker
                                        value={endDate}
                                        mode="date"
                                        display="spinner"
                                        minimumDate={startDateSelected ? startDate : new Date()}
                                        onChange={onEndChange}
                                        textColor="#000000"
                                    />
                                    <TouchableOpacity style={styles.modalCloseButton} onPress={() => {
                                        setShowEndPicker(false);
                                        setEndDateSelected(true);
                                    }}>
                                        <Text style={styles.modalCloseText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    ) : (
                        showEndPicker && (
                            <DateTimePicker
                                value={endDate}
                                mode="date"
                                display="default"
                                minimumDate={startDateSelected ? startDate : new Date()}
                                onChange={onEndChange}
                            />
                        )
                    )}
                </View>

                {/* Machine Checklist */}
                <View style={styles.machineSection}>
                    <Text style={styles.sectionTitle}>Select Available Machines</Text>
                    
                    {machinesLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.l }} />
                    ) : availableMachines.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No available machines found.</Text>
                            <TouchableOpacity 
                                style={styles.addMachineLink}
                                onPress={() => navigation.navigate('AddEditMachine')}
                            >
                                <Text style={styles.addMachineLinkText}>Add new machines or free up busy ones.</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        availableMachines.map(machine => {
                            const isSelected = selectedMachineIds.includes(machine._id);
                            return (
                                <TouchableOpacity
                                    key={machine._id}
                                    style={[
                                        styles.machineRow,
                                        isSelected && styles.machineRowActive
                                    ]}
                                    onPress={() => toggleMachineSelection(machine._id)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.machineRowInfo}>
                                        <Text style={[styles.machineName, isSelected && styles.machineTextActive]}>
                                            {machine.name}
                                        </Text>
                                        <Text style={[styles.machineType, isSelected && styles.machineTextActive]}>
                                            {machine.type.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.checkbox,
                                        isSelected && styles.checkboxActive
                                    ]}>
                                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <CustomButton
                    title={loading ? 'Allocating...' : 'Confirm Allocation'}
                    onPress={handleAllocate}
                    disabled={loading || availableMachines.length === 0}
                    style={styles.submitButton}
                />
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: spacing.m,
        paddingTop: spacing.m,
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.l,
        marginTop: spacing.s,
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
    },
    orderCard: {
        padding: spacing.m,
        backgroundColor: colors.surface,
        borderLeftWidth: 4,
        borderLeftColor: colors.secondary,
        marginBottom: spacing.m,
    },
    orderTitle: {
        ...typography.subheader,
        color: colors.primary,
        marginBottom: spacing.s,
    },
    orderDetail: {
        ...typography.body,
        fontSize: 14,
        color: colors.textLight,
        marginBottom: 2,
    },
    formGroup: {
        marginBottom: spacing.m,
    },
    machineSection: {
        marginBottom: spacing.l,
    },
    sectionTitle: {
        ...typography.subheader,
        fontSize: 16,
        marginBottom: spacing.m,
        color: colors.primary,
    },
    machineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.m,
        marginBottom: spacing.s,
    },
    machineRowActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '05',
    },
    machineRowInfo: {
        flex: 1,
    },
    machineName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    machineType: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.textLight,
    },
    machineTextActive: {
        color: colors.primary,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface,
    },
    checkboxActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    checkmark: {
        color: colors.surface,
        fontWeight: 'bold',
        fontSize: 14,
    },
    submitButton: {
        marginTop: spacing.m,
    },
    emptyContainer: {
        padding: spacing.l,
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyText: {
        ...typography.body,
        color: colors.textLight,
        marginBottom: spacing.xs,
    },
    addMachineLinkText: {
        color: colors.secondary,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    inputLabel: {
        ...typography.caption,
        color: colors.text,
        fontWeight: '600',
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    dateButton: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.m,
        paddingVertical: Platform.OS === 'ios' ? spacing.m : spacing.m,
        justifyContent: 'center',
        height: 52,
    },
    dateText: {
        color: colors.text,
        fontSize: 16,
    },
    datePlaceholderText: {
        color: colors.textLight,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    pickerContainer: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: spacing.m,
        paddingBottom: spacing.xl,
    },
    modalCloseButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.m,
    },
    modalCloseText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default AllocateMachinesScreen;
