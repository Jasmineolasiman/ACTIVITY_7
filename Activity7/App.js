
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

  // Create a new task
  const addTask = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a task title.');
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      completed: false,
      createdAt: new Date().toLocaleDateString(),
    };

    const success = await saveTasks([newTask, ...tasks]);

    if (success) {
      setTitle('');
      setDescription('');
    }
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
          <Text style={styles.heading}>Add New Task</Text>

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

          <TouchableOpacity style={styles.button} onPress={addTask}>
            <Ionicons name="add-circle-outline" size={19} color="#FFFFFF" />
            <Text style={styles.buttonText}>Add Task</Text>
          </TouchableOpacity>
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
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskDescription}>{item.description}</Text>
                <Text style={styles.taskDate}>Added: {item.createdAt}</Text>
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
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold' },
  taskCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  taskTitle: { color: '#344B45', fontSize: 15, fontWeight: 'bold' },
  taskDescription: { color: '#7C918C', fontSize: 12, marginTop: 5 },
  taskDate: { color: '#A1AAA7', fontSize: 10, marginTop: 7 },
  emptyText: { textAlign: 'center', color: '#91A19B', marginTop: 25 },
});
