import { doctors, practiceInfo } from './doctors';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceCallRequest {
  phoneNumber: string;
  chatHistory: ChatMessage[];
  patientName?: string;
}

// Tools the voice AI can call via webhook
const vapiTools = [
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Check available appointment slots for a specific doctor. Optionally filter by preferred day of the week. Always use this before booking.',
      parameters: {
        type: 'object',
        properties: {
          doctor_id: {
            type: 'string',
            enum: doctors.map((d) => d.id),
            description: 'The doctor ID',
          },
          preferred_day: {
            type: 'string',
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            description: 'Optional preferred day of the week',
          },
        },
        required: ['doctor_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Book an appointment after the patient has chosen a specific time slot. Must have all patient details before calling this.',
      parameters: {
        type: 'object',
        properties: {
          doctor_id: { type: 'string', description: 'The doctor ID' },
          slot_id: { type: 'string', description: 'The time slot ID from check_availability results' },
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
  },
];

export async function initiateVoiceCall({ phoneNumber, chatHistory, patientName }: VoiceCallRequest) {
  const chatTranscript = chatHistory
    .map((m) => `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are a friendly, professional AI medical office assistant for ${practiceInfo.name}. You are continuing a conversation that started via web chat. The patient has opted to continue via phone call.

## CRITICAL SAFETY RULES
- NEVER provide medical advice, diagnoses, or treatment recommendations
- NEVER recommend specific medications or dosages
- If asked for medical advice, say: "I'm not able to provide medical advice. Please consult with your doctor for medical questions."
- For emergencies, say: "If this is a medical emergency, please hang up and call 911."

## AVAILABLE DOCTORS
${doctors.map((d) => `- ${d.name} (${d.specialty}): Treats ${d.keywords.slice(0, 5).join(', ')}`).join('\n')}

## PRACTICE INFO
${practiceInfo.locations.map((l) => `${l.name}: ${l.address} | Phone: ${l.phone} | Hours: ${l.hours}`).join('\n')}

## TOOLS
You have access to tools to check doctor availability and book appointments. When a patient wants to schedule:
1. Match their concern to the right specialist
2. Collect: first name, last name, date of birth, phone number, email
3. Use check_availability to find slots
4. Read the options clearly to the patient
5. Once they choose, use book_appointment to confirm
6. Tell them a confirmation email and text will be sent

## PREVIOUS CHAT CONTEXT
The following conversation occurred via web chat before this call:
---
${chatTranscript}
---

Continue naturally from where the chat left off. ${patientName ? `The patient's name is ${patientName}.` : ''} Greet them briefly and reference what was already discussed.

## COMMUNICATION STYLE
- Speak naturally and conversationally — this is a phone call
- Be warm, empathetic, and professional
- Keep responses concise
- Confirm important details by repeating them back
- When reading appointment times, say them clearly (e.g. "Monday, March twenty-fourth at nine AM")`;

  const phoneNumberId = await getVapiPhoneNumberId();
  const serverUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi-webhook`
    : null;

  const body: Record<string, unknown> = {
    assistant: {
      firstMessage: `Hi${patientName ? ` ${patientName}` : ''}! This is the Kyron Medical assistant. I have the context from our chat — how can I continue helping you?`,
      model: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
        tools: vapiTools,
      },
      voice: {
        provider: '11labs',
        voiceId: 'sarah',
      },
      ...(serverUrl ? { serverUrl } : {}),
    },
    customer: {
      number: phoneNumber,
    },
  };

  if (phoneNumberId) {
    body.phoneNumberId = phoneNumberId;
  }

  const response = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Vapi API error:', errorData);
    throw new Error(errorData.message || 'Failed to initiate voice call');
  }

  return response.json();
}

async function getVapiPhoneNumberId(): Promise<string | null> {
  try {
    const response = await fetch('https://api.vapi.ai/phone-number', {
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
      },
    });

    if (!response.ok) return null;

    const phoneNumbers = await response.json();
    if (Array.isArray(phoneNumbers) && phoneNumbers.length > 0) {
      return phoneNumbers[0].id;
    }

    return null;
  } catch {
    return null;
  }
}
