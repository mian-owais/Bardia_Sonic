// Script to create placeholder audio files
// This script will create empty audio files for testing

const fs = require('fs');
const path = require('path');

// List of music files needed
const musicFiles = [
  'curiosity.mp3',
  'motivational.mp3',
  'instructional.mp3',
  'philosophical.mp3',
  'happy.mp3',
  'optimistic.mp3',
  'sad.mp3',
  'pessimistic.mp3',
  'heroic.mp3',
  'horror.mp3',
  'beat.mp3',
  'newspaper.mp3',
  'nostalgic.mp3'
];

// Effects directories and files
const effectsDirectories = {
  'weather': [
    'thunder.mp3',
    'rain.mp3',
    'sunny_birds.mp3',
    'night_frogs.mp3',
    'gentle_breeze.mp3',
    'blizzard.mp3'
  ],
  'misc': [
    'market.mp3',
    'steps.mp3',
    'knocking.mp3',
    'glass_breaking.mp3',
    'water.mp3',
    'cup_filling.mp3',
    'deep_breath.mp3',
    'doorbell.mp3',
    'phone.mp3',
    'car_engine.mp3',
    'crowd.mp3'
  ],
  'animals': [
    'birds.mp3',
    'dog.mp3',
    'horse.mp3',
    'cat.mp3',
    'owl.mp3'
  ],
  'beats': [
    'drumbeat.mp3',
    'strings.mp3',
    'dramatic.mp3',
    'percussion.mp3'
  ],
  'machines': [
    'factory.mp3',
    'spaceship.mp3',
    'gunshot.mp3'
  ]
};

// Create music directory if it doesn't exist
const musicDir = path.join(__dirname, 'music');
if (!fs.existsSync(musicDir)) {
  fs.mkdirSync(musicDir, { recursive: true });
  console.log('Created music directory');
}

// Create music placeholder files
for (const file of musicFiles) {
  const filePath = path.join(musicDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, ''); // Empty file
    console.log(`Created ${file}`);
  }
}

// Create effects directories and files
const effectsBaseDir = path.join(__dirname, 'effects');
if (!fs.existsSync(effectsBaseDir)) {
  fs.mkdirSync(effectsBaseDir, { recursive: true });
  console.log('Created effects base directory');
}

// Create each effect category and its files
Object.keys(effectsDirectories).forEach(dirName => {
  const categoryDir = path.join(effectsBaseDir, dirName);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
    console.log(`Created ${dirName} directory`);
  }
  
  // Create files for this category
  for (const file of effectsDirectories[dirName]) {
    const filePath = path.join(categoryDir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, ''); // Empty file
      console.log(`Created ${dirName}/${file}`);
    }
  }
});

console.log('Placeholder creation complete'); 