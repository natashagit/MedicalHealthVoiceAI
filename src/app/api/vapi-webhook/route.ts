import { doctors, getAvailableSlots, createAppointment, type PatientInfo } from '@/lib/doctors';
import { sendAppointmentConfirmation } from '@/lib/email';
import { sendAppointmentSms } from '@/lib/sms';

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

async function handleToolCall(name: string, args: Record<string, string>): Promise<string> {
  if (name === 'check_availability') {
    const { doctor_id, preferred_day } = args;
    const doctor = doctors.find((d) => d.id === doctor_id);
    if (!doctor) return JSON.stringify({ error: 'Doctor not found' });

    const slots = getAvailableSlots(doctor_id, preferred_day);
    const available = slots.slice(0, 8).map((s) => {
      const date = new Date(s.date + 'T12:00:00');
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateFormatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return {
        slot_id: s.id,
        day: dayName,
        date: dateFormatted,
        time: formatTime(s.time),
        duration: `${s.duration} minutes`,
      };
    });

    if (available.length === 0) {
      return JSON.stringify({
        doctor: doctor.name,
        message: preferred_day
          ? `No available slots on ${preferred_day}s. Try another day?`
          : 'No available slots in the next 45 days.',
      });
    }

    return JSON.stringify({
      doctor: doctor.name,
      specialty: doctor.specialty,
      available_slots: available,
    });
  }

  if (name === 'book_appointment') {
    const { doctor_id, slot_id, first_name, last_name, dob, phone, email, reason } = args;
    const patient: PatientInfo = { firstName: first_name, lastName: last_name, dob, phone, email };
    const appointment = createAppointment(doctor_id, slot_id, patient, reason);

    if (!appointment) {
      return JSON.stringify({ error: 'Sorry, that slot is no longer available. Please choose another time.' });
    }

    const doctor = doctors.find((d) => d.id === doctor_id);
    const allSlots = getAvailableSlots(doctor_id);
    const bookedSlot = allSlots.find((s) => s.id === slot_id);
    const slotDate = bookedSlot?.date || '';
    const slotTime = bookedSlot?.time || '';

    const dateFormatted = slotDate
      ? new Date(slotDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : '';
    const timeFormatted = slotTime ? formatTime(slotTime) : '';

    // Send email
    if (email) {
      sendAppointmentConfirmation({
        patientName: `${first_name} ${last_name}`,
        patientEmail: email,
        doctorName: doctor?.name || '',
        specialty: doctor?.specialty || '',
        date: dateFormatted,
        time: timeFormatted,
        duration: `${bookedSlot?.duration || 45} minutes`,
        reason,
        appointmentId: appointment.id,
        location: 'Kyron Medical Partners - Main Office, 1200 Healthcare Blvd, Suite 300, San Francisco, CA 94102',
        phone: '(415) 555-0100',
      }).then((result) => {
        if (result.success) console.log('[Vapi Webhook] Confirmation email sent to', email);
        else console.error('[Vapi Webhook] Email failed:', result.error);
      });
    }

    // Send SMS
    if (phone) {
      const cleaned = phone.replace(/\D/g, '');
      const normalized = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
      sendAppointmentSms({
        patientPhone: normalized,
        patientName: `${first_name} ${last_name}`,
        doctorName: doctor?.name || '',
        date: dateFormatted,
        time: timeFormatted,
        location: 'Kyron Medical Partners - Main Office, 1200 Healthcare Blvd, Suite 300',
      }).then((result) => {
        if (result.success) console.log('[Vapi Webhook] Confirmation SMS sent to', phone);
        else console.error('[Vapi Webhook] SMS failed:', result.error);
      });
    }

    return JSON.stringify({
      success: true,
      appointment_id: appointment.id,
      doctor: doctor?.name,
      specialty: doctor?.specialty,
      date: dateFormatted,
      time: timeFormatted,
      patient_name: `${first_name} ${last_name}`,
      email,
      phone,
      message: 'Appointment booked successfully! Confirmation email and SMS have been sent.',
    });
  }

  return JSON.stringify({ error: 'Unknown function' });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Log incoming payload for debugging
    console.log('[Vapi Webhook] Received:', JSON.stringify(body).substring(0, 500));

    const { message } = body;

    // Vapi sends different message types - handle all known formats
    // Format 1: message.type === 'function-call' (Vapi v1)
    if (message?.type === 'function-call') {
      const { functionCall } = message;
      console.log('[Vapi Webhook] Function call (v1):', functionCall.name);
      const result = await handleToolCall(functionCall.name, functionCall.parameters);

      return Response.json({
        results: [
          {
            toolCallId: functionCall.id,
            result,
          },
        ],
      });
    }

    // Format 2: message.type === 'tool-calls' (Vapi v2)
    if (message?.type === 'tool-calls') {
      console.log('[Vapi Webhook] Tool calls (v2):', message.toolCalls?.length);
      const results = await Promise.all(
        (message.toolCalls || []).map(async (toolCall: { id: string; type: string; function: { name: string; arguments: Record<string, string> } }) => {
          console.log('[Vapi Webhook] Processing tool:', toolCall.function.name);
          const args = typeof toolCall.function.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
          const result = await handleToolCall(toolCall.function.name, args);
          return {
            toolCallId: toolCall.id,
            result,
          };
        })
      );

      return Response.json({ results });
    }

    // Format 3: Direct toolCalls array at root level
    if (body.toolCalls) {
      console.log('[Vapi Webhook] Tool calls (root level):', body.toolCalls.length);
      const results = await Promise.all(
        body.toolCalls.map(async (toolCall: { id: string; type: string; function: { name: string; arguments: Record<string, string> } }) => {
          const args = typeof toolCall.function.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
          const result = await handleToolCall(toolCall.function.name, args);
          return {
            toolCallId: toolCall.id,
            result,
          };
        })
      );

      return Response.json({ results });
    }

    // Log unhandled message types for debugging
    console.log('[Vapi Webhook] Unhandled message type:', message?.type || 'no message type', '| Keys:', Object.keys(body).join(', '));

    return Response.json({});
  } catch (error) {
    console.error('[Vapi Webhook] Error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
