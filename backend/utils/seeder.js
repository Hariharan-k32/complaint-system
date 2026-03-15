const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { Department } = require('../models/index');

const departments = [
  { name: 'Roads & Infrastructure', code: 'ROADS', categories: ['Roads & Infrastructure', 'Transportation'], contactEmail: 'roads@city.gov' },
  { name: 'Water & Sanitation', code: 'WATER', categories: ['Water Supply', 'Sanitation'], contactEmail: 'water@city.gov' },
  { name: 'Electricity Department', code: 'ELEC', categories: ['Electricity'], contactEmail: 'electricity@city.gov' },
  { name: 'Public Safety', code: 'SAFETY', categories: ['Public Safety'], contactEmail: 'safety@city.gov' },
  { name: 'Healthcare', code: 'HEALTH', categories: ['Healthcare'], contactEmail: 'health@city.gov' },
  { name: 'Environment', code: 'ENV', categories: ['Environment', 'Other'], contactEmail: 'env@city.gov' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/complaint_system');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany(), Complaint.deleteMany(), Department.deleteMany()]);
    console.log('Cleared existing data');

    // Create departments
    const createdDepts = await Department.insertMany(departments);
    console.log('Departments seeded');

    // Create users
    const password = await bcrypt.hash('Password123!', 12);

    const users = await User.insertMany([
      { name: 'System Admin', email: 'admin@system.com', password, role: 'admin' },
{ name: 'John Staff', email: 'staff@system.com', password, role: 'staff', department: createdDepts[0]._id },
{ name: 'Jane Citizen', email: 'citizen@system.com', password, role: 'citizen', address: { street: '123 Main St', city: 'Springfield', state: 'IL', zipCode: '62701' } },
{ name: 'Bob Citizen', email: 'bob@example.com', password, role: 'citizen' },
{ name: 'Alice Smith', email: 'alice@example.com', password, role: 'citizen' },
    ]);
    console.log('Users seeded');

    const citizen1 = users[2];
    const citizen2 = users[3];
    const staff = users[1];

    // Create sample complaints
    const complaints = [
      { title: 'Pothole on Main Street', description: 'Large pothole causing damage to vehicles near the intersection of Main St and 5th Ave. Needs immediate repair.', category: 'Roads & Infrastructure', priority: 'High', status: 'In Progress', location: { address: 'Main St & 5th Ave, Springfield, IL' }, citizen: citizen1._id, assignedTo: staff._id, department: createdDepts[0]._id },
      { title: 'Water Supply Disruption', description: 'No water supply in our area for the past 3 days. Residents are suffering without basic amenities.', category: 'Water Supply', priority: 'Urgent', status: 'Under Review', location: { address: '456 Oak Ave, Springfield, IL' }, citizen: citizen1._id },
      { title: 'Street Light Not Working', description: 'The street light on Elm Street has been non-functional for 2 weeks. The area is very dark and unsafe at night.', category: 'Electricity', priority: 'Medium', status: 'Submitted', location: { address: 'Elm Street, Springfield, IL' }, citizen: citizen2._id },
      { title: 'Garbage Collection Missed', description: 'Garbage has not been collected for the past week in our neighborhood causing health hazards.', category: 'Sanitation', priority: 'High', status: 'Resolved', location: { address: '789 Pine Rd, Springfield, IL' }, citizen: citizen2._id, resolvedAt: new Date() },
      { title: 'Park Maintenance Required', description: 'The central park equipment is damaged and poses a safety risk to children playing there.', category: 'Public Safety', priority: 'Medium', status: 'Closed', location: { address: 'Central Park, Springfield, IL' }, citizen: citizen1._id, resolvedAt: new Date(), closedAt: new Date() },
    ];

    await Complaint.insertMany(complaints);
    console.log('Complaints seeded');

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('   Admin:   admin@system.com   / Password123!');
    console.log('   Staff:   staff@system.com   / Password123!');
    console.log('   Citizen: citizen@system.com / Password123!');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
