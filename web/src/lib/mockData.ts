export interface Vehicle {
    id: string;
    name: string;
    type: string;
    pricePerDay: number;
    image: string;
    features: string[];
    seats: number;
    description: string;
}

export const MOCK_FLEET: Vehicle[] = [
    {
        id: '1',
        name: 'Heritage Force Traveller',
        type: 'Van',
        pricePerDay: 4500,
        image: 'https://srisaisenthiltravels.cloud/premium_heritage_van_v12_1769924009117.png', // Using external URL for now per reference
        features: ['AC', 'Push-back Seats', 'Music System', 'Charging Ports'],
        seats: 12,
        description: 'Perfect for small family trips and heritage tours. Compact yet spacious.'
    },
    {
        id: '2',
        name: 'Luxury Volvo B11R',
        type: 'Bus',
        pricePerDay: 25000,
        image: 'https://srisaisenthiltravels.cloud/luxury_volvo_coach_1769923988107.png',
        features: ['AC', 'Sleeper/Seater', 'Toilet', 'WiFi', 'Entertainment'],
        seats: 45,
        description: 'The ultimate in long-distance comfort. Experience smooth gliding on highways.'
    },
    {
        id: '3',
        name: 'Mercedes Benz Glider',
        type: 'Bus',
        pricePerDay: 18000,
        image: 'https://srisaisenthiltravels.cloud/modern_minibus_heritage_edition_1769924031275.png', // Placeholder image matching reference card 3 which was "Beta Mini Bus" visually but text said "Glider" in footer list. Stick to reference card 3.
        features: ['AC', 'Semi-Sleeper', 'Air Suspension'],
        seats: 30,
        description: 'Premium comfort for medium sized groups.'
    },
    {
        id: '4',
        name: 'Toyota Innova Crysta',
        type: 'Car',
        pricePerDay: 3500,
        image: 'https://srisaisenthiltravels.cloud/images/hero.png', // Placeholder
        features: ['AC', 'Leather Seats', 'Bluetooth'],
        seats: 7,
        description: 'Luxury executive travel for business or small families.'
    }
];
