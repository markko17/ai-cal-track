import { useSignUp, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { saveUserToFirestore } from '../../services/userService';
import { saveUserSession } from '../../utils/cache';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verification code state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If user is already signed in (from local storage / session cache), redirect to home screen
  if (isUserLoaded && isSignedIn) {
    return <Redirect href="/" />;
  }

  // Handle Initial Sign Up
  const handleSignUp = async () => {
    if (!isLoaded) return;

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await signUp.create({
        emailAddress: email.trim(),
        password: password,
        firstName,
        lastName,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign Up error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Failed to create account. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Verification Code Submission
  const handleVerifyCode = async () => {
    if (!isLoaded) return;
    if (!code.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });

        // Save session locally to local storage / SecureStore
        await saveUserSession({
          sessionId: completeSignUp.createdSessionId,
          email: email.trim(),
          fullName: fullName.trim(),
          authProvider: 'email_password',
          signedInAt: new Date().toISOString(),
        });

        // Save new user profile to Firebase Firestore
        await saveUserToFirestore({
          uid: completeSignUp.createdSessionId || 'user_' + Date.now(),
          email: email.trim(),
          fullName: fullName.trim(),
          authProvider: 'email_password',
        });

        router.replace('/');
      } else {
        console.log('Verification status:', completeSignUp.status);
        setErrorMessage('Verification incomplete. Please check the code.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid verification code. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header & Branding */}
        <View style={styles.headerSection}>
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color="#10B981" />
              <Text style={styles.aiBadgeText}>AI NUTRITION 2.0</Text>
            </View>
          </View>
          <Text style={styles.title}>
            {pendingVerification ? 'Verify Your Email' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {pendingVerification
              ? `We sent a 6-digit code to ${email}.`
              : 'Start tracking calories, meals & macros with AI insights.'}
          </Text>
        </View>

        {/* Main Card */}
        <View style={styles.cardContainer}>
          {/* Tab Navigation Switcher (Only visible before code verification) */}
          {!pendingVerification && (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={styles.tab}
                onPress={() => router.push('/(auth)/sign-in')}
              >
                <Text style={styles.tabText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                <Text style={[styles.tabText, styles.activeTabText]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Message Alert */}
          {errorMessage ? (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle" size={20} color="#F87171" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity onPress={() => setErrorMessage('')} style={{ marginLeft: 8 }}>
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* VERIFICATION CODE STEP */}
          {pendingVerification ? (
            <View style={styles.verificationSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="key-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { letterSpacing: 4, fontSize: 18 }]}
                    placeholder="123456"
                    placeholderTextColor="#64748B"
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleVerifyCode}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <View style={styles.primaryBtnContent}>
                    <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#0F172A" style={{ marginLeft: 6 }} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => setPendingVerification(false)}
              >
                <Text style={styles.resendBtnText}>Back to Sign Up</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* STANDARD SIGN UP STEP */
            <View>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Alex Morgan"
                    placeholderTextColor="#64748B"
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="alex@example.com"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="At least 8 characters"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor="#64748B"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>

              {/* Primary Sign Up Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <View style={styles.primaryBtnContent}>
                    <Text style={styles.primaryBtnText}>Create Free Account</Text>
                    <Ionicons name="arrow-forward" size={18} color="#0F172A" style={{ marginLeft: 6 }} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google SSO */}
              <GoogleSignInButton
                onError={(msg) => setErrorMessage(msg)}
                text="Sign Up with Google"
              />
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text
              style={styles.footerLink}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              Sign In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  aiBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  cardContainer: {
    backgroundColor: '#161F2E',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#26334D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0B0F17',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#10B981',
    fontWeight: '700',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    color: '#F87171',
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#26334D',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    padding: 6,
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  verificationSection: {
    paddingVertical: 10,
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 10,
  },
  resendBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#26334D',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footerLink: {
    color: '#10B981',
    fontWeight: '700',
  },
});
