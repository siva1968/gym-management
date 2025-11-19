const dotenv = require('dotenv');
const { sequelize, testConnection } = require('../config/database');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const MembershipPlan = require('../models/MembershipPlan');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const samplePlans = [
  {
    name: 'Monthly Strength',
    description: 'Access to all strength training equipment',
    duration: { value: 1, unit: 'months' },
    price: 2000,
    membershipType: 'Strength',
    features: ['Access to gym floor', 'Locker facility', 'Free weights', 'Machines'],
    discount: 0,
    isActive: true
  },
  {
    name: 'Quarterly Strength + Cardio',
    description: 'Complete access to gym and cardio zone',
    duration: { value: 3, unit: 'months' },
    price: 5400,
    membershipType: 'Strength + Cardio',
    features: ['All gym equipment', 'Cardio zone', 'Locker facility', 'Shower access'],
    discount: 10,
    isActive: true
  },
  {
    name: 'Annual Premium',
    description: 'Full year access with personal training',
    duration: { value: 1, unit: 'years' },
    price: 20000,
    membershipType: 'Personal Training',
    features: ['All equipment', 'Personal trainer', 'Nutrition guidance', 'Progress tracking'],
    discount: 15,
    isActive: true
  },
  {
    name: 'Monthly Cardio',
    description: 'Cardio equipment only',
    duration: { value: 1, unit: 'months' },
    price: 1500,
    membershipType: 'Cardio',
    features: ['Treadmills', 'Ellipticals', 'Bikes', 'Locker facility'],
    discount: 0,
    isActive: true
  }
];

const sampleTrainers = [
  {
    trainerId: 'TRN20240001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@elitearena.com',
    phone: '9876543210',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'male',
    specialization: ['Strength Training', 'Personal Training'],
    experience: 5,
    joiningDate: new Date('2020-01-15'),
    employmentType: 'full-time',
    baseSalary: 30000,
    maxCapacity: 20,
    isActive: true
  },
  {
    trainerId: 'TRN20240002',
    name: 'Priya Patel',
    email: 'priya.patel@elitearena.com',
    phone: '9876543211',
    dateOfBirth: new Date('1992-08-20'),
    gender: 'female',
    specialization: ['Yoga', 'Nutrition'],
    experience: 3,
    joiningDate: new Date('2021-06-01'),
    employmentType: 'full-time',
    baseSalary: 25000,
    maxCapacity: 15,
    isActive: true
  },
  {
    trainerId: 'TRN20240003',
    name: 'Vikram Singh',
    email: 'vikram.singh@elitearena.com',
    phone: '9876543212',
    dateOfBirth: new Date('1988-03-10'),
    gender: 'male',
    specialization: ['CrossFit', 'Cardio'],
    experience: 7,
    joiningDate: new Date('2019-03-20'),
    employmentType: 'full-time',
    baseSalary: 35000,
    maxCapacity: 25,
    isActive: true
  }
];

const generateSampleMembers = async (plans, trainers) => {
  const members = [];
  const names = [
    { first: 'Amit', last: 'Kumar' },
    { first: 'Sneha', last: 'Reddy' },
    { first: 'Rajesh', last: 'Verma' },
    { first: 'Pooja', last: 'Gupta' },
    { first: 'Arjun', last: 'Nair' },
    { first: 'Kavya', last: 'Iyer' },
    { first: 'Rohit', last: 'Malhotra' },
    { first: 'Divya', last: 'Kapoor' },
    { first: 'Siddharth', last: 'Joshi' },
    { first: 'Ananya', last: 'Desai' }
  ];

  for (let i = 0; i < 10; i++) {
    const name = `${names[i].first} ${names[i].last}`;
    const memberId = `MEM2024${String(i + 1).padStart(4, '0')}`;
    const plan = plans[i % plans.length];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60)); // Random date in last 2 months

    const endDate = new Date(startDate);
    if (plan.duration.unit === 'months') {
      endDate.setMonth(endDate.getMonth() + plan.duration.value);
    } else if (plan.duration.unit === 'years') {
      endDate.setFullYear(endDate.getFullYear() + plan.duration.value);
    }

    const qrData = JSON.stringify({ memberId, id: uuidv4() });
    const qrCode = await QRCode.toDataURL(qrData);

    const paidAmount = i % 3 === 0 ? 0 : plan.price; // Every 3rd member has pending payment

    members.push({
      memberId,
      name,
      email: `${names[i].first.toLowerCase()}.${names[i].last.toLowerCase()}@example.com`,
      phone: `98765${String(43210 + i)}`,
      dateOfBirth: new Date(1990 + i, i % 12, (i + 1) * 2),
      age: 34 - i,
      gender: i % 2 === 0 ? 'male' : 'female',
      weight: 60 + i * 3,
      height: 160 + i * 2,
      membershipType: plan.membershipType,
      planId: plan.id,
      startDate,
      endDate,
      totalFees: plan.price,
      paidAmount,
      assignedTrainerId: trainers[i % trainers.length].id,
      qrCode,
      fitnessGoal: i % 2 === 0 ? 'Weight Loss' : 'Muscle Gain',
      status: new Date() > endDate ? 'expired' : 'active'
    });
  }

  return members;
};

