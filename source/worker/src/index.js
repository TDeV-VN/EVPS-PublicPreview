import { Worker } from "bullmq";
import { env } from "./configs/environment.js";
import { myLogger } from "./loggers/myLogger.js";
import {
  sendRegistrationConfirmationEmail,
  sendResetPasswordEmail,
  sendPasswordChangeNotificationEmail,
  sendResendOtpEmail,
} from "./emailProvider.js";
import { CONNECT_DB } from "./configs/mongodb.js";

const redisConnection = {
  host: env.DEFAULT_REDIS_HOST,
  port: env.DEFAULT_REDIS_PORT,
  password: env.DEFAULT_REDIS_PASSWORD,
};

try {
  // Kết nối MongoDB
  await CONNECT_DB();
} catch (error) {
  // Hiện tại cái này không quan trọng nên không cần thoát
  myLogger.error("Error during initial setup: " + error.message, {
    stack: error.stack,
  });
  // process.exit(1);
}

const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    try {
      myLogger.info(
        `Starting Job #${job.id} of type ${job.name}, sending to ${job.data.to}`
      );
      if (job.name === "send_welcome_email") {
        await sendRegistrationConfirmationEmail({
          to: job.data.to,
          userName: job.data.userName,
          tempPassword: job.data.tempPassword,
        });
      } else if (job.name === "send_reset_password_email") {
        await sendResetPasswordEmail(job.data.to, job.data.newPassword);
      } else if (job.name === "send_password_change_notification_email") {
        await sendPasswordChangeNotificationEmail(job.data.to);
      } else if (job.name === "send_resend_otp_email") {
        await sendResendOtpEmail(
          job.data.to,
          job.data.otp,
          job.data.email_confirmation_token_life
        );
      } else {
        throw new Error(`Unknown job type: ${job.name}`);
      }
      return { status: "Success", sentTo: job.data.to };
    } catch (error) {
      myLogger.error(`Error processing job: ${error.message}`, {
        stack: error.stack,
      });
    }
  },
  { connection: redisConnection }
);

emailWorker.on("completed", (job, result) => {
  myLogger.info(`Job #${job.id} completed! Result: ${JSON.stringify(result)}`);
});

emailWorker.on("failed", (job, err) => {
  myLogger.error(`Job #${job.id} failed with error: ${err.message}`, {
    stack: err.stack,
  });
});

emailWorker.on("error", (err) => {
  myLogger.error(`Worker error: ${err.message}`, { stack: err.stack });
});

myLogger.info("Worker is running...");
