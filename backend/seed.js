import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

// Load env vars
dotenv.config();

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
        plainPassword: adminPassword,
        email: adminEmail,
        role: 'admin',
        isSuperAdmin: true,
      });
      console.log('Admin user created successfully.');
    } else {
      console.log(`Updating Admin user credentials for: ${adminUsername}`);
      existingAdmin.username = adminUsername;
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.plainPassword = adminPassword;
      existingAdmin.email = adminEmail;
      existingAdmin.role = 'admin';
      existingAdmin.isSuperAdmin = true;
      await existingAdmin.save();
      console.log('Admin user updated successfully.');
    }

    // 2. Delete Dummy User (User1) if present
    const deleteResult = await User.deleteMany({ username: 'User1' });
    if (deleteResult.deletedCount > 0) {
      console.log(`Deleted ${deleteResult.deletedCount} dummy user(s) 'User1'.`);
    } else {
      console.log("No dummy user 'User1' found to delete.");
    }

    console.log('Database seeding & cleanup completed successfully!');
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
