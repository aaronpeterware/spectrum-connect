// Audio-based Social Cues Learning Data
// Conversations users listen to and identify social cues

export interface VoiceLine {
  speaker: string;
  voiceId: string; // ElevenLabs voice ID
  text: string;
  emotion?: string; // For context: "friendly", "nervous", "bored", "interested"
  bodyLanguage?: string; // Description of non-verbal cues
  timestamp?: number; // Approximate timestamp in seconds
}

export interface SocialCue {
  id: string;
  timestamp: number; // When this cue occurs in the audio
  type: 'positive' | 'negative' | 'neutral';
  category: 'body_language' | 'tone' | 'word_choice' | 'timing' | 'engagement';
  description: string; // What the cue is
  significance: string; // What it means
}

export interface AudioQuestion {
  id: string;
  triggerTimestamp?: number; // Show question at this point (null = end of audio)
  question: string;
  context?: string; // Additional context about what to listen for
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedCue: string; // ID of the SocialCue this tests
  points: number;
}

export interface AudioScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  setting: string;
  duration: string; // Estimated duration
  skillsFocused: string[];
  conversation: VoiceLine[];
  socialCues: SocialCue[];
  questions: AudioQuestion[];
  tips: string[];
  xpReward: number;
}

export interface AudioModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  scenarios: AudioScenario[];
}

// ElevenLabs Voice IDs (these are real ElevenLabs voice IDs)
export const VOICES = {
  // Female voices
  rachel: '21m00Tcm4TlvDq8ikWAM', // Rachel - calm, professional
  bella: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, friendly
  elli: 'MF3mGyEYCl7XYWbV9V6O', // Elli - young, energetic

  // Male voices
  adam: 'pNInz6obpgDQGcFmaJgB', // Adam - deep, authoritative
  josh: 'TxGEqnHWrfWFTfGW9XjX', // Josh - warm, conversational
  sam: 'yoZ06aMxZJJ28mfd3POQ', // Sam - casual, friendly
};

