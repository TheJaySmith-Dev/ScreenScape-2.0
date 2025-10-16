import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';

const LiquidGlassPanel = ({ children, className = "" }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
    const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

    const springConfig = { stiffness: 300, damping: 30 };
    const springRotateX = useSpring(rotateX, springConfig);
    const springRotateY = useSpring(rotateY, springConfig);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <motion.div
            className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl ${className}`}
            style={{
                rotateX: springRotateX,
                rotateY: springRotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{
                scale: 1.02,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                transition: { duration: 0.2 }
            }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
            }}
        >
            {children}
        </motion.div>
    );
};

const GlassButton = ({ children, onClick, disabled = false, variant = "primary" }) => {
    const buttonVariants = {
        primary: "bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-600/90 hover:to-pink-600/90",
        secondary: "bg-white/10 hover:bg-white/20",
        danger: "bg-gradient-to-r from-red-500/80 to-pink-500/80 hover:from-red-600/90 hover:to-pink-600/90"
    };

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={`
                px-6 py-3 rounded-2xl font-medium text-white
                backdrop-blur-sm border border-white/20
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
                ${buttonVariants[variant]}
            `}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
        >
            {children}
        </motion.button>
    );
};

export const FinancePanel = ({
    balance,
    reputation,
    productions,
    parkAttractions,
    events,
    competitors
}) => {
    const [activeTab, setActiveTab] = useState('overview');

    const totalDailyRevenue = parkAttractions.reduce((sum, attr) => sum + attr.revenue, 0);
    const totalAssets = balance + (productions.filter(p => p.completionDay <= Date.now() / 86400000).length * 100000);
    const netWorth = totalAssets;

    const recentEvents = events.slice(0, 5);

    const tabs = [
        { id: 'overview', name: 'Overview', icon: '📊' },
        { id: 'events', name: 'Events', icon: '📰' },
        { id: 'market', name: 'Market', icon: '📈' }
    ];

    return (
        <LiquidGlassPanel>
            <div className="space-y-6">
                <div className="text-center">
                    <motion.h3
                        className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        💰 Corporate Dashboard
                    </motion.h3>
                    <p className="text-gray-300 text-sm">Monitor your empire's financial health and industry trends</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                                activeTab === tab.id
                                    ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                                    : 'text-gray-400 hover:text-gray-300'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>{tab.icon}</span>
                            {tab.name}
                        </motion.button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                <motion.div
                                    className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-4 border border-green-400/30"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="text-green-400 text-sm opacity-80">Cash Balance</div>
                                    <div className="text-2xl font-bold text-green-300">${balance.toLocaleString()}</div>
                                </motion.div>

                                <motion.div
                                    className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-4 border border-blue-400/30"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="text-blue-400 text-sm opacity-80">Reputation</div>
                                    <div className="text-2xl font-bold text-blue-300">{reputation}/100</div>
                                </motion.div>

                                <motion.div
                                    className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-400/30"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="text-purple-400 text-sm opacity-80">Daily Revenue</div>
                                    <div className="text-2xl font-bold text-purple-300">${totalDailyRevenue.toLocaleString()}</div>
                                </motion.div>

                                <motion.div
                                    className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 border border-yellow-400/30"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="text-yellow-400 text-sm opacity-80">Net Worth</div>
                                    <div className="text-2xl font-bold text-yellow-300">${netWorth.toLocaleString()}</div>
                                </motion.div>
                            </div>

                            {/* Active Projects Summary */}
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <h4 className="font-semibold mb-3">Active Projects</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-400">In Production</div>
                                        <div className="text-lg font-bold text-blue-400">{productions.length}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Under Construction</div>
                                        <div className="text-lg font-bold text-green-400">{parkAttractions.length}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Reputation Bar */}
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Industry Reputation</span>
                                    <span className="text-sm text-gray-400">{reputation}/100</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${reputation}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'events' && (
                        <motion.div
                            key="events"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-3"
                        >
                            <h4 className="font-semibold mb-4">Recent Events</h4>
                            {recentEvents.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {recentEvents.map((event, index) => (
                                        <motion.div
                                            key={event.id}
                                            className="bg-white/5 rounded-xl p-3 border border-white/10"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="text-lg">
                                                    {event.type === 'production_complete' ? '🎬' :
                                                     event.type === 'park_complete' ? '🎢' :
                                                     event.type === 'negotiation_expired' ? '⏰' :
                                                     event.type === 'industry_event' ? '🌍' :
                                                     '📰'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-sm">{event.title}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{event.description}</div>
                                                    {event.impact && (
                                                        <div className="flex gap-2 mt-2">
                                                            {event.impact.balance !== 0 && (
                                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                                    event.impact.balance > 0
                                                                        ? 'bg-green-500/20 text-green-400'
                                                                        : 'bg-red-500/20 text-red-400'
                                                                }`}>
                                                                    ${event.impact.balance > 0 ? '+' : ''}{event.impact.balance.toLocaleString()}
                                                                </span>
                                                            )}
                                                            {event.impact.reputation !== 0 && (
                                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                                    event.impact.reputation > 0
                                                                        ? 'bg-blue-500/20 text-blue-400'
                                                                        : 'bg-red-500/20 text-red-400'
                                                                }`}>
                                                                    {event.impact.reputation > 0 ? '+' : ''}{event.impact.reputation} rep
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    <div className="text-4xl mb-2">📭</div>
                                    <div>No events yet</div>
                                    <div className="text-sm">Industry events will appear here</div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'market' && (
                        <motion.div
                            key="market"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <h4 className="font-semibold mb-4">Market Intelligence</h4>

                            {/* Competitor Overview */}
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <h5 className="font-medium mb-3">Competitor Analysis</h5>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {competitors.slice(0, 5).map((comp, index) => (
                                        <motion.div
                                            key={comp.id}
                                            className="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <div>
                                                <div className="font-semibold text-sm">{comp.name}</div>
                                                <div className="text-xs text-gray-400">Balance: ${comp.balance.toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-purple-400">Rep: {comp.reputation}</div>
                                                <div className="text-xs text-gray-400">
                                                    Next action: {(7 - (Date.now() / 86400000 - comp.lastActionDay)).toFixed(0)}d
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Market Insights */}
                            <div className="grid grid-cols-1 gap-3">
                                <motion.div
                                    className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-400/20"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-indigo-400">💡</div>
                                        <div>
                                            <div className="font-semibold">Market Trend</div>
                                            <div className="text-sm text-gray-400">Entertainment spending is up 15% this quarter</div>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-400/20"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-orange-400">⚠️</div>
                                        <div>
                                            <div className="font-semibold">Risk Alert</div>
                                            <div className="text-sm text-gray-400">Streaming competition intensifying in your market</div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </LiquidGlassPanel>
    );
};
