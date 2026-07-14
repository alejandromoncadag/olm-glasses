export type EyeExamService = {
  id: string;
  label: string;
  duration: string;
  durationMinutes: number;
  price: string;
};

export const eyeExamServices: EyeExamService[] = [
  {
    id: "full",
    label: "Examen completo de la vista",
    duration: "30 min",
    durationMinutes: 30,
    price: "$400 MXN",
  },
  {
    id: "full-styling",
    label: "Examen + asesoría de armazón",
    duration: "45 min",
    durationMinutes: 45,
    price: "$400 MXN",
  },
  {
    id: "kids",
    label: "Examen para niños",
    duration: "30 min",
    durationMinutes: 30,
    price: "$350 MXN",
  },
];

export const eyeExamTimeSlots = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

export function getEyeExamServiceById(id: string) {
  return eyeExamServices.find((service) => service.id === id);
}
