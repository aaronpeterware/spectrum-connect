// ElevenLabs Voice Service for Haven
// Utility functions for conversation processing

// Types for ElevenLabs conversation
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type ConversationStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'processing'
  | 'disconnected'
  | 'error';

// Generate a conversation summary using the messages
export const generateConversationSummary = (messages: ConversationMessage[]): {
  summary: string;
  keyTopics: string[];
  mood: string;
} => {
  if (messages.length === 0) {
    return {
      summary: 'Brief conversation with no substantial exchange.',
      keyTopics: [],
      mood: 'neutral',
    };
  }

  // Extract user messages for analysis
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content);

  // Simple keyword extraction for topics
  const allText = [...userMessages, ...assistantMessages].join(' ').toLowerCase();
  const topicKeywords = [
    'work', 'job', 'career', 'family', 'friends', 'relationship', 'health',
    'hobby', 'music', 'movies', 'books', 'travel', 'food', 'sports',
    'anxiety', 'stress', 'happy', 'sad', 'excited', 'worried', 'love',
    'weekend', 'plans', 'goals', 'dreams', 'memories',
  ];

  const keyTopics = topicKeywords.filter(topic =>
    allText.includes(topic)
  ).slice(0, 5);

  // Simple mood detection
  const positiveWords = ['happy', 'excited', 'great', 'good', 'love', 'amazing', 'wonderful'];
  const negativeWords = ['sad', 'stressed', 'worried', 'anxious', 'bad', 'terrible', 'hard'];

  const positiveCount = positiveWords.filter(w => allText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => allText.includes(w)).length;

  let mood = 'neutral';
  if (positiveCount > negativeCount) mood = 'positive';
  if (negativeCount > positiveCount) mood = 'concerned';
  if (positiveCount > 3) mood = 'very positive';
  if (negativeCount > 3) mood = 'needs support';

  // Generate simple summary
  const userTurns = userMessages.length;
  const summaryPrefix = userTurns > 5 ? 'Had a lengthy conversation' :
    userTurns > 2 ? 'Had a good conversation' : 'Had a brief exchange';

  const topicSummary = keyTopics.length > 0 ?
    ` discussing ${keyTopics.slice(0, 3).join(', ')}` : '';

  const moodSummary = mood !== 'neutral' ?
    `. User seemed ${mood.replace('very ', '').replace('needs support', 'to need support')}` : '';

  return {
    summary: `${summaryPrefix}${topicSummary}${moodSummary}.`,
    keyTopics,
    mood,
  };
};

// Extract facts from conversation (simple heuristics)
export const extractFactsFromConversation = (messages: ConversationMessage[]): {
  fact: string;
  importance: 'low' | 'medium' | 'high';
  category: 'personal' | 'preference' | 'experience' | 'emotion' | 'relationship';
}[] => {
  const facts: {
    fact: string;
    importance: 'low' | 'medium' | 'high';
    category: 'personal' | 'preference' | 'experience' | 'emotion' | 'relationship';
  }[] = [];

  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);

  for (const message of userMessages) {
    const lowerMessage = message.toLowerCase();

    // Name detection
    const nameMatch = message.match(/(?:my name is|i'm|call me) (\w+)/i);
    if (nameMatch) {
      facts.push({
        fact: `User's name is ${nameMatch[1]}`,
        importance: 'high',
        category: 'personal',
      });
    }

    // Job/work detection
    const jobMatch = message.match(/(?:i work as|i'm a|my job is|i do) ([^.,]+)/i);
    if (jobMatch && !jobMatch[1].includes('?')) {
      facts.push({
        fact: `User works as ${jobMatch[1].trim()}`,
        importance: 'medium',
        category: 'personal',
      });
    }

    // Location detection
    const locationMatch = message.match(/(?:i live in|i'm from|i'm in) ([^.,]+)/i);
    if (locationMatch) {
      facts.push({
        fact: `User is from/lives in ${locationMatch[1].trim()}`,
        importance: 'medium',
        category: 'personal',
      });
    }

    // Hobby/interest detection
    const hobbyMatch = message.match(/(?:i love|i enjoy|i like|my hobby is) ([^.,]+)/i);
    if (hobbyMatch && !hobbyMatch[1].includes('?')) {
      facts.push({
        fact: `User enjoys ${hobbyMatch[1].trim()}`,
        importance: 'low',
        category: 'preference',
      });
    }

    // Pet detection
    const petMatch = message.match(/(?:i have a|my) (dog|cat|pet|bird|fish)(?:'s name is| named| called) (\w+)/i);
    if (petMatch) {
      facts.push({
        fact: `User has a ${petMatch[1]} named ${petMatch[2]}`,
        importance: 'medium',
        category: 'personal',
      });
    }

    // Relationship detection
    if (lowerMessage.includes('married') || lowerMessage.includes('partner') ||
        lowerMessage.includes('boyfriend') || lowerMessage.includes('girlfriend')) {
      facts.push({
        fact: 'User mentioned a romantic relationship',
        importance: 'medium',
        category: 'relationship',
      });
    }

    // Emotional state detection
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
      facts.push({
        fact: 'User experiences anxiety',
        importance: 'high',
        category: 'emotion',
      });
    }

    if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed')) {
      facts.push({
        fact: 'User mentioned feeling stressed or overwhelmed',
        importance: 'medium',
        category: 'emotion',
      });
    }
  }

  // Remove duplicates based on fact text
  const uniqueFacts = facts.filter((fact, index, self) =>
    index === self.findIndex(f => f.fact.toLowerCase() === fact.fact.toLowerCase())
  );

  return uniqueFacts.slice(0, 10); // Limit to 10 facts per conversation
};

export default {
  generateConversationSummary,
  extractFactsFromConversation,
};
