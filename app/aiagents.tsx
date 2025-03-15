import React, { useState } from "react";
import { init, id, i, InstaQLEntity } from "@instantdb/react-native";
import { 
  View, Text, StyleSheet, TextInput, ScrollView, 
  TouchableOpacity, SafeAreaView, StatusBar 
} from "react-native";
import { Ionicons } from '@expo/vector-icons';

const APP_ID = "84f087af-f6a5-4a5f-acbc-bc4008e3a725";

const schema = i.schema({
  entities: {
    agents: i.entity({
      flow: i.string(),
      name: i.string(),
    }),
  },
});

type Agent = InstaQLEntity<typeof schema, "agents">;

const db = init({ appId: APP_ID, schema });

function App() {
  const { isLoading, error, data } = db.useQuery({ agents: {} });
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showFlowEditor, setShowFlowEditor] = useState(false);
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }
  const agents = data?.agents || [];
  
  // If showing flow editor, render that instead of the main screen
  if (showFlowEditor && editingAgent) {
    return <FlowEditor agent={editingAgent} onClose={() => {
      setShowFlowEditor(false);
      setEditingAgent(null);
    }} />;
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        <AgentForm />
        <AgentList 
          agents={agents} 
          onEditFlow={(agent) => {
            setEditingAgent(agent);
            setShowFlowEditor(true);
          }}
        />
      </View>
    </View>
  );
}

function addAgent(name: string) {
  const agentId = id();
  db.transact(
    db.tx.agents[agentId].update({
      name,
      flow: "",  // Default empty flow
      id: agentId,
    })
  );
}

function deleteAgent(agent: Agent) {
  db.transact(db.tx.agents[agent.id].delete());
}

function updateAgentFlow(agent: Agent, newFlow: string) {
  db.transact(db.tx.agents[agent.id].update({ flow: newFlow }));
}

function AgentForm() {
  const [name, setName] = useState('');
  
  const handleSubmit = () => {
    if (name) {
      addAgent(name);
      setName('');
      
      // Blur the input field after submission to remove focus
      if (TextInput.State) {
        TextInput.State.blurTextInput(TextInput.State.currentlyFocusedInput());
      }
    }
  };
  
  return (
    <View style={styles.form}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Agent Name"
          value={name}
          onChangeText={setName}
        />
        <TouchableOpacity style={styles.createButton} onPress={handleSubmit}>
          <Ionicons name="add" size={24} color="#4a86e8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AgentList({ agents, onEditFlow }: { agents: Agent[], onEditFlow: (agent: Agent) => void }) {
  return (
    <ScrollView style={styles.list}>
      {agents.map((agent) => {
        return (
          <TouchableOpacity 
            key={agent.id} 
            style={styles.listItem}
            onPress={() => onEditFlow(agent)}
          >
            <Text style={styles.agentName}>{agent.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// Replace modal with a full component
function FlowEditor({ 
  agent, 
  onClose 
}: { 
  agent: Agent, 
  onClose: () => void 
}) {
  const [newFlow, setNewFlow] = useState(agent.flow);
  
  const handleSave = () => {
    updateAgentFlow(agent, newFlow);
    onClose();
  };
  
  return (
    <SafeAreaView style={styles.fullScreen}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.modalHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onClose}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{agent.name}</Text>
        <TouchableOpacity 
          style={styles.saveButtonHeader} 
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.modalContent}>
        <Text style={styles.flowLabel}>Flow</Text>
        <TextInput
          style={styles.flowInput}
          placeholder="Define the agent flow here..."
          value={newFlow}
          onChangeText={setNewFlow}
          multiline={true}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  form: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    margin: 16,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    padding: 14,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
  createButton: {
    padding: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#e0e0e0",
  },
  list: {
    flex: 1,
  },
  listItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    height: 80,
    justifyContent: "center",
  },
  agentName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  flowInput: {
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#4a86e8',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  cancelButtonText: {
    color: '#666',
  },
  // Full screen modal styles
  fullScreen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginHorizontal: 40, // Leave space for the buttons on both sides
  },
  saveButtonHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4a86e8',
    borderRadius: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  flowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  flowInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});

export default App;