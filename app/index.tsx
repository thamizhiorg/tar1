import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, FlatList, ActivityIndicator } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { initDatabase, getPages, Page } from './database';
import { router } from 'expo-router';

export default function Index() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputText, setInputText] = useState('');

  // Sample slash commands
  const slashCommands = [
    { id: '1', command: '/text', description: 'Add text content to the page' },
    { id: '2', command: '/image', description: 'Upload or add image from gallery' },
    { id: '3', command: '/code', description: 'Add code snippet with syntax highlighting' },
    { id: '4', command: '/table', description: 'Insert a new data table' },
    { id: '5', command: '/ai', description: 'Ask AI to generate content' },
  ];

  const handleCommandSelect = (command: string) => {
    // Here you would implement the logic for each command
    console.log(`Selected command: ${command}`);
    setInputText(command + ' ');
    setShowSuggestions(false);
    // Additional command handling logic would go here
  };

  const handleSlashButtonPress = () => {
    setInputText('/');
    setShowSuggestions(true);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text === '/') {
      setShowSuggestions(true);
    } else if (text.startsWith('/')) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Render each slash command suggestion
  const renderSuggestionItem = ({ item }: { item: { id: string, command: string, description: string } }) => (
    <TouchableOpacity 
      style={styles.suggestionItem} 
      onPress={() => handleCommandSelect(item.command)}
    >
      <Text style={styles.commandText}>{item.command}</Text>
      <Text style={styles.descriptionText}>{item.description}</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    // Initialize the database and load pages
    const loadData = async () => {
      try {
        await initDatabase();
        const pagesData = await getPages();
        setPages(pagesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Render each page item - simplified to focus on title and agent
  const renderPageItem = ({ item }: { item: Page }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.title}</Text>
        <View style={styles.pageInfo}>
          <Text style={styles.agentText}>Agent: {item.agent}</Text>
          <Text style={styles.statusText}>Status: {item.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Pages</Text>
          <TouchableOpacity onPress={() => {}}>
            {/* <Ionicons name="chevron-down" size={24} color="#000" /> */}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.headerAddButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {/* Display Area with Pages List */}
      <View style={styles.display}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading pages...</Text>
          </View>
        ) : (
          <FlatList
            data={pages}
            renderItem={renderPageItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No pages found</Text>
                <Text style={styles.emptySubtext}>Tap + to add a new page</Text>
              </View>
            }
          />
        )}
      </View>
      
      {/* Bottom Navigation/Input Area */}
      <View style={styles.bottomNav}>
        {/* Slash Command Suggestions */}
        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={slashCommands}
              renderItem={renderSuggestionItem}
              keyExtractor={(item) => item.id}
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
        
        {/* Input Bar (Modern AI chat input design) */}
        <View style={styles.inputBar}>
          {/* Left side buttons - Slash button */}
          <TouchableOpacity style={styles.slashButton} onPress={handleSlashButtonPress}>
            <Text style={styles.slashButtonText}>/</Text>
          </TouchableOpacity>
          
          {/* Input field */}
          <TextInput 
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={handleInputChange}
          />
          
          {/* Vertical divider */}
          <View style={styles.verticalDivider} />
          
          {/* Right side buttons */}
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.buttonText}>AI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton}>
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>
        </View>
        
        {/* Agent Bar */}
        <View style={styles.agentBar}>
          <TouchableOpacity style={styles.minimalButton}>
            <Text style={styles.buttonText}>ai agent</Text>
          </TouchableOpacity>
          
          <View style={styles.rightButtons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="play-outline" size={24} color="black" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="at-circle-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Shell Bar */}
        <View style={styles.shellBar}>
          <TouchableOpacity style={styles.minimalButton}>
            <Text style={styles.buttonText}>row</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.minimalSquareButton} onPress={() => {
            router.push('/aiagents');
          }}>
            <Text style={styles.buttonText}>I</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.minimalSquareButton} onPress={() => {
            router.push('/instant');
          }}>
            <Text style={styles.buttonText}>Q</Text>
          </TouchableOpacity>         
          <View style={styles.shellBarSpacer} />
          
          <TouchableOpacity 
            style={styles.emojiButton}
            onPress={() => {
              router.push('/agents');
            }}
          >
            <Text style={styles.emojiText}>👾</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    borderBottomColor: '#f0f2f5',
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
  display: {
    flex: 1,
    backgroundColor: '#fff',
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
  list: {
    paddingHorizontal: 15,
  },
  listItem: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
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
  pageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentText: {
    fontSize: 14,
    color: '#666',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f2f5',
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
    borderTopColor: '#f0f2f5',
    paddingBottom: 20,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 10,
    paddingVertical: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  iconButton: {
    padding: 10,
  },
  textInput: {
    flex: 1,
    height: 50,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f2f5',
    marginHorizontal: 5,
  },
  sendButton: {
    padding: 10,
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  agentBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  minimalButton: {
    borderWidth: 1,
    borderColor: '#f0f2f5',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  minimalSquareButton: {
    borderWidth: 1,
    borderColor: '#f0f2f5',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    width: 36,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shellBar: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 15,
    alignItems: 'center',
  },
  shellBarSpacer: {
    flex: 1,
  },
  emojiButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#f0f2f5',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  emojiText: {
    fontSize: 18,
  },
  suggestionsContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f2f5',
    borderRadius: 8,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 250,
  },
  suggestionsList: {
    padding: 10,
    width: '100%',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    width: '100%',
  },
  commandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginLeft: 10,
  },
  activeSlash: {
    color: '#007AFF',
  },
  slashButton: {
    marginLeft: 2,
    borderRadius: 6,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  slashButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
