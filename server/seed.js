const bcrypt = require('bcryptjs');
const { pool, initDB } = require('./config/db');

const users = [
    { name: 'Project X Admin', email: 'admin@eventora.com', password: 'password123', role: 'admin' },
    { name: 'Demo User', email: 'user@eventora.com', password: 'password123', role: 'user' },
    { name: 'Alice Smith', email: 'alice@eventora.com', password: 'password123', role: 'user' },
    { name: 'Bob Johnson', email: 'bob@eventora.com', password: 'password123', role: 'user' },
    { name: 'Charlie Dave', email: 'charlie@eventora.com', password: 'password123', role: 'user' },
    { name: 'Diana Prince', email: 'diana@eventora.com', password: 'password123', role: 'user' },
    { name: 'Ethan Hunt', email: 'ethan@eventora.com', password: 'password123', role: 'user' },
    { name: 'Fiona Gallagher', email: 'fiona@eventora.com', password: 'password123', role: 'user' },
    { name: 'George Miller', email: 'george@eventora.com', password: 'password123', role: 'user' },
    { name: 'Hannah Montana', email: 'hannah@eventora.com', password: 'password123', role: 'user' }
];

// Project X Experience events (from instagram.com/projectx.exp).
// The first three are UPCOMING PLACEHOLDERS: edit their dates, venues and prices before going live.
const at = (iso) => new Date(iso);
const events = [
    {
        title: 'One With Us — NYE 2026',
        description: 'Project X closes the year the only way we know how. One night, one room, one crowd.\n\nLast year’s One With Us at Bohca sold out the guestlist by 10 PM. This year is bigger.\n\nVenue, line-up and table packages announced soon. Entry via reservation only — profile verification mandatory.',
        date: at('2026-12-31T20:00:00+05:30'),
        location: 'Delhi — venue reveal soon',
        category: 'NYE',
        totalSeats: 300,
        ticketPrice: 3000,
        image: '/media/nye-2026.svg'
    },
    {
        title: 'Project Goa — The Return',
        description: 'We launched Project X in Goa and those six days were nothing short of madness. We said we’d be back sooner than you think.\n\nBeach days, after dark sets and the crowd that made Project Delhi what it is. Dates and passes dropping soon.',
        date: at('2027-01-15T18:00:00+05:30'),
        location: 'Goa — venue reveal soon',
        category: 'Festival',
        totalSeats: 500,
        ticketPrice: 2500,
        image: '/media/goa-soon.svg'
    },
    {
        title: 'Pop & Plunge 4.0',
        description: 'White fits. Pool dips. Foam. Vibes.\n\nProject X × London Hopshop bring Delhi’s favourite sundowner pool party back for its fourth edition. Pop. Plunge. Repeat.',
        date: at('2027-04-11T16:00:00+05:30'),
        location: 'Delhi NCR — venue reveal soon',
        category: 'Pool Party',
        totalSeats: 400,
        ticketPrice: 2000,
        image: '/media/pnp-lhs.jpg'
    },
    {
        title: 'Pop & Plunge 3.0 — All White Season Finale',
        description: 'White fits. Pool dips. Foam. Vibes. One last plunge to close out the summer.\n\nProject X & London Hopshop presented the season finale at Atrio by Devam, followed by the official after party at Buen with Artbuzzz and Fake Tattoos.',
        date: at('2026-09-06T16:00:00+05:30'),
        location: 'Atrio by Devam, Kapas Hera',
        category: 'Pool Party',
        totalSeats: 400,
        ticketPrice: 2000,
        image: '/media/pnp-crowd-1.jpg'
    },
    {
        title: 'Bergamo presents Project X',
        description: 'Deck duties by Aryan and Manav. Delhi, we were back — almost sold out before the official launch.\n\nTo keep it exclusive, profile verification was mandatory for every table and guest.',
        date: at('2026-08-22T21:00:00+05:30'),
        location: 'Bergamo, The Grand, Vasant Kunj',
        category: 'Club Night',
        totalSeats: 200,
        ticketPrice: 0,
        image: '/media/delhi-back.jpg'
    },
    {
        title: 'Project X — Bollywood Edition',
        description: 'We went Bollywood for the first time — and sold out in under 24 hours from launch.\n\nHosted by Akshat Pandey, Ayush Sharma, Aakash Beri and Ishaan Dhawan.',
        date: at('2026-07-17T21:00:00+05:30'),
        location: 'Bohca, Delhi',
        category: 'Club Night',
        totalSeats: 250,
        ticketPrice: 0,
        image: '/media/bollywood.jpg'
    },
    {
        title: 'Pop & Plunge 2.0',
        description: 'A social dive into summer. Warning: Delhi got drenched.\n\nProject X × London Hopshop took over The Tivoli for the second edition of the city’s favourite sundowner pool party, curated with Delhi’s best collectives.',
        date: at('2026-06-21T16:00:00+05:30'),
        location: 'The Tivoli, Chattarpur Mandir Road, Delhi',
        category: 'Pool Party',
        totalSeats: 400,
        ticketPrice: 2000,
        image: '/media/pnp-2.jpg'
    },
    {
        title: 'Late Night Club London',
        description: 'One date · two venues · two countries. Project X × MVM London took over The Cuckoo Club while Delhi partied at The First Floor.\n\nHosted by Akshat Pandey, Ayush Sharma and Ishaan Dhawan.',
        date: at('2026-05-16T22:00:00+01:00'),
        location: 'The Cuckoo Club, London',
        category: 'Club Night',
        totalSeats: 200,
        ticketPrice: 0,
        image: '/media/london.jpg'
    },
    {
        title: 'Project X at The First Floor',
        description: 'One date · two venues · two countries — the Delhi half of London ⇄ Delhi, with Surge Consultancy.\n\nGates open at 10 PM. Free entry till 11 PM.\n\nAfter 11 PM: Male stag ₹4K, Female stag ₹3K, Couple ₹5K (cover). Tables from ₹1 lakh minimum spend.',
        date: at('2026-05-16T22:00:00+05:30'),
        location: 'The First Floor, Delhi',
        category: 'Club Night',
        totalSeats: 250,
        ticketPrice: 3000,
        image: '/media/first-floor.jpg'
    },
    {
        title: 'Holiest Pop ’n’ Plunge 2026',
        description: 'Powered by Project X & Enormous. Colours louder. Beats harder. Vibes craziest.\n\nMusic | Colours | Water | Energy. Passes: Male ₹2000 · Female ₹1500 · Couple ₹3000. VIP tables from ₹75K.',
        date: at('2026-03-04T12:00:00+05:30'),
        location: 'Delhi',
        category: 'Holi',
        totalSeats: 500,
        ticketPrice: 1500,
        image: '/media/holi.jpg'
    },
    {
        title: 'White Party — London',
        description: 'London Hopshop presents a White Party with Project X Experience. Music by Prith.v, Sahib and Pranay.',
        date: at('2026-06-10T21:00:00+01:00'),
        location: 'House Party, 61 Poland St, London',
        category: 'All White',
        totalSeats: 200,
        ticketPrice: 0,
        image: '/media/house-party.jpg'
    },
    {
        title: 'One With Us — NYE 2025',
        description: 'Celebrating 3 years of Dias with Bohca × Project X. Deck duties by Rosejoint and Arnav.\n\n₹3,000 per person till 10 PM. Entry via reservation only.',
        date: at('2025-12-31T20:00:00+05:30'),
        location: 'Bohca × Dias, Delhi',
        category: 'NYE',
        totalSeats: 250,
        ticketPrice: 3000,
        image: '/media/one-with-us.jpg'
    },
    {
        title: 'Mistletoe & Martini',
        description: 'Bohca × Project X Christmas night. Deck duties by Rosejoint and Arnav.\n\nEntry via reservation only.',
        date: at('2025-12-25T22:00:00+05:30'),
        location: 'Bohca, Delhi',
        category: 'Christmas',
        totalSeats: 250,
        ticketPrice: 0,
        image: '/media/bohca-night.jpg'
    },
    {
        title: 'Sincity — Project X Halloween',
        description: 'Bohca × Project X. Step into the world of SINCITY, where indulgence meets rhythm.\n\nFeaturing Arnav, Rosejoint and Minus. Guestlist 9–11 PM. Tables: Outdoor ₹30K+, Standing ₹60K+, Couch ₹2L+.',
        date: at('2025-10-31T21:00:00+05:30'),
        location: 'Bohca, Delhi',
        category: 'Halloween',
        totalSeats: 300,
        ticketPrice: 0,
        image: '/media/halloween.jpg'
    },
    {
        title: 'Pop & Plunge — The First Edition',
        description: 'Enormous and Project X present Pop & Plunge — where the water whispers exclusivity. Early bird passes sold out.\n\nA never-witnessed-before sundowner dip voyage at Aria, The Tivoli.',
        date: at('2025-08-10T16:00:00+05:30'),
        location: 'The Tivoli, Chattarpur Mandir Road, Delhi',
        category: 'Pool Party',
        totalSeats: 400,
        ticketPrice: 1500,
        image: '/media/pnp-2025.jpg'
    }
];

