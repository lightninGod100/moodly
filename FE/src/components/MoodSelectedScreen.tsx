// src/components/MoodSelectedScreen.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
// Add this import with your other imports
import { moodSelectedStatsApiService } from '../services/MoodSelectedStatsService';

// Define valid mood types
type MoodType = 'Happy' | 'Excited' | 'Calm' | 'Tired' | 'Anxious' | 'Angry' | 'Sad';

// Mood color mapping (hex to Vanta-compatible format)
export const moodColors: { [key: string]: string } = {
  Happy: '#136025',    // Green
  Excited: '#686a1b',  // Amber  
  Calm: '#221f83',     // Blue
  Tired: '#2B373F',    // Purple
  Sad: '#400f36',      // Indigo
  Angry: '#8a1212',    // Red
  Anxious: '#7473e',  // Orange
  default: '#4b5563'   // Gray for no data
};

// Convert hex to Vanta color format (remove # and convert to number)
const hexToVantaColor = (hex: string): number => {
  return parseInt(hex.replace('#', ''), 16);
};

// Helper functions outside component (better performance)
const getMoodDependentMessage = (mood: string): string => {
  const quotes = moodQuotes[mood as MoodType];
  if (quotes && quotes.length > 0) {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }
  return "Interesting, Something seems off";
};

const getStatMessage = (mood: string): string => {
  const percentages: Record<MoodType, string> = {
    'Happy': '15%',
    'Excited': '8%',
    'Calm': '12%',
    'Tired': '20%',
    'Anxious': '18%',
    'Angry': '5%',
    'Sad': '10%'
  };
  const percentage = percentages[mood as MoodType] || '12%';
  return `You are among ${percentage} of users feeling ${mood} right now`;
};

// Short mood-related phrases for left side bubbles
const getMoodPhrases = (mood: string): string[] => {
  const phrases: Record<MoodType, string[]> = {
    'Happy': ["Keep it going", "Smile bright", "Feel good", "Positive vibes", "Cheerful heart"],
    'Excited': ["Yippee!", "Bring it on", "Let's gooo", "So pumped!", "Energy unlocked"],
    'Calm': ["Stay centered", "Breathe easy", "Peace within", "Still waters", "Quiet strength"],
    'Tired': ["Rest is power", "Time to recharge", "You've earned a break", "Listen to your body", "Slow it down"],
    'Anxious': ["It's okay to pause", "You're safe now", "Deep breaths", "One step at a time", "Be kind to your mind"],
    'Angry': ["Take a deep breath", "Let it go", "Cool it down", "You're in control", "Anger is a signal"],
    'Sad': ["This too shall pass", "Feel it, heal it", "You're not alone", "Crying is okay", "Healing takes time"]
  };
  return phrases[mood as MoodType] || ["Stay strong", "You matter", "Hope lives", "Peace comes"];
};

