// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react-native";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.any(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    agents: i.entity({
      flow: i.string(),
      icon: i.string(),
      name: i.string(),
    }),
    executions: i.entity({
      agentId: i.string().indexed(),
      completedAt: i.number(),
      duration: i.number(),
      error: i.any(),
      input: i.any(),
      metadata: i.any(),
      output: i.any(),
      startedAt: i.number(),
      status: i.string(),
      stepExecutions: i.any(),
    }),
    inventory: i.entity({
      available: i.number(),
      committed: i.number(),
      createdAt: i.number(),
      name: i.string(),
      qty: i.number(),
      sku: i.string(),
      stock: i.number(),
      unavailable: i.number(),
      userId: i.string(),
      vname: i.string(),
    }),
    messages: i.entity({
      createdAt: i.string(),
      text: i.string(),
    }),
    products: i.entity({
      category: i.string(),
      collection: i.string(),
      createdAt: i.number(),
      notes: i.string(),
      options: i.string(),
      pos: i.string(),
      storeid: i.string(),
      tags: i.string(),
      title: i.string(),
      type: i.string(),
      vectorize: i.boolean(),
      vendor: i.string(),
      web: i.boolean(),
    }),
    todos: i.entity({
      createdAt: i.number(),
      done: i.boolean(),
      text: i.string(),
    }),
    tools: i.entity({
      function: i.string(),
      name: i.string(),
    }),
  },
  links: {
    inventory$files: {
      forward: {
        on: "inventory",
        has: "one",
        label: "$files",
      },
      reverse: {
        on: "$files",
        has: "one",
        label: "inventory",
      },
    },
    inventoryProduct: {
      forward: {
        on: "inventory",
        has: "one",
        label: "product",
      },
      reverse: {
        on: "products",
        has: "many",
        label: "inventory",
      },
    },
    products$file1: {
      forward: {
        on: "products",
        has: "many",
        label: "$file1",
      },
      reverse: {
        on: "$file1",
        has: "many",
        label: "products",
      },
    },
    products$files: {
      forward: {
        on: "products",
        has: "many",
        label: "$files",
      },
      reverse: {
        on: "$files",
        has: "many",
        label: "products",
      },
    },
    todos$users: {
      forward: {
        on: "todos",
        has: "many",
        label: "$users",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "todos",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
