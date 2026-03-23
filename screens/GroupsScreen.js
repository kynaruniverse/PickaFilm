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

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigation.replace('Login');
  }

  if (loading) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('CreateGroup')}>
          <Text style={styles.btnText}>+ New Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('JoinGroup')}>
          <Text style={styles.btnText}>Join with Code</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No groups yet — create one or join with a code!</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, groupName: item.name })}
          >
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      />
      <View style={styles.footer}>
        <Button title="Credits" onPress={() => navigation.navigate('Credits')} />
        <Button title="Sign Out" onPress={handleSignOut} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  topButtons: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  btn: { flex: 1, backgroundColor: '#1e88e5', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '600' },
  groupItem: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#f0f0f0', marginVertical: 5, borderRadius: 5 },
  groupName: { flex: 1, fontSize: 18 },
  arrow: { fontSize: 22, color: '#999' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});