// Main inspirational quotes for right side bubbles - mood specific
const getMoodSpecificQuotes = (mood: string): string[] => {
  const quotes: Record<MoodType, string[]> = {
    'Happy': [
      "Happiness is not something ready made. It comes from your own actions. — Dalai Lama",
      "The most simple things can bring the most happiness. — Izabella Scorupco",
      "Happiness depends upon ourselves. — Aristotle",
      "The only joy in the world is to begin. — Cesare Pavese",
      "Very little is needed to make a happy life; it is all within yourself. — Marcus Aurelius"
    ],
    'Excited': [
      "The more you praise and celebrate your life, the more there is in life to celebrate. — Oprah Winfrey",
      "Enthusiasm moves the world. — Arthur Balfour",
      "Life is either a daring adventure or nothing at all. — Helen Keller",
      "The excitement of learning separates youth from old age. — Ezra Pound",
      "Act enthusiastic and you will be enthusiastic. — Dale Carnegie"
    ],
    'Calm': [
      "He who is of a calm and happy nature will hardly feel the pressure of age. — Plato",
      "Peace comes from within. Do not seek it without. — Buddha",
      "Nothing can bring you peace but yourself. — Ralph Waldo Emerson",
      "The nearer a man comes to a calm mind, the closer he is to strength. — Marcus Aurelius",
      "Be like a tree and let the dead leaves drop. — Rumi"
    ],
    'Tired': [
      "There is virtue in work and there is virtue in rest. Use both and overlook neither. — Alan Cohen",
      "Rest and be thankful. — William Wordsworth",
      "Sometimes the most productive thing you can do is relax. — Mark Black",
      "Your mind will answer most questions if you learn to relax and wait for the answer. — William S. Burroughs",
      "Take rest; a field that has rested gives a bountiful crop. — Ovid"
    ],
    'Anxious': [
      "Do not let your difficulties fill you with anxiety, after all it is only in the darkest nights that stars shine more brightly. — Ali ibn Abi Talib",
      "You don't have to control your thoughts. You just have to stop letting them control you. — Dan Millman",
      "Anxiety does not empty tomorrow of its sorrows, but only empties today of its strength. — Charles Spurgeon",
      "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor. — Thích Nhất Hạnh",
      "Nothing diminishes anxiety faster than action. — Walter Anderson"
    ],
    'Angry': [
      "You will not be punished for your anger; you will be punished by your anger. — Buddha",
      "Speak when you are angry and you will make the best speech you will ever regret. — Ambrose Bierce",
      "For every minute you remain angry, you give up sixty seconds of peace of mind. — Ralph Waldo Emerson",
      "The greatest remedy for anger is delay. — Seneca",
      "Anger is never without a reason, but seldom with a good one. — Benjamin Franklin"
    ],
    'Sad': [
      "The wound is the place where the Light enters you. — Rumi",
      "Every man has his secret sorrows which the world knows not. — Henry Wadsworth Longfellow",
      "Tears come from the heart and not from the brain. — Leonardo da Vinci",
      "To weep is to make less the depth of grief. — William Shakespeare",
      "Sadness flies away on the wings of time. — Jean de La Fontaine"
    ]
  };
  return quotes[mood as MoodType] || quotes['Happy']; // Default to Happy quotes if mood not found
};
// Add after getMoodSpecificQuotes function
const moodRecommendations = {
  Happy: [
    "Don't let this fade away, try to maintain it.",
    "Capture the moment—take a photo or write a journal entry.",
    "Celebrate yourself, even in small ways."
  ],
  Excited: [
    "Channel your energy into a project or hobby.",
    "Take a short walk to calm and center your body.",
    "Practice grounding to stay focused amid the buzz."
  ],
  Calm: [
    "Meditate for 5–10 minutes to deepen that peace.",
    "Sit outside and just observe your surroundings.",
    "Enjoy a warm drink with no distractions.",
    "Reflect or journal about what's bringing you peace."
  ],
  Sad: [
    "Talk to someone you trust—even a short text helps.",
    "Journal your feelings without judgment.",
    "Watch or listen to something gentle and comforting.",
    "Take a slow walk in nature if possible.",
    "Let yourself cry if you need to—it's a release, not a weakness."
  ],
  Tired: [
    "Take a power nap (10–20 minutes).",
    "Stretch your body gently—relieves built-up tension.",
    "Reduce screen time for a bit and rest your eyes.",
    "Drink water or have a light, nutritious snack.",
    "Write a 'done list' instead of a to-do list—it's encouraging."
  ],
  Anxious: [
    "Try a grounding technique (e.g., 5-4-3-2-1 senses).",
    "Step away from the trigger—go for a short walk.",
    "Listen to calming nature sounds or soft music.",
    "Practice box breathing (4-in, 4-hold, 4-out, 4-hold).",
    "Limit caffeine and sugar intake if possible."
  ],
  Angry: [
    "Do a physical release—like squeezing a stress ball or exercising.",
    "Write down what made you angry—then tear it up or delete it.",
    "Take a cool-down break—10 minutes away can shift everything.",
    "Practice non-judgmental observation: \"I feel anger, and that's okay.\"",
    "Talk to someone objective if possible, not someone who fuels it."
  ]
};

