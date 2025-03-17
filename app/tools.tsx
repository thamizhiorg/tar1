// filepath: c:\Users\tarfr\OneDrive\Desktop\tarapp\tar\app\tools.tsx
import React, { useState } from "react";
import { init, id, i, InstaQLEntity } from "@instantdb/react-native";
import { 
  View, Text, StyleSheet, TextInput, ScrollView, 
  TouchableOpacity, SafeAreaView, StatusBar 
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import FlowEditor from "../components/FlowEditor";;

const APP_ID = "84f087af-f6a5-4a5f-acbc-bc4008e3a725";

const schema = i.schema({
  entities: {
    tools: i.entity({
      function: i.string(),
      name: i.string(),
    }),
  },
});

type Tool = InstaQLEntity<typeof schema, "tools">;

const db = init({ appId: APP_ID, schema });

function App() {
  const { isLoading, error, data } = db.useQuery({ tools: {} });
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
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
  const tools = data?.tools || [];
  
  // If showing tool details, render that instead of the main screen
  if (showDetails && editingTool) {
    return <ToolDetails 
      tool={editingTool} 
      onClose={() => {
        setShowDetails(false);
        setEditingTool(null);
      }}
      onSave={updateToolFunction}
    />;
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        <ToolForm />
        <ToolList 
          tools={tools} 
          onViewDetails={(tool) => {
            setEditingTool(tool);
            setShowDetails(true);
          }}
        />
      </View>
    </View>
  );
}

function addTool(name: string) {
  const toolId = id();
  db.transact(
    db.tx.tools[toolId].update({
      name,
      function: "",  // Default empty function
      id: toolId,
    })
  );
}

function deleteTool(tool: Tool) {
  db.transact(db.tx.tools[tool.id].delete());
}

function updateToolFunction(tool: Tool, newFunction: string) {
  db.transact(db.tx.tools[tool.id].update({ function: newFunction }));
}

function ToolForm() {
  const [name, setName] = useState('');
  
  const handleSubmit = () => {
    if (name) {
      addTool(name);
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
          placeholder="Tool Name"
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

function ToolList({ tools, onViewDetails }: { tools: Tool[], onViewDetails: (tool: Tool) => void }) {
  return (
    <ScrollView style={styles.list}>
      {tools.map((tool) => {
        return (
          <TouchableOpacity 
            key={tool.id} 
            style={styles.listItem}
            onPress={() => onViewDetails(tool)}
          >
            <Text style={styles.toolName}>{tool.name}</Text>
            {tool.function ? (
              <Text style={styles.toolDescription} numberOfLines={1}>
                {tool.function}
              </Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function ToolDetails({ tool, onClose, onSave }: { 
  tool: Tool, 
  onClose: () => void, 
  onSave: (tool: Tool, functionText: string) => void 
}) {
  const [functionText, setFunctionText] = useState(tool.function || '');
  
  const handleSave = () => {
    onSave(tool, functionText);
    onClose();
  };
  
  return (
    <View style={styles.fullScreen}>
      <View style={styles.modalHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Tool Details</Text>
        <TouchableOpacity style={styles.saveButtonHeader} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.modalContent}>
        <Text style={styles.toolTitle}>{tool.name}</Text>
        <Text style={styles.functionLabel}>Function</Text>
        <TextInput
          style={styles.functionInput}
          placeholder="Enter tool function"
          value={functionText}
          onChangeText={setFunctionText}
          multiline={true}
        />
      </View>
    </View>
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
    minHeight: 80,
    justifyContent: "center",
  },
  toolName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
    color: "#666",
  },
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
  toolTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  functionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  functionInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
  }
});

export default App;