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
        primary: "bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/90 hover:to-emerald-600/90",
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

export const ThemeParkPanel = ({ parkAttractions, balance, onBuildAttraction }) => {
    const [selectedType, setSelectedType] = useState('ride');

    const attractionTypes = [
        {
            id: 'ride',
            name: 'Thrill Ride',
            cost: 200000,
            duration: '60 days',
            revenue: '$3k - $10k/day',
            icon: '🎢',
            description: 'High-energy attractions that draw crowds'
        },
        {
            id: 'character',
            name: 'Character Meet & Greet',
            cost: 150000,
            duration: '45 days',
            revenue: '$2k - $8k/day',
            icon: '🎭',
            description: 'Popular with families and photo opportunities'
        },
        {
            id: 'show',
            name: 'Live Show Theater',
            cost: 300000,
            duration: '90 days',
            revenue: '$5k - $15k/day',
            icon: '🎪',
            description: 'Spectacular performances with seating capacity'
        },
        {
            id: 'interactive',
            name: 'Interactive Experience',
            cost: 250000,
            duration: '75 days',
            revenue: '$4k - $12k/day',
            icon: '🎮',
            description: 'Modern tech-based immersive experiences'
        },
        {
            id: 'dining',
            name: 'Themed Restaurant',
            cost: 400000,
            duration: '120 days',
            revenue: '$6k - $20k/day',
            icon: '🍽️',
            description: 'Dinner shows and signature dining experiences'
        },
        {
            id: 'hotel',
            name: 'Theme Hotel',
            cost: 1000000,
            duration: '180 days',
            revenue: '$20k - $50k/day',
            icon: '🏨',
            description: 'Luxury accommodation with themed experiences'
        }
    ];

    const handleBuild = async () => {
        const result = await onBuildAttraction();
        if (result?.success) {
            console.log(result.message);
        } else {
            console.log(result?.message || 'Failed to build attraction');
        }
    };

    const selectedAttraction = attractionTypes.find(a => a.id === selectedType);
    const totalDailyRevenue = parkAttractions.reduce((sum, attr) => sum + attr.revenue, 0);
    const totalAttractions = parkAttractions.length;

    return (
        <LiquidGlassPanel>
            <div className="space-y-6">
                <div className="text-center">
                    <motion.h3
                        className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        🎢 Theme Park Empire
                    </motion.h3>
                    <p className="text-gray-300 text-sm">Build magical experiences that generate recurring revenue</p>
                </div>

                {/* Stats Overview */}
                {(totalAttractions > 0 || totalDailyRevenue > 0) && (
                    <motion.div
                        className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-4 border border-green-400/30"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">{totalAttractions}</div>
                                <div className="text-sm text-gray-300">Attractions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">${totalDailyRevenue.toLocaleString()}/day</div>
                                <div className="text-sm text-gray-300">Daily Revenue</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Attraction Type Selection */}
                <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {attractionTypes.map((type, index) => (
                        <motion.div
                            key={type.id}
                            className={`
                                p-4 rounded-2xl cursor-pointer transition-all duration-300 border
                                ${selectedType === type.id
                                    ? 'bg-green-500/30 border-green-400/50 shadow-lg'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                }
                            `}
                            onClick={() => setSelectedType(type.id)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="text-2xl flex-shrink-0">{type.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm leading-tight">{type.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        ${type.cost.toLocaleString()} • {type.duration}
                                    </div>
                                    <div className="text-xs font-semibold text-green-400 mt-1">{type.revenue}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Selected Attraction Details */}
                {selectedAttraction && (
                    <motion.div
                        className="bg-white/5 rounded-2xl p-4 border border-white/10"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-gray-400">Construction Time</div>
                                <div className="font-semibold">{selectedAttraction.duration}</div>
                            </div>
                            <div>
                                <div className="text-gray-400">Daily Revenue</div>
                                <div className="font-semibold text-green-400">{selectedAttraction.revenue}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-gray-400">Description</div>
                                <div className="font-semibold text-xs mt-1">{selectedAttraction.description}</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Active Attractions */}
                {parkAttractions.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg">Construction & Attractions</h4>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {parkAttractions.map((attr, index) => (
                                <motion.div
                                    key={attr.id}
                                    className="bg-white/5 rounded-xl p-3 border border-white/10"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                {/* Find icon based on name */}
                                                {attr.name.includes('Ride') || attr.name.includes('Thrill') ? '🎢' :
                                                 attr.name.includes('Character') ? '🎭' :
                                                 attr.name.includes('Theater') ? '🎪' :
                                                 attr.name.includes('Experience') ? '🎮' :
                                                 attr.name.includes('Restaurant') ? '🍽️' :
                                                 '🎡'}
                                                {attr.name}
                                            </div>
                                            <div className="text-xs text-gray-400">Started {attr.startDay}d ago • +${attr.revenue}/day</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400">Completion</div>
                                            <div className="font-semibold text-sm">
                                                {attr.completionDay > Date.now() / 86400000 ?
                                                    `${attr.completionDay - attr.startDay}d` :
                                                    'Complete'}
                                            </div>
                                        </div>
                                    </div>
                                    {attr.completionDay > Date.now() / 86400000 && (
                                        <div className="mt-2">
                                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                                                    initial={{ width: '0%' }}
                                                    animate={{
                                                        width: `${Math.max(0, Math.min(100, (((Date.now() / 86400000) - attr.startDay) / (attr.completionDay - attr.startDay)) * 100))}%`
                                                    }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Build Button */}
                <div className="flex justify-center pt-4">
                    <GlassButton
                        onClick={handleBuild}
                        disabled={balance < (selectedAttraction?.cost || 0)}
                        variant="primary"
                    >
                        <span className="flex items-center gap-2">
                            🚧 Build Attraction
                            <span className="text-xs opacity-80">
                                (${selectedAttraction?.cost.toLocaleString()})
                            </span>
                        </span>
                    </GlassButton>
                </div>

                {balance < (selectedAttraction?.cost || 0) && (
                    <motion.div
                        className="text-center text-red-400 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        Insufficient funds for this attraction
                    </motion.div>
                )}
            </div>
        </LiquidGlassPanel>
    );
};