const getRandomRecommendations = (mood: string, count: number = 3): string[] => {
  const recommendations = moodRecommendations[mood as MoodType];
  if (!recommendations || recommendations.length === 0) {
    return ["Keep tracking your mood for personalized insights."];
  }
  
  // Shuffle array and take first 'count' to avoid repetition
  const shuffled = [...recommendations].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};


const moodQuotes = {
  "Happy": [
    "Keep that smile going—it's contagious!",
    "You're glowing from the inside out.",
    "Joy suits you beautifully.",
    "Let the good vibes flow.",
    "Happiness looks natural on you."
  ],
  "Excited": [
    "You're buzzing with life!",
    "Big things are coming—hold on tight!",
    "Your spark is catching fire.",
    "Ride that wave of thrill!",
    "Your energy is electric."
  ],
  "Calm": [
    "Peace surrounds you like a soft breeze.",
    "Stillness is your superpower.",
    "You're the calm in the chaos.",
    "Serenity is strength in silence.",
    "Your quiet is comforting."
  ],
  "Sad": [
    "It's okay to not be okay.",
    "This feeling won't last forever.",
    "You're not alone in this moment.",
    "Crying is healing too.",
    "Be gentle with yourself today."
  ],
  "Tired": [
    "You've done enough—rest now.",
    "Even machines need to recharge.",
    "Your body is whispering for a pause.",
    "Slow down, you're allowed to.",
    "Exhaustion means you tried."
  ],
  "Anxious": [
    "One breath at a time—you've got this.",
    "It's not as bad as your brain says.",
    "Let go of what you can't control.",
    "You're safe in this moment.",
    "Anxiety lies—truth is quieter."
  ],
  "Angry": [
    "Your anger has a message—listen.",
    "It's okay to feel fire, not to feed it.",
    "Let it out in ways that don't burn you.",
    "Take space before you speak.",
    "You're bigger than the rage."
  ]
};

interface MoodSelectedScreenProps {
  currentMood: string;
  moodEmoji: string;
}

const MoodSelectedScreen: React.FC<MoodSelectedScreenProps> = ({ currentMood, moodEmoji }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  // Get color for current mood
  const getMoodColor = (mood: string): number => {
    const colorHex = moodColors[mood] || moodColors.default;
    return hexToVantaColor(colorHex);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!vantaEffect.current && vantaRef.current) {
          console.log('Initializing Vanta Waves...');
          
          vantaEffect.current = WAVES({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: getMoodColor(currentMood),
            shininess: 50,
            waveHeight: 20,
            waveSpeed: 1.2,
            zoom: 0.75
          });
          
          console.log('Vanta effect created');
        }
      } catch (error) {
        console.error('Error initializing Vanta Waves:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      try {
        if (vantaEffect.current) {
          vantaEffect.current.destroy();
          vantaEffect.current = null;
        }
      } catch (error) {
        console.error('Error destroying Vanta effect:', error);
      }
    };
  }, []);

  // Update Vanta color when mood changes
  useEffect(() => {
    if (vantaEffect.current && currentMood) {
      try {
        const newColor = getMoodColor(currentMood);
        console.log('Updating Vanta color for mood:', currentMood);
        
        if (vantaEffect.current.options) {
          vantaEffect.current.options.color = newColor;
        }
      } catch (error) {
        console.error('Error updating Vanta color:', error);
      }
    }
  }, [currentMood]);

  // Add this useEffect for testing the service layer
