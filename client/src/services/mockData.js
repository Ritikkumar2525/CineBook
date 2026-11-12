// Fallback / Offline Mock Data for CineBook Showcase Deployment

export const MOCK_THEATRES = [
  {
    _id: 'theatre-mum-1',
    name: 'PVR Superplex - Phoenix Palladium',
    location: 'High Street Phoenix, Lower Parel',
    city: 'Mumbai',
    facilities: ['Dolby Atmos', '4DX Motion', 'IMAX Laser', 'Gourmet Lounge', 'Valet Parking', 'Wheelchair Access'],
  },
  {
    _id: 'theatre-del-1',
    name: 'INOX Megaplex - City Centre',
    location: 'Sector 29, City Centre Mall',
    city: 'Delhi',
    facilities: ['IMAX with Laser', 'Insignia Dining', 'Dolby 7.1', 'Recliner Seats', 'Reserved Parking'],
  },
];

export const MOCK_SCREENS = [
  {
    _id: 'screen-mum-imax',
    theatre: MOCK_THEATRES[0],
    name: 'Screen 1 - IMAX Laser',
    screenType: 'IMAX',
    seatCategories: [
      { name: 'Silver', price: 250, rows: ['A', 'B'], seatsPerRow: 10, color: '#94a3b8' },
      { name: 'Gold', price: 380, rows: ['C', 'D', 'E'], seatsPerRow: 12, color: '#f59e0b' },
      { name: 'Platinum', price: 550, rows: ['F', 'G'], seatsPerRow: 10, color: '#a855f7' },
    ],
  },
  {
    _id: 'screen-mum-atmos',
    theatre: MOCK_THEATRES[0],
    name: 'Screen 2 - Atmos Prime',
    screenType: 'Standard',
    seatCategories: [
      { name: 'Silver', price: 200, rows: ['A', 'B'], seatsPerRow: 10, color: '#94a3b8' },
      { name: 'Gold', price: 320, rows: ['C', 'D'], seatsPerRow: 10, color: '#f59e0b' },
      { name: 'Platinum', price: 460, rows: ['E', 'F'], seatsPerRow: 10, color: '#a855f7' },
    ],
  },
  {
    _id: 'screen-del-4dx',
    theatre: MOCK_THEATRES[1],
    name: 'Screen 1 - Megaplex 4DX',
    screenType: '4DX',
    seatCategories: [
      { name: 'Silver', price: 280, rows: ['A', 'B'], seatsPerRow: 8, color: '#94a3b8' },
      { name: 'Gold', price: 420, rows: ['C', 'D', 'E'], seatsPerRow: 10, color: '#f59e0b' },
      { name: 'Platinum', price: 620, rows: ['F'], seatsPerRow: 8, color: '#a855f7' },
    ],
  },
];

export const MOCK_MOVIES = [
  {
    _id: 'movie-gladiator-2',
    title: 'Gladiator II',
    description:
      'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist. With rage in his heart and the future of the Empire at stake, Lucius must look to his past to find strength and honor to return the glory of Rome to its people.',
    genre: ['Action', 'Drama', 'Adventure'],
    duration: 148,
    language: 'English',
    format: 'IMAX',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    rating: 'A',
    status: 'now_showing',
  },
  {
    _id: 'movie-dune-2',
    title: 'Dune: Part Two',
    description:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between love and the fate of the universe.',
    genre: ['Sci-Fi', 'Adventure', 'Action'],
    duration: 166,
    language: 'English',
    format: '4DX',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    rating: 'UA',
    status: 'now_showing',
  },
  {
    _id: 'movie-oppenheimer',
    title: 'Oppenheimer',
    description:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    genre: ['Biography', 'Drama', 'History'],
    duration: 180,
    language: 'English',
    format: 'IMAX',
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop&q=80',
    rating: 'A',
    status: 'now_showing',
  },
  {
    _id: 'movie-interstellar',
    title: 'Interstellar',
    description:
      'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft to find a new planet for humanity.',
    genre: ['Sci-Fi', 'Adventure', 'Drama'],
    duration: 169,
    language: 'English',
    format: 'IMAX',
    posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    rating: 'UA',
    status: 'now_showing',
  },
  {
    _id: 'movie-spiderman',
    title: 'Spider-Man: Across the Spider-Verse',
    description:
      'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    genre: ['Animation', 'Action', 'Adventure'],
    duration: 140,
    language: 'English',
    format: '3D',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&auto=format&fit=crop&q=80',
    rating: 'U',
    status: 'now_showing',
  },
  {
    _id: 'movie-inception',
    title: 'Inception',
    description:
      'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    genre: ['Sci-Fi', 'Action', 'Thriller'],
    duration: 148,
    language: 'English',
    format: 'IMAX',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    rating: 'UA',
    status: 'now_showing',
  },
  {
    _id: 'movie-dark-knight',
    title: 'The Dark Knight',
    description:
      'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
    genre: ['Action', 'Crime', 'Drama'],
    duration: 152,
    language: 'English',
    format: '2D',
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&auto=format&fit=crop&q=80',
    rating: 'UA',
    status: 'now_showing',
  },
];

