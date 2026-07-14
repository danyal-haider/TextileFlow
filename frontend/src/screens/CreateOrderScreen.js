import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Card from '../components/Card';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { API_URL } from '../config';

const CreateOrderScreen = ({ navigation }) => {
    const { userToken } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    // Form Fields
    const [details, setDetails] = useState('');
    const [quantity, setQuantity] = useState('');
    const [material, setMaterial] = useState('');
    const [color, setColor] = useState('');
    
    // Deadline Date Picker states
    const [deadline, setDeadline] = useState(new Date());
    const [deadlineSelected, setDeadlineSelected] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDeadline(selectedDate);
            setDeadlineSelected(true);
        }
    };

    // Enhanced Specs Fields
    const [category, setCategory] = useState(['T-Shirts / Tops']);
    const [gender, setGender] = useState('Unisex');
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [sizeBreakdown, setSizeBreakdown] = useState('');
    const [customizationType, setCustomizationType] = useState('None');
    const [logoPlacement, setLogoPlacement] = useState('');
    const [noOfLogos, setNoOfLogos] = useState('');
    const [targetPrice, setTargetPrice] = useState('');
    const [sampleRequired, setSampleRequired] = useState(false);

    // Selector options
    const categories = [
        'T-Shirts / Tops',
        'Hoodies / Sweatshirts',
        'Pants / Trousers',
        'Jackets / Outerwear',
        'Fabric Rolls',
        'Other'
    ];

    const genders = ['Men', 'Women', 'Unisex', 'Kids'];
    const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    
    const customizationTypes = [
        'None',
        'Screen Printing',
        'Embroidery',
        'Sublimation',
        'Both'
    ];

    const toggleSize = (size) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const toggleCategory = (cat) => {
        setCategory(prev =>
            prev.includes(cat)
                ? (prev.length > 1 ? prev.filter(c => c !== cat) : prev)
                : [...prev, cat]
        );
    };

    const getLogoPlacementPlaceholder = () => {
        if (category.includes('Pants / Trousers')) return 'e.g., Left Thigh, Back Pocket';
        if (category.includes('T-Shirts / Tops')) return 'e.g., Center Chest, Left Sleeve';
        if (category.includes('Hoodies / Sweatshirts')) return 'e.g., Back Print, Left Chest Logo';
        return 'e.g., Front Chest, Left Arm';
    };

    const handleSubmit = async () => {
        if (!details || !quantity || !material || !deadlineSelected || category.length === 0) {
            Alert.alert('Error', 'Please fill in all required fields (Description, Quantity, Material, Category, Deadline)');
            return;
        }

        // Compare deadline with today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deadlineCompare = new Date(deadline);
        deadlineCompare.setHours(0, 0, 0, 0);

        if (deadlineCompare < today) {
            Alert.alert('Error', 'Deadline cannot be in the past');
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                description: details.trim(),
                quantity: parseInt(quantity, 10),
                material: material.trim(),
                color: color.trim() || 'N/A',
                size: selectedSizes.join(', ') || 'N/A', // legacy fallback
                noOfLogos: customizationType === 'None' ? 0 : parseInt(noOfLogos, 10) || 0, // legacy fallback
                category,
                gender,
                sizes: selectedSizes,
                sizeBreakdown: sizeBreakdown.trim(),
                customizationType,
                logoPlacement: customizationType === 'None' ? '' : logoPlacement.trim(),
                targetPrice: targetPrice ? Number(targetPrice) : undefined,
                sampleRequired,
                deadline: deadline.toISOString()
            };

            const BASE_URL = `${API_URL}/orders`;

            await axios.post(BASE_URL, orderData, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            Alert.alert('Success', 'Order created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.log('Create Order Error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create order. Please try again.');
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
                    <Text style={styles.title}>Create New Order</Text>
                    <View style={styles.headerRightSpacer} />
                </View>

                <View style={styles.form}>
                    
                    {/* Basic Specs Card */}
                    <Card style={styles.formCard}>
                        <Text style={styles.cardHeader}>1. Product Type & Target</Text>
                        
                        <Text style={styles.inputLabel}>Product Category *</Text>
                        <View style={styles.chipsGrid}>
                            {categories.map((item) => {
                                const isSelected = category.includes(item);
                                return (
                                    <TouchableOpacity
                                        key={item}
                                        style={[
                                            styles.chip,
                                            isSelected && styles.chipActive
                                        ]}
                                        onPress={() => toggleCategory(item)}
                                    >
                                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[styles.inputLabel, { marginTop: spacing.m }]}>Target Audience *</Text>
                        <View style={styles.chipsRow}>
                            {genders.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.chip,
                                        gender === item && styles.chipActive
                                    ]}
                                    onPress={() => setGender(item)}
                                >
                                    <Text style={[styles.chipText, gender === item && styles.chipTextActive]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Card>

                    {/* Specifications Card */}
                    <Card style={styles.formCard}>
                        <Text style={styles.cardHeader}>2. Specifications & Sizing</Text>

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <CustomInput
                                    label="Material Type *"
                                    placeholder="e.g., Cotton"
                                    value={material}
                                    onChangeText={setMaterial}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <CustomInput
                                    label="Color"
                                    placeholder="e.g., Red"
                                    value={color}
                                    onChangeText={setColor}
                                />
                            </View>
                        </View>

                        <Text style={[styles.inputLabel, { marginTop: spacing.s }]}>Sizes (Select all that apply)</Text>
                        <View style={styles.chipsRow}>
                            {sizeOptions.map((item) => {
                                const isSelected = selectedSizes.includes(item);
                                return (
                                    <TouchableOpacity
                                        key={item}
                                        style={[
                                            styles.sizeChip,
                                            isSelected && styles.sizeChipActive
                                        ]}
                                        onPress={() => toggleSize(item)}
                                    >
                                        <Text style={[styles.sizeChipText, isSelected && styles.sizeChipTextActive]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <CustomInput
                            label="Size Breakdown / Description"
                            placeholder="e.g., 100 S, 200 M, 200 L..."
                            multiline
                            numberOfLines={2}
                            value={sizeBreakdown}
                            onChangeText={setSizeBreakdown}
                        />
                    </Card>

                    {/* Branding & Logo Customization Card */}
                    <Card style={styles.formCard}>
                        <Text style={styles.cardHeader}>3. Branding & Customization</Text>

                        <Text style={styles.inputLabel}>Customization Type</Text>
                        <View style={styles.chipsGrid}>
                            {customizationTypes.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.chip,
                                        customizationType === item && styles.chipActive
                                    ]}
                                    onPress={() => setCustomizationType(item)}
                                >
                                    <Text style={[styles.chipText, customizationType === item && styles.chipTextActive]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {customizationType !== 'None' && (
                            <View style={{ marginTop: spacing.m }}>
                                <View style={styles.row}>
                                    <View style={styles.halfInput}>
                                        <CustomInput
                                            label="Number of Logos"
                                            placeholder="e.g., 2"
                                            keyboardType="numeric"
                                            value={noOfLogos}
                                            onChangeText={setNoOfLogos}
                                        />
                                    </View>
                                    <View style={styles.halfInput}>
                                        <CustomInput
                                            label="Logo Placement"
                                            placeholder={getLogoPlacementPlaceholder()}
                                            value={logoPlacement}
                                            onChangeText={setLogoPlacement}
                                        />
                                    </View>
                                </View>
                            </View>
                        )}
                    </Card>

                    {/* Commercials & Logistics Card */}
                    <Card style={styles.formCard}>
                        <Text style={styles.cardHeader}>4. Pricing & Logistics</Text>

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <CustomInput
                                    label="Quantity Required *"
                                    placeholder="e.g., 500"
                                    keyboardType="numeric"
                                    value={quantity}
                                    onChangeText={setQuantity}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <CustomInput
                                    label="Target Price (PKR)"
                                    placeholder="e.g., 850"
                                    keyboardType="numeric"
                                    value={targetPrice}
                                    onChangeText={setTargetPrice}
                                />
                            </View>
                        </View>



                        <View style={{ marginBottom: spacing.m }}>
                            <Text style={styles.inputLabel}>Delivery Deadline *</Text>
                            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                                <Text style={deadlineSelected ? styles.dateText : styles.datePlaceholderText}>
                                    {deadlineSelected ? deadline.toLocaleDateString('en-GB') : 'Select Date (DD/MM/YYYY)'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {Platform.OS === 'ios' ? (
                            <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
                                <View style={styles.modalOverlay}>
                                    <View style={styles.pickerContainer}>
                                        <DateTimePicker
                                            value={deadline}
                                            mode="date"
                                            display="spinner"
                                            minimumDate={new Date()}
                                            onChange={onDateChange}
                                            textColor="#000000"
                                        />
                                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => {
                                            setShowDatePicker(false);
                                            setDeadlineSelected(true); // Ensure marked selected when closing done
                                        }}>
                                            <Text style={styles.modalCloseText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Modal>
                        ) : (
                            showDatePicker && (
                                <DateTimePicker
                                    value={deadline}
                                    mode="date"
                                    display="default"
                                    minimumDate={new Date()}
                                    onChange={onDateChange}
                                />
                            )
                        )}
                    </Card>

                    {/* Description Card */}
                    <Card style={styles.formCard}>
                        <Text style={styles.cardHeader}>5. Additional Description</Text>
                        <CustomInput
                            label="Order Details / Description *"
                            placeholder="Describe fabrics, stitching quality, print sizing, packaging requirements..."
                            multiline
                            numberOfLines={4}
                            value={details}
                            onChangeText={setDetails}
                        />
                    </Card>

                    <View style={styles.footer}>
                        <CustomButton
                            title={loading ? "Submitting..." : "Submit Order"}
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
        paddingHorizontal: spacing.m,
        paddingTop: spacing.m,
        paddingBottom: 100,
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
    formCard: {
        padding: spacing.m,
        marginBottom: spacing.m,
        backgroundColor: colors.surface,
        borderRadius: 16,
        ...shadows.small,
    },
    cardHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.s,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    inputLabel: {
        ...typography.caption,
        color: colors.text,
        fontWeight: '600',
        marginBottom: spacing.s,
        marginLeft: spacing.xs,
    },
    chipsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
        marginBottom: spacing.s,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
        marginBottom: spacing.s,
    },
    chip: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        color: colors.textLight,
        fontSize: 13,
        fontWeight: '500',
    },
    chipTextActive: {
        color: colors.surface,
        fontWeight: '600',
    },
    sizeChip: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sizeChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    sizeChipText: {
        color: colors.textLight,
        fontSize: 12,
        fontWeight: 'bold',
    },
    sizeChipTextActive: {
        color: colors.surface,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 4,
        marginBottom: spacing.m,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: colors.surface,
        ...shadows.small,
    },
    toggleText: {
        color: colors.textLight,
        fontWeight: '600',
        fontSize: 14,
    },
    toggleTextActive: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: spacing.s,
        marginBottom: spacing.xl,
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

export default CreateOrderScreen;
