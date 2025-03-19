/**
 * Type definitions for the TAR application
 */

// Command type for slash commands
export interface SlashCommand {
  id: string;
  command: string;
  description: string;
}

// Page content types
export interface TextContent {
  type: 'text';
  content: string;
}

export interface ImageContent {
  type: 'image';
  url: string;
  caption?: string;
}

export interface CodeContent {
  type: 'code';
  language: string;
  code: string;
}

export interface TableContent {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export type Content = TextContent | ImageContent | CodeContent | TableContent;
