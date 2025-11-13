import React, { useState, useRef, useEffect } from 'react';
import type { MintorAiMessage, MintorAction, Screen } from '../types';
import { mintorAiService } from '../services/mintorAi';
import { MINTOR_AI_ASSISTANT, SendIcon, CloseIcon } from '../constants';
import { hapticClick } from '../services/haptics';
import { useAppContext } from '../App';

interface MintorAiModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatBubble: React.FC<{ message: MintorAiMessage, onAction: (action: MintorAction) => void }> = ({ message, onAction }) => {
    const isUser = message.sender === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-screenFadeIn`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${isUser ? 'bg-primary-container text-on-primary-container rounded-br-none' : 'bg-surface-variant/60 dark:bg-surface-variant/40 backdrop-blur-lg border border-outline/20 text-on-surface-variant rounded-bl-none'}`}>
                <p className="text-body-m whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                 {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-col items-start gap-2 mt-3">
                        {message.actions.map((action, index) => (
                            <button 
                                key={index} 
                                onClick={() => {
                                    hapticClick();
                                    onAction(action);
                                }}
                                className="text-sm bg-primary-container text-on-primary-container px-3 py-1.5 rounded-xl text-left w-full transition-transform active:scale-95"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


export default function MintorAiModal({ isOpen, onClose }: MintorAiModalProps) {
    const [messages, setMessages] = useState<MintorAiMessage[]>([]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [isThinking, setIsThinking] = useState(false);
    const { screen, setScreen } = useAppContext();
    const [isClosing, setIsClosing] = useState(false);

    const handleAnimatedClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false); // Reset for the next time it opens
        }, 400); // Must match animation duration in index.html
    };

    const navigateTo = (screen: Screen) => {
        setScreen(screen);
        handleAnimatedClose();
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: "Hi! I'm Mintor. I can analyze your spending, help with financial questions, and more.\n\nYour personal financial data always stays on your device and is never shared.",
                actions: mintorAiService.getContextualStartingPrompts(screen),
            }]);
        }
    }, [isOpen, messages.length, screen]);
    
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

    const handleActionClick = (action: MintorAction) => {
        if (action.type === 'navigate') {
            navigateTo(action.payload as Screen);
        } else if (action.type === 'query') {
            handleSend(action.payload);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-backdropFadeIn" onClick={handleAnimatedClose}>
            <div 
                className={`bg-surface rounded-none md:rounded-3xl w-full h-full md:max-w-2xl md:h-[calc(100%-2rem)] flex flex-col shadow-2xl origin-top-right ${isClosing ? 'animate-mintor-close' : 'animate-mintor-open'}`}
                onClick={e => e.stopPropagation()}
            >
                <header 
                    className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface/80 backdrop-blur-lg z-10"
                    style={{ paddingTop: `calc(1rem + env(safe-area-inset-top))` }}
                >
                    <div className="text-title-l font-bold tracking-tight">
                        <span className="bg-gradient-to-br from-primary to-primary-container bg-clip-text text-transparent">Min</span>
                        <span className="text-on-surface-variant [text-shadow:_0_0_5px_rgb(var(--color-surface-variant)/0.3)] [-webkit-text-stroke:_0.25px_rgb(var(--color-outline-variant)/0.5)]">tor</span>
                        <span className="text-on-surface-variant/80 font-medium ml-1">AI</span>
                    </div>
                    <button onClick={() => { hapticClick(); handleAnimatedClose(); }} className="p-3 rounded-full text-on-surface-variant hover:bg-surface-variant/80 transition-colors" aria-label="Close Mintor AI modal">
                        <CloseIcon />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => <ChatBubble key={msg.id} message={msg} onAction={handleActionClick} />)}
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