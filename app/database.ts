// Mock database for development
// In a real app, we would use SQLite properly

// Define the Page type
export interface Page {
  id: number;
  title: string;
  parentid: number | null;
  agent: string;
  idb: string;
  turso: string;
  status: string;
}

// Sample data
const samplePages: Page[] = [
  { id: 1, title: 'Home Page', parentid: null, agent: 'default', idb: 'enabled', turso: 'disabled', status: 'active' },
  { id: 2, title: 'Projects', parentid: 1, agent: 'assistant', idb: 'enabled', turso: 'enabled', status: 'active' },
  { id: 3, title: 'Notes', parentid: 1, agent: 'default', idb: 'disabled', turso: 'enabled', status: 'draft' },
  { id: 4, title: 'Tasks', parentid: 1, agent: 'coder', idb: 'enabled', turso: 'disabled', status: 'active' },
  { id: 5, title: 'Archive', parentid: null, agent: 'default', idb: 'disabled', turso: 'disabled', status: 'inactive' }
];

// In-memory database
let pages: Page[] = [...samplePages];
let nextId = 6;

// Initialize the database
export const initDatabase = async (): Promise<void> => {
  console.log('Database initialized');
  return Promise.resolve();
};

// Get all pages
export const getPages = async (): Promise<Page[]> => {
  return Promise.resolve([...pages]);
};

// Get a page by ID
export const getPageById = async (id: number): Promise<Page | null> => {
  const page = pages.find(p => p.id === id);
  return Promise.resolve(page || null);
};

// Add a new page
export const addPage = async (page: Omit<Page, 'id'>): Promise<number> => {
  const id = nextId++;
  const newPage = {
    id,
    title: page.title,
    parentid: page.parentid || null,
    agent: page.agent || 'default',
    idb: page.idb || 'disabled',
    turso: page.turso || 'disabled',
    status: page.status || 'active'
  };
  
  pages.push(newPage);
  return Promise.resolve(id);
};

// Update a page
export const updatePage = async (id: number, updates: Partial<Omit<Page, 'id'>>): Promise<boolean> => {
  const index = pages.findIndex(p => p.id === id);
  if (index === -1) return Promise.resolve(false);
  
  pages[index] = { ...pages[index], ...updates };
  return Promise.resolve(true);
};

// Delete a page
export const deletePage = async (id: number): Promise<boolean> => {
  const initialLength = pages.length;
  pages = pages.filter(p => p.id !== id);
  return Promise.resolve(pages.length < initialLength);
}; 