export type RootStackParamList = {
  Infra: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  HomeScreen: { userId: number };
  FormScreen: { userId: number };
  MapScreen: undefined;
  ScoreScreen: { userId: number };
  // Add other screens here as needed
};

export type User = {
  userId: number;
  registrationId: string;
  firstName: string;
  surname: string;
  gender: string;
  dob: string;
  contactNumber: string;
  state: string;
  district: string;
  block: string;
  village: string;
  latitude: number;
  longitude: number;
};
