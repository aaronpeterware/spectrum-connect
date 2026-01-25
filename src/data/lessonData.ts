// Haven Classroom - Lesson Data
// Comprehensive learning modules with audio scenarios, quizzes, and practice exams

export interface QuizQuestion {
  id: string;
  question: string;
  audioContext?: string; // Description of what happened in the audio
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
}

export interface ConversationScenario {
  id: string;
  title: string;
  description: string;
  setting: string;
  participants: string[];
  audioUrl?: string; // ElevenLabs generated audio URL
  transcript: string;
  duration: string;
  keyMoments: {
    timestamp: string;
    description: string;
    skillDemonstrated: string;
  }[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  xpReward: number;
  skillCategory: string;
  content: {
    intro: string;
    keyPoints: string[];
    tips: string[];
    commonMistakes: string[];
  };
  scenarios: ConversationScenario[];
  quiz: QuizQuestion[];
  practicePrompts: string[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  weekRange: string;
  lessons: Lesson[];
  finalExam: QuizQuestion[];
}

export const MODULES: Module[] = [
  {
    id: 'module1',
    title: 'Conversation Fundamentals',
    description: 'Master the basics of starting and maintaining conversations',
    icon: 'chatbubbles',
    color: '#6366F1',
    weekRange: 'Week 1-2',
    lessons: [
      {
        id: 'lesson1_1',
        title: 'How to Start a Conversation',
        description: 'Learn simple, proven ways to begin talking to anyone',
        duration: '12 min',
        xpReward: 50,
        skillCategory: 'Conversation Starters',
        content: {
          intro: 'Starting conversations can feel intimidating, but it\'s actually a learnable skill. Today we\'ll learn simple, proven ways to begin talking to anyone.',
          keyPoints: [
            'Situational comments are the easiest conversation starters - comment on something you both can observe',
            'Direct introductions work well at social events - just say hi and introduce yourself',
            'Question-based openers invite engagement - ask about something you\'re genuinely curious about',
            'The 5-second rule: approach within 5 seconds to prevent anxiety buildup'
          ],
          tips: [
            'A simple "Hey, how\'s it going?" works 90% of the time',
            'Open-ended questions (what, how, why) invite longer responses',
            'Your friendly energy matters more than perfect words',
            'Practice in low-stakes situations like coffee shops or stores'
          ],
          commonMistakes: [
            'Overthinking your opener until the moment passes',
            'Asking too many yes/no questions',
            'Not making eye contact when approaching',
            'Speaking too quietly or too fast due to nerves'
          ]
        },
        scenarios: [
          {
            id: 'scenario1_1_1',
            title: 'Coffee Shop Opener',
            description: 'Watch how Alex uses a situational comment to start a conversation',
            setting: 'A busy coffee shop on Saturday morning',
            participants: ['Alex', 'Jordan'],
            transcript: `Alex notices Jordan reading a book at the next table.

Alex: "Hey, is that the new Stephen King? I've been meaning to pick that up."

Jordan: (looks up, smiles) "Yeah! I just started it yesterday. Are you a fan of his stuff?"

Alex: "I love his older books. The Stand is probably my favorite. Have you read that one?"

Jordan: "That's actually next on my list! I'm Jordan, by the way."

Alex: "Nice to meet you, I'm Alex. Mind if I sit? I'd love to hear what you think of it so far."

Jordan: "Sure, go ahead! So far it's really creepy..."`,
            duration: '45 sec',
            keyMoments: [
              { timestamp: '0:05', description: 'Alex uses a situational comment about the book', skillDemonstrated: 'Situational Opener' },
              { timestamp: '0:15', description: 'Alex asks an open-ended follow-up question', skillDemonstrated: 'Keeping Conversation Going' },
              { timestamp: '0:25', description: 'Alex shares something personal to build connection', skillDemonstrated: 'Self-Disclosure' },
              { timestamp: '0:35', description: 'Alex asks to continue the conversation', skillDemonstrated: 'Advancing the Interaction' }
            ]
          },
          {
            id: 'scenario1_1_2',
            title: 'Networking Event Introduction',
            description: 'See how to introduce yourself at a professional event',
            setting: 'Company networking mixer',
            participants: ['Sam', 'Taylor'],
            transcript: `Sam approaches Taylor who is standing alone near the refreshments.

Sam: "Hi there! I don't think we've met - I'm Sam from the marketing team."

Taylor: "Hey Sam, I'm Taylor. I just started in engineering last month."

Sam: "Oh welcome! How are you finding it so far? The onboarding here can be a lot."

Taylor: "Yeah, it's been intense but everyone's been really helpful. What do you work on in marketing?"

Sam: "Mostly social media campaigns. Hey, if you ever need someone to show you around or grab lunch, I'm usually free on Tuesdays."

Taylor: "That would be great actually! I'm still figuring out where everything is."`,
            duration: '40 sec',
            keyMoments: [
              { timestamp: '0:03', description: 'Sam uses a direct introduction', skillDemonstrated: 'Direct Opener' },
              { timestamp: '0:12', description: 'Sam asks about their experience', skillDemonstrated: 'Showing Interest' },
              { timestamp: '0:28', description: 'Sam offers to help/connect further', skillDemonstrated: 'Building Connection' }
            ]
          }
        ],
        quiz: [
          {
            id: 'q1_1_1',
            question: 'In the coffee shop scenario, what type of opener did Alex use?',
            audioContext: 'Alex noticed Jordan reading a book and commented on it',
            options: ['A direct introduction', 'A situational comment', 'A compliment', 'A random question'],
            correctIndex: 1,
            explanation: 'Alex used a situational comment by mentioning the book Jordan was reading - something they could both observe in their shared environment.',
            points: 10
          },
          {
            id: 'q1_1_2',
            question: 'What made Alex\'s follow-up question effective?',
            options: ['It was a yes/no question', 'It was an open-ended question that invited a longer response', 'It changed the topic', 'It was about themselves'],
            correctIndex: 1,
            explanation: 'Alex asked "Are you a fan of his stuff?" which is open-ended and invites Jordan to share more, keeping the conversation flowing.',
            points: 10
          },
          {
            id: 'q1_1_3',
            question: 'In the networking scenario, what did Sam do well after introducing themselves?',
            options: ['Immediately talked about work projects', 'Asked Taylor a personal question', 'Showed interest in Taylor\'s experience and offered help', 'Waited for Taylor to lead the conversation'],
            correctIndex: 2,
            explanation: 'Sam asked how Taylor was finding the new job and offered to help them settle in - showing genuine interest and building connection.',
            points: 10
          },
          {
            id: 'q1_1_4',
            question: 'What is the 5-second rule?',
            options: ['Wait 5 seconds before responding', 'Approach within 5 seconds to prevent anxiety', 'Talk for only 5 seconds at a time', 'Make eye contact for 5 seconds first'],
            correctIndex: 1,
            explanation: 'The 5-second rule means approaching someone you want to talk to within 5 seconds. Waiting longer allows anxiety to build up.',
            points: 10
          }
        ],
        practicePrompts: [
          'You\'re at a bookstore and notice someone looking at books in a section you love. What do you say?',
          'You\'re waiting in line at a food truck. The person next to you looks friendly. Start a conversation.',
          'You\'re at a friend\'s birthday party and don\'t know anyone else. Introduce yourself to someone.'
        ]
      },
      {
        id: 'lesson1_2',
        title: 'The Art of Small Talk',
        description: 'Make casual conversation feel natural and meaningful',
        duration: '15 min',
        xpReward: 60,
        skillCategory: 'Casual Conversation',
        content: {
          intro: 'Small talk isn\'t meaningless - it\'s social bonding. It establishes trust and comfort before moving to deeper topics.',
          keyPoints: [
            'FORD Method: Family, Occupation, Recreation, Dreams - reliable topic categories',
            'Ping-Pong Principle: Good conversation flows back and forth',
            'Answer + Add: Don\'t give one-word answers, add a detail',
            'Active listening shows through follow-up questions'
          ],
          tips: [
            'Match the other person\'s energy level',
            'It\'s okay to have comfortable silences',
            'Find common ground to build on',
            'Ask "What" and "How" questions to keep things going'
          ],
          commonMistakes: [
            'Giving only one-word answers',
            'Not asking questions back',
            'Interrogating rather than conversing',
            'Talking only about yourself'
          ]
        },
        scenarios: [
          {
            id: 'scenario1_2_1',
            title: 'Party Small Talk',
            description: 'Watch the FORD method in action at a casual party',
            setting: 'House party, kitchen area',
            participants: ['Casey', 'Morgan'],
            transcript: `Casey is getting a drink when Morgan walks up.

Morgan: "Hey! I don't think I know you - are you a friend of Jake's?"

Casey: "Yeah, we work together. I'm Casey. How do you know him?"

Morgan: "We went to college together - roommates actually. What do you do at the company?"

Casey: "I'm in product design. It's pretty cool - I get to sketch ideas all day basically. What about you?"

Morgan: "I'm a nurse at City General. Long hours but I love it. Hey, have you tried this dip? It's amazing."

Casey: "Oh no, let me try it. Wow that is good. So did you always want to be a nurse or...?"

Morgan: "Actually I started out wanting to be a vet! But I realized I'm better with people than animals, ironically."

Casey: (laughs) "That's funny. I can see that though - you seem really easy to talk to."`,
            duration: '55 sec',
            keyMoments: [
              { timestamp: '0:08', description: 'Casey asks how Morgan knows the host (finding connection)', skillDemonstrated: 'Finding Common Ground' },
              { timestamp: '0:18', description: 'Both share about their occupations (FORD - O)', skillDemonstrated: 'FORD Method' },
              { timestamp: '0:32', description: 'Morgan transitions with a situational comment about food', skillDemonstrated: 'Natural Transitions' },
              { timestamp: '0:42', description: 'Casey asks about Morgan\'s dreams/past (FORD - D)', skillDemonstrated: 'Deeper Questions' }
            ]
          }
        ],
        quiz: [
          {
            id: 'q1_2_1',
            question: 'What does FORD stand for?',
            options: ['Friends, Opinions, Relationships, Dating', 'Family, Occupation, Recreation, Dreams', 'Fun, Openness, Respect, Dialogue', 'Facts, Options, Reasons, Details'],
            correctIndex: 1,
            explanation: 'FORD stands for Family, Occupation, Recreation, and Dreams - four reliable topic categories for small talk.',
            points: 10
          },
          {
            id: 'q1_2_2',
            question: 'In the party scenario, how did Morgan smoothly change topics?',
            options: ['By asking a personal question', 'By using a situational comment about the food', 'By talking about themselves more', 'By leaving the conversation'],
            correctIndex: 1,
            explanation: 'Morgan made a natural transition by commenting on the dip - using the shared environment to shift topics smoothly.',
            points: 10
          },
          {
            id: 'q1_2_3',
            question: 'What is the "Answer + Add" technique?',
            options: ['Adding emojis to texts', 'Answering a question and adding a related detail', 'Adding the person on social media', 'Agreeing with everything they say'],
            correctIndex: 1,
            explanation: 'Answer + Add means not giving one-word answers - instead, answer the question AND add something extra to keep conversation flowing.',
            points: 10
          }
        ],
        practicePrompts: [
          'Someone asks "What do you do for work?" Practice using Answer + Add.',
          'You\'ve been talking about work for a while. Use the FORD method to transition to a different topic.',
          'Practice the ping-pong principle: after someone shares something, ask a follow-up AND share something related.'
        ]
      }
    ],
    finalExam: [
      {
        id: 'exam1_1',
        question: 'You\'re at a coffee shop and want to talk to someone reading nearby. Which approach is best?',
        options: [
          'Stare at them until they notice you',
          'Comment on their book or what they\'re drinking',
          'Immediately sit down at their table',
          'Wait for them to talk to you first'
        ],
        correctIndex: 1,
        explanation: 'A situational comment about something you can both observe (like their book) is the most natural conversation starter.',
        points: 15
      },
      {
        id: 'exam1_2',
        question: 'Someone asks you "Where are you from?" What\'s the best response using Answer + Add?',
        options: [
          '"California."',
          '"California - I grew up near San Diego but moved here for college. Have you ever been to the West Coast?"',
          '"Why do you want to know?"',
          '"I don\'t really like talking about where I\'m from."'
        ],
        correctIndex: 1,
        explanation: 'The second option answers the question, adds personal context, and returns the conversation with a question - perfect Answer + Add.',
        points: 15
      },
      {
        id: 'exam1_3',
        question: 'During small talk, you notice the conversation becoming one-sided with you asking all the questions. What should you do?',
        options: [
          'Keep asking questions - they\'ll eventually ask back',
          'Stop talking and wait',
          'Share something about yourself, then ask a related question',
          'Complain that they\'re not asking you anything'
        ],
        correctIndex: 2,
        explanation: 'Sharing something about yourself models the behavior you want and gives them something to respond to, rebalancing the conversation.',
        points: 15
      }
    ]
  },
  {
    id: 'module2',
    title: 'Reading Social Cues',
    description: 'Learn to understand body language and unspoken signals',
    icon: 'eye',
    color: '#8B5CF6',
    weekRange: 'Week 3-4',
    lessons: [
      {
        id: 'lesson2_1',
        title: 'Body Language Basics',
        description: 'Decode what people communicate without words',
        duration: '18 min',
        xpReward: 70,
        skillCategory: 'Non-Verbal Communication',
        content: {
          intro: 'Over 70% of communication is non-verbal. Learning to read body language helps you understand what people really mean.',
          keyPoints: [
            'Open body language (uncrossed arms, facing you, leaning in) = interested and comfortable',
            'Closed body language (crossed arms, turned away, leaning back) = uncomfortable or disinterested',
            'Eye contact patterns: brief = nervous, steady = interested, avoiding = uncomfortable',
            'Mirroring (copying your posture) = rapport and connection'
          ],
          tips: [
            'Look for clusters of signals, not just one gesture',
            'Context matters - crossed arms might just mean they\'re cold',
            'Notice changes in body language as conversation progresses',
            'Practice observing people in public to improve your skills'
          ],
          commonMistakes: [
            'Over-analyzing single gestures',
            'Staring intensely while trying to read body language',
            'Ignoring your own body language',
            'Assuming body language is universal across cultures'
          ]
        },
        scenarios: [
          {
            id: 'scenario2_1_1',
            title: 'Coffee Date Body Language',
            description: 'Notice the non-verbal cues in this first date scenario',
            setting: 'Coffee shop first date',
            participants: ['Riley', 'Avery'],
            transcript: `Riley and Avery are on a coffee date. Pay attention to the body language described.

Riley: "So what do you like to do on weekends?" (leaning forward, making eye contact)

Avery: (uncrosses arms, smiles, leans in) "I love hiking! There's this great trail near my place. Do you like being outdoors?"

Riley: "I do! I've been wanting to explore more trails around here." (mirrors Avery's posture)

Avery: (touches hair, maintains eye contact) "Maybe we could go together sometime? I know all the best spots."

Riley: (notices the positive signals, smiles warmly) "I'd really like that. How about this Saturday?"

Avery: (full body turn toward Riley, genuine smile) "Saturday works perfectly!"`,
            duration: '50 sec',
            keyMoments: [
              { timestamp: '0:08', description: 'Riley shows interest by leaning forward', skillDemonstrated: 'Open Body Language' },
              { timestamp: '0:15', description: 'Avery uncrosses arms - becoming more comfortable', skillDemonstrated: 'Reading Opening Up' },
              { timestamp: '0:25', description: 'Riley mirrors Avery\'s posture - building rapport', skillDemonstrated: 'Mirroring' },
              { timestamp: '0:35', description: 'Avery\'s hair touch and eye contact shows attraction', skillDemonstrated: 'Interest Signals' }
            ]
          },
          {
            id: 'scenario2_1_2',
            title: 'Signs of Discomfort',
            description: 'Learn to recognize when someone wants to exit a conversation',
            setting: 'Office break room',
            participants: ['Drew', 'Quinn'],
            transcript: `Drew approaches Quinn in the break room.

Drew: "Hey Quinn! So I was thinking more about that project idea I mentioned..."

Quinn: (glances at phone, shifts weight) "Oh, uh, yeah..."

Drew: "I really think we could revolutionize the whole system if we just—"

Quinn: (takes a step back, angles body toward door) "That sounds interesting, but I actually need to—"

Drew: (doesn't notice) "And the best part is we could start immediately!"

Quinn: (crosses arms, minimal eye contact) "Yeah, um, I really have to get back. Maybe email me?"

Drew finally notices Quinn's closed body language and phone checking.

Drew: "Oh! Sorry, I got carried away. Yeah, I'll send you the details. Talk later!"

Quinn: (relaxes slightly) "Sure, sounds good. Thanks Drew."`,
            duration: '55 sec',
            keyMoments: [
              { timestamp: '0:10', description: 'Quinn checks phone and shifts - early exit signals', skillDemonstrated: 'Noticing Discomfort' },
              { timestamp: '0:22', description: 'Quinn steps back and angles toward door', skillDemonstrated: 'Physical Distancing' },
              { timestamp: '0:35', description: 'Crossed arms and avoiding eye contact - wanting to leave', skillDemonstrated: 'Closed Body Language' },
              { timestamp: '0:45', description: 'Drew finally notices and gracefully ends conversation', skillDemonstrated: 'Responding to Cues' }
            ]
          }
        ],
        quiz: [
          {
            id: 'q2_1_1',
            question: 'In the coffee date scenario, what did Avery\'s uncrossing arms indicate?',
            options: ['They were hot', 'They were becoming more comfortable and open', 'They were bored', 'Nothing in particular'],
            correctIndex: 1,
            explanation: 'Uncrossing arms is a sign of opening up and becoming more comfortable with someone.',
            points: 10
          },
          {
            id: 'q2_1_2',
            question: 'What were Quinn\'s first signals that they wanted to exit the conversation?',
            options: ['Yelling at Drew', 'Checking their phone and shifting weight', 'Walking away immediately', 'Asking Drew to stop'],
            correctIndex: 1,
            explanation: 'Checking the phone and shifting weight are subtle early signals that someone is uncomfortable or wants to leave.',
            points: 10
          },
          {
            id: 'q2_1_3',
            question: 'What is "mirroring" in body language?',
            options: ['Looking in a mirror', 'Copying someone\'s posture to build rapport', 'Saying exactly what they say', 'Making fun of someone'],
            correctIndex: 1,
            explanation: 'Mirroring means subtly copying someone\'s body language, which happens naturally when people feel connected and builds rapport.',
            points: 10
          },
          {
            id: 'q2_1_4',
            question: 'Why should you look for "clusters" of body language signals?',
            options: ['Single gestures can be misleading - context and multiple signals are more reliable', 'To confuse the other person', 'Because one signal is never meaningful', 'To appear smart'],
            correctIndex: 0,
            explanation: 'A single gesture (like crossed arms) could mean many things. Looking for multiple signals together gives a more accurate read.',
            points: 10
          }
        ],
        practicePrompts: [
          'Next time you\'re in a public place, observe two people talking. What body language signals do you notice?',
          'During your next conversation, try mirroring the other person\'s posture subtly. Notice if it changes the dynamic.',
          'Practice recognizing when someone wants to exit a conversation and gracefully ending it.'
        ]
      }
    ],
    finalExam: [
      {
        id: 'exam2_1',
        question: 'During a conversation, the person you\'re talking to keeps checking their watch and glancing toward the door. What should you do?',
        options: [
          'Ignore it and keep talking about your topic',
          'Ask if they need to go somewhere and offer to continue later',
          'Talk faster to fit everything in',
          'Ask why they keep looking at their watch'
        ],
        correctIndex: 1,
        explanation: 'These are clear signals they need to leave. Gracefully offering to continue later shows social awareness and respect for their time.',
        points: 15
      },
      {
        id: 'exam2_2',
        question: 'On a date, your date leans in, maintains eye contact, and mirrors your gestures. What do these signals typically indicate?',
        options: [
          'They\'re uncomfortable',
          'They\'re bored',
          'They\'re interested and engaged',
          'They\'re being polite but want to leave'
        ],
        correctIndex: 2,
        explanation: 'Leaning in, eye contact, and mirroring are all positive signs of interest, engagement, and rapport.',
        points: 15
      }
    ]
  },
  {
    id: 'module3',
    title: 'Dating Fundamentals',
    description: 'Navigate the dating world with confidence',
    icon: 'heart',
    color: '#EC4899',
    weekRange: 'Week 5-6',
    lessons: [
      {
        id: 'lesson3_1',
        title: 'Asking Someone Out',
        description: 'Learn confident approaches to asking for a date',
        duration: '14 min',
        xpReward: 65,
        skillCategory: 'Dating Skills',
        content: {
          intro: 'Asking someone out feels scary, but with the right approach, it becomes much easier. The key is being clear, confident, and respectful.',
          keyPoints: [
            'Be direct and clear - "I\'d like to take you out" is better than vague hints',
            'Suggest a specific activity and time - "Want to grab coffee Saturday afternoon?"',
            'Make it easy to say yes by suggesting something low-pressure',
            'Accept any answer gracefully - no pressure or repeated asking'
          ],
          tips: [
            'Build some rapport first before asking',
            'Choose a comfortable moment, not when they\'re rushed',
            'Have a specific idea ready (coffee, walk, specific activity)',
            'Rejection isn\'t personal - they might just be unavailable or not ready'
          ],
          commonMistakes: [
            'Being too vague: "We should hang out sometime"',
            'Asking repeatedly after getting a no',
            'Choosing high-pressure first dates (fancy dinner, meeting friends)',
            'Waiting too long and missing the moment'
          ]
        },
        scenarios: [
          {
            id: 'scenario3_1_1',
            title: 'Asking a Coworker Out',
            description: 'Watch a confident, appropriate approach',
            setting: 'Office, end of workday',
            participants: ['Jamie', 'Alex'],
            transcript: `Jamie and Alex have been chatting casually for a few weeks at work.

Jamie: "Hey Alex, got a second?"

Alex: "Sure, what's up?"

Jamie: "I've really enjoyed our lunch conversations lately. I was wondering - would you want to grab coffee this weekend? There's this great place downtown I've been wanting to try."

Alex: (smiles) "Oh! That sounds nice. Saturday afternoon?"

Jamie: "Saturday works perfectly. How about 2pm? I can text you the address."

Alex: "That's great. I'm looking forward to it."

Jamie: "Me too. Have a good evening, Alex."`,
            duration: '40 sec',
            keyMoments: [
              { timestamp: '0:08', description: 'Jamie asks if Alex has a moment - good timing', skillDemonstrated: 'Appropriate Timing' },
              { timestamp: '0:15', description: 'Jamie references their existing connection first', skillDemonstrated: 'Building on Rapport' },
              { timestamp: '0:22', description: 'Clear, direct ask with specific suggestion', skillDemonstrated: 'Direct Communication' },
              { timestamp: '0:32', description: 'Confirms details and ends positively', skillDemonstrated: 'Follow Through' }
            ]
          },
          {
            id: 'scenario3_1_2',
            title: 'Handling a "No" Gracefully',
            description: 'See how to respond respectfully to rejection',
            setting: 'After a class or activity',
            participants: ['Jordan', 'Taylor'],
            transcript: `Jordan and Taylor have been in the same yoga class for a few months.

Jordan: "Hey Taylor, I've really enjoyed getting to know you these past few weeks. Would you want to grab dinner sometime?"

Taylor: "Oh, that's really sweet of you to ask. I'm actually seeing someone right now, but I appreciate you asking."

Jordan: (genuinely) "No worries at all! I totally understand. I'm glad we can still be yoga buddies though."

Taylor: (relieved) "Definitely! You're a great person. And hey, I have a friend who I think you'd really get along with, if you're interested?"

Jordan: "You know what, I'd be open to that. Thanks Taylor."

Taylor: "See you next week!"`,
            duration: '45 sec',
            keyMoments: [
              { timestamp: '0:10', description: 'Jordan asks clearly and directly', skillDemonstrated: 'Direct Communication' },
              { timestamp: '0:18', description: 'Taylor declines kindly with a reason', skillDemonstrated: 'Graceful Decline' },
              { timestamp: '0:25', description: 'Jordan accepts gracefully without pressure', skillDemonstrated: 'Accepting Rejection' },
              { timestamp: '0:35', description: 'The interaction ends positively', skillDemonstrated: 'Maintaining Connection' }
            ]
          }
        ],
        quiz: [
          {
            id: 'q3_1_1',
            question: 'What made Jamie\'s approach effective when asking Alex out?',
            options: [
              'Being vague to seem casual',
              'Referencing their connection and suggesting a specific plan',
              'Asking multiple times',
              'Making it a fancy dinner invitation'
            ],
            correctIndex: 1,
            explanation: 'Jamie referenced their existing rapport and suggested a specific, low-pressure activity (coffee) with a time.',
            points: 10
          },
          {
            id: 'q3_1_2',
            question: 'How did Jordan handle Taylor\'s rejection well?',
            options: [
              'Kept asking until Taylor said yes',
              'Acted hurt and walked away',
              'Accepted it gracefully and maintained the friendship',
              'Demanded to know why'
            ],
            correctIndex: 2,
            explanation: 'Jordan accepted the no without pressure, acknowledged they could still be friends, and kept the interaction positive.',
            points: 10
          },
          {
            id: 'q3_1_3',
            question: 'What\'s the problem with asking "We should hang out sometime"?',
            options: [
              'It\'s too formal',
              'It\'s vague - no specific plan means it often never happens',
              'It\'s too direct',
              'It\'s not friendly enough'
            ],
            correctIndex: 1,
            explanation: 'Vague suggestions rarely lead to actual plans. Being specific ("Coffee Saturday?") makes it easy to say yes.',
            points: 10
          }
        ],
        practicePrompts: [
          'Practice asking someone out with a specific activity and time. Say it out loud.',
          'Imagine you got rejected. Practice responding gracefully: "No worries, I understand. I enjoy our friendship."',
          'Think of someone you\'d like to ask out. What low-pressure activity would you suggest?'
        ]
      }
    ],
    finalExam: [
      {
        id: 'exam3_1',
        question: 'You want to ask out someone you\'ve been chatting with at the gym. Which approach is best?',
        options: [
          '"Hey, we should work out together sometime or something."',
          '"I\'ve enjoyed getting to know you. Would you want to grab a smoothie after our workout Saturday?"',
          'Leave a note in their locker with your number',
          'Ask their friends to tell them you like them'
        ],
        correctIndex: 1,
        explanation: 'Option B is direct, references your connection, suggests a specific low-pressure activity, and includes a time.',
        points: 15
      },
      {
        id: 'exam3_2',
        question: 'You asked someone out and they said they\'re busy that day. What should you do?',
        options: [
          'Ask again immediately with a different day',
          'Say "Okay, let me know if you\'re ever free" and let them reach out if interested',
          'Ask why they\'re busy',
          'Assume they hate you and never talk to them again'
        ],
        correctIndex: 1,
        explanation: 'Giving them space to reach out if interested respects their answer while leaving the door open.',
        points: 15
      }
    ]
  },
  {
    id: 'module4',
    title: 'First Date Success',
    description: 'Make great first impressions and enjoy your dates',
    icon: 'cafe',
    color: '#F59E0B',
    weekRange: 'Week 7-8',
    lessons: [
      {
        id: 'lesson4_1',
        title: 'First Date Conversations',
        description: 'What to talk about and what to avoid',
        duration: '16 min',
        xpReward: 70,
        skillCategory: 'Dating Skills',
        content: {
          intro: 'First dates are about discovering if you enjoy each other\'s company. Good conversation makes all the difference.',
          keyPoints: [
            'Be curious about them - ask questions and really listen',
            'Share about yourself too - connection goes both ways',
            'Keep it light and fun early on - save heavy topics for later',
            'Look for shared interests and values'
          ],
          tips: [
            'Have a few conversation starters ready but let things flow naturally',
            'Avoid interviewing them - make it feel like a conversation, not an interrogation',
            'If there\'s a pause, that\'s okay - comfortable silence beats nervous rambling',
            'End on a high note - leave them wanting more'
          ],
          commonMistakes: [
            'Talking about exes or past dating disasters',
            'Complaining about work, life, or people',
            'Looking at your phone during the date',
            'Talking only about yourself or only asking questions'
          ]
        },
        scenarios: [
          {
            id: 'scenario4_1_1',
            title: 'Coffee Date Flow',
            description: 'See natural conversation flow on a first date',
            setting: 'Coffee shop, mid-afternoon',
            participants: ['Riley', 'Sam'],
            transcript: `Riley and Sam are on their first coffee date.

Sam: "So have you always lived in the city?"

Riley: "Actually I grew up in a small town - moved here about five years ago. It was a big change! What about you?"

Sam: "Born and raised here. I sometimes think about trying somewhere smaller though. What made you move?"

Riley: "I got a job opportunity, but honestly I was also ready for an adventure. Do you travel much?"

Sam: "When I can! I went to Japan last year - it was incredible. Have you been?"

Riley: "It's on my list! What was your favorite part?"

Sam: (eyes lighting up) "The food! I literally planned each day around what I was going to eat."

Riley: (laughs) "I respect that. I'm the same way when I travel. Food is the best way to experience a culture."

Sam: "Exactly! Okay, you get it. What's the best thing you've eaten while traveling?"`,
            duration: '60 sec',
            keyMoments: [
              { timestamp: '0:10', description: 'Riley shares and asks the question back', skillDemonstrated: 'Reciprocal Sharing' },
              { timestamp: '0:22', description: 'Sam shows genuine curiosity', skillDemonstrated: 'Active Interest' },
              { timestamp: '0:35', description: 'Finding common ground around travel and food', skillDemonstrated: 'Discovering Shared Interests' },
              { timestamp: '0:50', description: 'Building excitement through shared enthusiasm', skillDemonstrated: 'Creating Connection' }
            ]
          }
        ],
        quiz: [
          {
            id: 'q4_1_1',
            question: 'What made Riley and Sam\'s conversation flow well?',
            options: [
              'They only asked yes/no questions',
              'They shared about themselves and asked questions back',
              'They talked about their exes',
              'One person did all the talking'
            ],
            correctIndex: 1,
            explanation: 'Both Riley and Sam shared personal details AND asked follow-up questions, creating a balanced, flowing conversation.',
            points: 10
          },
          {
            id: 'q4_1_2',
            question: 'How did they discover they had something in common?',
            options: [
              'They asked directly "what do we have in common?"',
              'Naturally through the conversation about travel and food',
              'They already knew each other',
              'They made it up'
            ],
            correctIndex: 1,
            explanation: 'Shared interests emerged naturally as they explored topics - this is how genuine connection forms.',
            points: 10
          }
        ],
        practicePrompts: [
          'Practice the "share + ask" pattern: Share something about yourself, then ask a related question.',
          'List 5 topics you\'re genuinely curious about that would make good first date conversation.',
          'Think of a time a conversation flowed really well. What made it work?'
        ]
      }
    ],
    finalExam: [
      {
        id: 'exam4_1',
        question: 'Your first date has been going well but there\'s a natural pause in conversation. What should you do?',
        options: [
          'Panic and start talking about anything',
          'Check your phone to fill the silence',
          'Relax, smile, and let the moment be comfortable - or bring up something you\'re curious about',
          'End the date immediately'
        ],
        correctIndex: 2,
        explanation: 'Comfortable silences are normal and okay. You can enjoy the moment or naturally introduce a new topic.',
        points: 15
      }
    ]
  }
];

// Practice Exams - Comprehensive assessments
export const PRACTICE_EXAMS = [
  {
    id: 'exam_conversation',
    title: 'Conversation Skills Assessment',
    description: 'Test your knowledge of starting and maintaining conversations',
    duration: '15 min',
    passingScore: 70,
    totalQuestions: 15,
    questions: [
      ...MODULES[0].lessons.flatMap(l => l.quiz),
      ...MODULES[0].finalExam
    ]
  },
  {
    id: 'exam_social_cues',
    title: 'Reading Social Cues Assessment',
    description: 'Test your ability to understand non-verbal communication',
    duration: '15 min',
    passingScore: 70,
    totalQuestions: 12,
    questions: [
      ...MODULES[1].lessons.flatMap(l => l.quiz),
      ...MODULES[1].finalExam
    ]
  },
  {
    id: 'exam_dating',
    title: 'Dating Skills Assessment',
    description: 'Test your knowledge of dating fundamentals',
    duration: '20 min',
    passingScore: 70,
    totalQuestions: 15,
    questions: [
      ...MODULES[2].lessons.flatMap(l => l.quiz),
      ...MODULES[2].finalExam,
      ...MODULES[3].lessons.flatMap(l => l.quiz),
      ...MODULES[3].finalExam
    ]
  },
  {
    id: 'exam_comprehensive',
    title: 'Comprehensive Final Exam',
    description: 'Complete assessment covering all modules',
    duration: '30 min',
    passingScore: 75,
    totalQuestions: 25,
    questions: MODULES.flatMap(m => [...m.finalExam, ...m.lessons.flatMap(l => l.quiz.slice(0, 2))])
  }
];

export default { MODULES, PRACTICE_EXAMS };
