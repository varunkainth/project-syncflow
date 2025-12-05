import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        console.log("------------------------------------------");
        console.log(`Sending email to: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${html}`);
        console.log("------------------------------------------");

        const info = await transporter.sendMail({
            from: `"AntiGravity" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // Don't throw error to avoid breaking the main flow, just log it
        return null;
    }
};