useEffect(() => {
  const testMoodSelectedStatsService = async () => {
    try {
      console.log('🧪 Testing MoodSelectedStats Service...');
      console.log('Current mood for testing:', currentMood);
      
      // Test 1: Mood Transition
      console.log('\n📊 Testing Mood Transition...');
      const moodTransition = await moodSelectedStatsApiService.getMoodTransition();
      console.log('✅ Mood Transition Result:', moodTransition);
      
      // Test 2: Global Percentage
      console.log('\n🌍 Testing Global Percentage...');
      const globalPercentage = await moodSelectedStatsApiService.getGlobalPercentage(currentMood);
      console.log('✅ Global Percentage Result:', globalPercentage);
      
      // Test 3: Weekly Sentiment
      console.log('\n📈 Testing Weekly Sentiment...');
      const weeklySentiment = await moodSelectedStatsApiService.getWeeklySentiment();
      console.log('✅ Weekly Sentiment Result:', weeklySentiment);
      
      // Test 4: Achievements
      // Test 4: Achievements (Enhanced Logging)
console.log('\n🏆 Testing Achievements...');
const achievements = await moodSelectedStatsApiService.getAchievements();
console.log('✅ Achievements Raw Response:', achievements);

// Enhanced achievements logging
if (achievements.hasAchievement && achievements.achievements) {
  console.log('\n🎯 ACHIEVEMENTS DETAILS:');
  console.log(`📊 Total Achievements Unlocked: ${achievements.achievements.length}`);
  
  achievements.achievements.forEach((achievement, index) => {
    console.log(`\n🏅 Achievement ${index + 1}:`);
    console.log(`   Name: ${achievement.name}`);
    console.log(`   Message: ${achievement.message}`);
  });
  
  console.log('\n📋 All Achievement Names:', achievements.achievements.map(a => a.name));
  console.log('📝 All Achievement Messages:', achievements.achievements.map(a => a.message));
  
} else {
  console.log('\n❌ No Achievements Found');
  console.log('Fallback Message:', achievements.message);
}
      
      // Test 5: Combined Call (Promise.all)
      console.log('\n🚀 Testing Combined API Call...');
      const allStats = await moodSelectedStatsApiService.getAllMoodSelectedStats(currentMood);
      console.log('✅ All Stats Combined Result:', allStats);
      
      console.log('\n🎉 All MoodSelectedStats service tests completed successfully!');
      console.log('📋 Summary:');
      console.log('  - Mood Transition:', moodTransition.message);
      console.log('  - Global Percentage:', globalPercentage.message);
      console.log('  - Weekly Sentiment:', weeklySentiment.hasData ? weeklySentiment.sentimentMessage : weeklySentiment.message);
      console.log('  - Achievements:', achievements.hasAchievement ? `${achievements.achievements?.length} achievements` : achievements.message);

      
      
    } catch (error) {
      console.error('❌ MoodSelectedStats service test failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        currentMood: currentMood,
        timestamp: new Date().toISOString()
      });
    }
  };
  
  // Only run test if we have a current mood and after component is fully mounted
  if (currentMood) {
    console.log('⏳ Starting MoodSelectedStats service test in 2 seconds...');
    const timer = setTimeout(testMoodSelectedStatsService, 2000);
    
    return () => clearTimeout(timer); // Cleanup timer on unmount
  }
}, [currentMood]); // Re-run test if mood changes
  // Working bubble positions from the sample code
  const moodPhrases = getMoodPhrases(currentMood);
  const quotes = getMoodSpecificQuotes(currentMood);

  return (
    <div ref={vantaRef} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      
     {/* Enhanced Professional Main Content */}
     <div style={{ 
        position: 'absolute', 
        top: '53%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        zIndex: 5, 
        color: 'white',
        width: '85%',
        maxWidth: '1000px'
      }}>
        
        {/* Hero Section - Current Mood Display */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          {/* Title */}
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            marginBottom: '1rem',
            fontFamily: 'var(--font-family)',
            letterSpacing: '-0.025em'
          }}>
            Current Mood
          </h1>
          
          {/* Enhanced Mood Display */}
          <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* Glow Effect */}
              <div style={{
                position: 'absolute',
                inset: '0',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '1.5rem',
                filter: 'blur(1.5rem)',
                transform: 'scale(1.3)',
                animation: 'pulse 3s infinite'
              }}></div>
              
              {/* Main Mood Container */}
              <div style={{
                position: 'relative',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                padding: '2.5rem 3rem',
                paddingBottom: '1rem',
                borderRadius: '1.5rem',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                minWidth: '1000px'
              }}>
                <div style={{ 
                  fontSize: '5rem', 
                  marginBottom: '0rem', 
                  animation: 'bounce 2s infinite',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }}>
                  {moodEmoji}
                </div>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: '600', 
                  letterSpacing: '0.05em',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {currentMood}
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Mood Message */}
          <div style={{ marginBottom: '0rem' }}>
            <p style={{ 
              fontSize: '1.35rem', 
              fontWeight: '500', 
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}>
              {getMoodDependentMessage(currentMood)}
            </p>
          </div>
        </div>

        {/* Global Connection - Moved Above Grid */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.25)',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(15px)',
            padding: '1.5rem 2.5rem',
            borderRadius: '1rem',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
            textAlign: 'center',
            maxWidth: '500px',
        
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>🌍</div>
              <h3 style={{ 
                fontWeight: '600', 
                fontSize: '1rem', 
                margin: 0,
                color: 'rgba(255, 255, 255, 0.95)'
              }}>
                Global Connection
              </h3>
            </div>
            <p style={{ 
              fontSize: '0.9rem', 
              margin: 0,
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.4'
            }}>
              {getStatMessage(currentMood)}
            </p>
          </div>
        </div>

        {/* Professional Insights Grid - 2x2 Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem',
          marginBottom: '2.5rem'
    
        }}>
          
          {/* Mood Transition Card */}
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            padding: '1rem',
            borderRadius: '1rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.8rem', marginRight: '0.75rem' }}>🔄</div>
              <h3 style={{ 
                fontWeight: '600', 
                fontSize: '1.1rem', 
                margin: 0,
                color: 'rgba(255, 255, 255, 0.95)'
              }}>
                Mood Transition
              </h3>
            </div>
            <div style={{ 
              fontSize: '0.95rem', 
              lineHeight: '1.5',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              <div style={{ marginBottom: '0rem' }}>Previous: <span style={{ fontWeight: '500' }}>Tired</span></div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
                <span>😴</span>
                <span style={{ margin: '0 0.5rem', fontSize: '1.2rem' }}>→</span>
                <span>{moodEmoji}</span>
                <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>{currentMood}</span>
              </div>
            </div>
          </div>

          {/* Weekly Sentiment Card */}
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            padding: '1rem',
            borderRadius: '1rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.8rem', marginRight: '0.75rem' }}>📊</div>
              <h3 style={{ 
                fontWeight: '600', 
                fontSize: '1.1rem', 
                margin: 0,
                color: 'rgba(255, 255, 255, 0.95)'
              }}>
                Weekly Sentiment
              </h3>
            </div>
            <div style={{ 
              fontSize: '0.95rem', 
              lineHeight: '1.5',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                You felt <span style={{ fontWeight: '500', color: '#4ade80' }}>positive</span> this week
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                5th time feeling {currentMood}
              </div>
            </div>
          </div>

          {/* Achievements Card */}
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            padding: '1rem',
            borderRadius: '1rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.8rem', marginRight: '0.75rem' }}>🏆</div>
              <h3 style={{ 
                fontWeight: '600', 
                fontSize: '1.1rem', 
                margin: 0,
                color: 'rgba(255, 255, 255, 0.95)'
              }}>
                Achievements
              </h3>
            </div>
            <div style={{ 
              fontSize: '0.95rem', 
              lineHeight: '1.5',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                🎯 <span style={{ fontWeight: '500' }}>7-day streak</span> active
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                45 moods tracked this month
              </div>
            </div>
          </div>

          {/* Recommendations Card */}
          {/* Recommendations Card */}
<div style={{
  border: '1px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  padding: '1rem',
  borderRadius: '1rem',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer'
}}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-4px)';
  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
}}>
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
    <div style={{ fontSize: '1.8rem', marginRight: '0.75rem' }}>💡</div>
    <h3 style={{ 
      fontWeight: '600', 
      fontSize: '1.1rem', 
      margin: 0,
      color: 'rgba(255, 255, 255, 0.95)'
    }}>
      Recommendations
    </h3>
  </div>
  <div style={{ 
    fontSize: '0.95rem', 
    lineHeight: '1.5',
    color: 'rgba(255, 255, 255, 0.8)'
  }}>
    {getRandomRecommendations(currentMood, 3).map((recommendation, index) => (
      <div key={index} style={{ marginBottom: '0.5rem' }}>
        • {recommendation}
      </div>
    ))}
  </div>
