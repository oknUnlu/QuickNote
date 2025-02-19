import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TaskScreen from './TaskScreen';
import { translations, Language } from '../translations/translations';
import * as FileSystem from 'expo-file-system';
import AddNote from './AddNote'; 
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads'; // Add this line

interface Note {
  id: string;
  title: string;
  content: string;
  color?: string;
  image?: string | null;
  isFavorite?: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

const COLORS = {
  red: '#FF6B6B',
  orange: '#FFA557',
  yellow: '#FFD93D',
  green: '#6BCB77',
  blue: '#4D96FF',
  purple: '#B088F9',
};

const NOTE_COLORS = Object.values(COLORS);

// Sıralama seçenekleri için enum ekleyelim
enum SortOption {
  DATE_DESC = 'DATE_DESC',
  DATE_ASC = 'DATE_ASC',
  TITLE_ASC = 'TITLE_ASC',
  TITLE_DESC = 'TITLE_DESC',
  CATEGORY = 'CATEGORY',
  FAVORITE = 'FAVORITE'
}

type RootStackParamList = {
  MainTabs: undefined;
  Folders: { theme: any };
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Tema renkleri için sabit tanımlamalar
const THEMES = {
  default: {
    primary: '#6366F1',
    secondary: '#4F46E5',
    accent: '#F43F5E',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    subtext: '#64748B',
    border: '#E2E8F0',
    gradient: ['#6366F1', '#4F46E5'],
  },
  rose: {
    primary: '#EC4899',
    secondary: '#DB2777',
    accent: '#14B8A6',
    background: '#FDF2F8',
    card: '#FFFFFF',
    text: '#831843',
    subtext: '#BE185D',
    border: '#FBCFE8',
    gradient: ['#EC4899', '#DB2777'],
  },
  emerald: {
    primary: '#10B981',
    secondary: '#059669',
    accent: '#F43F5E',
    background: '#ECFDF5',
    card: '#FFFFFF',
    text: '#064E3B',
    subtext: '#047857',
    border: '#A7F3D0',
    gradient: ['#10B981', '#059669'],
  },
  amber: {
    primary: '#F59E0B',
    secondary: '#D97706',
    accent: '#6366F1',
    background: '#FFFBEB',
    card: '#FFFFFF',
    text: '#78350F',
    subtext: '#B45309',
    border: '#FDE68A',
    gradient: ['#F59E0B', '#D97706'],
  },
  sky: {
    primary: '#0EA5E9',
    secondary: '#0284C7',
    accent: '#F43F5E',
    background: '#F0F9FF',
    card: '#FFFFFF',
    text: '#075985',
    subtext: '#0369A1',
    border: '#BAE6FD',
    gradient: ['#0EA5E9', '#0284C7'],
  },
  violet: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    accent: '#F43F5E',
    background: '#F5F3FF',
    card: '#FFFFFF',
    text: '#4C1D95',
    subtext: '#6D28D9',
    border: '#DDD6FE',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
  fuchsia: {
    primary: '#D946EF',
    secondary: '#C026D3',
    accent: '#2DD4BF',
    background: '#FAE8FF',
    card: '#FFFFFF',
    text: '#701A75',
    subtext: '#A21CAF',
    border: '#F5D0FE',
    gradient: ['#D946EF', '#C026D3'],
  },
  lime: {
    primary: '#84CC16',
    secondary: '#65A30D',
    accent: '#EC4899',
    background: '#F7FEE7',
    card: '#FFFFFF',
    text: '#365314',
    subtext: '#4D7C0F',
    border: '#D9F99D',
    gradient: ['#84CC16', '#65A30D'],
  }
} as const;

// type tanımını ekleyelim
type ThemeNames = keyof typeof THEMES;

const NotesApp = () => {
  const navigation = useNavigation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>(['Personal', 'Work', 'Shopping', 'Ideas']);
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.DATE_DESC);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const strings = translations[language];
  const [currentTheme, setCurrentTheme] = useState<ThemeNames>('default');

  const theme = THEMES[currentTheme] || THEMES.default;

  // toggleTheme fonksiyonunu ekleyelim
  const toggleTheme = () => {
    const themes = Object.keys(THEMES) as ThemeNames[];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex] as ThemeNames;
    
    // Tema değişikliğini AsyncStorage'a kaydet
    AsyncStorage.setItem('currentTheme', nextTheme).then(() => {
      setCurrentTheme(nextTheme);
    });
  };

