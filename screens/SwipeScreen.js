import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { supabase } from '../lib/supabase';

export default function SwipeScreen({ route, navigation }) {
  const { groupId } = route.params;
  const [group, setGroup] = useState(null);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [swipedCount, setSwipedCount] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroup();
    // Subscribe to group changes
    const groupSubscription = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups', filter: `id=eq.${groupId}` }, payload => {
        const updatedGroup = payload.new;
        setGroup(updatedGroup);
        if (updatedGroup.status === 'matched') {
          navigation.replace('Match', { groupId, movie: currentMovie });
        } else if (updatedGroup.current_movie_id !== group?.current_movie_id) {
          // Load new movie
          loadCurrentMovie(updatedGroup.current_movie_id);
        }
      })
      .subscribe();

    // Subscribe to swipes to know who has swiped (without votes)
    const swipesSubscription = supabase
      .channel(`swipes-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'swipes', filter: `group_id=eq.${groupId}` }, () => {
        // Refresh swipe count
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
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
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
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setCurrentMovie(data);
    // Check if user already swiped on this movie
    const { data: user } = await supabase.auth.getUser();
    const { data: existingSwipe } = await supabase
      .from('swipes')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.user.id)
      .eq('movie_id', movieId)
      .single();
    setHasSwiped(!!existingSwipe);
    fetchSwipedCount();
    setLoading(false);
  }

  async function fetchSwipedCount() {
    if (!group || !currentMovie) return;
    const { count, error } = await supabase
      .from('swipes')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('movie_id', currentMovie.id);
    if (!error) setSwipedCount(count);
  }

  async function handleSwipe(direction) {
    if (hasSwiped) return;
    const vote = direction === 'right'; // right = like, left = dislike
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('swipes')
      .insert({
        group_id: groupId,
        user_id: user.id,
        movie_id: currentMovie.id,
        vote,
      });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setHasSwiped(true);
      // The database trigger will handle advancing or matching
    }
  }

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  if (!currentMovie) return <View style={styles.container}><Text>No movies to swipe</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.groupName}>{group.name}</Text>
      <Text style={styles.swipeInfo}>{swipedCount} / {totalMembers} swiped</Text>
      <Swiper
        cards={[currentMovie]}
        renderCard={(movie) => (
          <View style={styles.card}>
            {movie.poster_path && (
              <Image source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }} style={styles.poster} />
            )}
            <Text style={styles.title}>{movie.title}</Text>
            <Text style={styles.overview}>{movie.overview}</Text>
          </View>
        )}
        onSwipedRight={() => handleSwipe('right')}
        onSwipedLeft={() => handleSwipe('left')}
        cardIndex={0}
        backgroundColor="transparent"
        stackSize={1}
        disableTopSwipe
        disableBottomSwipe
      />
      <View style={styles.buttons}>
        <Button title="👎" onPress={() => handleSwipe('left')} disabled={hasSwiped} />
        <Button title="👍" onPress={() => handleSwipe('right')} disabled={hasSwiped} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, alignItems: 'center' },
  groupName: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  swipeInfo: { marginBottom: 20 },
  card: { width: 300, height: 400, backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, elevation: 5 },
  poster: { width: 200, height: 300, resizeMode: 'cover', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  overview: { fontSize: 12, textAlign: 'center' },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', width: 200, marginTop: 20 },
});