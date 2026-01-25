/**
 * Seed script to populate fake profiles into Supabase
 *
 * Run with: node scripts/seed-fake-profiles.js
 *
 * Make sure to install @supabase/supabase-js first:
 * npm install @supabase/supabase-js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://argeddeskonatzovyzil.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZ2VkZGVza29uYXR6b3Z5emlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mzc1NzIsImV4cCI6MjA4NDExMzU3Mn0.sTHJI8nZvD1_uZZOQ6WSaCNRdERk3lMaa76O0roJgI0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fake profiles data
const FAKE_PROFILES = [
  // Female profiles
  {
    id: 'fake_emma_001',
    name: 'Emma',
    age: 24,
    gender: 'female',
    location: 'Sydney, NSW',
    bio: "Software developer who speaks fluent cat and Python. I got my autism diagnosis at 22 and it explained so much! I love deep conversations about tech, sci-fi books, and why certain textures are just wrong. Looking for someone who understands that 'Netflix and chill' actually means watching the entire series in one sitting.",
    interests: ['Coding', 'Science Fiction', 'Cats', 'Video Games', 'Board Games'],
    goals: ['relationship', 'friendship'],
    profile_photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
    communication_style: 'Direct communicator who appreciates clear expectations',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_sarah_002',
    name: 'Sarah',
    age: 28,
    gender: 'female',
    location: 'Melbourne, VIC',
    bio: "Plant mum to 47 succulents (yes, I've counted). Artist and illustrator who turns hyperfocus into pretty pictures. Diagnosed autistic at 26. I communicate better through memes than small talk, and I think parallel play is the best kind of date activity. If you can appreciate comfortable silence, we might just get along.",
    interests: ['Art', 'Plants', 'Nature', 'Animation', 'Tea'],
    goals: ['relationship', 'friendship'],
    profile_photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'],
    communication_style: 'Visual communicator, may take time to respond while processing',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_maya_003',
    name: 'Maya',
    age: 22,
    gender: 'female',
    location: 'Brisbane, QLD',
    bio: "Music producer and DJ who lives for the perfect beat drop. Being autistic gives me superpowers when it comes to hearing patterns in music! I might forget to eat when I'm in the zone, but I'll never forget a good conversation. Looking for someone who can handle my energy and doesn't mind LED lights everywhere.",
    interests: ['Music Production', 'DJing', 'Concerts', 'Electronic Music', 'Dancing'],
    goals: ['relationship', 'friendship', 'practice'],
    profile_photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'],
    communication_style: 'Energetic texter who uses lots of emojis',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_olivia_004',
    name: 'Olivia',
    age: 31,
    gender: 'female',
    location: 'Perth, WA',
    bio: "Marine biologist who gets unreasonably excited about octopuses. Late-diagnosed at 29 and finally everything makes sense! I prefer one-on-one hangouts over big groups, and my idea of a perfect date is watching documentaries and info-dumping about ocean creatures. Emotional support water bottle always in hand.",
    interests: ['Marine Biology', 'Documentaries', 'Ocean', 'Research', 'Reading'],
    goals: ['relationship'],
    profile_photos: ['https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400'],
    communication_style: 'Thoughtful communicator who likes to process before responding',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_lily_005',
    name: 'Lily',
    age: 26,
    gender: 'female',
    location: 'Adelaide, SA',
    bio: "Librarian who has strong opinions about book organization. Autistic and proud! I find comfort in routines and get genuinely excited about spreadsheets. Looking for someone who appreciates cozy vibes, doesn't mind my book collection taking over the apartment, and understands that my cat judges everyone.",
    interests: ['Books', 'Libraries', 'Cats', 'Knitting', 'Puzzles'],
    goals: ['relationship', 'friendship'],
    profile_photos: ['https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400'],
    communication_style: 'Prefers written communication over calls',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_chloe_006',
    name: 'Chloe',
    age: 23,
    gender: 'female',
    location: 'Gold Coast, QLD',
    bio: "Fitness instructor who uses exercise as a stim. Getting diagnosed with autism helped me understand why I've always been 'different' - now I embrace it! I'm passionate about accessible fitness and showing that neurodivergent people can be athletic too. Bonus: I'll never judge your form, only encourage it.",
    interests: ['Fitness', 'Yoga', 'Nutrition', 'Swimming', 'Hiking'],
    goals: ['relationship', 'friendship', 'practice'],
    profile_photos: ['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400'],
    communication_style: 'Encouraging and supportive communicator',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_amber_007',
    name: 'Amber',
    age: 29,
    gender: 'female',
    location: 'Canberra, ACT',
    bio: "Policy analyst by day, true crime podcast obsessive by night. My autism means I notice details others miss - great for work, slightly concerning for my true crime interest. Looking for someone who enjoys deep dives into weird topics and won't judge my very specific food preferences.",
    interests: ['True Crime', 'Podcasts', 'Politics', 'Mystery', 'Writing'],
    goals: ['relationship'],
    profile_photos: ['https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=400'],
    communication_style: 'Detail-oriented communicator who asks lots of questions',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_grace_008',
    name: 'Grace',
    age: 25,
    gender: 'female',
    location: 'Hobart, TAS',
    bio: "Wildlife photographer who prefers animals to most people (sorry not sorry). Autism gives me the patience to wait hours for the perfect shot. I express love through sharing cool animal facts and making sure you've eaten today. Looking for someone who enjoys quiet adventures and doesn't mind early mornings.",
    interests: ['Photography', 'Wildlife', 'Nature', 'Hiking', 'Conservation'],
    goals: ['relationship', 'friendship'],
    profile_photos: ['https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400'],
    communication_style: 'Quiet and observant, shows care through actions',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_zoe_009',
    name: 'Zoe',
    age: 27,
    gender: 'female',
    location: 'Newcastle, NSW',
    bio: "Baker and pastry chef who finds peace in precise measurements. Diagnosed autistic at 25 and suddenly my whole life made sense. I show love through baking and will absolutely make you a themed birthday cake. Looking for someone who appreciates food as an art form and doesn't mind flour everywhere.",
    interests: ['Baking', 'Cooking', 'Food Photography', 'Recipes', 'Kitchen Gadgets'],
    goals: ['relationship'],
    profile_photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'],
    communication_style: 'Warm communicator who shows affection through gifts',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_indie_010',
    name: 'Indie',
    age: 21,
    gender: 'female',
    location: 'Byron Bay, NSW',
    bio: "Art student and chronic overthinker. Self-diagnosed at 19, officially diagnosed at 20. I express myself better through paint than words, and I need you to know my art room is organized chaos that makes perfect sense to me. Looking for someone who gets the starving artist lifestyle and creative energy.",
    interests: ['Painting', 'Art', 'Museums', 'Vintage Shopping', 'Music'],
    goals: ['friendship', 'practice'],
    profile_photos: ['https://images.unsplash.com/photo-1502767882403-636aee14f873?w=400'],
    communication_style: 'Creative communicator, may send art instead of words',
    onboarding_completed: true,
    is_fake: true,
  },
  // Male profiles
  {
    id: 'fake_james_011',
    name: 'James',
    age: 27,
    gender: 'male',
    location: 'Sydney, NSW',
    bio: "Game developer who thinks in systems and mechanics. Diagnosed autistic at 8, so I've had time to figure myself out! I love explaining complex things in simple ways and believe every conversation should have a purpose. Looking for someone who appreciates direct communication and indoor activities.",
    interests: ['Game Development', 'Programming', 'Board Games', 'Strategy Games', 'Sci-Fi'],
    goals: ['relationship', 'friendship'],
    profile_photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
    communication_style: 'Logical and direct, appreciates structured conversations',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_alex_012',
    name: 'Alex',
    age: 30,
    gender: 'male',
    location: 'Melbourne, VIC',
    bio: "Mechanical engineer who rebuilds vintage motorcycles for fun. Autism means I hyperfocus like a pro - give me a project and I'll emerge days later having mastered it. I struggle with small talk but can discuss engines or astronomy for hours. Looking for someone patient who doesn't mind oil stains.",
    interests: ['Motorcycles', 'Engineering', 'Astronomy', 'Mechanics', 'DIY'],
    goals: ['relationship'],
    profile_photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
    communication_style: 'Quiet but passionate when discussing interests',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_noah_013',
    name: 'Noah',
    age: 25,
    gender: 'male',
    location: 'Brisbane, QLD',
    bio: "Music teacher who believes everyone deserves to experience music. Late-diagnosed at 23 and it was life-changing! I stim through drumming and might tap rhythms constantly without realizing. Looking for someone who can appreciate enthusiasm and doesn't mind impromptu jam sessions.",
    interests: ['Music', 'Teaching', 'Drums', 'Concerts', 'Sound Design'],
    goals: ['relationship', 'friendship', 'practice'],
    profile_photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'],
    communication_style: 'Enthusiastic communicator who talks with hands',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_ethan_014',
    name: 'Ethan',
    age: 32,
    gender: 'male',
    location: 'Perth, WA',
    bio: "Data scientist who sees patterns everywhere. Diagnosed autistic at 28 after my wife (now ex) suggested it. I'm still learning to unmask after years of camouflaging. Looking for someone who values authenticity and understands that sometimes I need to retreat into spreadsheets.",
    interests: ['Data Science', 'Statistics', 'Chess', 'Puzzles', 'Documentaries'],
    goals: ['relationship'],
    profile_photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'],
    communication_style: 'Thoughtful communicator who may need time to process',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_liam_015',
    name: 'Liam',
    age: 24,
    gender: 'male',
    location: 'Adelaide, SA',
    bio: "Veterinarian who chose animals because they don't require small talk. Autism diagnosis at 19 explained why I always connected better with pets. I have a dry sense of humor that takes getting used to. Looking for someone who loves animals and doesn't mind that my dog is basically my emotional support.",
    interests: ['Animals', 'Veterinary Medicine', 'Dogs', 'Nature', 'Hiking'],
    goals: ['relationship', 'friendship'],
    profile_photos: ['https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'],
    communication_style: 'Dry humor, more comfortable with animals than people',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_oliver_016',
    name: 'Oliver',
    age: 29,
    gender: 'male',
    location: 'Gold Coast, QLD',
    bio: "Chef who finds zen in the chaos of a busy kitchen. Diagnosed autistic at 27 - turns out repetitive kitchen tasks are perfect stims! I communicate love through food and will absolutely remember your dietary restrictions. Looking for someone who appreciates a home-cooked meal and doesn't mind late nights.",
    interests: ['Cooking', 'Food', 'Restaurants', 'Travel', 'Wine'],
    goals: ['relationship'],
    profile_photos: ['https://images.unsplash.com/photo-1463453091185-61582044d556?w=400'],
    communication_style: 'Shows affection through acts of service (cooking)',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_marcus_017',
    name: 'Marcus',
    age: 26,
    gender: 'male',
    location: 'Canberra, ACT',
    bio: "Cybersecurity analyst who legally hacks things for a living. Autism gives me the focus to spot vulnerabilities others miss. I'm upfront about being neurodivergent because masking is exhausting. Looking for someone who values honesty and doesn't mind that I check locks multiple times.",
    interests: ['Cybersecurity', 'Hacking', 'Technology', 'Puzzles', 'Escape Rooms'],
    goals: ['relationship', 'friendship'],
    profile_photos: ['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400'],
    communication_style: 'Direct and honest, dislikes ambiguity',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_ryan_018',
    name: 'Ryan',
    age: 23,
    gender: 'male',
    location: 'Hobart, TAS',
    bio: "Marine biology student who could talk about sharks all day. Diagnosed autistic at 15, which helped me embrace my 'weirdness'. I need routine to function but I'm flexible about what that routine contains. Looking for someone who doesn't mind ocean facts at random moments.",
    interests: ['Marine Biology', 'Sharks', 'Diving', 'Ocean', 'Conservation'],
    goals: ['friendship', 'practice'],
    profile_photos: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400'],
    communication_style: 'Enthusiastic about special interests, may info-dump',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_daniel_019',
    name: 'Daniel',
    age: 35,
    gender: 'male',
    location: 'Newcastle, NSW',
    bio: "Architect who sees buildings as puzzles. Diagnosed autistic at 30 after my son was diagnosed - thanks, kid! I've learned that being neurodivergent is a feature, not a bug. Looking for someone mature who understands life gets complicated and values depth over small talk.",
    interests: ['Architecture', 'Design', 'Art', 'Urban Planning', 'Photography'],
    goals: ['relationship'],
    profile_photos: ['https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400'],
    communication_style: 'Mature communicator who values meaningful conversations',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_sam_020',
    name: 'Sam',
    age: 28,
    gender: 'male',
    location: 'Darwin, NT',
    bio: "Park ranger who chose a job with minimal human interaction (smart, right?). Autism plus outdoor job equals happy brain! I'm passionate about conservation and can identify most Australian wildlife by sound. Looking for someone adventurous who doesn't mind off-grid living sometimes.",
    interests: ['Nature', 'Conservation', 'Wildlife', 'Camping', 'Bird Watching'],
    goals: ['relationship', 'friendship'],
    profile_photos: ['https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400'],
    communication_style: 'Quiet and nature-focused, better in natural settings',
    onboarding_completed: true,
    is_fake: true,
  },
  // Non-binary profiles
  {
    id: 'fake_riley_021',
    name: 'Riley',
    age: 24,
    gender: 'non-binary',
    location: 'Sydney, NSW',
    bio: "Queer autistic artist who uses they/them pronouns. My art explores neurodivergent and non-binary experiences. I got diagnosed at 22 after learning that autism presents differently in AFAB people. Looking for connections with people who get the intersection of being ND and queer.",
    interests: ['Art', 'LGBTQ+ Advocacy', 'Zines', 'Community', 'Music'],
    goals: ['friendship', 'relationship', 'practice'],
    profile_photos: ['https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400'],
    communication_style: 'Affirming and community-oriented',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_jordan_022',
    name: 'Jordan',
    age: 27,
    gender: 'non-binary',
    location: 'Melbourne, VIC',
    bio: "Non-binary game designer (they/them). Creating inclusive games that represent neurodivergent experiences. Diagnosed autistic at 25. I believe in radical acceptance and building worlds where everyone belongs. Looking for players 2+ for life's co-op mode.",
    interests: ['Game Design', 'Inclusion', 'Tabletop Games', 'Writing', 'Community'],
    goals: ['relationship', 'friendship'],
    profile_photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'],
    communication_style: 'Inclusive language, thoughtful responses',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_kai_023',
    name: 'Kai',
    age: 22,
    gender: 'non-binary',
    location: 'Brisbane, QLD',
    bio: "Agender plant parent and environmental science student (they/them). Autism and being non-binary both mean existing outside the 'norm' - and that's beautiful. I prefer texting to calls and plants to most social situations. Looking for someone who respects both my identity and my need for quiet time.",
    interests: ['Plants', 'Environment', 'Science', 'Sustainability', 'Quiet Activities'],
    goals: ['friendship', 'practice'],
    profile_photos: ['https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400'],
    communication_style: 'Gentle communicator who needs processing time',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_avery_024',
    name: 'Avery',
    age: 30,
    gender: 'non-binary',
    location: 'Perth, WA',
    bio: "Non-binary therapist specializing in neurodivergent clients (they/them). Diagnosed autistic at 26, now using lived experience to help others. I believe in the power of understanding our own minds. Looking for meaningful connections with people who value emotional intelligence.",
    interests: ['Psychology', 'Mental Health', 'Reading', 'Meditation', 'Community Support'],
    goals: ['relationship', 'friendship'],
    profile_photos: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'],
    communication_style: 'Emotionally intelligent and validating',
    onboarding_completed: true,
    is_fake: true,
  },
  {
    id: 'fake_morgan_025',
    name: 'Morgan',
    age: 26,
    gender: 'non-binary',
    location: 'Adelaide, SA',
    bio: "Genderqueer software engineer who codes in comfortable clothes (any pronouns). Autism + tech is a classic combo and I'm here for it! I find human interaction protocols harder to debug than actual code. Looking for someone who appreciates tech humor and late-night coding sessions.",
    interests: ['Programming', 'Technology', 'Comics', 'Sci-Fi', 'Gaming'],
    goals: ['relationship', 'friendship', 'practice'],
    profile_photos: ['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400'],
    communication_style: 'Casual, uses tech metaphors, appreciates humor',
    onboarding_completed: true,
    is_fake: true,
  },
];

async function seedFakeProfiles() {
  console.log('Starting to seed fake profiles...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const profile of FAKE_PROFILES) {
    try {
      // Check if profile already exists
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', profile.id)
        .single();

      if (existing) {
        console.log(`[SKIP] Profile ${profile.name} (${profile.id}) already exists`);
        successCount++;
        continue;
      }

      // Insert the profile
      const { error } = await supabase
        .from('user_profiles')
        .insert(profile);

      if (error) {
        console.error(`[ERROR] Failed to insert ${profile.name}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`[OK] Inserted ${profile.name} (${profile.gender}, ${profile.age}, ${profile.location})`);
        successCount++;
      }
    } catch (err) {
      console.error(`[ERROR] Exception for ${profile.name}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n===========================================');
  console.log(`Seeding complete!`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total: ${FAKE_PROFILES.length}`);
  console.log('===========================================\n');
}

// Run the seed function
seedFakeProfiles()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
