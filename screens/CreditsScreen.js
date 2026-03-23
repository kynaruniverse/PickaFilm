import React from 'react';
import { View, Text, Image, StyleSheet, Linking, TouchableOpacity, ScrollView } from 'react-native';

export default function CreditsScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>PickaFilm</Text>
      <Text style={styles.version}>Version 1.0.0</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎬 Movie Data</Text>
        <Text style={styles.text}>
          All movie information, posters, and metadata are provided by:
        </Text>
        
        {/* TMDB Logo */}
        <Image 
          source={{ uri: 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_long-8be7cdb46acad4346b23f8f8e86b7f305b4b236160f6e8b94e8f8681c2a4d6ef.png' }}
          style={styles.tmdbLogo}
          resizeMode="contain"
        />
        
        <Text style={styles.disclaimer}>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </Text>
        
        <TouchableOpacity onPress={() => Linking.openURL('https://www.themoviedb.org')}>
          <Text style={styles.link}>www.themoviedb.org</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Team</Text>
        <Text style={styles.text}>Created with ❤️ for movie lovers everywhere</Text>
        <Text style={styles.text}>Eliminate the "what should we watch?" debate</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 About</Text>
        <Text style={styles.text}>
          PickaFilm helps groups of friends find movies everyone agrees on.
          Swipe right on movies you like — when everyone likes the same movie,
          it's a match!
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 20,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  section: {
    width: '100%',
    marginBottom: 30,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    color: '#444',
    marginBottom: 10,
    lineHeight: 20,
  },
  tmdbLogo: {
    width: 200,
    height: 60,
    marginVertical: 15,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    color: '#888',
    marginTop: 10,
    marginBottom: 5,
  },
  link: {
    fontSize: 12,
    color: '#1e88e5',
    textDecorationLine: 'underline',
  },
  backButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 30,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});