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
    duration: "45 min",
    durationMinutes: 45,
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
    duration: "45 min",
    durationMinutes: 45,
    price: "$350 MXN",
  },
];

export const eyeExamTimeSlots = [
  "10:00",
  "10:45",
  "11:30",
  "12:15",
  "13:00",
  "13:45",
  "14:30",
  "15:15",
  "16:00",
  "16:45",
  "17:30",
  "18:15",
];

export function getEyeExamServiceById(id: string) {
  return eyeExamServices.find((service) => service.id === id);
}
