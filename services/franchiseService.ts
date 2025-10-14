import { Movie } from '../types';

// This service maps common search queries for popular franchises to either a specific
// TMDb collection ID or a manually curated list of TMDb movie IDs. This allows for
// more accurate and reliable Watch Path generation for well-known series.

interface FranchiseData {
    type: 'collection' | 'curated_list';
    id?: number; // For collection type
    name: string;
    ids?: number[]; // For curated_list type
}

export const franchiseKeywords: Record<string, FranchiseData> = {
    // Collection-based franchises
    'james bond': { type: 'collection', id: 645, name: 'James Bond Collection' },
    '007': { type: 'collection', id: 645, name: 'James Bond Collection' },

    'harry potter': { type: 'collection', id: 1241, name: 'Harry Potter Collection' },
    'wizarding world': { type: 'collection', id: 1241, name: 'Harry Potter Collection' },

    'fast and furious': { type: 'collection', id: 9485, name: 'The Fast & The Furious Collection' },
    'the fast saga': { type: 'collection', id: 9485, name: 'The Fast & The Furious Collection' },

    'mission impossible': { type: 'collection', id: 87359, name: 'Mission: Impossible Collection' },
    'mission: impossible': { type: 'collection', id: 87359, name: 'Mission: Impossible Collection' },

    'jurassic park': { type: 'collection', id: 328, name: 'Jurassic Park Collection' },
    'jurassic world': { type: 'collection', id: 328, name: 'Jurassic Park Collection' },

    'toy story': { type: 'collection', id: 10194, name: 'Toy Story Collection' },

    'the lord of the rings': { type: 'collection', id: 119, name: 'The Lord of the Rings Collection' },
    'lord of the rings': { type: 'collection', id: 119, name: 'The Lord of the Rings Collection' },
    'middle-earth': { type: 'collection', id: 119, name: 'The Lord of the Rings Collection' },

    'star wars': { type: 'collection', id: 10, name: 'Star Wars Collection (Skywalker Saga)' },

    // Curated list-based franchises (for series without a single, clean TMDb collection)
    'mcu': {
        type: 'curated_list',
        name: 'Marvel Cinematic Universe (Release Order)',
        ids: [
            1726,   // Iron Man (2008)
            1724,   // The Incredible Hulk (2008)
            10138,  // Iron Man 2 (2010)
            10195,  // Thor (2011)
            1771,   // Captain America: The First Avenger (2011)
            24428,  // The Avengers (2012)
            68721,  // Iron Man 3 (2013)
            76338,  // Thor: The Dark World (2013)
            100402, // Captain America: The Winter Soldier (2014)
            118340, // Guardians of the Galaxy (2014)
            99861,  // Avengers: Age of Ultron (2015)
            102899, // Ant-Man (2015)
            271110, // Captain America: Civil War (2016)
            284052, // Doctor Strange (2016)
            283995, // Guardians of the Galaxy Vol. 2 (2017)
            315635, // Spider-Man: Homecoming (2017)
            284053, // Thor: Ragnarok (2017)
            284054, // Black Panther (2018)
            299536, // Avengers: Infinity War (2018)
            363088, // Ant-Man and the Wasp (2018)
            299537, // Captain Marvel (2019)
            299534, // Avengers: Endgame (2019)
            429617, // Spider-Man: Far From Home (2019)
            497698, // Black Widow (2021)
            566525, // Shang-Chi and the Legend of the Ten Rings (2021)
            524434, // Eternals (2021)
            634649, // Spider-Man: No Way Home (2021)
            453395, // Doctor Strange in the Multiverse of Madness (2022)
            616037, // Thor: Love and Thunder (2022)
            505642, // Black Panther: Wakanda Forever (2022)
            640146, // Ant-Man and the Wasp: Quantumania (2023)
            447365, // Guardians of the Galaxy Vol. 3 (2023)
            609681, // The Marvels (2023)
            533535  // Deadpool & Wolverine (2024)
        ]
    },
    'marvel cinematic universe': {
        type: 'curated_list',
        name: 'Marvel Cinematic Universe (Release Order)',
        ids: [ 1726, 1724, 10138, 10195, 1771, 24428, 68721, 76338, 100402, 118340, 99861, 102899, 271110, 284052, 283995, 315635, 284053, 284054, 299536, 363088, 299537, 299534, 429617, 497698, 566525, 524434, 634649, 453395, 616037, 505642, 640146, 447365, 609681, 533535 ]
    },
    'marvel': {
        type: 'curated_list',
        name: 'Marvel Cinematic Universe (Release Order)',
        ids: [ 1726, 1724, 10138, 10195, 1771, 24428, 68721, 76338, 100402, 118340, 99861, 102899, 271110, 284052, 283995, 315635, 284053, 284054, 299536, 363088, 299537, 299534, 429617, 497698, 566525, 524434, 634649, 453395, 616037, 505642, 640146, 447365, 609681, 533535 ]
    },

    'dc': {
        type: 'curated_list',
        name: 'DC Extended Universe',
        ids: [ 209112, 297761, 297762, 297760, 141052, 297802, 287903, 495764, 460458, 507086, 414906, 594767, 455476, 572802, 955916 ]
    },
    'dceu': {
        type: 'curated_list',
        name: 'DC Extended Universe',
        ids: [ 209112, 297761, 297762, 297760, 141052, 297802, 287903, 495764, 460458, 507086, 414906, 594767, 455476, 572802, 955916 ]
    },
    'dc extended universe': {
        type: 'curated_list',
        name: 'DC Extended Universe',
        ids: [
            209112, // Man of Steel
            297761, // Batman v Superman
            297762, // Suicide Squad
            297760, // Wonder Woman
            141052, // Justice League
            297802, // Aquaman
            287903, // Shazam!
            495764, // Birds of Prey
            460458, // Wonder Woman 1984
            507086, // The Suicide Squad
            414906, // Black Adam
            594767, // Shazam! Fury of the Gods
            455476, // The Flash
            572802, // Blue Beetle
            955916, // Aquaman and the Lost Kingdom
        ]
    }
};

/**
 * Finds a pre-defined franchise based on a search query.
 * @param query The user's search term.
 * @returns The franchise data object if a match is found, otherwise null.
 */
export const findFranchise = (query: string): FranchiseData | null => {
    const lowerQuery = query.toLowerCase().trim();
    return franchiseKeywords[lowerQuery] || null;
};
