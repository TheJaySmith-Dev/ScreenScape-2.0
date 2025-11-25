import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Minimize2 } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { useAppleTheme } from './AppleDesignSystem';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const AIChatOverlay: React.FC = () => {
    const { tokens } = useAppleTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm your AI assistant. How can I help you discover something great to watch today?",
            sender: 'ai',
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputValue('');

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm processing your request with my liquid glass neural networks...",
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiResponse]);
        }, 1000);
    };

    return (
        <>
            {/* Floating Chat Button (Desktop) */}
            <AnimatePresence>
                {!isOpen && !isMinimized && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-8 right-8 z-50"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-blue-500/30 transition-shadow group"
                        >
                            <Sparkles className="w-6 h-6 text-white group-hover:text-blue-400 transition-colors" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                        className={`fixed z-50 ${window.innerWidth < 768
                                ? 'inset-x-0 bottom-0 h-[80vh] rounded-t-[32px]'
                                : 'bottom-8 right-8 w-[400px] h-[600px] rounded-[32px]'
                            }`}
                    >
                        <GlassPanel
                            variant="primary"
                            material="thick"
                            padding="none"
                            borderRadius="large"
                            className="w-full h-full flex flex-col overflow-hidden border-white/20 shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-inner">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
                                        <p className="text-white/50 text-xs">Liquid Intelligence</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            setIsMinimized(false);
                                        }}
                                        className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                                    >
                                        <Minimize2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed backdrop-blur-md ${msg.sender === 'user'
                                                    ? 'bg-blue-500/20 border border-blue-400/30 text-white rounded-tr-sm'
                                                    : 'bg-white/10 border border-white/10 text-white/90 rounded-tl-sm'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-md">
                                <form
                                    onSubmit={handleSendMessage}
                                    className="flex items-center gap-2 bg-black/20 rounded-full p-1 pl-4 border border-white/10 focus-within:border-blue-400/50 transition-colors"
                                >
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Ask anything..."
                                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 text-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim()}
                                        className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:hover:bg-blue-500/20 disabled:hover:text-blue-400 transition-all"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </GlassPanel>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIChatOverlay;
