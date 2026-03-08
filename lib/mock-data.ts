// Path: lib/mock-data.ts
import {
  User, Event, Registration, Team,
  Notification, CheckIn, TeamJoinRequest
} from '@/types'

// ─── USERS ───────────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  {
    id: 'user-org-1',
    email: 'organizer@eventos.dev',
    name: 'Alex Organizer',
    role: 'ORGANIZER',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'user-org-2',
    email: 'priya@eventos.dev',
    name: 'Priya Shah',
    role: 'ORGANIZER',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'user-p-1',
    email: 'participant@eventos.dev',
    name: 'Jamie Dev',
    role: 'PARTICIPANT',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'user-p-2',
    email: 'sam@eventos.dev',
    name: 'Sam Builder',
    role: 'PARTICIPANT',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'user-p-3',
    email: 'riya@eventos.dev',
    name: 'Riya Patel',
    role: 'PARTICIPANT',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'user-p-4',
    email: 'arjun@eventos.dev',
    name: 'Arjun Mehta',
    role: 'PARTICIPANT',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
]

// ─── EVENTS ──────────────────────────────────────────────────────────────────
export const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: 'HackFest 2025',
    description: 'A 48-hour hackathon focused on building AI-powered solutions for real-world problems. Open to all skill levels.',
    type: 'TEAM',
    status: 'PUBLISHED',
    start_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 9 * 86400000).toISOString(),
    location: 'Mumbai, India',
    max_participants: 200,
    max_team_size: 4,
    min_team_size: 2,
    registration_deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    tags: ['AI', 'Hackathon', 'Open Source'],
    created_by: 'user-org-1',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    registration_count: 87,
    checkin_count: 0,
    organizer: mockUsers[0],
  },
  {
    id: 'event-2',
    title: 'Design Sprint Challenge',
    description: 'A 24-hour individual design challenge where participants solve UX problems for emerging startups.',
    type: 'INDIVIDUAL',
    status: 'PUBLISHED',
    start_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 15 * 86400000).toISOString(),
    location: 'Bangalore, India',
    max_participants: 100,
    registration_deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
    tags: ['Design', 'UX', 'Sprint'],
    created_by: 'user-org-2',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    registration_count: 43,
    checkin_count: 0,
    organizer: mockUsers[1],
  },
  {
    id: 'event-3',
    title: 'Open Source Summit',
    description: 'Celebrating open source contributions with workshops and talks from industry leaders.',
    type: 'INDIVIDUAL',
    status: 'ONGOING',
    start_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    location: 'Delhi, India',
    max_participants: 500,
    registration_deadline: new Date(Date.now() - 2 * 86400000).toISOString(),
    tags: ['Open Source', 'Community'],
    created_by: 'user-org-1',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    registration_count: 312,
    checkin_count: 198,
    organizer: mockUsers[0],
  },
]

