/**
 * Database Seed Script
 * Populates MongoDB with sample data for development/testing
 * Run with: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Facility = require('../models/Facility');
const Notice = require('../models/Notice');
const Complaint = require('../models/Complaint');
const Payment = require('../models/Payment');
const Visitor = require('../models/Visitor');

const seed = async () => {
  await connectDB();
  console.log('\n🌱 Starting database seed...\n');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Facility.deleteMany({}),
    Notice.deleteMany({}),
    Complaint.deleteMany({}),
    Payment.deleteMany({}),
    Visitor.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ===== Create Users =====
  // Pre-hash password once — use insertMany to bypass pre-save hook (prevents double-hashing)
  const hashedPassword = await bcrypt.hash('password123', 12);

  const usersData = [
    {
      name: 'Rajesh Kumar',
      email: 'admin@esociety.com',
      password: hashedPassword,
      role: 'admin',
      phone: '9876543210',
      flatNumber: 'OFFICE',
      block: 'Admin Block',
    },
    {
      name: 'Priya Sharma',
      email: 'priya@esociety.com',
      password: hashedPassword,
      role: 'resident',
      phone: '9876543211',
      flatNumber: 'A-101',
      block: 'A',
      vehicleNumber: 'MH-01-AB-1234',
    },
    {
      name: 'Arun Patel',
      email: 'arun@esociety.com',
      password: hashedPassword,
      role: 'resident',
      phone: '9876543212',
      flatNumber: 'B-202',
      block: 'B',
      vehicleNumber: 'MH-02-CD-5678',
    },
    {
      name: 'Sunita Mehta',
      email: 'sunita@esociety.com',
      password: hashedPassword,
      role: 'resident',
      phone: '9876543213',
      flatNumber: 'A-305',
      block: 'A',
    },
    {
      name: 'Vikram Singh',
      email: 'vikram@esociety.com',
      password: hashedPassword,
      role: 'resident',
      phone: '9876543214',
      flatNumber: 'C-401',
      block: 'C',
      vehicleNumber: 'MH-03-EF-9012',
    },
    {
      name: 'Suresh Guard',
      email: 'security@esociety.com',
      password: hashedPassword,
      role: 'security',
      phone: '9876543215',
    },
  ];

  // insertMany bypasses the pre-save hook — password is already hashed above
  const createdUsers = await User.insertMany(usersData);
  const admin    = createdUsers[0];
  const residents = createdUsers.slice(1, 5);
  const security  = createdUsers[5];

  console.log('✅ Users created: 1 admin, 4 residents, 1 security');

  // ===== Create Facilities =====
  await Facility.insertMany([
    {
      name: 'Gymnasium',
      description: 'State-of-the-art gym with modern equipment',
      type: 'gymnasium',
      pricePerHour: 0,
      capacity: 20,
      openTime: '06:00',
      closeTime: '22:00',
      amenities: ['AC', 'WiFi', 'Locker Room', 'Water Dispenser'],
      rules: ['No food inside', 'Wear proper sports shoes', 'Wipe equipment after use'],
      isActive: true,
    },
    {
      name: 'Swimming Pool',
      description: 'Olympic-size swimming pool with heated water',
      type: 'swimming_pool',
      pricePerHour: 100,
      capacity: 30,
      openTime: '06:00',
      closeTime: '20:00',
      availableDays: [1, 2, 3, 4, 5, 6],
      amenities: ['Changing Rooms', 'Shower', 'Lifeguard on Duty'],
      rules: ['Swimming costume mandatory', 'No children under 5 without adult', 'Shower before entering'],
      isActive: true,
    },
    {
      name: 'Clubhouse Hall',
      description: 'Spacious hall for private events and gatherings',
      type: 'clubhouse',
      pricePerHour: 500,
      capacity: 100,
      openTime: '09:00',
      closeTime: '22:00',
      amenities: ['AC', 'Projector', 'Sound System', 'Catering Kitchen'],
      rules: ['No alcohol without permission', '2 day advance booking required', 'Clean after use'],
      isActive: true,
    },
    {
      name: 'Tennis Court',
      description: 'All-weather synthetic tennis court',
      type: 'sports_court',
      pricePerHour: 200,
      capacity: 4,
      openTime: '06:00',
      closeTime: '21:00',
      amenities: ['Floodlights', 'Net', 'Equipment Storage'],
      rules: ['Proper tennis shoes mandatory', 'Max 2 hours per booking'],
      isActive: true,
    },
  ]);
  console.log('✅ Facilities created: 4 facilities');

  // ===== Create Notices =====
  await Notice.insertMany([
    {
      title: 'Annual General Meeting - 2024',
      content:
        'Dear Residents, The Annual General Meeting of Green Valley Society will be held on 20th January 2024. All residents are requested to attend. Agenda: Annual budget review, Election of new committee members, Discussion on ongoing maintenance issues.',
      type: 'event',
      priority: 'high',
      postedBy: admin._id,
      targetRole: 'all',
      eventDate: new Date('2024-01-20T18:00:00'),
      eventVenue: 'Clubhouse Hall',
    },
    {
      title: 'Water Supply Interruption Notice',
      content:
        'Water supply will be interrupted on 15th January 2024 from 9 AM to 1 PM due to scheduled maintenance of the water tank. Please store water accordingly.',
      type: 'maintenance_alert',
      priority: 'high',
      postedBy: admin._id,
      targetRole: 'all',
    },
    {
      title: 'New Year Celebration Poll',
      content: 'Vote for your preferred venue for the New Year celebration!',
      type: 'poll',
      priority: 'normal',
      postedBy: admin._id,
      targetRole: 'resident',
      pollOptions: [
        { option: 'Clubhouse Hall', votes: [residents[0]._id, residents[1]._id] },
        { option: 'Terrace Garden', votes: [residents[2]._id] },
        { option: 'Swimming Pool Area', votes: [residents[3]._id] },
      ],
    },
    {
      title: 'Parking Rules Reminder',
      content:
        'Residents are reminded that visitor parking is strictly in the designated visitor parking zone. Double parking will result in fine. Please cooperate.',
      type: 'notice',
      priority: 'normal',
      postedBy: admin._id,
      targetRole: 'resident',
    },
  ]);
  console.log('✅ Notices created: 4 notices');

  // ===== Create Complaints =====
  await Complaint.insertMany([
    {
      title: 'Water Leakage in Common Corridor',
      description:
        'There is a major water leakage in the corridor of Block A, Floor 1. The ceiling is dripping and creating slippery conditions.',
      category: 'plumbing',
      priority: 'urgent',
      status: 'in-progress',
      raisedBy: residents[0]._id,
      flatNumber: residents[0].flatNumber,
      assignedTo: admin._id,
      statusHistory: [
        { status: 'open', changedBy: residents[0]._id, note: 'Complaint raised' },
        { status: 'in-progress', changedBy: admin._id, note: 'Plumber assigned, will fix by tomorrow' },
      ],
    },
    {
      title: 'Gym Equipment Broken',
      description: 'The treadmill in the gymnasium is not working. The belt has snapped.',
      category: 'other',
      priority: 'medium',
      status: 'open',
      raisedBy: residents[1]._id,
      flatNumber: residents[1].flatNumber,
      statusHistory: [{ status: 'open', changedBy: residents[1]._id, note: 'Complaint raised' }],
    },
    {
      title: 'Street Light Not Working',
      description:
        'Two street lights near Block C entrance are not working for the past week. Security risk at night.',
      category: 'electrical',
      priority: 'high',
      status: 'resolved',
      raisedBy: residents[3]._id,
      flatNumber: residents[3].flatNumber,
      resolvedAt: new Date(),
      resolutionNote: 'Bulbs replaced by electrician',
      rating: 5,
      statusHistory: [
        { status: 'open', changedBy: residents[3]._id, note: 'Complaint raised' },
        { status: 'resolved', changedBy: admin._id, note: 'Bulbs replaced' },
      ],
    },
  ]);
  console.log('✅ Complaints created: 3 complaints');

  // ===== Create Payments =====
  // Generate unique invoice numbers to avoid duplicate-key errors on re-seed
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2024-01"
  const dueDate = new Date();
  dueDate.setDate(10);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  await Payment.insertMany(
    residents.map((r, i) => ({
      resident: r._id,
      flatNumber: r.flatNumber,
      type: 'maintenance',
      amount: 2500,
      penalty: i === 2 ? 250 : 0,
      totalAmount: i === 2 ? 2750 : 2500,
      status: i < 2 ? 'paid' : 'pending',
      paidAt: i < 2 ? new Date() : undefined,
      paymentMethod: i < 2 ? 'upi' : undefined,
      dueDate,
      billingPeriod: currentMonth,
      description: `Monthly maintenance for ${currentMonth}`,
      recordedBy: admin._id,
      // Unique per seed run so re-seeding never hits duplicate key
      invoiceNumber: `INV-${dateStr}-${1000 + i}`,
    }))
  );
  console.log('✅ Payments created: 4 maintenance records');

  // ===== Create Sample Visitors =====
  await Visitor.insertMany([
    {
      name: 'Ramesh Delivery',
      phone: '9000000001',
      purpose: 'delivery',
      resident: residents[0]._id,
      approvedBy: security._id,
      status: 'exited',
      entryTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      exitTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      name: 'Anjali Sharma',
      phone: '9000000002',
      purpose: 'guest',
      resident: residents[1]._id,
      status: 'inside',
      entryTime: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      name: 'Plumber Raju',
      phone: '9000000003',
      purpose: 'maintenance',
      resident: residents[0]._id,
      status: 'pending',
    },
  ]);
  console.log('✅ Visitors created: 3 visitor records\n');

  console.log('🎉 Database seeded successfully!\n');
  console.log('📋 Login Credentials:');
  console.log('   Admin:    admin@esociety.com / password123');
  console.log('   Resident: priya@esociety.com / password123');
  console.log('   Security: security@esociety.com / password123\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
