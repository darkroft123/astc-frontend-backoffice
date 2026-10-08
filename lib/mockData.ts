export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: 'admin' | 'manager' | 'user';
  projectAssigned: string;
  isBlocked: boolean;
}

const mockUsersData: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    username: 'admin',
    firstName: 'Carlos',
    lastName: 'Mendez',
    email: 'carlos.mendez@example.com',
    phone: '999999999',
    roleId: 'admin',
    projectAssigned: 'ADMIN',
    isBlocked: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    username: 'jperez',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan.perez@example.com',
    phone: '987654321',
    roleId: 'manager',
    projectAssigned: 'PROYECTO A',
    isBlocked: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    username: 'mgarcia',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@example.com',
    phone: '912345678',
    roleId: 'user',
    projectAssigned: 'PROYECTO B',
    isBlocked: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    username: 'lsanchez',
    firstName: 'Luis',
    lastName: 'Sanchez',
    email: 'luis.sanchez@example.com',
    phone: '965432123',
    roleId: 'user',
    projectAssigned: 'PROYECTO C',
    isBlocked: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    username: 'alopez',
    firstName: 'Ana',
    lastName: 'Lopez',
    email: 'ana.lopez@example.com',
    phone: '923456789',
    roleId: 'manager',
    projectAssigned: 'PROYECTO A',
    isBlocked: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    username: 'rtorres',
    firstName: 'Roberto',
    lastName: 'Torres',
    email: 'roberto.torres@example.com',
    phone: '954321876',
    roleId: 'user',
    projectAssigned: 'PROYECTO D',
    isBlocked: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    username: 'rdiaz',
    firstName: 'Rosa',
    lastName: 'Diaz',
    email: 'rosa.diaz@example.com',
    phone: '934567890',
    roleId: 'user',
    projectAssigned: 'PROYECTO B',
    isBlocked: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    username: 'crodriguez',
    firstName: 'Carlos',
    lastName: 'Rodriguez',
    email: 'carlos.rodriguez@example.com',
    phone: '945678901',
    roleId: 'admin',
    projectAssigned: 'ADMIN',
    isBlocked: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    username: 'ovalenzuela',
    firstName: 'Oscar',
    lastName: 'Valenzuela',
    email: 'oscar.valenzuela@example.com',
    phone: '956789012',
    roleId: 'manager',
    projectAssigned: 'PROYECTO C',
    isBlocked: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    username: 'smuñoz',
    firstName: 'Sandra',
    lastName: 'Muñoz',
    email: 'sandra.munoz@example.com',
    phone: '967890123',
    roleId: 'user',
    projectAssigned: 'PROYECTO D',
    isBlocked: false,
  },
];

export function generateMockUsers(): User[] {
  return mockUsersData;
}

export interface ListUsersResponse {
  data: {
    listUsers: User[];
    page: number;
    size: number;
    total: number;
  };
}

export function generateMockResponse(
  page: number = 1,
  size: number = 10
): ListUsersResponse {
  const start = (page - 1) * size;
  const end = start + size;
  
  return {
    data: {
      listUsers: mockUsersData.slice(start, end),
      page,
      size,
      total: mockUsersData.length,
    },
  };
}
