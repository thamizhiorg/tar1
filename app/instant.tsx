import { init, id, i, InstaQLEntity } from "@instantdb/react-native";
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from "react-native";

const APP_ID = "84f087af-f6a5-4a5f-acbc-bc4008e3a725";

const schema = i.schema({
  entities: {
    inventory: i.entity({
      name: i.string(),
      qty: i.number(),
      id: i.string(),
      createdAt: i.number(),
      userId: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
  },
});

type InventoryItem = InstaQLEntity<typeof schema, "inventory">;

const db = init({ appId: APP_ID, schema });

function App() {
  const { isLoading, error, data } = db.useQuery({ inventory: {} });
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
  const inventory = data?.inventory || [];
  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        <InventoryForm />
        <InventoryTable inventory={inventory} />
      </View>
    </View>
  );
}

function addInventoryItem(name: string, qty: number, userId: string) {
  const itemId = id();
  db.transact(
    db.tx.inventory[itemId].update({
      name,
      qty,
      id: itemId,
      userId,
      createdAt: Date.now(),
    })
  );
}

function deleteInventoryItem(item: InventoryItem) {
  db.transact(db.tx.inventory[item.id].delete());
}

function updateqty(item: InventoryItem, newqty: number) {
  db.transact(db.tx.inventory[item.id].update({ qty: newqty }));
}

function InventoryForm() {
  const { user } = db.useAuth();
  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Item Name"
        onSubmitEditing={(e) => {
          const name = e.nativeEvent.text;
          if (name && user) {
            addInventoryItem(name, 0, user.id);
            e.nativeEvent.text = "";
          }
        }}
      />
    </View>
  );
}

function InventoryTable({ inventory }: { inventory: InventoryItem[] }) {
  const { data } = db.useQuery({
    $users: {
      $: {
        where: {
          id: { $in: inventory.map(item => item.userId) }
        }
      }
    }
  });
  const users = data?.$users || [];
  
  return (
    <ScrollView style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, { flex: 1 }]}>Name</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Email</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Qty</Text>
      </View>
      {inventory.map((item) => {
        const user = users.find(u => u.id === item.userId);
        return (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.cell, { flex: 1 }]}>{item.name}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{user?.email || 'N/A'}</Text>
            <View style={[styles.cell, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
              <TouchableOpacity onPress={() => updateqty(item, Math.max(0, item.qty - 1))}>
                <Text style={styles.qtyButton}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.qty}</Text>
              <TouchableOpacity onPress={() => updateqty(item, item.qty + 1)}>
                <Text style={styles.qtyButton}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  input: {
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  table: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerCell: {
    fontSize: 14,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    padding: 16,
    alignItems: "center",
  },
  cell: {
    paddingHorizontal: 4,
  },
  qty: {
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: "center",
    fontSize: 16,
  },
  qtyButton: {
    fontSize: 18,
    color: "#666",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});

export default App;