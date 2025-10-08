export interface BoxOfficeMovie {
    year: number;
    title: string;
    tmdbId: number;
    boxOffice: number; // Worldwide box office in USD
    source: string;
}

export const boxOfficeData: BoxOfficeMovie[] = [
    { year: 2024, title: "Inside Out 2", tmdbId: 1022789, boxOffice: 1699000000, source: "Box Office Mojo" },
    { year: 2023, title: "Barbie", tmdbId: 346698, boxOffice: 1447000000, source: "Box Office Mojo" },
    { year: 2022, title: "Top Gun: Maverick", tmdbId: 361743, boxOffice: 1496000000, source: "Box Office Mojo" },
    { year: 2021, title: "Spider-Man: No Way Home", tmdbId: 634649, boxOffice: 1921000000, source: "Box Office Mojo" },
    { year: 2020, title: "Bad Boys for Life", tmdbId: 38700, boxOffice: 426500000, source: "Box Office Mojo" },
    { year: 2019, title: "Avengers: Endgame", tmdbId: 299534, boxOffice: 2799000000, source: "Box Office Mojo" },
    { year: 2018, title: "Black Panther", tmdbId: 284054, boxOffice: 1347000000, source: "Box Office Mojo" },
    { year: 2017, title: "Star Wars: The Last Jedi", tmdbId: 181808, boxOffice: 1333000000, source: "Box Office Mojo" },
    { year: 2016, title: "Finding Dory", tmdbId: 127380, boxOffice: 1029000000, source: "Box Office Mojo" },
    { year: 2015, title: "Jurassic World", tmdbId: 135397, boxOffice: 1672000000, source: "Box Office Mojo" },
    { year: 2014, title: "Guardians of the Galaxy", tmdbId: 118340, boxOffice: 773000000, source: "Box Office Mojo" },
    { year: 2013, title: "Iron Man 3", tmdbId: 68721, boxOffice: 1215000000, source: "Box Office Mojo" },
    { year: 2012, title: "The Avengers", tmdbId: 24428, boxOffice: 1521000000, source: "Box Office Mojo" },
    { year: 2011, title: "Harry Potter and the Deathly Hallows: Part 2", tmdbId: 12445, boxOffice: 1342000000, source: "Box Office Mojo" },
    { year: 2010, title: "Avatar", tmdbId: 19995, boxOffice: 2924000000, source: "Box Office Mojo" },
    { year: 2008, title: "The Dark Knight", tmdbId: 155, boxOffice: 1003845358, source: "Box Office Mojo" },
    { year: 2007, title: "Spider-Man 3", tmdbId: 559, boxOffice: 890000000, source: "Various" },
    { year: 2006, title: "Pirates of the Caribbean: Dead Man's Chest", tmdbId: 58, boxOffice: 1066179725, source: "Box Office Mojo" },
    { year: 2005, title: "Star Wars: Episode III - Revenge of the Sith", tmdbId: 1895, boxOffice: 848998877, source: "Box Office Mojo" },
    { year: 2004, title: "Shrek 2", tmdbId: 809, boxOffice: 919838758, source: "Box Office Mojo" },
    { year: 2003, title: "Finding Nemo", tmdbId: 12, boxOffice: 940335536, source: "Box Office Mojo" },
    { year: 2002, title: "Spider-Man", tmdbId: 557, boxOffice: 821708551, source: "Box Office Mojo" },
    { year: 2001, title: "Harry Potter and the Sorcerer's Stone", tmdbId: 671, boxOffice: 974755371, source: "Box Office Mojo" },
    { year: 2000, title: "How the Grinch Stole Christmas", tmdbId: 8871, boxOffice: 345141403, source: "Box Office Mojo" },
    { year: 1999, title: "Star Wars: Episode I - The Phantom Menace", tmdbId: 1893, boxOffice: 1027044677, source: "Box Office Mojo" },
    { year: 1998, title: "Titanic", tmdbId: 597, boxOffice: 2187463944, source: "Box Office Mojo" },
    { year: 1997, title: "Men in Black", tmdbId: 607, boxOffice: 589390539, source: "Box Office Mojo" },
    { year: 1996, title: "Independence Day", tmdbId: 602, boxOffice: 817400891, source: "Box Office Mojo" },
    { year: 1995, title: "Batman Forever", tmdbId: 415, boxOffice: 336528157, source: "Box Office Mojo" },
    { year: 1994, title: "The Lion King", tmdbId: 8587, boxOffice: 968483777, source: "Box Office Mojo" },
    { year: 1993, title: "Jurassic Park", tmdbId: 329, boxOffice: 1046693000, source: "Box Office Mojo" },
    { year: 1992, title: "Aladdin", tmdbId: 812, boxOffice: 504050219, source: "Box Office Mojo" },
    { year: 1991, title: "Terminator 2: Judgment Day", tmdbId: 280, boxOffice: 520881154, source: "Box Office Mojo" },
    { year: 1990, title: "Ghost", tmdbId: 2646, boxOffice: 505702588, source: "Box Office Mojo" },
    { year: 1989, title: "Batman", tmdbId: 268, boxOffice: 411556825, source: "Box Office Mojo" },
    { year: 1988, title: "Who Framed Roger Rabbit", tmdbId: 863, boxOffice: 329803958, source: "Box Office Mojo" },
    { year: 1987, title: "Beverly Hills Cop II", tmdbId: 91, boxOffice: 276600000, source: "Box Office Mojo" },
    { year: 1986, title: "Top Gun", tmdbId: 744, boxOffice: 357288178, source: "Box Office Mojo" },
    { year: 1985, title: "Back to the Future", tmdbId: 105, boxOffice: 381109762, source: "Box Office Mojo" },
    { year: 1984, title: "Ghostbusters", tmdbId: 620, boxOffice: 295212467, source: "Box Office Mojo" },
    { year: 1983, title: "Star Wars: Episode VI - Return of the Jedi", tmdbId: 1892, boxOffice: 475106177, source: "Box Office Mojo" },
    { year: 1982, title: "E.T. the Extra-Terrestrial", tmdbId: 601, boxOffice: 792910554, source: "Box Office Mojo" },
    { year: 1981, title: "Raiders of the Lost Ark", tmdbId: 85, boxOffice: 389925971, source: "Box Office Mojo" },
    { year: 1980, title: "Star Wars: Episode V - The Empire Strikes Back", tmdbId: 1891, boxOffice: 538375067, source: "Box Office Mojo" },
    { year: 1979, title: "Superman", tmdbId: 19, boxOffice: 300500000, source: "Box Office Mojo" },
    { year: 1978, title: "Grease", tmdbId: 680, boxOffice: 394600000, source: "Box Office Mojo" },
    { year: 1977, title: "Star Wars: Episode IV - A New Hope", tmdbId: 11, boxOffice: 775400000, source: "Box Office Mojo" },
    { year: 1976, title: "Rocky", tmdbId: 1366, boxOffice: 225000000, source: "Box Office Mojo" }
];
