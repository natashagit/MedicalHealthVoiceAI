import Anthropic from '@anthropic-ai/sdk';
import { doctors, getAvailableSlots, createAppointment, practiceInfo, type PatientInfo } from '@/lib/doctors';
import { sendAppointmentConfirmation } from '@/lib/email';
import { sendAppointmentSms } from '@/lib/sms';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are a friendly, professional AI medical office assistant for ${practiceInfo.name}. You help patients with scheduling appointments, checking prescription refills, and providing office information.

## CRITICAL SAFETY RULES
- NEVER provide medical advice, diagnoses, or treatment recommendations
- NEVER recommend specific medications or dosages
- NEVER confirm or deny a diagnosis
- If asked for medical advice, say: "I'm not able to provide medical advice. Please consult with your doctor for medical questions. Would you like me to help you schedule an appointment?"
- For emergencies, always say: "If this is a medical emergency, please call 911 immediately."

## AVAILABLE DOCTORS
${doctors.map((d) => `- ${d.name} (${d.specialty}): Keywords: ${d.keywords.join(', ')}`).join('\n')}

## PRACTICE INFO
${practiceInfo.locations.map((l) => `${l.name}: ${l.address} | Phone: ${l.phone} | Hours: ${l.hours}`).join('\n')}

## APPOINTMENT SCHEDULING WORKFLOW
1. First, understand what the patient needs help with (body part/symptom/concern)
2. Semantically match them to the appropriate specialist based on keywords. If no specialist matches, politely say the practice doesn't treat that condition and suggest they consult their primary care physician.
3. Collect patient information: first name, last name, date of birth, phone number, and email address. Ask for these naturally in conversation, not all at once.
4. Ask about their preferred dates/times, then use the check_availability tool to find slots
5. Present 3-5 available options and let them choose
6. Use the book_appointment tool to finalize the booking

## PRESCRIPTION REFILL WORKFLOW
- Ask for their name and date of birth to look up their record
- For this demo, inform them that the refill request has been submitted and their pharmacy will be notified within 24-48 hours
- Remind them to contact the office directly for urgent medication needs

## COMMUNICATION STYLE
- Be warm, empathetic, and professional
- Use simple language, avoid medical jargon
- Be concise but thorough
- Always confirm details back to the patient
- If the patient asks to continue via phone, let them know they can click the "Call Me" button in the chat header

## TOOL USAGE
When you have identified the right doctor and collected patient info, use the tools provided to check availability and book appointments. Always present availability in a clear, readable format with day of week, date, and time.

When presenting available times, format them nicely like:
1. Monday, March 24 at 9:00 AM
2. Tuesday, March 25 at 10:30 AM
etc.

If the patient asks for a specific day (e.g. "do you have something on a Tuesday?"), filter results accordingly.`;

// Tool definitions for Claude
const tools: Anthropic.Tool[] = [
  {
    name: 'check_availability',
    description: 'Check available appointment slots for a specific doctor. Optionally filter by preferred day of the week.',
    input_schema: {
      type: 'object' as const,
      properties: {
        doctor_id: {
          type: 'string',
          description: 'The doctor ID (e.g., dr-chen, dr-rivera, dr-patel, dr-thompson, dr-nakamura)',
        },
        preferred_day: {
          type: 'string',
          description: 'Optional preferred day of the week (e.g., monday, tuesday). Leave empty for all available days.',
        },
      },
      required: ['doctor_id'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment for a patient with a specific doctor at a specific time slot.',
    input_schema: {
      type: 'object' as const,
      properties: {
        doctor_id: {
          type: 'string',
          description: 'The doctor ID',
        },
        slot_id: {
          type: 'string',
          description: 'The time slot ID to book',
        },
        first_name: { type: 'string', description: 'Patient first name' },
        last_name: { type: 'string', description: 'Patient last name' },
        dob: { type: 'string', description: 'Patient date of birth' },
        phone: { type: 'string', description: 'Patient phone number' },
        email: { type: 'string', description: 'Patient email address' },
        reason: { type: 'string', description: 'Reason for appointment' },
      },
      required: ['doctor_id', 'slot_id', 'first_name', 'last_name', 'dob', 'phone', 'email', 'reason'],
    },
  },
];

async function handleToolCall(name: string, input: Record<string, string>): Promise<string> {
  if (name === 'check_availability') {
    const { doctor_id, preferred_day } = input;
    const doctor = doctors.find((d) => d.id === doctor_id);
    if (!doctor) return JSON.stringify({ error: 'Doctor not found' });

    const slots = getAvailableSlots(doctor_id, preferred_day);
    // Return first 10 available slots
    const available = slots.slice(0, 10).map((s) => {
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
    const { doctor_id, slot_id, first_name, last_name, dob, phone, email, reason } = input;
    const patient: PatientInfo = { firstName: first_name, lastName: last_name, dob, phone, email };
    const appointment = createAppointment(doctor_id, slot_id, patient, reason);

    if (!appointment) {
      return JSON.stringify({ error: 'Sorry, that slot is no longer available. Please choose another time.' });
    }

    const doctor = doctors.find((d) => d.id === doctor_id);
    // Find slot info from the appointment's slot_id
    const allSlots = getAvailableSlots(doctor_id);
    const bookedSlot = allSlots.find((s) => s.id === slot_id);
    const slotDate = bookedSlot?.date || '';
    const slotTime = bookedSlot?.time || '';

    const dateFormatted = slotDate
      ? new Date(slotDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : '';
    const timeFormatted = slotTime ? formatTime(slotTime) : '';

    // Send email confirmation (fire and forget — don't block the chat response)
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
      if (result.success) console.log('Confirmation email sent to', email);
      else console.error('Email failed:', result.error);
    });

    // Send SMS confirmation if phone number provided
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
        if (result.success) console.log('Confirmation SMS sent to', phone);
        else console.error('SMS failed:', result.error);
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
      message: 'Appointment booked successfully! A confirmation email and SMS have been sent.',
    });
  }

  return JSON.stringify({ error: 'Unknown tool' });
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Convert our message format to Anthropic format
    const anthropicMessages: Anthropic.MessageParam[] = messages
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Agentic loop: keep calling Claude until we get a final text response
    let response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages: anthropicMessages,
    });

    // Handle tool use in a loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ContentBlock & { type: 'tool_use' } => block.type === 'tool_use'
      );

      const toolResultContents = await Promise.all(
        toolUseBlocks.map(async (toolUse) => ({
          type: 'tool_result' as const,
          tool_use_id: toolUse.id,
          content: await handleToolCall(toolUse.name, toolUse.input as Record<string, string>),
        }))
      );

      const toolResults: Anthropic.MessageParam = {
        role: 'user',
        content: toolResultContents,
      };

      // Add assistant response and tool results, then call again
      anthropicMessages.push({
        role: 'assistant',
        content: response.content,
      });
      anthropicMessages.push(toolResults);

      response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages: anthropicMessages,
      });
    }

    // Extract text from final response
    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return Response.json({ content: textContent });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'An error occurred processing your message. Please try again.' },
      { status: 500 }
    );
  }
}
