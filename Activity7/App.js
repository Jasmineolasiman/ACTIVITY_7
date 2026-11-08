
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

  // Save task list to local storage
  const saveTasks = async (updatedTasks) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      return true;
    } catch (error) {
      Alert.alert('Error', 'Unable to save tasks.');
      return false;
    }
  };

  // Create or update a task
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a task title.');
      return;
    }

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

    const success = await saveTasks(updatedTasks);

    if (success) {
      setTitle('');
      setDescription('');
      setEditingId(null);
    }
  };

  // Load task details for editing
  const handleEdit = (task) => {
    setTitle(task.title);
    setDescription(task.description);
    setEditingId(task.id);
  };

  // Delete a selected task
  const handleDelete = (taskId) => {
    Alert.alert('Delete Task', 'Do you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedTasks = tasks.filter((task) => task.id !== taskId);
          const success = await saveTasks(updatedTasks);

          if (success && editingId === taskId) {
            setTitle('');
            setDescription('');
            setEditingId(null);
          }
        },
      },
    ]);
  };

  // Mark a task as completed or pending
  const toggleTask = async (taskId) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    );

    await saveTasks(updatedTasks);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F1F8F6" />

        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>StudyFlow</Text>
            <Text style={styles.subtitle}>Plan your day, one task at a time.</Text>
          </View>
          <Ionicons name="school-outline" size={35} color="#287D78" />
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>
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

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>
              {editingId ? 'Update Task' : 'Add Task'}
            </Text>
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setTitle('');
                setDescription('');
                setEditingId(null);
              }}
            >
              <Text style={styles.cancelText}>Cancel Editing</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.heading}>My Tasks</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#287D78" />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.taskCard}>
                <TouchableOpacity onPress={() => toggleTask(item.id)}>
                  <Ionicons
                    name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={25}
                    color={item.completed ? '#287D78' : '#A6AAA9'}
                  />
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <Text
                    style={[
                      styles.taskTitle,
                      item.completed && styles.completedText,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.taskDescription}>{item.description}</Text>

                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEdit(item)}>
                      <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No saved tasks yet.</Text>
            }
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8F6', padding: 18 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#287D78' },
  subtitle: { fontSize: 12, color: '#7C918C', marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 15,
    marginBottom: 20,
  },
  heading: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#315D55',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F5F9F7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    color: '#344B45',
  },
  descriptionInput: { minHeight: 65, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#287D78',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold' },
  cancelButton: { padding: 10, alignItems: 'center' },
  cancelText: { color: '#7C918C', fontWeight: 'bold' },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  taskContent: { flex: 1 },
  taskTitle: { color: '#344B45', fontSize: 15, fontWeight: 'bold' },
  completedText: { textDecorationLine: 'line-through', color: '#9AA8A2' },
  taskDescription: { color: '#7C918C', fontSize: 12, marginTop: 5 },
  actions: { flexDirection: 'row', gap: 18, marginTop: 12 },
  editText: { color: '#287D78', fontWeight: 'bold', fontSize: 12 },
  deleteText: { color: '#D65B5B', fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#91A19B', marginTop: 25 },
});
