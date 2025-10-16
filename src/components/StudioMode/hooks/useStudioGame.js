import { useState, useEffect, useCallback, useRef } from 'react';
import aiClient from '../lib/aiClient';
import { useTmdb } from './useTmdb';
import { useSimulatedTime } from './useSimulatedTime';

export const useStudioGame = () => {
    const { getRandomMovieTitle, getRandomCompanyName } = useTmdb();
    const { totalDays } = useSimulatedTime();

    const [gameState, setGameState] = useState(() => {
        const saved = localStorage.getItem('studioMode_gameState');
        return saved ? JSON.parse(saved) : {
            balance: 1000000, // Starting budget
            reputation: 50, // 0-100 scale
            productions: [], // Active/in-progress productions
            parkAttractions: [], // Active park projects
            negotiations: [], // Pending offers/negotiations
            events: [], // Random industry events
            companyName: 'Player Studio' // Default name, can be customized
        };
    });

    const lastProcessedDayRef = useRef(totalDays);

    // Save game state to localStorage
    useEffect(() => {
        localStorage.setItem('studioMode_gameState', JSON.stringify(gameState));
    }, [gameState]);

    // Process day changes - handle completions, payments, etc.
    useEffect(() => {
        if (totalDays > lastProcessedDayRef.current) {
            lastProcessedDayRef.current = totalDays;

            setGameState(prev => {
                let newState = { ...prev };

                // Process production completions
                newState.productions = newState.productions.filter(prod => {
                    if (prod.completionDay <= totalDays) {
                        // Production completed - pay profit
                        newState.balance += prod.revenue;
                        newState.reputation += prod.repGain;
                        // Add event about completion
                        newState.events.unshift({
                            id: Date.now(),
                            day: totalDays,
                            type: 'production_complete',
                            title: `${prod.title} has completed!`,
                            description: `Earned $${prod.revenue.toLocaleString()} and +${prod.repGain} reputation.`,
                            impact: { balance: prod.revenue, reputation: prod.repGain },
                            timestamp: new Date().toISOString()
                        });
                        return false; // Remove from active productions
                    }
                    return true;
                });

                // Process park attraction completions
                newState.parkAttractions = newState.parkAttractions.filter(attr => {
                    if (attr.completionDay <= totalDays) {
                        newState.balance += attr.revenue;
                        newState.reputation += attr.repGain;
                        newState.events.unshift({
                            id: Date.now(),
                            day: totalDays,
                            type: 'park_complete',
                            title: `${attr.name} attraction is now open!`,
                            description: `Daily income: $${attr.revenue}, Popularity bonus: +${attr.repGain}`,
                            impact: { balance: attr.revenue, reputation: attr.repGain },
                            timestamp: new Date().toISOString()
                        });
                        return false;
                    }
                    return true;
                });

                // Process negotiation expiries
                newState.negotiations = newState.negotiations.filter(neg => {
                    if (neg.expiryDay <= totalDays) {
                        newState.events.unshift({
                            id: Date.now(),
                            day: totalDays,
                            type: 'negotiation_expired',
                            title: `${neg.fromCompanyName}'s ${neg.type} offer expired.`,
                            description: 'The offer is no longer available.',
                            impact: { balance: 0, reputation: -1 }, // Small reputation hit
                            timestamp: new Date().toISOString()
                        });
                        newState.reputation = Math.max(0, newState.reputation - 1);
                        return false;
                    }
                    return true;
                });

                return newState;
            });
        }
    }, [totalDays]);

    // Generate random industry event every 60 seconds
    const generateRandomEvent = useCallback(async () => {
        const prompt = `Generate a random entertainment industry event that affects media companies. The event should have financial and reputation impacts. Describe it from the perspective of how it affects my media studio empire.

Available companies: ${getRandomCompanyName()}, ${getRandomCompanyName()}

Format as JSON with:
{
  "title": "Event Title",
  "description": "Detailed description",
  "balanceImpact": number (-100000 to +50000),
  "reputationImpact": number (-10 to +10)
}`;

        const eventData = await aiClient.callAIJSON(prompt);
        if (eventData) {
            setGameState(prev => ({
                ...prev,
                events: [{
                    id: Date.now(),
                    type: 'industry_event',
                    day: totalDays,
                    ...eventData,
                    impact: {
                        balance: eventData.balanceImpact || 0,
                        reputation: eventData.reputationImpact || 0
                    },
                    timestamp: new Date().toISOString()
                }, ...prev.events.slice(0, 19)] // Keep only last 20 events
            }));

            // Apply event effects
            setGameState(prev => ({
                ...prev,
                balance: Math.max(0, prev.balance + (eventData.balanceImpact || 0)),
                reputation: Math.max(0, Math.min(100, prev.reputation + (eventData.reputationImpact || 0)))
            }));
        } else {
            // Fallback event
            const fallbackEvent = {
                id: Date.now(),
                type: 'industry_event',
                day: totalDays,
                title: "Industry Trends Shift",
                description: "Market conditions have changed, affecting all studios.",
                impact: { balance: Math.random() * 10000 - 5000, reputation: Math.random() * 4 - 2 },
                timestamp: new Date().toISOString()
            };
            setGameState(prev => ({
                ...prev,
                events: [fallbackEvent, ...prev.events.slice(0, 19)],
                balance: Math.max(0, prev.balance + fallbackEvent.impact.balance),
                reputation: Math.max(0, Math.min(100, prev.reputation + fallbackEvent.impact.reputation))
            }));
        }
    }, [totalDays, getRandomCompanyName]);

    // Random event timer
    useEffect(() => {
        const eventTimer = setInterval(generateRandomEvent, 60000); // Every 60 seconds
        return () => clearInterval(eventTimer);
    }, [generateRandomEvent]);

    // User actions
    const produceMovie = useCallback(async () => {
        const cost = 50000;
        if (gameState.balance < cost) return { success: false, message: 'Insufficient funds' };

        const title = getRandomMovieTitle();
        const completionDays = 30; // 30 days production
        const revenue = Math.floor(Math.random() * 500000) + 100000;
        const repGain = Math.floor(Math.random() * 10) + 5;

        const newProduction = {
            id: Date.now(),
            title,
            type: 'movie',
            startDay: totalDays,
            completionDay: totalDays + completionDays,
            cost,
            revenue,
            repGain,
            progress: 0
        };

        setGameState(prev => ({
            ...prev,
            balance: prev.balance - cost,
            productions: [...prev.productions, newProduction]
        }));

        return { success: true, message: `Started production of "${title}"` };
    }, [gameState.balance, getRandomMovieTitle, totalDays]);

    const buildParkAttraction = useCallback(async () => {
        const cost = 200000;
        if (gameState.balance < cost) return { success: false, message: 'Insufficient funds' };

        const attractionNames = ['Thrill Ride', 'Character Meet & Greet', '4D Theater', 'Racing Experience'];
        const name = `${attractionNames[Math.floor(Math.random() * attractionNames.length)]} at ${getRandomCompanyName()} Park`;
        const completionDays = 60; // Park builds take longer
        const revenue = Math.floor(Math.random() * 10000) + 5000; // Daily income
        const repGain = Math.floor(Math.random() * 5) + 2;

        const newAttraction = {
            id: Date.now(),
            name,
            type: 'park',
            startDay: totalDays,
            completionDay: totalDays + completionDays,
            cost,
            revenue,
            repGain,
            progress: 0
        };

        setGameState(prev => ({
            ...prev,
            balance: prev.balance - cost,
            parkAttractions: [...prev.parkAttractions, newAttraction]
        }));

        return { success: true, message: `Started building "${name}"` };
    }, [gameState.balance, getRandomCompanyName, totalDays]);

    const proposeAcquisition = useCallback(async (targetCompanyId = null) => {
        // For now, create a generic acquisition offer (in real game, would be triggered by AI)
        const targetCompany = getRandomCompanyName();
        const cost = Math.floor(Math.random() * 2000000) + 500000;

        const negotiation = {
            id: Date.now(),
            type: 'acquisition',
            fromCompanyId: 'ai_' + Date.now(),
            fromCompanyName: targetCompany,
            targetCompany: gameState.companyName,
            amount: cost,
            rationale: `${targetCompany} is offering to be acquired by ${gameState.companyName} for synergy benefits.`,
            expiryDay: totalDays + 7, // 7 days to respond
            status: 'pending'
        };

        setGameState(prev => ({
            ...prev,
            negotiations: [...prev.negotiations, negotiation]
        }));

        return { success: true, message: `New acquisition offer from ${targetCompany}` };
    }, [getRandomCompanyName, totalDays, gameState.companyName]);

    const handleNegotiationResponse = useCallback(async (negotiationId, action, counterAmount = null) => {
        const negotiation = gameState.negotiations.find(n => n.id === negotiationId);
        if (!negotiation || negotiation.status !== 'pending') return { success: false, message: 'Negotiation not found or already resolved' };

        if (action === 'accept') {
            if (negotiation.type === 'acquisition' && gameState.balance >= negotiation.amount) {
                setGameState(prev => ({
                    ...prev,
                    balance: prev.balance - negotiation.amount,
                    reputation: Math.min(100, prev.reputation + 10),
                    negotiations: prev.negotiations.map(n =>
                        n.id === negotiationId ? { ...n, status: 'accepted' } : n
                    )
                }));
                return { success: true, message: `Successfully acquired ${negotiation.fromCompanyName}!` };
            } else if (negotiation.type === 'sale' && negotiation.amount > 0) {
                setGameState(prev => ({
                    ...prev,
                    balance: prev.balance + negotiation.amount,
                    reputation: Math.min(100, prev.reputation + 5),
                    negotiations: prev.negotiations.map(n =>
                        n.id === negotiationId ? { ...n, status: 'accepted' } : n
                    )
                }));
                return { success: true, message: `Successfully sold to ${negotiation.fromCompanyName}!` };
            }
        } else if (action === 'reject') {
            setGameState(prev => ({
                ...prev,
                negotiations: prev.negotiations.map(n =>
                    n.id === negotiationId ? { ...n, status: 'rejected' } : n
                )
            }));
            return { success: true, message: 'Offer rejected' };
        } else if (action === 'counter' && counterAmount) {
            // AI would re-evaluate the counter here, but for simplicity, accept it 50% of time
            const aiAccepts = Math.random() > 0.5;
            if (aiAccepts) {
                setGameState(prev => ({
                    ...prev,
                    balance: negotiation.type === 'acquisition' ?
                        prev.balance - counterAmount :
                        prev.balance + counterAmount,
                    negotiations: prev.negotiations.map(n =>
                        n.id === negotiationId ? { ...n, status: 'accepted', amount: counterAmount } : n
                    )
                }));
                return { success: true, message: `Counter accepted! Deal finalized for $${counterAmount.toLocaleString()}` };
            } else {
                setGameState(prev => ({
                    ...prev,
                    negotiations: prev.negotiations.map(n =>
                        n.id === negotiationId ? { ...n, status: 'counter_rejected' } : n
                    )
                }));
                return { success: false, message: 'Counter offer rejected by the other party' };
            }
        }

        return { success: false, message: 'Invalid action or insufficient funds' };
    }, [gameState]);

    const resetGame = useCallback(() => {
        localStorage.removeItem('studioMode_gameState');
        localStorage.removeItem('studioMode_simulatedTime');
        window.location.reload(); // Simple reset
    }, []);

    return {
        ...gameState,
        produceMovie,
        buildParkAttraction,
        proposeAcquisition,
        handleNegotiationResponse,
        resetGame,
        generateRandomEvent // For test/debug
    };
};
