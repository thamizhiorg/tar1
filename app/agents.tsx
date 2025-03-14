import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  TextInput,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { 
  Workflow, 
  WorkflowStep, 
  workflowTypes,
  initAgentDatabase,
  getWorkflows,
  getWorkflowById,
  addWorkflow,
  addStepToWorkflow
} from './agentDatabase';

// Define agent types for the list
interface Agent {
  id: string;
  name: string;
  description: string;
  count: number;
  growth: string;
  isPositive: boolean;
}

export default function AgentsScreen() {
  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', name: 'Organic', description: 'Natural traffic', count: 1235.24, growth: '+1.12%', isPositive: true },
    { id: '2', name: 'Referral', description: 'Traffic from links', count: 932.12, growth: '-15%', isPositive: false },
    { id: '3', name: 'CPO', description: 'Cost per order', count: 125.11, growth: '-0.01%', isPositive: false },
  ]);
  
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepName, setNewStepName] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [selectedStepType, setSelectedStepType] = useState('');

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await initAgentDatabase();
        // Just initialize the database, we'll create steps directly
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle selecting an agent
  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    // Reset steps when selecting a new agent
    setSteps([]);
  };

  // Handle adding a new step
  const handleAddStep = () => {
    if (!newStepName.trim()) return;
    
    const typeInfo = workflowTypes.find(t => t.id === selectedStepType);
    if (!typeInfo) return;
    
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type: selectedStepType,
      name: newStepName,
      description: newStepDescription || typeInfo.description,
      config: {}
    };
    
    setSteps([...steps, newStep]);
    setNewStepName('');
    setNewStepDescription('');
    setSelectedStepType('');
    setIsAddingStep(false);
  };

  // Handle removing a step
  const handleRemoveStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  // Render an agent item in the list
  const renderAgentItem = ({ item }: { item: Agent }) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => handleSelectAgent(item)}
    >
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        <Text style={styles.listItemCount}>{item.count.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={[
          styles.listItemGrowth, 
          item.isPositive ? styles.positiveGrowth : styles.negativeGrowth
        ]}>
          {item.growth}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render a step item
  const renderStepItem = ({ item, index }: { item: WorkflowStep, index: number }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemContent}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepNumber}>{index + 1}</Text>
          <Text style={styles.listItemTitle}>{item.name}</Text>
        </View>
        <Text style={styles.listItemDescription}>{item.description}</Text>
        <View style={styles.stepActions}>
          <Text style={styles.stepType}>{item.type}</Text>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => handleRemoveStep(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render the step type selection
  const renderStepTypeItem = ({ item }: { item: typeof workflowTypes[0] }) => (
    <TouchableOpacity 
      style={[
        styles.stepTypeItem,
        selectedStepType === item.id && styles.selectedStepType
      ]}
      onPress={() => setSelectedStepType(item.id)}
    >
      <Text style={[
        styles.stepTypeName,
        selectedStepType === item.id && styles.selectedStepTypeName
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Render the add step form
  const renderAddStepForm = () => (
    <View style={styles.addStepForm}>
      <Text style={styles.formTitle}>Add New Step</Text>
      
      <Text style={styles.inputLabel}>Step Type</Text>
      <FlatList
        data={workflowTypes}
        renderItem={renderStepTypeItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepTypesList}
      />
      
      <Text style={styles.inputLabel}>Step Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter step name"
        value={newStepName}
        onChangeText={setNewStepName}
      />
      
      <Text style={styles.inputLabel}>Description (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter step description"
        value={newStepDescription}
        onChangeText={setNewStepDescription}
        multiline
      />
      
      <View style={styles.formButtons}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => setIsAddingStep(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.addButton,
            (!newStepName.trim() || !selectedStepType) && styles.disabledButton
          ]}
          onPress={handleAddStep}
          disabled={!newStepName.trim() || !selectedStepType}
        >
          <Text style={styles.addButtonText}>Add Step</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render the agent list screen
  const renderAgentListScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>AI Agents</Text>
          <TouchableOpacity onPress={() => {}}>
            {/* <Ionicons name="chevron-down" size={24} color="#000" /> */}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.headerAddButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {/* Agent List */}
      <FlatList
        data={agents}
        renderItem={renderAgentItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );

  // Render the workflow builder screen
  const renderWorkflowBuilderScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backToAgentsButton}
          onPress={() => setSelectedAgent(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedAgent?.name} Agent</Text>
        <TouchableOpacity style={styles.headerAddButton} onPress={() => setIsAddingStep(true)}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : isAddingStep ? (
        renderAddStepForm()
      ) : (
        <>
          {steps.length > 0 ? (
            <FlatList
              data={steps}
              renderItem={renderStepItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No steps added yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add steps to this agent</Text>
            </View>
          )}
          
          {/* Floating Add Button (only shown when not adding a step) */}
          {!isAddingStep && (
            <TouchableOpacity 
              style={styles.floatingAddButton}
              onPress={() => setIsAddingStep(true)}
            >
              <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );

  // Main render
  return selectedAgent ? renderWorkflowBuilderScreen() : renderAgentListScreen();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 5,
  },
  headerAddButton: {
    padding: 5,
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToAgentsButton: {
    padding: 5,
  },
  list: {
    paddingHorizontal: 15,
  },
  listItem: {
    paddingVertical: 20,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  listItemCount: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  listItemGrowth: {
    fontSize: 16,
    alignSelf: 'flex-end',
  },
  listItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  positiveGrowth: {
    color: '#4CAF50',
  },
  negativeGrowth: {
    color: '#F44336',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addStepForm: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  stepTypesList: {
    paddingBottom: 15,
  },
  stepTypeItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedStepType: {
    backgroundColor: '#007AFF',
  },
  stepTypeName: {
    fontSize: 14,
    color: '#333',
  },
  selectedStepTypeName: {
    color: '#fff',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
  },
  addButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 10,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  stepType: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  removeButton: {
    padding: 5,
  },
}); 