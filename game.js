// Game State
const gameState = {
    currentScreen: 'mainMenu',
    disease: {
        type: 'bacteria',
        name: 'ВЛВШ',
        origin: 'china',
        startDate: new Date(2026, 1, 19),
        infectivity: 20,
        severity: 10,
        lethality: 5,
        dna: 0
    },
    countries: {
        china: { name: 'Китай', population: 1400000000, infected: 1000, dead: 0, color: '#ff6b6b' },
        india: { name: 'Индия', population: 1300000000, infected: 0, dead: 0, color: '#ff8e8e' },
        usa: { name: 'США', population: 331000000, infected: 0, dead: 0, color: '#ffaaaa' },
        russia: { name: 'Россия', population: 146000000, infected: 0, dead: 0, color: '#ffbbbb' },
        brazil: { name: 'Бразилия', population: 213000000, infected: 0, dead: 0, color: '#ffcccc' },
        australia: { name: 'Австралия', population: 25700000, infected: 0, dead: 0, color: '#ffdddd' },
        japan: { name: 'Япония', population: 125000000, infected: 0, dead: 0, color: '#ffeeee' },
        uk: { name: 'Великобритания', population: 67000000, infected: 0, dead: 0, color: '#ffd1d1' },
        egypt: { name: 'Египет', population: 104000000, infected: 0, dead: 0, color: '#ffb6b6' },
        sa: { name: 'ЮАР', population: 60000000, infected: 0, dead: 0, color: '#ff9f9f' }
    },
    world: {
        totalPopulation: 7800000000,
        totalInfected: 1000,
        totalDead: 0,
        cureProgress: 0
    },
    upgrades: {
        air: { purchased: false, cost: 25, effect: 0.2 },
        water: { purchased: false, cost: 30, effect: 0.15 },
        blood: { purchased: false, cost: 50, effect: 0.25 },
        cough: { purchased: false, cost: 20, effect: 0.1, lethality: 0.05 },
        fever: { purchased: false, cost: 30, effect: 0.15, lethality: 0.1 },
        necrosis: { purchased: false, cost: 60, effect: 0.2, lethality: 0.3 },
        resistHeat: { purchased: false, cost: 35, effect: 0.15 },
        resistCold: { purchased: false, cost: 35, effect: 0.15 },
        drugResist: { purchased: false, cost: 70, effect: 0.3 }
    },
    news: ['19.02.2026 - Первые случаи заражения в Китае'],
    gameTime: 0,
    selectedCountry: 'china',
    gameRunning: false
};

// Initialize game
function initGame() {
    updateAllDisplays();
    startGameLoop();
}

// Show different screens
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.menu-screen, .game-screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show selected screen
    document.getElementById(screenId).classList.remove('hidden');
    gameState.currentScreen = screenId;
}

// Select disease type
function selectDisease(type) {
    gameState.disease.type = type;
    showScreen('difficultySelect');
}

// Select difficulty
function selectDifficulty(difficulty) {
    // Apply difficulty modifiers
    switch(difficulty) {
        case 'easy':
            // Easy mode - slower cure, slower research
            break;
        case 'medium':
            // Medium mode - normal
            break;
        case 'hard':
            // Hard mode - faster cure, faster research
            gameState.world.cureProgress = 5;
            break;
    }
    showScreen('nameDisease');
}

// Start game
function startGame() {
    const diseaseName = document.getElementById('diseaseName').value;
    if (diseaseName) {
        gameState.disease.name = diseaseName;
    }
    
    // Initialize game state
    gameState.gameRunning = true;
    gameState.gameTime = 0;
    gameState.disease.dna = 50; // Starting DNA
    
    // Start with infection in origin country
    const origin = gameState.disease.origin;
    gameState.countries[origin].infected = 1000;
    gameState.world.totalInfected = 1000;
    
    // Update displays
    document.getElementById('diseaseNameDisplay').textContent = gameState.disease.name;
    
    // Show game screen
    showScreen('gameScreen');
    
    // Start game loop
    startGameLoop();
}

