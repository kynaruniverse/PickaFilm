import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { supabase } from '../lib/supabase';

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId, groupName } = route.params;
  const [inviteCode, setInviteCode] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [movieCount, setMovieCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, []);

  async function fetchDetails() {
    const { data, error } = await supabase
      .from('groups')
      .select('invite_code, group_members(user_id), group_movies(movie_id)')
      .eq('id', groupId)
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setInviteCode(data.invite_code ?? '------');
      setMemberCount(data.group_members?.length ?? 0);
      setMovieCount(data.group_movies?.length ?? 0);
    }
    setLoading(false);
  }

  async function shareCode() {
    try {
      await Share.share({
        message: `Join my PickaFilm group "${groupName}"! Use code: ${inviteCode}`,
      });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  if (loading) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.groupName}>{groupName}</Text>

      {/* Invite Code Card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Invite Code</Text>
        <Text style={styles.code}>{inviteCode}</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={shareCode}>
          <Text style={styles.shareBtnText}>Share Code</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{memberCount}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{movieCount}</Text>
          <Text style={styles.statLabel}>Movies</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.navigate('AddMovies', { groupId })}
      >
        <Text style={styles.actionBtnText}>🎬 Add Movies</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, styles.swipeBtn]}
        onPress={() => {
          if (movieCount === 0) {
            Alert.alert('No movies', 'Add some movies to the group first!');
            return;
          }
          navigation.navigate('Swipe', { groupId });
        }}
      >
        <Text style={styles.actionBtnText}>👆 Start Swiping</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  groupName: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  codeCard: { backgroundColor: '#f0f4ff', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20 },
  codeLabel: { fontSize: 13, color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  code: { fontSize: 36, fontWeight: 'bold', letterSpacing: 10, color: '#1e88e5', marginBottom: 12 },
  shareBtn: { backgroundColor: '#1e88e5', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20 },
  shareBtnText: { color: 'white', fontWeight: '600' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 13, color: '#666' },
  actionBtn: { backgroundColor: '#1e88e5', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  swipeBtn: { backgroundColor: '#43a047' },
  actionBtnText: { color: 'white', fontSize: 18, fontWeight: '600' },
});