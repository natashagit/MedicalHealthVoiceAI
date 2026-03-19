import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  duration: string;
  reason: string;
  appointmentId: string;
  location: string;
  phone: string;
}

export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  try {
    const { error } = await resend.emails.send({
      from: 'Kyron Medical <appointments@prelude.team>',
      to: data.patientEmail,
      subject: `Appointment Confirmed - ${data.doctorName} on ${data.date}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#060d1b;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#f8fafc;font-size:24px;margin:0;">Kyron Medical Partners</h1>
      <p style="color:#64748b;font-size:13px;margin-top:4px;">AI Healthcare Assistant</p>
    </div>

    <!-- Card -->
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;margin-bottom:24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#14b8a6);color:white;font-size:13px;font-weight:600;padding:6px 16px;border-radius:20px;">
          ✓ Appointment Confirmed
        </div>
      </div>

      <h2 style="color:#f8fafc;font-size:20px;margin:0 0 24px 0;text-align:center;">
        Hi ${data.patientName}, your appointment is booked!
      </h2>

      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#94a3b8;font-size:13px;padding:8px 0;vertical-align:top;width:120px;">Doctor</td>
            <td style="color:#f8fafc;font-size:14px;padding:8px 0;font-weight:500;">${data.doctorName} (${data.specialty})</td>
          </tr>
          <tr>
            <td style="color:#94a3b8;font-size:13px;padding:8px 0;vertical-align:top;">Date & Time</td>
            <td style="color:#f8fafc;font-size:14px;padding:8px 0;font-weight:500;">${data.date} at ${data.time}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8;font-size:13px;padding:8px 0;vertical-align:top;">Duration</td>
            <td style="color:#f8fafc;font-size:14px;padding:8px 0;font-weight:500;">${data.duration}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8;font-size:13px;padding:8px 0;vertical-align:top;">Reason</td>
            <td style="color:#f8fafc;font-size:14px;padding:8px 0;font-weight:500;">${data.reason}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8;font-size:13px;padding:8px 0;vertical-align:top;">Confirmation #</td>
            <td style="color:#60a5fa;font-size:14px;padding:8px 0;font-weight:500;">${data.appointmentId}</td>
          </tr>
        </table>
      </div>

      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Location</p>
        <p style="color:#f8fafc;font-size:14px;margin:0 0 4px 0;">${data.location}</p>
        <p style="color:#94a3b8;font-size:13px;margin:0;">Phone: ${data.phone}</p>
      </div>

      <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);border-radius:12px;padding:16px;">
        <p style="color:#60a5fa;font-size:13px;font-weight:600;margin:0 0 8px 0;">Reminders:</p>
        <ul style="color:#94a3b8;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
          <li>Please arrive 15 minutes early for check-in</li>
          <li>Bring a valid ID and insurance card</li>
          <li>Bring a list of current medications</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;">
      <p style="color:#475569;font-size:12px;margin:0;">
        Need to reschedule? Reply to this email or call us at ${data.phone}
      </p>
      <p style="color:#334155;font-size:11px;margin-top:16px;">
        © ${new Date().getFullYear()} Kyron Medical Partners. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}
