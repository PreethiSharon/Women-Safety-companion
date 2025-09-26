export type Guardian = {
  id: string;
  name: string;
  phone: string;
};

export const initialGuardians: Guardian[] = [
  { id: '1', name: 'Jane Doe', phone: '(555) 123-4567' },
  { id: '2', name: 'John Smith', phone: '(555) 987-6543' },
  { id: '3', name: 'Alex Johnson', phone: '(555) 555-5555' },
];
