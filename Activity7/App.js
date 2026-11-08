
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = '@studyflow_tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  // Load saved tasks
  const loadTasks = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData !== null) {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData)) setTasks(parsedData);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to load saved tasks.');
    } finally {
      setLoading(false);
    }
  };

  // Save updated task list
  const saveTasks = async (updatedTasks) => {
    try {
      setSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      return true;
    } catch (error) {
      Alert.alert('Error', 'Unable to save tasks.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Add or update a task
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a task title.');
      return;
    }

    if (saving) return;

    let updatedTasks;

    if (editingId) {
      updatedTasks = tasks.map((task) =>
        task.id === editingId
          ? { ...task, title: title.trim(), description: description.trim() }
          : task
      );
    } else {
      const newTask = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        completed: false,
        createdAt: new Date().toLocaleDateString(),
      };
      updatedTasks = [newTask, ...tasks];
    }

    if (await saveTasks(updatedTasks)) {
      clearForm();
    }
  };

  // Clear the form
  const clearForm = () => {
    setTitle('');
    setDescription('');
    setEditingId(null);
  };

  // Edit an existing task
  const handleEdit = (task) => {
    setTitle(task.title);
    setDescription(task.description);
    setEditingId(task.id);
  };

  // Delete a task
  const handleDelete = (taskId) => {
    Alert.alert('Delete Task', 'Do you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (saving) return;
          const updatedTasks = tasks.filter((task) => task.id !== taskId);
          if (await saveTasks(updatedTasks) && editingId === taskId) {
            clearForm();
          }
        },
      },
    ]);
  };

  // Change task completion status
  const toggleTask = async (taskId) => {
    if (saving) return;

    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    );

    await saveTasks(updatedTasks);
  };

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  // Display a task card
  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <TouchableOpacity
        style={styles.checkButton}
        onPress={() => toggleTask(item.id)}
        disabled={saving}
      >
        <Ionicons
          name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={item.completed ? '#287D78' : '#A6AAA9'}
        />
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, item.completed && styles.completedText]}>
          {item.title}
        </Text>

        {!!item.description && (
          <Text style={styles.taskDescription}>{item.description}</Text>
        )}

        <Text style={styles.taskDate}>Added: {item.createdAt}</Text>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleEdit(item)} disabled={saving}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleDelete(item.id)} disabled={saving}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F1F8F6" />

        <View style={styles.container}>
          {/* App header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.appName}>StudyFlow</Text>
              <Text style={styles.subtitle}>Plan your day, one task at a time.</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="school-outline" size={27} color="#287D78" />
            </View>
          </View>

          {/* Task progress summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>My Study Progress</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{tasks.length}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{pendingCount}</Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{completedCount}</Text>
                <Text style={styles.summaryLabel}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Task input form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingId ? 'Edit Your Task' : 'Add New Task'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter task title"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Add a short description"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingId ? 'Update Task' : 'Add Task'}
                </Text>
              )}
            </TouchableOpacity>

            {editingId && (
              <TouchableOpacity style={styles.cancelButton} onPress={clearForm}>
                <Text style={styles.cancelText}>Cancel Editing</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Task list */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>My Tasks</Text>
            <Text style={styles.listCount}>{tasks.length} tasks</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#287D78" />
          ) : (
            <FlatList
              data={tasks}
              keyExtractor={(item) => item.id}
              renderItem={renderTask}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="clipboard-outline" size={50} color="#A4C8C1" />
                  <Text style={styles.emptyTitle}>No Tasks Yet</Text>
                  <Text style={styles.emptyText}>
                    Add your first study task to get started.
                  </Text>
                </View>
              }
            />
          )}

          {saving && (
            <View style={styles.savingStatus}>
              <ActivityIndicator size="small" color="#287D78" />
              <Text style={styles.savingText}>Saving changes...</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Application styles
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F8F6' },
  container: { flex: 1, paddingHorizontal: 18 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 18,
  },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#287D78' },
  subtitle: { fontSize: 12, color: '#7C918C', marginTop: 4 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#DCEFEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#287D78',
    borderRadius: 18,
    padding: 17,
    marginBottom: 15,
  },
  summaryTitle: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryNumber: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  summaryLabel: { fontSize: 11, color: '#DCEFEA', marginTop: 3 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 16 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#315D55', marginBottom: 10 },
  input: {
    backgroundColor: '#F5F9F7',
    borderWidth: 1,
    borderColor: '#E0ECE7',
    borderRadius: 10,
    padding: 11,
    marginBottom: 9,
    color: '#344B45',
  },
  descriptionInput: { minHeight: 55, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#287D78',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  cancelButton: { padding: 8, alignItems: 'center' },
  cancelText: { color: '#7C918C', fontWeight: 'bold' },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#315D55' },
  listCount: { fontSize: 12, color: '#7C918C' },
  listContent: { paddingBottom: 20, flexGrow: 1 },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
  },
  checkButton: { paddingRight: 10, paddingTop: 2 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: 'bold', color: '#344B45' },
  completedText: { textDecorationLine: 'line-through', color: '#9AA8A2' },
  taskDescription: { fontSize: 12, color: '#7C918C', marginTop: 5 },
  taskDate: { fontSize: 10, color: '#A1AAA7', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 18, marginTop: 11 },
  editText: { color: '#287D78', fontWeight: 'bold', fontSize: 12 },
  deleteText: { color: '#D65B5B', fontWeight: 'bold', fontSize: 12 },
  emptyContainer: { alignItems: 'center', padding: 25, marginTop: 10 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#52766D', marginTop: 10 },
  emptyText: { fontSize: 12, color: '#91A19B', textAlign: 'center', marginTop: 5 },
  savingStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 7,
  },
  savingText: { fontSize: 11, color: '#287D78' },
});
