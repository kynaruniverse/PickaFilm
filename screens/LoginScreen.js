import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

// ─── What this function does ────────────────────────────────────────────────
// Before we even talk to Supabase we check three things:
//   1. Neither field is empty
//   2. The email looks like a real email (has @ and a dot after it)
//   3. The password is at least 6 characters (Supabase minimum)
// If any check fails, we show an alert and return false, stopping the submit.
// If all pass, we return true and the submit continues.
// ────────────────────────────────────────────────────────────────────────────
function validate(email, password) {
  if (!email.trim() || !password.trim()) {
    Alert.alert('Missing fields', 'Please enter your email and password.');
    return false;
  }
  if (!/\S+@\S+\.\S+/.test(email.trim())) {
    Alert.alert('Invalid email', 'Please enter a valid email address.');
    return false;
  }
  if (password.length < 6) {
    Alert.alert('Password too short', 'Password must be at least 6 characters.');
    return false;
  }
  return true;
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn() {
    if (!validate(email, password)) return;   // ← stops here if invalid
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) Alert.alert('Sign In Failed', error.message);
    else navigation.replace('Groups');
    setLoading(false);
  }

  async function signUp() {
    if (!validate(email, password)) return;   // ← stops here if invalid
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) Alert.alert('Sign Up Failed', error.message);
    else Alert.alert('Almost there!', 'Check your email to confirm your account, then sign in.');
    setLoading(false);
  }

  async function forgotPassword() {
    if (!email.trim()) {
      Alert.alert('Enter your email first', 'Type your email above then tap Forgot Password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Email sent', 'Check your inbox for a password reset link.');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PickaFilm</Text>
      <Text style={styles.subtitle}>Find a movie everyone agrees on</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={signIn}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Sign In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary, loading && styles.buttonDisabled]}
        onPress={signUp}
        disabled={loading}
      >
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={forgotPassword} style={styles.forgotBtn}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1e88e5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1e88e5',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: '#1e88e5' },
  forgotBtn: { alignItems: 'center', marginTop: 10 },
  forgotText: { color: '#888', fontSize: 14 },
});