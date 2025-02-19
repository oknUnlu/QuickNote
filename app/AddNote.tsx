import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../hooks/useLanguage';

interface AddNoteProps {
  onSave: (note: {
    title: string;
    content: string;
    image: string | null;
    category: string;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
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
  const [selectedImage, setSelectedImage] = useState(initialNote?.image || null);
  const [selectedCategory, setSelectedCategory] = useState(initialNote?.category || categories[0]); 
  const [isBold, setIsBold] = useState(initialNote?.isBold || false);
  const [isItalic, setIsItalic] = useState(initialNote?.isItalic || false);
  const [isUnderline, setIsUnderline] = useState(initialNote?.isUnderline || false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    onSave({
      title,
      content: content,
      image: selectedImage,
      category: selectedCategory,
      isBold,
      isItalic,
      isUnderline,
    });
  };

  const formatText = (type: 'bold' | 'italic' | 'underline') => {
    const formats = {
      bold: isBold,
      italic: isItalic,
      underline: isUnderline
    };
    
    const setters = {
      bold: setIsBold,
      italic: setIsItalic,
      underline: setIsUnderline
    };

    setters[type](!formats[type]);
  };

  const markdownStyles = {
    body: {
      color: theme.text,
    },
    heading1: {
      fontSize: 24,
      color: theme.text,
      fontWeight: 'bold',
      marginVertical: 10,
    },
    heading2: {
      fontSize: 20,
      color: theme.text,
      fontWeight: 'bold',
      marginVertical: 8,
    },
    paragraph: {
      color: theme.text,
      fontSize: 16,
      lineHeight: 24,
      marginVertical: 8,
    },
    link: {
      color: theme.primary,
    },
    list_item: {
      color: theme.text,
      fontSize: 16,
      lineHeight: 24,
    },
    blockquote: {
      backgroundColor: `${theme.primary}10`,
      borderLeftColor: theme.primary,
      borderLeftWidth: 4,
      padding: 10,
      marginVertical: 8,
    },
    code_inline: {
      backgroundColor: `${theme.primary}10`,
      color: theme.text,
      padding: 4,
      borderRadius: 4,
    },
    code_block: {
      backgroundColor: `${theme.primary}10`,
      padding: 10,
      borderRadius: 8,
      marginVertical: 8,
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradient}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onCancel} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {initialNote ? strings.editNote : strings.addNote}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>{strings.save}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
          <TextInput
            style={[styles.titleInput, { color: theme.text }]}
            placeholder={strings.noteTitle}
            placeholderTextColor={theme.subtext}
            value={title}
            onChangeText={setTitle}
          />
          <View style={[styles.contentContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              style={[
                styles.contentInput,
                { color: theme.text },
                isBold && styles.boldText,
                isItalic && styles.italicText,
                isUnderline && styles.underlineText,
              ]}
              placeholder={strings.noteContent}
              placeholderTextColor={theme.subtext}
              value={content}
              onChangeText={setContent}
              multiline
            />
            <View style={[styles.formatToolbar, { backgroundColor: theme.card }]}>
              <TouchableOpacity
                style={[
                  styles.formatButton,
                  isBold && {
                    backgroundColor: `${theme.primary}15`,
                    borderColor: theme.primary,
                  },
                  { borderColor: theme.border }
                ]}
                onPress={() => formatText('bold')}
              >
                <MaterialIcons
                  name="format-bold"
                  size={18}
                  color={isBold ? theme.primary : theme.subtext}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.formatButton,
                  isItalic && {
                    backgroundColor: `${theme.primary}15`,
                    borderColor: theme.primary,
                  },
                  { borderColor: theme.border }
                ]}
                onPress={() => formatText('italic')}
              >
                <MaterialIcons
                  name="format-italic"
                  size={18}
                  color={isItalic ? theme.primary : theme.subtext}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.formatButton,
                  isUnderline && {
                    backgroundColor: `${theme.primary}15`,
                    borderColor: theme.primary,
                  },
                  { borderColor: theme.border }
                ]}
                onPress={() => formatText('underline')}
              >
                <MaterialIcons
                  name="format-underlined"
                  size={18}
                  color={isUnderline ? theme.primary : theme.subtext}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.categoryPicker}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.selectedCategoryChip
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.selectedCategoryChipText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: theme.primary }]}
              onPress={pickImage}
            >
              <MaterialIcons name="image" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <MaterialIcons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.helpButton, { backgroundColor: theme.primary }]}
        onPress={() => Alert.alert(
          'Markdown Guide',
          '# Heading 1\n## Heading 2\n**Bold**\n*Italic*\n- List item\n> Quote\n`code`\n[Link](url)'
        )}
      >
        <MaterialIcons name="help-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#4c669f',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryPicker: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#4c669f',
  },
  categoryChipText: {
    color: '#666',
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  imageContainer: {
    marginTop: 16,
    borderRadius: 12,
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
  formatToolbar: {
    flexDirection: 'row',
    marginTop: 8,
    padding: 6,
    borderRadius: 8,
    justifyContent: 'flex-end',
    gap: 4,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  formatButton: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  contentInput: {
    padding: 8,
    minHeight: 120,
  },
  helpButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  contentContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
});

export default AddNote; 