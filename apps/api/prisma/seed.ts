import { prisma } from '../src/prisma';
import bcrypt from 'bcryptjs';

// prisma initialized from ../src/prisma

async function main() {
  console.log('🌱 Starting database seeding for Kabadiwala Connect...');

  // Clean existing tables in reverse dependency order
  await prisma.transaction.deleteMany();
  await prisma.scrapItem.deleteMany();
  await prisma.pickup.deleteMany();
  await prisma.kabadiwalaProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.scrapRate.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Seed Scrap Rates
  const rates = [
    { category: 'Plastic', ratePerKg: 18.0, unit: 'kg', description: 'Bottles, containers, rigid & flexible LDPE/HDPE plastics', badge: 'High Demand', icon: 'Recycle' },
    { category: 'Paper', ratePerKg: 14.0, unit: 'kg', description: 'Old newspapers, corrugated cardboard, office papers, books', badge: 'Most Common', icon: 'FileText' },
    { category: 'Metal', ratePerKg: 36.0, unit: 'kg', description: 'Iron, steel, aluminium cans, brass utensils, copper wire', badge: 'Premium Rate', icon: 'Hammer' },
    { category: 'E-waste', ratePerKg: 55.0, unit: 'kg', description: 'Broken electronics, mobile phones, printed circuit boards, cables', badge: 'EPR Priority', icon: 'Cpu' },
    { category: 'Glass', ratePerKg: 5.0, unit: 'kg', description: 'Intact glass bottles, jars, broken cullet', badge: 'Eco Essential', icon: 'Wine' },
    { category: 'Organic', ratePerKg: 3.0, unit: 'kg', description: 'Dried garden waste, organic compostables, sawdust', badge: 'Bio-Compost', icon: 'Leaf' }
  ];

  for (const rate of rates) {
    await prisma.scrapRate.create({ data: rate });
  }
  console.log(`✅ Seeded ${rates.length} scrap categories.`);

  // 2. Seed Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Municipal Admin (NDMC)',
      phone: '9999900000',
      role: 'ADMIN',
      password: hashedPassword,
    }
  });

  // 3. Seed 5 Kabadiwalas
  const kabadiwalaData = [
    { name: 'Suresh Kumar', phone: '9876543210', verified: true, score: 4.9, balance: 1420.0, lat: 28.5685, lng: 77.2412, vehicle: 'Electric E-Rickshaw', aadhaar: '9128-4451-8901' },
    { name: 'Raju Rastogi', phone: '9876543211', verified: true, score: 4.7, balance: 850.0, lat: 28.5490, lng: 77.2020, vehicle: 'Pedal Rickshaw', aadhaar: '3412-8876-1290' },
    { name: 'Mohammed Irfan', phone: '9876543212', verified: false, score: 4.2, balance: 320.0, lat: 28.6320, lng: 77.2180, vehicle: 'Tata Ace Mini-truck', aadhaar: '7765-1209-4433' },
    { name: 'Dharmendra Pal', phone: '9876543213', verified: true, score: 4.8, balance: 2150.0, lat: 28.6510, lng: 77.1915, vehicle: 'Cargo Tricycle', aadhaar: '6543-9901-7782' },
    { name: 'Vikram Singh', phone: '9876543214', verified: false, score: 3.9, balance: 0.0, lat: 28.6360, lng: 77.3650, vehicle: 'Handcart (Thela)', aadhaar: '8901-2234-5511' },
  ];

  const kabadiwalas: any[] = [];
  for (const k of kabadiwalaData) {
    const user = await prisma.user.create({
      data: {
        name: k.name,
        phone: k.phone,
        role: 'KABADIWALA',
        password: hashedPassword,
        kabadiwala: {
          create: {
            verified: k.verified,
            reputationScore: k.score,
            walletBalance: k.balance,
            latitude: k.lat,
            longitude: k.lng,
            vehicleType: k.vehicle,
            aadhaarNumber: k.aadhaar,
            serviceRadiusKm: 6.0
          }
        }
      },
      include: { kabadiwala: true }
    });
    kabadiwalas.push(user);
  }
  console.log(`✅ Seeded ${kabadiwalas.length} Kabadiwalas with profiles & wallet balances.`);

  // 4. Seed 10 Citizens
  const citizenData = [
    { name: 'Ramesh Sharma', phone: '9811100001', address: 'Block D, Flat 402, Lajpat Nagar II, New Delhi', lat: 28.5700, lng: 77.2400 },
    { name: 'Priya Verma', phone: '9811100002', address: 'B-14, Green Park Extension, New Delhi', lat: 28.5580, lng: 77.2045 },
    { name: 'Ananya Gupta', phone: '9811100003', address: 'Tower 4, ATS Greens, Sector 50, Noida', lat: 28.5710, lng: 77.3700 },
    { name: 'Sunil Malhotra', phone: '9811100004', address: '12-A, Barakhamba Road, Connaught Place, New Delhi', lat: 28.6310, lng: 77.2220 },
    { name: 'Deepika Iyer', phone: '9811100005', address: 'Pocket C, Saket Court Road, New Delhi', lat: 28.5240, lng: 77.2180 },
    { name: 'Amitabh Joshi', phone: '9811100006', address: 'Plot 78, Rajendra Place, Karol Bagh, New Delhi', lat: 28.6480, lng: 77.1850 },
    { name: 'Kavita Chawla', phone: '9811100007', address: 'Flat 102, Shipra Sun City, Indirapuram, Ghaziabad', lat: 28.6370, lng: 77.3690 },
    { name: 'Rajesh Mehra', phone: '9811100008', address: 'Sector 14, Urban Estate, Gurgaon', lat: 28.4730, lng: 77.0420 },
    { name: 'Simran Sethi', phone: '9811100009', address: 'C-34, South Extension Part 1, New Delhi', lat: 28.5735, lng: 77.2215 },
    { name: 'Naveen Rao', phone: '9811100010', address: 'Sector 23, Dwarka, New Delhi', lat: 28.5820, lng: 77.0510 },
  ];

  const citizens: any[] = [];
  for (const c of citizenData) {
    const user = await prisma.user.create({
      data: {
        name: c.name,
        phone: c.phone,
        role: 'CITIZEN',
        password: hashedPassword,
      }
    });
    citizens.push({ ...user, address: c.address, lat: c.lat, lng: c.lng });
  }
  console.log(`✅ Seeded ${citizens.length} Citizens.`);

  // 5. Seed 20 Pickups with realistic progression
  // Storyline pickup: Ramesh requests -> Suresh accepts -> ready to complete or completed
  const suresh = kabadiwalas[0];
  const raju = kabadiwalas[1];
  const irfan = kabadiwalas[2];
  const dharmendra = kabadiwalas[3];

  const pickupsConfig = [
    // 1. The Showcase Storyline pickup (ACCEPTED by Suresh, pending completion)
    {
      citizenIdx: 0,
      kabadiwalaId: suresh.id,
      status: 'ACCEPTED',
      address: citizens[0].address,
      lat: citizens[0].lat,
      lng: citizens[0].lng,
      scheduledAt: new Date(Date.now() + 2 * 3600 * 1000),
      items: [
        { category: 'Plastic', estWeightKg: 12.0, ratePerKg: 18.0 },
        { category: 'Paper', estWeightKg: 8.0, ratePerKg: 14.0 },
      ],
      notes: 'Please call before arriving, building has security gate.'
    },
    // 2. Open REQUESTED pickups in nearby area (waiting for Kabadiwala to accept)
    {
      citizenIdx: 1,
      kabadiwalaId: null,
      status: 'REQUESTED',
      address: citizens[1].address,
      lat: citizens[1].lat,
      lng: citizens[1].lng,
      scheduledAt: new Date(Date.now() + 4 * 3600 * 1000),
      items: [
        { category: 'Metal', estWeightKg: 15.0, ratePerKg: 36.0 },
        { category: 'Paper', estWeightKg: 20.0, ratePerKg: 14.0 },
      ],
      notes: 'Heavy metal bed frame dismantled and old books'
    },
    {
      citizenIdx: 4,
      kabadiwalaId: null,
      status: 'REQUESTED',
      address: citizens[4].address,
      lat: citizens[4].lat,
      lng: citizens[4].lng,
      scheduledAt: new Date(Date.now() + 6 * 3600 * 1000),
      items: [
        { category: 'E-waste', estWeightKg: 6.5, ratePerKg: 55.0 },
        { category: 'Plastic', estWeightKg: 10.0, ratePerKg: 18.0 },
      ],
      notes: 'Old CRT monitor, broken microwave and water cans'
    },
    {
      citizenIdx: 8,
      kabadiwalaId: null,
      status: 'REQUESTED',
      address: citizens[8].address,
      lat: citizens[8].lat,
      lng: citizens[8].lng,
      scheduledAt: new Date(Date.now() + 24 * 3600 * 1000),
      items: [
        { category: 'Paper', estWeightKg: 35.0, ratePerKg: 14.0 },
        { category: 'Glass', estWeightKg: 8.0, ratePerKg: 5.0 },
      ],
      notes: 'Cartons from recent house move and glass beverage bottles'
    },
    // 3. IN_PROGRESS pickups
    {
      citizenIdx: 3,
      kabadiwalaId: dharmendra.id,
      status: 'IN_PROGRESS',
      address: citizens[3].address,
      lat: citizens[3].lat,
      lng: citizens[3].lng,
      scheduledAt: new Date(Date.now() - 1 * 3600 * 1000),
      items: [
        { category: 'Metal', estWeightKg: 22.0, ratePerKg: 36.0 },
        { category: 'Paper', estWeightKg: 15.0, ratePerKg: 14.0 },
      ],
      notes: 'Office spring cleaning scrap'
    },
    // 4. COMPLETED Pickups with transactions (contributes to Admin stats & metrics)
    {
      citizenIdx: 0,
      kabadiwalaId: suresh.id,
      status: 'COMPLETED',
      address: citizens[0].address,
      lat: citizens[0].lat,
      lng: citizens[0].lng,
      scheduledAt: new Date(Date.now() - 2 * 86400 * 1000),
      completedAt: new Date(Date.now() - 2 * 86400 * 1000 + 3600 * 1000),
      items: [
        { category: 'Plastic', estWeightKg: 10.0, actualWeightKg: 11.5, ratePerKg: 18.0 },
        { category: 'Paper', estWeightKg: 14.0, actualWeightKg: 15.0, ratePerKg: 14.0 }
      ],
      totalAmount: (11.5 * 18.0) + (15.0 * 14.0), // 207 + 210 = 417
    },
    {
      citizenIdx: 2,
      kabadiwalaId: suresh.id,
      status: 'COMPLETED',
      address: citizens[2].address,
      lat: citizens[2].lat,
      lng: citizens[2].lng,
      scheduledAt: new Date(Date.now() - 4 * 86400 * 1000),
      completedAt: new Date(Date.now() - 4 * 86400 * 1000 + 4000 * 1000),
      items: [
        { category: 'Metal', estWeightKg: 25.0, actualWeightKg: 28.0, ratePerKg: 36.0 },
        { category: 'E-waste', estWeightKg: 4.0, actualWeightKg: 4.5, ratePerKg: 55.0 }
      ],
      totalAmount: (28.0 * 36.0) + (4.5 * 55.0), // 1008 + 247.5 = 1255.5
    },
    {
      citizenIdx: 5,
      kabadiwalaId: raju.id,
      status: 'COMPLETED',
      address: citizens[5].address,
      lat: citizens[5].lat,
      lng: citizens[5].lng,
      scheduledAt: new Date(Date.now() - 5 * 86400 * 1000),
      completedAt: new Date(Date.now() - 5 * 86400 * 1000 + 3600 * 1000),
      items: [
        { category: 'Paper', estWeightKg: 40.0, actualWeightKg: 42.0, ratePerKg: 14.0 },
        { category: 'Plastic', estWeightKg: 8.0, actualWeightKg: 8.5, ratePerKg: 18.0 }
      ],
      totalAmount: (42.0 * 14.0) + (8.5 * 18.0), // 588 + 153 = 741
    },
    {
      citizenIdx: 6,
      kabadiwalaId: dharmendra.id,
      status: 'COMPLETED',
      address: citizens[6].address,
      lat: citizens[6].lat,
      lng: citizens[6].lng,
      scheduledAt: new Date(Date.now() - 7 * 86400 * 1000),
      completedAt: new Date(Date.now() - 7 * 86400 * 1000 + 3600 * 1000),
      items: [
        { category: 'Metal', estWeightKg: 18.0, actualWeightKg: 19.0, ratePerKg: 36.0 },
        { category: 'Glass', estWeightKg: 12.0, actualWeightKg: 14.0, ratePerKg: 5.0 }
      ],
      totalAmount: (19.0 * 36.0) + (14.0 * 5.0), // 684 + 70 = 754
    },
    {
      citizenIdx: 7,
      kabadiwalaId: suresh.id,
      status: 'COMPLETED',
      address: citizens[7].address,
      lat: citizens[7].lat,
      lng: citizens[7].lng,
      scheduledAt: new Date(Date.now() - 9 * 86400 * 1000),
      completedAt: new Date(Date.now() - 9 * 86400 * 1000 + 3600 * 1000),
      items: [
        { category: 'E-waste', estWeightKg: 12.0, actualWeightKg: 13.0, ratePerKg: 55.0 },
        { category: 'Organic', estWeightKg: 30.0, actualWeightKg: 32.0, ratePerKg: 3.0 }
      ],
      totalAmount: (13.0 * 55.0) + (32.0 * 3.0), // 715 + 96 = 811
    },
    {
      citizenIdx: 9,
      kabadiwalaId: raju.id,
      status: 'COMPLETED',
      address: citizens[9].address,
      lat: citizens[9].lat,
      lng: citizens[9].lng,
      scheduledAt: new Date(Date.now() - 11 * 86400 * 1000),
      completedAt: new Date(Date.now() - 11 * 86400 * 1000 + 3600 * 1000),
      items: [
        { category: 'Plastic', estWeightKg: 18.0, actualWeightKg: 20.0, ratePerKg: 18.0 },
        { category: 'Paper', estWeightKg: 25.0, actualWeightKg: 26.0, ratePerKg: 14.0 }
      ],
      totalAmount: (20.0 * 18.0) + (26.0 * 14.0), // 360 + 364 = 724
    },
    {
      citizenIdx: 1,
      kabadiwalaId: dharmendra.id,
      status: 'COMPLETED',
      address: citizens[1].address,
      lat: citizens[1].lat,
      lng: citizens[1].lng,
      scheduledAt: new Date(Date.now() - 14 * 86400 * 1000),
      completedAt: new Date(Date.now() - 14 * 86400 * 1000 + 3600 * 1000),
      items: [
        { category: 'Metal', estWeightKg: 32.0, actualWeightKg: 35.0, ratePerKg: 36.0 },
      ],
      totalAmount: 35.0 * 36.0, // 1260
    },
    {
      citizenIdx: 3,
      kabadiwalaId: suresh.id,
      status: 'COMPLETED',
      address: citizens[3].address,
      lat: citizens[3].lat,
      lng: citizens[3].lng,
      scheduledAt: new Date(Date.now() - 18 * 86400 * 1000),
      completedAt: new Date(Date.now() - 18 * 86400 * 1000 + 3600 * 1000),
      items: [
        { category: 'Paper', estWeightKg: 50.0, actualWeightKg: 54.0, ratePerKg: 14.0 },
        { category: 'Plastic', estWeightKg: 22.0, actualWeightKg: 24.0, ratePerKg: 18.0 }
      ],
      totalAmount: (54.0 * 14.0) + (24.0 * 18.0), // 756 + 432 = 1188
    },
    {
      citizenIdx: 4,
      kabadiwalaId: raju.id,
      status: 'COMPLETED',
      address: citizens[4].address,
      lat: citizens[4].lat,
      lng: citizens[4].lng,
      scheduledAt: new Date(Date.now() - 21 * 86400 * 1000),
      completedAt: new Date(Date.now() - 21 * 86400 * 1000 + 3600 * 1000),
      items: [
        { category: 'E-waste', estWeightKg: 8.0, actualWeightKg: 9.0, ratePerKg: 55.0 },
        { category: 'Metal', estWeightKg: 12.0, actualWeightKg: 12.5, ratePerKg: 36.0 }
      ],
      totalAmount: (9.0 * 55.0) + (12.5 * 36.0), // 495 + 450 = 945
    },
    {
      citizenIdx: 6,
      kabadiwalaId: suresh.id,
      status: 'COMPLETED',
      address: citizens[6].address,
      lat: citizens[6].lat,
      lng: citizens[6].lng,
      scheduledAt: new Date(Date.now() - 25 * 86400 * 1000),
      completedAt: new Date(Date.now() - 25 * 86400 * 1000 + 3600 * 1000),
      items: [
        { category: 'Plastic', estWeightKg: 30.0, actualWeightKg: 31.0, ratePerKg: 18.0 },
        { category: 'Glass', estWeightKg: 20.0, actualWeightKg: 22.0, ratePerKg: 5.0 }
      ],
      totalAmount: (31.0 * 18.0) + (22.0 * 5.0), // 558 + 110 = 668
    },
    // Additional open/scheduled requests
    {
      citizenIdx: 2,
      kabadiwalaId: null,
      status: 'REQUESTED',
      address: citizens[2].address,
      lat: citizens[2].lat,
      lng: citizens[2].lng,
      scheduledAt: new Date(Date.now() + 18 * 3600 * 1000),
      items: [
        { category: 'Plastic', estWeightKg: 14.0, ratePerKg: 18.0 },
      ],
      notes: 'Residential societies collection'
    },
    {
      citizenIdx: 5,
      kabadiwalaId: null,
      status: 'REQUESTED',
      address: citizens[5].address,
      lat: citizens[5].lat,
      lng: citizens[5].lng,
      scheduledAt: new Date(Date.now() + 20 * 3600 * 1000),
      items: [
        { category: 'Metal', estWeightKg: 18.0, ratePerKg: 36.0 },
        { category: 'Paper', estWeightKg: 10.0, ratePerKg: 14.0 },
      ],
      notes: 'Shop clearance'
    },
    {
      citizenIdx: 7,
      kabadiwalaId: null,
      status: 'REQUESTED',
      address: citizens[7].address,
      lat: citizens[7].lat,
      lng: citizens[7].lng,
      scheduledAt: new Date(Date.now() + 28 * 3600 * 1000),
      items: [
        { category: 'E-waste', estWeightKg: 7.0, ratePerKg: 55.0 },
      ],
      notes: 'Old UPS batteries and power supplies'
    },
    {
      citizenIdx: 8,
      kabadiwalaId: irfan.id,
      status: 'ACCEPTED',
      address: citizens[8].address,
      lat: citizens[8].lat,
      lng: citizens[8].lng,
      scheduledAt: new Date(Date.now() + 5 * 3600 * 1000),
      items: [
        { category: 'Paper', estWeightKg: 22.0, ratePerKg: 14.0 },
      ],
      notes: 'Gate keeper will hand over the bundles'
    },
    {
      citizenIdx: 9,
      kabadiwalaId: null,
      status: 'REQUESTED',
      address: citizens[9].address,
      lat: citizens[9].lat,
      lng: citizens[9].lng,
      scheduledAt: new Date(Date.now() + 32 * 3600 * 1000),
      items: [
        { category: 'Organic', estWeightKg: 40.0, ratePerKg: 3.0 },
        { category: 'Plastic', estWeightKg: 6.0, ratePerKg: 18.0 }
      ],
      notes: 'Dry leaves from society park + plastic packaging'
    }
  ];

  let pickupCount = 0;
  for (const pc of pickupsConfig) {
    const citizen = citizens[pc.citizenIdx];
    const pickup = await prisma.pickup.create({
      data: {
        citizenId: citizen.id,
        kabadiwalaId: pc.kabadiwalaId,
        status: pc.status,
        address: pc.address,
        latitude: pc.lat,
        longitude: pc.lng,
        scheduledAt: pc.scheduledAt,
        completedAt: pc.completedAt,
        totalAmount: pc.totalAmount || null,
        notes: pc.notes,
        items: {
          create: pc.items.map(item => ({
            category: item.category,
            estWeightKg: item.estWeightKg,
            actualWeightKg: (item as any).actualWeightKg || null,
            ratePerKg: item.ratePerKg
          }))
        }
      }
    });

    if (pc.status === 'COMPLETED' && pc.totalAmount && pc.kabadiwalaId) {
      await prisma.transaction.create({
        data: {
          pickupId: pickup.id,
          amount: pc.totalAmount,
          kabadiwalaId: pc.kabadiwalaId,
          status: 'PAID',
          paymentMethod: 'WALLET_ESCROW',
          createdAt: pc.completedAt || new Date()
        }
      });
    }

    pickupCount++;
  }

  console.log(`✅ Seeded ${pickupCount} realistic Pickups and completed Transactions.`);
  console.log('\n🎉 Database seeding complete!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('  Citizen:     9811100001 (Ramesh Sharma) / password123');
  console.log('  Kabadiwala:  9876543210 (Suresh Kumar) / password123');
  console.log('  Admin:       9999900000 (Municipal NDMC) / password123');
  console.log('----------------------------------------------------');
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
