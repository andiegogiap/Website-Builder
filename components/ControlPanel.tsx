
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, SamplePrompt } from '../types.ts';
import { CliOutput } from './CliOutput.tsx';
import { PaperclipIcon, SendIcon, XIcon, ChatBubbleIcon, LightBulbIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from './icons.tsx';

const SAMPLES_PER_PAGE = 2;

const SAMPLES: SamplePrompt[] = [
  {
    id: 'portfolio',
    title: 'Modern Portfolio',
    description: 'A sleek, single-page portfolio to showcase your projects and skills, with a contact form.',
    prompt: 'Create a personal portfolio website. It should have a hero section with my name "Alex Doe" and title "Creative Developer", an "About Me" section, a "Projects" section with 3 placeholder project cards, and a simple "Contact Me" form with fields for name, email, and message. The design should be modern and clean.',
    nextSteps: [
      { id: 'portfolio-dark', title: 'Add Dark Mode', description: 'Implement a toggle for light and dark themes.', prompt: 'Add a dark mode toggle to the website. The toggle should be in the top right corner and switch between a light and dark color scheme for the entire page.', isIteration: true },
      { id: 'portfolio-anim', title: 'Animate Sections', description: 'Add subtle scroll-based animations to the sections.', prompt: 'Add a subtle fade-in animation to each section (About, Projects, Contact) as the user scrolls them into view.', isIteration: true },
    ],
  },
  {
    id: 'saas-landing',
    title: 'SaaS Landing Page',
    description: "A professional landing page for a fictional SaaS product called 'SynthWave', designed to attract customers.",
    prompt: "Create a landing page for a fictional SaaS product called 'SynthWave'. It needs a hero section with a headline 'Supercharge Your Workflow', a sub-headline, and a call-to-action button. Below that, include a 'Features' section that lists three key features in cards with icons and short descriptions. Finally, add a simple footer with social media links.",
    nextSteps: [
        { id: 'saas-pricing', title: 'Add Pricing Table', description: 'Introduce a pricing section with multiple tiers.', prompt: 'Add a pricing table section to the landing page. It should have three tiers: Basic, Pro, and Enterprise, each with a list of features and a sign-up button.', isIteration: true },
        { id: 'saas-testimonials', title: 'Add Testimonials', description: 'Build social proof with a customer testimonials section.', prompt: 'Add a customer testimonials section. It should feature quotes from three fictional customers, including their name and company.', isIteration: true },
    ]
  },
  {
    id: 'blog-template',
    title: 'Minimalist Blog',
    description: "A clean, content-focused blog post template, perfect for writers and developers.",
    prompt: "Create a clean, minimalist blog post template. It should have a large centered title, author and date information below the title, and then the main content area for the article text. Include placeholder text for a short article about web development. Add a simple header with the blog's name 'DevThoughts'.",
    nextSteps: [
        { id: 'blog-comments', title: 'Add Comment Section', description: 'Allow readers to engage with a simple comment form.', prompt: 'Below the blog post content, add a "Comments" section with a simple form for a user to enter their name and comment, and a button to submit. Also display a few placeholder comments.', isIteration: true },
        { id: 'blog-related', title: 'Add Related Posts', description: 'Keep readers engaged by showing related articles at the bottom.', prompt: 'At the bottom of the page, after the comments section, add a "Related Posts" section that displays three placeholder article titles in cards.', isIteration: true },
    ]
  },
  {
    id: 'link-in-bio',
    title: 'Link-in-Bio Page',
    description: "A stylish, mobile-first 'link-in-bio' page to consolidate all your social profiles and links.",
    prompt: "Create a 'link-in-bio' style page for a social media profile. It should have a circular profile picture at the top, a name and a short bio underneath, followed by a list of 5 buttons with links to social profiles and personal websites. The background should be a subtle, stylish gradient.",
    nextSteps: [
        { id: 'link-anim', title: 'Animate Link Buttons', description: 'Add a satisfying animation to the link buttons on hover.', prompt: 'Animate the link buttons. When a user hovers over a button, it should scale up slightly and a subtle shadow should appear.', isIteration: true },
        { id: 'link-icons', title: 'Add Link Icons', description: 'Add icons (e.g., GitHub, Twitter) next to each link.', prompt: 'Add SVG icons next to the text for each link button. Use placeholder icons for common social media sites like GitHub, Twitter, and LinkedIn.', isIteration: true },
    ]
  },
  {
    id: 'recipe-card',
    title: 'Interactive Recipe Card',
    description: 'A visually appealing card for displaying a recipe with ingredients and instructions.',
    prompt: 'Create a recipe card for "Classic Chocolate Chip Cookies". It should have a title, a short description, an image placeholder, a list of ingredients, and a section for step-by-step instructions. The design should be clean and easy to read.',
    nextSteps: [
      { id: 'recipe-servings', title: 'Adjust Servings', description: 'Add a feature to dynamically adjust ingredient amounts.', prompt: 'Add a servings counter with "+" and "-" buttons. When the user changes the serving size, dynamically update the quantities of all ingredients in the list.', isIteration: true },
      { id: 'recipe-print', title: 'Add Print Button', description: 'Add a button to print a simplified version of the recipe.', prompt: 'Add a "Print Recipe" button. When clicked, it should trigger the browser\'s print dialog. Use CSS print styles to format the recipe for printing, hiding unnecessary elements like the header and footer of the website.', isIteration: true },
    ]
  },
  {
    id: 'coming-soon',
    title: 'Coming Soon Page',
    description: 'A stylish "Coming Soon" page with a countdown timer and an email signup form.',
    prompt: 'Create a "Coming Soon" landing page. It should have a large headline like "Something Big is Coming", a subheading, a countdown timer counting down to a date 30 days from now, and an email subscription form with an input field and a "Notify Me" button. Use a dark theme with a captivating background image or gradient.',
    nextSteps: [
      { id: 'coming-soon-social', title: 'Add Social Links', description: 'Add social media links to keep visitors engaged.', prompt: 'At the bottom of the "Coming Soon" page, add icons linking to social media profiles for Twitter, Instagram, and Facebook.', isIteration: true },
      { id: 'coming-soon-progress', title: 'Add Progress Bar', description: 'Show a progress bar to visualize the launch timeline.', prompt: 'Under the countdown timer, add a visual progress bar that reflects the time elapsed towards the launch date.', isIteration: true },
    ]
  }
];

const AddSampleForm: React.FC<{
  onSave: (sample: Omit<SamplePrompt, 'id' | 'nextSteps' | 'isIteration'>) => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ onSave, onCancel, isLoading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');

  const canSave = title.trim() && description.trim() && prompt.trim();

  const handleSave = () => {
    if (canSave) {
      onSave({ title, description, prompt });
    }
  };

  return (
    <div className="p-4 glass neon rounded-lg animate-fade-in flex flex-col gap-4">
      <h3 className="text-lg font-bold text-white font-orbitron">Add New Sample Prompt</h3>
      <div>
        <label htmlFor="sample-title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
        <input
          id="sample-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Cool Photo Gallery"
          className="w-full bg-gray-900/50 border border-gray-100/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="sample-description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <input
          id="sample-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., A page to display a grid of photos."
          className="w-full bg-gray-900/50 border border-gray-100/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="sample-prompt" className="block text-sm font-medium text-gray-300 mb-1">Prompt</label>
        <textarea
          id="sample-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          placeholder="e.g., Create a responsive grid of 9 placeholder images..."
          className="w-full bg-gray-900/50 border border-gray-100/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-end gap-3 mt-2">
        <button onClick={onCancel} disabled={isLoading} className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Cancel
        </button>
        <button onClick={handleSave} disabled={!canSave || isLoading} className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Save Prompt
        </button>
      </div>
    </div>
  );
};


interface ControlPanelProps {
  onGenerate: (prompt: string, sampleId?: string) => void;
  onIterate: (prompt: string, sampleId?: string) => void;
  chatHistory: ChatMessage[];
  cliOutput: string[];
  isLoading: boolean;
  isIterationDisabled: boolean;
  onFileChange: (file: File | null) => void;
  attachedFile: { name: string; content: string; } | null;
  activeSampleId: string | null;
  onClearActiveSample: () => void;
}

const TabButton = ({ active, onClick, icon: Icon, children }) => (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
        active
          ? 'text-white'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      {children}
      {active && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 shadow-[0_0_8px_theme(colors.cyan.400)] rounded-full"></div>}
    </button>
  );

export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'samples'>('samples');

  const [samples, setSamples] = useState<SamplePrompt[]>(() => {
    try {
      const saved = localStorage.getItem('gemini-builder-user-samples');
      const userSamples = saved ? JSON.parse(saved) : [];
      return [...SAMPLES, ...userSamples];
    } catch (e) {
      console.error("Failed to load user samples:", e);
      return SAMPLES;
    }
  });
  
  const handleRunSample = (sample: SamplePrompt) => {
    if (props.isLoading) return;

    if (sample.isIteration) {
        props.onIterate(sample.prompt, props.activeSampleId || sample.id);
    } else {
        props.onGenerate(sample.prompt, sample.id);
    }
    setActiveTab('chat');
  };

  const handleAddSample = useCallback((newSampleData: Omit<SamplePrompt, 'id' | 'isIteration' | 'nextSteps'>) => {
    const fullSample: SamplePrompt = {
        ...newSampleData,
        id: `user-${Date.now()}`,
        isIteration: false,
    };

    setSamples(prevSamples => {
        const updatedSamples = [...prevSamples, fullSample];
        const userSamples = updatedSamples.filter(s => s.id.startsWith('user-'));
        localStorage.setItem('gemini-builder-user-samples', JSON.stringify(userSamples));
        return updatedSamples;
    });
  }, []);

  return (
    <div className="h-full flex flex-col glass rounded-r-lg">
      <header className="p-4 flex-shrink-0">
        <div className="p-1 rounded-xl neon">
            <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-3 font-orbitron py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
            Gemini Website Builder
            </h1>
        </div>
      </header>
        
      <div className="px-2">
        <nav className="flex justify-center space-x-2">
          <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={ChatBubbleIcon}>
            Chat
          </TabButton>
          <TabButton active={activeTab === 'samples'} onClick={() => setActiveTab('samples')} icon={LightBulbIcon}>
            Samples
          </TabButton>
        </nav>
      </div>

      <div className="flex-grow flex flex-col min-h-0">
        {activeTab === 'chat' ? (
          <ChatView {...props} />
        ) : (
          <SamplesView 
            {...props} 
            onRunSample={handleRunSample}
            samples={samples}
            onAddSample={handleAddSample}
          />
        )}
      </div>

      <div className="h-48 border-t border-gray-700/50 flex-shrink-0">
          <CliOutput output={props.cliOutput} />
      </div>

      <div className="p-4 border-t border-gray-700/50 flex-shrink-0">
        <PromptForm {...props} />
      </div>
    </div>
  );
};


const ChatView: React.FC<ControlPanelProps> = ({ chatHistory }) => {
    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);
    
    return (
        <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
        {chatHistory.length === 0 && (
          <div className="text-center text-gray-400 p-8">
            <p className="mb-2">Welcome!</p>
            <p>Describe the website you want to build, check the Samples tab, or attach a file to get started.</p>
            <p className="mt-4 text-sm">e.g., "Create a personal portfolio with a hero section and a project gallery."</p>
          </div>
        )}
        <div className="space-y-4">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 animate-fade-in`}>
              <div className="w-8 h-8 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center">
                <msg.icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="glass rounded-lg p-3 max-w-[85%]">
                <p className="text-gray-200 whitespace-pre-wrap">{msg.content}</p>
                {msg.attachment && (
                    <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400 flex items-center gap-2">
                        <PaperclipIcon className="w-4 h-4 flex-shrink-0"/>
                        <span className="truncate">{msg.attachment}</span>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div ref={chatEndRef} />
      </div>
    );
}

interface SamplesViewProps extends ControlPanelProps {
  onRunSample: (sample: SamplePrompt) => void;
  samples: SamplePrompt[];
  onAddSample: (sample: Omit<SamplePrompt, 'id' | 'nextSteps' | 'isIteration'>) => void;
}

const SamplesView: React.FC<SamplesViewProps> = ({ activeSampleId, onClearActiveSample, onRunSample, isLoading, samples, onAddSample }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [showAddForm, setShowAddForm] = useState(false);

    const activeSample = samples.find(s => s.id === activeSampleId);
    const basePrompts = samples.filter(s => !s.isIteration);
    const promptsToShow = activeSample?.nextSteps || basePrompts;

    const totalPages = Math.ceil(promptsToShow.length / SAMPLES_PER_PAGE);
    const paginatedPrompts = promptsToShow.slice(currentPage * SAMPLES_PER_PAGE, (currentPage + 1) * SAMPLES_PER_PAGE);

    useEffect(() => {
        setCurrentPage(0); // Reset page when context changes
    }, [activeSampleId, showAddForm]);

    const handleSaveSample = (newSampleData: Omit<SamplePrompt, 'id' | 'nextSteps' | 'isIteration'>) => {
      onAddSample(newSampleData);
      setShowAddForm(false);
    };

    return (
        <div className="flex-grow p-4 overflow-y-auto flex flex-col custom-scrollbar">
            {showAddForm ? (
              <AddSampleForm onSave={handleSaveSample} onCancel={() => setShowAddForm(false)} isLoading={isLoading} />
            ) : (
              <>
                {activeSample ? (
                    <div className="mb-4">
                        <button onClick={() => onClearActiveSample()} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                            <ChevronLeftIcon className="w-4 h-4" />
                            Back to all samples
                        </button>
                        <h3 className="text-lg font-bold mt-2 text-white font-orbitron">Next Steps for: <span className="text-cyan-400">{activeSample.title}</span></h3>
                        <p className="text-sm text-gray-400">Try these ideas to iterate on your new website.</p>
                    </div>
                ) : (
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold text-white font-orbitron">Project Starters</h3>
                        <button 
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-1.5 bg-gray-700/80 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors"
                            title="Add a new sample prompt"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add
                        </button>
                    </div>
                )}
                <div className="space-y-3 flex-grow">
                    {paginatedPrompts.map(sample => (
                        <div key={sample.id} className="glass p-4 rounded-lg animate-fade-in neon neon-on-hover transition-transform hover:scale-105 cursor-pointer" onClick={() => onRunSample(sample)}>
                            <h4 className="font-bold text-white font-orbitron">{sample.title}</h4>
                            <p className="text-sm text-gray-400 mt-1 mb-3">{sample.description}</p>
                            <div className="w-full text-center bg-cyan-600/50 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-all text-sm">
                                Run Prompt
                            </div>
                        </div>
                    ))}
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-4 pt-2 border-t border-gray-700/50">
                        <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-1 disabled:opacity-50"><ChevronLeftIcon /></button>
                        <span className="text-sm text-gray-400">Page {currentPage + 1} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1} className="p-1 disabled:opacity-50"><ChevronRightIcon /></button>
                    </div>
                )}
              </>
            )}
        </div>
    );
};


const PromptForm: React.FC<ControlPanelProps> = ({ onGenerate, onIterate, isLoading, isIterationDisabled, onFileChange, attachedFile, onClearActiveSample }) => {
    const [prompt, setPrompt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((prompt.trim() || attachedFile) && !isLoading) {
          onClearActiveSample(); // Clear sample context on manual submission
          if (isIterationDisabled) {
            onGenerate(prompt);
          } else {
            onIterate(prompt);
          }
          setPrompt('');
        }
      };
    
      const handleAttachClick = () => {
        fileInputRef.current?.click();
      };
    
      const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        onFileChange(file || null);
        if(e.target) {
            e.target.value = ''; // Allow re-selecting the same file
        }
      };

    return (
        <form onSubmit={handleSubmit}>
          {attachedFile && (
            <div className="glass mb-2 p-2 rounded-lg flex items-center justify-between text-sm text-gray-300 animate-fade-in">
                <div className="flex items-center gap-2 truncate">
                    <PaperclipIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="truncate">{attachedFile.name}</span>
                </div>
                <button type="button" onClick={() => onFileChange(null)} disabled={isLoading} className="p-1 rounded-full hover:bg-gray-600 disabled:opacity-50">
                    <XIcon className="w-4 h-4"/>
                </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".md,.html,.txt,text/plain,text/markdown,text/html"
                disabled={isLoading}
            />
            <button
                type="button"
                onClick={handleAttachClick}
                disabled={isLoading}
                title="Attach file"
                className="p-2 bg-gray-900/50 border border-gray-100/10 hover:bg-gray-700/50 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-gray-300 hover:text-white font-bold rounded-lg flex items-center justify-center transition-all"
            >
                <PaperclipIcon className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isIterationDisabled ? "Describe your website..." : "Describe the changes..."}
              className="flex-grow bg-gray-900/50 border border-gray-100/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!prompt.trim() && !attachedFile)}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-all hover:shadow-[0_0_10px_#06b6d4]"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
               <SendIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
    );
}