const generateSampleAttendance = async (members) => {
  const attendance = [];
  const now = new Date();

  for (const member of members) {
    // Generate attendance for last 30 days
    for (let day = 0; day < 30; day++) {
      // Random attendance (70% chance of attending)
      if (Math.random() > 0.3) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);

        const checkInTime = new Date(date);
        checkInTime.setHours(6 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

        const checkOutTime = new Date(checkInTime);
        checkOutTime.setMinutes(checkOutTime.getMinutes() + 60 + Math.floor(Math.random() * 90));

        attendance.push({
          memberId: member.id,
          memberIdString: member.memberId,
          memberName: member.name,
          date,
          checkInTime,
          checkOutTime,
          checkInMethod: Math.random() > 0.5 ? 'qr-code' : 'manual'
        });
      }
    }
  }

  return attendance;
};

const generateSamplePayments = async (members) => {
  const payments = [];

  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    // Only create payments for members who have paid
    if (member.paidAmount > 0) {
      payments.push({
        memberId: member.id,
        memberIdString: member.memberId,
        memberName: member.name,
        amount: member.paidAmount,
        paymentDate: member.startDate,
        paymentMethod: ['cash', 'upi', 'card', 'net-banking'][i % 4],
        planId: member.planId,
        description: 'Membership fee payment',
        status: 'completed'
      });
    }
  }

  return payments;
};

const generateSampleExpenses = () => {
  const expenses = [];
  const now = new Date();
  const categories = ['Rent', 'Equipment', 'Utilities', 'Salaries', 'Marketing', 'Maintenance'];
  const titles = {
    Rent: 'Monthly rent payment',
    Equipment: 'New equipment purchase',
    Utilities: 'Electricity and water bill',
    Salaries: 'Staff salary payment',
    Marketing: 'Social media advertising',
    Maintenance: 'Equipment maintenance'
  };

  // Generate expenses for last 3 months
  for (let month = 0; month < 3; month++) {
    for (const category of categories) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - month);
      date.setDate(5 + Math.floor(Math.random() * 10));

      const baseAmounts = {
        Rent: 50000,
        Equipment: 15000,
        Utilities: 8000,
        Salaries: 150000,
        Marketing: 5000,
        Maintenance: 3000
      };

      expenses.push({
        title: titles[category],
        category,
        amount: baseAmounts[category] + Math.floor(Math.random() * 5000),
        date,
        paymentMethod: ['cash', 'upi', 'net-banking'][Math.floor(Math.random() * 3)],
        description: `${titles[category]} for ${date.toLocaleString('default', { month: 'long' })}`,
        isRecurring: ['Rent', 'Utilities', 'Salaries'].includes(category)
      });
    }
  }

  return expenses;
};

const seedDatabase = async () => {
  try {
    await testConnection();
    console.log('Connected to PostgreSQL');

    // Sync all models (create tables if they don't exist)
    await sequelize.sync({ force: true });
    console.log('Database synced (all tables created)');

    console.log('Clearing existing data...');

    // Clear existing data
    await Member.destroy({ where: {}, truncate: true, cascade: true });
    await Trainer.destroy({ where: {}, truncate: true, cascade: true });
    await MembershipPlan.destroy({ where: {}, truncate: true, cascade: true });
    await Attendance.destroy({ where: {}, truncate: true, cascade: true });
    await Payment.destroy({ where: {}, truncate: true, cascade: true });
    await Expense.destroy({ where: {}, truncate: true, cascade: true });

    console.log('Creating sample membership plans...');
    const plans = await MembershipPlan.bulkCreate(samplePlans);
    console.log(`✓ Created ${plans.length} membership plans`);

    console.log('Creating sample trainers...');
    const trainers = await Trainer.bulkCreate(sampleTrainers);
    console.log(`✓ Created ${trainers.length} trainers`);

    console.log('Creating sample members...');
    const memberData = await generateSampleMembers(plans, trainers);
    const members = await Member.bulkCreate(memberData);
    console.log(`✓ Created ${members.length} members`);

    console.log('Creating sample attendance records...');
    const attendanceData = await generateSampleAttendance(members);
    const attendance = await Attendance.bulkCreate(attendanceData);
    console.log(`✓ Created ${attendance.length} attendance records`);

    console.log('Creating sample payments...');
    const paymentData = await generateSamplePayments(members);
    const payments = await Payment.bulkCreate(paymentData);
    console.log(`✓ Created ${payments.length} payment records`);

    console.log('Creating sample expenses...');
    const expenseData = generateSampleExpenses();
    const expenses = await Expense.bulkCreate(expenseData);
    console.log(`✓ Created ${expenses.length} expense records`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSummary:');
    console.log(`- Membership Plans: ${plans.length}`);
    console.log(`- Trainers: ${trainers.length}`);
    console.log(`- Members: ${members.length}`);
    console.log(`- Attendance Records: ${attendance.length}`);
    console.log(`- Payments: ${payments.length}`);
    console.log(`- Expenses: ${expenses.length}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
