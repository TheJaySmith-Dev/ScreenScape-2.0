// TheSportsDB API Service
const API_BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

const sportsFetch = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  // Add API key to all requests
  const apiKey = (import.meta.env as any).VITE_THESPORTSDB_API_KEY || '123';
  url.searchParams.append('apikey', apiKey);

  for (const key in params) {
    url.searchParams.append(key, params[key]);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TheSportsDB API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data;
};

export interface League {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strLeagueAlternate?: string;
  intDivision?: string;
  idCup?: string;
  strCurrentSeason?: string;
  intFormedYear?: number;
  dateFirstEvent?: string;
  strGender?: string;
  strCountry?: string;
  strWebsite?: string;
  strFacebook?: string;
  strTwitter?: string;
  strYoutube?: string;
  strRSS?: string;
  strDescriptionEN?: string;
  strFanart1?: string;
  strFanart2?: string;
  strFanart3?: string;
  strFanart4?: string;
  strBanner?: string;
  strBadge?: string;
  strLogo?: string;
  strPoster?: string;
  strTrophy?: string;
  strNaming?: string;
  strComplete?: string;
  strLocked?: string;
}

export interface Team {
  idTeam: string;
  idSoccerXML: string | null;
  idAPIfootball: string | null;
  intLoved?: string | null;
  strTeam: string;
  strTeamShort?: string | null;
  strAlternate?: string | null;
  intFormedYear?: string;
  strSport: string;
  strLeague: string;
  idLeague: string;
  strLeague2?: string | null;
  idLeague2?: string | null;
  strLeague3?: string | null;
  idLeague3?: string | null;
  strLeague4?: string | null;
  idLeague4?: string | null;
  strLeague5?: string | null;
  idLeague5?: string | null;
  strLeague6?: string | null;
  idLeague6?: string | null;
  strLeague7?: string | null;
  idLeague7?: string | null;
  strDivision?: string | null;
  idVenue?: string | null;
  strStadium?: string | null;
  strKeywords?: string | null;
  strRSS?: string | null;
  strStadiumThumb?: string | null;
  strStadiumDescription?: string | null;
  strStadiumLocation?: string | null;
  intStadiumCapacity?: string | null;
  strWebsite?: string | null;
  strFacebook?: string | null;
  strTwitter?: string | null;
  strInstagram?: string | null;
  strYoutube?: string | null;
  strDescriptionEN?: string | null;
  strDescriptionDE?: string | null;
  strDescriptionFR?: string | null;
  strDescriptionCN?: string | null;
  strDescriptionIT?: string | null;
  strDescriptionJP?: string | null;
  strDescriptionRU?: string | null;
  strDescriptionES?: string | null;
  strDescriptionPT?: string | null;
  strDescriptionSE?: string | null;
  strDescriptionNL?: string | null;
  strDescriptionHU?: string | null;
  strDescriptionNO?: string | null;
  strDescriptionIL?: string | null;
  strDescriptionPL?: string | null;
  strDescriptionKR?: string | null;
  strFanart1?: string | null;
  strFanart2?: string | null;
  strFanart3?: string | null;
  strFanart4?: string | null;
  strBanner?: string | null;
  strBadge?: string | null;
  strLogo?: string | null;
  strPoster?: string | null;
  strTrophy?: string | null;
  strLocked?: string;
}

export interface Event {
  idEvent: string;
  idAPIfootball?: string;
  idSoccerXML?: string;
  idPlayer?: string;
  strSport: string;
  strEvent: string;
  strEventAlternate?: string;
  strFilename?: string;
  strSeason?: string;
  strDescriptionEN?: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore?: string;
  intRound?: string;
  intAwayScore?: string;
  intSpectators?: string;
  strOfficial?: string;
  strTimestamp?: string;
  dateEvent: string;
  dateEventLocal?: string;
  strTime?: string;
  strTimeLocal?: string;
  strTVStation?: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strResult?: string;
  strVenue?: string;
  strCountry?: string;
  strCity?: string;
  strPoster?: string;
  strSquare?: string;
  strFanart?: string;
  strThumb?: string;
  strBanner?: string;
  strMap?: string;
  strTweet1?: string;
  strTweet2?: string;
  strTweet3?: string;
  strVideo?: string;
  strStatus?: string;
  strPostponed?: string;
  strLocked?: string;
}

