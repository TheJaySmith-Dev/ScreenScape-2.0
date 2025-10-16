import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

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
        primary: "bg-gradient-to-r from-blue-500/80 to-cyan-500/80 hover:from-blue-600/90 hover:to-cyan-600/90",
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

export const ProductionPanel = ({ productions, balance, onProduceMovie, onProduceSeries }) => {
    const [selectedType, setSelectedType] = useState('movie');

    const productionTypes = [
        {
            id: 'movie',
            name: 'Feature Film',
            cost: 50000,
            duration: '30 days',
            revenue: '$100k - $600k',
            icon: '🎬'
        },
        {
            id: 'series',
            name: 'TV Series',
            cost: 80000,
            duration: '45 days',
            revenue: '$150k - $900k',
            icon: '📺'
        },
        {
            id: 'short',
            name: 'Short Film',
            cost: 25000,
            duration: '15 days',
            revenue: '$20k - $150k',
            icon: '🎭'
        }
    ];

    const handleProduce = async () => {
        let result;
        switch (selectedType) {
            case 'movie':
                result = await onProduceMovie();
                break;
            case 'series':
                result = await onProduceSeries();
                break;
            case 'short':
                result = await onProduceMovie(); // For now, reuse movie logic
                break;
        }

        if (result?.success) {
            // Show success animation/message
            console.log(result.message);
        } else {
            // Show error message
            console.log(result?.message || 'Production failed');
        }
    };

    const selectedProduction = productionTypes.find(p => p.id === selectedType);

    return (
        <LiquidGlassPanel>
            <div className="space-y-6">
                <div className="text-center">
                    <motion.h3
                        className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        🎬 Production Studio
                    </motion.h3>
                    <p className="text-gray-300 text-sm">Create captivating stories for audiences worldwide</p>
                </div>

                {/* Production Type Selection */}
                <div className="grid grid-cols-3 gap-3">
                    {productionTypes.map((type, index) => (
                        <motion.div
                            key={type.id}
                            className={`
                                p-4 rounded-2xl cursor-pointer transition-all duration-300
                                ${selectedType === type.id
                                    ? 'bg-blue-500/30 border-2 border-blue-400/50'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                }
                            `}
                            onClick={() => setSelectedType(type.id)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="text-center">
                                <div className="text-3xl mb-2">{type.icon}</div>
                                <div className="font-semibold text-sm">{type.name}</div>
                                <div className="text-xs text-gray-400 mt-1">${type.cost.toLocaleString()}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Selected Production Details */}
                {selectedProduction && (
                    <motion.div
                        className="bg-white/5 rounded-2xl p-4 border border-white/10"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-gray-400">Duration</div>
                                <div className="font-semibold">{selectedProduction.duration}</div>
                            </div>
                            <div>
                                <div className="text-gray-400">Revenue Range</div>
                                <div className="font-semibold text-green-400">{selectedProduction.revenue}</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Active Productions */}
                {productions.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-lg">Active Productions</h4>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {productions.map((prod, index) => (
                                <motion.div
                                    key={prod.id}
                                    className="bg-white/5 rounded-xl p-3 border border-white/10"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold text-sm">{prod.title}</div>
                                            <div className="text-xs text-gray-400">{prod.type} • Started {prod.startDay}d ago</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400">Completions in</div>
                                            <div className="font-semibold text-sm">{prod.completionDay - prod.startDay}d</div>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                                                initial={{ width: '0%' }}
                                                animate={{
                                                    width: `${Math.max(0, Math.min(100, ((prod.completionDay - new Date().getTime() / 86400000 + prod.startDay) / (prod.completionDay - prod.startDay)) * 100))}%`
                                                }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Produce Button */}
                <div className="flex justify-center pt-4">
                    <GlassButton
                        onClick={handleProduce}
                        disabled={balance < (selectedProduction?.cost || 0)}
                    >
                        <span className="flex items-center gap-2">
                            {selectedProduction?.icon} Start Production
                            <span className="text-xs opacity-80">
                                (${selectedProduction?.cost.toLocaleString()})
                            </span>
                        </span>
                    </GlassButton>
                </div>

                {balance < (selectedProduction?.cost || 0) && (
                    <motion.div
                        className="text-center text-red-400 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        Insufficient funds for this production
                    </motion.div>
                )}
            </div>
        </LiquidGlassPanel>
    );
};
