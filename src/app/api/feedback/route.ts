import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { feedback, userId, userName, userEmail } = await req.json()

    // Create email transporter
    const smtpConfig = {
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }


    const transporter = nodemailer.createTransport(smtpConfig)

    // Verify SMTP connection configuration
    await transporter.verify().catch((err) => {
      console.error("SMTP Connection Error:", err)
      throw new Error("Failed to connect to SMTP server")
    })

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: "New Feedback Received",
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>User Details:</strong></p>
        <ul>
          <li>Name: ${userName || 'Not provided'}</li>
          <li>User ID: ${userId || 'Not provided'}</li>
          <li>Email: ${userEmail || 'Not provided'}</li>
        </ul>
        <p><strong>Feedback:</strong></p>
        <p>${feedback}</p>
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Feedback error:", error)
    return NextResponse.json(
      { error: "Failed to send feedback" },
      { status: 500 }
    )
  }
} 