const seedDatabase = async () => {
    try {
        await initDB();
        console.log('\n✅ MySQL connection open...');

        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const t of ['bookings', 'events', 'otps', 'users']) await pool.query(`TRUNCATE TABLE ${t}`);
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🗑️  Cleared existing data.');

        // Hash user passwords and insert users
        const salt = await bcrypt.genSalt(10);
        const createdUsers = [];
        for (const u of users) {
            const [r] = await pool.query(
                'INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, TRUE)',
                [u.name, u.email, bcrypt.hashSync(u.password, salt), u.role]
            );
            createdUsers.push({ ...u, id: r.insertId });
        }
        const adminUser = createdUsers.find(u => u.role === 'admin');
        const normalUsers = createdUsers.filter(u => u.role === 'user');
        console.log(`👤 Created ${createdUsers.length} total dummy users.`);

        // Link events to admin
        const createdEvents = [];
        for (const e of events) {
            const [r] = await pool.query(
                `INSERT INTO events (title, description, date, location, category, total_seats, available_seats, image, ticket_price, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [e.title, e.description, e.date, e.location, e.category, e.totalSeats, e.totalSeats, e.image, e.ticketPrice, adminUser.id]
            );
            createdEvents.push({ ...e, id: r.insertId });
        }
        console.log(`🎉 Created ${createdEvents.length} Project X events.`);

        // Generate Bookings Data: 3-6 random users per event with random statuses
        let bookingCount = 0;
        for (const event of createdEvents) {
            const randomCount = Math.floor(Math.random() * 4) + 3;
            const selectedUsers = [...normalUsers].sort(() => 0.5 - Math.random()).slice(0, randomCount);

            for (const user of selectedUsers) {
                const statuses = ['pending', 'confirmed', 'cancelled'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                let paymentStatus = 'not_paid';
                if (status === 'confirmed' && event.ticketPrice > 0) {
                    paymentStatus = Math.random() > 0.1 ? 'paid' : 'not_paid';
                } else if (event.ticketPrice === 0) {
                    paymentStatus = 'paid';
                }

                await pool.query(
                    'INSERT INTO bookings (user_id, event_id, status, payment_status, amount) VALUES (?, ?, ?, ?, ?)',
                    [user.id, event.id, status, paymentStatus, event.ticketPrice]
                );
                bookingCount++;

                // Deduct available seats specifically for confirmed tickets!
                if (status === 'confirmed') {
                    await pool.query('UPDATE events SET available_seats = available_seats - 1 WHERE id = ?', [event.id]);
                }
            }
        }
        console.log(`🎫 Inserted ${bookingCount} randomized dummy bookings (confirmed, pending, cancelled, paid, not_paid).`);

        console.log('\n🚀 Database seeded successfully!');
        console.log('-------------------------------------------');
        console.log('Admin Email: admin@eventora.com');
        console.log('User Email:  user@eventora.com');
        console.log('Password for all users: password123');
        console.log('-------------------------------------------\n');

        await pool.end();
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
        process.exit(1);
    }
};

seedDatabase();
