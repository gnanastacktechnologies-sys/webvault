import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Category from './models/Category.js';

// Load env vars
dotenv.config();

const defaultCategories = [
  { name: 'Development', description: 'GitHub, IDEs, and coding docs', icon: 'FaCode', color: '#4F46E5' },
  { name: 'AI Tools', description: 'LLMs, image generation, and prompt helpers', icon: 'FaBrain', color: '#8B5CF6' },
  { name: 'Hosting', description: 'Cloud providers, hosting panels, and DNS', icon: 'FaCloud', color: '#06B6D4' },
  { name: 'Education', description: 'Tutorial sites, e-learning, and research libraries', icon: 'FaGraduationCap', color: '#F59E0B' },
  { name: 'Government', description: 'Tax portals, identity databases, and civil services', icon: 'FaBuilding', color: '#10B981' },
  { name: 'Social Media', description: 'Social interaction and community networks', icon: 'FaShareAlt', color: '#EC4899' },
  { name: 'Finance', description: 'Banking, investments, and tax calculations', icon: 'FaWallet', color: '#10B981' },
  { name: 'Work', description: 'Corporate workspaces, emails, and project boards', icon: 'FaBriefcase', color: '#3B82F6' },
  { name: 'Other', description: 'Miscellaneous bookmarks', icon: 'FaEllipsisH', color: '#6B7280' },
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Seeding database...');

    // 1. Seed / Update Admin User
    const adminUsername = process.env.ADMIN_USERNAME || 'Gnanasekaran';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Gnana123@';
    const adminEmail = process.env.EMAIL_FROM || 'gnanastacktechnologies@gmail.com';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    let existingAdmin = await User.findOne({ username: adminUsername });
    if (!existingAdmin) {
      existingAdmin = await User.findOne({});
    }

    if (!existingAdmin) {
      console.log(`Creating Admin user: ${adminUsername}`);
      await User.create({
        username: adminUsername,
        passwordHash,
        email: adminEmail,
      });
      console.log('Admin user created successfully.');
    } else {
      console.log(`Updating Admin user credentials for: ${adminUsername}`);
      existingAdmin.username = adminUsername;
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.email = adminEmail;
      await existingAdmin.save();
      console.log('Admin user updated successfully.');
    }

    // 2. Seed Default Categories
    for (const cat of defaultCategories) {
      const existingCategory = await Category.findOne({ name: cat.name });
      if (!existingCategory) {
        console.log(`Creating Category: ${cat.name}`);
        await Category.create(cat);
      } else {
        console.log(`Category '${cat.name}' already exists. Skipping.`);
      }
    }

    console.log('Database seeding completed successfully!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`Database seeding failed: ${error.message}`);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();
