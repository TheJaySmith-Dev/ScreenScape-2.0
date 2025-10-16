import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatedTime } from './hooks/useSimulatedTime';
import { useStudioGame } from './hooks/useStudioGame';
import { useCompetitorAI } from './hooks/useCompetitorAI';
import { ProductionPanel } from './Panels/ProductionPanel';
import { ThemeParkPanel } from './Panels/ThemeParkPanel';
import { FinancePanel } from './Panels/FinancePanel';
import { AcquisitionPanel } from './Panels/AcquisitionPanel';
import { NegotiationPanel } from './Panels/NegotiationPanel';
import { AIAdvisorPanel } from './Panels/AIAdvisorPanel';

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
        primary: "bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-600/90 hover:to-blue-600/90",
        secondary: "bg-white/10 hover:bg-white/20",
        danger: "bg-red-500/80 hover:bg-red-600/90"
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

export const StudioMode = () => {
    const time = useSimulatedTime();
    const game = useStudioGame();
    const competitors = useCompetitorAI();

    const [activePanel, setActivePanel] = useState('overview');
    const [showTimeDisplay, setShowTimeDisplay] = useState(true);

    const panels = [
        { id: 'overview', name: 'Dashboard', icon: '📊', color: 'from-cyan-400 to-blue-400' },
        { id: 'production', name: 'Production', icon: '🎬', color: 'from-blue-400 to-cyan-400' },
        { id: 'themepark', name: 'Theme Parks', icon: '🎢', color: 'from-green-400 to-emerald-400' },
        { id: 'finance', name: 'Finance', icon: '💰', color: 'from-purple-400 to-pink-400' },
        { id: 'acquisition', name: 'Acquisitions', icon: '⚡', color: 'from-red-400 to-pink-400' },
        { id: 'negotiations', name: 'Negotiations', icon: '🤝', color: 'from-yellow-400 to-orange-400' },
        { id: 'advisor', name: 'AI Advisor', icon: '🤖', color: 'from-indigo-400 to-purple-400' }
    ];

    useEffect(() => {
        // Set page title
        document.title = 'Studio Mode - ScreenScape';
        return () => {
            document.title = 'ScreenScape';
        };
    }, []);

    const renderActivePanel = () => {
        switch (activePanel) {
            case 'production':
                return (
                    <ProductionPanel
                        productions={game.productions}
                        balance={game.balance}
                        onProduceMovie={game.produceMovie}
                        onProduceSeries={() => Promise.resolve({ success: true, message: 'Series production coming soon!' })}
                    />
                );
            case 'themepark':
                return (
                    <ThemeParkPanel
                        parkAttractions={game.parkAttractions}
                        balance={game.balance}
                        onBuildAttraction={game.buildParkAttraction}
                    />
                );
            case 'finance':
                return (
                    <FinancePanel
                        balance={game.balance}
                        reputation={game.reputation}
                        productions={game.productions}
                        parkAttractions={game.parkAttractions}
                        events={game.events}
                        competitors={competitors.competitors}
                    />
                );
            case 'acquisition':
                return (
                    <AcquisitionPanel
                        balance={game.balance}
                        reputation={game.reputation}
                        onProposeAcquisition={game.proposeAcquisition}
                    />
                );
            case 'negotiations':
                return (
                    <NegotiationPanel
                        negotiations={game.negotiations}
                        balance={game.balance}
                        onNegotiationResponse={game.handleNegotiationResponse}
                    />
                );
            case 'advisor':
                return (
                    <AIAdvisorPanel
                        gameState={game}
                        competitors={competitors.competitors}
                        time={time}
                    />
                );
            default:
                return (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <motion.h2
                                className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                            >
                                🎬 Studio Empire Dashboard
                            </motion.h2>
                            <p className="text-gray-300 text-lg">Welcome to your cinematic universe. Build your legacy one frame at a time.</p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <LiquidGlassPanel className="text-center">
                                <div className="text-3xl font-bold text-green-400">${game.balance.toLocaleString()}</div>
                                <div className="text-sm text-gray-400">Studio Balance</div>
                            </LiquidGlassPanel>

                            <LiquidGlassPanel className="text-center">
                                <div className="text-3xl font-bold text-blue-400">{game.reputation}/100</div>
                                <div className="text-sm text-gray-400">Industry Reputation</div>
                            </LiquidGlassPanel>

                            <LiquidGlassPanel className="text-center">
                                <div className="text-3xl font-bold text-purple-400">{game.productions.length + game.parkAttractions.length}</div>
                                <div className="text-sm text-gray-400">Active Projects</div>
                            </LiquidGlassPanel>

                            <LiquidGlassPanel className="text-center">
                                <div className="text-3xl font-bold text-yellow-400">{competitors.competitors.length}</div>
                                <div className="text-sm text-gray-400">AI Competitors</div>
                            </LiquidGlassPanel>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <GlassButton
                                onClick={() => setActivePanel('production')}
                                className="h-16 text-lg"
                            >
                                🎬 Start New Production
                            </GlassButton>
                            <GlassButton
                                onClick={() => setActivePanel('themepark')}
                                variant="secondary"
                                className="h-16 text-lg"
                            >
                                🎢 Build Theme Park
                            </GlassButton>
                            <GlassButton
                                onClick={() => setActivePanel('advisor')}
                                variant="secondary"
                                className="h-16 text-lg"
                            >
                                🤖 Ask AI Advisor
                            </GlassButton>
                        </div>

                        {/* Quick Tips */}
                        <LiquidGlassPanel className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-400/20">
                            <div className="flex items-start gap-3">
                                <div className="text-indigo-400 text-2xl">💡</div>
                                <div>
                                    <h4 className="font-semibold text-indigo-300 mb-2">Getting Started</h4>
                                    <p className="text-sm text-gray-300">
                                        Start with film production to build reputation, then expand into theme parks for steady income.
                                        Use your AI advisor for strategic guidance, and watch for negotiation opportunities.
                                    </p>
                                </div>
                            </div>
                        </LiquidGlassPanel>
                    </motion.div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            {/* Time Display */}
            <AnimatePresence>
                {showTimeDisplay && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-6 right-6 z-50"
                    >
                        <LiquidGlassPanel className="text-center min-w-48">
                            <div className="text-2xl font-bold text-cyan-300">{time.getFormattedDate()}</div>
                            <div className="text-sm text-gray-400">
                                Day {time.totalDays + 1} • Time flows at 1s = 1 day
                            </div>
                            <GlassButton
                                onClick={() => setShowTimeDisplay(false)}
                                variant="secondary"
                                className="mt-2 text-xs"
                            >
                                Hide
                            </GlassButton>
                        </LiquidGlassPanel>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation */}
            <motion.div
                className="flex flex-wrap gap-2 mb-8 justify-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {panels.map((panel, index) => (
                    <motion.button
                        key={panel.id}
                        onClick={() => setActivePanel(panel.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 border ${
                            activePanel === panel.id
                                ? `bg-gradient-to-r ${panel.color} text-white border-transparent shadow-lg`
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <span className="text-lg">{panel.icon}</span>
                        {panel.name}
                    </motion.button>
                ))}
            </motion.div>

            {/* Active Panel */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activePanel}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-7xl mx-auto"
                >
                    {renderActivePanel()}
                </motion.div>
            </AnimatePresence>

            {/* Show time button */}
            {!showTimeDisplay && (
                <motion.button
                    onClick={() => setShowTimeDisplay(true)}
                    className="fixed top-6 right-6 bg-cyan-500/80 backdrop-blur-sm border border-cyan-400/50 rounded-full p-3 shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    ⏰
                </motion.button>
            )}

            {/* Reset Button (for development) */}
            <motion.button
                onClick={game.resetGame}
                className="fixed bottom-6 right-6 bg-red-500/80 backdrop-blur-sm border border-red-400/50 rounded-full p-3 shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                🔄
            </motion.button>
        </div>
    );
};
