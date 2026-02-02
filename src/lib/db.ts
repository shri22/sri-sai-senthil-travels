import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.json');

// Initialize DB if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ bookings: [], partners: [], vehicles: [], payouts: [] }, null, 2));
}

export const getData = () => {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content);
};

export const saveData = (data: any) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

export const addBooking = (booking: any) => {
    const data = getData();

    // Check if vehicle is already booked for these dates
    const vehicle = data.vehicles.find((v: any) => v.id === booking.vehicleId);
    if (vehicle && vehicle.blockedDates) {
        const isAlreadyBooked = vehicle.blockedDates.some((d: string) => d === booking.date || (booking.endDate && d === booking.endDate));
        if (isAlreadyBooked) {
            throw new Error('This heritage vehicle is already reserved for the selected period.');
        }
    }

    const newBooking = {
        ...booking,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        status: 'Confirmed'
    };

    // Block dates for vehicle
    if (vehicle) {
        if (!vehicle.blockedDates) vehicle.blockedDates = [];
        vehicle.blockedDates.push(booking.date);
        if (booking.endDate) vehicle.blockedDates.push(booking.endDate);
    }

    data.bookings.push(newBooking);
    saveData(data);
    return newBooking;
};

export const addPartner = (partner: any) => {
    const data = getData();
    const newPartner = {
        ...partner,
        id: Date.now(),
        status: 'Pending',
        joinedAt: new Date().toISOString()
    };
    data.partners.push(newPartner);
    saveData(data);
    return newPartner;
};

export const addVehicle = (vehicle: any) => {
    const data = getData();
    const newVehicle = {
        ...vehicle,
        id: Date.now(),
        blockedDates: [],
        lastlocation: { lat: 13.0827, lng: 80.2707 }
    };
    data.vehicles.push(newVehicle);
    saveData(data);
    return newVehicle;
};
