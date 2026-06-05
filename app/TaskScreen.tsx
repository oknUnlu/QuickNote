import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '../translations/translations';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  subtasks?: SubTask[];
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  low:    { color: '#10B981', label: 'Düşük',  labelEn: 'Low'    },
  medium: { color: '#F59E0B', label: 'Orta',   labelEn: 'Medium' },
  high:   { color: '#EF4444', label: 'Yüksek', labelEn: 'High'   },
};

const DEFAULT_TASK_CATEGORIES = ['Kişisel', 'İş', 'Alışveriş', 'Sağlık', 'Eğitim'];

// ─── Component ────────────────────────────────────────────────────────────────

const TaskScreen = ({ theme, language = 'tr' }: { theme: any; language?: Language }) => {
  const strings = translations[language];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [taskCategories, setTaskCategories] = useState<string[]>(DEFAULT_TASK_CATEGORIES);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  useEffect(() => { loadTasks(); }, []);

  // ─── Storage ─────────────────────────────────────────────────────────────────

  const loadTasks = async () => {
    try {
      const saved = await AsyncStorage.getItem('tasks_v2');
      if (saved) setTasks(JSON.parse(saved));
      else {
        // Migrate old tasks if they exist
        const old = await AsyncStorage.getItem('tasks');
        if (old) {
          const migrated: Task[] = JSON.parse(old).map((t: any) => ({
            ...t,
            subtasks: t.subtasks || [],
            category: t.category || '',
            createdAt: t.createdAt || new Date().toISOString(),
          }));
          setTasks(migrated);
          await AsyncStorage.setItem('tasks_v2', JSON.stringify(migrated));
        }
      }
    } catch (_) {}
  };

  const saveTasks = async (updated: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks_v2', JSON.stringify(updated));
    } catch (_) {}
  };

  // ─── Task CRUD ────────────────────────────────────────────────────────────────

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      priority: newTaskPriority,
      category: newTaskCategory,
      subtasks: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [task, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    setNewTaskTitle('');
    setNewTaskCategory('');
    setNewTaskPriority('medium');
    setShowAddModal(false);
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    Alert.alert(strings.deleteTask, strings.deleteTaskConfirm, [
      { text: strings.cancel, style: 'cancel' },
      {
        text: strings.delete,
        style: 'destructive',
        onPress: () => {
          const updated = tasks.filter(t => t.id !== id);
          setTasks(updated);
          saveTasks(updated);
          if (expandedTask === id) setExpandedTask(null);
        },
      },
    ]);
  };

  // ─── Subtask CRUD ─────────────────────────────────────────────────────────────

  const addSubtask = (taskId: string) => {
    const text = (newSubtaskInputs[taskId] || '').trim();
    if (!text) return;
    const updated = tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: [...(t.subtasks || []), { id: Date.now().toString(), title: text, completed: false }],
      };
    });
    setTasks(updated);
    saveTasks(updated);
    setNewSubtaskInputs(prev => ({ ...prev, [taskId]: '' }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: (t.subtasks || []).map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s),
      };
    });
    setTasks(updated);
    saveTasks(updated);
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: (t.subtasks || []).filter(s => s.id !== subtaskId) };
    });
    setTasks(updated);
    saveTasks(updated);
  };

  const addCategory = () => {
    const cat = newCategoryInput.trim();
    if (cat && !taskCategories.includes(cat)) {
      setTaskCategories(prev => [...prev, cat]);
      setNewCategoryInput('');
      setShowCatModal(false);
    }
  };

  // ─── Computed ─────────────────────────────────────────────────────────────────

  const filteredTasks = filterCategory
    ? tasks.filter(t => t.category === filterCategory)
    : tasks;

  const activeTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  // ─── Render Task ──────────────────────────────────────────────────────────────

  const renderTask = (task: Task) => {
    const isExpanded = expandedTask === task.id;
    const subtasks = task.subtasks || [];
    const completedSubCount = subtasks.filter(s => s.completed).length;
    const priorityConf = PRIORITY_CONFIG[task.priority];
    const subInput = newSubtaskInputs[task.id] || '';

    return (
      <View key={task.id} style={[styles.taskCard, { backgroundColor: theme.card }]}>
        {/* Priority bar */}
        <View style={[styles.priorityBar, { backgroundColor: priorityConf.color }]} />

        <View style={styles.taskRow}>
          {/* Checkbox */}
          <TouchableOpacity onPress={() => toggleTask(task.id)} style={{ marginRight: 12 }}>
            <MaterialIcons
              name={task.completed ? 'check-circle' : 'radio-button-unchecked'}
              size={24}
              color={task.completed ? theme.primary : theme.subtext}
            />
          </TouchableOpacity>

          {/* Title & Meta */}
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setExpandedTask(isExpanded ? null : task.id)}>
            <Text style={[styles.taskTitle, { color: theme.text }, task.completed && styles.completedText]} numberOfLines={2}>
              {task.title}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <View style={[styles.badge, { backgroundColor: `${priorityConf.color}20` }]}>
                <Text style={{ color: priorityConf.color, fontSize: 10, fontWeight: '600' }}>
                  {language === 'tr' ? priorityConf.label : priorityConf.labelEn}
                </Text>
              </View>
              {task.category ? (
                <View style={[styles.badge, { backgroundColor: `${theme.primary}20` }]}>
                  <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '600' }}>{task.category}</Text>
                </View>
              ) : null}
              {subtasks.length > 0 && (
                <View style={[styles.badge, { backgroundColor: `${theme.subtext}15` }]}>
                  <Text style={{ color: theme.subtext, fontSize: 10 }}>{completedSubCount}/{subtasks.length} alt görev</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TouchableOpacity onPress={() => setExpandedTask(isExpanded ? null : task.id)}>
              <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={22} color={theme.subtext} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(task.id)}>
              <Feather name="trash-2" size={16} color={theme.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subtasks expanded */}
        {isExpanded && (
          <View style={[styles.subtasksContainer, { borderTopColor: theme.border }]}>
            <Text style={[styles.subtasksLabel, { color: theme.subtext }]}>{strings.subtasks}</Text>
            {subtasks.map(sub => (
              <View key={sub.id} style={styles.subtaskRow}>
                <TouchableOpacity onPress={() => toggleSubtask(task.id, sub.id)} style={{ marginRight: 8 }}>
                  <MaterialIcons
                    name={sub.completed ? 'check-box' : 'check-box-outline-blank'}
                    size={18}
                    color={sub.completed ? theme.primary : theme.subtext}
                  />
                </TouchableOpacity>
                <Text style={[styles.subtaskText, { color: theme.text }, sub.completed && styles.completedText]} numberOfLines={2}>
                  {sub.title}
                </Text>
                <TouchableOpacity onPress={() => deleteSubtask(task.id, sub.id)} style={{ marginLeft: 'auto' }}>
                  <Feather name="x" size={14} color={theme.subtext} />
                </TouchableOpacity>
              </View>
            ))}
            {/* Add subtask */}
            <View style={[styles.subtaskInputRow, { borderColor: theme.border }]}>
              <TextInput
                style={[styles.subtaskInput, { color: theme.text }]}
                placeholder={strings.addSubtask}
                placeholderTextColor={theme.subtext}
                value={subInput}
                onChangeText={t => setNewSubtaskInputs(prev => ({ ...prev, [task.id]: t }))}
                onSubmitEditing={() => addSubtask(task.id)}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => addSubtask(task.id)}
                style={[styles.subtaskAddBtn, { backgroundColor: theme.primary }]}
              >
                <MaterialIcons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ─── Add Task Modal ───────────────────────────────────────────────────────────

  const renderAddModal = () => (
    <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
      <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
        <Pressable style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{strings.addTask.replace('...', '')}</Text>

          <TextInput
            style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder={strings.addTask}
            placeholderTextColor={theme.subtext}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            autoFocus
            onSubmitEditing={addTask}
          />

          {/* Priority */}
          <Text style={[styles.modalSectionLabel, { color: theme.subtext }]}>{strings.priority}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {(['low', 'medium', 'high'] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.priorityBtn, { borderColor: PRIORITY_CONFIG[p].color, backgroundColor: newTaskPriority === p ? PRIORITY_CONFIG[p].color : 'transparent' }]}
                onPress={() => setNewTaskPriority(p)}
              >
                <Text style={{ color: newTaskPriority === p ? '#fff' : PRIORITY_CONFIG[p].color, fontSize: 12, fontWeight: '600' }}>
                  {language === 'tr' ? PRIORITY_CONFIG[p].label : PRIORITY_CONFIG[p].labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category */}
          <Text style={[styles.modalSectionLabel, { color: theme.subtext }]}>{strings.taskCategory}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.catChip, { borderColor: theme.border, backgroundColor: newTaskCategory === '' ? theme.primary : 'transparent' }]}
                onPress={() => setNewTaskCategory('')}
              >
                <Text style={{ color: newTaskCategory === '' ? '#fff' : theme.subtext, fontSize: 12 }}>
                  {language === 'tr' ? 'Yok' : 'None'}
                </Text>
              </TouchableOpacity>
              {taskCategories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, { borderColor: theme.primary, backgroundColor: newTaskCategory === cat ? theme.primary : 'transparent' }]}
                  onPress={() => setNewTaskCategory(cat)}
                >
                  <Text style={{ color: newTaskCategory === cat ? '#fff' : theme.primary, fontSize: 12 }}>{cat}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.catChip, { borderColor: theme.primary, borderStyle: 'dashed' }]}
                onPress={() => setShowCatModal(true)}
              >
                <Feather name="plus" size={12} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={addTask}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{strings.save}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // ─── Category Modal ───────────────────────────────────────────────────────────

  const renderCatModal = () => (
    <Modal visible={showCatModal} transparent animationType="fade" onRequestClose={() => setShowCatModal(false)}>
      <Pressable style={styles.modalOverlay} onPress={() => setShowCatModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{strings.addCategory}</Text>
          <TextInput
            style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder={strings.categoryName}
            placeholderTextColor={theme.subtext}
            value={newCategoryInput}
            onChangeText={setNewCategoryInput}
            onSubmitEditing={addCategory}
          />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={addCategory}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{strings.addCategory}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient colors={theme.gradient} style={styles.header}>
        <Text style={styles.headerTitle}>{strings.tasks}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>
          {activeTasks.length} {language === 'tr' ? 'aktif görev' : 'active tasks'}
        </Text>
      </LinearGradient>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catFilter} contentContainerStyle={{ gap: 8 }}>
        <TouchableOpacity
          style={[styles.catChip, { backgroundColor: !filterCategory ? theme.primary : theme.card, borderColor: theme.primary }]}
          onPress={() => setFilterCategory(null)}
        >
          <Text style={{ color: !filterCategory ? '#fff' : theme.primary, fontSize: 12, fontWeight: '500' }}>
            {language === 'tr' ? 'Tümü' : 'All'}
          </Text>
        </TouchableOpacity>
        {taskCategories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, { backgroundColor: filterCategory === cat ? theme.primary : theme.card, borderColor: theme.primary }]}
            onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
          >
            <Text style={{ color: filterCategory === cat ? '#fff' : theme.primary, fontSize: 12, fontWeight: '500' }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialIcons name="check-circle-outline" size={72} color={`${theme.border}`} />
          <Text style={{ color: theme.subtext, marginTop: 16, fontSize: 15 }}>{strings.noTasks}</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Active tasks */}
          {activeTasks.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { color: theme.subtext }]}>
                {language === 'tr' ? 'Aktif' : 'Active'} ({activeTasks.length})
              </Text>
              {activeTasks.map(renderTask)}
            </>
          )}
          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { color: theme.subtext, marginTop: 12 }]}>
                {language === 'tr' ? 'Tamamlananlar' : 'Completed'} ({completedTasks.length})
              </Text>
              {completedTasks.map(renderTask)}
            </>
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { shadowColor: theme.primary }]} onPress={() => setShowAddModal(true)}>
        <LinearGradient colors={theme.gradient} style={styles.fabGradient}>
          <MaterialIcons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {renderAddModal()}
      {renderCatModal()}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: '#fff' },
  catFilter: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 0 },
  list: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  taskCard: {
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  priorityBar: { height: 3, width: '100%' },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  taskTitle: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  completedText: { textDecorationLine: 'line-through', opacity: 0.5 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  subtasksContainer: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1 },
  subtasksLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 10, marginBottom: 8 },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  subtaskText: { flex: 1, fontSize: 14 },
  subtaskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  subtaskInput: { flex: 1, padding: 9, fontSize: 14 },
  subtaskAddBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', bottom: 78, right: 20, width: 58, height: 58, borderRadius: 29, elevation: 6, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 5 },
  fabGradient: { flex: 1, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    elevation: 10,
  },
  modalContainer: { margin: 32, padding: 24, borderRadius: 20, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalSectionLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  modalInput: { padding: 12, borderWidth: 1, borderRadius: 12, fontSize: 15, marginBottom: 14 },
  priorityBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  addBtn: { padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 4 },
});

export default TaskScreen;
