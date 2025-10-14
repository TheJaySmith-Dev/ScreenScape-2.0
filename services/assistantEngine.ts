import * as tmdbService from './tmdbService';
import { MediaItem, MovieDetails, TVShowDetails } from '../types';
import { queryOpenRouter } from '../components/openrouter.js';

type CommandResult = { success: boolean; message: string; action?: 'close' };

// --- Helper Functions ---

async function searchAndGetDetails(title: string, tmdbApiKey: string, region: string): Promise<{ details: MovieDetails | TVShowDetails, media_type: 'movie' | 'tv' } | null> {
    try {
        const searchRes = await tmdbService.searchMulti(tmdbApiKey, title);
        const item = searchRes.results.find((i): i is MediaItem => 
            'media_type' in i && (i.media_type === 'movie' || i.media_type === 'tv')
        );

        if (!item) return null;

        const details = item.media_type === 'movie'
            ? await tmdbService.getMovieDetails(tmdbApiKey, item.id, region)
            : await tmdbService.getTVShowDetails(tmdbApiKey, item.id, region);
        
        return { details, media_type: item.media_type };
    } catch (error) {
        console.error("Error in searchAndGetDetails:", error);
        return null;
    }
}

function formatRevenue(revenue: number): string {
    if (revenue >= 1_000_000_000) {
        return `$${(revenue / 1_000_000_000).toFixed(2)} billion`;
    }
    if (revenue >= 1_000_000) {
        return `$${(revenue / 1_000_000).toFixed(1)} million`;
    }
    return `$${revenue.toLocaleString()}`;
}

// --- Fact-finding Logic ---

export async function getFactAboutMedia(title: string, factType: string, tmdbApiKey: string, region: string): Promise<CommandResult> {
    const result = await searchAndGetDetails(title, tmdbApiKey, region);
    if (!result) {
        return { success: false, message: `Sorry, I couldn't find anything called "${title}".` };
    }
    
    const { details } = result;
    const mediaTitle = 'title' in details ? details.title : details.name;

    switch (factType) {
        case 'release_date':
            if (details.media_type === 'movie') {
                const releaseDates = await tmdbService.getMovieReleaseDates(tmdbApiKey, details.id);
                const countryRelease = releaseDates.results.find(r => r.iso_3166_1 === region);
                
                if (countryRelease && countryRelease.release_dates.length > 0) {
                    // Find the best release date type: 3 (Theatrical) > 2 (Theatrical limited) > 1 (Premiere)
                    const bestRelease = countryRelease.release_dates.find(rd => rd.type === 3) ||
                                      countryRelease.release_dates.find(rd => rd.type === 2) ||
                                      countryRelease.release_dates.find(rd => rd.type === 1) ||
                                      countryRelease.release_dates[0]; // Fallback to the first one

                    if (bestRelease) {
                        const date = new Date(bestRelease.release_date).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
                        return { success: true, message: `${mediaTitle} was released on ${date} in ${region}.` };
                    }
                }
            }
            // Fallback for TV or movies without a specific regional release
            const releaseDate = 'release_date' in details ? details.release_date : details.first_air_date;
            if (releaseDate) {
                 // Manually parse YYYY-MM-DD to avoid timezone issues.
                 const parts = releaseDate.split('-');
                 const year = parseInt(parts[0], 10);
                 const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
                 const day = parseInt(parts[2], 10);
                 const date = new Date(Date.UTC(year, month, day));
                 const formattedDate = date.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
                 return { success: true, message: `${mediaTitle}'s initial release was on ${formattedDate}.` };
            }
            break;

        case 'director':
            if (details.media_type === 'movie') {
                const director = details.credits.crew.find(c => c.job === 'Director');
                if (director) {
                    return { success: true, message: `${mediaTitle} was directed by ${director.name}.` };
                }
            } else {
                 return { success: false, message: `Director information is typically available for movies, not TV shows.` };
            }
            break;

        case 'cast':
            const cast = details.credits.cast.slice(0, 4).map(c => c.name).join(', ');
            if (cast) {
                return { success: true, message: `${mediaTitle} stars ${cast}.` };
            }
            break;

        case 'runtime':
             if (details.media_type === 'movie' && details.runtime) {
                return { success: true, message: `${mediaTitle} has a runtime of ${details.runtime} minutes.` };
            }
            if (details.media_type === 'tv' && details.episode_run_time && details.episode_run_time.length > 0) {
                 return { success: true, message: `${mediaTitle} has an average episode runtime of ${details.episode_run_time[0]} minutes.` };
            }
            break;
        
        case 'box_office':
            if (details.media_type === 'movie' && details.revenue && details.revenue > 0) {
                return { success: true, message: `${mediaTitle} earned ${formatRevenue(details.revenue)} at the global box office.` };
            }
            break;
    }

    return { success: false, message: `Sorry, I couldn't find that information for ${mediaTitle}.` };
}


