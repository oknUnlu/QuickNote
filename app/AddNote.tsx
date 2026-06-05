import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../hooks/useLanguage';
import type { ChecklistItem } from './_layout';

interface AddNoteProps {
  onSave: (note: {
    title: string;
    content: string;
    image: string | null;
    category: string;
    tags?: string[];
    checklistItems?: ChecklistItem[];
    isChecklist?: boolean;
  }) => void;
  onCancel: () => void;
  categories: string[];
  theme: any;
  initialNote?: any;
}

const AddNote = ({ onSave, onCancel, categories, theme, initialNote }: AddNoteProps) => {
  const { strings } = useLanguage();

  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(initialNote?.image || null);
  const [selectedCategory, setSelectedCategory] = useState(initialNote?.category || (categories[0] ?? ''));
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Tags
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Checklist
  const [isChecklist, setIsChecklist] = useState<boolean>(initialNote?.isChecklist || false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    initialNote?.checklistItems || []
  );
  const [newItemText, setNewItemText] = useState('');

  // ─── Checklist helpers ────────────────────────────────────────────────────────

  const addChecklistItem = () => {
    if (!newItemText.trim()) return;
    setChecklistItems(prev => [
      ...prev,
      { id: Date.now().toString(), text: newItemText.trim(), completed: false },
    ]);
    setNewItemText('');
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const deleteChecklistItem = (id: string) => {
    setChecklistItems(prev => prev.filter(item => item.id !== id));
  };

  const updateChecklistItem = (id: string, text: string) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, text } : item));
  };

  // ─── Tag helpers ──────────────────────────────────────────────────────────────

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  // ─── Image picker ─────────────────────────────────────────────────────────────

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gereklidir.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  // ─── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('', strings.noteTitle + ' boş olamaz.');
      return;
    }
    onSave({
      title: title.trim(),
      content,
      image: selectedImage,
      category: selectedCategory,
      tags,
      checklistItems: isChecklist ? checklistItems : [],
      isChecklist,
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <LinearGradient colors={theme.gradient} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onCancel} style={styles.headerIconBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {initialNote?.id ? strings.editNote : strings.addNote}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>{strings.save}</Text>
          </TouchableOpacity>
        </View>

        {/* Mode toggle: Text / Checklist */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, !isChecklist && styles.modeBtnActive]}
            onPress={() => setIsChecklist(false)}
          >
            <MaterialIcons name="notes" size={16} color={!isChecklist ? theme.primary : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.modeBtnText, !isChecklist && { color: theme.primary, fontWeight: '700' }]}>
              {strings.textMode}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, isChecklist && styles.modeBtnActive]}
            onPress={() => setIsChecklist(true)}
          >
            <MaterialIcons name="check-box" size={16} color={isChecklist ? theme.primary : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.modeBtnText, isChecklist && { color: theme.primary, fontWeight: '700' }]}>
              {strings.checklist}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: theme.card }]}>

          {/* Title */}
          <TextInput
            style={[styles.titleInput, { color: theme.text, borderBottomColor: theme.border }]}
            placeholder={strings.noteTitle}
            placeholderTextColor={theme.subtext}
            value={title}
            onChangeText={setTitle}
          />

          {/* Content or Checklist */}
          {!isChecklist ? (
            <View style={[styles.contentWrapper, { borderColor: theme.border }]}>
              <TextInput
                style={[
                  styles.contentInput,
                  { color: theme.text },
                  isBold && { fontWeight: 'bold' },
                  isItalic && { fontStyle: 'italic' },
                  isUnderline && { textDecorationLine: 'underline' },
                ]}
                placeholder={strings.noteContent}
                placeholderTextColor={theme.subtext}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
              {/* Format toolbar */}
              <View style={[styles.formatBar, { borderTopColor: theme.border }]}>
                {([
                  { key: 'bold',      icon: 'format-bold',       state: isBold,      set: setIsBold },
                  { key: 'italic',    icon: 'format-italic',     state: isItalic,    set: setIsItalic },
                  { key: 'underline', icon: 'format-underlined', state: isUnderline, set: setIsUnderline },
                ] as const).map(({ key, icon, state, set }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => set(!state)}
                    style={[styles.formatBtn, { borderColor: theme.border }, state && { backgroundColor: `${theme.primary}20`, borderColor: theme.primary }]}
                  >
                    <MaterialIcons name={icon} size={18} color={state ? theme.primary : theme.subtext} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ marginBottom: 16 }}>
              {checklistItems.map((item, idx) => (
                <View key={item.id} style={[styles.checklistRow, { borderBottomColor: theme.border }]}>
                  <TouchableOpacity onPress={() => toggleChecklistItem(item.id)} style={{ marginRight: 10 }}>
                    <MaterialIcons
                      name={item.completed ? 'check-box' : 'check-box-outline-blank'}
                      size={22}
                      color={item.completed ? theme.primary : theme.subtext}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={[
                      styles.checklistInput,
                      { color: theme.text },
                      item.completed && { textDecorationLine: 'line-through', color: theme.subtext },
                    ]}
                    value={item.text}
                    onChangeText={(t) => updateChecklistItem(item.id, t)}
                    multiline={false}
                  />
                  <TouchableOpacity onPress={() => deleteChecklistItem(item.id)}>
                    <Feather name="x" size={16} color={theme.subtext} />
                  </TouchableOpacity>
                </View>
              ))}
              {/* Add item row */}
              <View style={[styles.checklistRow, { borderBottomColor: theme.border }]}>
                <MaterialIcons name="add-circle-outline" size={22} color={theme.primary} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.checklistInput, { color: theme.text, flex: 1 }]}
                  placeholder={strings.addItem}
                  placeholderTextColor={theme.subtext}
                  value={newItemText}
                  onChangeText={setNewItemText}
                  onSubmitEditing={addChecklistItem}
                  returnKeyType="done"
                />
                {newItemText.trim().length > 0 && (
                  <TouchableOpacity onPress={addChecklistItem}>
                    <MaterialIcons name="check" size={20} color={theme.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Category */}
          <Text style={[styles.sectionLabel, { color: theme.subtext }]}>{strings.noteCategory}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, { backgroundColor: selectedCategory === cat ? theme.primary : `${theme.primary}15`, borderColor: theme.primary }]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={{ color: selectedCategory === cat ? '#fff' : theme.primary, fontSize: 13, fontWeight: '500' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Tags */}
          <Text style={[styles.sectionLabel, { color: theme.subtext }]}>{strings.tags}</Text>
          {tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {tags.map(tag => (
                <View key={tag} style={[styles.tagChip, { backgroundColor: `${theme.primary}15`, borderColor: theme.primary }]}>
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '500' }}>#{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)} style={{ marginLeft: 4 }}>
                    <Feather name="x" size={12} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={[styles.tagInputRow, { borderColor: theme.border, backgroundColor: theme.background }]}>
            <TextInput
              style={[styles.tagTextInput, { color: theme.text }]}
              placeholder={strings.addTag}
              placeholderTextColor={theme.subtext}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              returnKeyType="done"
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={addTag} style={[styles.tagAddBtn, { backgroundColor: theme.primary }]}>
              <Feather name="plus" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Image */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 }}>
            <TouchableOpacity
              style={[styles.optionBtn, { backgroundColor: theme.primary }]}
              onPress={pickImage}
            >
              <MaterialIcons name="image" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, marginLeft: 6 }}>
                {selectedImage ? 'Değiştir' : 'Fotoğraf'}
              </Text>
            </TouchableOpacity>
            {selectedImage && (
              <TouchableOpacity
                style={[styles.optionBtn, { backgroundColor: `${theme.accent}20`, borderWidth: 1, borderColor: theme.accent }]}
                onPress={() => setSelectedImage(null)}
              >
                <Feather name="x" size={16} color={theme.accent} />
                <Text style={{ color: theme.accent, fontSize: 13, marginLeft: 4 }}>Kaldır</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedImage && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} resizeMode="cover" />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerIconBtn: { padding: 6 },
  headerTitle: { fontSize: 19, fontWeight: 'bold', color: '#fff' },
  saveButton: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    padding: 3,
    marginBottom: 4,
    alignSelf: 'center',
  },
  modeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, gap: 5 },
  modeBtnActive: { backgroundColor: '#fff' },
  modeBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  scrollView: { flex: 1, padding: 16 },
  card: {
    borderRadius: 20,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 20,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  contentWrapper: { borderWidth: 1, borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  contentInput: { padding: 12, fontSize: 15, minHeight: 140, lineHeight: 22 },
  formatBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 8, borderTopWidth: 1, gap: 6 },
  formatBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  checklistInput: { flex: 1, fontSize: 15 },
  sectionLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  tagChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  tagTextInput: { flex: 1, padding: 10, fontSize: 14 },
  tagAddBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
  optionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  imageContainer: { marginTop: 14, borderRadius: 12, overflow: 'hidden' },
  selectedImage: { width: '100%', height: 200 },
});

export default AddNote;
