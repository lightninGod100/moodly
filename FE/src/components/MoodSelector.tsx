// src/components/MoodSelector.tsx
import React from 'react';

type Mood = {
  name: string;
  emoji: string;
  bgColor: string;
  hoverColor: string;
};

interface MoodSelectorProps {
  selectedMood: string | null;
  onSelectMood: (mood: string) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelectMood }) => {
  const moods: Mood[] = [
    { name: 'Excited', emoji: '😃', bgColor: 'bg-yellow-300', hoverColor: 'hover:bg-yellow-400' },
    { name: 'Happy', emoji: '😊', bgColor: 'bg-yellow-200', hoverColor: 'hover:bg-yellow-300' },
    { name: 'Calm', emoji: '😌', bgColor: 'bg-blue-200', hoverColor: 'hover:bg-blue-300' },
    { name: 'Tired', emoji: '😴', bgColor: 'bg-purple-200', hoverColor: 'hover:bg-purple-300' },
    { name: 'Anxious', emoji: '😰', bgColor: 'bg-purple-300', hoverColor: 'hover:bg-purple-400' },
    { name: 'Angry', emoji: '😠', bgColor: 'bg-red-300', hoverColor: 'hover:bg-red-400' },
    { name: 'Sad', emoji: '😢', bgColor: 'bg-blue-300', hoverColor: 'hover:bg-blue-400' },
  ];

  return (
     <div>
      <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">How Are You Feeling Right Now?</h1>
      <p className="text-2xl md:text-3xl text-center mb-10">Select a Mood</p>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-6">
        {moods.map((mood) => (
          <button
            key={mood.name}
            onClick={() => {
              console.log('Button clicked:', mood.name);
              onSelectMood(mood.name)
            }}
            className={`
              border-2 border-gray-300 bg-transparent hover:border-gray-400
              ${selectedMood === mood.name ? 'ring-2 ring-blue-500' : ''}
              rounded-lg p-4 flex flex-col items-center transition-all min-w-[100px]
            `}
          >
            <span>{mood.emoji}</span>
            <span>{mood.name}</span>
          </button>
        ))}
      </div>
      
      {selectedMood && (
        <div className="mt-6 text-center">
          <p >You're feeling <span>{selectedMood}</span></p>
        </div>
      )}
    </div>
  );
};

export default MoodSelector;