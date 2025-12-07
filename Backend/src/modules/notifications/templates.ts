export const welcomeEmailTemplate = (name: string) => `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to SyncFlow, ${name}! 🚀</h2>
        <p>We are thrilled to have you on board. Get ready to manage your projects and tasks like never before.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <br>
        <p>Best regards,</p>
        <p>The SyncFlow Team</p>
    </div>
`;

export const projectInviteTemplate = (inviterName: string, projectName: string, link: string) => `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>You've been invited!</h2>
        <p><strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong>.</p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Join Project</a>
    </div>
`;

export const taskAssignedTemplate = (assignerName: string, taskTitle: string, link: string) => `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>New Task Assigned</h2>
        <p><strong>${assignerName}</strong> has assigned you a new task: <strong>${taskTitle}</strong>.</p>
        <p>View the task here:</p>
        <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">View Task</a>
    </div>
`;

export const resetPasswordEmailTemplate = (resetUrl: string) => {
    return {
        subject: "Reset Your Password - SyncFlow",
        text: `You requested a password reset. Click the link to reset your password: ${resetUrl}. This link will expire in 1 hour.`,
        html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>You requested a password reset for your SyncFlow account.</p>
            <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
            <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Reset Password</a>
            <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
        `
    };
};
