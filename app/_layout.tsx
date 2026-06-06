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
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

// AdMob is a native module that does NOT exist in Expo Go. Only load it in
// dev/production builds; in Expo Go we skip ads so the app still runs.
const isExpoGo = Constants.appOwnership === 'expo';
let BannerAd: any = null;
let BannerAdSize: any = null;
if (!isExpoGo) {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color?: string;
  image?: string | null;
  isFavorite?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  deletedAt?: string | null;
  tags?: string[];
  checklistItems?: ChecklistItem[];
  isChecklist?: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

enum SortOption {
  DATE_DESC = 'DATE_DESC',
  DATE_ASC = 'DATE_ASC',
  TITLE_ASC = 'TITLE_ASC',
  TITLE_DESC = 'TITLE_DESC',
  CATEGORY = 'CATEGORY',
  FAVORITE = 'FAVORITE',
}

type RootStackParamList = { MainTabs: undefined };
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Light themes
const THEMES = {
  default:  { primary: '#6366F1', secondary: '#4F46E5', accent: '#F43F5E', background: '#F8FAFC', card: '#FFFFFF', text: '#1E293B', subtext: '#64748B', border: '#E2E8F0', gradient: ['#6366F1', '#4F46E5'] as [string, string] },
  rose:     { primary: '#EC4899', secondary: '#DB2777', accent: '#14B8A6', background: '#FDF2F8', card: '#FFFFFF', text: '#831843', subtext: '#BE185D', border: '#FBCFE8', gradient: ['#EC4899', '#DB2777'] as [string, string] },
  emerald:  { primary: '#10B981', secondary: '#059669', accent: '#F43F5E', background: '#ECFDF5', card: '#FFFFFF', text: '#064E3B', subtext: '#047857', border: '#A7F3D0', gradient: ['#10B981', '#059669'] as [string, string] },
  amber:    { primary: '#F59E0B', secondary: '#D97706', accent: '#6366F1', background: '#FFFBEB', card: '#FFFFFF', text: '#78350F', subtext: '#B45309', border: '#FDE68A', gradient: ['#F59E0B', '#D97706'] as [string, string] },
  sky:      { primary: '#0EA5E9', secondary: '#0284C7', accent: '#F43F5E', background: '#F0F9FF', card: '#FFFFFF', text: '#075985', subtext: '#0369A1', border: '#BAE6FD', gradient: ['#0EA5E9', '#0284C7'] as [string, string] },
  violet:   { primary: '#8B5CF6', secondary: '#7C3AED', accent: '#F43F5E', background: '#F5F3FF', card: '#FFFFFF', text: '#4C1D95', subtext: '#6D28D9', border: '#DDD6FE', gradient: ['#8B5CF6', '#7C3AED'] as [string, string] },
  fuchsia:  { primary: '#D946EF', secondary: '#C026D3', accent: '#2DD4BF', background: '#FAE8FF', card: '#FFFFFF', text: '#701A75', subtext: '#A21CAF', border: '#F5D0FE', gradient: ['#D946EF', '#C026D3'] as [string, string] },
  lime:     { primary: '#84CC16', secondary: '#65A30D', accent: '#EC4899', background: '#F7FEE7', card: '#FFFFFF', text: '#365314', subtext: '#4D7C0F', border: '#D9F99D', gradient: ['#84CC16', '#65A30D'] as [string, string] },
} as const;

// Dark themes
const DARK_THEMES = {
  default:  { primary: '#818CF8', secondary: '#6366F1', accent: '#FB7185', background: '#0F172A', card: '#1E293B', text: '#F1F5F9', subtext: '#94A3B8', border: '#334155', gradient: ['#4F46E5', '#3730A3'] as [string, string] },
  rose:     { primary: '#F472B6', secondary: '#EC4899', accent: '#2DD4BF', background: '#1C0516', card: '#2D1623', text: '#FDF2F8', subtext: '#F9A8D4', border: '#4A1942', gradient: ['#BE185D', '#9D174D'] as [string, string] },
  emerald:  { primary: '#34D399', secondary: '#10B981', accent: '#FB7185', background: '#032518', card: '#064E3B', text: '#ECFDF5', subtext: '#6EE7B7', border: '#065F46', gradient: ['#059669', '#047857'] as [string, string] },
  amber:    { primary: '#FCD34D', secondary: '#F59E0B', accent: '#818CF8', background: '#1C1200', card: '#2D2000', text: '#FFFBEB', subtext: '#FDE68A', border: '#44300A', gradient: ['#D97706', '#B45309'] as [string, string] },
  sky:      { primary: '#38BDF8', secondary: '#0EA5E9', accent: '#FB7185', background: '#030E1E', card: '#0C1A2E', text: '#F0F9FF', subtext: '#BAE6FD', border: '#0C4A6E', gradient: ['#0284C7', '#0369A1'] as [string, string] },
  violet:   { primary: '#A78BFA', secondary: '#8B5CF6', accent: '#FB7185', background: '#0D0720', card: '#1E0D35', text: '#F5F3FF', subtext: '#DDD6FE', border: '#2E1065', gradient: ['#7C3AED', '#6D28D9'] as [string, string] },
  fuchsia:  { primary: '#E879F9', secondary: '#D946EF', accent: '#2DD4BF', background: '#1A0028', card: '#2D0040', text: '#FAE8FF', subtext: '#F5D0FE', border: '#4A006E', gradient: ['#C026D3', '#A21CAF'] as [string, string] },
  lime:     { primary: '#A3E635', secondary: '#84CC16', accent: '#F472B6', background: '#0A1400', card: '#152200', text: '#F7FEE7', subtext: '#D9F99D', border: '#1F3500', gradient: ['#65A30D', '#4D7C0F'] as [string, string] },
} as const;

type ThemeNames = keyof typeof THEMES;

// Note templates
const NOTE_TEMPLATES = [
  { id: 'meeting',  icon: 'people',          title: 'Toplantı Notu',   titleEn: 'Meeting Notes',   content: '## Toplantı Notu\n\n**Tarih:** \n**Katılımcılar:** \n\n### Gündem\n1. \n\n### Notlar\n\n### Aksiyon Maddeleri\n- ' },
  { id: 'shopping', icon: 'shopping-cart',   title: 'Alışveriş',       titleEn: 'Shopping List',   content: '## Alışveriş Listesi\n\n- \n- \n- ' },
  { id: 'todo',     icon: 'check-box',       title: 'Yapılacaklar',    titleEn: 'To-Do List',      content: '## Yapılacaklar\n\n- \n- \n- ' },
  { id: 'journal',  icon: 'book',            title: 'Günlük',          titleEn: 'Daily Journal',   content: '## Günlük\n\n**Tarih:** \n**Mod:** \n\n### Bugün ne oldu:\n\n### Minnettarım:\n1. \n2. \n3. ' },
  { id: 'idea',     icon: 'lightbulb',       title: 'Fikir',           titleEn: 'Idea',            content: '## Fikir\n\n**Nedir?**\n\n**Neden önemli:**\n\n**Sonraki adımlar:**\n- ' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const NotesApp = () => {
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>(['Kişisel', 'İş', 'Alışveriş', 'Fikirler']);
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.DATE_DESC);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [language, setLanguage] = useState<Language>('tr');
  const [currentTheme, setCurrentTheme] = useState<ThemeNames>('default');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeView, setActiveView] = useState<'notes' | 'trash' | 'archive'>('notes');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string[]>([]);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const strings = translations[language];
  const theme = isDarkMode ? DARK_THEMES[currentTheme] : THEMES[currentTheme];

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadSettings();
    loadNotes();
    checkOnboarding();
  }, []);

  useEffect(() => {
    saveNotes();
  }, [notes]);

  // ─── Settings ────────────────────────────────────────────────────────────────

  const loadSettings = async () => {
    try {
      const [savedTheme, savedDark, savedLang, savedCats] = await Promise.all([
        AsyncStorage.getItem('currentTheme'),
        AsyncStorage.getItem('isDarkMode'),
        AsyncStorage.getItem('appLanguage'),
        AsyncStorage.getItem('categories'),
      ]);
      if (savedTheme && savedTheme in THEMES) setCurrentTheme(savedTheme as ThemeNames);
      if (savedDark !== null) setIsDarkMode(savedDark === 'true');
      if (savedLang === 'en' || savedLang === 'tr') setLanguage(savedLang as Language);
      if (savedCats) setCategories(JSON.parse(savedCats));
    } catch (_) {}
  };

  const checkOnboarding = async () => {
    const seen = await AsyncStorage.getItem('hasSeenOnboarding');
    if (!seen) setShowOnboarding(true);
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const toggleTheme = () => {
    const themes = Object.keys(THEMES) as ThemeNames[];
    const next = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
    AsyncStorage.setItem('currentTheme', next).then(() => setCurrentTheme(next));
  };

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    AsyncStorage.setItem('isDarkMode', String(next));
  };

  // ─── Notes Storage ───────────────────────────────────────────────────────────

  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem('notes');
      if (stored) {
        const parsed: Note[] = JSON.parse(stored);
        // Auto-delete trash older than 30 days
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const cleaned = parsed.filter(n => !n.deletedAt || new Date(n.deletedAt).getTime() > cutoff);
        setNotes(cleaned);
      }
    } catch (_) {
      Alert.alert(strings.error, strings.loadError);
    }
  };

  const saveNotes = async () => {
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(notes));
    } catch (_) {}
  };

  // ─── Note CRUD ───────────────────────────────────────────────────────────────

  const handleSaveNote = (noteData: {
    title: string;
    content: string;
    image: string | null;
    category: string;
    tags?: string[];
    checklistItems?: ChecklistItem[];
    isChecklist?: boolean;
  }) => {
    if (editingNote && editingNote.id) {
      setNotes(prev => prev.map(n =>
        n.id === editingNote.id
          ? { ...n, ...noteData, updatedAt: new Date().toISOString() }
          : n
      ));
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        ...noteData,
        isFavorite: false,
        isPinned: false,
        isArchived: false,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes(prev => [newNote, ...prev]);
    }
    setShowAddNote(false);
    setEditingNote(null);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowAddNote(true);
  };

  const moveToTrash = (id: string) => {
    Alert.alert(strings.delete, strings.deleteConfirm, [
      { text: strings.cancel, style: 'cancel' },
      {
        text: strings.delete,
        style: 'destructive',
        onPress: () => setNotes(prev => prev.map(n =>
          n.id === id ? { ...n, deletedAt: new Date().toISOString(), isPinned: false } : n
        )),
      },
    ]);
  };

  const restoreFromTrash = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, deletedAt: null } : n));
  };

  const permanentDelete = (id: string) => {
    Alert.alert(strings.permanentDelete, strings.permanentDeleteConfirm, [
      { text: strings.cancel, style: 'cancel' },
      { text: strings.delete, style: 'destructive', onPress: () => setNotes(prev => prev.filter(n => n.id !== id)) },
    ]);
  };

  const archiveNote = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isArchived: true, isPinned: false } : n));
  };

  const restoreFromArchive = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isArchived: false } : n));
  };

  const toggleFavorite = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n));
  };

  const togglePin = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updated = [...categories, newCategory.trim()];
      setCategories(updated);
      AsyncStorage.setItem('categories', JSON.stringify(updated));
      setNewCategory('');
      setShowCategoryModal(false);
    }
  };

  // ─── Filter & Sort ───────────────────────────────────────────────────────────

  const getAllTags = (): string[] => {
    const tagSet = new Set<string>();
    notes.forEach(n => n.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  };

  const getActiveNotes = () => notes.filter(n => !n.deletedAt && !n.isArchived);
  const getTrashedNotes = () => notes.filter(n => !!n.deletedAt);
  const getArchivedNotes = () => notes.filter(n => n.isArchived && !n.deletedAt);

  const applyFilters = (list: Note[]): Note[] => {
    let filtered = list;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filterCategory) filtered = filtered.filter(n => n.category === filterCategory);
    if (selectedTagFilter.length > 0) {
      filtered = filtered.filter(n => selectedTagFilter.every(t => n.tags?.includes(t)));
    }
    return filtered;
  };

  const applySorting = (list: Note[]): Note[] => {
    const sorted = [...list];
    switch (sortOption) {
      case SortOption.DATE_DESC: sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); break;
      case SortOption.DATE_ASC:  sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()); break;
      case SortOption.TITLE_ASC: sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case SortOption.TITLE_DESC:sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
      case SortOption.CATEGORY:  sorted.sort((a, b) => (a.category || '').localeCompare(b.category || '')); break;
      case SortOption.FAVORITE:  sorted.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); break;
    }
    // Pinned always on top
    return [...sorted.filter(n => n.isPinned), ...sorted.filter(n => !n.isPinned)];
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getSortOptionText = (o: SortOption) => ({
    [SortOption.DATE_DESC]: strings.dateDesc,
    [SortOption.DATE_ASC]:  strings.dateAsc,
    [SortOption.TITLE_ASC]: strings.titleAsc,
    [SortOption.TITLE_DESC]:strings.titleDesc,
    [SortOption.CATEGORY]:  strings.categorySort,
    [SortOption.FAVORITE]:  strings.favoriteSort,
  }[o] || '');

  const exportNotes = async () => {
    try {
      const uri = `${FileSystem.documentDirectory}notes_backup.json`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(notes));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
    } catch (_) { Alert.alert(strings.error, strings.exportError); }
  };

  const shareNote = async (note: Note) => {
    try {
      const tmp = `${FileSystem.cacheDirectory}note.txt`;
      const body = note.isChecklist
        ? `${note.title}\n\n${(note.checklistItems || []).map(i => `${i.completed ? '✅' : '⬜'} ${i.text}`).join('\n')}`
        : `${note.title}\n\n${note.content}`;
      await FileSystem.writeAsStringAsync(tmp, body);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tmp, { mimeType: 'text/plain', dialogTitle: strings.shareNote });
      }
      await FileSystem.deleteAsync(tmp, { idempotent: true });
    } catch (_) { Alert.alert(strings.error, strings.shareError); }
  };

  // ─── Onboarding ───────────────────────────────────────────────────────────────

  const onboardingSteps = [
    { icon: 'note'        as const, title: strings.onboardingNotesTitle, desc: strings.onboardingNotesDesc },
    { icon: 'label'       as const, title: strings.onboardingTagsTitle,  desc: strings.onboardingTagsDesc  },
    { icon: 'push-pin'    as const, title: strings.onboardingPinTitle,   desc: strings.onboardingPinDesc   },
    { icon: 'check-circle'as const, title: strings.onboardingTasksTitle, desc: strings.onboardingTasksDesc },
  ];

  const renderOnboarding = () => (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={theme.gradient} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 36 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 36 }}>
          <MaterialIcons name={onboardingSteps[onboardingStep].icon} size={56} color="#fff" />
        </View>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16 }}>
          {onboardingSteps[onboardingStep].title}
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 26, marginBottom: 48 }}>
          {onboardingSteps[onboardingStep].desc}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 40 }}>
          {onboardingSteps.map((_, i) => (
            <View key={i} style={{ width: i === onboardingStep ? 28 : 8, height: 8, borderRadius: 4, backgroundColor: i === onboardingStep ? '#fff' : 'rgba(255,255,255,0.4)' }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
          <TouchableOpacity onPress={completeOnboarding} style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16 }}>{strings.skip}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onboardingStep < onboardingSteps.length - 1 ? setOnboardingStep(s => s + 1) : completeOnboarding()}
            style={{ backgroundColor: '#fff', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 30 }}
          >
            <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 16 }}>
              {onboardingStep < onboardingSteps.length - 1 ? strings.next : strings.getStarted}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  // ─── Modals ───────────────────────────────────────────────────────────────────

  const renderSortModal = () => (
    <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
      <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{strings.sortNotes}</Text>
          {Object.values(SortOption).map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.sortOption, { borderBottomColor: theme.border }, sortOption === opt && { backgroundColor: `${theme.primary}15` }]}
              onPress={() => { setSortOption(opt); setShowSortModal(false); }}
            >
              <Text style={[styles.sortOptionText, { color: sortOption === opt ? theme.primary : theme.subtext }, sortOption === opt && { fontWeight: 'bold' }]}>
                {getSortOptionText(opt)}
              </Text>
              {sortOption === opt && <MaterialIcons name="check" size={18} color={theme.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

  const renderCategoryModal = () => (
    <Modal visible={showCategoryModal} transparent animationType="fade" onRequestClose={() => setShowCategoryModal(false)}>
      <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{strings.addCategory}</Text>
          <TextInput
            style={[styles.categoryInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder={strings.categoryName}
            placeholderTextColor={theme.subtext}
            value={newCategory}
            onChangeText={setNewCategory}
            onSubmitEditing={addCategory}
          />
          <TouchableOpacity style={[styles.addCategoryButton, { backgroundColor: theme.primary }]} onPress={addCategory}>
            <Text style={styles.addCategoryButtonText}>{strings.addCategory}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  const renderTagsModal = () => {
    const allTags = getAllTags();
    return (
      <Modal visible={showTagsModal} transparent animationType="fade" onRequestClose={() => setShowTagsModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTagsModal(false)}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{strings.filterByTag}</Text>
            {allTags.length === 0 ? (
              <Text style={{ color: theme.subtext, textAlign: 'center', paddingVertical: 20, fontSize: 14 }}>{strings.noTags}</Text>
            ) : (
              <ScrollView style={{ maxHeight: 220 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 8 }}>
                  {allTags.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => setSelectedTagFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                      style={[styles.tagChip, { borderColor: theme.primary, backgroundColor: selectedTagFilter.includes(tag) ? theme.primary : 'transparent' }]}
                    >
                      <Text style={{ color: selectedTagFilter.includes(tag) ? '#fff' : theme.primary, fontSize: 12, fontWeight: '500' }}>#{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            {selectedTagFilter.length > 0 && (
              <TouchableOpacity onPress={() => { setSelectedTagFilter([]); setShowTagsModal(false); }} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: theme.accent, fontWeight: '600', fontSize: 14 }}>{strings.clearFilters}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setShowTagsModal(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: theme.subtext, fontSize: 14 }}>{strings.modalClose}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    );
  };

  const renderTemplateModal = () => (
    <Modal visible={showTemplateModal} transparent animationType="slide" onRequestClose={() => setShowTemplateModal(false)}>
      <Pressable style={styles.modalOverlay} onPress={() => setShowTemplateModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{strings.templates}</Text>
          <TouchableOpacity
            style={[styles.templateItem, { borderColor: theme.border }]}
            onPress={() => { setEditingNote(null); setShowTemplateModal(false); setShowAddNote(true); }}
          >
            <View style={[styles.templateIcon, { backgroundColor: `${theme.primary}15` }]}>
              <MaterialIcons name="edit" size={22} color={theme.primary} />
            </View>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{strings.blankNote}</Text>
          </TouchableOpacity>
          {NOTE_TEMPLATES.map(tpl => (
            <TouchableOpacity
              key={tpl.id}
              style={[styles.templateItem, { borderColor: theme.border }]}
              onPress={() => {
                setEditingNote({ id: '', title: language === 'tr' ? tpl.title : tpl.titleEn, content: tpl.content, createdAt: '', updatedAt: '' } as Note);
                setShowTemplateModal(false);
                setShowAddNote(true);
              }}
            >
              <View style={[styles.templateIcon, { backgroundColor: `${theme.primary}15` }]}>
                <MaterialIcons name={tpl.icon as any} size={22} color={theme.primary} />
              </View>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{language === 'tr' ? tpl.title : tpl.titleEn}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

  // ─── Note Card ────────────────────────────────────────────────────────────────

  const renderNoteCard = (note: Note, context: 'active' | 'trash' | 'archive') => (
    <TouchableOpacity
      key={note.id}
      style={[
        styles.noteItem,
        { backgroundColor: theme.card },
        note.isPinned && context === 'active' && { borderLeftWidth: 3, borderLeftColor: theme.primary },
      ]}
      onPress={() => context === 'active' ? handleEditNote(note) : undefined}
      activeOpacity={context === 'active' ? 0.7 : 1}
    >
      <View style={styles.noteHeader}>
        <View style={styles.titleContainer}>
          {context === 'active' && (
            <TouchableOpacity onPress={() => toggleFavorite(note.id)} style={styles.favoriteButton}>
              <MaterialIcons name={note.isFavorite ? 'star' : 'star-border'} size={18} color={note.isFavorite ? '#FFD700' : theme.subtext} />
            </TouchableOpacity>
          )}
          {note.isPinned && context === 'active' && (
            <MaterialIcons name="push-pin" size={12} color={theme.primary} style={{ marginRight: 2, transform: [{ rotate: '45deg' }] }} />
          )}
          <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={1}>{note.title}</Text>
        </View>
        <Text style={[styles.noteDate, { color: theme.subtext, backgroundColor: `${theme.subtext}15` }]}>
          {formatDate(context === 'trash' && note.deletedAt ? note.deletedAt : note.updatedAt)}
        </Text>
      </View>

      {note.image && !note.isChecklist && (
        <Image source={{ uri: note.image }} style={styles.noteImage} resizeMode="cover" />
      )}

      {note.isChecklist && note.checklistItems ? (
        <View style={{ marginBottom: 8 }}>
          {note.checklistItems.slice(0, 3).map(item => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <MaterialIcons name={item.completed ? 'check-box' : 'check-box-outline-blank'} size={14} color={item.completed ? theme.primary : theme.subtext} />
              <Text style={{ color: item.completed ? theme.subtext : theme.text, fontSize: 12, marginLeft: 4, flex: 1, textDecorationLine: item.completed ? 'line-through' : 'none' }} numberOfLines={1}>
                {item.text}
              </Text>
            </View>
          ))}
          {note.checklistItems.length > 3 && (
            <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>+{note.checklistItems.length - 3} madde daha</Text>
          )}
        </View>
      ) : (
        <Text style={[styles.noteContent, { color: theme.subtext }]} numberOfLines={3}>{note.content}</Text>
      )}

      {note.tags && note.tags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
          {note.tags.map(tag => (
            <View key={tag} style={[styles.tagChip, { borderColor: theme.primary, marginRight: 4, paddingHorizontal: 7, paddingVertical: 2 }]}>
              <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '500' }}>#{tag}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={[styles.noteFooter, { borderTopColor: `${theme.border}60` }]}>
        <Text style={[styles.noteCategory, { color: theme.primary, backgroundColor: `${theme.primary}20` }]}>{note.category}</Text>
        <View style={styles.noteActions}>
          {context === 'active' && (
            <>
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); togglePin(note.id); }} style={styles.iconButton}>
                <MaterialIcons name="push-pin" size={15} color={note.isPinned ? theme.primary : theme.subtext} />
              </TouchableOpacity>
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); archiveNote(note.id); }} style={styles.iconButton}>
                <MaterialIcons name="archive" size={15} color={theme.subtext} />
              </TouchableOpacity>
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); shareNote(note); }} style={styles.iconButton}>
                <Feather name="share-2" size={14} color={theme.subtext} />
              </TouchableOpacity>
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); moveToTrash(note.id); }} style={styles.iconButton}>
                <Feather name="trash-2" size={14} color={theme.accent} />
              </TouchableOpacity>
            </>
          )}
          {context === 'trash' && (
            <>
              <TouchableOpacity onPress={() => restoreFromTrash(note.id)} style={[styles.iconButton, { backgroundColor: `${theme.primary}20`, borderRadius: 6 }]}>
                <MaterialIcons name="restore" size={16} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => permanentDelete(note.id)} style={[styles.iconButton, { backgroundColor: `${theme.accent}20`, borderRadius: 6 }]}>
                <Feather name="trash-2" size={14} color={theme.accent} />
              </TouchableOpacity>
            </>
          )}
          {context === 'archive' && (
            <TouchableOpacity onPress={() => restoreFromArchive(note.id)} style={[styles.iconButton, { backgroundColor: `${theme.primary}20`, borderRadius: 6 }]}>
              <MaterialIcons name="unarchive" size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─── Home Screen ──────────────────────────────────────────────────────────────

  const renderHomeScreen = () => {
    const activeNotes = applySorting(applyFilters(getActiveNotes()));
    const trashedNotes = getTrashedNotes();
    const archivedNotes = applySorting(applyFilters(getArchivedNotes()));
    const hasFilters = selectedTagFilter.length > 0 || !!filterCategory || !!searchQuery;

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {showAddNote ? (
          <AddNote
            onSave={handleSaveNote}
            onCancel={() => { setShowAddNote(false); setEditingNote(null); }}
            categories={categories}
            theme={theme}
            initialNote={editingNote}
          />
        ) : (
          <>
            {/* Header */}
            <LinearGradient colors={theme.gradient} style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>{strings.appName}</Text>
                <View style={styles.headerRight}>
                  <TouchableOpacity style={styles.headerButton} onPress={toggleDarkMode}>
                    <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']} style={styles.headerButtonGradient}>
                      <MaterialIcons name={isDarkMode ? 'wb-sunny' : 'nights-stay'} size={19} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerButton} onPress={toggleTheme}>
                    <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']} style={styles.headerButtonGradient}>
                      <MaterialIcons name="palette" size={19} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerButton} onPress={() => setShowSortModal(true)}>
                    <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']} style={styles.headerButtonGradient}>
                      <MaterialIcons name="sort" size={19} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
              <Feather name="search" size={18} color={theme.subtext} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={strings.searchPlaceholder}
                placeholderTextColor={theme.subtext}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {hasFilters && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedTagFilter([]); setFilterCategory(null); }}>
                  <Feather name="x-circle" size={18} color={theme.subtext} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowTagsModal(true)} style={{ marginLeft: 8 }}>
                <MaterialIcons name="label" size={20} color={selectedTagFilter.length > 0 ? theme.primary : theme.subtext} />
              </TouchableOpacity>
            </View>

            {/* View Tabs: Notes / Archive / Trash */}
            <View style={[styles.viewTabBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
              {(['notes', 'archive', 'trash'] as const).map(view => (
                <TouchableOpacity
                  key={view}
                  style={[styles.viewTab, activeView === view && { borderBottomWidth: 2, borderBottomColor: theme.primary }]}
                  onPress={() => setActiveView(view)}
                >
                  <MaterialIcons
                    name={view === 'notes' ? 'note' : view === 'archive' ? 'archive' : 'delete-outline'}
                    size={17}
                    color={activeView === view ? theme.primary : theme.subtext}
                  />
                  <Text style={{ color: activeView === view ? theme.primary : theme.subtext, fontSize: 12, marginLeft: 4, fontWeight: activeView === view ? '700' : '400' }}>
                    {view === 'notes' ? strings.notes : view === 'archive' ? strings.archived : strings.trash}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Filter Row */}
            {activeView === 'notes' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer} contentContainerStyle={styles.categoryList}>
                <TouchableOpacity
                  style={[styles.categoryChip, { backgroundColor: theme.card }, !filterCategory && { backgroundColor: theme.primary }]}
                  onPress={() => setFilterCategory(null)}
                >
                  <Text style={[styles.categoryChipText, { color: !filterCategory ? '#fff' : theme.subtext }]}>
                    {language === 'tr' ? 'Tümü' : 'All'}
                  </Text>
                </TouchableOpacity>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, { backgroundColor: theme.card }, filterCategory === cat && { backgroundColor: theme.primary }]}
                    onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
                  >
                    <Text style={[styles.categoryChipText, { color: filterCategory === cat ? '#fff' : theme.subtext }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.categoryChip, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.primary, borderStyle: 'dashed' }]}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Feather name="plus" size={14} color={theme.primary} />
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Notes List */}
            <ScrollView style={styles.notesList} contentContainerStyle={{ paddingBottom: 160 }}>
              <View style={styles.notesGrid}>
                {activeView === 'notes' && (
                  activeNotes.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialIcons name="note-add" size={72} color={`${theme.border}`} />
                      <Text style={{ color: theme.subtext, marginTop: 16, fontSize: 15, textAlign: 'center' }}>
                        {hasFilters ? strings.noResults : strings.noNotes}
                      </Text>
                    </View>
                  ) : activeNotes.map(n => renderNoteCard(n, 'active'))
                )}

                {activeView === 'trash' && (
                  trashedNotes.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialIcons name="delete-outline" size={72} color={`${theme.border}`} />
                      <Text style={{ color: theme.subtext, marginTop: 16, fontSize: 15 }}>{strings.trashEmpty}</Text>
                    </View>
                  ) : (
                    <>
                      <View style={{ width: '100%', backgroundColor: `${theme.accent}15`, borderRadius: 10, padding: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialIcons name="info-outline" size={15} color={theme.accent} />
                        <Text style={{ color: theme.accent, fontSize: 12, flex: 1 }}>{strings.trashInfo}</Text>
                      </View>
                      {trashedNotes.map(n => renderNoteCard(n, 'trash'))}
                    </>
                  )
                )}

                {activeView === 'archive' && (
                  archivedNotes.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialIcons name="archive" size={72} color={`${theme.border}`} />
                      <Text style={{ color: theme.subtext, marginTop: 16, fontSize: 15 }}>{strings.archiveEmpty}</Text>
                    </View>
                  ) : archivedNotes.map(n => renderNoteCard(n, 'archive'))
                )}
              </View>
            </ScrollView>

            {/* Modals */}
            {renderCategoryModal()}
            {renderSortModal()}
            {renderTagsModal()}
            {renderTemplateModal()}

            {/* FAB */}
            {activeView === 'notes' && (
              <TouchableOpacity
                style={styles.fab}
                onPress={() => { setEditingNote(null); setShowTemplateModal(true); }}
              >
                <LinearGradient colors={theme.gradient} style={styles.fabGradient}>
                  <MaterialIcons name="add" size={30} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {BannerAd && (
              <BannerAd
                unitId="ca-app-pub-3850996093825148/7627436510"
                size={BannerAdSize.FULL_BANNER}
                requestOptions={{ requestNonPersonalizedAdsOnly: true }}
              />
            )}
          </>
        )}
      </View>
    );
  };

  // ─── Navigation ───────────────────────────────────────────────────────────────

  if (showOnboarding) return renderOnboarding();

  const TabNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name={route.name === 'Tasks' ? 'check-circle' : 'note'} size={size} color={color} />
        ),
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subtext,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          position: 'absolute',
          bottom: 0,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      })}
    >
      <Tab.Screen name="Notes" options={{ title: strings.notes, headerShown: false }}>
        {() => renderHomeScreen()}
      </Tab.Screen>
      <Tab.Screen name="Tasks" options={{ title: strings.tasks, headerShown: false }}>
        {() => <TaskScreen theme={theme} language={language} />}
      </Tab.Screen>
    </Tab.Navigator>
  );

  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerButton: { width: 38, height: 38, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  headerButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: -22,
    padding: 14,
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  viewTabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderBottomWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  categoryContainer: { marginHorizontal: 16, marginBottom: 10, flexGrow: 0 },
  categoryList: { paddingVertical: 4, gap: 8, alignItems: 'center' },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  categoryChipText: { fontSize: 13, fontWeight: '500' },
  notesList: { flex: 1, paddingHorizontal: 8 },
  notesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 4 },
  noteItem: {
    width: '48%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  titleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  noteTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  noteDate: { fontSize: 9, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  noteContent: { fontSize: 12, lineHeight: 18, marginBottom: 8, opacity: 0.8 },
  noteImage: { width: '100%', height: 100, borderRadius: 10, marginBottom: 8 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1 },
  noteCategory: { fontSize: 9, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, fontWeight: '600' },
  noteActions: { flexDirection: 'row', gap: 4 },
  iconButton: { padding: 5 },
  favoriteButton: { marginRight: 2 },
  fab: { position: 'absolute', bottom: 80, right: 20, width: 58, height: 58, borderRadius: 29, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  fabGradient: { flex: 1, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '88%', padding: 24, borderRadius: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  sortOptionText: { fontSize: 15 },
  categoryInput: { fontSize: 15, padding: 12, borderWidth: 1, borderRadius: 10, marginBottom: 14 },
  addCategoryButton: { padding: 14, borderRadius: 12, alignItems: 'center' },
  addCategoryButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  tagChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  templateItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, gap: 12 },
  templateIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});

export default NotesApp;
