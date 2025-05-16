import axios from 'axios';

// Define types for the Gemini API
interface GeminiRequestContent {
  parts: {
    text: string;
  }[];
}

interface GeminiRequest {
  contents: GeminiRequestContent[];
}

interface GeminiPart {
  text: string;
}

interface GeminiResponseContent {
  parts: GeminiPart[];
  role: string;
}

interface GeminiResponse {
  candidates: {
    content: GeminiResponseContent;
  }[];
}

// Available music and effect codes for our application
const AVAILABLE_MUSIC = [
  'M1', // Curiosity Music
  'M2', // Motivational Music
  'M3', // Instructional Music
  'M4', // Philosophical Music
  'M5', // Happy Music
  'M6', // Optimistic Music
  'M7', // Sad Music
  'M8', // Pessimistic Music
  'M9', // Heroic Music
  'M10', // Horror Music
  'M11', // Beat Music
  'M12', // Newspaper Music
  'M13', // Nostalgic Music
];

const AVAILABLE_EFFECTS = [
  // Weather
  'E1a', // Thunder
  'E1b', // Rain
  'E1c', // Sunny Day with Birds
  'E1d', // Night with Frogs
  'E1e', // Gentle Breeze
  'E1f', // Blizzard
  
  // Miscellaneous
  'E2a', // Market Sounds
  'E2b', // Footsteps
  'E2c', // Knocking
  'E2d', // Glass Breaking
  'E2e', // Water
  'E2f', // Cup Filling
  'E2g', // Deep Breath
  'E2h', // Doorbell
  'E2i', // Phone Ringing
  'E2j', // Car Engine
  'E2k', // Crowd Noise
  
  // Animal Sounds
  'E3a', // Birds Chirping
  'E3b', // Dog Barking
  'E3c', // Horse Running
  'E3d', // Cat Purring
  'E3e', // Owl Hooting
  
  // Beats
  'E4a', // Fast Drumbeat
  'E4b', // Tense Strings
  'E4c', // Dramatic Swells
  'E4d', // Light Percussion
  
  // Machine Sounds
  'E5a', // Factory Machinery
  'E5b', // Spaceship Engine
  'E5c', // Gunshots
];

// Gemini API key 
const GEMINI_API_KEY = 'AIzaSyD0ii7C1E5UuabTV2KcT7BNmVHZR1JdoQU';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Interface for audio recommendations
 */
export interface AudioRecommendation {
  backgroundMusic: string;
  effects: {
    id: string;
    timeline: number;
  }[];
}

/**
 * Use RAG with Google Gemini to generate audio recommendations based on text context
 */
