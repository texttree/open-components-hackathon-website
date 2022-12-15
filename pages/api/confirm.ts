import { NextApiRequest, NextApiResponse } from 'next';
import { ConfUser } from '@lib/types';
import validator from 'validator';
import { formConfirm, getTicketNumberByUserId, getUserById } from '@lib/db-api';
import { emailToId } from '@lib/user-api';

import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const transporter = nodemailer.createTransport(<SMTPTransport.Options>{
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_LOGIN,
    pass: process.env.SMTP_PASSWORD
  },
  logger: true
});

type ErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

export default async function sendConfirmEmail(
  req: NextApiRequest,
  res: NextApiResponse<ConfUser | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(501).json({
      error: {
        code: 'method_unknown',
        message: 'This endpoint only responds to POST'
      }
    });
  }

  const email: string = ((req.body.email as string) || '').trim().toLowerCase();
  if (!validator.isEmail(email)) {
    return res.status(400).json({
      error: {
        code: 'bad_email',
        message: 'Invalid email'
      }
    });
  }

  const id = emailToId(email);
  const existingTicketNumberString = await getTicketNumberByUserId(id);

  if (existingTicketNumberString) {
    try {
      await formConfirm(id, String(req.body.name));
    } catch (error) {
      return res.status(404).json({
        error: {
          code: 'registration_not_completed',
          message: 'Registration not completed'
        }
      });
    }
    const user = await getUserById(id);
    const name = user.name;
    await transporter.sendMail({
      from: `"Support" <${process.env.SMTP_LOGIN}>`,
      to: 'foxprogs@gmail.com',
      subject: `${name}! You are registered for the hackathon`,
      text: `Hello ${name}!
You have successfully registered for the hackathon.
From February 13 to 17, the first part, Lernathon, will take place.
Don't forget to add a reminder to your calendar.
Also join our discord.
https://discord.gg/2zjFVgaw4E

We are glad to see you at the hackathon!`,
      html: `<h2>Hello ${name}!</h2>
<p>You have successfully registered for the Open Components Hackathon.</p>
<p>From <b>February 13 to 17</b>, the first part, Lernathon, will take place.<br/>
Don't forget to add a reminder to your calendar.</p>
<p>Also join our <a href="https://discord.gg/2zjFVgaw4E" target="_blank">discord</a>.</p>
<br/>
<p>We are glad to see you at the Hackathon!</p>`
    });

  } else {
    return res.status(404).json({
      error: {
        code: 'email_not_found',
        message: 'User not registered'
      }
    });
  }

  return res.status(200).json({
    id,
    email,
  });
}
