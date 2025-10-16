import React, { useState } from 'react';
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
        primary: "bg-gradient-to-r from-yellow-500/80 to-orange-500/80 hover:from-yellow-600/90 hover:to-orange-600/90",
        secondary: "bg-white/10 hover:bg-white/20",
        success: "bg-gradient-to-r from-green-500/80 to-emerald-500/80",
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

export const NegotiationPanel = ({ negotiations, balance, onNegotiationResponse }) => {
    const [counterOffers, setCounterOffers] = useState({});

    const activeNegotiations = negotiations.filter(n => n.status === 'pending');

    const handleResponse = (negotiationId, action) => {
        let counterAmount = null;
        if (action === 'counter' && counterOffers[negotiationId]) {
            counterAmount = parseInt(counterOffers[negotiationId]);
        }
        onNegotiationResponse(negotiationId, action, counterAmount);
    };

    const setCounterOffer = (negotiationId, amount) => {
        setCounterOffers(prev => ({
            ...prev,
            [negotiationId]: amount
        }));
    };

    return (
        <LiquidGlassPanel>
            <div className="space-y-6">
                <div className="text-center">
                    <motion.h3
                        className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        🤝 Business Negotiations
                    </motion.h3>
                    <p className="text-gray-300 text-sm">Handle acquisition offers and merger proposals</p>
                </div>

                {activeNegotiations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📋</div>
                        <div>No pending negotiations</div>
                        <div className="text-sm">New offers will appear here</div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeNegotiations.map((neg, index) => (
                            <motion.div
                                key={neg.id}
                                className="bg-white/5 rounded-2xl p-4 border border-white/10"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-3xl">
                                        {neg.type === 'acquisition' ? '💰' : '🤝'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-lg">{neg.fromCompanyName}</div>
                                        <div className="text-sm text-gray-400 mb-2">{neg.rationale}</div>

                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="text-center">
                                                <div className="text-xs text-gray-400">Amount</div>
                                                <div className="text-lg font-bold text-yellow-400">
                                                    ${neg.amount.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-gray-400">Expires in</div>
                                                <div className="text-sm font-semibold">
                                                    {Math.max(0, Math.floor(neg.expiryDay - (Date.now() / 86400000)))} days
                                                </div>
                                            </div>
                                        </div>

                                        {/* Counter offer input */}
                                        <div className="mb-4">
                                            <label className="block text-sm text-gray-400 mb-2">Counter Offer (optional)</label>
                                            <input
                                                type="number"
                                                placeholder={neg.amount.toString()}
                                                value={counterOffers[neg.id] || ''}
                                                onChange={(e) => setCounterOffer(neg.id, e.target.value)}
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <GlassButton
                                                onClick={() => handleResponse(neg.id, 'accept')}
                                                disabled={neg.type === 'acquisition' && neg.amount > balance}
                                                variant="success"
                                            >
                                                ✅ Accept
                                            </GlassButton>
                                            <GlassButton
                                                onClick={() => handleResponse(neg.id, 'counter')}
                                                disabled={!counterOffers[neg.id]}
                                            >
                                                💰 Counter
                                            </GlassButton>
                                            <GlassButton
                                                onClick={() => handleResponse(neg.id, 'reject')}
                                                variant="danger"
                                            >
                                                ❌ Reject
                                            </GlassButton>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </LiquidGlassPanel>
    );
};
