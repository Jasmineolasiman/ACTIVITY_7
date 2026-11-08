
import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  // Load saved tasks when the app starts
  useEffect(() => {
    loadTasks();
  }, []);

  // Animate the app after loading
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  // Read tasks from local storage
  const loadTasks = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedData !== null) {
        const parsedData = JSON.parse(savedData);

        if (Array.isArray(parsedData)) {
          setTasks(parsedData);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to load your saved tasks.');
    } finally {
      setLoading(false);
    }
  };

  // Save updated tasks to local storage
  const saveTasks = async (updatedTasks) => {
    try {
      setSaving(true);

      const jsonData = JSON.stringify(updatedTasks);
      await AsyncStorage.setItem(STORAGE_KEY, jsonData);

      setTasks(updatedTasks);
      return true;
    } catch (error) {
      Alert.alert('Error', 'Unable to save your tasks.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Clear the input fields
  const clearForm = () => {
    setTitle('');
    setDescription('');
    setEditingId(null);
  };

  // Create or update a task
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
          ? {
              ...task,
              title: title.trim(),
              description: description.trim(),
            }
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
      clearForm();
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
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (saving) return;

            const updatedTasks = tasks.filter(
              (task) => task.id !== taskId
            );

            const success = await saveTasks(updatedTasks);

            if (success && editingId === taskId) {
              clearForm();
            }
          },
        },
      ]
    );
  };

  // Mark a task as completed or pending
  const handleToggle = async (taskId) => {
    if (saving) return;

    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    );

    await saveTasks(updatedTasks);
  };

  // Calculate task progress
  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingCount = tasks.length - completedCount;

  // Display each task
  const renderTask = ({ item }) => (
    <Animated.View
      style={[
        styles.taskCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.checkButton}
        onPress={() => handleToggle(item.id)}
        disabled={saving}
      >
        <Ionicons
          name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={27}
          color={item.completed ? '#7952C7' : '#B7A8D5'}
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

        {!!item.description && (
          <Text style={styles.taskDescription}>
            {item.description}
          </Text>
        )}

        <Text style={styles.taskDate}>
          Added: {item.createdAt}
        </Text>

        <View style={styles.taskActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit(item)}
            disabled={saving}
          >
            <Ionicons name="create-outline" size={16} color="#7952C7" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            disabled={saving}
          >
            <Ionicons name="trash-outline" size={16} color="#D65B85" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F0FF" />

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7952C7" />
              <Text style={styles.loadingText}>Loading your tasks...</Text>
            </View>
          ) : (
            <>
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                {/* App header */}
                <View style={styles.header}>
                  <View>
                    <Text style={styles.appName}>StudyFlow</Text>
                    <Text style={styles.headerSubtitle}>
                      Organize your tasks, achieve your goals.
                    </Text>
                  </View>

                  <View style={styles.headerIcon}>
                    <Ionicons
                      name="school-outline"
                      size={28}
                      color="#7952C7"
                    />
                  </View>
                </View>

                {/* Task progress summary */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>
                    My Study Progress
                  </Text>

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

                {/* Add or edit task form */}
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>
                    {editingId ? 'Edit Your Task' : 'Create New Task'}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Enter task title"
                    placeholderTextColor="#A99BC5"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={60}
                  />

                  <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    placeholder="Write a short description (optional)"
                    placeholderTextColor="#A99BC5"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    maxLength={150}
                  />

                  <View style={styles.formButtons}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons
                            name={editingId ? 'save-outline' : 'add-circle-outline'}
                            size={19}
                            color="#FFFFFF"
                          />
                          <Text style={styles.saveButtonText}>
                            {editingId ? 'Update Task' : 'Add Task'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {editingId && (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={clearForm}
                        disabled={saving}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Task list heading */}
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>My Tasks</Text>
                  <Text style={styles.listCount}>
                    {tasks.length} tasks
                  </Text>
                </View>
              </Animated.View>

              {/* Saved task list */}
              <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={renderTask}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="clipboard-outline"
                      size={55}
                      color="#B9A8DE"
                    />
                    <Text style={styles.emptyTitle}>No Tasks Yet</Text>
                    <Text style={styles.emptyText}>
                      Add your first study task and start organizing your day.
                    </Text>
                  </View>
                }
              />

              {/* Saving status */}
              {saving && (
                <View style={styles.savingStatus}>
                  <ActivityIndicator size="small" color="#7952C7" />
                  <Text style={styles.savingText}>
                    Saving your changes...
                  </Text>
                </View>
              )}
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Purple theme and app layout styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F0FF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 18,
  },
  appName: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#6542A5',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8879A8',
    marginTop: 4,
  },
  headerIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: '#E7DEFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#7952C7',
    borderRadius: 18,
    padding: 18,
    marginBottom: 17,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#E8DFFC',
    marginTop: 3,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#60458F',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#60458F',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8F5FF',
    borderWidth: 1,
    borderColor: '#E5DCF7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: '#44365F',
    marginBottom: 10,
  },
  descriptionInput: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 9,
  },
  saveButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 10,
    backgroundColor: '#7952C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingHorizontal: 17,
    minHeight: 43,
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#EEE8FA',
  },
  cancelText: {
    color: '#6542A5',
    fontSize: 13,
    fontWeight: 'bold',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#60458F',
  },
  listCount: {
    fontSize: 12,
    color: '#8879A8',
  },
  listContent: {
    paddingBottom: 25,
    flexGrow: 1,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    marginBottom: 11,
    elevation: 2,
    shadowColor: '#60458F',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  checkButton: {
    paddingTop: 2,
    paddingRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#44365F',
  },
  completedText: {
    color: '#A99EBB',
    textDecorationLine: 'line-through',
  },
  taskDescription: {
    fontSize: 12,
    color: '#8879A8',
    marginTop: 5,
  },
  taskDate: {
    fontSize: 10,
    color: '#A99BC5',
    marginTop: 7,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    color: '#7952C7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteText: {
    color: '#D65B85',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#6542A5',
    marginTop: 14,
  },
  emptyText: {
    fontSize: 12,
    color: '#8879A8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#7952C7',
    fontSize: 12,
    marginTop: 10,
  },
  savingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 7,
  },
  savingText: {
    fontSize: 11,
    color: '#7952C7',
  },
});
