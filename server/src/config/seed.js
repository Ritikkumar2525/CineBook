require('dotenv').config();
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const Showtime = require('../models/Showtime');
const SeatHold = require('../models/SeatHold');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const connectDB = require('./db');

const seedData = async () => {
  try {
    console.log('--- Connecting to MongoDB for seeding ---');
    await connectDB();

    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Screen.deleteMany({}),
      Showtime.deleteMany({}),
      SeatHold.deleteMany({}),
      Booking.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('Existing collections cleared.');

    // 1. Create Users
    console.log('Creating users...');
    const adminUser = await User.create({
      name: 'Cinema Administrator',
      email: 'admin@cinema.com',
      password: 'admin123',
      phone: '+1 555-0100',
      role: 'admin',
    });

    const customerUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '+1 555-0199',
      role: 'customer',
    });

    console.log(`Users created: Admin (${adminUser.email}), Customer (${customerUser.email})`);

    // 2. Create Theatres
    console.log('Creating theatres...');
    const theatres = await Theatre.create([
      {
        name: 'PVR Superplex - Phoenix Palladium',
        location: 'High Street Phoenix, Lower Parel',
        city: 'Mumbai',
        facilities: [
          'Dolby Atmos',
          '4DX Motion',
          'IMAX Laser',
          'Gourmet Lounge',
          'Valet Parking',
          'Wheelchair Access',
        ],
      },
      {
        name: 'INOX Megaplex - City Centre',
        location: 'Sector 29, City Centre Mall',
        city: 'Delhi',
        facilities: [
          'IMAX with Laser',
          'Insignia Dining',
          'Dolby 7.1',
          'Recliner Seats',
          'Reserved Parking',
          'Wheelchair Access',
        ],
      },
    ]);

    const [theatreMumbai, theatreDelhi] = theatres;
    console.log(`Theatres created: ${theatreMumbai.name}, ${theatreDelhi.name}`);

    // 3. Create Screens
    console.log('Creating screens...');
    const screens = await Screen.create([
      // Theatre 1 (Mumbai) - Screen 1 (IMAX)
      {
        theatre: theatreMumbai._id,
        name: 'Screen 1 - IMAX Laser',
        screenType: 'IMAX',
        seatCategories: [
          {
            name: 'Silver',
            price: 220,
            rows: ['A', 'B'],
            seatsPerRow: 10,
            color: '#94a3b8',
          },
          {
            name: 'Gold',
            price: 360,
            rows: ['C', 'D', 'E'],
            seatsPerRow: 12,
            color: '#f59e0b',
          },
          {
            name: 'Platinum',
            price: 520,
            rows: ['F', 'G'],
            seatsPerRow: 10,
            color: '#a855f7',
          },
        ],
      },
      // Theatre 1 (Mumbai) - Screen 2 (Standard)
      {
        theatre: theatreMumbai._id,
        name: 'Screen 2 - Atmos Prime',
        screenType: 'Standard',
        seatCategories: [
          {
            name: 'Silver',
            price: 180,
            rows: ['A', 'B'],
            seatsPerRow: 8,
            color: '#94a3b8',
          },
          {
            name: 'Gold',
            price: 280,
            rows: ['C', 'D'],
            seatsPerRow: 10,
            color: '#f59e0b',
          },
          {
            name: 'Platinum',
            price: 420,
            rows: ['E', 'F'],
            seatsPerRow: 10,
            color: '#a855f7',
          },
        ],
      },
      // Theatre 2 (Delhi) - Screen 1 (4DX)
      {
        theatre: theatreDelhi._id,
        name: 'Screen 1 - Megaplex 4DX',
        screenType: '4DX',
        seatCategories: [
          {
            name: 'Silver',
            price: 250,
            rows: ['A', 'B'],
            seatsPerRow: 8,
            color: '#94a3b8',
          },
          {
            name: 'Gold',
            price: 400,
            rows: ['C', 'D', 'E'],
            seatsPerRow: 10,
            color: '#f59e0b',
          },
          {
            name: 'Platinum',
            price: 580,
            rows: ['F'],
            seatsPerRow: 8,
            color: '#a855f7',
          },
        ],
      },
      // Theatre 2 (Delhi) - Screen 2 (Premium)
      {
        theatre: theatreDelhi._id,
        name: 'Screen 2 - Dolby Cinema',
        screenType: 'Premium',
        seatCategories: [
          {
            name: 'Silver',
            price: 200,
            rows: ['A', 'B'],
            seatsPerRow: 10,
            color: '#94a3b8',
          },
          {
            name: 'Gold',
            price: 320,
            rows: ['C', 'D', 'E'],
            seatsPerRow: 12,
            color: '#f59e0b',
          },
          {
            name: 'Platinum',
            price: 480,
            rows: ['F', 'G'],
            seatsPerRow: 10,
            color: '#a855f7',
          },
        ],
      },
    ]);

    const [screenMum1, screenMum2, screenDel1, screenDel2] = screens;
    console.log(`Screens created: ${screens.map((s) => s.name).join(', ')}`);

    // 4. Create Movies (6 real movies across genres)
    console.log('Creating movies...');
    const movies = await Movie.create([
      {
        title: 'Inception',
        description:
          'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
        genre: ['Sci-Fi', 'Action', 'Thriller'],
        duration: 148,
        language: 'English',
        format: 'IMAX',
        posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
        rating: 'UA',
        releaseDate: new Date('2010-07-16'),
        status: 'now_showing',
      },
      {
        title: 'Interstellar',
        description:
          'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        genre: ['Sci-Fi', 'Adventure', 'Drama'],
        duration: 169,
        language: 'English',
        format: 'IMAX',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        rating: 'UA',
        releaseDate: new Date('2014-11-07'),
        status: 'now_showing',
      },
      {
        title: 'The Dark Knight',
        description:
          'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        genre: ['Action', 'Crime', 'Drama'],
        duration: 152,
        language: 'English',
        format: '2D',
        posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&auto=format&fit=crop&q=80',
        rating: 'UA',
        releaseDate: new Date('2008-07-18'),
        status: 'now_showing',
      },
      {
        title: 'Oppenheimer',
        description:
          'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        genre: ['Biography', 'Drama', 'History'],
        duration: 180,
        language: 'English',
        format: 'IMAX',
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop&q=80',
        rating: 'A',
        releaseDate: new Date('2023-07-21'),
        status: 'now_showing',
      },
      {
        title: 'Dune: Part Two',
        description:
          'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between love and the fate of the universe.',
        genre: ['Sci-Fi', 'Adventure', 'Action'],
        duration: 166,
        language: 'English',
        format: '4DX',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        rating: 'UA',
        releaseDate: new Date('2024-03-01'),
        status: 'now_showing',
      },
      {
        title: 'Spider-Man: Across the Spider-Verse',
        description:
          'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
        genre: ['Animation', 'Action', 'Adventure'],
        duration: 140,
        language: 'English',
        format: '3D',
        posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&auto=format&fit=crop&q=80',
        rating: 'U',
        releaseDate: new Date('2023-06-02'),
        status: 'now_showing',
      },
      {
        title: 'Gladiator II',
        description:
          'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist. With rage in his heart and the future of the Empire at stake, Lucius must look to his past to find strength and honor to return the glory of Rome to its people.',
        genre: ['Action', 'Drama', 'Adventure'],
        duration: 148,
        language: 'English',
        format: 'IMAX',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        rating: 'A',
        releaseDate: new Date('2024-11-15'),
        status: 'now_showing',
      },
    ]);

    const [mInception, mInterstellar, mDarkKnight, mOppenheimer, mDune, mSpiderman, mGladiator] = movies;
    console.log(`Movies created: ${movies.map((m) => m.title).join(', ')}`);

    // 5. Create Rich Multi-Day Showtimes for all movies starting from TODAY
    console.log('Creating showtimes...');
    const now = new Date();
    const timeSlots = [
      { hour: 10, minute: 0 },
      { hour: 13, minute: 30 },
      { hour: 17, minute: 0 },
      { hour: 20, minute: 30 },
    ];

    const showtimeData = [];
    for (let day = 0; day <= 6; day++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + day);

      screens.forEach((screen, screenIdx) => {
        timeSlots.forEach((slot, slotIdx) => {
          const movieIndex = (day * 2 + screenIdx + slotIdx) % movies.length;
          const movie = movies[movieIndex];

          const startTime = new Date(targetDate);
          startTime.setHours(slot.hour, slot.minute, 0, 0);

          const duration = movie.duration || 140;
          const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

          showtimeData.push({
            movie: movie._id,
            screen: screen._id,
            startTime,
            endTime,
            status: 'scheduled',
          });
        });
      });
    }

    const showtimes = await Showtime.create(showtimeData);
    console.log(`Created ${showtimes.length} showtimes.`);

    // 6. Create 2 Sample Bookings for customerUser
    console.log('Creating sample bookings...');
    const show1 = showtimes[0]; // Inception on screenMum1
    const show2 = showtimes[5]; // Dune on screenDel1

    // Sample Booking 1: Seats C-5, C-6 (Gold category: 360 each -> 720)
    const booking1Ref = 'BK-SEED0001';
    const qrCode1 = await QRCode.toDataURL(booking1Ref, { width: 300 });

    const booking1 = await Booking.create({
      user: customerUser._id,
      showtime: show1._id,
      seats: [
        { seatId: 'C-5', category: 'Gold', price: 360 },
        { seatId: 'C-6', category: 'Gold', price: 360 },
      ],
      totalAmount: 720,
      bookingRef: booking1Ref,
      qrCode: qrCode1,
      status: 'confirmed',
      paymentStatus: 'completed',
    });

    await SeatHold.create([
      {
        showtime: show1._id,
        seatId: 'C-5',
        user: customerUser._id,
        status: 'booked',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        showtime: show1._id,
        seatId: 'C-6',
        user: customerUser._id,
        status: 'booked',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);

    // Sample Booking 2: Seats F-3, F-4 (Platinum category: 580 each -> 1160)
    const booking2Ref = 'BK-SEED0002';
    const qrCode2 = await QRCode.toDataURL(booking2Ref, { width: 300 });

    const booking2 = await Booking.create({
      user: customerUser._id,
      showtime: show2._id,
      seats: [
        { seatId: 'F-3', category: 'Platinum', price: 580 },
        { seatId: 'F-4', category: 'Platinum', price: 580 },
      ],
      totalAmount: 1160,
      bookingRef: booking2Ref,
      qrCode: qrCode2,
      status: 'confirmed',
      paymentStatus: 'completed',
    });

    await SeatHold.create([
      {
        showtime: show2._id,
        seatId: 'F-3',
        user: customerUser._id,
        status: 'booked',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        showtime: show2._id,
        seatId: 'F-4',
        user: customerUser._id,
        status: 'booked',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log(`Created sample bookings: ${booking1.bookingRef}, ${booking2.bookingRef}`);

    // 7. Create Audit Logs
    console.log('Creating initial audit logs...');
    await AuditLog.create([
      {
        user: adminUser._id,
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'System',
        entityId: 'init',
        details: { seedDate: new Date(), message: 'System initialized with seed dataset' },
        ipAddress: '127.0.0.1',
      },
      {
        user: customerUser._id,
        action: 'CREATE_BOOKING',
        entityType: 'Booking',
        entityId: booking1._id.toString(),
        details: { bookingRef: booking1.bookingRef, totalAmount: 720, seats: ['C-5', 'C-6'] },
        ipAddress: '127.0.0.1',
      },
      {
        user: customerUser._id,
        action: 'CREATE_BOOKING',
        entityType: 'Booking',
        entityId: booking2._id.toString(),
        details: { bookingRef: booking2.bookingRef, totalAmount: 1160, seats: ['F-3', 'F-4'] },
        ipAddress: '127.0.0.1',
      },
    ]);

    console.log('\n===========================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('===========================================');
    console.log('Credentials:');
    console.log('  Admin User:    admin@cinema.com / admin123');
    console.log('  Customer User: john@example.com / password123');
    console.log('Data Created:');
    console.log(`  Movies:        ${movies.length}`);
    console.log(`  Theatres:      ${theatres.length}`);
    console.log(`  Screens:       ${screens.length}`);
    console.log(`  Showtimes:     ${showtimes.length}`);
    console.log(`  Bookings:      2 (References: ${booking1Ref}, ${booking2Ref})`);
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seedData();
