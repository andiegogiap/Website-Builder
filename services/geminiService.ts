
import { GoogleGenAI, Type } from "@google/genai";
import type { ChatMessage, GeneratedCode } from '../types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        html: {
            type: Type.STRING,
            description: "The complete, self-contained HTML code for the web application.",
        },
        rationale: {
            type: Type.STRING,
            description: "A brief, one-sentence explanation of the approach taken to generate or modify the code.",
        },
    },
    required: ["html", "rationale"],
};

const getSystemInstruction = () => `
You are an expert full-stack developer specializing in creating single-file, production-ready web applications using React and Tailwind CSS.
Your goal is to generate a SINGLE, complete, self-contained HTML file based on the user's request.

**CRITICAL RULE: Error Handling is Mandatory**
The most important requirement is to prevent blank pages. You MUST wrap the entire content of the <script type="text/babel"> tag in a single, top-level try...catch block. The catch block's primary job is to display any error visibly on the page inside the #root element. This is not optional.

**CORE REQUIREMENTS:**
1.  **Single HTML File:** The entire application must be in a single .html file.
2.  **Dependencies for Debugging:** To ensure errors are visible, you must use the development versions of React.
    *   Load Tailwind CSS v3 from CDN.
    *   Load React's DEVELOPMENT builds (react.development.js, react-dom.development.js) from a CDN.
    *   Load Babel Standalone from CDN for in-browser JSX transpilation.
3.  **HTML Structure:**
    *   Start with \`<!DOCTYPE html>\`.
    *   The \`<body>\` must contain a single \`<div id="root"></div>\`.
    *   All React/JavaScript code must be inside a single \`<script type="text/babel">\` tag at the end of the \`<body>\`.
4.  **React Code:**
    *   Use modern React 18: functional components, hooks, and \`ReactDOM.createRoot()\`.
    *   Do NOT use ES Modules (\`import\`/\`export\`). Use the global \`React\` and \`ReactDOM\` objects.
5.  **Styling:**
    *   Use Tailwind CSS classes exclusively for styling. Do not use inline 'style' attributes or custom \`<style>\` tags, except within the error message template.

**Instructions for Handling Attachments:**
If the user provides an attached file (.md, .html, or .txt), you MUST use its content as the primary source for generating the web application. The user's text prompt will provide instructions on how to use the file content. For example, if an HTML file is attached, the prompt might be "Style this HTML using Tailwind CSS." If a Markdown file is attached, the prompt might be "Create a blog post page from this Markdown content."

---
**MANDATORY HTML TEMPLATE**
You MUST follow this template structure. Fill in the \`App\` component based on the user's request. Do not deviate from this structure.

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Use DEVELOPMENT version of React for better error messages -->
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        try {
            // All React code MUST be inside this try block.
            const { useState, useEffect, StrictMode } = React;

            // --- Your App Component and other components go here ---
            const App = () => {
                // Example: return <h1 className="text-3xl font-bold text-center mt-10">Hello World!</h1>;
                // FILL IN WITH REQUESTED CONTENT
            };
            // --- End of App Component ---

            const container = document.getElementById('root');
            if (!container) {
                throw new Error('Fatal Error: Root element #root not found in the DOM.');
            }
            const root = ReactDOM.createRoot(container);
            root.render(<StrictMode><App /></StrictMode>);

        } catch (error) {
            console.error("Caught a rendering error:", error);
            const rootContainer = document.getElementById('root');
            if (rootContainer) {
                // Display a user-friendly error message IN THE PREVIEW.
                rootContainer.innerHTML = \`
                    <div style="padding: 2rem; background-color: #111827; color: #fca5a5; font-family: ui-monospace, 'Fira Code', monospace; height: 100vh; box-sizing: border-box; overflow: auto;">
                        <h1 style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">An Error Occurred</h1>
                        <p style="margin-top: 1rem; color: #fda4af;">The application failed to render. This is likely a JavaScript error in the generated code.</p>
                        <h2 style="font-size: 1.25rem; font-weight: bold; color: #f87171; margin-top: 1.5rem; border-bottom: 1px solid #374151; padding-bottom: 0.5rem;">Error Details</h2>
                        <pre style="background-color: #1f2937; padding: 1rem; border-radius: 0.25rem; margin-top: 1rem; white-space: pre-wrap; word-break: break-all; font-size: 0.875rem;">\${error.stack || error.toString()}</pre>
                        <p style="margin-top: 1.5rem; font-size: 0.875rem; color: #9ca3af;">Check the browser's developer console (F12 or Ctrl+Shift+I) for more specific details.</p>
                    </div>
                \`;
            }
        }
    </script>
</body>
</html>
---

Your entire response must be a single JSON object matching the provided schema. Do not include any markdown backticks or the word "json" in your response.
`;

export const generateWebsite = async (prompt: string): Promise<GeneratedCode> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: getSystemInstruction(),
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as GeneratedCode;
    } catch (error) {
        console.error("Error generating website:", error);
        throw new Error("Failed to generate website. The model may have returned an invalid response.");
    }
};

export const iterateOnWebsite = async (
    chatHistory: ChatMessage[],
    currentHtml: string
): Promise<GeneratedCode> => {
    const contextPrompt = `
        Based on the **ENTIRE conversation history** and the **current HTML code**, generate the complete, updated HTML file that fulfills the latest user request.
        The latest message in the history is the most important one. Return the full HTML, not just the changes.

        **Conversation History:**
        ${chatHistory.map(msg => `${msg.role}: ${msg.attachment ? `(Attached ${msg.attachment}) ` : ''}${msg.content}`).join('\n')}

        **Current HTML Code to be Modified:**
        \`\`\`html
        ${currentHtml}
        \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: contextPrompt,
            config: {
                systemInstruction: getSystemInstruction(),
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as GeneratedCode;
    } catch (error) {
        console.error("Error iterating on website:", error);
        throw new Error("Failed to iterate on website. The model may have returned an invalid response.");
    }
};