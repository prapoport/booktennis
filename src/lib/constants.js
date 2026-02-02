import { addMinutes, format, setHours, setMinutes, startOfDay } from 'date-fns';

export const HOUSES = [
    'Casa Cereza',
    'Casa Coco',
    'Casa Cova',
    'Casa del Mar',
    'Casa Hamui',
    'Casa Hola Ola',
    'Casa Marvilla',
    'Casa Naila del Mar',
    'Casa Navari',
    'Casa NumaNa',
    'Casa Rhino',
    'Casa Siano',
    'Casa Staa'
].sort();

export const COURTS = [
    { id: 'padel', label: 'Padel Court', type: 'padel' },
    { id: 'tennis', label: 'Tennis/Pickleball', type: 'tennis_pickleball' }
];

// Time slot configuration
const START_HOUR = 5;
const END_HOUR = 21; // 9 PM is the last start time? Or end time? 
// Prompt says: "Time slots run from 5:00 AM to 9:00 PM ... (5:00, 5:30 ... 20:30)" 
// If 9pm is the *last slot*, it starts at 21:00.
// "5:00 AM to 9:00 PM" usually means open hours. If 21:00 is the last slot, the court closes at 22:00.
// Let's assume slots start every 30 mins from 05:00 to 20:30 (inclusive), because 21:00 closing would mean last slot is 20:00 (60min).
// Re-reading prompt: "Time slots run from 5:00 AM to 9:00 PM ... (5:00, 5:30 ... 20:00, 20:30)"
// "Display times in 12-hour format". 
// It explicitly lists "20:00, 20:30". So the last slot starts at 8:30 PM. 
// Wait, "5:00 AM to 9:00 PM". If it lists 20:30, that's 8:30 PM.
// If the prompt says "20:00, 20:30", it implies the last slot *starts* at 20:30.
// Let's generate slots from 05:00 to 20:30.

export const generateTimeSlots = () => {
    const slots = [];
    let currentTime = setMinutes(setHours(startOfDay(new Date()), START_HOUR), 0);
    const endTime = setMinutes(setHours(startOfDay(new Date()), 20), 30); // 20:30

    while (currentTime <= endTime) {
        slots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, 30);
    }
    return slots;
};

export const TIME_SLOTS = generateTimeSlots();
