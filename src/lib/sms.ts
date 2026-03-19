import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface AppointmentSmsData {
  patientPhone: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  location: string;
}

export async function sendAppointmentSms(data: AppointmentSmsData) {
  try {
    const message = await client.messages.create({
      body: `Hi ${data.patientName}! Your appointment with ${data.doctorName} is confirmed for ${data.date} at ${data.time}. Location: ${data.location}. Please arrive 15 min early. Reply STOP to opt out. - Kyron Medical Partners`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: data.patientPhone,
    });

    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error };
  }
}