</div>
        </div>

       
          
           
           
      
      </div>
      {/* Left bubbles - Realistic styling with working animations */}
{/* Left bubbles - Updated to show all 5 phrases */}
<div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', pointerEvents: 'none' }}>
 {[...Array(5)].map((_, index) => {
   const bubbleSize = 110 + moodPhrases[index].length/5;
   return (
     <React.Fragment key={`left-bubble-group-${index}`}>
       <div
         key={`left-${index}`}
         style={{
           position: 'absolute',
           bottom: '-30px',
           left: index % 2 === 0 ? '20%' : '30%',
           opacity: 0,
           animation: `floatUpLeft 20s linear ${index * 4}s infinite`,
           color: 'rgba(0, 0, 0, 0.8)',
           background: `
             radial-gradient(circle at 30% 30%, 
               rgba(255, 255, 255, 0.8) 0%, 
               rgba(255, 255, 255, 0.4) 30%, 
               rgba(255, 255, 255, 0.1) 70%, 
               rgba(255, 255, 255, 0.05) 100%
             )
           `,
           borderRadius: '50%',
           border: '1px solid rgba(255, 255, 255, 0.6)',
           padding: '1rem',
           backdropFilter: 'blur(8px)',
           fontSize: '1rem',
           fontWeight: '500',
           textAlign: 'center',
           width: `${bubbleSize}px`,
           height: `${bubbleSize}px`,
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           boxShadow: `
             inset -10px -10px 20px rgba(255, 255, 255, 0.3),
             inset 10px 10px 20px rgba(0, 0, 0, 0.1),
             0 5px 15px rgba(0, 0, 0, 0.2)
           `
         }}
       >
         {moodPhrases[index]}
       </div>
       {[1, 2, 3, 4].map(fragIndex => (
         <div
           key={`left-fragment-${fragIndex}-${index}`}
           style={{
             position: 'absolute',
             bottom: '-30px',
             left: index % 2 === 0 ? '20%' : '30%',
             animation: `fragmentBurstLeft${fragIndex} 20s linear ${index * 4}s infinite`,
             color: 'rgba(0, 0, 0, 0.6)',
             background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 100%)',
             borderRadius: '50%',
             border: '1px solid rgba(255, 255, 255, 0.5)',
             backdropFilter: 'blur(4px)',
             width: '20px',
             height: '20px',
             opacity: 0,
             boxShadow: 'inset -3px -3px 6px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)'
           }}
         />
       ))}
     </React.Fragment>
   );
 })}