export const MOCK_MEALS = [
  {
    _id: 'meal-caramel-popcorn',
    name: 'Jumbo Caramel Popcorn',
    category: 'POPCORN',
    price: 340,
    isVeg: true,
    description: 'Freshly popped gourmet corn glazed in handcrafted golden buttery caramel.',
    calories: '420 kcal',
  },
  {
    _id: 'meal-salted-popcorn',
    name: 'Classic Salted Tub',
    category: 'POPCORN',
    price: 290,
    isVeg: true,
    description: 'Hot cinema popped corn lightly salted and drizzled with warm golden butter.',
    calories: '310 kcal',
  },
  {
    _id: 'meal-loaded-nachos',
    name: 'Fiesta Loaded Nachos',
    category: 'SNACKS',
    price: 320,
    isVeg: true,
    description: 'Crisp corn tortilla chips served with warm melted jalapeno queso and zesty salsa.',
    calories: '480 kcal',
  },
  {
    _id: 'meal-pepsi-cold',
    name: 'Chilled Pepsi Black (Large)',
    category: 'BEVERAGES',
    price: 190,
    isVeg: true,
    description: 'Zero calorie icy fountain cola served in insulated cinema cup with lemon twist.',
    calories: '0 kcal',
  },
  {
    _id: 'meal-gourmet-combo',
    name: 'Gourmet Duo Cinema Combo',
    category: 'COMBOS',
    price: 680,
    isVeg: true,
    description: 'Large tub of half-caramel/half-salted popcorn + 2 fountain drinks + Loaded Nachos.',
    calories: '750 kcal',
  },
];

// Helper to generate dynamic multi-day showtimes starting from TODAY
export const generateMockShowtimesForMovie = (movieId) => {
  const movie = MOCK_MOVIES.find((m) => m._id === movieId) || MOCK_MOVIES[0];
  const now = new Date();
  const times = [
    { hour: 10, min: 30 },
    { hour: 14, min: 0 },
    { hour: 17, min: 45 },
    { hour: 21, min: 15 },
  ];

  const list = [];
  for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);

    times.forEach((slot, idx) => {
      const showDate = new Date(d);
      showDate.setHours(slot.hour, slot.min, 0, 0);

      const screen = MOCK_SCREENS[(dayOffset + idx) % MOCK_SCREENS.length];
      const showId = `show-${movie._id}-${dayOffset}-${idx}`;

      list.push({
        _id: showId,
        movie,
        screen,
        startTime: showDate.toISOString(),
        pricing: {
          Silver: screen.seatCategories.find((c) => c.name === 'Silver')?.price || 250,
          Gold: screen.seatCategories.find((c) => c.name === 'Gold')?.price || 380,
          Platinum: screen.seatCategories.find((c) => c.name === 'Platinum')?.price || 550,
        },
        status: 'scheduled',
      });
    });
  }

  return list;
};

// Generate full auditorium seat grid with availability
export const generateMockShowtimeDetails = (showtimeId) => {
  // Parse movie from showtime ID if possible
  const matchingMovie = MOCK_MOVIES.find((m) => showtimeId.includes(m._id)) || MOCK_MOVIES[0];
  const screen = MOCK_SCREENS[0];
  const now = new Date();
  now.setHours(17, 30, 0, 0);

  // Generate seats matrix
  const seats = [];
  screen.seatCategories.forEach((cat) => {
    cat.rows.forEach((rowLetter) => {
      for (let num = 1; num <= cat.seatsPerRow; num++) {
        const seatId = `${rowLetter}${num}`;
        // Mark some seats as already booked for realistic effect
        const isPreBooked = (rowLetter === 'C' && (num === 4 || num === 5)) || (rowLetter === 'D' && num === 7);
        seats.push({
          seatId,
          row: rowLetter,
          number: num,
          category: cat.name,
          price: cat.price,
          status: isPreBooked ? 'booked' : 'available',
        });
      }
    });
  });

  return {
    _id: showtimeId,
    movie: matchingMovie,
    screen,
    startTime: now.toISOString(),
    seats,
    status: 'scheduled',
  };
};
