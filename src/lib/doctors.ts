export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  keywords: string[];
  bio: string;
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  booked: boolean;
}

export interface Appointment {
  id: string;
  doctorId: string;
  slotId: string;
  patient: PatientInfo;
  reason: string;
  createdAt: string;
}

export interface PatientInfo {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
}

export const doctors: Doctor[] = [
  {
    id: 'dr-chen',
    name: 'Dr. Sarah Chen',
    specialty: 'Orthopedics',
    keywords: ['bones', 'joints', 'muscles', 'back', 'knee', 'hip', 'shoulder', 'spine', 'fracture', 'sprain', 'arthritis', 'tendon', 'ligament', 'elbow', 'wrist', 'ankle', 'neck', 'posture', 'sports injury', 'orthopedic'],
    bio: 'Board-certified orthopedic surgeon with 15 years of experience specializing in joint reconstruction and sports medicine.',
  },
  {
    id: 'dr-rivera',
    name: 'Dr. Michael Rivera',
    specialty: 'Cardiology',
    keywords: ['heart', 'chest', 'blood pressure', 'circulation', 'cardiac', 'heartbeat', 'palpitations', 'cholesterol', 'cardiovascular', 'artery', 'vein', 'shortness of breath', 'chest pain', 'hypertension', 'pulse', 'irregular heartbeat'],
    bio: 'Interventional cardiologist focused on preventive cardiology and minimally invasive heart procedures.',
  },
  {
    id: 'dr-patel',
    name: 'Dr. Priya Patel',
    specialty: 'Dermatology',
    keywords: ['skin', 'rash', 'acne', 'moles', 'eczema', 'psoriasis', 'dermatitis', 'itching', 'hives', 'warts', 'melanoma', 'sunburn', 'hair loss', 'nails', 'complexion', 'blemish', 'dry skin', 'oily skin', 'fungal', 'skin cancer'],
    bio: 'Dermatologist specializing in medical and cosmetic dermatology with expertise in skin cancer screening.',
  },
  {
    id: 'dr-thompson',
    name: 'Dr. James Thompson',
    specialty: 'Gastroenterology',
    keywords: ['stomach', 'digestion', 'gut', 'liver', 'intestines', 'abdomen', 'bloating', 'nausea', 'acid reflux', 'heartburn', 'constipation', 'diarrhea', 'colon', 'bowel', 'gallbladder', 'ulcer', 'crohn', 'ibs', 'celiac', 'gastric'],
    bio: 'Gastroenterologist with expertise in inflammatory bowel disease and advanced endoscopic procedures.',
  },
  {
    id: 'dr-nakamura',
    name: 'Dr. Emily Nakamura',
    specialty: 'Neurology',
    keywords: ['head', 'brain', 'nerves', 'migraines', 'numbness', 'headache', 'dizziness', 'seizure', 'tremor', 'memory', 'tingling', 'paralysis', 'concussion', 'neuropathy', 'multiple sclerosis', 'epilepsy', 'stroke', 'cognitive', 'neurological'],
    bio: 'Neurologist specializing in headache medicine, movement disorders, and neurodegenerative conditions.',
  },
];

// Generate availability for the next 45 days
function generateAvailability(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1); // Start from tomorrow

  // Each doctor has different availability patterns
  const patterns: Record<string, { days: number[]; startHour: number; endHour: number; slotInterval: number }> = {
    'dr-chen': { days: [1, 2, 3, 4, 5], startHour: 8, endHour: 16, slotInterval: 45 }, // Mon-Fri
    'dr-rivera': { days: [1, 3, 4, 5], startHour: 9, endHour: 17, slotInterval: 30 }, // Mon,Wed-Fri
    'dr-patel': { days: [1, 2, 3, 5, 6], startHour: 8, endHour: 15, slotInterval: 30 }, // Mon-Wed,Fri,Sat
    'dr-thompson': { days: [2, 3, 4, 5], startHour: 10, endHour: 18, slotInterval: 45 }, // Tue-Fri
    'dr-nakamura': { days: [1, 2, 4, 5, 6], startHour: 9, endHour: 16, slotInterval: 60 }, // Mon,Tue,Thu,Fri,Sat
  };

  for (const doctor of doctors) {
    const pattern = patterns[doctor.id];
    for (let d = 0; d < 45; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, etc.

      if (!pattern.days.includes(dayOfWeek)) continue;

      // Generate slots for this day
      for (let hour = pattern.startHour; hour < pattern.endHour; hour++) {
        for (let min = 0; min < 60; min += pattern.slotInterval) {
          if (hour === pattern.endHour - 1 && min + pattern.slotInterval > 60) continue;

          // Randomly skip some slots to simulate existing bookings (~20% booked)
          const pseudoRandom = ((date.getDate() * 7 + hour * 13 + min * 3 + doctor.id.charCodeAt(3) * 11) % 100);
          const booked = pseudoRandom < 20;

          const dateStr = date.toISOString().split('T')[0];
          const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

          slots.push({
            id: `${doctor.id}-${dateStr}-${timeStr}`,
            doctorId: doctor.id,
            date: dateStr,
            time: timeStr,
            duration: pattern.slotInterval,
            booked,
          });
        }
      }
    }
  }

  return slots;
}

// Singleton availability (regenerated on server restart)
let _availability: TimeSlot[] | null = null;

export function getAvailability(): TimeSlot[] {
  if (!_availability) {
    _availability = generateAvailability();
  }
  return _availability;
}

export function getAvailableSlots(doctorId: string, preferredDay?: string): TimeSlot[] {
  return getAvailability().filter(
    (s) => s.doctorId === doctorId && !s.booked && (!preferredDay || matchesDay(s.date, preferredDay))
  );
}

function matchesDay(dateStr: string, dayName: string): boolean {
  const date = new Date(dateStr + 'T12:00:00');
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()] === dayName.toLowerCase();
}

export function bookSlot(slotId: string): boolean {
  const slots = getAvailability();
  const slot = slots.find((s) => s.id === slotId);
  if (slot && !slot.booked) {
    slot.booked = true;
    return true;
  }
  return false;
}

// In-memory appointment store
const appointments: Appointment[] = [];

export function createAppointment(
  doctorId: string,
  slotId: string,
  patient: PatientInfo,
  reason: string
): Appointment | null {
  if (!bookSlot(slotId)) return null;

  const appointment: Appointment = {
    id: `apt-${Date.now()}`,
    doctorId,
    slotId,
    patient,
    reason,
    createdAt: new Date().toISOString(),
  };
  appointments.push(appointment);
  return appointment;
}

export function getAppointments(): Appointment[] {
  return appointments;
}

// Practice info
export const practiceInfo = {
  name: 'Kyron Medical Partners',
  locations: [
    {
      name: 'Main Office',
      address: '1200 Healthcare Blvd, Suite 300, San Francisco, CA 94102',
      phone: '(415) 555-0100',
      hours: 'Monday–Friday: 8:00 AM – 6:00 PM, Saturday: 9:00 AM – 1:00 PM, Sunday: Closed',
    },
    {
      name: 'Downtown Clinic',
      address: '450 Market Street, Floor 2, San Francisco, CA 94105',
      phone: '(415) 555-0200',
      hours: 'Monday–Friday: 9:00 AM – 5:00 PM, Saturday–Sunday: Closed',
    },
  ],
  website: 'www.kyronmedicalpartners.com',
};