  // Uygulama başladığında temayı yükle
  useEffect(() => {
    AsyncStorage.getItem('currentTheme').then((savedTheme) => {
      if (savedTheme && savedTheme in THEMES) {
        setCurrentTheme(savedTheme as ThemeNames);
      }
    });
  }, []);

  // Load notes from AsyncStorage on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Save notes to AsyncStorage whenever notes change
  useEffect(() => {
    saveNotes();
  }, [notes]);

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem('notes');
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      Alert.alert(strings.error, strings.loadError);
    }
  };

  const saveNotes = async () => {
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(notes));
    } catch (error) {
      Alert.alert(strings.error, strings.saveError);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
      setShowCategoryModal(false);
    }
  };

  const handleSaveNote = (noteData: {
    title: string;
    content: string;
    image: string | null;
    category: string;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
  }) => {
    if (editingNote) {
      const updatedNotes = notes.map(note =>
        note.id === editingNote.id
          ? {
              ...note,
              ...noteData,
              updatedAt: new Date().toISOString(),
            }
          : note
      );
      setNotes(updatedNotes);
      saveNotes();
    } else {
      const newNote = {
        id: Date.now().toString(),
        ...noteData,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes([newNote, ...notes]);
      saveNotes();
    }
    setShowAddNote(false);
    setEditingNote(null);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowAddNote(true);
  };

  const deleteNote = (id: string) => {
    Alert.alert(
      strings.delete,
      strings.deleteConfirm,
      [
        { 
          text: strings.cancel, 
          style: 'cancel'
        },
        {
          text: strings.delete,
          style: 'destructive',
          onPress: () => {
            setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
            if (editingNote?.id === id) {
              setEditingNote(null);
              setShowAddNote(false);
            }
          },
        },
      ]
    );
  };

  const toggleFavorite = (id: string) => {
    const updatedNotes = notes.map(note =>
      note.id === id
        ? { ...note, isFavorite: !note.isFavorite }
        : note
    );
    setNotes(updatedNotes);
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sıralama fonksiyonu
  const getSortedNotes = (notes: Note[]) => {
    const sortedNotes = [...notes];
    
    switch (sortOption) {
      case SortOption.DATE_DESC:
        return sortedNotes.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case SortOption.DATE_ASC:
        return sortedNotes.sort((a, b) => 
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      case SortOption.TITLE_ASC:
        return sortedNotes.sort((a, b) => 
          a.title.localeCompare(b.title)
        );
      case SortOption.TITLE_DESC:
        return sortedNotes.sort((a, b) => 
          b.title.localeCompare(a.title)
        );
      case SortOption.CATEGORY:
        return sortedNotes.sort((a, b) => 
          (a.category || '').localeCompare(b.category || '')
        );
      case SortOption.FAVORITE:
        return sortedNotes.sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      default:
        return sortedNotes;
    }
  };

  const sortedNotes = getSortedNotes(filteredNotes);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short' as const,
      day: 'numeric' as const,
      year: 'numeric' as const
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Sıralama seçeneklerini çeviri ile eşleştir
  const getSortOptionText = (option: SortOption) => {
    switch (option) {
      case SortOption.DATE_DESC: return strings.dateDesc;
      case SortOption.DATE_ASC: return strings.dateAsc;
      case SortOption.TITLE_ASC: return strings.titleAsc;
      case SortOption.TITLE_DESC: return strings.titleDesc;
      case SortOption.CATEGORY: return strings.categorySort;
      case SortOption.FAVORITE: return strings.favoriteSort;
      default: return '';
    }
  };

  // Kategori modalı
  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowCategoryModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {strings.addCategory}
          </Text>
          <TextInput
            style={[styles.categoryInput, { color: theme.text, borderColor: theme.border }]}
            placeholder={strings.categoryName}
            value={newCategory}
            onChangeText={setNewCategory}
          />
          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={addCategory}
          >
            <Text style={styles.addCategoryButtonText}>{strings.addCategory}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  // Notları JSON dosyası olarak dışa aktar
  const exportNotes = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}notes_backup.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(notes));
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert(strings.error, strings.sharingNotAvailable);
      }
    } catch (error) {
      Alert.alert(strings.error, strings.exportError);
    }
  };

  // Sıralama modalı
  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowSortModal(false)}
        accessibilityLabel={strings.modalClose}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {strings.sortNotes}
          </Text>
          {Object.values(SortOption).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortOption,
                sortOption === option && styles.selectedSortOption
              ]}
              onPress={() => {
                setSortOption(option);
                setShowSortModal(false);
              }}
            >
              <Text style={[
                styles.sortOptionText,
                sortOption === option && styles.selectedSortOptionText
              ]}>
                {getSortOptionText(option)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

  // Paylaşma fonksiyonunu ekle
  const shareNote = async (note: Note) => {
    try {
      // Create a temporary file to share
      const tempFilePath = `${FileSystem.cacheDirectory}note.txt`;
      const noteText = `${note.title}\n\n${note.content}`;
      
      // Write note content to temporary file
      await FileSystem.writeAsStringAsync(tempFilePath, noteText);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(tempFilePath, {
          mimeType: 'text/plain',
          dialogTitle: strings.shareNote
        });
      } else {
        Alert.alert(strings.error, strings.sharingNotAvailable);
      }

      // Clean up temp file
      await FileSystem.deleteAsync(tempFilePath);
      
    } catch (error) {
      Alert.alert(strings.error, strings.shareError);
    }
  };

  // Header'a menü butonu ekle
  const renderHeaderMenu = () => (
    <View style={styles.headerMenu}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => setShowSortModal(true)}
      >
        <MaterialIcons 
          name="sort" 
          size={24} 
          color="#fff" 
        />
      </TouchableOpacity>
    </View>
  );

  // Stilleri güncelleyelim
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#fff',
      letterSpacing: 1,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      margin: 16,
      marginTop: -25,
      padding: 15,
      borderRadius: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      marginLeft: 10,
      color: theme.text,
    },
    categoryContainer: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
    categoryList: {
      paddingVertical: 8,
    },
    categoryChip: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      backgroundColor: theme.card,
      marginRight: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    selectedCategoryChip: {
      backgroundColor: theme.primary,
    },
    categoryChipText: {
      fontSize: 14,
      color: theme.subtext,
      fontWeight: '500',
    },
    selectedCategoryChipText: {
      color: '#fff',
    },
    inputContainer: {
      backgroundColor: theme.card,
      margin: 16,
      padding: 20,
      borderRadius: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    titleInput: {
      fontSize: 20,
      fontWeight: '500',
      color: theme.text,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingVertical: 10,
      marginBottom: 20,
    },
    contentInput: {
      fontSize: 16,
      color: theme.text,
      height: 120,
      textAlignVertical: 'top',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingVertical: 10,
      marginBottom: 20,
    },
    noteOptions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    optionsGroup: {
      flexDirection: 'row',
      gap: 12,
    },
    iconButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    addButton: {
      backgroundColor: theme.primary,
      padding: 15,
      borderRadius: 15,
      alignItems: 'center',
      elevation: 3,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    notesList: {
      flex: 1,
      padding: 8,
    },
    notesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    noteItem: {
      width: '48%',
      backgroundColor: theme.card,
      borderRadius: 15,
      padding: 12,
      marginBottom: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    noteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      justifyContent: 'space-between',
    },
    titleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    noteTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      flex: 1,
      marginLeft: 8,
    },
    noteDate: {
      fontSize: 10,
      color: theme.subtext,
      backgroundColor: `${theme.subtext}10`,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    noteContent: {
      fontSize: 14,
      color: theme.subtext,
      lineHeight: 20,
      marginBottom: 12,
      maxHeight: 60,
    },
    noteImage: {
      width: '100%',
      height: 120,
      borderRadius: 10,
      marginBottom: 12,
    },
    noteFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: `${theme.border}50`,
    },
    noteCategory: {
      fontSize: 10,
      color: theme.primary,
      backgroundColor: `${theme.primary}20`,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    noteActions: {
      flexDirection: 'row',
      gap: 2,
    },
    actionButton: {
      padding: 8,
    },
    modalContainer: {
      width: '90%',
      backgroundColor: theme.card,
      padding: 24,
      borderRadius: 25,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorPickerContainer: {
      width: '80%',
      padding: 20,
      borderRadius: 12,
      elevation: 5,
    },
    colorPickerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      margin: 4,
    },
    selectedColor: {
      borderWidth: 3,
      borderColor: '#fff',
    },
    headerMenu: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    headerButtonGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sortOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    selectedSortOption: {
      backgroundColor: '#4c669f20',
    },
    sortOptionText: {
      fontSize: 16,
      color: '#666',
    },
    selectedSortOptionText: {
      color: '#4c669f',
      fontWeight: 'bold',
    },
    addCategoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#eee',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addCategoryButton: {
      backgroundColor: '#4c669f',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    addCategoryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    categoryInput: {
      fontSize: 16,
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 16,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchIcon: {
      marginRight: 10,
    },
    colorButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#4D96FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
    selectedImageContainer: {
      marginTop: 10,
      marginBottom: 16,
      borderRadius: 8,
      overflow: 'hidden',
    },
    selectedImage: {
      width: '100%',
      height: 200,
    },
    removeImageButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    favoriteButton: {
      padding: 4,
    },
    fab: {
      position: 'absolute',
      bottom: 80,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      elevation: 5,
    },
    fabGradient: {
      flex: 1,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      color: theme.subtext,
    },
    themeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
  });

  const renderHomeScreen = () => (
    <View style={styles.container}>
      {showAddNote ? (
        <AddNote
          onSave={handleSaveNote}
          onCancel={() => {
            setShowAddNote(false);
            setEditingNote(null);
          }}
          categories={categories}
          theme={theme}
          initialNote={editingNote}
        />
      ) : (
        <>
          <LinearGradient
            colors={theme.gradient}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{strings.appName}</Text>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={[styles.headerButton]}
                  onPress={toggleTheme}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    style={styles.headerButtonGradient}
                  >
                    <MaterialIcons name="palette" size={22} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color={theme.subtext} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={strings.searchPlaceholder}
              placeholderTextColor={theme.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView style={styles.notesList}>
            <View style={styles.notesGrid}>
              {sortedNotes.length === 0 && !searchQuery && (
                <Text style={styles.emptyText}>{strings.noNotes}</Text>
              )}
              {sortedNotes.length === 0 && searchQuery && (
                <Text style={styles.emptyText}>{strings.noResults}</Text>
              )}
              {sortedNotes.map(note => (
                <TouchableOpacity
                  key={note.id}
                  style={styles.noteItem}
                  onPress={() => handleEditNote(note)}
                  activeOpacity={0.7}
                >
                  <View style={styles.noteHeader}>
                    <View style={styles.titleContainer}>
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={(e) => {
                          e.stopPropagation(); // Üst düğmeye tıklamayı engelle
                          toggleFavorite(note.id);
                        }}
                      >
                        <MaterialIcons
                          name={note.isFavorite ? "star" : "star-border"}
                          size={20}
                          color={note.isFavorite ? "#FFD700" : theme.subtext}
                        />
                      </TouchableOpacity>
                      <Text style={styles.noteTitle} numberOfLines={1}>
                        {note.title}
                      </Text>
                    </View>
                    <Text style={styles.noteDate} accessibilityLabel={strings.noteDate}>
                      {formatDate(note.updatedAt)}
                    </Text>
                  </View>
                  
                  {note.image && (
                    <Image
                      source={{ uri: note.image }}
                      style={styles.noteImage}
                      resizeMode="cover"
                    />
                  )}
                  
                  <Text style={styles.noteContent} numberOfLines={3}>
                    {note.content}
                  </Text>

                  <View style={styles.noteFooter}>
                    <Text style={styles.noteCategory} accessibilityLabel={strings.noteCategory}>
                      {note.category}
                    </Text>
                    <View style={styles.noteActions}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation(); // Üst düğmeye tıklamayı engelle
                          shareNote(note);
                        }}
                        style={styles.iconButton}
                      >
                        <Feather name="share-2" size={16} color={theme.subtext} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation(); // Üst düğmeye tıklamayı engelle
                          deleteNote(note.id);
                        }}
                        style={styles.iconButton}
                        activeOpacity={0.7}
                      >
                        <Feather name="trash-2" size={16} color={theme.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {renderCategoryModal()}
          {renderSortModal()}

          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowAddNote(true)}
            accessibilityLabel={strings.addNoteButton}
          >
            <LinearGradient
              colors={theme.gradient}
              style={styles.fabGradient}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <BannerAd
            unitId="ca-app-pub-3850996093825148/7627436510"
            size={BannerAdSize.FULL_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </>
      )}
    </View>
  );

  const TabNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap = 'note';
          if (route.name === 'Tasks') {
            iconName = 'check-circle';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subtext,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          position: 'absolute',
          bottom: 0,
          height: 60,
          paddingBottom: 8,
          elevation: 0,
          borderTopWidth: 0,
          shadowOpacity: 0,
          width: '100%',
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarShowLabel: true,
      })}
    >
      <Tab.Screen 
        name="Notes" 
        component={renderHomeScreen}
        options={{ 
          title: strings.notes,
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={() => <TaskScreen theme={theme} />}
        options={{ 
          title: strings.tasks,
          headerShown: false,
        }}
      /> 
    </Tab.Navigator>
  );

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      /> 
    </Stack.Navigator>
  );
};

export default NotesApp;