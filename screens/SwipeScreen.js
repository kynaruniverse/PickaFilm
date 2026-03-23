import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Button, StyleSheet, Image,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';

// Only import Swiper on native — it crashes or misbehaves on web
let Swiper = null;
if (Platform.OS !== 'web') {
  Swiper = require('react-native-deck-swiper').default;
}

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

export default function SwipeScreen({ route, navigation }) {
  const { groupId } = route.params;
  const [group, setGroup] = useState(null);
  const groupRef = useRef(null);
  const [currentMovie, setCurrentMovie] = useState(null);
  const currentMovieRef = useRef(null);           // ← fix for stale closure bug
  const [hasSwiped, setHasSwiped] = useState(false);
  const [swipedCount, setSwipedCount] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  // Keep refs in sync
  useEffect(() => { groupRef.current = group; }, [group]);
  useEffect(() => { currentMovieRef.current = currentMovie; }, [currentMovie]);

  useEffect(() => {
    loadGroup();

    const groupSubscription = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'groups', filter: `id=eq.${groupId}`,
      }, payload => {
        const updatedGroup = payload.new;
        setGroup(updatedGroup);
        if (updatedGroup.status === 'matched') {
          // ← uses ref so movie is never null
          navigation.replace('Match', { groupId, movie: currentMovieRef.current });
        } else if (updatedGroup.current_movie_id !== groupRef.current?.current_movie_id) {
          loadCurrentMovie(updatedGroup.current_movie_id);
        }
      })
      .subscribe();

    const swipesSubscription = supabase
      .channel(`swipes-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'swipes', filter: `group_id=eq.${groupId}`,
      }, () => {
        fetchSwipedCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(groupSubscription);
      supabase.removeChannel(swipesSubscription);
    };
  }, []);

  async function loadGroup() {
    const { data, error } = await supabase
      .from('groups')
      .select('*, group_members(user_id)')
      .eq('id', groupId)
      .single();
    if (error) { Alert.alert('Error', error.message); return; }
    setGroup(data);
    setTotalMembers(data.group_members.length);
    if (data.current_movie_id) {
      await loadCurrentMovie(data.current_movie_id);
    } else {
      setLoading(false);
      Alert.alert('No movies', 'Add movies first');
      navigation.goBack();
    }
  }

  async function loadCurrentMovie(movieId) {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .single();
    if (error) { Alert.alert('Error', error.message); return; }
    setCurrentMovie(data);

    const { data: userData } = await supabase.auth.getUser();
    const { data: existingSwipe } = await supabase
      .from('swipes')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userData.user.id)
      .eq('movie_id', movieId)
      .maybeSingle();
    setHasSwiped(!!existingSwipe);
    fetchSwipedCount();
    setLoading(false);
  }

  async function fetchSwipedCount() {
    // ← uses refs to avoid stale closure
    if (!currentMovieRef.current) return;
    const { count, error } = await supabase
      .from('swipes')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('movie_id', currentMovieRef.current.id);
    if (!error) setSwipedCount(count);
  }

  async function handleSwipe(direction) {
    if (hasSwiped) return;
    const vote = direction === 'right';
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('swipes')
      .insert({ group_id: groupId, user_id: user.id, movie_id: currentMovie.id, vote });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setHasSwiped(true);
    }
  }

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  if (!currentMovie) return <View style={styles.container}><Text>No movies to swipe</Text></View>;

  // ─── The movie card — shared between native swiper and web fallback ────────
  const movieCard = (
    <View style={styles.card}>
      {currentMovie.poster_path && (
        <Image
          source={{ uri: `${POSTER_BASE}${currentMovie.poster_path}` }}
          style={styles.poster}
        />
      )}
      <Text style={styles.cardTitle}>{currentMovie.title}</Text>
      <Text style={styles.overview} numberOfLines={3}>{currentMovie.overview}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.groupName}>{group?.name}</Text>
      <Text style={styles.swipeInfo}>{swipedCount} / {totalMembers} swiped</Text>

      {/* ─── Native: use the swiper card ─────────────────────────────────── */}
      {Platform.OS !== 'web' && Swiper ? (
        <Swiper
          cards={[currentMovie]}
          renderCard={() => movieCard}
          onSwipedRight={() => handleSwipe('right')}
          onSwipedLeft={() => handleSwipe('left')}
          cardIndex={0}
          backgroundColor="transparent"
          stackSize={1}
          disableTopSwipe
          disableBottomSwipe
        />
      ) : (
        /* ─── Web: just show the card statically ───────────────────────── */
        <View style={styles.webCardWrapper}>
          {movieCard}
        </View>
      )}

      {/* ─── Buttons always visible ──────────────────────────────────────── */}
      <View style={styles.buttons}>
        <View style={styles.voteBtn}>
          <Button title="👎 Nope" onPress={() => handleSwipe('left')} disabled={hasSwiped} color="#e53935" />
        </View>
        <View style={styles.voteBtn}>
          <Button title="👍 Like" onPress={() => handleSwipe('right')} disabled={hasSwiped} color="#43a047" />
        </View>
      </View>

      {hasSwiped && (
        <Text style={styles.waitingText}>Waiting for others to vote...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, alignItems: 'center' },
  groupName: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  swipeInfo: { color: '#888', marginBottom: 16 },
  card: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  webCardWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  poster: { width: 200, height: 300, resizeMode: 'cover', borderRadius: 8, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  overview: { fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 18 },
  buttons: { flexDirection: 'row', gap: 20, marginTop: 20, marginBottom: 10 },
  voteBtn: { flex: 1 },
  waitingText: { color: '#888', fontSize: 14, marginTop: 8 },
});