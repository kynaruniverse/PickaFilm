import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function MatchScreen({ route, navigation }) {
  const { groupId, movie } = route.params;
  const [group, setGroup] = useState(null);

  useEffect(() => {
    fetchGroup();
  }, []);

  async function fetchGroup() {
    const { data, error } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single();
    if (error) Alert.alert('Error', error.message);
    else setGroup(data);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.congrats}>🎉 MATCH! 🎉</Text>
      <Text style={styles.text}>Everyone liked:</Text>
      {movie && movie.poster_path && (
        <Image source={{ uri: getPosterUrl(movie.poster_path) }} style={styles.poster} />
      )}
      <Text style={styles.title}>{movie?.title}</Text>
      <Text style={styles.text}>Go watch with your friends!</Text>
      <Button title="Back to Groups" onPress={() => navigation.popToTop()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  congrats: { fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 18, marginBottom: 10, textAlign: 'center' },
  poster: { width: 200, height: 300, resizeMode: 'cover', marginVertical: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
});