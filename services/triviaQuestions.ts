
export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  movieTitle: string;
}

// This is a sample database. More questions can be added here to expand the game.
export const triviaQuestions: TriviaQuestion[] = [
  {
    question: "What is the name of the supercomputer in '2001: A Space Odyssey'?",
    options: ["SAL 9000", "Deep Thought", "HAL 9000", "Skynet"],
    correctAnswerIndex: 2,
    movieTitle: "2001: A Space Odyssey"
  },
  {
    question: "Which film features the line, 'Here's looking at you, kid'?",
    options: ["The Maltese Falcon", "Citizen Kane", "Casablanca", "Gone with the Wind"],
    correctAnswerIndex: 2,
    movieTitle: "Casablanca"
  },
  {
    question: "In 'The Matrix', what color pill does Neo take?",
    options: ["Blue", "Red", "Green", "Yellow"],
    correctAnswerIndex: 1,
    movieTitle: "The Matrix"
  },
  {
    question: "What is the highest-grossing film of all time (unadjusted for inflation)?",
    options: ["Titanic", "Avatar", "Avengers: Endgame", "Star Wars: The Force Awakens"],
    correctAnswerIndex: 1,
    movieTitle: "Avatar"
  },
  {
    question: "Who directed the 'Lord of the Rings' trilogy?",
    options: ["Steven Spielberg", "George Lucas", "James Cameron", "Peter Jackson"],
    correctAnswerIndex: 3,
    movieTitle: "The Lord of the Rings"
  },
  {
    question: "What is the name of the fictional African country in 'Black Panther'?",
    options: ["Genosha", "Wakanda", "Sokovia", "Latveria"],
    correctAnswerIndex: 1,
    movieTitle: "Black Panther"
  },
  {
    question: "Which movie won the first-ever Academy Award for Best Picture?",
    options: ["The Jazz Singer", "Metropolis", "Wings", "Sunrise: A Song of Two Humans"],
    correctAnswerIndex: 2,
    movieTitle: "Wings"
  },
  {
    question: "In 'Pulp Fiction', what is in the mysterious briefcase?",
    options: ["Gold", "Diamonds", "Marcellus Wallace's soul", "It's never revealed"],
    correctAnswerIndex: 3,
    movieTitle: "Pulp Fiction"
  },
  {
    question: "What type of dinosaur is the main antagonist in 'Jurassic Park'?",
    options: ["Tyrannosaurus Rex", "Velociraptor", "Spinosaurus", "Triceratops"],
    correctAnswerIndex: 0,
    movieTitle: "Jurassic Park"
  },
  {
    question: "Who played the Joker in the 2008 film 'The Dark Knight'?",
    options: ["Jack Nicholson", "Jared Leto", "Heath Ledger", "Joaquin Phoenix"],
    correctAnswerIndex: 2,
    movieTitle: "The Dark Knight"
  },
  {
    question: "What is the name of the protagonist's sled in 'Citizen Kane'?",
    options: ["Snowflake", "Rosebud", "Winter's Kiss", "The Duke"],
    correctAnswerIndex: 1,
    movieTitle: "Citizen Kane"
  },
  {
    question: "Which Quentin Tarantino film is split into chapters?",
    options: ["Reservoir Dogs", "Once Upon a Time in Hollywood", "Kill Bill: Volume 1", "Jackie Brown"],
    correctAnswerIndex: 2,
    movieTitle: "Kill Bill: Volume 1"
  },
  {
    question: "What planet are the Na'vi from in 'Avatar'?",
    options: ["Krypton", "Tatooine", "Pandora", "Xenomorph Prime"],
    correctAnswerIndex: 2,
    movieTitle: "Avatar"
  },
  {
    question: "In 'Forrest Gump', life is like a box of...?",
    options: ["Chocolates", "Candies", "Surprises", "Memories"],
    correctAnswerIndex: 0,
    movieTitle: "Forrest Gump"
  },
  {
    question: "What is the name of the actor who played Han Solo in the original Star Wars trilogy?",
    options: ["Mark Hamill", "Alec Guinness", "Harrison Ford", "James Earl Jones"],
    correctAnswerIndex: 2,
    movieTitle: "Star Wars"
  },
  {
    question: "Which Disney princess sings 'Let It Go'?",
    options: ["Ariel", "Cinderella", "Elsa", "Belle"],
    correctAnswerIndex: 2,
    movieTitle: "Frozen"
  },
  {
    question: "What is the name of the hotel in 'The Shining'?",
    options: ["The Bates Motel", "The Grand Budapest Hotel", "The Overlook Hotel", "The Nostromo"],
    correctAnswerIndex: 2,
    movieTitle: "The Shining"
  },
  {
    question: "Which Christopher Nolan film features dream-within-a-dream espionage?",
    options: ["The Prestige", "Inception", "Interstellar", "Tenet"],
    correctAnswerIndex: 1,
    movieTitle: "Inception"
  },
  {
    question: "What item must be destroyed to defeat Voldemort in 'Harry Potter'?",
    options: ["The Elder Wand", "The Philosopher's Stone", "The Horcruxes", "The Goblet of Fire"],
    correctAnswerIndex: 2,
    movieTitle: "Harry Potter"
  },
  {
    question: "Who is the director of the film 'Parasite', which won Best Picture in 2020?",
    options: ["Park Chan-wook", "Kim Jee-woon", "Bong Joon-ho", "Lee Chang-dong"],
    correctAnswerIndex: 2,
    movieTitle: "Parasite"
  },
  {
    question: "In 'Back to the Future', what speed must the DeLorean reach to time travel?",
    options: ["88 mph", "99 mph", "100 mph", "77 mph"],
    correctAnswerIndex: 0,
    movieTitle: "Back to the Future"
  },
  {
    question: "What is the name of the lion cub protagonist in 'The Lion King'?",
    options: ["Mufasa", "Scar", "Kovu", "Simba"],
    correctAnswerIndex: 3,
    movieTitle: "The Lion King"
  },
  {
    question: "Which movie features a group of children searching for pirate treasure?",
    options: ["E.T.", "Stand by Me", "The Goonies", "Super 8"],
    correctAnswerIndex: 2,
    movieTitle: "The Goonies"
  },
  {
    question: "What is the name of the ship in 'Alien'?",
    options: ["Discovery One", "Serenity", "Millennium Falcon", "Nostromo"],
    correctAnswerIndex: 3,
    movieTitle: "Alien"
  },
  {
    question: "In 'Toy Story', who is Buzz Lightyear's sworn enemy?",
    options: ["Sid", "Emperor Zurg", "Lotso", "Stinky Pete"],
    correctAnswerIndex: 1,
    movieTitle: "Toy Story"
  },
  {
    question: "Which Wes Anderson film is about a concierge at a famous European hotel?",
    options: ["The Royal Tenenbaums", "The Grand Budapest Hotel", "Isle of Dogs", "Moonrise Kingdom"],
    correctAnswerIndex: 1,
    movieTitle: "The Grand Budapest Hotel"
  },
  {
    question: "What does 'Ohana' mean in the movie 'Lilo & Stitch'?",
    options: ["Love", "Family", "Friendship", "Home"],
    correctAnswerIndex: 1,
    movieTitle: "Lilo & Stitch"
  },
  {
    question: "Which film coined the phrase 'I see dead people'?",
    options: ["The Ring", "The Grudge", "Poltergeist", "The Sixth Sense"],
    correctAnswerIndex: 3,
    movieTitle: "The Sixth Sense"
  },
  {
    question: "Who composed the iconic score for 'Jaws'?",
    options: ["Hans Zimmer", "John Williams", "Howard Shore", "James Horner"],
    correctAnswerIndex: 1,
    movieTitle: "Jaws"
  },
  {
    question: "What is the name of the company that created the dinosaurs in 'Jurassic Park'?",
    options: ["InGen", "BioSyn", "Masrani Global", "Weyland-Yutani"],
    correctAnswerIndex: 0,
    movieTitle: "Jurassic Park"
  },
  {
    question: "Which Martin Scorsese film stars Leonardo DiCaprio as a stockbroker?",
    options: ["The Departed", "Shutter Island", "The Aviator", "The Wolf of Wall Street"],
    correctAnswerIndex: 3,
    movieTitle: "The Wolf of Wall Street"
  },
  {
    question: "In 'Finding Nemo', what is the address on the diver's mask?",
    options: ["123 Ocean Lane", "42 Wallaby Way, Sydney", "10 Downing Street", "221B Baker Street"],
    correctAnswerIndex: 1,
    movieTitle: "Finding Nemo"
  },
  {
    question: "What is the name of the magical world in 'The Chronicles of Narnia'?",
    options: ["Middle-earth", "Westeros", "Hogwarts", "Narnia"],
    correctAnswerIndex: 3,
    movieTitle: "The Chronicles of Narnia"
  },
  {
    question: "Which movie is famous for its 'bullet time' special effect?",
    options: ["Blade Runner", "The Terminator", "The Matrix", "Total Recall"],
    correctAnswerIndex: 2,
    movieTitle: "The Matrix"
  },
  {
    question: "What type of animal is WALL-E?",
    options: ["Dog", "Cat", "Robot", "Alien"],
    correctAnswerIndex: 2,
    movieTitle: "WALL-E"
  },
  {
    question: "Which actor plays the titular character in the 'John Wick' series?",
    options: ["Tom Cruise", "Keanu Reeves", "Brad Pitt", "Matt Damon"],
    correctAnswerIndex: 1,
    movieTitle: "John Wick"
  },
  {
    question: "What is the primary setting for the film 'La La Land'?",
    options: ["New York City", "Paris", "Los Angeles", "London"],
    correctAnswerIndex: 2,
    movieTitle: "La La Land"
  },
  {
    question: "In the movie 'Up', what is the name of the elderly protagonist?",
    options: ["Charles Muntz", "Russell", "Dug", "Carl Fredricksen"],
    correctAnswerIndex: 3,
    movieTitle: "Up"
  },
  {
    question: "What is the name of the island where 'King Kong' was found?",
    options: ["Isla Nublar", "Skull Island", "Monster Island", "The Lost World"],
    correctAnswerIndex: 1,
    movieTitle: "King Kong"
  },
  {
    question: "Which Coen Brothers film is a crime-comedy set in Minnesota?",
    options: ["The Big Lebowski", "No Country for Old Men", "Fargo", "O Brother, Where Art Thou?"],
    correctAnswerIndex: 2,
    movieTitle: "Fargo"
  },
  {
    question: "What is the name of the AI in the movie 'Her'?",
    options: ["Joi", "Samantha", "Ava", "Cortana"],
    correctAnswerIndex: 1,
    movieTitle: "Her"
  },
  {
    question: "Which Alfred Hitchcock film is famous for its shower scene?",
    options: ["Vertigo", "Rear Window", "Psycho", "The Birds"],
    correctAnswerIndex: 2,
    movieTitle: "Psycho"
  },
  {
    question: "In 'Mad Max: Fury Road', what is the name of the female protagonist played by Charlize Theron?",
    options: ["The Valkyrie", "Furiosa", "The Dag", "Toast the Knowing"],
    correctAnswerIndex: 1,
    movieTitle: "Mad Max: Fury Road"
  },
  {
    question: "What is the name of the friendly ghost in the 1995 film?",
    options: ["Slimer", "Beetlejuice", "Casper", "Moaning Myrtle"],
    correctAnswerIndex: 2,
    movieTitle: "Casper"
  },
  {
    question: "Which movie is set in a post-apocalyptic world where humanity lives in a massive, self-sustaining train?",
    options: ["Elysium", "Snowpiercer", "District 9", "Children of Men"],
    correctAnswerIndex: 1,
    movieTitle: "Snowpiercer"
  },
  {
    question: "What is the name of the hobbit who carries the One Ring to Mordor?",
    options: ["Samwise Gamgee", "Bilbo Baggins", "Frodo Baggins", "Pippin Took"],
    correctAnswerIndex: 2,
    movieTitle: "The Lord of the Rings"
  },
  {
    question: "Which Stanley Kubrick film satirizes the Cold War and the nuclear arms race?",
    options: ["A Clockwork Orange", "Full Metal Jacket", "Dr. Strangelove", "Paths of Glory"],
    correctAnswerIndex: 2,
    movieTitle: "Dr. Strangelove"
  },
  {
    question: "What is the name of the rat who becomes a chef in 'Ratatouille'?",
    options: ["Django", "Emile", "Linguini", "Remy"],
    correctAnswerIndex: 3,
    movieTitle: "Ratatouille"
  },
  {
    question: "Which classic Western stars Clint Eastwood as 'The Man with No Name'?",
    options: ["High Noon", "The Good, the Bad and the Ugly", "The Searchers", "Unforgiven"],
    correctAnswerIndex: 1,
    movieTitle: "The Good, the Bad and the Ugly"
  },
  {
    question: "What is the name of the monster in 'Cloverfield'?",
    options: ["Godzilla", "The Kaiju", "The Creature", "It's never named"],
    correctAnswerIndex: 3,
    movieTitle: "Cloverfield"
  }
];
