/**
 * Word Scramble Game
 * A fully responsive word puzzle game with extensive word library
 */

(function() {
    'use strict';

    // ==========================================
    // MASSIVE WORD DATABASE - 400+ words across 50 categories
    // ==========================================
    const wordList = [
        // ===== 1. EVERYDAY ESSENTIALS =====
        // Fruits
        "Apple", "Banana", "Pineapple", "Pomegranate", "Tangerine", "Orange", "Mango",
        "Strawberry", "Blueberry", "Raspberry", "Watermelon", "Grapefruit", "Lemon",
        "Lime", "Peach", "Cherry", "Grape", "Kiwi", "Papaya", "Coconut", "Avocado",
        
        // Vegetables
        "Carrot", "Broccoli", "Asparagus", "Eggplant", "Zucchini", "Spinach", "Lettuce",
        "Cabbage", "Onion", "Garlic", "Pepper", "Celery", "Potato", "Tomato", "Cucumber",
        "Radish", "Beet", "Cauliflower", "Artichoke", "Kale",
        
        // Drinks
        "Water", "Coffee", "Smoothie", "Lemonade", "Champagne", "Juice", "Milk", "Tea",
        "Espresso", "Cappuccino", "Milkshake", "Cocktail", "Soda", "Mocktail",
        
        // Kitchenware
        "Spoon", "Spatula", "Whisk", "Colander", "Grater", "Ladle", "Tongs", "Peeler",
        "Knife", "Fork", "Plate", "Bowl", "Cup", "Mug", "Pan", "Pot", "Skillet",
        
        // Clothing
        "Shirt", "Jacket", "Cardigan", "Waistcoat", "Trousers", "Jeans", "Dress",
        "Skirt", "Sweater", "Hoodie", "Blazer", "Coat", "Scarf", "Gloves", "Hat",
        "Socks", "Shoes", "Boots", "Sandals", "Sneakers",

        // ===== 2. NATURE & ENVIRONMENT =====
        // Wild Animals
        "Lion", "Tiger", "Elephant", "Kangaroo", "Rhinoceros", "Leopard", "Cheetah",
        "Giraffe", "Zebra", "Gorilla", "Panther", "Wolf", "Bear", "Fox", "Deer",
        "Moose", "Bison", "Hippo", "Jaguar", "Hyena",
        
        // Sea Creatures
        "Fish", "Shark", "Octopus", "Seahorse", "Jellyfish", "Dolphin", "Whale",
        "Stingray", "Lobster", "Crab", "Shrimp", "Squid", "Starfish", "Eel", "Turtle",
        "Clam", "Oyster", "Coral", "Seal", "Walrus",
        
        // Insects
        "Ant", "Spider", "Butterfly", "Scorpion", "Dragonfly", "Bee", "Wasp",
        "Beetle", "Cricket", "Grasshopper", "Moth", "Ladybug", "Firefly", "Centipede",
        "Caterpillar", "Mosquito", "Fly", "Cockroach", "Termite", "Mantis",
        
        // Weather
        "Rain", "Cloud", "Hurricane", "Blizzard", "Tornado", "Lightning", "Thunder",
        "Snow", "Hail", "Fog", "Frost", "Sunshine", "Breeze", "Wind", "Storm",
        "Cyclone", "Monsoon", "Rainbow", "Drought", "Flood",
        
        // Flowers
        "Rose", "Tulip", "Orchid", "Lavender", "Sunflower", "Daisy", "Lily",
        "Jasmine", "Marigold", "Hibiscus", "Carnation", "Daffodil", "Peony", "Iris",
        "Violet", "Chrysanthemum", "Magnolia", "Poppy", "Lotus", "Gardenia",

        // ===== 3. AROUND THE HOUSE =====
        // Furniture
        "Bed", "Chair", "Wardrobe", "Bookshelf", "Ottoman", "Table", "Couch", "Sofa",
        "Desk", "Dresser", "Cabinet", "Drawer", "Shelf", "Bench", "Stool", "Recliner",
        "Nightstand", "Armchair", "Cupboard", "Closet",
        
        // Appliances
        "Fridge", "Toaster", "Microwave", "Blender", "Dishwasher", "Oven", "Stove",
        "Freezer", "Kettle", "Mixer", "Juicer", "Vacuum", "Dryer", "Washer", "Heater",
        "Fan", "Aircon", "Iron", "Grill", "Cooker",
        
        // Tools
        "Hammer", "Wrench", "Screwdriver", "Chisel", "Pliers", "Saw", "Drill", "Level",
        "Clamp", "Tape", "Ruler", "Nail", "Screw", "Bolt", "Axe", "Shovel", "Rake",
        "Ladder", "Crowbar", "Sandpaper",
        
        // Stationery
        "Pen", "Pencil", "Notebook", "Stapler", "Highlighter", "Eraser", "Marker",
        "Scissors", "Ruler", "Folder", "Binder", "Envelope", "Glue", "Tape", "Clip",
        "Calculator", "Sharpener", "Compass", "Protractor", "Cutter",
        
        // Electronics
        "Phone", "Laptop", "Camera", "Keyboard", "Processor", "Monitor", "Printer",
        "Scanner", "Router", "Modem", "Tablet", "Speaker", "Headphone", "Charger",
        "Battery", "Remote", "Console", "Projector", "Webcam", "Mouse",

        // ===== 4. SCIENCE & SPACE =====
        // Space
        "Star", "Planet", "Galaxy", "Astronaut", "Telescope", "Satellite", "Asteroid",
        "Meteor", "Comet", "Nebula", "Cosmos", "Universe", "Moon", "Mars", "Venus",
        "Jupiter", "Saturn", "Neptune", "Orbit", "Rocket", "Eclipse", "Supernova",
        
        // Human Body (External)
        "Hand", "Elbow", "Eyebrow", "Shoulder", "Forehead", "Finger", "Thumb", "Wrist",
        "Ankle", "Knee", "Chin", "Cheek", "Nose", "Ear", "Lips", "Neck", "Chest",
        "Back", "Waist", "Hip",
        
        // Human Body (Internal)
        "Heart", "Brain", "Skeleton", "Intestine", "Pancreas", "Lung", "Liver", "Kidney",
        "Stomach", "Spine", "Skull", "Nerve", "Artery", "Blood", "Muscle", "Bone",
        "Tendon", "Tissue", "Vein", "Organ",
        
        // Geometry
        "Line", "Circle", "Triangle", "Pentagon", "Cylinder", "Square", "Rectangle",
        "Hexagon", "Octagon", "Oval", "Rhombus", "Trapezoid", "Parallelogram", "Arc",
        "Angle", "Vertex", "Radius", "Diameter", "Perimeter", "Area",
        
        // Science
        "Atom", "Molecule", "Gravity", "Reaction", "Laboratory", "Element", "Chemical",
        "Energy", "Force", "Mass", "Volume", "Density", "Velocity", "Friction", "Magnet",
        "Electric", "Current", "Voltage", "Circuit", "Electron", "Proton", "Neutron",

        // ===== 5. PLACES & TRAVEL =====
        // Transport
        "Car", "Plane", "Helicopter", "Submarine", "Ambulance", "Bus", "Train", "Taxi",
        "Truck", "Motorcycle", "Bicycle", "Scooter", "Boat", "Ship", "Yacht", "Ferry",
        "Tram", "Metro", "Rocket", "Spaceship",
        
        // Buildings
        "House", "School", "Hospital", "Library", "Skyscraper", "Church", "Temple",
        "Mosque", "Castle", "Palace", "Museum", "Theater", "Stadium", "Airport",
        "Station", "Mall", "Hotel", "Restaurant", "Factory", "Warehouse",
        
        // Countries
        "India", "France", "Australia", "Switzerland", "Argentina", "Germany", "Italy",
        "Spain", "Portugal", "Brazil", "Mexico", "Canada", "Japan", "China", "Korea",
        "Thailand", "Egypt", "Morocco", "Greece", "Turkey",
        
        // Cities
        "London", "Tokyo", "Berlin", "Istanbul", "Singapore", "Paris", "Rome", "Madrid",
        "Amsterdam", "Vienna", "Stockholm", "Oslo", "Athens", "Cairo", "Mumbai",
        "Sydney", "Toronto", "Chicago", "Miami", "Dubai",
        
        // Geography
        "River", "Mountain", "Island", "Peninsula", "Plateau", "Ocean", "Valley",
        "Desert", "Forest", "Jungle", "Canyon", "Cliff", "Beach", "Lake", "Waterfall",
        "Glacier", "Volcano", "Cave", "Reef", "Oasis",

        // ===== 6. HOBBIES & ENTERTAINMENT =====
        // Sports
        "Ball", "Tennis", "Archery", "Basketball", "Badminton", "Football", "Soccer",
        "Baseball", "Volleyball", "Cricket", "Rugby", "Hockey", "Golf", "Boxing",
        "Wrestling", "Karate", "Judo", "Fencing", "Cycling", "Swimming",
        
        // Music
        "Drum", "Guitar", "Orchestra", "Symphony", "Saxophone", "Piano", "Violin",
        "Trumpet", "Flute", "Clarinet", "Cello", "Harp", "Banjo", "Ukulele", "Harmonica",
        "Accordion", "Keyboard", "Bass", "Melody", "Rhythm",
        
        // Movies
        "Actor", "Script", "Cinema", "Director", "Producer", "Actress", "Soundtrack",
        "Album", "Concert", "Drama", "Comedy", "Horror", "Action", "Romance", "Thriller",
        "Fantasy", "Animation", "Documentary", "Musical", "Opera",
        
        // Gaming
        "Level", "Quest", "Strategy", "Controller", "Joystick", "Console", "Arcade",
        "Character", "Player", "Adventure", "Puzzle", "Platform", "Racing", "Mission",
        "Challenge", "Achievement", "Score", "Multiplayer", "Campaign", "Tutorial",
        
        // Art
        "Paint", "Canvas", "Sculpture", "Portrait", "Gallery", "Sketch", "Drawing",
        "Painting", "Mosaic", "Mural", "Collage", "Pottery", "Ceramic", "Woodwork",
        "Origami", "Calligraphy", "Photography", "Design", "Illustration", "Craft",

        // ===== 7. PEOPLE & SOCIETY =====
        // Jobs
        "Cook", "Nurse", "Engineer", "Architect", "Journalist", "Doctor", "Teacher",
        "Lawyer", "Judge", "Police", "Firefighter", "Pilot", "Captain", "Chef", "Baker",
        "Farmer", "Carpenter", "Plumber", "Electrician", "Mechanic",
        
        // Emotions
        "Happy", "Brave", "Jealous", "Gratitude", "Melancholy", "Excited", "Nervous",
        "Anxious", "Calm", "Peaceful", "Joyful", "Content", "Grateful", "Hopeful",
        "Frustrated", "Surprised", "Amazed", "Confused", "Curious", "Proud",
        
        // Family
        "Mother", "Sister", "Cousin", "Nephew", "Ancestor", "Father", "Brother",
        "Uncle", "Aunt", "Niece", "Grandma", "Grandpa", "Daughter", "Son", "Parent",
        "Child", "Spouse", "Sibling", "Family", "Relative",
        
        // Languages
        "English", "Spanish", "Chinese", "Sanskrit", "Portuguese", "French", "German",
        "Italian", "Japanese", "Korean", "Arabic", "Hindi", "Russian", "Greek", "Latin",
        "Dutch", "Swedish", "Polish", "Turkish", "Hebrew",
        
        // Subjects
        "Math", "History", "Physics", "Chemistry", "Philosophy", "Biology", "Geography",
        "Literature", "Art", "Music", "Economics", "Psychology", "Sociology", "Astronomy",
        "Geology", "Botany", "Zoology", "Anatomy", "Algebra", "Calculus",

        // ===== 8. TIME & MEASUREMENTS =====
        // Days
        "Monday", "Friday", "Saturday", "Wednesday", "Tomorrow", "Tuesday", "Thursday",
        "Sunday", "Today", "Yesterday", "Weekend", "Weekday", "Morning", "Evening", "Night",
        
        // Months
        "March", "August", "October", "February", "September", "January", "April", "May",
        "June", "July", "November", "December",
        
        // Seasons
        "Spring", "Summer", "Autumn", "Winter", "Solstice", "Equinox", "Harvest",
        "Monsoon", "Dry", "Wet", "Fall", "Season",
        
        // Units
        "Meter", "Liter", "Gram", "Kilowatt", "Hectare", "Inch", "Foot", "Yard", "Mile",
        "Ounce", "Pound", "Gallon", "Celsius", "Fahrenheit", "Kelvin", "Watt", "Volt",
        "Ampere", "Hertz", "Newton",
        
        // Time
        "Second", "Minute", "Century", "Decade", "Millennium", "Hour", "Day", "Week",
        "Month", "Year", "Era", "Epoch", "Instant", "Moment", "Duration",

        // ===== 9. ADVANCED CONCEPTS =====
        // Adjectives (Positive)
        "Brave", "Vibrant", "Radiant", "Spectacular", "Magnificent", "Beautiful",
        "Gorgeous", "Wonderful", "Fantastic", "Incredible", "Amazing", "Awesome",
        "Brilliant", "Excellent", "Outstanding", "Remarkable", "Extraordinary",
        
        // Adjectives (Mysterious)
        "Dark", "Secret", "Enormous", "Mysterious", "Cryptic", "Hidden", "Obscure",
        "Enigmatic", "Shadowy", "Unknown", "Arcane", "Mystic", "Eerie", "Uncanny",
        "Strange", "Weird", "Peculiar", "Bizarre", "Unusual", "Rare",
        
        // Metals
        "Gold", "Silver", "Copper", "Platinum", "Aluminum", "Iron", "Steel", "Bronze",
        "Brass", "Titanium", "Nickel", "Zinc", "Lead", "Tin", "Mercury", "Chromium",
        "Tungsten", "Cobalt", "Magnesium", "Uranium",
        
        // Jewelry
        "Ring", "Watch", "Necklace", "Bracelet", "Diamond", "Earring", "Pendant",
        "Brooch", "Anklet", "Tiara", "Crown", "Gem", "Pearl", "Ruby", "Sapphire",
        "Emerald", "Topaz", "Opal", "Amethyst", "Garnet",
        
        // Virtues
        "Honor", "Trust", "Wisdom", "Patience", "Integrity", "Courage", "Kindness",
        "Loyalty", "Honesty", "Humility", "Compassion", "Generosity", "Respect",
        "Justice", "Mercy", "Faith", "Hope", "Love", "Grace", "Virtue",

        // ===== 10. FOOD & LIFESTYLE =====
        // Desserts
        "Cake", "Cookie", "Pudding", "Brownie", "Cheesecake", "Pie", "Donut", "Muffin",
        "Cupcake", "Tart", "Pastry", "Croissant", "Eclair", "Macaron", "Truffle",
        "Fudge", "Gelato", "Sorbet", "Parfait", "Souffle",
        
        // Birds
        "Duck", "Eagle", "Penguin", "Flamingo", "Peacock", "Owl", "Hawk", "Parrot",
        "Swan", "Goose", "Sparrow", "Robin", "Cardinal", "Hummingbird", "Crow",
        "Raven", "Pigeon", "Dove", "Pelican", "Toucan",
        
        // Trees
        "Oak", "Pine", "Willow", "Redwood", "Mahogany", "Maple", "Birch", "Cedar",
        "Elm", "Ash", "Walnut", "Cherry", "Palm", "Cypress", "Spruce", "Fir",
        "Bamboo", "Banyan", "Eucalyptus", "Sequoia",
        
        // Directions
        "North", "South", "Vertical", "Horizontal", "Diagonal", "East", "West",
        "Up", "Down", "Left", "Right", "Forward", "Backward", "Upward", "Downward",
        "Sideways", "Clockwise", "Counter", "Parallel", "Perpendicular",
        
        // Shapes (3D)
        "Cube", "Sphere", "Pyramid", "Cone", "Ellipsoid", "Prism", "Cylinder",
        "Tetrahedron", "Octahedron", "Dodecahedron", "Torus", "Hemisphere", "Cuboid",
        "Capsule", "Frustum", "Polyhedron", "Solid", "Surface", "Edge", "Face"
    ];

    // ==========================================
    // GAME STATE
    // ==========================================
    const gameState = {
        currentWord: '',
        scrambledWord: '',
        score: 0,
        streak: 0,
        hintsUsedThisWord: 0,
        revealedLetters: [],
        soundEnabled: true,
        usedWords: new Set(),
        isWaitingForNextWord: false
    };

    // ==========================================
    // AUDIO CONTEXT (Web Audio API for sounds)
    // ==========================================
    let audioContext = null;

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playSound(type) {
        if (!gameState.soundEnabled) return;
        
        try {
            initAudio();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch(type) {
                case 'correct':
                    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.4);
                    break;
                case 'incorrect':
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                    break;
                case 'skip':
                    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.15);
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                    break;
                case 'hint':
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.15);
                    break;
                case 'click':
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.05);
                    break;
                case 'streakLost':
                    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.15);
                    oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.3);
                    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.4);
                    break;
            }
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    const elements = {
        scrambledWord: document.getElementById('scrambled-word'),
        answerInput: document.getElementById('answer-input'),
        feedback: document.getElementById('feedback'),
        score: document.getElementById('score'),
        streak: document.getElementById('streak'),
        submitBtn: document.getElementById('submit-btn'),
        hintBtn: document.getElementById('hint-btn'),
        skipBtn: document.getElementById('skip-btn'),
        resetBtn: document.getElementById('reset-btn'),
        soundToggle: document.getElementById('sound-toggle'),
        hintDisplay: document.getElementById('hint-display'),
        hintText: document.getElementById('hint-text'),
        celebration: document.getElementById('celebration')
    };

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    /**
     * Scramble a word ensuring it's different from the original
     */
    function scrambleWord(word) {
        const letters = word.toUpperCase().split('');
        let scrambled = letters.slice();
        let attempts = 0;
        const maxAttempts = 100;

        do {
            for (let i = scrambled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
            }
            attempts++;
        } while (scrambled.join('') === word.toUpperCase() && attempts < maxAttempts);

        return scrambled.join('');
    }

    /**
     * Display the scrambled word with letter tiles
     */
    function displayScrambledWord(scrambled) {
        elements.scrambledWord.innerHTML = '';
        
        scrambled.split('').forEach((letter, index) => {
            const tile = document.createElement('div');
            tile.className = 'letter-tile';
            tile.textContent = letter;
            tile.style.animationDelay = `${index * 0.05}s`;
            elements.scrambledWord.appendChild(tile);
        });
    }

    /**
     * Select a new random word
     */
    function selectNewWord() {
        gameState.isWaitingForNextWord = false;
        
        // Filter out recently used words
        const unusedWords = wordList.filter(w => !gameState.usedWords.has(w.toUpperCase()));
        
        // If we've used most words, reset the used words set
        if (unusedWords.length < 10) {
            gameState.usedWords.clear();
        }

        const wordPool = unusedWords.length > 0 ? unusedWords : wordList;
        const selected = wordPool[Math.floor(Math.random() * wordPool.length)];
        
        gameState.currentWord = selected.toUpperCase();
        gameState.scrambledWord = scrambleWord(gameState.currentWord);
        gameState.hintsUsedThisWord = 0;
        gameState.revealedLetters = [];
        gameState.usedWords.add(gameState.currentWord);

        // Update UI
        displayScrambledWord(gameState.scrambledWord);
        elements.answerInput.value = '';
        elements.feedback.textContent = '';
        elements.feedback.className = 'feedback';
        elements.hintDisplay.classList.add('hidden');
        elements.hintBtn.disabled = false;
        elements.answerInput.focus();
        
        // Re-enable buttons
        elements.submitBtn.disabled = false;
        elements.skipBtn.disabled = false;
    }

    /**
     * Check the player's answer
     */
    function checkAnswer() {
        if (gameState.isWaitingForNextWord) return;
        
        const answer = elements.answerInput.value.trim().toUpperCase().replace(/\s+/g, '');
        
        if (!answer) {
            showFeedback('Please enter an answer!', 'incorrect');
            playSound('incorrect');
            return;
        }

        if (answer === gameState.currentWord) {
            // Correct answer
            const basePoints = 10;
            const lengthBonus = Math.floor(gameState.currentWord.length / 2);
            const hintPenalty = gameState.hintsUsedThisWord * 2;
            const streakBonus = Math.floor(gameState.streak / 3);
            const points = Math.max(basePoints + lengthBonus + streakBonus - hintPenalty, 1);
            
            gameState.score += points;
            gameState.streak++;
            
            updateScore();
            showFeedback(`✓ Correct! +${points} points`, 'correct');
            playSound('correct');
            showCelebration();
            
            gameState.isWaitingForNextWord = true;
            setTimeout(selectNewWord, 1500);
        } else {
            // Incorrect answer - streak continues, just wrong guess
            showFeedback('✗ Try again!', 'incorrect');
            playSound('incorrect');
            elements.answerInput.select();
        }
    }

    /**
     * Show feedback message
     */
    function showFeedback(message, type) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback ${type}`;
    }

    /**
     * Update score display
     */
    function updateScore() {
        elements.score.textContent = gameState.score;
        elements.streak.textContent = gameState.streak;
    }

    /**
     * Reveal a hint (one letter at a time)
     * First hint is free, second hint resets streak
     */
    function revealHint() {
        if (gameState.isWaitingForNextWord) return;
        
        const word = gameState.currentWord;
        const availableIndices = [];
        
        for (let i = 0; i < word.length; i++) {
            if (!gameState.revealedLetters.includes(i)) {
                availableIndices.push(i);
            }
        }

        if (availableIndices.length === 0) {
            showFeedback('No more hints available!', 'skip');
            elements.hintBtn.disabled = true;
            return;
        }

        // Check if this is the second+ hint - reset streak
        if (gameState.hintsUsedThisWord >= 1 && gameState.streak > 0) {
            gameState.streak = 0;
            updateScore();
            showFeedback('💡 Hint used - Streak reset!', 'skip');
            playSound('streakLost');
        } else {
            playSound('hint');
        }

        // Reveal a random letter
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        gameState.revealedLetters.push(randomIndex);
        gameState.revealedLetters.sort((a, b) => a - b);
        gameState.hintsUsedThisWord++;

        // Build hint string
        let hintString = '';
        for (let i = 0; i < word.length; i++) {
            if (gameState.revealedLetters.includes(i)) {
                hintString += word[i];
            } else {
                hintString += '_';
            }
            hintString += ' ';
        }

        elements.hintText.textContent = hintString.trim();
        elements.hintDisplay.classList.remove('hidden');

        // Disable hint button if all letters revealed
        if (gameState.revealedLetters.length >= word.length - 1) {
            elements.hintBtn.disabled = true;
        }
    }

    /**
     * Skip the current word - resets streak
     */
    function skipWord() {
        if (gameState.isWaitingForNextWord) return;
        
        gameState.streak = 0;
        updateScore();
        showFeedback(`Skipped! The word was: ${gameState.currentWord}`, 'skip');
        playSound('skip');
        
        // Disable buttons during wait
        gameState.isWaitingForNextWord = true;
        elements.submitBtn.disabled = true;
        elements.skipBtn.disabled = true;
        elements.hintBtn.disabled = true;
        
        // Wait 5 seconds before showing next word
        setTimeout(selectNewWord, 5000);
    }

    /**
     * Reset the entire game
     */
    function resetGame() {
        gameState.score = 0;
        gameState.streak = 0;
        gameState.usedWords.clear();
        gameState.isWaitingForNextWord = false;
        updateScore();
        playSound('click');
        selectNewWord();
    }

    /**
     * Toggle sound on/off
     */
    function toggleSound() {
        gameState.soundEnabled = !gameState.soundEnabled;
        
        const soundOn = elements.soundToggle.querySelector('.sound-on');
        const soundOff = elements.soundToggle.querySelector('.sound-off');
        
        soundOn.classList.toggle('hidden', !gameState.soundEnabled);
        soundOff.classList.toggle('hidden', gameState.soundEnabled);
        
        if (gameState.soundEnabled) {
            playSound('click');
        }
    }

    /**
     * Show celebration animation
     */
    function showCelebration() {
        elements.celebration.classList.remove('hidden');
        
        const confetti = elements.celebration.querySelector('.confetti');
        confetti.innerHTML = '';
        
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                top: -20px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                animation: confettiFall ${Math.random() * 2 + 1}s ease-out forwards;
                animation-delay: ${Math.random() * 0.5}s;
            `;
            confetti.appendChild(particle);
        }

        if (!document.getElementById('confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            elements.celebration.classList.add('hidden');
        }, 2000);
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    function initEventListeners() {
        elements.submitBtn.addEventListener('click', () => {
            playSound('click');
            checkAnswer();
        });

        elements.hintBtn.addEventListener('click', revealHint);

        elements.skipBtn.addEventListener('click', () => {
            playSound('click');
            skipWord();
        });

        elements.resetBtn.addEventListener('click', resetGame);

        elements.soundToggle.addEventListener('click', toggleSound);

        elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                playSound('click');
                checkAnswer();
            }
        });

        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('keypress', initAudio, { once: true });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                window.scrollTo(0, 0);
            }, 250);
        });
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    function init() {
        initEventListeners();
        selectNewWord();
        
        setTimeout(() => {
            elements.answerInput.focus();
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
