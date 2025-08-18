import React, { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { generateWebsite, iterateOnWebsite } from './services/geminiService';
import type { ChatMessage, GeneratedCode, PreviewView } from './types';
import { BotIcon, UserIcon } from './components/icons';

interface AttachedFile {
  name: string;
  content: string;
}

const App: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [cliOutput, setCliOutput] = useState<string[]>(['Welcome to Gemini Website Builder.', 'Select a sample or enter a prompt to start...']);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [previewView, setPreviewView] = useState<PreviewView>('preview');

  // State for resizable columns
  const [controlPanelWidth, setControlPanelWidth] = useState(() => {
    const savedWidth = localStorage.getItem('controlPanelWidth');
    const defaultWidth = window.innerWidth / 3;
    if (!savedWidth) return defaultWidth;
    // Ensure the saved width is within reasonable bounds
    return Math.max(350, Math.min(parseInt(savedWidth, 10), window.innerWidth - 400));
  });
  const [isResizing, setIsResizing] = useState(false);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleFileChange = useCallback(async (file: File | null) => {
    if (!file) {
      setAttachedFile(null);
      return;
    }
    const allowedExtensions = ['.md', '.html', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setError(`Unsupported file type: ${file.name}. Please use .md, .html, or .txt`);
      return;
    }

    try {
      const content = await file.text();
      setAttachedFile({ name: file.name, content });
      setError(null); // Clear previous errors
    } catch (e) {
      setError("Failed to read the file.");
      setAttachedFile(null);
    }
  }, []);

  const getCombinedPrompt = useCallback((prompt: string): string => {
    if (!attachedFile) return prompt;
    return `Use the content from the attached file "${attachedFile.name}" to fulfill this request: "${prompt}".\n\n--- FILE CONTENT ---\n\n${attachedFile.content}`;
  }, [attachedFile]);


  const handleInitialGenerate = useCallback(async (prompt: string, sampleId?: string) => {
    setIsLoading(true);
    setError(null);
    setGeneratedCode(null);
    setActiveSampleId(sampleId || null);
    
    const combinedPrompt = getCombinedPrompt(prompt);
    const userMessage: ChatMessage = { role: 'user', content: combinedPrompt, icon: UserIcon, attachment: attachedFile?.name };
    setChatHistory([userMessage]);
    
    setCliOutput(['']);
    const newCliOutput: string[] = [];
    const addCliLine = (line: string) => {
        newCliOutput.push(line);
        setCliOutput([...newCliOutput]);
    }

    try {
        await sleep(200);
        addCliLine(`> gemini-cli build --prompt "${prompt.substring(0, 30)}..." ${attachedFile ? `--file ${attachedFile.name}` : ''}`.trim());
        await sleep(500);
        addCliLine('Initializing build process...');
        await sleep(300);
        addCliLine('Contacting Gemini API...');
        
        const result = await generateWebsite(combinedPrompt);
        setGeneratedCode(result);
        setPreviewView('preview');
        
        const assistantMessage: ChatMessage = { role: 'assistant', content: result.rationale, icon: BotIcon };
        setChatHistory(prev => [...prev, assistantMessage]);

        await sleep(300);
        addCliLine('Code generation complete.');
        await sleep(200);
        addCliLine('Assembling single-file application...');
        await sleep(500);
        addCliLine('Build successful. Rendering preview.');
        
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      addCliLine(`[ERROR] Build failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setAttachedFile(null); // Clear file after submission
    }
  }, [attachedFile, getCombinedPrompt]);

  const handleIteration = useCallback(async (prompt: string, sampleId?: string) => {
    if (!generatedCode) return;

    setIsLoading(true);
    setError(null);
    setActiveSampleId(sampleId || null);

    const combinedPrompt = getCombinedPrompt(prompt);
    const userMessage: ChatMessage = { role: 'user', content: combinedPrompt, icon: UserIcon, attachment: attachedFile?.name };
    const newChatHistory = [...chatHistory, userMessage];
    setChatHistory(newChatHistory);

    const newCliOutput: string[] = [];
    const addCliLine = (line: string) => {
        newCliOutput.push(line);
        setCliOutput([...newCliOutput]);
    }
    
    try {
        await sleep(200);
        addCliLine(`> gemini-cli iterate --prompt "${prompt.substring(0, 30)}..." ${attachedFile ? `--file ${attachedFile.name}` : ''}`.trim());
        await sleep(500);
        addCliLine('Initializing iteration...');
        await sleep(300);
        addCliLine('Sending context to Gemini API...');

        const result = await iterateOnWebsite(newChatHistory, generatedCode.html);
        setGeneratedCode(result);
        setPreviewView('preview');

        const assistantMessage: ChatMessage = { role: 'assistant', content: result.rationale, icon: BotIcon };
        setChatHistory(prev => [...prev, assistantMessage]);

        await sleep(300);
        addCliLine('Iteration complete.');
        await sleep(200);
        addCliLine('Re-assembling application...');
        await sleep(500);
        addCliLine('Build successful. Refreshing preview.');

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      addCliLine(`[ERROR] Iteration failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setAttachedFile(null); // Clear file after submission
    }
  }, [generatedCode, chatHistory, attachedFile, getCombinedPrompt]);

  // Resizing logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };
  
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
        const newWidth = e.clientX;
        const minWidth = 350;
        const maxWidth = window.innerWidth - 400; // Keep preview panel at least 400px
        const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        setControlPanelWidth(clampedWidth);
        localStorage.setItem('controlPanelWidth', String(clampedWidth));
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);


  return (
    <div 
        className="flex h-screen w-full bg-gray-900 text-gray-200 font-sans overflow-hidden"
        style={{ cursor: isResizing ? 'col-resize' : 'auto' }}
    >
      <div 
        style={{ width: `${controlPanelWidth}px` }}
        className="flex-shrink-0 h-full flex flex-col"
      >
        <ControlPanel
          onGenerate={handleInitialGenerate}
          onIterate={handleIteration}
          chatHistory={chatHistory}
          cliOutput={cliOutput}
          isLoading={isLoading}
          isIterationDisabled={!generatedCode}
          onFileChange={handleFileChange}
          attachedFile={attachedFile}
          activeSampleId={activeSampleId}
          onClearActiveSample={() => setActiveSampleId(null)}
        />
      </div>
      
      <div 
        className="w-1.5 cursor-col-resize bg-gray-700 hover:bg-cyan-500 transition-colors duration-200 flex-shrink-0"
        onMouseDown={handleMouseDown}
      />

      <div className="flex-grow flex flex-col bg-gray-800 min-w-0">
        <PreviewPanel 
          code={generatedCode?.html || ''}
          view={previewView}
          onViewChange={setPreviewView}
        />
      </div>
    </div>
  );
};

export default App;