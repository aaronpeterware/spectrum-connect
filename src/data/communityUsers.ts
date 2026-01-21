// Community User Profiles
// AI-generated users that populate the community to make it feel alive
// These represent real Australians with autism who are learning and dating

export interface CommunityUser {
  id: string;
  name: string;
  age: number;
  gender: 'female' | 'male' | 'non-binary';
  location: string;
  profileImage: string;
  bio: string;
  interests: string[];
  autismRelated: {
    diagnosed: boolean;
    strengths: string[];
    challenges: string[];
  };
  joinedDate: string;
  postsCount: number;
  level: number;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  content: string;
  category: 'success' | 'question' | 'tip' | 'vent' | 'introduction';
  likes: number;
  comments: CommunityComment[];
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: string;
}

// Australian cities for realistic locations
const AUSTRALIAN_CITIES = [
  'Sydney, NSW',
  'Melbourne, VIC',
  'Brisbane, QLD',
  'Perth, WA',
  'Adelaide, SA',
  'Gold Coast, QLD',
  'Newcastle, NSW',
  'Canberra, ACT',
  'Wollongong, NSW',
  'Hobart, TAS',
  'Geelong, VIC',
  'Townsville, QLD',
  'Cairns, QLD',
  'Darwin, NT',
];

export const COMMUNITY_USERS: CommunityUser[] = [
  {
    id: 'user_sarah',
    name: 'Sarah M.',
    age: 24,
    gender: 'female',
    location: 'Melbourne, VIC',
    profileImage: 'https://randomuser.me/api/portraits/women/32.jpg',
    bio: 'Late-diagnosed at 22. Finally understanding myself! Love cats, crochet, and cozy games like Stardew Valley. Working on putting myself out there more.',
    interests: ['Crafts', 'Video games', 'Cats', 'True crime podcasts'],
    autismRelated: {
      diagnosed: true,
      strengths: ['Pattern recognition', 'Deep focus', 'Honesty'],
      challenges: ['Small talk', 'Sensory overload', 'Reading facial expressions'],
    },
    joinedDate: '2025-08-15',
    postsCount: 12,
    level: 3,
  },
  {
    id: 'user_marcus',
    name: 'Marcus T.',
    age: 28,
    gender: 'male',
    location: 'Sydney, NSW',
    profileImage: 'https://randomuser.me/api/portraits/men/22.jpg',
    bio: 'Train enthusiast and IT support tech. Diagnosed as a kid. Here to learn dating skills and maybe meet someone who gets me. I know way too much about Sydney\'s rail history.',
    interests: ['Trains', 'Technology', 'History', 'Model building'],
    autismRelated: {
      diagnosed: true,
      strengths: ['Technical skills', 'Attention to detail', 'Reliability'],
      challenges: ['Eye contact', 'Spontaneity', 'Group conversations'],
    },
    joinedDate: '2025-06-20',
    postsCount: 24,
    level: 5,
  },
  {
    id: 'user_jessica',
    name: 'Jess K.',
    age: 26,
    gender: 'female',
    location: 'Brisbane, QLD',
    profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Librarian by day, fantasy novel reader by night. Exploring the dating world after a few years of focusing on myself. Looking for someone who appreciates quiet evenings.',
    interests: ['Books', 'Fantasy', 'Board games', 'Tea'],
    autismRelated: {
      diagnosed: true,
      strengths: ['Memory', 'Organisation', 'Written communication'],
      challenges: ['Phone calls', 'Unexpected changes', 'Crowded places'],
    },
    joinedDate: '2025-09-01',
    postsCount: 18,
    level: 4,
  },
  {
    id: 'user_daniel',
    name: 'Daniel W.',
    age: 31,
    gender: 'male',
    location: 'Perth, WA',
    profileImage: 'https://randomuser.me/api/portraits/men/45.jpg',
    bio: 'Musician and sound engineer. Got diagnosed at 29 - life makes so much more sense now! Learning that being myself is actually attractive, who knew?',
    interests: ['Music production', 'Guitar', 'Vinyl records', 'Coffee'],
    autismRelated: {
      diagnosed: true,
      strengths: ['Creativity', 'Perfect pitch', 'Dedication'],
      challenges: ['Networking', 'Flirting', 'Sensory sensitivity to lights'],
    },
    joinedDate: '2025-07-10',
    postsCount: 31,
    level: 6,
  },
  {
    id: 'user_amy',
    name: 'Amy L.',
    age: 23,
    gender: 'female',
    location: 'Adelaide, SA',
    profileImage: 'https://randomuser.me/api/portraits/women/67.jpg',
    bio: 'Art student specialising in digital illustration. Proudly autistic! I draw comics about neurodivergent experiences. Dating apps are scary but I\'m trying!',
    interests: ['Digital art', 'Comics', 'Anime', 'Japanese culture'],
    autismRelated: {
      diagnosed: true,
      strengths: ['Artistic talent', 'Visual thinking', 'Empathy for fellow NDs'],
      challenges: ['Initiating conversations', 'Knowing when someone likes me', 'Loud environments'],
    },
    joinedDate: '2025-10-05',
    postsCount: 8,
    level: 2,
  },
  {
    id: 'user_ben',
    name: 'Ben H.',
    age: 27,
    gender: 'male',
    location: 'Gold Coast, QLD',
    profileImage: 'https://randomuser.me/api/portraits/men/67.jpg',
    bio: 'Marine biologist working on reef conservation. Nature is my happy place. Working on being more social - this app has really helped! Looking for someone who loves the ocean.',
    interests: ['Marine life', 'Scuba diving', 'Photography', 'Documentaries'],
    autismRelated: {
      diagnosed: true,
      strengths: ['Scientific thinking', 'Patience', 'Environmental passion'],
      challenges: ['Small talk', 'Reading between the lines', 'Busy social events'],
    },
    joinedDate: '2025-05-15',
    postsCount: 42,
    level: 7,
  },
  {
    id: 'user_emma',
    name: 'Emma R.',
    age: 29,
    gender: 'female',
    location: 'Hobart, TAS',
    profileImage: 'https://randomuser.me/api/portraits/women/55.jpg',
    bio: 'Accountant who actually loves spreadsheets (stereotype alert!). Self-diagnosed, seeking formal diagnosis. The dating lessons here have been eye-opening.',
    interests: ['Puzzles', 'Hiking', 'Numbers', 'Baking'],
    autismRelated: {
      diagnosed: false,
      strengths: ['Analytical thinking', 'Detail-oriented', 'Punctuality'],
      challenges: ['Understanding sarcasm', 'Emotional expression', 'Unstructured social time'],
    },
    joinedDate: '2025-08-22',
    postsCount: 15,
    level: 4,
  },
  {
    id: 'user_chris',
    name: 'Chris N.',
    age: 25,
    gender: 'male',
    location: 'Canberra, ACT',
    profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Software developer and retro gaming collector. Diagnosed at 8. Had my first real date last month thanks to practicing here! It didn\'t lead anywhere but I\'m proud I tried.',
    interests: ['Retro games', 'Coding', 'Mechanical keyboards', 'Sci-fi'],
    autismRelated: {
      diagnosed: true,
      strengths: ['Programming', 'Problem-solving', 'Learning new systems'],
      challenges: ['Body language', 'Transitions', 'Phone conversations'],
    },
    joinedDate: '2025-04-01',
    postsCount: 56,
    level: 8,
  },
  {
    id: 'user_lily',
    name: 'Lily P.',
    age: 22,
    gender: 'female',
    location: 'Newcastle, NSW',
    profileImage: 'https://randomuser.me/api/portraits/women/21.jpg',
    bio: 'Psychology student interested in neurodiversity research. Want to help others like me! Here to practice social skills and maybe find someone special.',
    interests: ['Psychology', 'Reading', 'Yoga', 'Journaling'],
    autismRelated: {
      diagnosed: true,
      strengths: ['Empathy', 'Research skills', 'Self-awareness'],
      challenges: ['Overwhelm in groups', 'Assertiveness', 'Masking exhaustion'],
    },
    joinedDate: '2025-09-18',
    postsCount: 11,
    level: 3,
  },
  {
    id: 'user_ryan',
    name: 'Ryan J.',
    age: 30,
    gender: 'male',
    location: 'Geelong, VIC',
    profileImage: 'https://randomuser.me/api/portraits/men/55.jpg',
    bio: 'Chef who turned a special interest into a career! Food is my love language. Learning that dating doesn\'t have to be dinner at a fancy restaurant - low pressure is okay.',
    interests: ['Cooking', 'Food science', 'Farmers markets', 'Football'],
    autismRelated: {
      diagnosed: true,
      strengths: ['Culinary creativity', 'Taste memory', 'Routine management'],
      challenges: ['Date planning', 'Unexpected questions', 'Physical touch'],
    },
    joinedDate: '2025-07-30',
    postsCount: 27,
    level: 5,
  },
];

