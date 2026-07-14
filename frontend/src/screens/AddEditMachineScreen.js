import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme';
import { API_URL } from '../config';

const AddEditMachineScreen = ({ navigation, route }) => {
    const { userToken } = useContext(AuthContext);
    const editingMachine = route.params?.machine;

    const [name, setName] = useState('');
    const [type, setType] = useState('cutting');
    const [status, setStatus] = useState('Available');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingMachine) {
            setName(editingMachine.name);
            setType(editingMachine.type);
            setStatus(editingMachine.status);
        }
    }, [editingMachine]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter machine name');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: name.trim(),
                type,
                status
            };

            if (editingMachine) {
                // Update Machine
                await axios.put(`${API_URL}/machines/${editingMachine._id}`, payload, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                Alert.alert('Success', 'Machine updated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                // Create Machine
                await axios.post(`${API_URL}/machines`, payload, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                Alert.alert('Success', 'Machine added successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Save machine error:', error);
            Alert.alert('Error', 'Failed to save machine. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const machineTypes = [
        { id: 'cutting', label: 'Cutting' },
        { id: 'sewing', label: 'Sewing' },
        { id: 'printing', label: 'Printing' },
        { id: 'embroidery', label: 'Embroidery' }
    ];

    const machineStatuses = [
        { id: 'Available', label: 'Available' },
        { id: 'Busy', label: 'Busy' },
        { id: 'Under Maintenance', label: 'Maintenance' }
    ];

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {editingMachine ? 'Edit Machine' : 'Add Machine'}
                    </Text>
                    <View style={styles.headerRightSpacer} />
                </View>

                <View style={styles.form}>
                    <CustomInput
                        label="Machine Name"
                        placeholder="e.g., Singer HighSpeed 300"
                        value={name}
                        onChangeText={setName}
                    />

                    {/* Machine Type Selection */}
                    <View style={styles.selectionSection}>
                        <Text style={styles.sectionLabel}>Machine Type</Text>
                        <View style={styles.selectorRow}>
                            {machineTypes.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.selectorChip,
                                        type === item.id && styles.selectorChipActive
                                    ]}
                                    onPress={() => setType(item.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.selectorText,
                                            type === item.id && styles.selectorTextActive
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Machine Status Selection */}
                    <View style={styles.selectionSection}>
                        <Text style={styles.sectionLabel}>Machine Status</Text>
                        <View style={styles.selectorRow}>
                            {machineStatuses.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.selectorChip,
                                        status === item.id && styles.selectorChipActive
                                    ]}
                                    onPress={() => setStatus(item.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.selectorText,
                                            status === item.id && styles.selectorTextActive
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <CustomButton
                        title={loading ? 'Saving...' : 'Save Machine'}
                        onPress={handleSave}
                        disabled={loading}
                        style={styles.saveButton}
                    />
                </View>
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
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
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
    form: {
        flex: 1,
    },
    selectionSection: {
        marginBottom: spacing.l,
    },
    sectionLabel: {
        ...typography.caption,
        color: colors.text,
        fontWeight: '600',
        marginBottom: spacing.s,
        marginLeft: spacing.xs,
    },
    selectorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    selectorChip: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 10,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    selectorChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    selectorText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textLight,
    },
    selectorTextActive: {
        color: colors.surface,
        fontWeight: '600',
    },
    saveButton: {
        marginTop: spacing.xl,
    },
});

export default AddEditMachineScreen;
