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
  StatusBar,
  Modal,
  ScrollView,
  PanResponder,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Switch
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { 
  Workflow, 
  WorkflowStep, 
  initAgentDatabase,
  getWorkflows,
  getWorkflowById,
  addWorkflow,
  addStepToWorkflow
} from './agentDatabase';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Define field types for the input step
const fieldTypes = [
  { id: 'string', name: 'Text', icon: 'text-outline' as const },
  { id: 'number', name: 'Number', icon: 'calculator-outline' as const },
  { id: 'boolean', name: 'Yes/No', icon: 'checkbox-outline' as const },
  { id: 'date', name: 'Date', icon: 'calendar-outline' as const },
  { id: 'media', name: 'Media', icon: 'image-outline' as const },
  { id: 'list', name: 'List', icon: 'list-outline' as const },
  { id: 'url', name: 'URL', icon: 'link-outline' as const },
  { id: 'email', name: 'Email', icon: 'mail-outline' as const },
  { id: 'phone', name: 'Phone', icon: 'call-outline' as const },
];

// Define workflow types
const workflowTypes = [
  { id: 'input', name: 'Inputs', description: 'Input data for processing', icon: 'text-outline' as const },     
  { id: 'output', name: 'Outputs', description: 'Output data after processing', icon: 'download-outline' as const },
  { id: 'prompt', name: 'Prompts', description: 'Prompts for user interaction', icon: 'chatbubble-outline' as const },
  { id: 'action', name: 'Actions', description: 'Actions to perform', icon: 'play-outline' as const },
  { id: 'condition', name: 'Conditions', description: 'Conditional logic', icon: 'git-branch-outline' as const },
];

// Define agent types for the list
interface Agent {
  id: string;
  name: string;
  description: string;
  config: any;
}

