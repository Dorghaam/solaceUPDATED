import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { useUserStore } from '@/store/userStore';
import { getOfferings, purchasePackage, restorePurchases } from '@/services/revenueCatService';
import { theme } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

// A reusable component to display a purchase option
const PackageCard = ({ item, isSelected, onPress }: { item: PurchasesPackage, isSelected: boolean, onPress: () => void }) => (
  <Pressable
    style={[styles.packageButton, isSelected && styles.selectedPackage]}
    onPress={onPress}
  >
    <View style={styles.packageDetails}>
        <Text style={styles.packagePeriod}>{item.product.title}</Text>
        <Text style={styles.packagePrice}>{item.product.priceString}</Text>
    </View>
  </Pressable>
);

export default function PaywallScreen() {
  const { setHasCompletedOnboarding, supabaseUser } = useUserStore();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    // Redirect if user is not logged in
    if (!supabaseUser) {
      router.replace('/(onboarding)/login');
      return;
    }
    
    // Fetch offerings from RevenueCat
    const fetchInitialOfferings = async () => {
      try {
        const offerings = await getOfferings();
        if (offerings.current) {
          setOffering(offerings.current);
          // Pre-select the annual package if available
          const annualPackage = offerings.current.availablePackages.find(p => p.packageType === 'ANNUAL');
          setSelectedPackage(annualPackage || offerings.current.availablePackages[0]);
        }
      } catch (e) {
        console.error("Error fetching offerings:", e);
        Alert.alert("Error", "Could not load subscription options. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialOfferings();
  }, [supabaseUser]);

  const completeOnboardingAndNavigate = () => {
    setHasCompletedOnboarding(true);
    router.replace('/(main)');
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert("No Selection", "Please select a subscription package.");
      return;
    }

    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { customerInfo } = await purchasePackage(selectedPackage);
      // The listener in revenueCatService will handle the tier update automatically.
      // We just need to complete the onboarding flow.
      if (customerInfo.entitlements.active['premium']?.isActive) {
        console.log("[Paywall] Purchase successful, user has premium.");
        Alert.alert("Success!", "You are now a premium member.");
        completeOnboardingAndNavigate();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("Purchase error:", e);
        Alert.alert("Error", "An error occurred during the purchase.");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo.entitlements.active['premium']?.isActive) {
        Alert.alert("Restore Successful", "Your premium access has been restored.");
        completeOnboardingAndNavigate();
      } else {
        Alert.alert("No Purchase Found", "We couldn't find an active subscription to restore.");
      }
    } catch (e) {
        console.error("Restore error:", e);
        Alert.alert("Error", "Could not restore purchases at this time.");
    } finally {
        setIsPurchasing(false);
    }
  };

  const handleSkip = () => {
    // If user skips, we still mark onboarding as complete so they can enter the app.
    // The revenueCatService listener will have already set their tier to 'free'.
    completeOnboardingAndNavigate();
  };
  
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading Offers...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[theme.colors.lightPink.lightest, theme.colors.lightPink.light, theme.colors.lightPink.medium]}
      style={styles.container}
    >
      <SafeAreaView style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Unlock Your Full Potential</Text>
          <Text style={styles.subtitle}>Join Solace Premium to access all features and accelerate your healing journey.</Text>
          
          <View style={styles.featuresList}>
             <Text style={styles.featureItem}><Ionicons name="star" size={16} /> Access all quote categories</Text>
             <Text style={styles.featureItem}><Ionicons name="star" size={16} /> Unlimited favorites</Text>
             <Text style={styles.featureItem}><Ionicons name="star" size={16} /> Advanced widget customization</Text>
          </View>
          
          {offering?.availablePackages.map((pkg) => (
            <PackageCard 
              key={pkg.identifier}
              item={pkg}
              isSelected={selectedPackage?.identifier === pkg.identifier}
              onPress={() => setSelectedPackage(pkg)}
            />
          ))}

        </ScrollView>
        <View style={styles.footer}>
            <Pressable
                style={[styles.purchaseButton, isPurchasing && { opacity: 0.7 }]}
                onPress={handlePurchase}
                disabled={isPurchasing}
            >
                <Text style={styles.purchaseButtonText}>
                    {isPurchasing ? 'Processing...' : 'Start Free Trial & Subscribe'}
                </Text>
            </Pressable>
            <View style={styles.footerLinks}>
                <Pressable onPress={handleRestore} disabled={isPurchasing}><Text style={styles.footerLink}>Restore Purchase</Text></Pressable>
                <Pressable onPress={handleSkip} disabled={isPurchasing}><Text style={styles.footerLink}>Skip for Now</Text></Pressable>
            </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Add a full stylesheet for the custom paywall
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  container: { flex: 1 },
  scrollContent: { padding: 24, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#333', marginBottom: 16, marginTop: 40 },
  subtitle: { fontSize: 18, textAlign: 'center', color: '#555', marginBottom: 32, lineHeight: 26 },
  featuresList: { alignSelf: 'stretch', marginBottom: 24, paddingHorizontal: 20 },
  featureItem: { fontSize: 16, color: '#444', marginBottom: 8 },
  packageButton: {
    width: '100%',
    padding: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.5)'
  },
  selectedPackage: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 232, 239, 0.8)'
  },
  packageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  packagePeriod: { fontSize: 18, fontWeight: '600', color: '#333' },
  packagePrice: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },
  footer: { padding: 24, paddingTop: 12, borderTopColor: '#eee', borderTopWidth: 1 },
  purchaseButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  purchaseButtonText: { fontSize: 18, color: 'white', fontWeight: 'bold' },
  footerLinks: { flexDirection: 'row', justifyContent: 'space-around' },
  footerLink: { color: '#555', textDecorationLine: 'underline' },
}); 