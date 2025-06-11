// This file can be used to store mock data for development.

export interface Farm {
  id: string;
  name: string;
  ownerName: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  cattleCount: number;
  dailyMilkProduction: number; // in Liters
  // Add other relevant farm details
}

export const mockFarms: Farm[] = [
  {
    id: 'farm001',
    name: 'Green Meadows Dairy',
    ownerName: 'John Doe',
    location: {
      latitude: 34.0522,
      longitude: -118.2437,
      address: '123 Pasture Ln, Farmville, CA'
    },
    cattleCount: 50,
    dailyMilkProduction: 1200,
  },
  {
    id: 'farm002',
    name: 'Happy Cow Ranch',
    ownerName: 'Jane Smith',
    location: {
      latitude: 36.7783,
      longitude: -119.4179,
      address: '456 Mooington Rd, Cheeseville, CA'
    },
    cattleCount: 75,
    dailyMilkProduction: 1800,
  },
];

// You can add mock user data as well if needed for login/registration testing
export const mockUsers = [
  {
    id: 'user001',
    email: 'test@example.com',
    password: 'password123', // In a real app, never store plain text passwords
    fullName: 'Test User',
  },
];
