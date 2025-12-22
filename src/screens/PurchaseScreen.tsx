import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    StatusBar,
    ScrollView,
    Pressable,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useStripe } from '@stripe/stripe-react-native';
import { RootStackParamList } from '../../App';
import { moderateScale, moderateVerticalScale } from 'react-native-size-matters';
import {
    text,
    secondaryText,
    primaryButtonBackground,
    pressedPrimaryButtonBackground,
    whiteFieldContainerBackground,
    topGradientColor,
    bottomGradientColor,
    pressedIconButtonBackground,
} from '../utils/colors';
import paymentService, { Plan } from '../services/paymentService';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { getMe } from '../features/userProfile/userProfileSlice';
// @ts-ignore: Module declaration for SVGs is missing in the project types
import BackIcon from '../../assets/icons/ic_back_plain.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Purchase'>;

const PurchaseScreen: React.FC<Props> = ({ navigation }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState<string | null>(null);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const dispatch = useAppDispatch();
    const userProfile = useAppSelector((state) => state.userProfile);

    useEffect(() => {
        StatusBar.setBarStyle('light-content');
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const fetchedPlans = await paymentService.getPlans();
            setPlans(fetchedPlans);
        } catch (error: any) {
            console.error('Error fetching plans:', error);
            Alert.alert('Error', error.message || 'Failed to load plans. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (plan: Plan) => {
        try {
            setProcessingPayment(plan.id);

            // Create payment intent on backend
            const paymentIntentData = await paymentService.createPaymentIntent(plan.id);

            // Initialize payment sheet
            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'Translation Call App',
                paymentIntentClientSecret: paymentIntentData.clientSecret,
                defaultBillingDetails: {
                    email: userProfile.profile?.email,
                },
            });

            if (initError) {
                console.error('Payment sheet init error:', initError);
                Alert.alert('Error', initError.message || 'Failed to initialize payment. Please try again.');
                setProcessingPayment(null);
                return;
            }

            // Present payment sheet
            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                if (presentError.code !== 'Canceled') {
                    console.error('Payment sheet error:', presentError);
                    Alert.alert('Payment Failed', presentError.message || 'Payment was not completed.');
                }
                setProcessingPayment(null);
                return;
            }

            // Payment succeeded - confirm with backend
            try {
                await paymentService.confirmPayment(paymentIntentData.paymentIntentId);

                // Refresh user profile to get updated minutes
                await dispatch(getMe()).unwrap();

                Alert.alert(
                    'Success!',
                    `You've successfully purchased ${plan.minutes} minutes!`,
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack(),
                        },
                    ]
                );
            } catch (confirmError: any) {
                console.error('Payment confirmation error:', confirmError);
                Alert.alert(
                    'Payment Completed',
                    'Your payment was successful, but there was an issue updating your account. Please contact support if your minutes are not added.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error: any) {
            console.error('Purchase error:', error);
            Alert.alert('Error', error.message || 'Failed to process payment. Please try again.');
        } finally {
            setProcessingPayment(null);
        }
    };

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    const renderPlan = (plan: Plan) => {
        const isProcessing = processingPayment === plan.id;
        const isPopular = plan.id === 'basic';

        return (
            <View
                key={plan.id}
                style={[
                    styles.planCard,
                    isPopular && styles.popularPlanCard,
                ]}
            >
                {isPopular && (
                    <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>POPULAR</Text>
                    </View>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>{formatPrice(plan.amount)}</Text>
                    <Text style={styles.priceUnit}> / one-time</Text>
                </View>
                <Text style={styles.minutesText}>{plan.minutes} minutes included</Text>
                <Pressable
                    style={({ pressed }) => [
                        styles.purchaseButton,
                        (pressed || isProcessing) && styles.purchaseButtonPressed,
                        isPopular && styles.popularButton,
                    ]}
                    onPress={() => handlePurchase(plan)}
                    disabled={isProcessing || !!processingPayment}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.purchaseButtonText}>Purchase Now</Text>
                    )}
                </Pressable>
            </View>
        );
    };

    return (
        <LinearGradient
            colors={[topGradientColor, bottomGradientColor]}
            style={styles.gradientContainer}
        >
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <StatusBar barStyle="light-content" />

                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.backButton,
                            pressed && styles.backButtonPressed,
                        ]}
                        onPress={() => navigation.goBack()}
                    >
                        <BackIcon width={moderateScale(24)} height={moderateScale(24)} fill={text} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Purchase Minutes</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={primaryButtonBackground} />
                            <Text style={styles.loadingText}>Loading plans...</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>Choose a Plan</Text>
                            <Text style={styles.sectionDescription}>
                                Select a plan to add minutes to your account
                            </Text>

                            <View style={styles.plansContainer}>
                                {plans.map((plan) => renderPlan(plan))}
                            </View>

                            {/* Current balance */}
                            {userProfile.profile?.wallet && (
                                <View style={styles.balanceContainer}>
                                    <Text style={styles.balanceLabel}>Current Balance</Text>
                                    <Text style={styles.balanceValue}>
                                        {userProfile.profile.wallet.call.availableMinutes -
                                            (userProfile.profile.wallet.call.totalUsedMinutes || 0)}{' '}
                                        minutes remaining
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateVerticalScale(15),
    },
    backButton: {
        padding: moderateScale(10),
        borderRadius: moderateScale(30),
        width: moderateScale(45),
        height: moderateScale(45),
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonPressed: {
        backgroundColor: pressedIconButtonBackground,
    },
    headerTitle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontWeight: Platform.select({ ios: '600' }),
        fontSize: moderateScale(18),
        color: text,
    },
    headerPlaceholder: {
        width: moderateScale(45),
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: moderateScale(20),
        paddingBottom: moderateVerticalScale(30),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: moderateVerticalScale(400),
    },
    loadingText: {
        marginTop: moderateVerticalScale(15),
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontSize: moderateScale(16),
        color: secondaryText,
    },
    sectionTitle: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Bold' }),
        fontWeight: Platform.select({ ios: '700' }),
        fontSize: moderateScale(24),
        color: text,
        marginBottom: moderateVerticalScale(8),
    },
    sectionDescription: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontSize: moderateScale(14),
        color: secondaryText,
        marginBottom: moderateVerticalScale(30),
    },
    plansContainer: {
        gap: moderateVerticalScale(20),
    },
    planCard: {
        backgroundColor: whiteFieldContainerBackground,
        borderRadius: moderateScale(16),
        padding: moderateScale(24),
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    popularPlanCard: {
        borderWidth: 2,
        borderColor: primaryButtonBackground,
    },
    popularBadge: {
        position: 'absolute',
        top: moderateScale(-10),
        right: moderateScale(20),
        backgroundColor: primaryButtonBackground,
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateVerticalScale(4),
        borderRadius: moderateScale(12),
    },
    popularBadgeText: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Bold' }),
        fontWeight: Platform.select({ ios: '700' }),
        fontSize: moderateScale(10),
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    planName: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Bold' }),
        fontWeight: Platform.select({ ios: '700' }),
        fontSize: moderateScale(22),
        color: '#000000',
        marginBottom: moderateVerticalScale(8),
    },
    planDescription: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontSize: moderateScale(14),
        color: '#666666',
        marginBottom: moderateVerticalScale(16),
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: moderateVerticalScale(8),
    },
    price: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Bold' }),
        fontWeight: Platform.select({ ios: '700' }),
        fontSize: moderateScale(32),
        color: '#000000',
    },
    priceUnit: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontSize: moderateScale(14),
        color: '#666666',
        marginLeft: moderateScale(4),
    },
    minutesText: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontSize: moderateScale(14),
        color: '#666666',
        marginBottom: moderateVerticalScale(20),
    },
    purchaseButton: {
        backgroundColor: primaryButtonBackground,
        borderRadius: moderateScale(8),
        paddingVertical: moderateVerticalScale(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    purchaseButtonPressed: {
        backgroundColor: pressedPrimaryButtonBackground,
    },
    popularButton: {
        backgroundColor: primaryButtonBackground,
    },
    purchaseButtonText: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Bold' }),
        fontWeight: Platform.select({ ios: '700' }),
        fontSize: moderateScale(16),
        color: '#FFFFFF',
    },
    balanceContainer: {
        marginTop: moderateVerticalScale(30),
        padding: moderateScale(20),
        backgroundColor: whiteFieldContainerBackground,
        borderRadius: moderateScale(12),
        alignItems: 'center',
    },
    balanceLabel: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Regular' }),
        fontSize: moderateScale(14),
        color: '#666666',
        marginBottom: moderateVerticalScale(8),
    },
    balanceValue: {
        fontFamily: Platform.select({ ios: 'Inter 18pt', android: 'Inter_Bold' }),
        fontWeight: Platform.select({ ios: '700' }),
        fontSize: moderateScale(20),
        color: '#000000',
    },
});

export default PurchaseScreen;

