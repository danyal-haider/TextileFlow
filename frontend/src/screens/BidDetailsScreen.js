import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../theme';
import { API_URL as URL_CONFIG } from '../config';

const BidDetailsScreen = ({ route, navigation }) => {
    const { bid, order } = route.params;
    const { userToken } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    const BASE_URL = URL_CONFIG;

    const handleAcceptBid = async () => {
        Alert.alert(
            "Accept Bid",
            "Are you sure you want to accept this bid? This will assign the order to this manufacturer and reject all other bids.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Accept",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await axios.put(`${BASE_URL}/bids/${bid._id}/accept`, {}, {
                                headers: { Authorization: `Bearer ${userToken}` }
                            });
                            Alert.alert('Success', 'Bid accepted successfully!');
                            navigation.navigate('ExporterDashboard'); // Go back to dashboard
                        } catch (error) {
                            console.error('Error accepting bid:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to accept bid');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleRejectBid = async () => {
        Alert.alert(
            "Reject Bid",
            "Are you sure you want to reject this bid?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await axios.put(`${BASE_URL}/bids/${bid._id}/reject`, {}, {
                                headers: { Authorization: `Bearer ${userToken}` }
                            });
                            Alert.alert('Success', 'Bid rejected');
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error rejecting bid:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to reject bid');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const isPending = (bid.status === 'pending' && order.status === 'bidding') || order.status === 'pending';

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Bid Details</Text>
                    <View style={styles.headerRightSpacer} />
                </View>

                {/* Bid Cost & Specifications Card */}
                <Card style={styles.card}>
                    {/* Manufacturer Header */}
                    <View style={styles.manufacturerSection}>
                        <Text style={styles.manufacturerLabel}>BID SUBMITTED BY</Text>
                        <Text style={styles.manufacturerName}>{bid.manufacturer?.name || 'Unknown'}</Text>
                        <Text style={styles.manufacturerDetails}>
                            {bid.manufacturer?.companyName || 'Verified Manufacturer'}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* cost details grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCell}>
                            <Text style={styles.statLabel}>PRICE / UNIT</Text>
                            <Text style={styles.statVal}>PKR {bid.pricePerUnit}</Text>
                        </View>
                        <View style={styles.statCell}>
                            <Text style={styles.statLabel}>QUANTITY</Text>
                            <Text style={styles.statVal}>{order.quantity} pcs</Text>
                        </View>
                        <View style={styles.statCell}>
                            <Text style={styles.statLabel}>TOTAL AMOUNT</Text>
                            <Text style={[styles.statVal, { color: colors.secondary }]}>PKR {bid.price}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Timeline Specs */}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Proposed Delivery Date:</Text>
                        <Text style={[styles.infoValue, { color: colors.primary, fontWeight: 'bold' }]}>
                            {new Date(bid.deadline).toLocaleDateString('en-GB')}
                        </Text>
                    </View>

                    {order.deadline && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Exporter Deadline:</Text>
                            <Text style={styles.infoValue}>
                                {new Date(order.deadline).toLocaleDateString('en-GB')}
                            </Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* Proposal notes */}
                    <Text style={styles.proposalHeader}>Proposal & Manufacturing Terms</Text>
                    <View style={styles.proposalBox}>
                        <Text style={styles.proposalText}>
                            {bid.proposal ? `"${bid.proposal}"` : 'No additional notes provided by manufacturer.'}
                        </Text>
                    </View>
                </Card>

                {/* Exporter Actions */}
                {isPending && (
                    <View style={styles.actions}>
                        <CustomButton
                            title={loading ? "Processing..." : "Accept Bid"}
                            onPress={handleAcceptBid}
                            disabled={loading}
                            style={[styles.button, { backgroundColor: colors.success }]}
                        />
                        <CustomButton
                            title="Reject Bid"
                            onPress={handleRejectBid}
                            disabled={loading}
                            style={[styles.button, { backgroundColor: colors.error }]}
                        />
                    </View>
                )}

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
    card: {
        padding: spacing.m,
        borderRadius: 16,
        backgroundColor: colors.surface,
        ...shadows.small,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.m,
    },
    manufacturerSection: {
        alignItems: 'center',
        paddingVertical: spacing.s,
    },
    manufacturerLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.textLight,
        letterSpacing: 1,
        marginBottom: 4,
    },
    manufacturerName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
    },
    manufacturerDetails: {
        fontSize: 13,
        color: colors.textLight,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.s,
    },
    statsGrid: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: spacing.m,
        marginVertical: spacing.s,
        justifyContent: 'space-around',
    },
    statCell: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 9,
        color: colors.textLight,
        fontWeight: '600',
        marginBottom: 4,
    },
    statVal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    infoLabel: {
        fontSize: 13,
        color: colors.textLight,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    proposalHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: spacing.s,
        marginBottom: spacing.s,
    },
    proposalBox: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    proposalText: {
        fontSize: 13,
        color: colors.textLight,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.m,
    },
    button: {
        width: '48%',
        height: 50,
        paddingVertical: 0,
        borderRadius: 12,
    },
    backBtn: {
        marginTop: spacing.m,
        borderColor: colors.border,
    },
});

export default BidDetailsScreen;
