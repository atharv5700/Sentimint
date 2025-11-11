import React, { useState, useRef, useEffect } from 'react';
import type { MintorAiMessage } from '../types';
import { mintorAiService } from '../services/mintorAi';
import { MINTOR_AI_ASSISTANT, SendIcon, CloseIcon } from '../constants';
import { hapticClick } from '../services/haptics';

interface MintorAiModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatBubble: React.FC<{ message: MintorAiMessage }> = ({ message }) => {
    const isUser = message.sender === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-screenFadeIn`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${isUser ? 'bg-primary-container text-on-primary-container rounded-br-none' : 'bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 text-on-surface-variant rounded-bl-none'}`}>
                <p className="text-body-m whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
            </div>
        </div>
    );
};


export default function MintorAiModal({ isOpen, onClose }: MintorAiModalProps) {
    const [messages, setMessages] = useState<MintorAiMessage[]>([]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [isThinking, setIsThinking] = useState(false);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: "Hi! I'm Mintor. I can analyze your spending, help with financial questions, and more.\n\nTo answer general questions, I use Google's AI, but be assured your personal financial data always stays on your device and is not shared.\n\nHow can I help you today?",
            }]);
        }
    }, [isOpen, messages.length]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = async (queryOverride?: string) => {
        const query = queryOverride || input.trim();
        if (!query || isThinking) return;

        hapticClick();

        const userMessage: MintorAiMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: query,
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsThinking(true);

        const botResponse = await mintorAiService.getResponse(query);
        const botMessage: MintorAiMessage = {
            id: `bot-${Date.now() + 1}`,
            ...botResponse,
        };
        
        // Simulate thinking time for better UX
        setTimeout(() => {
            setMessages(prev => [...prev, botMessage]);
            setIsThinking(false);
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-backdropFadeIn">
            <div className="bg-surface rounded-none md:rounded-3xl w-full h-full md:max-w-2xl md:h-[calc(100%-2rem)] flex flex-col shadow-2xl animate-modalSlideUp">
                <header 
                    className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface/80 backdrop-blur-lg z-10"
                    style={{ paddingTop: `calc(1rem + env(safe-area-inset-top))` }}
                >
                    <h2 className="text-title-m font-medium">{MINTOR_AI_ASSISTANT.name}</h2>
                    <button onClick={() => { hapticClick(); onClose(); }} className="text-on-surface-variant p-1" aria-label="Close Mintor AI modal">
                        <CloseIcon />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl bg-surface-variant text-on-surface-variant rounded-bl-none">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </main>
                <footer 
                    className="p-4 border-t border-outline-variant bg-surface/80 backdrop-blur-lg z-10 pb-safe"
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 text-on-surface-variant rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isThinking}
                        />
                         <button onClick={() => handleSend()} disabled={!input.trim() || isThinking} className="bg-primary text-on-primary p-3 rounded-2xl shadow hover:bg-primary/90 disabled:bg-outline disabled:opacity-50 transition-all">
                            <SendIcon />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}