// Game loop
function startGameLoop() {
    setInterval(() => {
        if (!gameState.gameRunning) return;
        
        gameState.gameTime++;
        
        // Spread infection
        spreadInfection();
        
        // Generate DNA
        generateDNA();
        
        // Update cure progress
        updateCure();
        
        // Check events
        checkEvents();
        
        // Update displays
        updateAllDisplays();
    }, 1000);
}

// Spread infection
function spreadInfection() {
    const countries = Object.keys(gameState.countries);
    const infectivity = gameState.disease.infectivity / 100;
    
    for (let country of countries) {
        const data = gameState.countries[country];
        if (data.infected > 0) {
            // Spread within country
            const newInfections = Math.floor(data.infected * 0.1 * infectivity);
            const available = data.population - data.infected - data.dead;
            data.infected = Math.min(data.infected + newInfections, available);
            
            // Calculate deaths
            const lethality = gameState.disease.lethality / 100;
            const newDeaths = Math.floor(data.infected * lethality * 0.05);
            data.dead = Math.min(data.dead + newDeaths, data.population);
            data.infected = Math.max(data.infected - newDeaths, 0);
            
            // Spread to random countries
            if (Math.random() < 0.01 * infectivity) {
                const target = countries[Math.floor(Math.random() * countries.length)];
                if (target !== country) {
                    const targetData = gameState.countries[target];
                    if (targetData.infected < targetData.population - targetData.dead) {
                        const spreadAmount = Math.floor(data.infected * 0.001);
                        targetData.infected = Math.min(targetData.infected + spreadAmount, 
                                                       targetData.population - targetData.dead);
                        addNews(`${formatDate()} - ${gameState.disease.name} обнаружен в ${targetData.name}`);
                    }
                }
            }
        }
    }
    
    // Update totals
    gameState.world.totalInfected = Object.values(gameState.countries).reduce((sum, c) => sum + c.infected, 0);
    gameState.world.totalDead = Object.values(gameState.countries).reduce((sum, c) => sum + c.dead, 0);
}

// Generate DNA
function generateDNA() {
    const dnaGain = Math.floor(gameState.world.totalInfected / 100000) + 1;
    gameState.disease.dna += dnaGain;
}

// Update cure progress
function updateCure() {
    // Cure progresses based on world awareness and deaths
    const deathRate = gameState.world.totalDead / gameState.world.totalPopulation;
    const infectionRate = gameState.world.totalInfected / gameState.world.totalPopulation;
    
    gameState.world.cureProgress += (infectionRate * 0.1 + deathRate * 0.2);
    gameState.world.cureProgress = Math.min(gameState.world.cureProgress, 100);
}

// Check for random events
function checkEvents() {
    if (Math.random() < 0.001) { // Rare events
        const events = [
            'ВОЗ объявляет чрезвычайную ситуацию',
            'Ученые нашли возможную вакцину',
            'Паника в аэропортах мира',
            'Страны закрывают границы'
        ];
        const event = events[Math.floor(Math.random() * events.length)];
        addNews(`${formatDate()} - ${event}`);
    }
}

// Purchase upgrade
function purchaseUpgrade(upgradeId) {
    const upgrade = gameState.upgrades[upgradeId];
    if (!upgrade || upgrade.purchased) return;
    if (gameState.disease.dna < upgrade.cost) return;
    
    // Purchase
    gameState.disease.dna -= upgrade.cost;
    upgrade.purchased = true;
    
    // Apply effects
    if (upgrade.effect) {
        gameState.disease.infectivity += upgrade.effect * 10;
    }
    if (upgrade.lethality) {
        gameState.disease.lethality += upgrade.lethality * 10;
        gameState.disease.severity += upgrade.lethality * 10;
    }
    
    // Add news
    addNews(`${formatDate()} - Болезнь эволюционировала: ${getUpgradeName(upgradeId)}`);
    
    // Update displays
    updateAllDisplays();
}

// Get upgrade name
function getUpgradeName(id) {
    const names = {
        air: 'Воздушно-капельный путь',
        water: 'Водный путь',
        blood: 'Кровяной путь',
        cough: 'Кашель',
        fever: 'Лихорадка',
        necrosis: 'Некроз',
        resistHeat: 'Термоустойчивость',
        resistCold: 'Хладоустойчивость',
        drugResist: 'Лекарственная устойчивость'
    };
    return names[id] || id;
}

