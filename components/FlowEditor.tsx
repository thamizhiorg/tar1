import React, { useState } from "react";
import { 
  View, Text, StyleSheet, TextInput, 
  TouchableOpacity, SafeAreaView, StatusBar 
} from "react-native";

// Agent type needs to be imported or defined similarly to the main file
type Agent = {
  id: string;
  name: string;
  flow: string;
};

interface FlowEditorProps {
  agent: Agent;
  onClose: () => void;
  onSave: (agent: Agent, newFlow: string) => void;
}

function FlowEditor({ agent, onClose, onSave }: FlowEditorProps) {
  const [newFlow, setNewFlow] = useState(agent.flow);
  
  const handleSave = () => {
    onSave(agent, newFlow);
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
    marginHorizontal: 40,
  },
  saveButtonHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4a86e8',
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
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

export default FlowEditor;