// Audio Lesson Modules
export const AUDIO_MODULES: AudioModule[] = [
  {
    id: 'audio_module_1',
    title: 'Reading Interest Signals',
    description: 'Learn to hear when someone is interested or wants to leave',
    icon: 'ear',
    color: '#8B5CF6',
    scenarios: [
      {
        id: 'audio_1_1',
        title: 'The Coffee Shop Connection',
        description: 'Listen for signs of genuine interest vs. politeness',
        difficulty: 'beginner',
        setting: 'Two people meeting at a coffee shop',
        duration: '1:30',
        skillsFocused: ['Interest signals', 'Engagement cues', 'Follow-up questions'],
        conversation: [
          {
            speaker: 'Alex',
            voiceId: VOICES.josh,
            text: "Hey! Is this seat taken?",
            emotion: 'friendly',
            bodyLanguage: 'Open posture, smiling',
            timestamp: 0
          },
          {
            speaker: 'Jordan',
            voiceId: VOICES.bella,
            text: "Oh, no go ahead! It's all yours.",
            emotion: 'welcoming',
            bodyLanguage: 'Looks up, makes eye contact, gestures to chair',
            timestamp: 3
          },
          {
            speaker: 'Alex',
            voiceId: VOICES.josh,
            text: "Thanks! I'm Alex by the way. This place has the best lattes.",
            emotion: 'warm',
            bodyLanguage: 'Sits down, faces Jordan',
            timestamp: 7
          },
          {
            speaker: 'Jordan',
            voiceId: VOICES.bella,
            text: "I'm Jordan! Yeah I come here all the time - what's your go-to order?",
            emotion: 'interested',
            bodyLanguage: 'Puts phone down, leans forward slightly',
            timestamp: 12
          },
          {
            speaker: 'Alex',
            voiceId: VOICES.josh,
            text: "Oat milk latte with an extra shot. I'm kind of a coffee snob, honestly.",
            emotion: 'playful',
            bodyLanguage: 'Relaxed, laughing',
            timestamp: 18
          },
          {
            speaker: 'Jordan',
            voiceId: VOICES.bella,
            text: "Ha! Same here. Have you tried the new seasonal one? I've been meaning to but I always chicken out and get my usual.",
            emotion: 'enthusiastic',
            bodyLanguage: 'Animated hand gestures, sustained eye contact',
            timestamp: 24
          },
          {
            speaker: 'Alex',
            voiceId: VOICES.josh,
            text: "I haven't but now I'm curious. Maybe I'll try it next time. Do you work nearby?",
            emotion: 'curious',
            bodyLanguage: 'Leaning in',
            timestamp: 32
          },
          {
            speaker: 'Jordan',
            voiceId: VOICES.bella,
            text: "Yeah, just around the corner actually. It's nice having this place so close. What about you - do you live around here?",
            emotion: 'engaged',
            bodyLanguage: 'Mirroring Alex\'s posture',
            timestamp: 38
          },
          {
            speaker: 'Alex',
            voiceId: VOICES.josh,
            text: "About ten minutes away. Hey, I don't want to keep you if you're busy, but would you want to grab coffee together sometime? Like, intentionally?",
            emotion: 'hopeful but respectful',
            bodyLanguage: 'Open hands, warm smile',
            timestamp: 46
          },
          {
            speaker: 'Jordan',
            voiceId: VOICES.bella,
            text: "I'd really like that actually! Here, let me give you my number.",
            emotion: 'genuinely pleased',
            bodyLanguage: 'Big smile, reaches for phone eagerly',
            timestamp: 54
          }
        ],
        socialCues: [
          {
            id: 'cue_1_1_a',
            timestamp: 12,
            type: 'positive',
            category: 'engagement',
            description: 'Jordan puts phone down and asks a follow-up question',
            significance: 'Putting away distractions and asking questions shows genuine interest'
          },
          {
            id: 'cue_1_1_b',
            timestamp: 24,
            type: 'positive',
            category: 'engagement',
            description: 'Jordan shares a personal detail and uses animated gestures',
            significance: 'Sharing personal information and being animated indicates comfort and interest'
          },
          {
            id: 'cue_1_1_c',
            timestamp: 38,
            type: 'positive',
            category: 'body_language',
            description: 'Jordan mirrors Alex\'s posture and asks a reciprocal question',
            significance: 'Mirroring and reciprocating questions builds rapport and shows engagement'
          },
          {
            id: 'cue_1_1_d',
            timestamp: 54,
            type: 'positive',
            category: 'tone',
            description: 'Jordan responds enthusiastically to the invitation',
            significance: 'Eager acceptance with action (giving number) confirms genuine interest'
          }
        ],
        questions: [
          {
            id: 'q_1_1_1',
            triggerTimestamp: undefined, // Ask at end
            question: 'What was the FIRST sign that Jordan was interested in talking?',
            context: 'Think about what Jordan did when Alex sat down.',
            options: [
              'Jordan smiled and said hello',
              'Jordan put their phone down and asked a follow-up question',
              'Jordan gave Alex a compliment',
              'Jordan moved closer'
            ],
            correctIndex: 1,
            explanation: 'Putting down the phone is a key interest signal - it shows Jordan chose to engage rather than use their phone as an escape. The follow-up question about Alex\'s coffee order showed genuine curiosity.',
            relatedCue: 'cue_1_1_a',
            points: 15
          },
          {
            id: 'q_1_1_2',
            question: 'When Jordan talked about the seasonal coffee, what indicated high engagement?',
            options: [
              'Speaking quickly',
              'Sharing a personal detail (chickening out) with animated gestures',
              'Changing the subject',
              'Looking around the room'
            ],
            correctIndex: 1,
            explanation: 'Jordan shared something slightly vulnerable (admitting they "chicken out") with enthusiasm. Sharing personal details and using animated gestures are strong signs of comfort and interest.',
            relatedCue: 'cue_1_1_b',
            points: 15
          },
          {
            id: 'q_1_1_3',
            question: 'What made Jordan\'s response to the date invitation a clear "yes"?',
            options: [
              'They said "sure" politely',
              'They said "I\'d really like that" and immediately offered their number',
              'They suggested a different time',
              'They hesitated before answering'
            ],
            correctIndex: 1,
            explanation: 'An enthusiastic verbal response ("I\'d really like that actually!") combined with immediate action (offering their number without being asked) shows genuine interest, not just politeness.',
            relatedCue: 'cue_1_1_d',
            points: 15
          },
          {
            id: 'q_1_1_4',
            question: 'Throughout the conversation, how did the questions flow?',
            options: [
              'Only Alex asked questions',
              'Only Jordan asked questions',
              'Both asked questions back and forth',
              'Neither asked many questions'
            ],
            correctIndex: 2,
            explanation: 'Good conversations have a "ping-pong" quality where both people ask and answer questions. This reciprocity is a key sign of mutual interest.',
            relatedCue: 'cue_1_1_c',
            points: 10
          }
        ],
        tips: [
          'When someone puts their phone away to talk to you, that\'s a strong interest signal',
          'Follow-up questions show someone is actually listening, not just being polite',
          'Sharing small personal details indicates comfort and willingness to connect',
          'Watch for "verbal plus action" responses - enthusiastic words backed by action'
        ],
        xpReward: 75
      },
      {
        id: 'audio_1_2',
        title: 'The Polite Exit',
        description: 'Learn to recognize when someone wants to leave a conversation',
        difficulty: 'beginner',
        setting: 'Networking event, two professionals talking',
        duration: '1:15',
        skillsFocused: ['Exit signals', 'Polite disinterest', 'Time pressure cues'],
        conversation: [
          {
            speaker: 'Taylor',
            voiceId: VOICES.sam,
            text: "So yeah, our Q3 projections are really exciting. We're looking at a 40% increase in user engagement.",
            emotion: 'enthusiastic',
            bodyLanguage: 'Animated, leaning forward',
            timestamp: 0
          },
          {
            speaker: 'Morgan',
            voiceId: VOICES.elli,
            text: "Oh, that's... that's great.",
            emotion: 'distracted',
            bodyLanguage: 'Glances at phone, shifts weight',
            timestamp: 8
          },
          {
            speaker: 'Taylor',
            voiceId: VOICES.sam,
            text: "Yeah! And the best part is we're rolling out this new feature that I've been working on for months-",
            emotion: 'excited',
            bodyLanguage: 'Not noticing Morgan\'s signals',
            timestamp: 12
          },
          {
            speaker: 'Morgan',
            voiceId: VOICES.elli,
            text: "Mm-hmm.",
            emotion: 'disengaged',
            bodyLanguage: 'Short response, looking around room',
            timestamp: 18
          },
          {
            speaker: 'Taylor',
            voiceId: VOICES.sam,
            text: "It uses machine learning to personalize the entire experience. I can tell you all about the technical architecture if you're interested!",
            emotion: 'eager',
            bodyLanguage: 'Still not reading the room',
            timestamp: 20
          },
          {
            speaker: 'Morgan',
            voiceId: VOICES.elli,
            text: "Yeah, um, that sounds interesting. Hey, I actually need to go say hi to someone I just spotted. But it was nice chatting!",
            emotion: 'polite but relieved',
            bodyLanguage: 'Steps back, angles body toward exit',
            timestamp: 28
          },
          {
            speaker: 'Taylor',
            voiceId: VOICES.sam,
            text: "Oh! Sure, no problem. Maybe we can connect on LinkedIn and I can send you more details?",
            emotion: 'slightly deflated',
            bodyLanguage: 'Finally notices',
            timestamp: 36
          },
          {
            speaker: 'Morgan',
            voiceId: VOICES.elli,
            text: "Sure, sounds good. Have a good night!",
            emotion: 'polite',
            bodyLanguage: 'Already turning away',
            timestamp: 42
          }
        ],
        socialCues: [
          {
            id: 'cue_1_2_a',
            timestamp: 8,
            type: 'negative',
            category: 'engagement',
            description: 'Morgan gives a flat, brief response and checks phone',
            significance: 'Short responses without follow-up questions indicate low interest'
          },
          {
            id: 'cue_1_2_b',
            timestamp: 18,
            type: 'negative',
            category: 'engagement',
            description: 'Morgan responds with just "Mm-hmm" while looking around',
            significance: 'Minimal verbal responses and scanning the room are exit signals'
          },
          {
            id: 'cue_1_2_c',
            timestamp: 28,
            type: 'negative',
            category: 'body_language',
            description: 'Morgan steps back, angles toward the exit, and gives an excuse to leave',
            significance: 'Physical distancing and excuse-making are clear signs someone wants out'
          },
          {
            id: 'cue_1_2_d',
            timestamp: 42,
            type: 'negative',
            category: 'tone',
            description: 'Morgan agrees to LinkedIn vaguely while already turning away',
            significance: 'Agreeing without enthusiasm while physically leaving is a polite brush-off'
          }
        ],
        questions: [
          {
            id: 'q_1_2_1',
            question: 'What was the FIRST sign Morgan wanted to exit the conversation?',
            options: [
              'Morgan said they had to leave',
              'Morgan\'s response was flat ("that\'s great") and they checked their phone',
              'Morgan stopped talking entirely',
              'Morgan interrupted Taylor'
            ],
            correctIndex: 1,
            explanation: 'The flat tone ("that\'s... that\'s great") combined with phone-checking at 8 seconds was the first signal. Interest would sound more like "Oh wow, tell me more!"',
            relatedCue: 'cue_1_2_a',
            points: 15
          },
          {
            id: 'q_1_2_2',
            question: 'What did Morgan\'s "Mm-hmm" while looking around indicate?',
            options: [
              'They were thinking deeply about what Taylor said',
              'They were looking for someone they knew',
              'They were disengaged and looking for an exit',
              'They were agreeing enthusiastically'
            ],
            correctIndex: 2,
            explanation: 'Minimal responses like "mm-hmm" combined with scanning the room are classic disengagement signals. An interested person would maintain eye contact and ask questions.',
            relatedCue: 'cue_1_2_b',
            points: 15
          },
          {
            id: 'q_1_2_3',
            question: 'How could Taylor have handled this better?',
            options: [
              'Talk faster to finish their point',
              'Ask Morgan a question about their work instead',
              'Keep going until Morgan explicitly said to stop',
              'Get Morgan\'s phone to share more details'
            ],
            correctIndex: 1,
            explanation: 'Shifting focus to the other person with a question shows social awareness and gives them a chance to engage - or gracefully exit if they\'re not interested.',
            relatedCue: 'cue_1_2_a',
            points: 15
          },
          {
            id: 'q_1_2_4',
            question: 'What does "Sure, sounds good" while already turning away usually mean?',
            options: [
              'They\'re definitely going to connect on LinkedIn',
              'They\'re genuinely interested but in a hurry',
              'It\'s a polite way to end the conversation without committing',
              'They want Taylor to follow up immediately'
            ],
            correctIndex: 2,
            explanation: 'Vague agreement ("sure, sounds good") while physically leaving is a polite brush-off. Someone genuinely interested would stop, make eye contact, or suggest a specific follow-up.',
            relatedCue: 'cue_1_2_d',
            points: 10
          }
        ],
        tips: [
          'Short responses without follow-up questions often signal disinterest',
          'Watch for "escape behaviors": phone checking, looking around, stepping back',
          'If someone isn\'t asking you questions, they may be waiting for an exit',
          'It\'s okay to check in: "I don\'t want to keep you if you need to go"'
        ],
        xpReward: 75
      },
      {
        id: 'audio_1_3',
        title: 'Mixed Signals on a Date',
        description: 'Navigate uncertainty when signals aren\'t clear',
        difficulty: 'intermediate',
        setting: 'First date at a restaurant',
        duration: '2:00',
        skillsFocused: ['Nervous vs. disinterested', 'Context matters', 'Verbal vs. non-verbal mismatch'],
        conversation: [
          {
            speaker: 'Casey',
            voiceId: VOICES.josh,
            text: "So this place came highly recommended. Have you been here before?",
            emotion: 'warm',
            bodyLanguage: 'Open posture, making eye contact',
            timestamp: 0
          },
          {
            speaker: 'Riley',
            voiceId: VOICES.bella,
            text: "No, first time! It's really nice though. Um, I hope I'm not underdressed.",
            emotion: 'nervous',
            bodyLanguage: 'Fidgeting with napkin, brief eye contact then looks away',
            timestamp: 5
          },
          {
            speaker: 'Casey',
            voiceId: VOICES.josh,
            text: "You look great, don't worry. So, you mentioned you work in design?",
            emotion: 'reassuring',
            bodyLanguage: 'Leaning in slightly',
            timestamp: 12
          },
          {
            speaker: 'Riley',
            voiceId: VOICES.bella,
            text: "Yeah! I'm a UX designer. It's um, it's really fun actually. I get to solve puzzles all day basically. Sorry, I'm rambling.",
            emotion: 'enthusiastic then self-conscious',
            bodyLanguage: 'Animated when talking about work, then pulls back',
            timestamp: 18
          },
          {
            speaker: 'Casey',
            voiceId: VOICES.josh,
            text: "No, I love it! Tell me more. What kind of puzzles?",
            emotion: 'genuinely interested',
            bodyLanguage: 'Smiling, engaged',
            timestamp: 28
          },
          {
            speaker: 'Riley',
            voiceId: VOICES.bella,
            text: "Well like... okay so imagine someone's trying to buy something online and they can't find the checkout button. My job is to figure out why and fix it. Make it intuitive.",
            emotion: 'warming up',
            bodyLanguage: 'More relaxed, using hands to explain',
            timestamp: 33
          },
          {
            speaker: 'Casey',
            voiceId: VOICES.josh,
            text: "That's actually really cool. I bet you notice bad design everywhere now.",
            emotion: 'playful',
            bodyLanguage: 'Laughing',
            timestamp: 45
          },
          {
            speaker: 'Riley',
            voiceId: VOICES.bella,
            text: "Oh my god, yes. It's a curse. I can't use an app without mentally redesigning it. Anyway, what about you? What's your day-to-day like?",
            emotion: 'relaxed and engaged',
            bodyLanguage: 'Full eye contact now, leaning forward',
            timestamp: 50
          }
        ],
        socialCues: [
          {
            id: 'cue_1_3_a',
            timestamp: 5,
            type: 'neutral',
            category: 'body_language',
            description: 'Riley fidgets and breaks eye contact but still engages verbally',
            significance: 'Fidgeting and brief eye contact can indicate nervousness, not disinterest - context matters'
          },
          {
            id: 'cue_1_3_b',
            timestamp: 18,
            type: 'positive',
            category: 'engagement',
            description: 'Riley becomes animated about work then self-corrects ("sorry, I\'m rambling")',
            significance: 'Enthusiasm breaking through nervousness is a positive sign - the self-correction shows they care about the impression they\'re making'
          },
          {
            id: 'cue_1_3_c',
            timestamp: 33,
            type: 'positive',
            category: 'body_language',
            description: 'Riley becomes more relaxed and uses hand gestures',
            significance: 'Warming up over time (less fidgeting, more gestures) indicates growing comfort'
          },
          {
            id: 'cue_1_3_d',
            timestamp: 50,
            type: 'positive',
            category: 'engagement',
            description: 'Riley makes full eye contact, leans forward, and asks about Casey',
            significance: 'Shifting to reciprocal questions with open body language shows genuine engagement'
          }
        ],
        questions: [
          {
            id: 'q_1_3_1',
            question: 'At the start, Riley fidgeted and broke eye contact. What did this most likely indicate?',
            options: [
              'Riley wasn\'t attracted to Casey',
              'Riley was bored already',
              'Riley was nervous but still interested',
              'Riley wanted to leave'
            ],
            correctIndex: 2,
            explanation: 'Riley still engaged verbally and was responsive - the fidgeting was nervousness, not disinterest. Disinterest would look like short answers and no questions back.',
            relatedCue: 'cue_1_3_a',
            points: 20
          },
          {
            id: 'q_1_3_2',
            question: 'When Riley said "Sorry, I\'m rambling," what did this reveal?',
            options: [
              'Riley was actually bored and wanted to change subjects',
              'Riley was embarrassed and wanted to leave',
              'Riley cared about making a good impression and was self-conscious',
              'Riley didn\'t like talking about work'
            ],
            correctIndex: 2,
            explanation: 'Self-correcting after enthusiasm shows Riley cares about how they\'re coming across - a sign of investment in the interaction.',
            relatedCue: 'cue_1_3_b',
            points: 15
          },
          {
            id: 'q_1_3_3',
            question: 'What was the clearest sign the date was going well?',
            options: [
              'Riley agreed to come to the restaurant',
              'Riley eventually made full eye contact, leaned in, and asked about Casey',
              'Riley talked a lot about their job',
              'Riley didn\'t leave early'
            ],
            correctIndex: 1,
            explanation: 'The combination of comfortable body language (eye contact, leaning in) AND showing interest in Casey (asking questions) is the strongest positive signal.',
            relatedCue: 'cue_1_3_d',
            points: 15
          },
          {
            id: 'q_1_3_4',
            question: 'How did Casey help Riley feel more comfortable?',
            options: [
              'By not asking any questions',
              'By changing the subject when Riley got nervous',
              'By encouraging Riley to keep sharing and showing genuine interest',
              'By talking mostly about themselves'
            ],
            correctIndex: 2,
            explanation: 'Casey responded to Riley\'s apology for rambling with "No, I love it! Tell me more." This encouragement helped Riley relax and open up.',
            relatedCue: 'cue_1_3_b',
            points: 15
          }
        ],
        tips: [
          'Nervousness and disinterest can look similar - watch for verbal engagement',
          'People often warm up over time - don\'t judge the whole date by the first few minutes',
          'Self-consciousness ("sorry, I\'m rambling") often means someone cares about impressing you',
          'Encouraging someone when they get excited helps them relax'
        ],
        xpReward: 100
      }
    ]
  },
  {
    id: 'audio_module_2',
    title: 'Tone & Emotional Cues',
    description: 'Hear the difference between what people say and how they say it',
    icon: 'mic',
    color: '#EC4899',
    scenarios: [
      {
        id: 'audio_2_1',
        title: 'The Enthusiastic Yes vs. The Polite Yes',
        description: 'Learn to distinguish genuine excitement from polite agreement',
        difficulty: 'intermediate',
        setting: 'Various social situations',
        duration: '1:00',
        skillsFocused: ['Tone recognition', 'Enthusiasm levels', 'Genuine vs. polite'],
        conversation: [
          {
            speaker: 'Chris',
            voiceId: VOICES.josh,
            text: "Hey, want to come to my birthday party next Saturday?",
            emotion: 'hopeful',
            bodyLanguage: 'Smiling, making eye contact',
            timestamp: 0
          },
          {
            speaker: 'Maya',
            voiceId: VOICES.bella,
            text: "Oh my gosh, yes! I wouldn't miss it. What time should I be there? Can I bring anything?",
            emotion: 'genuinely excited',
            bodyLanguage: 'Eyes light up, leans forward, rapid follow-up questions',
            timestamp: 4
          },
          {
            speaker: 'Chris',
            voiceId: VOICES.josh,
            text: "Amazing! It starts at 7. You don't need to bring anything.",
            emotion: 'happy',
            bodyLanguage: 'Beaming smile',
            timestamp: 10
          },
          {
            speaker: 'Chris',
            voiceId: VOICES.josh,
            text: "Hey Sophie, want to come to my birthday party next Saturday?",
            emotion: 'hopeful',
            bodyLanguage: 'Same friendly approach',
            timestamp: 16
          },
          {
            speaker: 'Sophie',
            voiceId: VOICES.elli,
            text: "Oh, um, yeah sure, I'll try to make it. What time is it?",
            emotion: 'hesitant',
            bodyLanguage: 'Brief pause, non-committal language, single question',
            timestamp: 20
          },
          {
            speaker: 'Chris',
            voiceId: VOICES.josh,
            text: "It's at 7. No pressure if you're busy though.",
            emotion: 'understanding',
            bodyLanguage: 'Gives an easy out',
            timestamp: 26
          }
        ],
        socialCues: [
          {
            id: 'cue_2_1_a',
            timestamp: 4,
            type: 'positive',
            category: 'tone',
            description: 'Maya responds immediately with enthusiasm and multiple follow-up questions',
            significance: 'Genuine excitement comes fast, uses emphatic language, and asks for details to commit'
          },
          {
            id: 'cue_2_1_b',
            timestamp: 20,
            type: 'neutral',
            category: 'tone',
            description: 'Sophie hesitates ("um"), hedges ("I\'ll try"), asks only one basic question',
            significance: 'Polite agreement often has pauses, non-committal words, and minimal follow-up'
          }
        ],
        questions: [
          {
            id: 'q_2_1_1',
            question: 'What made Maya\'s response clearly enthusiastic?',
            options: [
              'She said "yes"',
              'Immediate response, excited tone, and multiple follow-up questions',
              'She spoke loudly',
              'She made a promise'
            ],
            correctIndex: 1,
            explanation: 'Genuine enthusiasm shows through speed of response, excited tone, and asking multiple questions that show they\'re already planning to come.',
            relatedCue: 'cue_2_1_a',
            points: 15
          },
          {
            id: 'q_2_1_2',
            question: 'What words in Sophie\'s response signaled hesitation?',
            options: [
              '"Saturday" and "time"',
              '"um," "sure," and "I\'ll try"',
              '"Oh" and "what"',
              'There were no hesitation signals'
            ],
            correctIndex: 1,
            explanation: 'Filler words ("um"), weak agreement ("sure" instead of "yes!"), and hedging ("I\'ll try") all signal uncertainty or reluctance.',
            relatedCue: 'cue_2_1_b',
            points: 15
          },
          {
            id: 'q_2_1_3',
            question: 'How did Chris handle Sophie\'s hesitation well?',
            options: [
              'He pressured her to commit',
              'He ignored her hesitation',
              'He gave her an easy out: "No pressure if you\'re busy"',
              'He asked why she didn\'t want to come'
            ],
            correctIndex: 2,
            explanation: 'Giving someone an easy out respects their hesitation and lets them decline gracefully if needed. They might actually come, or they\'ll appreciate not being pressured.',
            relatedCue: 'cue_2_1_b',
            points: 20
          }
        ],
        tips: [
          'Enthusiastic responses come quickly, without hesitation words',
          '"Sure" and "I\'ll try" are often softer than "Yes!" and "Absolutely!"',
          'Multiple follow-up questions suggest someone is already planning to participate',
          'Give people easy outs - it builds trust and they\'ll be more honest with you'
        ],
        xpReward: 80
      },
      {
        id: 'audio_2_2',
        title: 'Detecting Discomfort',
        description: 'Hear when someone is uncomfortable with a topic',
        difficulty: 'intermediate',
        setting: 'Friends catching up',
        duration: '1:30',
        skillsFocused: ['Discomfort signals', 'Topic sensitivity', 'Graceful pivots'],
        conversation: [
          {
            speaker: 'Jamie',
            voiceId: VOICES.josh,
            text: "So how's it going with that person you were dating? You two seemed really happy last time I saw you.",
            emotion: 'curious and friendly',
            timestamp: 0
          },
          {
            speaker: 'Sam',
            voiceId: VOICES.elli,
            text: "Oh... yeah. Um, that didn't really work out actually.",
            emotion: 'uncomfortable',
            bodyLanguage: 'Voice drops, pause before answering, looks down',
            timestamp: 7
          },
          {
            speaker: 'Jamie',
            voiceId: VOICES.josh,
            text: "Oh no, what happened? You guys seemed so good together!",
            emotion: 'surprised, pressing for details',
            timestamp: 13
          },
          {
            speaker: 'Sam',
            voiceId: VOICES.elli,
            text: "It's... complicated. I don't really want to get into it, you know?",
            emotion: 'clearly wanting to change subject',
            bodyLanguage: 'Shorter sentences, closed body language',
            timestamp: 18
          },
          {
            speaker: 'Jamie',
            voiceId: VOICES.josh,
            text: "Oh, totally. I get it. Hey, let's talk about something else - did you end up going to that concert last weekend?",
            emotion: 'understanding, pivoting gracefully',
            timestamp: 24
          },
          {
            speaker: 'Sam',
            voiceId: VOICES.elli,
            text: "Yes! Oh my god, it was amazing. The opener was actually better than I expected...",
            emotion: 'relieved, energized',
            bodyLanguage: 'Voice lifts, becomes animated again',
            timestamp: 32
          }
        ],
        socialCues: [
          {
            id: 'cue_2_2_a',
            timestamp: 7,
            type: 'negative',
            category: 'tone',
            description: 'Sam\'s voice drops, pauses, uses filler words',
            significance: 'Change in vocal energy and hesitation signals discomfort with the topic'
          },
          {
            id: 'cue_2_2_b',
            timestamp: 18,
            type: 'negative',
            category: 'word_choice',
            description: 'Sam explicitly says "I don\'t really want to get into it"',
            significance: 'Direct boundary-setting should always be respected'
          },
          {
            id: 'cue_2_2_c',
            timestamp: 32,
            type: 'positive',
            category: 'tone',
            description: 'Sam\'s energy returns when topic changes',
            significance: 'Relief and re-engagement after a topic change confirms they wanted to move on'
          }
        ],
        questions: [
          {
            id: 'q_2_2_1',
            question: 'What was Sam\'s FIRST signal of discomfort?',
            options: [
              'Saying "I don\'t want to talk about it"',
              'Voice dropping, pausing, and filler words ("Oh... yeah. Um...")',
              'Walking away',
              'Getting angry'
            ],
            correctIndex: 1,
            explanation: 'Before Sam said anything explicit, their tone changed - voice dropped, they paused, and used filler words. These are early discomfort signals.',
            relatedCue: 'cue_2_2_a',
            points: 15
          },
          {
            id: 'q_2_2_2',
            question: 'Jamie initially missed the cue and pressed for details. What should Jamie have done instead?',
            options: [
              'Asked more specific questions',
              'Changed the subject after Sam\'s first hesitant response',
              'Waited in silence for Sam to continue',
              'Told Sam about their own breakup'
            ],
            correctIndex: 1,
            explanation: 'When Sam\'s tone dropped and they hesitated, that was the cue to back off or change subjects - not to dig deeper.',
            relatedCue: 'cue_2_2_a',
            points: 15
          },
          {
            id: 'q_2_2_3',
            question: 'How did Jamie handle the pivot well?',
            options: [
              'By apologizing extensively',
              'By saying "I get it" and offering a completely new topic',
              'By asking one more question about the breakup',
              'By leaving the conversation'
            ],
            correctIndex: 1,
            explanation: 'Jamie acknowledged Sam\'s boundary briefly ("I get it"), then offered a fresh topic. No awkward over-apologizing, just a smooth redirect.',
            relatedCue: 'cue_2_2_c',
            points: 15
          },
          {
            id: 'q_2_2_4',
            question: 'How do you know the topic change worked?',
            options: [
              'Sam said thank you',
              'Sam\'s voice lifted and they became animated again',
              'Sam stopped talking',
              'Jamie felt better'
            ],
            correctIndex: 1,
            explanation: 'Sam\'s energy returned immediately - voice lifted, became enthusiastic. This relief response confirms they wanted to move on from the previous topic.',
            relatedCue: 'cue_2_2_c',
            points: 10
          }
        ],
        tips: [
          'Voice dropping and filler words often signal discomfort before words do',
          'If someone\'s energy dips on a topic, don\'t dig deeper - pivot',
          'A good topic change is brief acknowledgment + completely new subject',
          'Watch for relief signals (energy returning) to confirm you read the situation right'
        ],
        xpReward: 90
      }
    ]
  }
];

// Helper function to get all audio scenarios
export const getAllAudioScenarios = (): AudioScenario[] => {
  return AUDIO_MODULES.flatMap(module => module.scenarios);
};

// Helper function to get scenario by ID
export const getAudioScenarioById = (id: string): AudioScenario | undefined => {
  return getAllAudioScenarios().find(scenario => scenario.id === id);
};

export default { AUDIO_MODULES, VOICES, getAllAudioScenarios, getAudioScenarioById };