const getAudioRecommendations = async (pageText: string): Promise<AudioRecommendation> => {
  try {
    // Prepare the prompt for Gemini
    const prompt = `
      You are an AI expert in understanding text and recommending appropriate background music and sound effects.
      
      INSTRUCTION:
      You are the implementation that will suggest music and effects for book content. For example, if there is a sad chapter in a novel and a character is weeping, the Music will be sad and effects will be of weeping. The music represents the theme of the novel for that particular page, while effects are for pronounced moments. We are calling this a "content-aware background music and effects suggestor."
      
      Music will play throughout the content as a theme, while effects will be played at specific moments in the timeline.
      
      TEXT TO ANALYZE:
      ${pageText.substring(0, 1500)} // Limit text length to avoid exceeding API limits
      
      Music Categories and IDs:
      * Curiosity Music: M1
      * Motivational Music: M2
      * Instructional Music: M3
      * Philosophical Music: M4
      * Happy Music: M5
      * Optimistic Music: M6
      * Sad Music: M7
      * Pessimistic Music: M8
      * Heroic Music: M9
      * Horror Music: M10
      * Beat Music: M11
      * Newspaper Music: M12
      * Nostalgic Music: M13
      
      Effect Categories and IDs:
      1. WEATHER:
      * Thunders: E1a
      * Rain: E1b
      * Sunny Day with Birds Chirping: E1c
      * Night with Frog Sounds: E1d
      * Gentle Breeze: E1e
      * Blizzard Howling: E1f
      
      2. MISCELLANEOUS:
      * Market People Sound: E2a
      * Steps Sound: E2b
      * Knocking Sound: E2c
      * Glass Shattering Sound: E2d
      * Water Sound: E2e
      * Cup Filling Sound: E2f
      * Deep Breath Sounds: E2g
      * Doorbell Ringing: E2h
      * Phone Ringing: E2i
      * Car Engine Starting: E2j
      * Crowd Noise: E2k
      
      3. ANIMAL SOUNDS:
      * Birds Chirping: E3a
      * Street Dog Barking: E3b
      * Horse Running: E3c
      * Cat Purring: E3d
      * Owl Hooting: E3e
      
      4. BEATS:
      * Fast-Paced Drumbeat: E4a
      * Tense String Section: E4b
      * Dramatic Swells: E4c
      * Light Percussion: E4d
      
      5. MACHINE SOUNDS:
      * Factory Machinery: E5a
      * Spaceship Engine Hum: E5b
      * Gunshots: E5c
      
      FORMAT OF RESPONSE:
      Respond in JSON format with exactly this structure:
      {
        "backgroundMusic": "[music code]",
        "effects": [
          {
            "id": "[effect code]",
            "timeline": [second to play the effect]
          }
        ]
      }
      
      IMPORTANT NOTES:
      1. Choose ONE background music code that best matches the overall mood/theme of the text.
      2. Suggest 2-5 sound effects that match specific moments in the text.
      3. For each effect, calculate the "timeline" in seconds, assuming a reading speed of 155 words per minute.
         For example, if an effect should play after the 62nd word, the timeline would be (62 ÷ 155) × 60 ≈ 24 seconds.
      4. Be precise and contextual in your recommendations.
      5. ONLY return valid JSON in the format specified above.
    `;

    // Make the request to Gemini API
    const response = await axios.post<GeminiResponse>(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse response to extract JSON
    const responseText = response.data.candidates[0].content.parts[0].text;
    
    // Extract the JSON part from the response (the model might wrap it in ```json and ```)
    const jsonMatch = responseText.match(/```json([\s\S]*?)```/) || 
                      responseText.match(/{[\s\S]*?}/);
    
    let recommendationJson = '';
    if (jsonMatch) {
      recommendationJson = jsonMatch[0].replace(/```json|```/g, '').trim();
    } else {
      recommendationJson = responseText;
    }
    
    // Parse the JSON response
    const parsedRecommendation = JSON.parse(recommendationJson);
    
    // Validate the background music and effects
    const backgroundMusic = AVAILABLE_MUSIC.includes(parsedRecommendation.backgroundMusic) 
      ? parsedRecommendation.backgroundMusic 
      : 'M12'; // Default to neutral music if invalid
    
    const effects = parsedRecommendation.effects
      .filter((effect: any) => AVAILABLE_EFFECTS.includes(effect.id))
      .map((effect: any) => ({
        id: effect.id,
        timeline: typeof effect.timeline === 'number' ? effect.timeline : 0
      }));
    
    return {
      backgroundMusic,
      effects
    };
  } catch (error) {
    console.error('Error getting audio recommendations:', error);
    
    // Return a default recommendation in case of error
    return {
      backgroundMusic: 'M12', // Neutral music
      effects: []
    };
  }
};

/**
 * Mock function for when actual API calls are not desired
 */
const getMockAudioRecommendations = (pageText: string): AudioRecommendation => {
  // Word count for timeline calculations
  const words = pageText.split(/\s+/);
  const wordCount = words.length;
  
  // Calculate random positions for effects based on word count
  const getRandomPosition = (maxWords: number) => {
    const wordPosition = Math.floor(Math.random() * maxWords);
    // Convert word position to seconds at 155 WPM
    return Math.round((wordPosition / 155) * 60);
  };
  
  // Simple mock implementation that varies based on text content
  const textLower = pageText.toLowerCase();
  
  // Determine background music based on sentiment keywords
  let backgroundMusic = 'M12'; // Default neutral
  
  // Happy mood
  if (textLower.match(/happy|joy|celebrate|smile|laugh|exciting|celebration|success|win|achievement/g)) {
    backgroundMusic = 'M5'; // Happy
  } 
  // Sad mood
  else if (textLower.match(/sad|sorrow|cry|tear|grief|depression|mourn|weep|upset|melancholy/g)) {
    backgroundMusic = 'M7'; // Sad
  } 
  // Horror/tense mood
  else if (textLower.match(/scary|fear|dark|horror|afraid|terror|frightening|creepy|scared|dread/g)) {
    backgroundMusic = 'M10'; // Horror
  } 
  // Heroic mood
  else if (textLower.match(/hero|brave|courage|victory|triumph|battle|fight|strong|power|mighty/g)) {
    backgroundMusic = 'M9'; // Heroic
  } 
  // Educational/informative mood
  else if (textLower.match(/learn|education|study|understand|knowledge|discovery|science|research|analysis|fact/g)) {
    backgroundMusic = 'M1'; // Curiosity
  } 
  // Motivational mood
  else if (textLower.match(/motivate|inspire|achieve|success|goal|dream|ambition|purpose|determination|progress/g)) {
    backgroundMusic = 'M2'; // Motivational
  } 
  // Philosophical mood
  else if (textLower.match(/think|philosophy|deep|meaning|question|wonder|contemplation|ponder|reflect|mind/g)) {
    backgroundMusic = 'M4'; // Philosophical
  }
  // Nostalgic mood
  else if (textLower.match(/memory|past|childhood|remember|nostalgia|old days|history|reminisce|vintage|throwback/g)) {
    backgroundMusic = 'M13'; // Nostalgic
  }
  // Optimistic
  else if (textLower.match(/optimistic|hopeful|future|bright|positive|better|improve|hope|opportunity|tomorrow/g)) {
    backgroundMusic = 'M6'; // Optimistic
  }
  // Pessimistic
  else if (textLower.match(/pessimistic|hopeless|gloomy|dark|negative|worse|decline|despair|doom|failure/g)) {
    backgroundMusic = 'M8'; // Pessimistic
  }
  
  // Generate a list of potential effects
  const potentialEffects = [];
  
  // Weather effects
  if (textLower.match(/rain|rainy|downpour|drizzle/g)) {
    potentialEffects.push({ id: 'E1b', keyword: 'rain' });
  }
  if (textLower.match(/thunder|storm|lightning/g)) {
    potentialEffects.push({ id: 'E1a', keyword: 'thunder' });
  }
  if (textLower.match(/sunny|sun|bright|sunshine|clear sky/g)) {
    potentialEffects.push({ id: 'E1c', keyword: 'sunny' });
  }
  if (textLower.match(/night|evening|dark|dusk|twilight/g)) {
    potentialEffects.push({ id: 'E1d', keyword: 'night' });
  }
  if (textLower.match(/wind|breeze|blow|gust/g)) {
    potentialEffects.push({ id: 'E1e', keyword: 'breeze' });
  }
  if (textLower.match(/snow|blizzard|cold|freeze|ice/g)) {
    potentialEffects.push({ id: 'E1f', keyword: 'blizzard' });
  }
  
  // Misc effects
  if (textLower.match(/market|bazaar|shop|store|crowd/g)) {
    potentialEffects.push({ id: 'E2a', keyword: 'market' });
  }
  if (textLower.match(/walk|step|steps|footstep|came|went|moved/g)) {
    potentialEffects.push({ id: 'E2b', keyword: 'step' });
  }
  if (textLower.match(/knock|door|tap/g)) {
    potentialEffects.push({ id: 'E2c', keyword: 'knock' });
  }
  if (textLower.match(/break|glass|shatter|crash/g)) {
    potentialEffects.push({ id: 'E2d', keyword: 'break' });
  }
  if (textLower.match(/water|river|stream|ocean|splash|swim/g)) {
    potentialEffects.push({ id: 'E2e', keyword: 'water' });
  }
  if (textLower.match(/cup|drink|pour|fill/g)) {
    potentialEffects.push({ id: 'E2f', keyword: 'cup' });
  }
  if (textLower.match(/breath|sigh|gasp|inhale|exhale/g)) {
    potentialEffects.push({ id: 'E2g', keyword: 'breath' });
  }
  if (textLower.match(/doorbell|ring|visitor|guest/g)) {
    potentialEffects.push({ id: 'E2h', keyword: 'doorbell' });
  }
  if (textLower.match(/phone|call|ring|mobile/g)) {
    potentialEffects.push({ id: 'E2i', keyword: 'phone' });
  }
  if (textLower.match(/car|engine|drive|vehicle|automobile/g)) {
    potentialEffects.push({ id: 'E2j', keyword: 'car' });
  }
  if (textLower.match(/crowd|people|group|gathering|audience|cheer|applause/g)) {
    potentialEffects.push({ id: 'E2k', keyword: 'crowd' });
  }
  
  // Animal effects
  if (textLower.match(/bird|chirp|tweet|sing/g)) {
    potentialEffects.push({ id: 'E3a', keyword: 'bird' });
  }
  if (textLower.match(/dog|bark|pet/g)) {
    potentialEffects.push({ id: 'E3b', keyword: 'dog' });
  }
  if (textLower.match(/horse|gallop|trot|ride/g)) {
    potentialEffects.push({ id: 'E3c', keyword: 'horse' });
  }
  if (textLower.match(/cat|purr|meow|feline/g)) {
    potentialEffects.push({ id: 'E3d', keyword: 'cat' });
  }
  if (textLower.match(/owl|hoot|night bird/g)) {
    potentialEffects.push({ id: 'E3e', keyword: 'owl' });
  }
  
  // Beat effects
  if (textLower.match(/fast|quick|rapid|hurry|rush|race|speed/g)) {
    potentialEffects.push({ id: 'E4a', keyword: 'fast' });
  }
  if (textLower.match(/tense|suspense|nervous|anxious|worry/g)) {
    potentialEffects.push({ id: 'E4b', keyword: 'tense' });
  }
  if (textLower.match(/dramatic|intense|climax|peak|revelation|shocking/g)) {
    potentialEffects.push({ id: 'E4c', keyword: 'dramatic' });
  }
  if (textLower.match(/light|gentle|soft|calm|peaceful|serene/g)) {
    potentialEffects.push({ id: 'E4d', keyword: 'light' });
  }
  
  // Machine effects
  if (textLower.match(/factory|machine|industrial|manufacture|production/g)) {
    potentialEffects.push({ id: 'E5a', keyword: 'factory' });
  }
  if (textLower.match(/space|ship|starship|rocket|spacecraft/g)) {
    potentialEffects.push({ id: 'E5b', keyword: 'spaceship' });
  }
  if (textLower.match(/gun|shot|fire|bullet|weapon|blast/g)) {
    potentialEffects.push({ id: 'E5c', keyword: 'gunshot' });
  }
  
  // Get a random subset of the potential effects
  const selectedEffects = [];
  const maxEffects = Math.min(5, potentialEffects.length);
  const effectCount = Math.max(2, Math.floor(Math.random() * maxEffects));
  
  if (potentialEffects.length > 0) {
    // Shuffle potential effects array
    const shuffled = [...potentialEffects].sort(() => 0.5 - Math.random());
    
    // Take the first few effects from the shuffled array
    for (let i = 0; i < effectCount; i++) {
      if (i < shuffled.length) {
        const effect = shuffled[i];
        
        // Try to find the keyword in the text to calculate the timeline
        const keyword = effect.keyword;
        const keywordIndex = textLower.indexOf(keyword);
        
        let timeline = 0;
        if (keywordIndex !== -1) {
          // Count words up to this index to determine timeline
          const textUpToKeyword = pageText.substring(0, keywordIndex);
          const wordCountUpToKeyword = textUpToKeyword.split(/\s+/).length;
          // Calculate seconds at 155 WPM
          timeline = Math.round((wordCountUpToKeyword / 155) * 60);
        } else {
          // If keyword not found, use a random position
          timeline = getRandomPosition(wordCount);
        }
        
        selectedEffects.push({
          id: effect.id,
          timeline: Math.max(1, timeline) // Ensure timeline is at least 1 second
        });
      }
    }
    
    // Sort effects by timeline
    selectedEffects.sort((a, b) => a.timeline - b.timeline);
  }
  
  return {
    backgroundMusic,
    effects: selectedEffects
  };
};

export const geminiService = {
  getAudioRecommendations,
  getMockAudioRecommendations
}; 