# EmailJS Setup Guide for LuxDrive Contact Form

## Overview

The contact form on the LuxDrive website uses EmailJS to send emails directly from the browser to mariam.khmaladze@iset.ge.

## Setup Steps

### 1. Create EmailJS Account

1. Go to https://www.emailjs.com/
2. Sign up for a free account
3. Verify your email

### 2. Create Email Service

1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Connect your email account
5. Note down the **Service ID** (something like "service_xxxxx")

### 3. Create Email Template

1. Go to "Email Templates" in your dashboard
2. Click "Create New Template"
3. Set up the template with these variables:
   - **To Email**: mariam.khmaladze@iset.ge
   - **From Name**: {{firstName}} {{lastName}}
   - **From Email**: {{email}}
   - **Subject**: New Contact Form Message: {{subject}}
   - **Message Body**:

     ```
     New contact form submission from LuxDrive website:

     Name: {{firstName}} {{lastName}}
     Email: {{email}}
     Phone: {{phone}}
     Subject: {{subject}}

     Message:
     {{message}}

     Sent on: {{current_date}}
     ```

4. Save the template and note down the **Template ID** (something like "template_xxxxx")

### 4. Get Your Public Key

1. Go to "Account" in your dashboard
2. Copy your **Public Key** (something like "xxxxxxxxxxxxxx")

### 5. Update the Contact Form Code

In `contact.html`, replace these placeholders:

- `YOUR_PUBLIC_KEY` → Your Public Key
- `YOUR_SERVICE_ID` → Your Service ID
- `YOUR_TEMPLATE_ID` → Your Template ID

### 6. Test the Form

1. Open the contact page
2. Fill out and submit the form
3. Check your email (mariam.khmaladze@iset.ge) for the message

## Security Notes

- The Public Key is safe to use in frontend code
- Never expose your Private Key in client-side code
- EmailJS has rate limits on the free plan (200 emails/month)

## Troubleshooting

- If emails aren't sending, check the browser console for errors
- Verify all IDs and keys are correct
- Make sure your email service is properly connected in EmailJS

## Alternative Solutions

If EmailJS doesn't work for your needs, consider:

- Formspree (https://formspree.io/)
- Netlify Forms (if hosting on Netlify)
- Custom backend API</content>
  <parameter name="filePath">c:\Users\User\Desktop\WebDevelopment_Course\finaal\LuxDrive\EMAIL_SETUP.md
