import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Note {
  id: string;
  title: string;
  content: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  isFavorite?: boolean;
  category?: string;
  createdAt: string;
}

interface HomeScreenProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  theme: any;
}

const HomeScreen = ({ notes, onEditNote, onDeleteNote, onToggleFavorite, theme }: HomeScreenProps) => {
  const renderNoteItem = ({ item }: { item: Note }) => {
    const textStyle: TextStyle = {
      fontWeight: item.isBold ? 'bold' : 'normal',
      fontStyle: item.isItalic ? 'italic' : 'normal',
      textDecorationLine: item.isUnderline ? 'underline' : 'none',
    };

    return (
      <TouchableOpacity 
        style={[styles.noteCard, { backgroundColor: theme.card }]} 
        onPress={() => onEditNote(item)}
      >
        <View style={styles.noteHeader}>
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={() => onToggleFavorite(item.id)}
          >
            <MaterialIcons
              name={item.isFavorite ? 'star' : 'star-border'}
              size={20}
              color={item.isFavorite ? theme.primary : theme.subtext}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.noteContent}>
          <Text style={[styles.noteTitle, textStyle, { color: theme.text }]}>
            {item.title}
          </Text>
          <Text 
            style={[styles.noteText, textStyle, { color: theme.subtext }]} 
            numberOfLines={2}
          >
            {item.content}
          </Text>
          {item.category && (
            <View style={[styles.categoryChip, { backgroundColor: `${theme.primary}15` }]}>
              <Text style={[styles.categoryText, { color: theme.primary }]}>
                {item.category}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.noteFooter}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onDeleteNote(item.id)}
          >
            <MaterialIcons name="delete-outline" size={20} color={theme.subtext} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={notes}
      renderItem={renderNoteItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.container}
      numColumns={2}
      columnWrapperStyle={styles.row}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginHorizontal: 8,
  },
  noteCard: {
    width: '48%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noteHeader: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  favoriteButton: {
    padding: 4,
    marginLeft: -4,  // Biraz sola kaydırmak için
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    marginBottom: 8,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    padding: 4,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HomeScreen; 