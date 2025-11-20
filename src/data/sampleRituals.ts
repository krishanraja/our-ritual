export interface SampleRitual {
  id: string;
  title: string;
  description: string;
  time_estimate: string;
  budget_band: string;
  category: string;
  is_sample: true;
}

export const SAMPLE_RITUALS: SampleRitual[] = [
  {
    id: 'sample-1',
    title: '☕ Morning Coffee Ritual',
    description: 'Start your day with 15 minutes of uninterrupted conversation over coffee. No phones, no distractions—just you two and your morning brew.',
    time_estimate: '15 min',
    budget_band: 'Free',
    category: 'Daily Connection',
    is_sample: true,
  },
  {
    id: 'sample-2',
    title: '🌅 Sunset Walk',
    description: 'Take a slow evening walk together as the sun sets. Hold hands, share what made you smile today, and watch the sky change colors.',
    time_estimate: '30 min',
    budget_band: 'Free',
    category: 'Movement & Connection',
    is_sample: true,
  },
  {
    id: 'sample-3',
    title: '🍳 Weekend Breakfast Co-Creation',
    description: 'Cook breakfast together without a recipe. Pick ingredients you both love and create something new. It\'s about the process, not perfection.',
    time_estimate: '45 min',
    budget_band: '$',
    category: 'Co-Creation',
    is_sample: true,
  },
  {
    id: 'sample-4',
    title: '📖 Story Swap',
    description: 'Each person shares a memory from before you met. Something funny, formative, or totally random. Learn something new about each other.',
    time_estimate: '20 min',
    budget_band: 'Free',
    category: 'Deep Connection',
    is_sample: true,
  },
  {
    id: 'sample-5',
    title: '🎵 Dance in the Kitchen',
    description: 'Put on a song that makes you both move. Dance like nobody\'s watching (because they\'re not). Let loose, laugh, be silly together.',
    time_estimate: '10 min',
    budget_band: 'Free',
    category: 'Playfulness',
    is_sample: true,
  },
  {
    id: 'sample-6',
    title: '🌙 Stargazing Check-In',
    description: 'Before bed, step outside for 10 minutes. Look at the sky together and share one thing you\'re grateful for and one thing you\'re looking forward to.',
    time_estimate: '10 min',
    budget_band: 'Free',
    category: 'Evening Ritual',
    is_sample: true,
  },
];
