import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { searchMovies } from '../lib/tmdb';
import { supabase } from '../lib/supabase';

export default function AddMoviesScreen({ route, navigation }) {
  const { groupId } = route.params;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedMovies, setAddedMovies] = useState([]);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    const movies = await searchMovies(query);
    setResults(movies);
    setLoading(false);
  }

  async function addMovie(movie) {
    // Check if movie already exists in our movies table
    let { data: existing } = await supabase
      .from('movies')
      .select('id')
      .eq('tmdb_id', movie.id)
      .single();

    let movieId = existing?.id;

    if (!existing) {
      // Insert new movie
      const { data: newMovie, error } = await supabase
        .from('movies')
        .insert({
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
        })
        .select()
        .single();

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      movieId = newMovie.id;
    }

    // Add to group queue
    // Get current max order_index
    const { data: maxOrder } = await supabase
      .from('group_movies')
      .select('order_index')
      .eq('group_id', groupId)
      .order('order_index', { ascending: false })
      .limit(1);

    const newOrder = (maxOrder && maxOrder.length > 0) ? maxOrder[0].order_index + 1 : 0;

    const { error: insertError } = await supabase
      .from('group_movies')
      .insert({
        group_id: groupId,
        movie_id: movieId,
        order_index: newOrder,
        added_by: (await supabase.auth.getUser()).data.user.id,
      });

    if (insertError) {
      Alert.alert('Error', insertError.message);
    } else {
      setAddedMovies([...addedMovies, movie.title]);
      // Optionally set current movie if none set
      const { data: group } = await supabase
        .from('groups')
        .select('current_movie_id')
        .eq('id', groupId)
        .single();

      if (!group.current_movie_id) {
        // Set first added movie as current
        await supabase
          .from('groups')
          .update({ current_movie_id: movieId })
          .eq('id', groupId);
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Movies to Group</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a movie..."
          value={query}
          onChangeText={setQuery}
        />
        <Button title="Search" onPress={handleSearch} disabled={loading} />
      </View>
      {addedMovies.length > 0 && (
        <View>
          <Text>Added: {addedMovies.join(', ')}</Text>
          <Button title="Start Swiping" onPress={() => navigation.replace('Swipe', { groupId })} />
        </View>
      )}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.movieItem} onPress={() => addMovie(item)}>
            <Text>{item.title} ({item.release_date?.substring(0,4)})</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, marginBottom: 10 },
  searchRow: { flexDirection: 'row', marginBottom: 10 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, marginRight: 10, borderRadius: 5 },
  movieItem: { padding: 10, borderBottomWidth: 1, borderColor: '#ddd' },
});