// Sample posts from community users
export const SAMPLE_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    authorId: 'user_marcus',
    content: 'Had my first coffee date yesterday! I was really nervous but I used the tips from Module 2 about reading body language. She smiled a lot and asked follow-up questions which I now know means she was interested! We\'re meeting again next week. 🎉',
    category: 'success',
    likes: 47,
    comments: [
      {
        id: 'comment_1',
        authorId: 'user_sarah',
        content: 'This is so wholesome! Well done for putting yourself out there!',
        likes: 12,
        createdAt: '2026-01-19T10:30:00Z',
      },
      {
        id: 'comment_2',
        authorId: 'user_chris',
        content: 'The body language module helped me too. So good to have clear signals to look for.',
        likes: 8,
        createdAt: '2026-01-19T11:15:00Z',
      },
    ],
    createdAt: '2026-01-19T09:00:00Z',
  },
  {
    id: 'post_2',
    authorId: 'user_amy',
    content: 'Does anyone else find it hard to know if they\'re being flirted with vs just friendly conversation? I matched with someone and we\'ve been chatting for a week but I genuinely can\'t tell if they like me romantically or just want to be friends 😅',
    category: 'question',
    likes: 38,
    comments: [
      {
        id: 'comment_3',
        authorId: 'user_jess',
        content: 'Story of my life! The audio lesson about "Enthusiastic Yes vs Polite Yes" really helped me understand the difference.',
        likes: 15,
        createdAt: '2026-01-18T15:20:00Z',
      },
      {
        id: 'comment_4',
        authorId: 'user_daniel',
        content: 'Honestly, sometimes I just ask directly. Most people appreciate the honesty!',
        likes: 22,
        createdAt: '2026-01-18T16:00:00Z',
      },
    ],
    createdAt: '2026-01-18T14:30:00Z',
  },
  {
    id: 'post_3',
    authorId: 'user_ben',
    content: 'TIP: I\'ve started telling dates upfront that I\'m autistic and might miss social cues. Every single person has responded positively! It takes the pressure off and they\'re more likely to be direct with me. Win-win.',
    category: 'tip',
    likes: 89,
    comments: [
      {
        id: 'comment_5',
        authorId: 'user_emma',
        content: 'This is brave! I\'m still working up the courage to disclose early on.',
        likes: 18,
        createdAt: '2026-01-17T09:45:00Z',
      },
      {
        id: 'comment_6',
        authorId: 'user_lily',
        content: 'I do this too! It also filters out people who wouldn\'t be compatible anyway.',
        likes: 25,
        createdAt: '2026-01-17T10:30:00Z',
      },
    ],
    createdAt: '2026-01-17T08:00:00Z',
  },
  {
    id: 'post_4',
    authorId: 'user_jess',
    content: 'Just need to vent: went on a date and thought it went well, but they never replied to my follow-up message. I know logically that it\'s probably just not a match, but my brain keeps analyzing every moment trying to figure out what I did wrong. Anyone else do this?',
    category: 'vent',
    likes: 64,
    comments: [
      {
        id: 'comment_7',
        authorId: 'user_ryan',
        content: 'All the time. The overthinking is real. Remember: you can do everything "right" and still not be compatible. That\'s not failure.',
        likes: 31,
        createdAt: '2026-01-16T20:15:00Z',
      },
      {
        id: 'comment_8',
        authorId: 'user_marcus',
        content: 'Been there. The waiting is the worst part. Sending support your way!',
        likes: 14,
        createdAt: '2026-01-16T21:00:00Z',
      },
    ],
    createdAt: '2026-01-16T19:30:00Z',
  },
  {
    id: 'post_5',
    authorId: 'user_lily',
    content: 'Hi everyone! 👋 New here. I\'m a psychology student interested in neurodiversity. Been single my whole life and finally decided to work on my dating skills. This community seems so supportive - excited to be here!',
    category: 'introduction',
    likes: 52,
    comments: [
      {
        id: 'comment_9',
        authorId: 'user_sarah',
        content: 'Welcome! This community is amazing. Don\'t be afraid to ask questions!',
        likes: 9,
        createdAt: '2026-01-15T12:00:00Z',
      },
      {
        id: 'comment_10',
        authorId: 'user_chris',
        content: 'Welcome Lily! The modules are really helpful. Start with Conversation Fundamentals!',
        likes: 7,
        createdAt: '2026-01-15T13:30:00Z',
      },
    ],
    createdAt: '2026-01-15T11:00:00Z',
  },
  {
    id: 'post_6',
    authorId: 'user_chris',
    content: 'UPDATE: Remember when I posted about my first date? We\'ve now been dating for 3 months! 🥰 For anyone feeling hopeless - I was 25 with zero dating experience. If I can do it, you can too. The lessons here really work.',
    category: 'success',
    likes: 156,
    comments: [
      {
        id: 'comment_11',
        authorId: 'user_amy',
        content: 'This gives me so much hope! Congratulations!',
        likes: 28,
        createdAt: '2026-01-14T16:45:00Z',
      },
      {
        id: 'comment_12',
        authorId: 'user_ben',
        content: 'Amazing! Love seeing success stories like this. What was the most helpful thing you learned?',
        likes: 19,
        createdAt: '2026-01-14T17:30:00Z',
      },
    ],
    createdAt: '2026-01-14T15:00:00Z',
  },
  {
    id: 'post_7',
    authorId: 'user_daniel',
    content: 'TIP: If you\'re stressed about what to talk about on dates, prepare a mental list of 5 topics you\'re comfortable discussing. Not a script - just backup options. Mine are: music, travel dreams, food favourites, pets, and current TV shows.',
    category: 'tip',
    likes: 73,
    comments: [
      {
        id: 'comment_13',
        authorId: 'user_emma',
        content: 'Love this! I always blank when there\'s a pause. Having backups ready is genius.',
        likes: 16,
        createdAt: '2026-01-13T11:00:00Z',
      },
    ],
    createdAt: '2026-01-13T10:00:00Z',
  },
  {
    id: 'post_8',
    authorId: 'user_ryan',
    content: 'Question: How do you handle the "what do you do for work?" question when your special interest IS your job? I always end up infodumping about food science for way too long and can see their eyes glaze over 😬',
    category: 'question',
    likes: 45,
    comments: [
      {
        id: 'comment_14',
        authorId: 'user_daniel',
        content: 'I feel this! I try to give a 2-sentence answer then ask about theirs. If they seem interested, they\'ll ask follow-ups.',
        likes: 21,
        createdAt: '2026-01-12T19:30:00Z',
      },
      {
        id: 'comment_15',
        authorId: 'user_sarah',
        content: 'The lesson on "ping-pong conversation" helped me with this! Answer briefly, then bounce it back with a question.',
        likes: 17,
        createdAt: '2026-01-12T20:00:00Z',
      },
    ],
    createdAt: '2026-01-12T18:45:00Z',
  },
];

// Helper functions
export const getUserById = (id: string): CommunityUser | undefined => {
  return COMMUNITY_USERS.find(u => u.id === id);
};

export const getPostById = (id: string): CommunityPost | undefined => {
  return SAMPLE_POSTS.find(p => p.id === id);
};

export const getPostsByUser = (userId: string): CommunityPost[] => {
  return SAMPLE_POSTS.filter(p => p.authorId === userId);
};

export const getPostsByCategory = (category: CommunityPost['category']): CommunityPost[] => {
  return SAMPLE_POSTS.filter(p => p.category === category);
};

export default { COMMUNITY_USERS, SAMPLE_POSTS };
