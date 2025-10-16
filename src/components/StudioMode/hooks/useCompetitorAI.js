import { useState, useEffect } from 'react';
import aiClient from '../lib/aiClient';
import { useTmdb } from './useTmdb';
import { useSimulatedTime } from './useSimulatedTime';
import { useStudioGame } from './useStudioGame';

export const useCompetitorAI = () => {
    const [competitors, setCompetitors] = useState(() => {
        const saved = localStorage.getItem('studioMode_competitors');
        return saved ? JSON.parse(saved) : [];
    });

    const { getRandomMovieTitle, getRandomCompanyName, productionCompanies } = useTmdb();
    const { totalDays } = useSimulatedTime();
    const { proposeAcquisition } = useStudioGame();

    // Save competitors to localStorage
    useEffect(() => {
        if (competitors.length > 0) {
            localStorage.setItem('studioMode_competitors', JSON.stringify(competitors));
        }
    }, [competitors]);

    // Generate initial competitors
    const generateCompetitors = async () => {
        // Generate 3 competitors
        const generatedCompetitors = [];

        for (let i = 0; i < 3; i++) {
            const prompt = `Create a realistic entertainment company as a competitor in a media empire simulation game. Include:
{
  "name": "Company Name",
  "balance": between 500000 and 2000000,
  "reputation": between 30 and 80,
  "personality": "a brief personality description for AI decision making, e.g. 'aggressive expando', 'conservative blockbuster maker',
  "focus": "primary focus: films, parks, or acquisitions"
}`;

            const competitorData = await aiClient.callAIJSON(prompt);

            if (competitorData) {
                generatedCompetitors.push({
                    id: `ai_${Date.now()}_${i}`,
                    name: competitorData.name || getRandomCompanyName(),
                    balance: competitorData.balance || Math.floor(Math.random() * 1500000) + 500000,
                    reputation: competitorData.reputation || Math.floor(Math.random() * 50) + 30,
                    personality: competitorData.personality || 'balanced approach to media production',
                    focus: competitorData.focus || 'films',
                    lastActionDay: totalDays - Math.floor(Math.random() * 7) // Some already acted recently
                });
            } else {
                // Fallback
                generatedCompetitors.push({
                    id: `ai_${Date.now()}_${i}`,
                    name: getRandomCompanyName(),
                    balance: Math.floor(Math.random() * 1500000) + 500000,
                    reputation: Math.floor(Math.random() * 50) + 30,
                    personality: 'balanced producer',
                    focus: 'films',
                    lastActionDay: totalDays
                });
            }
        }

        setCompetitors(generatedCompetitors);
    };

    // Initialize competitors if none exist
    useEffect(() => {
        if (competitors.length === 0 && productionCompanies.length > 0) {
            generateCompetitors();
        }
    }, [competitors.length, productionCompanies.length, getRandomCompanyName]);

    // AI weekly actions
    useEffect(() => {
        const aiActionTimer = setInterval(async () => {
            const competitorsToAct = competitors.filter(comp => totalDays - comp.lastActionDay >= 7);

            for (const competitor of competitorsToAct) {
                await performAIAction(competitor);
            }
        }, 7000); // Every 7 seconds (7 game days)

        return () => clearInterval(aiActionTimer);
    }, [competitors, totalDays, getRandomMovieTitle]);

    const performAIAction = async (competitor) => {
        const prompt = `You are ${competitor.name}, a ${competitor.personality} media studio with $${competitor.balance.toLocaleString()} budget and ${competitor.reputation} reputation.

Choose ONE action to take this week from these options:
1. Produce content (movie-series) - costs ~$50k-100k, revenue potential high
2. Build park attraction - costs ~$200k-400k, long-term income
3. Make acquisition offer - try to buy another company
4. Idle - conserve resources

Consider your personality and current status. Return ONLY this JSON:
{
  "action": "produce|build|offer|idle",
  "details": {
    "title": "content title if producing",
    "target": "company name if acquiring",
    "cost": number,
    "rationale": "brief explanation of your decision"
  }
}`;

        const actionData = await aiClient.callAIJSON(prompt);

        if (actionData?.action) {
            let actionResult = null;

            switch (actionData.action) {
                case 'produce':
                    const prodCost = actionData.details?.cost || Math.floor(Math.random() * 50000) + 50000;
                    if (competitor.balance >= prodCost) {
                        actionResult = {
                            action: 'produce',
                            title: actionData.details?.title || getRandomMovieTitle(),
                            cost: prodCost,
                            revenue: Math.floor(Math.random() * 300000) + 100000
                        };
                        // Deduct cost
                        setCompetitors(prev => prev.map(c =>
                            c.id === competitor.id
                                ? { ...c, balance: c.balance - prodCost, lastActionDay: totalDays }
                                : c
                        ));
                    }
                    break;

                case 'build':
                    const buildCost = actionData.details?.cost || Math.floor(Math.random() * 200000) + 200000;
                    if (competitor.balance >= buildCost) {
                        actionResult = {
                            action: 'build',
                            attraction: `New Attraction at ${competitor.name} Park`,
                            cost: buildCost,
                            revenue: Math.floor(Math.random() * 5000) + 3000
                        };
                        setCompetitors(prev => prev.map(c =>
                            c.id === competitor.id
                                ? { ...c, balance: c.balance - buildCost, lastActionDay: totalDays }
                                : c
                        ));
                    }
                    break;

                case 'offer':
                    // Create acquisition offer to player
                    const offerAmount = Math.floor(Math.random() * 500000) + 100000;
                    await proposeAcquisition(competitor.id);
                    actionResult = {
                        action: 'offer',
                        target: 'Player Studio',
                        amount: offerAmount,
                        rationale: actionData.details?.rationale || 'Strategic acquisition opportunity'
                    };
                    break;

                case 'idle':
                    actionResult = {
                        action: 'idle',
                        rationale: actionData.details?.rationale || 'Conserving resources for future opportunities'
                    };
                    break;
            }

            // Log competitor action
            if (actionResult) {
                console.log(`${competitor.name}:`, actionResult);
            }
        } else {
            // Fallback random action
            performFallbackAction(competitor);
        }
    };

    const performFallbackAction = (competitor) => {
        const actions = ['produce', 'build', 'offer', 'idle'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];

        switch (randomAction) {
            case 'produce':
                const prodCost = Math.floor(Math.random() * 50000) + 50000;
                if (competitor.balance >= prodCost) {
                    setCompetitors(prev => prev.map(c =>
                        c.id === competitor.id
                            ? { ...c, balance: c.balance - prodCost, lastActionDay: totalDays }
                            : c
                    ));
                }
                break;
            case 'build':
                const buildCost = Math.floor(Math.random() * 200000) + 200000;
                if (competitor.balance >= buildCost) {
                    setCompetitors(prev => prev.map(c =>
                        c.id === competitor.id
                            ? { ...c, balance: c.balance - buildCost, lastActionDay: totalDays }
                            : c
                    ));
                }
                break;
            case 'offer':
                proposeAcquisition(competitor.id);
                break;
        }
    };

    const getCompetitorStats = () => {
        return competitors.map(comp => ({
            name: comp.name,
            balance: comp.balance,
            reputation: comp.reputation,
            lastAction: `${7 - (totalDays - comp.lastActionDay)} days until next decision`
        }));
    };

    return {
        competitors,
        generateCompetitors,
        getCompetitorStats
    };
};
