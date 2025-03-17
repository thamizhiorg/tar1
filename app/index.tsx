import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, FlatList, ActivityIndicator } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { initDatabase, getPages, Page } from './database';
import { router } from 'expo-router';

export default function Index() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

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
        {/* Input Bar (Modern AI chat input design) */}
        <View style={styles.inputBar}>
          {/* Left side button (slash command) */}
          <TouchableOpacity style={styles.slashButton}>
            <Text style={styles.slashText}>/</Text>
          </TouchableOpacity>
          
          {/* Input field */}
          <TextInput 
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
          />
          
          {/* Right side button (circle) */}
          <TouchableOpacity style={styles.circleButton}>
            {/* Empty circle button */}
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
          
          <TouchableOpacity style={styles.minimalSquareButton} onPress={() => {
            router.push('/tools');
          }}>
            <Text style={styles.buttonText}>T</Text>
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
  slashButton: {
    padding: 8,
  },
  slashText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#555',
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
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  minimalButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  minimalSquareButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    width: 36,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 15,
    padding: 5,
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
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  emojiText: {
    fontSize: 18,
  },
});
