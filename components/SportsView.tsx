import React, { useState, useEffect } from 'react';
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
import Loader from './Loader';

interface SportsViewProps {}

const SportsView: React.FC<SportsViewProps> = () => {
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-4xl font-bold mb-8 text-center">SportsScape</h1>

            {error && (
                <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {!selectedLeague ? (
                <div>
                    <h2 className="text-2xl font-bold mb-6">Select a League</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {leagues.slice(0, 50).map((league) => (
                            <div
                                key={league.idLeague}
                                onClick={() => fetchLeagueData(league)}
                                className="bg-glass border border-slate-700 rounded-lg p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                            >
                                <h3 className="font-bold text-lg mb-2">{league.strLeague}</h3>
                                <p className="text-slate-400 text-sm mb-2">{league.strSport}</p>
                                <p className="text-slate-300 text-sm">{league.strCountry}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    <button
                        onClick={() => setSelectedLeague(null)}
                        className="mb-6 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
                    >
                        ← Back to Leagues
                    </button>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold mb-2">{selectedLeague.strLeague}</h2>
                        <p className="text-slate-400">{selectedLeague.strSport} • {selectedLeague.strCountry}</p>
                        {selectedLeague.strDescriptionEN && (
                            <p className="text-slate-300 mt-4">{selectedLeague.strDescriptionEN.substring(0, 300)}...</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Teams */}
                        <div>
                            <h3 className="text-xl font-bold mb-4">Teams ({teams.length})</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {teams.map((team) => (
                                    <div key={team.idTeam} className="bg-glass border border-slate-700 rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            {team.strBadge && (
                                                <img
                                                    src={team.strBadge}
                                                    alt={team.strTeam}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            )}
                                            <span className="font-medium">{team.strTeam}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Next Events */}
                        <div>
                            <h3 className="text-xl font-bold mb-4">Upcoming Events</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {nextEvents.slice(0, 10).map((event) => (
                                    <div key={event.idEvent} className="bg-glass border border-slate-700 rounded-lg p-3">
                                        <div className="text-sm text-slate-400 mb-1">{event.dateEvent} {event.strTime}</div>
                                        <div className="font-medium">
                                            <div className="truncate">{event.strHomeTeam}</div>
                                            <div className="text-center text-slate-400">vs</div>
                                            <div className="truncate">{event.strAwayTeam}</div>
                                        </div>
                                        {event.strVenue && (
                                            <div className="text-xs text-slate-400 mt-1">{event.strVenue}</div>
                                        )}
                                    </div>
                                ))}
                                {nextEvents.length === 0 && (
                                    <div className="text-slate-400 text-center py-8">No upcoming events</div>
                                )}
                            </div>
                        </div>

                        {/* Last Results */}
                        <div>
                            <h3 className="text-xl font-bold mb-4">Recent Results</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {lastEvents.slice(0, 10).map((event) => (
                                    <div key={event.idEvent} className="bg-glass border border-slate-700 rounded-lg p-3">
                                        <div className="text-sm text-slate-400 mb-1">{event.dateEvent}</div>
                                        <div className="font-medium">
                                            <div className="flex justify-between items-center">
                                                <span className="truncate flex-1">{event.strHomeTeam}</span>
                                                <span className="mx-2 font-bold text-lg">
                                                    {event.intHomeScore}-{event.intAwayScore}
                                                </span>
                                                <span className="truncate flex-1 text-right">{event.strAwayTeam}</span>
                                            </div>
                                        </div>
                                        {event.strVenue && (
                                            <div className="text-xs text-slate-400 mt-1">{event.strVenue}</div>
                                        )}
                                    </div>
                                ))}
                                {lastEvents.length === 0 && (
                                    <div className="text-slate-400 text-center py-8">No recent results</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SportsView;
