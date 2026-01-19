import bcrypt from "bcryptjs";
import { userModel } from "../models/userModel.js";
import { env } from "../config/environment.js";
import { myLogger } from "../loggers/mylogger.log.js";

export const seedAdmin = async () => {
  try {
    const adminEmail = env.ADMIN_EMAIL || "admin@evps.com";
    const adminPassword = env.ADMIN_PASSWORD || "Admin@123";
    const adminName = env.ADMIN_NAME || "System Admin";

    // Check if exists
    const exists = await userModel.isUserExists(adminEmail);
    if (exists) {
      myLogger.info("Admin account already exists.");
      return;
    }

    myLogger.info("Seeding admin account...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminData = {
      email: adminEmail,
      password: hashedPassword,
      fullName: adminName,
      role: "admin",
      status: "active",
      emailVerifiedAt: new Date(),
      avatar: "https://via.placeholder.com/150",
    };

    await userModel.createUser(adminData);
    myLogger.info("Admin account created successfully.");
    myLogger.info(`Email: ${adminEmail}`);
    // Only log password in development or explicitly requested, but for initial setup helpful info.
    // For security, maybe not log password, but valid question is "how to configure", so user knows what password is.
    // Assuming this is for setup convenience.
    // myLogger.info(`Password: ${adminPassword}`);
  } catch (error) {
    myLogger.error("Failed to seed admin:", error);
  }
};
