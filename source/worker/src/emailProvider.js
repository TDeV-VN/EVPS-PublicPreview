/* eslint-disable indent */
/* eslint-disable max-len */
import nodemailer from "nodemailer";
import { env } from "./configs/environment.js";

// Thiết lập Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.GOOGLE_APP_EMAIL,
    pass: env.GOOGLE_APP_PASSWORD,
  },
});

// --- Hàm Gửi Email ---

// Gửi email chứa mật khẩu mới sau khi reset
export const sendResetPasswordEmail = async (to, newPassword) => {
  const mailOptions = {
    from: env.GOOGLE_APP_EMAIL,
    to,
    subject: "Cấp lại mật khẩu cho tài khoản EVPS của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #0056b3;">Cấp lại mật khẩu thành công</h2>
        <p>Chào bạn,</p>
        <p>Bạn đã yêu cầu cấp lại mật khẩu cho tài khoản <strong>EVPS</strong> của mình.</p>
        <p>Đây là mật khẩu mới của bạn:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 5px 0 0 0;"><strong>Mật khẩu mới:</strong> <code style="background:#e1e2e4;padding:3px 8px;border-radius:4px;font-size:1.1em;">${newPassword}</code></p>
        </div>
        <p>Vui lòng sử dụng mật khẩu này để đăng nhập và đổi lại mật khẩu ngay sau đó để đảm bảo an toàn.</p>
        <p>Trân trọng,<br/>Đội ngũ EVPS</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// Gửi email xác nhận đăng ký và cung cấp mật khẩu tạm thời
export const sendRegistrationConfirmationEmail = async ({
  to,
  userName,
  tempPassword,
}) => {
  const mailOptions = {
    from: env.GOOGLE_APP_EMAIL,
    to,
    subject: "Chào mừng đến với EVPS! Thông tin tài khoản của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #28a745;">Chào mừng bạn, ${userName}!</h2>
        <p>Tài khoản của bạn tại <strong>EVPS</strong> đã được tạo thành công.</p>
        <p>Đây là thông tin đăng nhập của bạn:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 5px 0 0 0;"><strong>Mật khẩu tạm thời:</strong> <code style="background:#e1e2e4;padding:3px 8px;border-radius:4px;font-size:1.1em;">${tempPassword}</code></p>
        </div>
        <p>Vui lòng sử dụng mật khẩu này để đăng nhập lần đầu và đổi mật khẩu để bảo mật tài khoản.</p>
        <p>Trân trọng,<br/>Đội ngũ EVPS</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// Gửi email thông báo thay đổi mật khẩu
export const sendPasswordChangeNotificationEmail = async (to) => {
  const mailOptions = {
    from: env.GOOGLE_APP_EMAIL,
    to,
    subject: "Thông báo: Mật khẩu EVPS đã được thay đổi",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #dc3545;">Thông báo Quan trọng về Tài khoản</h2>
        <p>Chào bạn,</p>
        <p>Chúng tôi xin thông báo rằng <strong>mật khẩu tài khoản EVPS</strong> của bạn đã được thay đổi thành công vào thời điểm này.</p>
        
        <p style="padding: 15px; border-left: 5px solid #ffc107; background-color: #fff3cd;">
          <strong>Nếu bạn KHÔNG thực hiện thay đổi này</strong>, vui lòng <strong>liên hệ với chúng tôi ngay lập tức</strong> để bảo vệ tài khoản của bạn.
        </p>
        
        <p>Để đảm bảo an toàn, vui lòng không chia sẻ mật khẩu của bạn với bất kỳ ai.</p>
        <p>Trân trọng,<br/>Đội ngũ EVPS</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// Gửi lại OTP đơn giản
export const sendResendOtpEmail = async (
  to,
  otp,
  email_confirmation_token_life
) => {
  const mailOptions = {
    from: env.GOOGLE_APP_EMAIL,
    to,
    subject: "Mã OTP xác thực lại đăng ký GearUp",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>Mã OTP của bạn</h2>
        <p>Dùng mã dưới đây để hoàn tất xác thực:</p>
        <div style="text-align:center;font-size:24px;font-weight:bold;letter-spacing:4px;margin:18px 0;color:#111;">${otp}</div>
        <p>OTP sẽ hết hạn sau <strong>${
          email_confirmation_token_life / 3600
        } giờ</strong>.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// Gửi email chứa mật khẩu mới
export const sendNewPasswordEmail = async (to, newPassword) => {
  const mailOptions = {
    from: env.GOOGLE_APP_EMAIL,
    to,
    subject: "Mật khẩu mới cho tài khoản EVPS của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #0056b3;">Cấp lại mật khẩu thành công</h2>
        <p>Chào bạn,</p>
        <p>Đây là mật khẩu mới cho tài khoản <strong>EVPS</strong> của bạn:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 5px 0 0 0;"><strong>Mật khẩu mới của bạn:</strong> <code style="background:#e1e2e4;padding:3px 8px;border-radius:4px;font-size:1.1em;">${newPassword}</code></p>
        </div>
        <p>Vui lòng sử dụng mật khẩu này để đăng nhập và đổi lại mật khẩu ngay sau đó để đảm bảo an toàn.</p>
        <p>Trân trọng,<br/>Đội ngũ EVPS</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};