// Define input field interface
interface InputField {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

// Input Fields Editor Component
const InputFieldsEditor = ({ 
  fields, 
  setFields, 
  onSave 
}: { 
  fields: InputField[], 
  setFields: React.Dispatch<React.SetStateAction<InputField[]>>,
  onSave: () => void
}) => {
  const [showFieldTypeModal, setShowFieldTypeModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [selectedFieldType, setSelectedFieldType] = useState(fieldTypes[0].id);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [inputText, setInputText] = useState('');
  const [typingAt, setTypingAt] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const handleInputChange = (text: string) => {
    setInputText(text);
    
    // Check if the text contains '@' to trigger type selection
    if (text.includes('@') && !typingAt) {
      setTypingAt(true);
      setShowTypeSelector(true);
    } else if (!text.includes('@') && typingAt) {
      setTypingAt(false);
      setShowTypeSelector(false);
    }
    
    // If we have text before the '@', use it as the field name
    if (text.includes('@')) {
      const fieldName = text.split('@')[0].trim();
      setNewFieldName(fieldName);
    } else {
      setNewFieldName(text);
    }
  };

  const selectFieldType = (typeId: string) => {
    setSelectedFieldType(typeId);
    setShowTypeSelector(false);
    setTypingAt(false);
    
    // Get the selected type name
    const typeName = fieldTypes.find(t => t.id === typeId)?.name || '';
    
    // If there's a field name already, keep it and add the type with @
    if (newFieldName) {
      setInputText(`${newFieldName} @${typeName}`);
    } else {
      // If no field name yet, just show the type with @
      setInputText(`@${typeName}`);
    }
  };

  const addField = () => {
    if (!newFieldName.trim()) return;
    
    const newField: InputField = {
      id: `field-${Date.now()}`,
      name: newFieldName,
      type: selectedFieldType,
      required: false
    };
    
    setFields([...fields, newField]);
    setNewFieldName('');
    setInputText('');
    setSelectedFieldType(fieldTypes[0].id);
  };

  const removeField = (fieldId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFields(fields.filter(field => field.id !== fieldId));
    setSelectedRowId(null);
  };

  const moveFieldUp = (index: number) => {
    if (index <= 0) return;
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[index - 1];
    newFields[index - 1] = temp;
    setFields(newFields);
  };

  const moveFieldDown = (index: number) => {
    if (index >= fields.length - 1) return;
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[index + 1];
    newFields[index + 1] = temp;
    setFields(newFields);
  };

  const toggleRequired = (fieldId: string) => {
    setFields(fields.map(field => 
      field.id === fieldId 
        ? { ...field, required: !field.required } 
        : field
    ));
  };

  const updateFieldType = (fieldId: string, newType: string) => {
    setFields(fields.map(field => 
      field.id === fieldId 
        ? { ...field, type: newType } 
        : field
    ));
    setShowFieldTypeModal(false);
    setEditingFieldId(null);
  };

  const handleRowPress = (fieldId: string) => {
    setSelectedRowId(fieldId === selectedRowId ? null : fieldId);
  };

  return (
    <View style={inputStyles.container}>
      {/* Table Header */}
      <View style={inputStyles.tableHeader}>
        <Text style={[inputStyles.tableHeaderCell, { flex: 0.1 }]}>#</Text>
        <Text style={[inputStyles.tableHeaderCell, { flex: 0.5 }]}>Field</Text>
        <Text style={[inputStyles.tableHeaderCell, { flex: 0.4 }]}>Type</Text>
        
        {showAllColumns && (
          <Text style={[inputStyles.tableHeaderCell, { flex: 0.2 }]}>Required</Text>
        )}
        
        <TouchableOpacity 
          style={inputStyles.columnToggle}
          onPress={() => setShowAllColumns(!showAllColumns)}
        >
          <Ionicons 
            name={showAllColumns ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Field Table */}
      <ScrollView 
        style={inputStyles.tableContainer}
        showsVerticalScrollIndicator={true}
        indicatorStyle="black"
      >
        {fields.map((field, index) => (
          <View 
            key={field.id} 
            style={[
              inputStyles.tableRow,
              selectedRowId === field.id && inputStyles.selectedRow
            ]}
          >
            <TouchableOpacity 
              style={[
                inputStyles.tableRowContent, 
                { flex: 1 }
              ]}
              onLongPress={() => handleRowPress(field.id)}
              activeOpacity={0.7}
            >
              <Text style={[inputStyles.tableCell, { flex: 0.1, textAlign: 'left' }]}>{index + 1}</Text>
              <Text style={[inputStyles.tableCell, { flex: 0.5, textAlign: 'left' }]} numberOfLines={1} ellipsizeMode="tail">{field.name}</Text>
              
              <View 
                style={[inputStyles.tableCell, inputStyles.typeCell, { flex: 0.4 }]}
              >
                <Ionicons 
                  name={fieldTypes.find(t => t.id === field.type)?.icon || 'help-outline'} 
                  size={16} 
                  color="#666" 
                />
                <Text style={inputStyles.typeCellText} numberOfLines={1} ellipsizeMode="tail">
                  {fieldTypes.find(t => t.id === field.type)?.name || 'Unknown'}
                </Text>
              </View>
              
              {showAllColumns && (
                <TouchableOpacity 
                  style={[inputStyles.tableCell, { flex: 0.2, justifyContent: 'center' }]}
                  onPress={() => toggleRequired(field.id)}
                >
                  <View style={inputStyles.requiredCell}>
                    <Ionicons 
                      name={field.required ? 'checkbox' : 'square-outline'} 
                      size={18} 
                      color={field.required ? '#007AFF' : '#666'} 
                    />
                  </View>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            
            {selectedRowId === field.id && (
              <View style={inputStyles.rowActions}>
                <TouchableOpacity 
                  style={inputStyles.actionButton}
                  onPress={() => moveFieldUp(index)}
                  disabled={index === 0}
                >
                  <Ionicons 
                    name="chevron-up" 
                    size={18} 
                    color={index === 0 ? "#ccc" : "#666"} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={inputStyles.actionButton}
                  onPress={() => moveFieldDown(index)}
                  disabled={index === fields.length - 1}
                >
                  <Ionicons 
                    name="chevron-down" 
                    size={18} 
                    color={index === fields.length - 1 ? "#ccc" : "#666"} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={inputStyles.deleteButton}
                  onPress={() => removeField(field.id)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      {/* Add New Field Row - Chat-like Interface */}
      <View style={inputStyles.chatInputContainer}>
        <TextInput
          style={inputStyles.chatInput}
          placeholder="Type field name or use @ for field type..."
          value={inputText}
          onChangeText={handleInputChange}
          onSubmitEditing={addField}
        />
        
        <TouchableOpacity 
          style={[
            inputStyles.addButton,
            !newFieldName.trim() && inputStyles.disabledButton
          ]}
          onPress={addField}
          disabled={!newFieldName.trim()}
        >
          <Text style={inputStyles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      
      {/* Type Selector Popup - Vertical List */}
      {showTypeSelector && (
        <View style={inputStyles.typeSelectorPopup}>
          {fieldTypes.slice(0, 5).map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                inputStyles.typeOptionVertical,
                selectedFieldType === type.id && inputStyles.selectedTypeOption
              ]}
              onPress={() => selectFieldType(type.id)}
            >
              <Ionicons 
                name={type.icon} 
                size={18} 
                color={selectedFieldType === type.id ? "#fff" : "#666"} 
              />
              <Text style={[
                inputStyles.typeOptionText,
                selectedFieldType === type.id && inputStyles.selectedTypeOptionText
              ]}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Tab Navigation Component
const TabNavigation = ({ activeTab, onTabPress }: { activeTab: string, onTabPress: (tab: string) => void }) => (
  <View style={styles.tabContainer}>
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'workflows' && styles.activeTab]}
      onPress={() => onTabPress('workflows')}
    >
      <Ionicons 
        name="layers-outline" 
        size={20} 
        color={activeTab === 'workflows' ? '#007AFF' : '#666'} 
      />
      <Text style={[styles.tabText, activeTab === 'workflows' && styles.activeTabText]}>Workflows</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
      onPress={() => onTabPress('settings')}
    >
      <Ionicons 
        name="settings-outline" 
        size={20} 
        color={activeTab === 'settings' ? '#007AFF' : '#666'} 
      />
      <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Settings</Text>
    </TouchableOpacity>
  </View>
);

// Step Input Component
const StepInput = ({ onAddStep }: { onAddStep: (step: WorkflowStep) => void }) => {
  const [inputText, setInputText] = useState('');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState(workflowTypes[0].id);

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text.includes('@')) {
      setShowTypeSelector(true);
    } else {
      setShowTypeSelector(false);
    }
  };

  const handleAddStep = () => {
    if (!inputText.trim()) return;
    
    const typeInfo = workflowTypes.find(t => t.id === selectedType);
    if (!typeInfo) return;

    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type: selectedType,
      name: inputText.replace('@', '').trim(),
      description: typeInfo.description,
      config: {}
    };

    onAddStep(newStep);
    setInputText('');
    setShowTypeSelector(false);
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Type step name or use @ for type..."
        value={inputText}
        onChangeText={handleInputChange}
        onSubmitEditing={handleAddStep}
      />
      {showTypeSelector && (
        <View style={styles.typeSelector}>
          {workflowTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeOption,
                selectedType === type.id && styles.selectedTypeOption
              ]}
              onPress={() => {
                setSelectedType(type.id);
                setInputText(inputText.replace(/@.*$/, `@${type.name}`));
              }}
            >
              <Ionicons 
                name={type.icon} 
                size={16} 
                color={selectedType === type.id ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.typeOptionText,
                selectedType === type.id && styles.selectedTypeOptionText
              ]}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Agent Settings Component
const AgentSettings = ({ 
  agent, 
  onUpdateAgent, 
  onPublish 
}: { 
  agent: Agent, 
  onUpdateAgent: (agent: Agent) => void,
  onPublish: () => void
}) => {
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description);
  const [isPublic, setIsPublic] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleSave = () => {
    onUpdateAgent({
      ...agent,
      name,
      description,
      config: {
        ...agent.config,
        isPublic,
        apiKey,
        webhookUrl
      }
    });
  };

  return (
    <ScrollView style={styles.settingsContainer}>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>Basic Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Agent Name</Text>
          <TextInput
            style={styles.settingsInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter agent name"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.settingsInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter agent description"
            multiline
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>Configuration</Text>
        <View style={styles.switchGroup}>
          <Text style={styles.switchLabel}>Public Access</Text>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isPublic ? '#007AFF' : '#f4f3f4'}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>API Key</Text>
          <TextInput
            style={styles.settingsInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter API key"
            secureTextEntry
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Webhook URL</Text>
          <TextInput
            style={styles.settingsInput}
            value={webhookUrl}
            onChangeText={setWebhookUrl}
            placeholder="Enter webhook URL"
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <TouchableOpacity 
          style={styles.publishButton}
          onPress={onPublish}
        >
          <Text style={styles.publishButtonText}>Publish Agent</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Agent Input Component
const AgentInput = ({ onAddAgent }: { onAddAgent: (agent: Agent) => void }) => {
  const [inputText, setInputText] = useState('');

  const handleAddAgent = () => {
    if (!inputText.trim()) return;
    
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: inputText.trim(),
      description: 'No description',
      config: {}
    };

    onAddAgent(newAgent);
    setInputText('');
  };

  return (
    <View style={styles.agentInputContainer}>
      <View style={styles.inputWithIcon}>
        <TextInput
          style={styles.agentNameInput}
          placeholder="Type agent name..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity 
          style={[styles.addIconButton, !inputText.trim() && styles.disabledButton]}
          onPress={handleAddAgent}
          disabled={!inputText.trim()}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function AgentsScreen() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [showInputEditor, setShowInputEditor] = useState(false);
  const [inputFields, setInputFields] = useState<InputField[]>([]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await initAgentDatabase();
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddAgent = (agent: Agent) => {
    setAgents([...agents, agent]);
    setSelectedAgent(agent);
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    setAgents(agents.map(agent => 
      agent.id === updatedAgent.id ? updatedAgent : agent
    ));
    setSelectedAgent(updatedAgent);
  };

  const handlePublishAgent = () => {
    if (!selectedAgent) return;
    // Implement publish logic here
    console.log('Publishing agent:', selectedAgent);
  };

  const handleAddStep = (step: WorkflowStep) => {
    setSteps([...steps, step]);
  };

  const handleEditStep = (step: WorkflowStep) => {
    setEditingStep(step);
    if (step.type === 'input') {
      setInputFields(step.config.fields || []);
      setShowInputEditor(true);
    }
  };

  const handleSaveStep = (updatedStep: WorkflowStep) => {
    setSteps(steps.map(step => 
      step.id === updatedStep.id ? updatedStep : step
    ));
    setEditingStep(null);
    setShowInputEditor(false);
  };

  const handleRemoveStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  const renderAgentItem = ({ item }: { item: Agent }) => (
    <TouchableOpacity 
      style={styles.agentItem}
      onPress={() => setSelectedAgent(item)}
    >
      <View style={styles.agentContent}>
        <Text style={styles.agentName}>{item.name}</Text>
        <Text style={styles.agentDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderStepItem = ({ item, index }: { item: WorkflowStep, index: number }) => (
    <TouchableOpacity 
      style={styles.stepItem}
      onPress={() => handleEditStep(item)}
    >
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepNumber}>{index + 1}</Text>
          <Text style={styles.stepName}>{item.name}</Text>
        </View>
        <View style={styles.stepFooter}>
          <View style={styles.stepTypeBadge}>
            <Ionicons 
              name={workflowTypes.find(t => t.id === item.type)?.icon || 'help-outline'} 
              size={14} 
              color="#666" 
            />
            <Text style={styles.stepTypeText}>{item.type}</Text>
          </View>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => handleRemoveStep(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        {selectedAgent && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedAgent(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>AI Agents</Text>
      </View>

      {selectedAgent ? (
        <>
          {/* Tab Navigation */}
          <TabNavigation activeTab={activeTab} onTabPress={setActiveTab} />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : showInputEditor ? (
            <>
              <View style={styles.inputEditorHeader}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setShowInputEditor(false)}
                >
                  <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.inputEditorTitle}>Edit Fields</Text>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={() => {
                    if (editingStep) {
                      handleSaveStep({
                        ...editingStep,
                        config: { fields: inputFields }
                      });
                    }
                  }}
                >
                  <Ionicons name="checkmark" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>
              <InputFieldsEditor 
                fields={inputFields} 
                setFields={setInputFields} 
                onSave={() => {
                  if (editingStep) {
                    handleSaveStep({
                      ...editingStep,
                      config: { fields: inputFields }
                    });
                  }
                }} 
              />
            </>
          ) : activeTab === 'workflows' ? (
            <>
              {/* Steps List */}
              <FlatList
                data={steps}
                renderItem={renderStepItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />

              {/* Bottom Input */}
              <StepInput onAddStep={handleAddStep} />
            </>
          ) : (
            <AgentSettings 
              agent={selectedAgent}
              onUpdateAgent={handleUpdateAgent}
              onPublish={handlePublishAgent}
            />
          )}
        </>
      ) : (
        <>
          {/* Agents List */}
          <FlatList
            data={agents}
            renderItem={renderAgentItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={() => (
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>No agents created yet</Text>
                <Text style={styles.emptyListSubtext}>Create your first agent below</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          {/* Bottom Input */}
          <AgentInput onAddAgent={handleAddAgent} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  list: {
    padding: 20,
  },
  stepItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  stepName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stepFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepTypeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  removeButton: {
    padding: 5,
  },
  separator: {
    height: 12,
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
  inputContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedTypeOption: {
    backgroundColor: '#007AFF',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  selectedTypeOptionText: {
    color: '#fff',
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  settingsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  settingsInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  publishButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  agentItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agentContent: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  agentDescription: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  inputEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  inputEditorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    padding: 5,
  },
  agentInputContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentNameInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
  },
  addIconButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyListSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

// Input Fields Editor Styles
const inputStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'left',
  },
  columnToggle: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff',
    minHeight: 38,
  },
  selectedRow: {
    backgroundColor: '#f0f8ff',
  },
  tableRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tableCell: {
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#333',
    paddingVertical: 8,
  },
  typeCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeCellText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#666',
  },
  requiredCell: {
    alignItems: 'center',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 5,
  },
  actionButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  chatInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  typeSelectorPopup: {
    position: 'absolute',
    bottom: 60,
    left: 15,
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  typeOptionVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 2,
    borderRadius: 6,
  },
  selectedTypeOption: {
    backgroundColor: '#007AFF',
  },
  typeOptionText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  selectedTypeOptionText: {
    color: '#fff',
  },
  fieldTypeModal: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fieldTypeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  fieldTypeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  fieldTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  fieldTypeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldTypeItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  fieldTypeItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  fieldTypeItemTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
}); 