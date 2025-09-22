// Email configuration for DiagnosticPro AI
export const EMAIL_CONFIG = {
  // Sender configuration
  sender: {
    name: "DiagnosticPro AI Reports",
    email: "reports@diagnosticpro.io",
    replyTo: "support@diagnosticpro.io",
  },

  // SMTP configuration for production
  smtp: {
    // Option 1: Gmail (requires app password)
    gmail: {
      service: "gmail",
      auth: {
        user: "reports@diagnosticpro.io",
        pass: process.env.GMAIL_APP_PASSWORD || "",
      },
    },

    // Option 2: SendGrid
    sendgrid: {
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY || "",
      },
    },

    // Option 3: Custom SMTP (for diagnosticpro.io domain)
    custom: {
      host: process.env.SMTP_HOST || "mail.diagnosticpro.io",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "reports@diagnosticpro.io",
        pass: process.env.SMTP_PASSWORD || "",
      },
    },
  },

  // Email templates
  templates: {
    diagnosticReport: {
      subject: (vehicle: string) => `Your DiagnosticPro AI Report - ${vehicle}`,
      preheader: "Your comprehensive vehicle diagnostic analysis is ready",
      footer: {
        company: "DiagnosticPro AI",
        tagline: "Professional Automotive Diagnostics",
        website: "https://diagnosticpro.io",
        support: "support@diagnosticpro.io",
        address: "DiagnosticPro AI, LLC",
        unsubscribe: "https://diagnosticpro.io/unsubscribe",
      },
    },

    testEmail: {
      subject: (num: number, vehicle: string) => `[TEST ${num}] Diagnostic Report - ${vehicle}`,
      disclaimer: "This is a test email for system verification",
    },
  },

  // Email tracking
  tracking: {
    enabled: true,
    pixelUrl: "https://diagnosticpro.io/track/email",
    clickTracking: true,
  },

  // Rate limiting
  rateLimit: {
    maxPerHour: 100,
    maxPerDay: 1000,
  },
};

// Get active SMTP configuration
export function getActiveSmtpConfig() {
  // Check which service has credentials
  if (process.env.GMAIL_APP_PASSWORD) {
    return {
      ...EMAIL_CONFIG.smtp.gmail,
      from: `"${EMAIL_CONFIG.sender.name}" <${EMAIL_CONFIG.sender.email}>`,
    };
  }

  if (process.env.SENDGRID_API_KEY) {
    return {
      ...EMAIL_CONFIG.smtp.sendgrid,
      from: `"${EMAIL_CONFIG.sender.name}" <${EMAIL_CONFIG.sender.email}>`,
    };
  }

  if (process.env.SMTP_PASSWORD) {
    return {
      ...EMAIL_CONFIG.smtp.custom,
      from: `"${EMAIL_CONFIG.sender.name}" <${EMAIL_CONFIG.sender.email}>`,
    };
  }

  // Fallback to test account
  return null;
}

// Validate email configuration
export function validateEmailConfig(): { valid: boolean; message: string } {
  const config = getActiveSmtpConfig();

  if (!config) {
    return {
      valid: false,
      message:
        "No email service configured. Set GMAIL_APP_PASSWORD, SENDGRID_API_KEY, or SMTP_PASSWORD in environment variables.",
    };
  }

  if (config.auth && !config.auth.pass) {
    return {
      valid: false,
      message: "Email service password/key is missing",
    };
  }

  return {
    valid: true,
    message: "Email configuration is valid",
  };
}
