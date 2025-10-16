import React from 'react';
import { motion } from 'framer-motion';

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
        primary: "bg-gradient-to-r from-red-500/80 to-pink-500/80 hover:from-red-600/90 hover:to-pink-600/90",
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

export const AcquisitionPanel = ({ balance, reputation, onProposeAcquisition }) => {
    const handleProposeOffer = () => {
        onProposeAcquisition();
    };

    return (
        <LiquidGlassPanel>
            <div className="space-y-6">
                <div className="text-center">
                    <motion.h3
                        className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        ⚡ Aggressive Acquisitions
                    </motion.h3>
                    <p className="text-gray-300 text-sm">Launch bold acquisition offers to expand your empire</p>
                </div>

                {/* Strategy Overview */}
                <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-2xl p-4 border border-red-400/20">
                    <h4 className="font-semibold mb-2">💡 Acquisition Strategy</h4>
                    <p className="text-sm text-gray-300">
                        Acquisitions can rapidly expand your market presence, but they require significant capital and carry reputation risks.
                        Consider your current financial position and industry standing before making offers.
                    </p>
                </div>

                {/* Current Status */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                        <div className="text-green-400 text-2xl font-bold">${balance.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">Available Funds</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                        <div className="text-blue-400 text-2xl font-bold">{reputation}/100</div>
                        <div className="text-sm text-gray-400">Reputation</div>
                    </div>
                </div>

                {/* Acquisition Options */}
                <div className="space-y-3">
                    <h4 className="font-semibold">Available Acquisition Targets</h4>

                    <motion.div
                        className="bg-white/5 rounded-xl p-4 border border-white/10"
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold">Competitor Acquisition</div>
                                <div className="text-sm text-gray-400">Strategic takeover of rival media company</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Expected cost: $100k - $2M • Success rate: Moderate
                                </div>
                            </div>
                            <GlassButton
                                onClick={handleProposeOffer}
                                variant="primary"
                            >
                                🚀 Launch Offer
                            </GlassButton>
                        </div>
                    </motion.div>
                </div>

                {/* Risks & Rewards */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h5 className="font-medium mb-3 text-yellow-400">⚖️ Risk Assessment</h5>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Success Probability:</span>
                            <span>65% (based on reputation)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Reputation Impact:</span>
                            <span className={`font-semibold ${reputation > 70 ? 'text-green-400' : reputation > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {reputation > 70 ? '+5 to +15' : reputation > 40 ? '+2 to +8' : '-2 to +3'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Market Expansion:</span>
                            <span className="text-green-400">+15% - +40%</span>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="text-center">
                    <GlassButton variant="secondary">
                        📊 View Acquisition History
                    </GlassButton>
                </div>
            </div>
        </LiquidGlassPanel>
    );
};