</div>
   
      {/* Right bubbles - Sequential approach with alternating positions */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', pointerEvents: 'none' }}>
        {[...Array(5)].map((_, index) => {
          const bubbleSize = 170 + quotes[index].length/5;
          return (
            <React.Fragment key={`right-bubble-group-${index}`}>
              <div
                key={`right-${index}`}
                style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: index % 2 === 0 ? '60%' : '70%',
                  opacity: 0,
                  animation: `floatUpRight 20s linear ${index * 4}s infinite`,
                  color: 'rgba(0, 0, 0, 0.8)',
                  background: `
                    radial-gradient(circle at 25% 25%, 
                      rgba(255, 255, 255, 0.9) 0%, 
                      rgba(255, 255, 255, 0.5) 25%, 
                      rgba(255, 255, 255, 0.2) 60%, 
                      rgba(255, 255, 255, 0.05) 100%
                    )
                  `,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255, 255, 255, 0.7)',
                  padding: '1.5rem',
                  backdropFilter: 'blur(12px)',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  textAlign: 'center',
                  width: `${bubbleSize}px`,
                  height: `${bubbleSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1.3',
                  wordWrap: 'break-word',
                  boxShadow: `
                    inset -15px -15px 30px rgba(255, 255, 255, 0.4),
                    inset 15px 15px 30px rgba(0, 0, 0, 0.1),
                    0 8px 25px rgba(0, 0, 0, 0.25)
                  `
                }}
              >
                {(() => {
                  const fullQuote = quotes[index];
                  const parts = fullQuote.split(' — ');
                  const quoteText = parts[0];
                  const author = parts[1] || '';
                  
                  return (
                    <div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        {quoteText}
                      </div>
                      {author && (
                        <div style={{ 
                          fontSize: '0.65rem', 
                          fontStyle: 'italic', 
                          opacity: 0.9,
                          marginTop: '0.5rem',
                          fontWeight: 'bold'
                        }}>
                          — {author}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              {/* Fragment bubbles for realistic burst */}
              {[1, 2, 3, 4].map(fragIndex => (
                <div
                  key={`right-fragment-${fragIndex}-${index}`}
                  style={{
                    position: 'absolute',
                    bottom: '-200px',
                    left: index % 2 === 0 ? '65%' : '75%',
                    animation: `fragmentBurstRight${fragIndex} 12s linear ${index * 2.4}s infinite`,
                    color: 'rgba(0, 0, 0, 0.6)',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 100%)',
                    borderRadius: '50%',
                    border: '0.5px solid rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(4px)',
                    width: '34px',
                    height: '34px',
                    opacity: 0,
                    boxShadow: 'inset -4px -4px 8px rgba(255,255,255,0.4), 0 3px 6px rgba(0,0,0,0.15)'
                  }}
                />
              ))}
            </React.Fragment>
          );
        })}
      </div>
        
      {/* Working animations with immediate start */}
      <style>
        {`
 @keyframes floatUpLeft {
    0% { transform: translateY(5vh) scale(0.5); opacity: 1; }
    30% { opacity: 1; transform: translateY(-5vh) scale(0.7); }
    60% { opacity: 1; transform: translateY(-10vh) scale(0.8); }
    72% { opacity: 1; transform: translateY(-50vh) scale(1.2); }
    74% { opacity: 1; transform: translateY(-60vh) scale(1.4) rotate(-2deg); }
    78% { opacity: 1; transform: translateY(-70vh) scale(1.6) rotate(3deg); }
    81% { opacity: 0.7; transform: translateY(-76vh) scale(2) rotate(-3deg); }
    84% { opacity: 0; transform: translateY(-82vh) scale(0) rotate(0deg); }
    100% { opacity: 0; transform: translateY(-100vh) scale(0) rotate(0deg); }
   }
   
   @keyframes floatUpRight {
    0% { transform: translateY(5vh) scale(0.5); opacity: 1; }
    10% { transform: translateY(0vh) scale(0.6); opacity: 1; }
    20% { transform: translateY(-2vh) scale(0.65); opacity: 1; }
    30% { opacity: 1; transform: translateY(-5vh) scale(0.7); }
    60% { opacity: 1; transform: translateY(-10vh) scale(0.8); }
    72% { opacity: 1; transform: translateY(-50vh) scale(1.2); }
    74% { opacity: 1; transform: translateY(-60vh) scale(1.4) rotate(-2deg); }
    78% { opacity: 1; transform: translateY(-70vh) scale(1.6) rotate(3deg); }
    81% { opacity: 0.7; transform: translateY(-76vh) scale(2) rotate(-3deg); }
    84% { opacity: 0; transform: translateY(-82vh) scale(0) rotate(0deg); }
    100% { opacity: 0; transform: translateY(-100vh) scale(0) rotate(0deg); }
   }
   
   /* Fragment burst animations for left bubbles */
   @keyframes fragmentBurstLeft1 {
    0%, 92% { opacity: 0; transform: translateY(5vh) translateX(0) scale(0); }
    93% { opacity: 0; transform: translateY(-91vh) translateX(-20px) scale(1); }
    96% { opacity: 0; transform: translateY(-94vh) translateX(-35px) scale(0.8); }
    100% { opacity: 1; transform: translateY(-100vh) translateX(-50px) scale(1); }
   }
   
   @keyframes fragmentBurstLeft2 {
    0%, 92% { opacity: 0; transform: translateY(5vh) translateX(0) scale(0); }
    93% { opacity: 0; transform: translateY(-91vh) translateX(20px) scale(1); }
    96% { opacity: 0; transform: translateY(-94vh) translateX(40px) scale(0.7); }
    100% { opacity: 1; transform: translateY(-100vh) translateX(60px) scale(1); }
   }
   
   @keyframes fragmentBurstLeft3 {
    0%, 92% { opacity: 0; transform: translateY(5vh) translateX(0) scale(0); }
    93% { opacity: 0; transform: translateY(-91vh) translateX(-10px) scale(1); }
    96% { opacity: 0; transform: translateY(-96vh) translateX(-15px) scale(0.6); }
    100% { opacity: 1; transform: translateY(-103vh) translateX(-20px) scale(1); }
   }
   
   @keyframes fragmentBurstLeft4 {
    0%, 92% { opacity: 0; transform: translateY(5vh) translateX(0) scale(0); }
    93% { opacity: 0; transform: translateY(-91vh) translateX(15px) scale(1); }
    96% { opacity: 0; transform: translateY(-96vh) translateX(25px) scale(0.5); }
    100% { opacity: 1; transform: translateY(-103vh) translateX(35px) scale(1); }
   }
   
   /* Fragment burst animations for right bubbles */
   @keyframes fragmentBurstRight1 {
    0%, 92% { opacity: 0; transform: translateY(5vh) translateX(0) scale(0); }
    93% { opacity: 0; transform: translateY(-91vh) translateX(-20px) scale(1); }
    96% { opacity: 0; transform: translateY(-94vh) translateX(-35px) scale(0.8); }
    100% { opacity: 1; transform: translateY(-100vh) translateX(-50px) scale(1); }
   }
   
   @keyframes fragmentBurstRight2 {
    0%, 92% { opacity: 0; transform: translateY(5vh) translateX(0) scale(0); }
    93% { opacity: 0; transform: translateY(-91vh) translateX(20px) scale(1); }
    96% { opacity: 0; transform: translateY(-94vh) translateX(40px) scale(0.7); }
    100% { opacity: 1; transform: translateY(-100vh) translateX(60px) scale(1); }
   }
   
   @keyframes fragmentBurstRight3 {
    0%, 92% { opacity: 0; transform: translateY(5vh) translateX(0) scale(0); }
    93% { opacity: 0; transform: translateY(-91vh) translateX(-10px) scale(1); }
    96% { opacity: 0; transform: translateY(-96vh) translateX(-15px) scale(0.6); }
    100% { opacity: 1; transform: translateY(-103vh) translateX(-20px) scale(1); }
   }
   
   @keyframes fragmentBurstRight4 {
    0%, 92% { opacity: 0; transform: translateY(5vh) translateX(0) scale(0); }
    93% { opacity: 0; transform: translateY(-91vh) translateX(15px) scale(1); }
    96% { opacity: 0; transform: translateY(-96vh) translateX(25px) scale(0.5); }
    100% { opacity: 1; transform: translateY(-103vh) translateX(35px) scale(1); }
   }
   
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
            40%, 43% { transform: translate3d(0,-30px,0); }
            70% { transform: translate3d(0,-15px,0); }
            90% { transform: translate3d(0,-4px,0); }
          }
        `}
      </style>
    </div>
   );
};

export default MoodSelectedScreen;