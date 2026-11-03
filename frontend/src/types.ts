export type Lang = 'en' | 'kn'

export type Journey = 'school' | 'admission' | 'restart'

export type Profile = {
  name: string
  journey: Journey
  education: string
  interest: string
  location: string
  rank: string
  budget: string
}

export const defaultProfile: Profile = {
  name: '',
  journey: 'school',
  education: '',
  interest: '',
  location: 'Bengaluru',
  rank: '',
  budget: '',
}

export const demoProfiles: Record<Journey, Profile> = {
  school: {
    name: 'Ananya',
    journey: 'school',
    education: 'Class 12 (Kannada medium, PCMB)',
    interest: 'Doctor / MBBS',
    location: 'Mysuru',
    rank: '',
    budget: 'Need scholarship options',
  },
  admission: {
    name: 'Karthik',
    journey: 'admission',
    education: 'PUC Science, KCET 2025',
    interest: 'Computer Science / Engineering',
    location: 'Bengaluru',
    rank: '12480',
    budget: 'Government college preferred',
  },
  restart: {
    name: 'Lakshmi',
    journey: 'restart',
    education: 'Left after Class 10',
    interest: 'Open schooling + vocational skills',
    location: 'Hubballi',
    rank: '',
    budget: 'Low cost, flexible hours',
  },
}