// --- Command Processors ---

export async function processAssistantCommand(command: string, tmdbApiKey: string, region: string): Promise<CommandResult> {
    const lowerCaseCommand = command.toLowerCase().trim();

    const patterns: { regex: RegExp, factType: string }[] = [
        { regex: /^(?:when did|what's the release date for|when does) (.+) (?:come out|release)/i, factType: 'release_date' },
        { regex: /^(?:who directed) (.+)/i, factType: 'director' },
        { regex: /^(?:who's in the cast of|who stars in) (.+)/i, factType: 'cast' },
        { regex: /^(?:how long is) (.+)/i, factType: 'runtime' },
        { regex: /^(?:how much did|what's the box office for|what was the revenue for) (.+) make/i, factType: 'box_office' },
    ];

    for (const pattern of patterns) {
        const match = lowerCaseCommand.match(pattern.regex);
        if (match?.[1]) {
            const title = match[1].trim().replace(/[?.!]$/, '').trim();
            return getFactAboutMedia(title, pattern.factType, tmdbApiKey, region);
        }
    }

    const takeToMatch = lowerCaseCommand.match(/^(?:take me to|show me|open|go to)\s+(.+)/);
    if (takeToMatch?.[1]) {
        const title = takeToMatch[1].trim().replace(/[?.!]$/, '').trim();
        return findAndSelectMediaItem(title, tmdbApiKey);
    }

    const aboutMatch = lowerCaseCommand.match(/^(?:what is|what's|tell me about)\s+(.+?)(?:\s+about)?$/);
    if (aboutMatch?.[1]) {
        const title = aboutMatch[1].trim().replace(/[?.!]$/, '').trim();
        return findAndGetOverview(title, tmdbApiKey);
    }
    
    if (lowerCaseCommand.includes('mute')) return controlTrailerAudio('mute');
    if (lowerCaseCommand.includes('unmute')) return controlTrailerAudio('unmute');
    
    // Fallback to conversational AI if no structured command is matched
    const conversationalResponse = await queryOpenRouter(command);
    return { success: true, message: conversationalResponse };
}

export async function findAndSelectMediaItem(title: string, tmdbApiKey: string): Promise<CommandResult> {
    try {
        const res = await tmdbService.searchMulti(tmdbApiKey, title);
        const item = res.results.find((i): i is MediaItem => 'media_type' in i && (i.media_type === 'movie' || i.media_type === 'tv'));
        
        if (item) {
            window.dispatchEvent(new CustomEvent('selectMediaItem', { detail: item }));
            const mediaTitle = 'title' in item ? item.title : item.name;
            return { success: true, message: `OK, opening the details for ${mediaTitle}.`, action: 'close' };
        } else {
            return { success: false, message: `Sorry, I couldn't find anything called "${title}".` };
        }
    } catch (error) {
        console.error('Error in findAndSelectMediaItem:', error);
        return { success: false, message: "Sorry, I encountered an error while searching." };
    }
}

export async function findAndGetOverview(title: string, tmdbApiKey: string): Promise<CommandResult> {
    try {
        const res = await tmdbService.searchMulti(tmdbApiKey, title);
        const item = res.results.find((i): i is MediaItem => 'media_type' in i && (i.media_type === 'movie' || i.media_type === 'tv'));
        
        if (item?.overview) {
            return { success: true, message: item.overview };
        } else {
            return { success: false, message: `I couldn't find an overview for "${title}".` };
        }
    } catch (error) {
        console.error('Error in findAndGetOverview:', error);
        return { success: false, message: "Sorry, I encountered an error while searching." };
    }
}

export function controlTrailerAudio(action: 'mute' | 'unmute'): CommandResult {
    window.dispatchEvent(new CustomEvent('controlTrailerAudio', { detail: { action } }));
    return { success: true, message: `OK, the trailer has been ${action === 'mute' ? 'muted' : 'unmuted'}.` };
}