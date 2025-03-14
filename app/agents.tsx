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
import { inputStyles } from './styles/agents.styles';

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
  <View style={inputStyles.tabContainer}>
    <TouchableOpacity 
      style={[inputStyles.tab, activeTab === 'workflows' && inputStyles.activeTab]}
      onPress={() => onTabPress('workflows')}
    >
      <Ionicons 
        name="layers-outline" 
        size={20} 
        color={activeTab === 'workflows' ? '#007AFF' : '#666'} 
      />
      <Text style={[inputStyles.tabText, activeTab === 'workflows' && inputStyles.activeTabText]}>Workflows</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={[inputStyles.tab, activeTab === 'settings' && inputStyles.activeTab]}
      onPress={() => onTabPress('settings')}
    >
      <Ionicons 
        name="settings-outline" 
        size={20} 
        color={activeTab === 'settings' ? '#007AFF' : '#666'} 
      />
      <Text style={[inputStyles.tabText, activeTab === 'settings' && inputStyles.activeTabText]}>Settings</Text>
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
    <View style={inputStyles.inputContainer}>
      <TextInput
        style={inputStyles.input}
        placeholder="Type step name or use @ for type..."
        value={inputText}
        onChangeText={handleInputChange}
        onSubmitEditing={handleAddStep}
      />
      {showTypeSelector && (
        <View style={inputStyles.typeSelector}>
          {workflowTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                inputStyles.typeOption,
                selectedType === type.id && inputStyles.selectedTypeOption
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
                inputStyles.typeOptionText,
                selectedType === type.id && inputStyles.selectedTypeOptionText
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
    <ScrollView style={inputStyles.settingsContainer}>
      <View style={inputStyles.settingsSection}>
        <Text style={inputStyles.settingsTitle}>Basic Information</Text>
        <View style={inputStyles.inputGroup}>
          <Text style={inputStyles.inputLabel}>Agent Name</Text>
          <TextInput
            style={inputStyles.settingsInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter agent name"
          />
        </View>
        <View style={inputStyles.inputGroup}>
          <Text style={inputStyles.inputLabel}>Description</Text>
          <TextInput
            style={[inputStyles.settingsInput, inputStyles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter agent description"
            multiline
          />
        </View>
      </View>

      <View style={inputStyles.settingsSection}>
        <Text style={inputStyles.settingsTitle}>Configuration</Text>
        <View style={inputStyles.switchGroup}>
          <Text style={inputStyles.switchLabel}>Public Access</Text>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isPublic ? '#007AFF' : '#f4f3f4'}
          />
        </View>
        <View style={inputStyles.inputGroup}>
          <Text style={inputStyles.inputLabel}>API Key</Text>
          <TextInput
            style={inputStyles.settingsInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter API key"
            secureTextEntry
          />
        </View>
        <View style={inputStyles.inputGroup}>
          <Text style={inputStyles.inputLabel}>Webhook URL</Text>
          <TextInput
            style={inputStyles.settingsInput}
            value={webhookUrl}
            onChangeText={setWebhookUrl}
            placeholder="Enter webhook URL"
          />
        </View>
      </View>

      <View style={inputStyles.settingsSection}>
        <TouchableOpacity 
          style={inputStyles.publishButton}
          onPress={onPublish}
        >
          <Text style={inputStyles.publishButtonText}>Publish Agent</Text>
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
    <View style={inputStyles.bottomNav}>
      <View style={inputStyles.inputBar}>
        <TextInput
          style={inputStyles.textInput}
          placeholder="Type agent name..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity 
          style={[inputStyles.addButton, !inputText.trim() && inputStyles.addButtonDisabled]}
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
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

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
    setSelectedStepId(null);
  };

  const renderAgentItem = ({ item }: { item: Agent }) => (
    <TouchableOpacity 
      style={inputStyles.listItem}
      onPress={() => setSelectedAgent(item)}
    >
      <View style={inputStyles.listItemContent}>
        <Text style={inputStyles.listItemTitle}>{item.name}</Text>
        <View style={inputStyles.listItemInfo}>
          <Text style={inputStyles.listItemSubtext}>{item.description}</Text>
          <Text style={inputStyles.listItemStatus}>Not Published</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStepItem = ({ item, index }: { item: WorkflowStep, index: number }) => (
    <TouchableOpacity 
      style={inputStyles.listItem}
      onPress={() => handleEditStep(item)}
      onLongPress={() => setSelectedStepId(selectedStepId === item.id ? null : item.id)}
      delayLongPress={300}
    >
      <View style={inputStyles.listItemContent}>
        <Text style={inputStyles.listItemTitle}>{item.name}</Text>
        <View style={inputStyles.listItemInfo}>
          <View style={inputStyles.stepTypeBadge}>
            <Ionicons 
              name={workflowTypes.find(t => t.id === item.type)?.icon || 'help-outline'} 
              size={14} 
              color="#666" 
            />
            <Text style={inputStyles.stepTypeText}>{item.type}</Text>
          </View>
          {selectedStepId === item.id && (
            <TouchableOpacity 
              style={[inputStyles.removeButton, { backgroundColor: '#ffeeee', borderRadius: 20 }]}
              onPress={() => handleRemoveStep(item.id)}
            >
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={inputStyles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={inputStyles.header}>
        {selectedAgent ? (
          <>
            <TouchableOpacity 
              style={inputStyles.backButton}
              onPress={() => setSelectedAgent(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={inputStyles.headerTitle}>{selectedAgent.name}</Text>
          </>
        ) : (
          <Text style={inputStyles.headerTitle}>AI Agents</Text>
        )}
      </View>

      {selectedAgent ? (
        <>
          {/* Tab Navigation */}
          <TabNavigation activeTab={activeTab} onTabPress={setActiveTab} />

          {loading ? (
            <View style={inputStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={inputStyles.loadingText}>Loading...</Text>
            </View>
          ) : showInputEditor ? (
            <>
              <View style={inputStyles.inputEditorHeader}>
                <TouchableOpacity 
                  style={inputStyles.backButton}
                  onPress={() => setShowInputEditor(false)}
                >
                  <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={inputStyles.inputEditorTitle}>Edit Fields</Text>
                <TouchableOpacity 
                  style={inputStyles.saveButton}
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
                contentContainerStyle={inputStyles.list}
                ItemSeparatorComponent={() => <View style={inputStyles.separator} />}
                ListEmptyComponent={() => (
                  <View style={inputStyles.emptyContainer}>
                    <Text style={inputStyles.emptyText}>No steps added yet</Text>
                    <Text style={inputStyles.emptySubtext}>Add your first step below</Text>
                  </View>
                )}
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
            contentContainerStyle={inputStyles.list}
            ListEmptyComponent={() => (
              <View style={inputStyles.emptyContainer}>
                <Text style={inputStyles.emptyText}>No agents created yet</Text>
                <Text style={inputStyles.emptySubtext}>Create your first agent below</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={inputStyles.separator} />}
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
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
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
    marginBottom: 8,
  },
  listItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemSubtext: {
    fontSize: 14,
    color: '#666',
  },
  listItemStatus: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
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
  bottomNav: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
  },
  inputBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    fontSize: 16,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#e0e0e0',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  inputEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButton: {
    padding: 5,
  },
  inputEditorTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    padding: 5,
  },
  settingsContainer: {
    padding: 15,
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  settingsInput: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  textArea: {
    height: 100,
    paddingVertical: 10,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  publishButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
}); 