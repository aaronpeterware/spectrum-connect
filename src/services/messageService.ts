// Message Service - Supabase integration for chat messages
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
  attachment?: {
    type: 'image' | 'video' | 'gif';
    uri: string;
  };
  replyTo?: {
    id: string;
    text: string;
    sender: 'user' | 'other';
  };
}

export interface ChatMessage {
  id?: string;
  user_id: string;
  companion_id?: string;
  recipient_id?: string;
  message_text: string;
  sender_type: 'user' | 'companion' | 'other_user';
  attachment_url?: string;
  attachment_type?: string;
  reply_to_id?: string;
  created_at?: string;
}

// Get or create a device ID for anonymous users
const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      await AsyncStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  } catch {
    return 'device_' + Date.now().toString(36);
  }
};

// Get current user ID (from Supabase auth or device ID for anonymous)
export const getCurrentUserId = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return user.id;
    }
  } catch (error) {
    console.log('No authenticated user, using device ID');
  }
  return getDeviceId();
};

// Load messages for a companion chat
// Always prioritize local storage for immediate display (faster and more reliable)
export const loadCompanionMessages = async (companionId: string): Promise<Message[]> => {
  try {
    // Always load from local storage first (immediate, reliable)
    const localMessages = await loadLocalMessages(companionId);

    if (localMessages && localMessages.length > 0) {
      console.log('Loaded', localMessages.length, 'messages from local storage for', companionId);
      return localMessages;
    }

    // If no local messages, try Supabase as fallback
    try {
      const userId = await getCurrentUserId();

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .eq('companion_id', companionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.log('Supabase load error:', error.message);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Convert to Message format
      const supabaseMessages = data.map((msg: ChatMessage) => ({
        id: msg.id || '',
        text: msg.message_text,
        sender: msg.sender_type === 'user' ? 'user' : 'other',
        timestamp: new Date(msg.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachment: msg.attachment_url ? {
          type: (msg.attachment_type || 'image') as 'image' | 'video' | 'gif',
          uri: msg.attachment_url,
        } : undefined,
      })) as Message[];

      // Save Supabase messages to local storage for future loads
      if (supabaseMessages.length > 0) {
        await saveLocalMessages(companionId, supabaseMessages);
      }

      return supabaseMessages;
    } catch (supabaseError) {
      console.log('Supabase error, using local storage:', supabaseError);
      return [];
    }
  } catch (error) {
    console.log('Error loading messages:', error);
    return [];
  }
};

// Save a message to companion chat
export const saveCompanionMessage = async (
  companionId: string,
  message: Message
): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();

    const chatMessage: ChatMessage = {
      user_id: userId,
      companion_id: companionId,
      message_text: message.text,
      sender_type: message.sender === 'user' ? 'user' : 'companion',
      attachment_url: message.attachment?.uri,
      attachment_type: message.attachment?.type,
      reply_to_id: message.replyTo?.id,
    };

    const { error } = await supabase
      .from('messages')
      .insert(chatMessage);

    if (error) {
      console.log('Supabase save error:', error.message);
      // Fall back to local storage
      await saveLocalMessage(companionId, message);
      return false;
    }

    return true;
  } catch (error) {
    console.log('Error saving message:', error);
    await saveLocalMessage(companionId, message);
    return false;
  }
};

// Save all messages for a companion chat (bulk save)
export const saveAllCompanionMessages = async (
  companionId: string,
  messages: Message[]
): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();

    // Delete existing messages first
    await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId)
      .eq('companion_id', companionId);

    // Insert all messages
    const chatMessages: ChatMessage[] = messages.map(msg => ({
      user_id: userId,
      companion_id: companionId,
      message_text: msg.text,
      sender_type: msg.sender === 'user' ? 'user' : 'companion',
      attachment_url: msg.attachment?.uri,
      attachment_type: msg.attachment?.type,
      reply_to_id: msg.replyTo?.id,
    }));

    const { error } = await supabase
      .from('messages')
      .insert(chatMessages);

    if (error) {
      console.log('Supabase bulk save error:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.log('Error bulk saving messages:', error);
    return false;
  }
};

// Local storage functions (primary storage for reliability)
const MESSAGES_STORAGE_KEY = 'chat_messages_';

const loadLocalMessages = async (companionId: string): Promise<Message[]> => {
  try {
    const key = `${MESSAGES_STORAGE_KEY}${companionId}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.log('Error loading local messages for', companionId, ':', error);
  }
  return [];
};

const saveLocalMessage = async (companionId: string, message: Message): Promise<void> => {
  try {
    const messages = await loadLocalMessages(companionId);
    messages.push(message);
    const key = `${MESSAGES_STORAGE_KEY}${companionId}`;
    await AsyncStorage.setItem(key, JSON.stringify(messages));
    console.log('Saved message to local storage for', companionId, '- total:', messages.length);
  } catch (error) {
    console.log('Error saving local message:', error);
  }
};

export const saveLocalMessages = async (companionId: string, messages: Message[]): Promise<void> => {
  try {
    if (!companionId || !messages) {
      console.log('Invalid params for saveLocalMessages');
      return;
    }
    const key = `${MESSAGES_STORAGE_KEY}${companionId}`;
    await AsyncStorage.setItem(key, JSON.stringify(messages));
    console.log('Saved', messages.length, 'messages to local storage for', companionId);
  } catch (error) {
    console.log('Error saving local messages:', error);
  }
};

// Subscribe to real-time messages (for user-to-user chat)
export const subscribeToMessages = (
  conversationId: string,
  onMessage: (message: Message) => void
) => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const msg = payload.new as ChatMessage;
        onMessage({
          id: msg.id || '',
          text: msg.message_text,
          sender: msg.sender_type === 'user' ? 'user' : 'other',
          timestamp: new Date(msg.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export default {
  loadCompanionMessages,
  saveCompanionMessage,
  saveAllCompanionMessages,
  subscribeToMessages,
  getCurrentUserId,
};
