import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function CreateGroupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'Not logged in');
      setLoading(false);
      return;
    }

    // Insert group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: name.trim(), created_by: user.id })
      .select()
      .single();

    if (groupError) {
      Alert.alert('Error', groupError.message);
      setLoading(false);
      return;
    }

    // Add creator as member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id });

    if (memberError) {
      Alert.alert('Error', memberError.message);
    } else {
      navigation.replace('AddMovies', { groupId: group.id });
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Group Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., Friday Movie Night"
      />
      <Button title={loading ? "Creating..." : "Create Group"} onPress={handleCreate} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 },
});