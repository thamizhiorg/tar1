// Agent database for managing workflows and steps

// Define the WorkflowStep type
export interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  description: string;
  config: Record<string, any>;
}

// Define the Workflow type
export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

// Sample workflow types
export const workflowTypes = [
  { id: 'inputs', name: 'Inputs', description: 'Input components for your workflow' },
  { id: 'outputs', name: 'Outputs', description: 'Output components for your workflow' },
  { id: 'prompts', name: 'Prompts', description: 'Prompt templates and configurations' },
  { id: 'data', name: 'Data', description: 'Data sources and management' },
  { id: 'processing', name: 'Processing', description: 'Data processing and transformation' },
  { id: 'models', name: 'Models', description: 'AI models and inference' },
  { id: 'vectorStores', name: 'Vector Stores', description: 'Vector database storage' },
  { id: 'embeddings', name: 'Embeddings', description: 'Text embedding generation' },
  { id: 'agents', name: 'Agents', description: 'Autonomous agent components' },
  { id: 'memories', name: 'Memories', description: 'Memory storage for conversations' },
  { id: 'tools', name: 'Tools', description: 'Utility tools for workflows' },
  { id: 'logic', name: 'Logic', description: 'Logical operations and flow control' },
  { id: 'helpers', name: 'Helpers', description: 'Helper utilities and functions' }
];

// Sample workflows
const sampleWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Research Assistant',
    description: 'Helps with in-depth research on various topics',
    steps: [
      { 
        id: '1-1', 
        type: 'ai-step', 
        name: 'Research Query', 
        description: 'Process the research query',
        config: { model: 'default' }
      },
      { 
        id: '1-2', 
        type: 'web-search', 
        name: 'Web Search', 
        description: 'Search the web for information',
        config: { sources: ['academic', 'news'] }
      },
      { 
        id: '1-3', 
        type: 'formatting', 
        name: 'Format Results', 
        description: 'Format the research results',
        config: { format: 'detailed' }
      }
    ]
  },
  {
    id: '2',
    name: 'Content Generator',
    description: 'Generates various types of content',
    steps: [
      { 
        id: '2-1', 
        type: 'input-field', 
        name: 'Content Brief', 
        description: 'Get content requirements',
        config: { required: true }
      },
      { 
        id: '2-2', 
        type: 'ai-step', 
        name: 'Generate Content', 
        description: 'Create content based on brief',
        config: { creativity: 0.7 }
      }
    ]
  },
  {
    id: '3',
    name: 'Data Analyzer',
    description: 'Analyzes data and provides insights',
    steps: [
      { 
        id: '3-1', 
        type: 'upload-resource', 
        name: 'Upload Data', 
        description: 'Upload data for analysis',
        config: { fileTypes: ['csv', 'json', 'xlsx'] }
      },
      { 
        id: '3-2', 
        type: 'data-executive', 
        name: 'Analyze Data', 
        description: 'Process and analyze the data',
        config: { depth: 'comprehensive' }
      },
      { 
        id: '3-3', 
        type: 'formatting', 
        name: 'Format Insights', 
        description: 'Format the analysis results',
        config: { format: 'visual' }
      }
    ]
  }
];

// In-memory database
let workflows: Workflow[] = [...sampleWorkflows];
let nextId = 4;

// Initialize the database
export const initAgentDatabase = async (): Promise<void> => {
  console.log('Agent database initialized');
  return Promise.resolve();
};

// Get all workflows
export const getWorkflows = async (): Promise<Workflow[]> => {
  return Promise.resolve([...workflows]);
};

// Get a workflow by ID
export const getWorkflowById = async (id: string): Promise<Workflow | null> => {
  const workflow = workflows.find(w => w.id === id);
  return Promise.resolve(workflow || null);
};

// Add a new workflow
export const addWorkflow = async (workflow: Omit<Workflow, 'id'>): Promise<string> => {
  const id = String(nextId++);
  const newWorkflow = {
    id,
    name: workflow.name,
    description: workflow.description,
    steps: workflow.steps || []
  };
  
  workflows.push(newWorkflow);
  return Promise.resolve(id);
};

// Update a workflow
export const updateWorkflow = async (id: string, updates: Partial<Omit<Workflow, 'id'>>): Promise<boolean> => {
  const index = workflows.findIndex(w => w.id === id);
  if (index === -1) return Promise.resolve(false);
  
  workflows[index] = { ...workflows[index], ...updates };
  return Promise.resolve(true);
};

// Delete a workflow
export const deleteWorkflow = async (id: string): Promise<boolean> => {
  const initialLength = workflows.length;
  workflows = workflows.filter(w => w.id !== id);
  return Promise.resolve(workflows.length < initialLength);
};

// Add a step to a workflow
export const addStepToWorkflow = async (workflowId: string, step: Omit<WorkflowStep, 'id'>): Promise<string | null> => {
  const workflow = workflows.find(w => w.id === workflowId);
  if (!workflow) return Promise.resolve(null);
  
  const stepId = `${workflowId}-${workflow.steps.length + 1}`;
  const newStep = {
    id: stepId,
    type: step.type,
    name: step.name,
    description: step.description,
    config: step.config || {}
  };
  
  workflow.steps.push(newStep);
  return Promise.resolve(stepId);
};

// Update a step in a workflow
export const updateWorkflowStep = async (
  workflowId: string, 
  stepId: string, 
  updates: Partial<Omit<WorkflowStep, 'id'>>
): Promise<boolean> => {
  const workflow = workflows.find(w => w.id === workflowId);
  if (!workflow) return Promise.resolve(false);
  
  const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
  if (stepIndex === -1) return Promise.resolve(false);
  
  workflow.steps[stepIndex] = { ...workflow.steps[stepIndex], ...updates };
  return Promise.resolve(true);
};

// Delete a step from a workflow
export const deleteWorkflowStep = async (workflowId: string, stepId: string): Promise<boolean> => {
  const workflow = workflows.find(w => w.id === workflowId);
  if (!workflow) return Promise.resolve(false);
  
  const initialLength = workflow.steps.length;
  workflow.steps = workflow.steps.filter(s => s.id !== stepId);
  return Promise.resolve(workflow.steps.length < initialLength);
}; 