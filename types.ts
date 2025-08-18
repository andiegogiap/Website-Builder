import type React from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  attachment?: string;
}

export interface GeneratedCode {
  html: string;
  rationale: string;
}

export interface SamplePrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  isIteration?: boolean;
  nextSteps?: SamplePrompt[];
}

export type PreviewView = 'preview' | 'source';