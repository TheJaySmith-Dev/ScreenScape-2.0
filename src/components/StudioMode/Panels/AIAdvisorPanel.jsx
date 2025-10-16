import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import aiClient from '../lib/aiClient';

const LiquidGlassPanel = ({ children, className = "" }) => {
    return (
        <motion.div
            className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl ${className}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {children}
        </motion.div>
    );
};

const GlassButton = ({ children, onClick, disabled = false, variant = "primary" }) => {
    const buttonVariants = {
        primary: "bg-gradient-to-r from-indigo-500/80 to-purple-500/80 hover:from-indigo-600/90 hover:to-purple-600/90",
        secondary: "bg-white/10 hover:bg-white/20"
    };

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 rounded-xl font-medium text-white border border-white/20 transition-all duration-300 disabled:opacity-50 ${buttonVariants[variant]}`}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
        >
            {children}
        </motion.button>
    );
};

export const AIAdvisorPanel = ({ gameState, competitors, time }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I\'m your AI strategic advisor. How can I help you grow your media empire today?' }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = { role: 'user', content: inputMessage };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const context = `
You are an AI strategic advisor for a media empire simulation game. The player runs a studio that produces movies, builds theme parks, and engages in business negotiations.

Current Game State:
- Player Balance: $${gameState.balance?.toLocaleString()}
- Player Reputation: ${gameState.reputation}/100
- Active Productions: ${gameState.productions?.length || 0}
- Active Park Attractions: ${gameState.parkAttractions?.length || 0}
- Pending Negotiations: ${gameState.negotiations?.filter(n => n.status === 'pending').length || 0}
- Current Day: Day ${time?.day || 1}, ${time?.getFormattedDate?.() || 'Unknown'}

Competitors:
${competitors?.map(c => `- ${c.name}: $${c.balance?.toLocaleString()} balance, ${c.reputation} reputation`).join('\n') || 'None loaded'}

Provide strategic advice, answer questions about the industry, suggest business moves, and help the player make informed decisions. Be helpful, professional, and encouraging.
            `;

            const response = await aiClient.callAI(inputMessage, context);
            const aiMessage = { role: 'assistant', content: response || 'I apologize, but I couldn\'t generate a response at this time.' };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
            console.error('AI Advisor error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const quickQuestions = [
        "What's the best strategy for growth?",
        "Should I accept this acquisition offer?",
        "How to improve my reputation?",
        "Market analysis for theme parks",
        "Competitor analysis"
    ];

    const askQuickQuestion = (question) => {
        setInputMessage(question);
        setTimeout(() => sendMessage(), 100);
    };

    return (
        <LiquidGlassPanel>
            <div className="space-y-6">
                <div className="text-center">
                    <motion.h3
                        className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        🤖 AI Strategic Advisor
                    </motion.h3>
                    <p className="text-gray-300 text-sm">Get expert guidance for your media empire decisions</p>
                </div>

                {/* Chat Messages */}
                <div className="bg-black/20 rounded-2xl p-4 border border-white/10 h-96 overflow-y-auto">
                    <div className="space-y-4">
                        <AnimatePresence>
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                            : 'bg-white/10 border border-white/20 text-gray-100'
                                    }`}>
                                        <div className="text-sm">{msg.content}</div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-2xl">
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span className="text-sm text-gray-300">Thinking...</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Quick Questions */}
                <div className="space-y-2">
                    <div className="text-sm text-gray-400 mb-2">Quick Questions:</div>
                    <div className="flex flex-wrap gap-2">
                        {quickQuestions.map((question, index) => (
                            <motion.button
                                key={index}
                                onClick={() => askQuickQuestion(question)}
                                disabled={isLoading}
                                className="px-3 py-1 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {question}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask me about your strategy..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                        disabled={isLoading}
                    />
                    <GlassButton
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                    >
                        {isLoading ? '...' : 'Send'}
                    </GlassButton>
                </div>
            </div>
        </LiquidGlassPanel>
    );
};
