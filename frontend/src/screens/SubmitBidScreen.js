import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import CustomButton from '../components/CustomButton';
import Card from '../components/Card';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { API_URL } from '../config';

const SubmitBidScreen = ({ navigation, route }) => {
    const { order } = route.params;
    const { userToken } = useContext(AuthContext);

    // Form fields
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [proposal, setProposal] = useState('');
    const [loading, setLoading] = useState(false);

    // Date picker state for bid deadline
    const [bidDeadline, setBidDeadline] = useState(new Date());
    const [bidDeadlineSelected, setBidDeadlineSelected] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const totalPrice = pricePerUnit ? (parseFloat(pricePerUnit) * order.quantity).toFixed(2) : '0';

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setBidDeadline(selectedDate);
            setBidDeadlineSelected(true);
        }
    };

    const handleSubmit = async () => {
        if (!pricePerUnit || !bidDeadlineSelected) {
            Alert.alert('Error', 'Please fill in Price Per Unit and select your Delivery Deadline');
            return;
        }

        // Compare bid delivery date with today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deadlineCompare = new Date(bidDeadline);
        deadlineCompare.setHours(0, 0, 0, 0);

        if (deadlineCompare < today) {
            Alert.alert('Error', 'Delivery date cannot be in the past');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/bids`, {
                orderId: order._id,
                pricePerUnit: Number(pricePerUnit),
                deadline: bidDeadline.toISOString(),
                proposal
            }, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            Alert.alert('Success', 'Bid submitted successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('MyBids') }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit bid');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Submit Bid</Text>
                    <View style={styles.headerRightSpacer} />
                </View>

                {/* Rich Specs Summary Card */}
                <Card style={styles.orderCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText} numberOfLines={1} ellipsizeMode="tail">
                                {Array.isArray(order.category) ? order.category.join(', ') : (order.category || 'Order Spec')}
                            </Text>
                        </View>
                        <Text style={styles.audienceText}>{order.gender || 'Unisex'}</Text>
                    </View>
                    
                    <Text style={styles.orderTitle}>{order.title}</Text>
                    {order.description ? (
                        <Text style={styles.orderDesc}>{order.description}</Text>
                    ) : null}

                    <View style={styles.divider} />

                    <View style={styles.specsGrid}>
                        <View style={styles.specCell}>
                            <Text style={styles.specLabel}>Quantity</Text>
                            <Text style={styles.specValue}>{order.quantity} pcs</Text>
                        </View>
                        <View style={styles.specCell}>
                            <Text style={styles.specLabel}>Material</Text>
                            <Text style={styles.specValue}>{order.material || 'N/A'}</Text>
                        </View>
                        <View style={styles.specCell}>
                            <Text style={styles.specLabel}>Target Price</Text>
                            <Text style={[styles.specValue, { color: colors.secondary }]}>
                                {order.targetPrice ? `PKR ${order.targetPrice}` : 'Open'}
                            </Text>
                        </View>
                    </View>

                    {order.sizes && order.sizes.length > 0 && (
                        <View style={styles.sizesRow}>
                            <Text style={styles.sizesLabel}>Sizes Required: </Text>
                            {order.sizes.map((sz, i) => (
                                <View key={i} style={styles.sizeChip}>
                                    <Text style={styles.sizeChipText}>{sz}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.row}>
                        <Text style={styles.labelTitle}>Customization:</Text>
                        <Text style={styles.valueText}>{order.customizationType || 'None'}</Text>
                    </View>
                    
                    {order.customizationType && order.customizationType !== 'None' && (
                        <View style={styles.row}>
                            <Text style={styles.labelTitle}>Logo Placement:</Text>
                            <Text style={styles.valueText}>{order.logoPlacement || 'N/A'}</Text>
                        </View>
                    )}

                    <View style={styles.row}>
                        <Text style={styles.labelTitle}>Sample Needed:</Text>
                        <Text style={styles.valueText}>{order.sampleRequired ? 'Yes' : 'No'}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.labelTitle}>Exporter Deadline:</Text>
                        <Text style={[styles.valueText, { color: colors.error, fontWeight: 'bold' }]}>
                            {order.deadline ? new Date(order.deadline).toLocaleDateString('en-GB') : 'N/A'}
                        </Text>
                    </View>
                </Card>

                {/* Form Elements */}
                <View style={styles.formContainer}>
                    <Text style={styles.formLabel}>Price Per Unit (PKR) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter price per unit, e.g. 500"
                        keyboardType="numeric"
                        placeholderTextColor={colors.textLight}
                        value={pricePerUnit}
                        onChangeText={setPricePerUnit}
                    />

                    <Text style={styles.formLabel}>Total Bid Amount (Auto)</Text>
                    <View style={styles.readOnlyInput}>
                        <Text style={styles.readOnlyText}>PKR {totalPrice}</Text>
                    </View>

                    <Text style={styles.formLabel}>My Proposed Delivery Date *</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                        <Text style={bidDeadlineSelected ? styles.dateText : styles.datePlaceholderText}>
                            {bidDeadlineSelected ? bidDeadline.toLocaleDateString('en-GB') : 'Select Delivery Date (DD/MM/YYYY)'}
                        </Text>
                    </TouchableOpacity>

                    {Platform.OS === 'ios' ? (
                        <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
                            <View style={styles.modalOverlay}>
                                <View style={styles.pickerContainer}>
                                    <DateTimePicker
                                        value={bidDeadline}
                                        mode="date"
                                        display="spinner"
                                        minimumDate={new Date()}
                                        onChange={onDateChange}
                                        textColor="#000000"
                                    />
                                    <TouchableOpacity style={styles.modalCloseButton} onPress={() => {
                                        setShowDatePicker(false);
                                        setBidDeadlineSelected(true);
                                    }}>
                                        <Text style={styles.modalCloseText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    ) : (
                        showDatePicker && (
                            <DateTimePicker
                                value={bidDeadline}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                onChange={onDateChange}
                            />
                        )
                    )}

                    <Text style={[styles.formLabel, { marginTop: spacing.m }]}>Proposal / Notes (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe your stitching standards, fabric quality, and packaging details..."
                        placeholderTextColor={colors.textLight}
                        multiline
                        numberOfLines={4}
                        value={proposal}
                        onChangeText={setProposal}
                        textAlignVertical="top"
                    />

                    <CustomButton
                        title={loading ? 'Submitting...' : 'Submit Bid'}
                        onPress={handleSubmit}
                        disabled={loading}
                        style={styles.submitButton}
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.m,
        paddingTop: spacing.m,
        paddingBottom: spacing.xl,
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
    orderCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.m,
        marginBottom: spacing.l,
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
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        maxWidth: '65%',
    },
    categoryBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.primary,
    },
    audienceText: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '500',
    },
    orderTitle: {
        ...typography.subheader,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    orderDesc: {
        ...typography.body,
        color: colors.textLight,
        fontSize: 14,
        marginBottom: spacing.s,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.s,
    },
    specsGrid: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 10,
        paddingVertical: spacing.s,
        marginBottom: spacing.m,
        justifyContent: 'space-around',
    },
    specCell: {
        alignItems: 'center',
    },
    specLabel: {
        fontSize: 9,
        color: colors.textLight,
        fontWeight: '600',
        marginBottom: 2,
    },
    specValue: {
        fontSize: 12,
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
        marginHorizontal: 2,
        marginVertical: 2,
    },
    sizeChipText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.text,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    labelTitle: {
        fontSize: 12,
        color: colors.textLight,
        width: 130,
    },
    valueText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    formContainer: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.m,
        ...shadows.small,
        borderWidth: 1,
        borderColor: colors.border,
    },
    formLabel: {
        ...typography.caption,
        color: colors.text,
        fontWeight: '600',
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
        marginBottom: spacing.m,
        backgroundColor: colors.surface,
        fontSize: 16,
        color: colors.text,
    },
    readOnlyInput: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
        marginBottom: spacing.m,
    },
    readOnlyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textLight,
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
        marginBottom: spacing.s,
    },
    dateText: {
        color: colors.text,
        fontSize: 16,
    },
    datePlaceholderText: {
        color: colors.textLight,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        marginBottom: spacing.l,
    },
    submitButton: {
        marginTop: spacing.s,
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

export default SubmitBidScreen;
