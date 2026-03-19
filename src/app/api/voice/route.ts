import { initiateVoiceCall } from '@/lib/vapi';

export async function POST(req: Request) {
  try {
    const { phoneNumber, chatHistory, patientName } = await req.json();

    if (!phoneNumber) {
      return Response.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Normalize phone number to E.164 format
    const cleaned = phoneNumber.replace(/\D/g, '');
    const normalized = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;

    const result = await initiateVoiceCall({
      phoneNumber: normalized,
      chatHistory: chatHistory || [],
      patientName,
    });

    return Response.json({ success: true, callId: result.id });
  } catch (error) {
    console.error('Voice call error:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate call';
    return Response.json({ error: message }, { status: 500 });
  }
}
