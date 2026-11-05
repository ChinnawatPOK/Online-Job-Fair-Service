const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });

const { pool, initTables } = require('../config/pgdb');
const User = require('../models/User');
const Company = require('../models/Company');

const companies = [
    {
        name: 'Chula Tech 123 Co., Ltd.',
        address: '254 Phayathai Rd, Pathumwan, Bangkok 10330',
        website: 'https://chulatech.example.com',
        description: 'Software house building web and mobile applications.',
        tel: '02-218-0001'
    },
    {
        name: 'Siam Data Analytics',
        address: '999 Rama I Rd, Pathumwan, Bangkok 10330',
        website: 'https://siamdata.example.com',
        description: 'Data engineering and business intelligence consulting.',
        tel: '02-218-0002'
    },
    {
        name: 'Bangkok Cloud Solutions',
        address: '88 Sathorn Rd, Sathorn, Bangkok 10120',
        website: 'https://bkkcloud.example.com',
        description: 'Cloud migration and DevOps services.',
        tel: '02-218-0003'
    },
    {
        name: 'Thai FinTech Labs',
        address: '1 Silom Rd, Bang Rak, Bangkok 10500',
        website: 'https://thaifintech.example.com',
        description: 'Payment and banking technology startup.',
        tel: '02-218-0004'
    },
    {
        name: 'Green Mobility Systems',
        address: '45 Vibhavadi Rangsit Rd, Chatuchak, Bangkok 10900',
        website: 'https://greenmobility.example.com',
        description: 'Electric vehicle and smart transport software.',
        tel: '02-218-0005'
    }
];

async function seed() {
    await initTables();

    // Clean slate so every demo / Newman run starts from the same data
    await pool.query('TRUNCATE audit_logs, reviews, bookmarks, bookings, companies, users RESTART IDENTITY CASCADE');

    await User.create({
        name: 'Admin',
        tel: '0800000000',
        email: 'admin@jobfair.com',
        password: process.env.SEED_ADMIN_PASSWORD || '12345678',
        role: 'admin'
    });

    for (const company of companies) {
        await Company.create(company);
    }

    console.log(`Seeded 1 admin and ${companies.length} companies`);
}

seed()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
