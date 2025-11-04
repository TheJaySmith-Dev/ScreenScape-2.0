import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getAllLeagues,
    getLeaguesByCountry,
    getTeamsInLeague,
    getNextEventsInLeague,
    getLastEventsInLeague,
    League,
    Team,
    Event
} from '../services/sportsService';
import { useAppleTheme } from './AppleThemeProvider';
import Loader from './Loader';

interface SportsViewProps {}

const SportsView: React.FC<SportsViewProps> = () => {
    const { tokens } = useAppleTheme();
    const [leagues, setLeagues] = useState<League[]>([]);
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [nextEvents, setNextEvents] = useState<Event[]>([]);
    const [lastEvents, setLastEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLeagues();
    }, []);

    const fetchLeagues = async () => {
        try {
            setLoading(true);
            const response = await getAllLeagues();
            setLeagues(response.leagues || []);
        } catch (err) {
            setError('Failed to load sports leagues');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeagueData = async (league: League) => {
        try {
            setSelectedLeague(league);
            setLoading(true);

            const [teamsRes, nextEventsRes, lastEventsRes] = await Promise.all([
                getTeamsInLeague(league.idLeague),
                getNextEventsInLeague(league.idLeague),
                getLastEventsInLeague(league.idLeague)
            ]);

            setTeams(teamsRes.teams || []);
            setNextEvents(nextEventsRes.events || []);
            setLastEvents(lastEventsRes.events || []);
        } catch (err) {
            setError('Failed to load league data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && leagues.length === 0) {
        return <Loader />;
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
                minHeight: '100vh',
                padding: `${tokens.spacing.macro[0]}px`,
                background: `linear-gradient(135deg, ${tokens.colors.background.primary}CC, ${tokens.colors.background.secondary}99)`,
                backdropFilter: 'blur(20px)',
            }}
        >
            <motion.h1 
                className="apple-title-1"
                style={{
                    fontSize: `${tokens.typography.sizes.title1}px`,
                    fontWeight: tokens.typography.weights.bold,
                    color: tokens.colors.label.primary,
                    textAlign: 'center',
                    marginBottom: `${tokens.spacing.macro[0]}px`,
                    background: `linear-gradient(135deg, ${tokens.colors.system.blue}, ${tokens.colors.system.purple})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                SportsScape
            </motion.h1>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                            background: `${tokens.colors.system.red}20`,
                            border: `1px solid ${tokens.colors.system.red}40`,
                            borderRadius: `${tokens.spacing.standard[1]}px`,
                            padding: `${tokens.spacing.standard[1]}px`,
                            marginBottom: `${tokens.spacing.macro[0]}px`,
                            color: tokens.colors.system.red,
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {!selectedLeague ? (
                    <motion.div
                        key="leagues"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.4 }}
                    >
                        <motion.h2 
                            className="apple-title-2"
                            style={{
                                fontSize: `${tokens.typography.sizes.title2}px`,
                                fontWeight: tokens.typography.weights.semibold,
                                color: tokens.colors.label.primary,
                                marginBottom: `${tokens.spacing.macro[0]}px`,
                            }}
                        >
                            Select a League
                        </motion.h2>
                        <motion.div 
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: `${tokens.spacing.standard[1]}px`,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            {leagues.slice(0, 50).map((league, index) => (
                                <motion.button
                                    key={league.idLeague}
                                    onClick={() => fetchLeagueData(league)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.4 }}
                                    whileHover={{ 
                                        scale: 1.02,
                                        y: -2,
                                        transition: { duration: 0.2 }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        background: `${tokens.colors.background.secondary}40`,
                                        backdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
                                        border: `1px solid ${tokens.colors.separator.opaque}`,
                                        borderRadius: `${tokens.spacing.standard[1]}px`,
                                        padding: `${tokens.spacing.standard[1]}px`,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                        textAlign: 'left',
                                    }}
                                >
                                    <h3 style={{
                                        fontSize: `${tokens.typography.sizes.headline}px`,
                                        fontWeight: tokens.typography.weights.semibold,
                                        color: tokens.colors.label.primary,
                                        marginBottom: `${tokens.spacing.micro[2]}px`,
                                    }}>
                                        {league.strLeague}
                                    </h3>
                                    <p style={{
                                        fontSize: `${tokens.typography.sizes.body}px`,
                                        color: tokens.colors.label.secondary,
                                        marginBottom: `${tokens.spacing.micro[2]}px`,
                                    }}>
                                        {league.strSport}
                                    </p>
                                    <p style={{
                                        fontSize: `${tokens.typography.sizes.caption1}px`,
                                        color: tokens.colors.label.tertiary,
                                    }}>
                                        {league.strCountry}
                                    </p>
                                </motion.button>
                            ))}
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="league-detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                    >
                        <motion.button
                            onClick={() => setSelectedLeague(null)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                marginBottom: `${tokens.spacing.macro[0]}px`,
                                background: `${tokens.colors.background.secondary}40`,
                                backdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
                                border: `1px solid ${tokens.colors.separator.opaque}`,
                                borderRadius: `${tokens.spacing.standard[1]}px`,
                                padding: `${tokens.spacing.micro[2]}px ${tokens.spacing.standard[1]}px`,
                                color: tokens.colors.label.primary,
                                fontSize: `${tokens.typography.sizes.body}px`,
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            }}
                        >
                            ← Back to Leagues
                        </motion.button>

                        <motion.div 
                            style={{ marginBottom: `${tokens.spacing.macro[1]}px` }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <h2 style={{
                                fontSize: `${tokens.typography.sizes.largeTitle}px`,
                                fontWeight: tokens.typography.weights.bold,
                                color: tokens.colors.label.primary,
                                marginBottom: `${tokens.spacing.micro[2]}px`,
                            }}>
                                {selectedLeague.strLeague}
                            </h2>
                            <p style={{
                                fontSize: `${tokens.typography.sizes.headline}px`,
                                color: tokens.colors.label.secondary,
                                marginBottom: `${tokens.spacing.standard[1]}px`,
                            }}>
                                {selectedLeague.strSport} • {selectedLeague.strCountry}
                            </p>
                            {selectedLeague.strDescriptionEN && (
                                <p style={{
                                    fontSize: `${tokens.typography.sizes.body}px`,
                                    color: tokens.colors.label.tertiary,
                                    lineHeight: tokens.typography.lineHeights.body,
                                }}>
                                    {selectedLeague.strDescriptionEN.substring(0, 300)}...
                                </p>
                            )}
                        </motion.div>

                        <motion.div 
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                                gap: `${tokens.spacing.macro[0]}px`,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            {/* Teams */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                            >
                                <h3 style={{
                                    fontSize: `${tokens.typography.sizes.title3}px`,
                                    fontWeight: tokens.typography.weights.semibold,
                                    color: tokens.colors.label.primary,
                                    marginBottom: `${tokens.spacing.standard[1]}px`,
                                }}>
                                    Teams ({teams.length})
                                </h3>
                                <motion.div 
                                    style={{
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: `${tokens.spacing.micro[2]}px`,
                                    }}
                                >
                                    {teams.map((team, index) => (
                                        <motion.div 
                                            key={team.idTeam}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02, duration: 0.3 }}
                                            whileHover={{ scale: 1.02 }}
                                            style={{
                                                background: `${tokens.colors.background.secondary}40`,
                                                backdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
                                                border: `1px solid ${tokens.colors.separator.opaque}`,
                                                borderRadius: `${tokens.spacing.micro[2]}px`,
                                                padding: `${tokens.spacing.standard[1]}px`,
                                                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: `${tokens.spacing.standard[1]}px`,
                                            }}>
                                                {team.strBadge && (
                                                    <img
                                                        src={team.strBadge}
                                                        alt={team.strTeam}
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                )}
                                                <span style={{
                                                    fontSize: `${tokens.typography.sizes.body}px`,
                                                    fontWeight: tokens.typography.weights.medium,
                                                    color: tokens.colors.label.primary,
                                                }}>
                                                    {team.strTeam}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>

                            {/* Next Events */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.4 }}
                            >
                                <h3 style={{
                                    fontSize: `${tokens.typography.sizes.title3}px`,
                                    fontWeight: tokens.typography.weights.semibold,
                                    color: tokens.colors.label.primary,
                                    marginBottom: `${tokens.spacing.standard[1]}px`,
                                }}>
                                    Upcoming Events
                                </h3>
                                <motion.div 
                                    style={{
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: `${tokens.spacing.standard[1]}px`,
                                    }}
                                >
                                    {nextEvents.slice(0, 10).map((event, index) => (
                                        <motion.div 
                                            key={event.idEvent}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03, duration: 0.3 }}
                                            whileHover={{ scale: 1.02 }}
                                            style={{
                                                background: `${tokens.colors.background.secondary}40`,
                                                backdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
                                                border: `1px solid ${tokens.colors.separator.opaque}`,
                                                borderRadius: `${tokens.spacing.micro[2]}px`,
                                                padding: `${tokens.spacing.standard[1]}px`,
                                                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            }}
                                        >
                                            <div style={{
                                                fontSize: `${tokens.typography.sizes.caption1}px`,
                                                color: tokens.colors.label.secondary,
                                                marginBottom: `${tokens.spacing.micro[2]}px`,
                                            }}>
                                                {event.dateEvent} {event.strTime}
                                            </div>
                                            <div style={{
                                                fontSize: `${tokens.typography.sizes.body}px`,
                                                fontWeight: tokens.typography.weights.medium,
                                                color: tokens.colors.label.primary,
                                            }}>
                                                <div style={{ marginBottom: `${tokens.spacing.micro[2]}px` }}>
                                                    {event.strHomeTeam}
                                                </div>
                                                <div style={{
                                                    textAlign: 'center',
                                                    color: tokens.colors.label.secondary,
                                                    fontSize: `${tokens.typography.sizes.caption1}px`,
                                                    marginBottom: `${tokens.spacing.micro[2]}px`,
                                                }}>
                                                    vs
                                                </div>
                                                <div>{event.strAwayTeam}</div>
                                            </div>
                                            {event.strVenue && (
                                                <div style={{
                                                    fontSize: `${tokens.typography.sizes.caption1}px`,
                                                    color: tokens.colors.label.tertiary,
                                                    marginTop: `${tokens.spacing.micro[2]}px`,
                                                }}>
                                                    {event.strVenue}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                    {nextEvents.length === 0 && (
                                        <div style={{
                                            color: tokens.colors.label.secondary,
                                            textAlign: 'center',
                                            padding: `${tokens.spacing.macro[1]}px`,
                                            fontSize: `${tokens.typography.sizes.body}px`,
                                        }}>
                                            No upcoming events
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>

                            {/* Last Results */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.4 }}
                            >
                                <h3 style={{
                                    fontSize: `${tokens.typography.sizes.title3}px`,
                                    fontWeight: tokens.typography.weights.semibold,
                                    color: tokens.colors.label.primary,
                                    marginBottom: `${tokens.spacing.standard[1]}px`,
                                }}>
                                    Recent Results
                                </h3>
                                <motion.div 
                                    style={{
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: `${tokens.spacing.standard[1]}px`,
                                    }}
                                >
                                    {lastEvents.slice(0, 10).map((event, index) => (
                                        <motion.div 
                                            key={event.idEvent}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03, duration: 0.3 }}
                                            whileHover={{ scale: 1.02 }}
                                            style={{
                                                background: `${tokens.colors.background.secondary}40`,
                                                backdropFilter: `blur(${tokens.materials.glass.regular.blur}px)`,
                                                border: `1px solid ${tokens.colors.separator.opaque}`,
                                                borderRadius: `${tokens.spacing.micro[2]}px`,
                                                padding: `${tokens.spacing.standard[1]}px`,
                                                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            }}
                                        >
                                            <div style={{
                                                fontSize: `${tokens.typography.sizes.caption1}px`,
                                                color: tokens.colors.label.secondary,
                                                marginBottom: `${tokens.spacing.micro[2]}px`,
                                            }}>
                                                {event.dateEvent}
                                            </div>
                                            <div style={{
                                                fontSize: `${tokens.typography.sizes.body}px`,
                                                fontWeight: tokens.typography.weights.medium,
                                                color: tokens.colors.label.primary,
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                }}>
                                                    <span style={{ flex: 1 }}>{event.strHomeTeam}</span>
                                                    <span style={{
                                                        margin: `0 ${tokens.spacing.standard[1]}px`,
                                                        fontSize: `${tokens.typography.sizes.headline}px`,
                                                        fontWeight: tokens.typography.weights.bold,
                                                        color: tokens.colors.system.blue,
                                                    }}>
                                                        {event.intHomeScore}-{event.intAwayScore}
                                                    </span>
                                                    <span style={{ flex: 1, textAlign: 'right' }}>{event.strAwayTeam}</span>
                                                </div>
                                            </div>
                                            {event.strVenue && (
                                                <div style={{
                                                    fontSize: `${tokens.typography.sizes.caption1}px`,
                                                    color: tokens.colors.label.tertiary,
                                                    marginTop: `${tokens.spacing.micro[2]}px`,
                                                }}>
                                                    {event.strVenue}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                    {lastEvents.length === 0 && (
                                        <div style={{
                                            color: tokens.colors.label.secondary,
                                            textAlign: 'center',
                                            padding: `${tokens.spacing.macro[1]}px`,
                                            fontSize: `${tokens.typography.sizes.body}px`,
                                        }}>
                                            No recent results
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SportsView;
