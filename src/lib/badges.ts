import { Award, Ear, GraduationCap, ListChecks, Radio, Siren, Target } from 'lucide-react'

export type BadgeId =
  | 'first_signal'
  | 'sos_master'
  | 'all_seven'
  | 'a_to_z'
  | 'perfect_round'
  | 'quick_ears'
  | 'name_in_morse'

export const BADGES: { id: BadgeId; icon: typeof Award; color: string }[] = [
  { id: 'first_signal', icon: Radio, color: 'bg-primary' },
  { id: 'sos_master', icon: Siren, color: 'bg-pink' },
  { id: 'all_seven', icon: ListChecks, color: 'bg-accent' },
  { id: 'a_to_z', icon: GraduationCap, color: 'bg-info' },
  { id: 'perfect_round', icon: Target, color: 'bg-info' },
  { id: 'quick_ears', icon: Ear, color: 'bg-secondary' },
  { id: 'name_in_morse', icon: Award, color: 'bg-primary' },
]
