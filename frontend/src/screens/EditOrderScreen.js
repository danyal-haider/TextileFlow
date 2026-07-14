import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme';
import { API_URL } from '../config';

const EditOrderScreen = ({ navigation, route }) => {
    const { order } = route.params;
    const { userToken } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    // Form State
    const [details, setDetails] = useState(order.description || '');
    const [quantity, setQuantity] = useState(order.quantity?.toString() || '');
    const [material, setMaterial] = useState(order.material || '');
    const [color, setColor] = useState(order.color || '');
    const [size, setSize] = useState(order.size || '');
    const [logos, setLogos] = useState(order.noOfLogos?.toString() || '');
    const [deadline, setDeadline] = useState('');

    useEffect(() => {
        if (order.deadline) {
            const date = new Date(order.deadline);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            setDeadline(`${day}/${month}/${year}`);
        }
    }, [order]);

    const handleSubmit = async () => {
        if (!details || !quantity || !material || !deadline) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        // Validate Date DD/MM/YYYY
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = deadline.match(dateRegex);

        if (!match) {
            Alert.alert('Error', 'Please enter deadline in DD/MM/YYYY format');
            return;
        }

        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // 0-indexed
        const year = parseInt(match[3], 10);

        const dateObj = new Date(year, month, day);

        if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month || dateObj.getDate() !== day) {
            Alert.alert('Error', 'Invalid date');
            return;
        }

        if (dateObj < new Date().setHours(0, 0, 0, 0)) {
            Alert.alert('Error', 'Deadline cannot be in the past');
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                title: `Order: ${material} - ${quantity} pcs`,
                description: details,
                quantity: parseInt(quantity),
                deadline: dateObj.toISOString(),
                material,
                color,
                size,
                noOfLogos: logos ? parseInt(logos) : 0,
                // Ensure customDetails structure if backend expects it nested
                customDetails: {
                    material,
                    color,
                    size,
                    logos,
                    deadline: dateObj.toISOString()
                }
            };

            const BASE_URL = `${API_URL}/orders/${order._id}`;

            await axios.put(BASE_URL, orderData, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            Alert.alert('Success', 'Order updated successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('ExporterDashboard') }
            ]);
        } catch (error) {
            console.log('Update Order Error:', error);
            Alert.alert('Error', 'Failed to update order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Order</Text>
                    <View style={styles.headerRightSpacer} />
                </View>

                <View style={styles.form}>
                    <CustomInput
                        label="Order Details / Description *"
                        placeholder="Describe what you need..."
                        multiline
                        numberOfLines={3}
                        value={details}
                        onChangeText={setDetails}
                    />

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <CustomInput
                                label="Quantity *"
                                placeholder="e.g. 500"
                                keyboardType="numeric"
                                value={quantity}
                                onChangeText={setQuantity}
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <CustomInput
                                label="No of Logos"
                                placeholder="e.g. 2"
                                keyboardType="numeric"
                                value={logos}
                                onChangeText={setLogos}
                            />
                        </View>
                    </View>

                    <CustomInput
                        label="Material Type *"
                        placeholder="e.g. Cotton, Polyester"
                        value={material}
                        onChangeText={setMaterial}
                    />

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <CustomInput
                                label="Color"
                                placeholder="e.g. Red"
                                value={color}
                                onChangeText={setColor}
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <CustomInput
                                label="Size"
                                placeholder="e.g. L"
                                value={size}
                                onChangeText={setSize}
                            />
                        </View>
                    </View>

                    <CustomInput
                        label="Deadline *"
                        placeholder="DD/MM/YYYY"
                        value={deadline}
                        onChangeText={setDeadline}
                        maxLength={10}
                    />

                    <View style={styles.footer}>
                        <CustomButton
                            title={loading ? "Updating..." : "Update Order"}
                            onPress={handleSubmit}
                            disabled={loading}
                        />
                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.m,
        paddingBottom: 80,
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
        color: colors.primary,
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
    form: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    footer: {
        marginTop: spacing.m,
        marginBottom: spacing.xl,
    },
});

export default EditOrderScreen;
