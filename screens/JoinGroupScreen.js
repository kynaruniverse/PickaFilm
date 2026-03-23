import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function JoinGroupScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setLoading(true);

    // Find the group by invite code
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name')
      .eq('invite_code', trimmedCode)
      .maybeSingle();

    if (groupError || !group) {
      Alert.alert('Not Found', 'No group found with that code. Check the code and try again.');
      setLoading(false);
      return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      Alert.alert('Already Joined', `You are already a member of "${group.name}".`);
      setLoading(false);
      navigation.navigate('Groups');
      return;
    }

    // Add user as member
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id });

    if (joinError) {
      Alert.alert('Error', joinError.message);
    } else {
      Alert.alert('Joined!', `You joined "${group.name}"! 🎉`, [
        { text: 'OK', onPress: () => navigation.navigate('Groups') },
      ]);
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Group</Text>
      <Text style={styles.subtitle}>Ask the group creator for their 6-character invite code</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="e.g., A3XK91"
        autoCapitalize="characters"
        maxLength={6}
      />
      <Button title={loading ? 'Joining...' : 'Join Group'} onPress={handleJoin} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    marginBottom: 20,
    borderRadius: 5,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 6,
    fontWeight: 'bold',
  },
});