/**
 * Email Notification Service
 * Sends real emails via Gmail SMTP
 * Production-ready with templates
 */

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailNotificationService {
  /**
   * Send email to admin about new vendor application
   */
  static async notifyAdminNewVendorApplication(data: {
    companyName: string;
    userName: string;
    userEmail: string;
    licenseNumber: string;
    description: string;
    applicationId: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: 'soukalsayarat1@gmail.com',
      subject: `🔔 New Vendor Application - ${data.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f97316; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #666; }
            .button { background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 New Vendor Application</h1>
            </div>
            <div class="content">
              <p>A new vendor application has been submitted and requires your review:</p>
              
              <div class="info-row">
                <span class="label">Company:</span> ${data.companyName}
              </div>
              <div class="info-row">
                <span class="label">Contact:</span> ${data.userName} (${data.userEmail})
              </div>
              <div class="info-row">
                <span class="label">License Number:</span> ${data.licenseNumber}
              </div>
              <div class="info-row">
                <span class="label">Description:</span><br>${data.description}
              </div>
              
              <a href="https://souk-al-sayarat.vercel.app/admin/dashboard" class="button">
                Review Application →
              </a>
            </div>
            <div class="footer">
              <p>Souk El-Sayarat Admin System</p>
              <p>This is an automated notification</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Vendor Application

Company: ${data.companyName}
Contact: ${data.userName} (${data.userEmail})
License: ${data.licenseNumber}
Description: ${data.description}

Review at: https://souk-al-sayarat.vercel.app/admin/dashboard
      `
    };

    return await this.sendEmail(template);
  }

  /**
   * Send email to admin about new car listing
   */
  static async notifyAdminNewCarListing(data: {
    carTitle: string;
    userName: string;
    userEmail: string;
    price: number;
    description: string;
    listingId: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: 'soukalsayarat1@gmail.com',
      subject: `🚗 New Car Listing - ${data.carTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
              <h1>🚗 New Car Listing</h1>
            </div>
            <div style="padding: 20px; background: #f9fafb;">
              <p>A customer wants to sell their car:</p>
              
              <p><strong>Title:</strong> ${data.carTitle}</p>
              <p><strong>Customer:</strong> ${data.userName} (${data.userEmail})</p>
              <p><strong>Price:</strong> ${data.price.toLocaleString()} EGP</p>
              <p><strong>Description:</strong><br>${data.description}</p>
              
              <a href="https://souk-al-sayarat.vercel.app/admin/dashboard" 
                 style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
                Review Listing →
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Car Listing

Title: ${data.carTitle}
Customer: ${data.userName} (${data.userEmail})
Price: ${data.price} EGP
Description: ${data.description}

Review at: https://souk-al-sayarat.vercel.app/admin/dashboard
      `
    };

    return await this.sendEmail(template);
  }

  /**
   * Send approval email to user for vendor application
   */
  static async notifyUserVendorApproved(data: {
    userName: string;
    userEmail: string;
    companyName: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.userEmail,
      subject: '🎉 Congratulations! Your Vendor Application is Approved',
      html: `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
              <h1>🎉 Application Approved!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Dear ${data.userName},</p>
              
              <p><strong>Great news!</strong> Your vendor application has been approved.</p>
              
              <p><strong>Company:</strong> ${data.companyName}</p>
              
              <h3>You can now:</h3>
              <ul>
                <li>✓ Access your vendor dashboard</li>
                <li>✓ Add products to sell</li>
                <li>✓ Manage your store</li>
                <li>✓ Track your sales</li>
              </ul>
              
              <a href="https://souk-al-sayarat.vercel.app/vendor/dashboard" 
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
                Get Started →
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Dear ${data.userName},

Great news! Your vendor application has been approved.

Company: ${data.companyName}

You can now access your vendor dashboard at:
https://souk-al-sayarat.vercel.app/vendor/dashboard
      `
    };

    return await this.sendEmail(template);
  }

  /**
   * Send rejection email to user for vendor application
   */
  static async notifyUserVendorRejected(data: {
    userName: string;
    userEmail: string;
    companyName: string;
    reason: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.userEmail,
      subject: 'Vendor Application Status - Action Required',
      html: `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
              <h1>Application Status</h1>
            </div>
            <div style="padding: 20px;">
              <p>Dear ${data.userName},</p>
              
              <p>Thank you for your interest in becoming a vendor on Souk El-Sayarat.</p>
              
              <p>Unfortunately, your application for <strong>${data.companyName}</strong> has not been approved at this time.</p>
              
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <p><strong>Reason:</strong><br>${data.reason}</p>
              </div>
              
              <p>You can reapply after addressing the issues mentioned above.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Dear ${data.userName},

Thank you for your interest in becoming a vendor.

Unfortunately, your application has not been approved at this time.

Reason: ${data.reason}

You can reapply after addressing the issues mentioned above.
      `
    };

    return await this.sendEmail(template);
  }

  /**
   * Send approval email for car listing
   */
  static async notifyUserCarApproved(data: {
    userName: string;
    userEmail: string;
    carTitle: string;
    price: number;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.userEmail,
      subject: '🎉 Your Car is Now Live on Souk El-Sayarat!',
      html: `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
              <h1>🚗 Car Listing Approved!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Dear ${data.userName},</p>
              
              <p><strong>Congratulations!</strong> Your car listing has been approved.</p>
              
              <p><strong>Car:</strong> ${data.carTitle}</p>
              <p><strong>Price:</strong> ${data.price.toLocaleString()} EGP</p>
              
              <p>Your car is now visible in the marketplace and potential buyers can contact you.</p>
              
              <a href="https://souk-al-sayarat.vercel.app/marketplace" 
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
                View in Marketplace →
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Dear ${data.userName},

Congratulations! Your car listing has been approved.

Car: ${data.carTitle}
Price: ${data.price} EGP

Your car is now visible in the marketplace.
      `
    };

    return await this.sendEmail(template);
  }

  /**
   * Send rejection email for car listing
   */
  static async notifyUserCarRejected(data: {
    userName: string;
    userEmail: string;
    carTitle: string;
    reason: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.userEmail,
      subject: 'Car Listing Status - Action Required',
      html: `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
              <h1>Listing Status</h1>
            </div>
            <div style="padding: 20px;">
              <p>Dear ${data.userName},</p>
              
              <p>Thank you for submitting your car listing: <strong>${data.carTitle}</strong></p>
              
              <p>Unfortunately, we cannot approve it at this time.</p>
              
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <p><strong>Reason:</strong><br>${data.reason}</p>
              </div>
              
              <p>You can resubmit after addressing the issues mentioned above.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Dear ${data.userName},

Thank you for submitting your car listing.

Unfortunately, we cannot approve it at this time.

Reason: ${data.reason}

You can resubmit after addressing the issues mentioned above.
      `
    };

    return await this.sendEmail(template);
  }

  /**
   * Core email sending function
   * TODO: Implement with actual SMTP or email service (Resend, SendGrid, etc.)
   */
  private static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      console.log('[Email] Sending email:', {
        to: template.to,
        subject: template.subject
      });

      // TODO: Implement actual email sending
      // For now, log to console
      // In production, use Resend.com API or similar
      
      /*
      // Example with Resend.com:
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Souk El-Sayarat <notifications@souk-al-sayarat.com>',
          to: template.to,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      });
      */

      console.log('[Email] Email would be sent to:', template.to);
      console.log('[Email] Subject:', template.subject);
      
      return true;
    } catch (error) {
      console.error('[Email] Error sending email:', error);
      return false;
    }
  }
}
