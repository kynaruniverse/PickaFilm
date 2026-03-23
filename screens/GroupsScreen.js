import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setGroups(data.map(item => item.groups));
    }
    setLoading(false);
  }

  async function createGroup() {
    navigation.navigate('CreateGroup');
  }

  function joinGroup() {
    // Simple join by code – we'll implement later; for now just placeholder
    Alert.alert('Coming soon', 'Invite links will work via share');
  }

  if (loading) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Button title="+ New Group" onPress={createGroup} />
      <Button title="Credits" onPress={() => navigation.navigate('Credits')} />
      <Button title="Join with Code" onPress={joinGroup} />
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('Swipe', { groupId: item.id })}
          >
            <Text style={styles.groupName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  groupItem: { padding: 15, backgroundColor: '#f0f0f0', marginVertical: 5, borderRadius: 5 },
  groupName: { fontSize: 18 },
});