// Select country on map
function selectCountry(countryId) {
    gameState.selectedCountry = countryId;
    updateCountryInfo();
    
    // Highlight selected country
    document.querySelectorAll('.country').forEach(c => {
        c.classList.remove('selected');
    });
    document.getElementById(`country-${countryId}`).classList.add('selected');
}

// Update country info display
function updateCountryInfo() {
    const country = gameState.countries[gameState.selectedCountry];
    if (!country) return;
    
    document.getElementById('selectedCountryName').textContent = country.name;
    document.getElementById('countryPopulation').textContent = formatNumber(country.population);
    document.getElementById('countryInfected').textContent = formatNumber(country.infected);
    document.getElementById('countryDead').textContent = formatNumber(country.dead);
    
    const infectionRate = (country.infected + country.dead) / country.population * 100;
    document.getElementById('countryInfectionProgress').style.width = infectionRate + '%';
}

// Show game tab (world/disease/news/cure)
function showGameTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show selected tab
    document.querySelectorAll('.panel-tab').forEach(tabEl => {
        tabEl.classList.add('hidden');
    });
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
}

// Show evolution tree tab
function showTreeTab(tab) {
    // Update tree tabs
    document.querySelectorAll('.tree-tab').forEach(t => {
        t.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show selected tree content
    document.querySelectorAll('.tree-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`tree-${tab}`).classList.remove('hidden');
}

// Add news item
function addNews(message) {
    gameState.news.unshift(message);
    if (gameState.news.length > 20) {
        gameState.news.pop();
    }
    updateNewsFeed();
}

// Update all displays
function updateAllDisplays() {
    // Top bar stats
    document.getElementById('infectedTotal').textContent = formatNumber(gameState.world.totalInfected);
    document.getElementById('deadTotal').textContent = formatNumber(gameState.world.totalDead);
    document.getElementById('dnaAmount').textContent = gameState.disease.dna;
    
    // World stats
    const healthy = gameState.world.totalPopulation - gameState.world.totalInfected - gameState.world.totalDead;
    document.getElementById('healthyWorld').textContent = formatNumber(healthy);
    document.getElementById('infectedWorld').textContent = formatNumber(gameState.world.totalInfected);
    document.getElementById('deadWorld').textContent = formatNumber(gameState.world.totalDead);
    
    // Cure progress
    document.getElementById('cureProgress').style.width = gameState.world.cureProgress + '%';
    document.getElementById('cureProgressDetail').style.width = gameState.world.cureProgress + '%';
    document.getElementById('curePercent').textContent = Math.floor(gameState.world.cureProgress) + '%';
    
    // Disease stats
    document.getElementById('infectivityBar').style.width = gameState.disease.infectivity + '%';
    document.getElementById('severityBar').style.width = gameState.disease.severity + '%';
    document.getElementById('lethalityBar').style.width = gameState.disease.lethality + '%';
    
    // Update country map colors
    updateMapColors();
    
    // Update selected country info
    updateCountryInfo();
}

// Update map colors based on infection
function updateMapColors() {
    for (let countryId in gameState.countries) {
        const country = gameState.countries[countryId];
        const element = document.getElementById(`country-${countryId}`);
        if (element) {
            const infectionRate = (country.infected + country.dead) / country.population;
            if (infectionRate > 0.5) {
                element.classList.add('infected');
            } else {
                element.classList.remove('infected');
            }
        }
    }
}

// Update news feed
function updateNewsFeed() {
    const feed = document.getElementById('newsFeed');
    if (feed) {
        feed.innerHTML = gameState.news.map(news => 
            `<div class="news-item">${news}</div>`
        ).join('');
    }
}

// Format date
function formatDate() {
    const date = new Date(2026, 1, 19);
    date.setDate(date.getDate() + gameState.gameTime);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

// Format large numbers
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Initialize when page loads
window.onload = function() {
    initGame();
    
    // Set current date
    document.getElementById('gameDate').textContent = formatDate();
    
    // Select default country
    selectCountry('china');
};
