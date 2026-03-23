import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, FlatList,
  TouchableOpacity, StyleSheet, Alert, Image,
} from 'react-native';
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
      .maybeSingle();                          // ← was .single() — fixed

    let movieId = existing?.id;

    if (!existing) {
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

    // ── Duplicate guard ──────────────────────────────────────────────────────
    const { data: alreadyAdded } = await supabase
      .from('group_movies')
      .select('id')
      .eq('group_id', groupId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (alreadyAdded) {
      Alert.alert('Already added', `"${movie.title}" is already in this group's queue.`);
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Get current max order_index
    const { data: maxOrder } = await supabase
      .from('group_movies')
      .select('order_index')
      .eq('group_id', groupId)
      .order('order_index', { ascending: false })
      .limit(1);

    const newOrder = (maxOrder && maxOrder.length > 0) ? maxOrder[0].order_index + 1 : 0;

    const { data: { user } } = await supabase.auth.getUser();    // ← moved here, safe

    const { error: insertError } = await supabase
      .from('group_movies')
      .insert({
        group_id: groupId,
        movie_id: movieId,
        order_index: newOrder,
        added_by: user?.id,                                       // ← safe null check
      });

    if (insertError) {
      Alert.alert('Error', insertError.message);
    } else {
      setAddedMovies(prev => [...prev, movie.title]);

      // Set as current movie if none set yet
      const { data: group } = await supabase
        .from('groups')
        .select('current_movie_id')
        .eq('id', groupId)
        .single();

      if (!group.current_movie_id) {
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
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Button title="Search" onPress={handleSearch} disabled={loading} />
      </View>

      {addedMovies.length > 0 && (
        <View style={styles.addedBar}>
          <Text style={styles.addedText}>✓ Added {addedMovies.length} movie{addedMovies.length > 1 ? 's' : ''}</Text>
          <Button title="Start Swiping →" onPress={() => navigation.replace('Swipe', { groupId })} />
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.movieItem} onPress={() => addMovie(item)}>
            {/* ── Poster thumbnail ── */}
            {item.poster_path ? (
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w92${item.poster_path}` }}
                style={styles.poster}
              />
            ) : (
              <View style={styles.posterPlaceholder}>
                <Text style={{ fontSize: 24 }}>🎬</Text>
              </View>
            )}
            {/* ── Movie info ── */}
            <View style={styles.movieInfo}>
              <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.movieYear}>{item.release_date?.substring(0, 4) ?? 'Unknown year'}</Text>
              {item.vote_average > 0 && (
                <Text style={styles.movieRating}>⭐ {item.vote_average.toFixed(1)}</Text>
              )}
            </View>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  searchRow: { flexDirection: 'row', marginBottom: 10 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, marginRight: 10, borderRadius: 5 },
  addedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#e8f5e9', padding: 10, borderRadius: 8, marginBottom: 10 },
  addedText: { color: '#2e7d32', fontWeight: '600' },
  movieItem: {
    flexDirection: 'row',        // ← poster + text side by side
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  poster: {
    width: 46,
    height: 69,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
  posterPlaceholder: {
    width: 46,
    height: 69,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  movieInfo: { flex: 1 },
  movieTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  movieYear: { fontSize: 13, color: '#888' },
  movieRating: { fontSize: 12, color: '#f57c00', marginTop: 2 },
  addIcon: { fontSize: 24, color: '#1e88e5', paddingLeft: 8 },
});