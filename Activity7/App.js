
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');

  // Add a task to the list
  const addTask = () => {
    if (!title.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
    };

    setTasks([newTask, ...tasks]);
    setTitle('');
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

          <TouchableOpacity style={styles.button} onPress={addTask}>
            <Text style={styles.buttonText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>My Tasks</Text>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <Text style={styles.taskTitle}>{item.title}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tasks added yet.</Text>
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8F6',
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#287D78',
  },
  subtitle: {
    fontSize: 12,
    color: '#7C918C',
    marginTop: 4,
  },
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
  },
  button: {
    backgroundColor: '#287D78',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  taskTitle: {
    color: '#344B45',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#91A19B',
    marginTop: 25,
  },
});
