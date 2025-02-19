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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  calendarEventId?: string;
}

const TaskScreen = ({ theme }: { theme: any }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<Calendar.Calendar | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [taskToAdd, setTaskToAdd] = useState<Task | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  useEffect(() => {
    loadTasks();
    if (Platform.OS === 'android') {
      requestAndroidCalendarPermission();
    }
  }, []);

  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem('tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      Alert.alert('Error', 'Failed to save tasks');
    }
  };

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false,
        priority: 'medium',
      };
      const updatedTasks = [newTask, ...tasks];
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      setNewTaskTitle('');
    }
  };

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const deleteTask = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedTasks = tasks.filter(task => task.id !== id);
            setTasks(updatedTasks);
            saveTasks(updatedTasks);
          },
        },
      ]
    );
  };

  const requestAndroidCalendarPermission = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        setCalendars(calendars);
      }
    } catch (error) {
      console.log('Calendar permission error:', error);
    }
  };

  const addToCalendar = (task: Task) => {
    setTaskToAdd(task);
    setShowCalendarModal(true);
  };

  const handleCalendarSelect = async (calendar: Calendar.Calendar) => {
    setSelectedCalendar(calendar);
    setShowCalendarModal(false);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setShowTimePicker(true);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
      saveEventToCalendar();
    }
  };

  const saveEventToCalendar = async () => {
    if (taskToAdd && selectedCalendar) {
      try {
        const startDate = new Date(selectedDate);
        startDate.setHours(selectedTime.getHours());
        startDate.setMinutes(selectedTime.getMinutes());

        const endDate = new Date(startDate.getTime() + 3600000); // 1 hour later

        const eventDetails = {
          title: taskToAdd.title,
          startDate,
          endDate,
          timeZone: 'UTC',
          allDay: false,
          location: '',
          notes: 'Task from Notes App',
          alarms: [{
            relativeOffset: -30,
            method: Calendar.AlarmMethod.ALERT,
          }],
        };

        const eventId = await Calendar.createEventAsync(selectedCalendar.id, eventDetails);
        
        const updatedTasks = tasks.map(t =>
          t.id === taskToAdd.id ? { ...t, calendarEventId: eventId } : t
        );
        setTasks(updatedTasks);
        saveTasks(updatedTasks);

        Alert.alert('Success', 'Task added to selected calendar');
      } catch (error) {
        Alert.alert('Error', 'Failed to add task to calendar. Please check if the calendar is available.');
        console.log('Calendar error:', error);
      }
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={[styles.taskItem, { backgroundColor: theme.card }]}>
      <TouchableOpacity
        style={styles.taskCheckbox}
        onPress={() => toggleTask(item.id)}
      >
        <MaterialIcons
          name={item.completed ? 'check-circle' : 'radio-button-unchecked'}
          size={24}
          color={item.completed ? theme.primary : theme.subtext}
        />
      </TouchableOpacity>
      
      <Text
        style={[
          styles.taskTitle,
          { color: theme.text },
          item.completed && styles.completedTask
        ]}
      >
        {item.title}
      </Text>

      <View style={styles.taskActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => addToCalendar(item)}
        >
          <MaterialIcons 
            name="event" 
            size={20} 
            color={item.calendarEventId ? theme.primary : theme.subtext} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            deleteTask(item.id);
          }}
        >
          <Feather name="trash-2" size={16} color={theme.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={theme.gradient} style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
      </LinearGradient>

      <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Add a new task..."
          placeholderTextColor={theme.subtext}
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          onSubmitEditing={addTask}
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={addTask}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        style={styles.taskList}
      />

      <Modal
        visible={showCalendarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCalendarModal(false)}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Calendar</Text>
            {calendars.map(calendar => (
              <TouchableOpacity
                key={calendar.id}
                style={styles.calendarItem}
                onPress={() => handleCalendarSelect(calendar)}
              >
                <Text style={[styles.calendarItemText, { color: theme.text }]}>
                  {calendar.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    margin: 16,
    marginTop: -25,
    padding: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  taskList: {
    padding: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    padding: 4,
  },
  calendarButton: {
    padding: 4,
    marginRight: 8,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    padding: 24,
    borderRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  calendarItemText: {
    fontSize: 16,
  },
});

export default TaskScreen;