export interface Player {
  idPlayer: string;
  strNationality?: string;
  strPlayer: string;
  strTeam?: string;
  strSport: string;
  intSoccerXMLTeamID?: string;
  dateBorn?: string;
  dateSigned?: string;
  dateJoined?: string;
  strSigning?: string;
  strWage?: string;
  strBirthLocation?: string;
  strDescriptionEN?: string;
  strDescriptionDE?: string;
  strDescriptionFR?: string;
  strDescriptionCN?: string;
  strDescriptionIT?: string;
  strDescriptionJP?: string;
  strDescriptionRU?: string;
  strDescriptionES?: string;
  strDescriptionPT?: string;
  strDescriptionSE?: string;
  strDescriptionNL?: string;
  strDescriptionHU?: string;
  strDescriptionNO?: string;
  strDescriptionIL?: string;
  strDescriptionPL?: string;
  strDescriptionKR?: string;
  strGender?: string;
  strPosition?: string;
  strCollege?: string;
  strFacebook?: string;
  strWebsite?: string;
  strTwitter?: string;
  strInstagram?: string;
  strYoutube?: string;
  strHeight?: string;
  strWeight?: string;
  intLoved?: string;
  strThumb?: string;
  strCutout?: string;
  strRender?: string;
  strBanner?: string;
  strFanart1?: string;
  strFanart2?: string;
  strFanart3?: string;
  strFanart4?: string;
  strLocked?: string;
}

// All leagues
export const getAllLeagues = (): Promise<{ leagues: League[] }> => {
  return sportsFetch('/all_leagues.php');
};

// League details
export const getLeagueDetails = (idLeague: string): Promise<{ leagues: League[] }> => {
  return sportsFetch('/lookupleague.php', { id: idLeague });
};

// Leagues by country
export const getLeaguesByCountry = (country: string): Promise<{ countryleagues: League[] }> => {
  return sportsFetch('/search_all_leagues.php', { c: country });
};

// Teams in league
export const getTeamsInLeague = (idLeague: string): Promise<{ teams: Team[] }> => {
  return sportsFetch('/lookup_all_teams.php', { id: idLeague });
};

// Team details
export const getTeamDetails = (idTeam: string): Promise<{ teams: Team[] }> => {
  return sportsFetch('/lookupteam.php', { id: idTeam });
};

// League table (season standings)
export const getLeagueTable = (idLeague: string, season: string): Promise<{ table: any[] }> => {
  return sportsFetch('/lookuptable.php', { l: idLeague, s: season });
};

// Events in league by season
export const getEventsInLeagueBySeason = (idLeague: string, season: string): Promise<{ events: Event[] }> => {
  return sportsFetch('/eventsseason.php', { id: idLeague, s: season });
};

// Next events in league
export const getNextEventsInLeague = (idLeague: string): Promise<{ events: Event[] }> => {
  return sportsFetch('/eventsnextleague.php', { id: idLeague });
};

// Last events in league
export const getLastEventsInLeague = (idLeague: string): Promise<{ events: Event[] }> => {
  return sportsFetch('/eventspastleague.php', { id: idLeague });
};

// Search teams
export const searchTeams = (team: string): Promise<{ teams: Team[] }> => {
  return sportsFetch('/searchteams.php', { t: team });
};

// Players by team
export const getPlayersByTeam = (idTeam: string): Promise<{ player: Player[] }> => {
  return sportsFetch('/lookup_all_players.php', { id: idTeam });
};

// Player details
export const getPlayerDetails = (idPlayer: string): Promise<{ players: Player[] }> => {
  return sportsFetch('/lookupplayer.php', { id: idPlayer });
};

// Search players
export const searchPlayers = (player: string): Promise<{ player: Player[] }> => {
  return sportsFetch('/searchplayers.php', { p: player });
};

// Event details
export const getEventDetails = (idEvent: string): Promise<{ events: Event[] }> => {
  return sportsFetch('/lookupevent.php', { id: idEvent });
};
