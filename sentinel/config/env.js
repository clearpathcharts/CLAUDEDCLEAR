import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  smtp_host: process.env.SMTP_HOST || "smtp.gmail.com",
  smtp_port: parseInt(process.env.SMTP_PORT || "587"),
  smtp_user: process.env.SMTP_USER || "",
  smtp_pass: process.env.SMTP_PASS || "",
  alert_email_from: process.env.ALERT_EMAIL_FROM || "clearpathcharts@gmail.com",
  openai_api_key: process.env.OPENAI_API_KEY || ""
};