// ─── REGISTRATIONS ───────────────────────────────────────────────────────────
export const mockRegistrations: Registration[] = [
  {
    id: 'reg-1',
    event_id: 'event-1',
    user_id: 'user-p-1',
    status: 'CONFIRMED',
    qr_token: 'QR-EVT1-USR1-A7K2',
    checked_in: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'reg-2',
    event_id: 'event-1',
    user_id: 'user-p-2',
    status: 'CONFIRMED',
    qr_token: 'QR-EVT1-USR2-C3P8',
    team_id: 'team-1',
    checked_in: false,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'reg-3',
    event_id: 'event-1',
    user_id: 'user-p-3',
    status: 'CONFIRMED',
    qr_token: 'QR-EVT1-USR3-D4Q1',
    team_id: 'team-1',
    checked_in: false,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    // ✅ FIX 1: Added team_id: 'team-2' — Arjun is CodeCraft's leader
    //    Previously missing, causing mismatch with SQL seed data
    id: 'reg-4',
    event_id: 'event-1',
    user_id: 'user-p-4',
    status: 'CONFIRMED',
    qr_token: 'QR-EVT1-USR4-E5R9',
    team_id: 'team-2',
    checked_in: false,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'reg-5',
    event_id: 'event-3',
    user_id: 'user-p-1',
    status: 'CONFIRMED',
    qr_token: 'QR-EVT3-USR1-B9M4',
    checked_in: true,
    checked_in_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
]

// ─── TEAMS ───────────────────────────────────────────────────────────────────
export const mockTeams: Team[] = [
  {
    id: 'team-1',
    event_id: 'event-1',
    name: 'Neural Ninjas',
    description: 'Building an AI tool for accessibility. Looking for a designer and a backend dev.',
    status: 'FORMING',
    leader_id: 'user-p-2',
    skills: ['React', 'Python', 'ML', 'UI/UX'],
    max_size: 4,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    members: [
      {
        id: 'tm-1',
        team_id: 'team-1',
        user_id: 'user-p-2',
        role: 'LEADER',
        joined_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        user: mockUsers[3], // Sam Builder
      },
      {
        id: 'tm-2',
        team_id: 'team-1',
        user_id: 'user-p-3',
        role: 'MEMBER',
        joined_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        user: mockUsers[4], // Riya Patel
      },
    ],
    leader: mockUsers[3],
    member_count: 2,
  },
  {
    id: 'team-2',
    event_id: 'event-1',
    name: 'CodeCraft',
    description: 'Web3 project for decentralized identity. Strong in Solidity and React.',
    status: 'FORMING',
    leader_id: 'user-p-4',
    skills: ['Solidity', 'React', 'Web3', 'Node.js'],
    max_size: 4,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    members: [
      {
        id: 'tm-3',
        team_id: 'team-2',
        user_id: 'user-p-4',
        role: 'LEADER',
        joined_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        user: mockUsers[5], // Arjun Mehta
      },
    ],
    leader: mockUsers[5],
    member_count: 1,
    pending_requests: 1,
  },
]

// ─── TEAM JOIN REQUESTS ───────────────────────────────────────────────────────
export const mockJoinRequests: TeamJoinRequest[] = [
  {
    id: 'req-1',
    team_id: 'team-2',
    user_id: 'user-p-1',
    status: 'PENDING',
    message: "Hi! I'm a full-stack dev with React and Node.js experience. Would love to join CodeCraft!",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    user: mockUsers[2], // Jamie Dev
    team: mockTeams[1], // CodeCraft
  },
]

// ─── CHECKINS ────────────────────────────────────────────────────────────────
export const mockCheckIns: CheckIn[] = [
  {
    id: 'ci-1',
    registration_id: 'reg-5',
    event_id: 'event-3',
    checked_in_by: 'user-org-1',
    checked_in_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
]

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-p-1',
    title: 'Registration Confirmed',
    message: 'Your registration for HackFest 2025 is confirmed.',
    type: 'SUCCESS',
    category: 'REGISTRATION',
    read: false,
    action_url: '/participant',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    // ✅ FIX 2: Changed "Neural Ninjas" → "CodeCraft"
    //    Jamie's join request (req-1) targets team-2 (CodeCraft), not Neural Ninjas
    id: 'notif-2',
    user_id: 'user-p-2',
    title: 'Join Request Received',
    message: 'Jamie Dev wants to join CodeCraft.',
    type: 'INFO',
    category: 'TEAM',
    read: false,
    action_url: '/participant/team',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

// ─── CREDENTIALS ─────────────────────────────────────────────────────────────
export const mockCredentials: Record<string, string> = {
  'organizer@eventos.dev': 'org123',
  'priya@eventos.dev': 'org123',
  'participant@eventos.dev': 'part123',
  'sam@eventos.dev': 'part123',
  'riya@eventos.dev': 'part123',
  'arjun@eventos.dev': 'part123',
}