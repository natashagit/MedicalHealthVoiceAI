import { sendAppointmentConfirmation } from '@/lib/email';
import { sendAppointmentSms } from '@/lib/sms';

export async function POST(req: Request) {
  try {
    const {
      patientName,
      patientEmail,
      patientPhone,
      doctorName,
      specialty,
      date,
      time,
      duration,
      reason,
      appointmentId,
      smsOptIn,
    } = await req.json();

    const location = 'Prelude Health Partners - Main Office, 315 East 72nd Street, Suite 400, New York, NY 10021';
    const phone = '(212) 555-0100';

    const results: { email?: unknown; sms?: unknown } = {};

    // Send email
    const emailResult = await sendAppointmentConfirmation({
      patientName,
      patientEmail,
      doctorName,
      specialty,
      date,
      time,
      duration,
      reason,
      appointmentId,
      location,
      phone,
    });
    results.email = emailResult;

    // Send SMS if opted in
    if (smsOptIn && patientPhone) {
      const cleaned = patientPhone.replace(/\D/g, '');
      const normalized = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;

      const smsResult = await sendAppointmentSms({
        patientPhone: normalized,
        patientName,
        doctorName,
        date,
        time,
        location,
      });
      results.sms = smsResult;
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
