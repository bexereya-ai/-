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
        dna: 50
    },
    countries: {
        china: { name: 'Китай', population: 1400000000, infected: 1000, dead: 0 },
        india: { name: 'Индия', population: 1300000000, infected: 0, dead: 0 },
        usa: { name: 'США', population: 331000000, infected: 0, dead: 0 },
        russia: { name: 'Россия', population: 146000000, infected: 0, dead: 0 },
        brazil: { name: 'Бразилия', population: 213000000, infected: 0, dead: 0 },
        australia: { name: 'Австралия', population: 25700000, infected: 0, dead: 0 },
        japan: { name: 'Япония', population: 125000000, infected: 0, dead: 0 },
        uk: { name: 'Великобритания', population: 67000000, infected: 0, dead: 0 },
        egypt: { name: 'Египет', population: 104000000, infected: 0, dead: 0 },
        sa: { name: 'ЮАР', population: 60000000, infected: 0, dead: 0 }
    },
    world: {
        totalPopulation: 7800000000,
        totalInfected: 1000,
        totalDead: 0,
        cureProgress: 0
    },
    upgrades: {
        air: { purchased: false, cost: 25, effect: 0.2, name: 'Воздушно-капельный' },
        water: { purchased: false, cost: 30, effect: 0.15, name: 'Водный путь' },
        blood: { purchased: false, cost: 50, effect: 0.25, name: 'Кровяной путь' },
        cough: { purchased: false, cost: 20, effect: 0.1, lethality: 0.05, name: 'Кашель' },
        fever: { purchased: false, cost: 30, effect: 0.15, lethality: 0.1, name: 'Лихорадка' },
        necrosis: { purchased: false, cost: 60, effect: 0.2, lethality: 0.3, name: 'Некроз' },
        resistHeat: { purchased: false, cost: 35, effect: 0.15, name: 'Термоустойчивость' },
        resistCold: { purchased: false, cost: 35, effect: 0.15, name: 'Хладоустойчивость' },
        drugResist: { purchased: false, cost: 70, effect: 0.3, name: 'Лекарственная устойчивость' }
    },
    news: ['19.02.2026 - Первые случаи заражения в Китае'],
    gameTime: 0,
    selectedCountry: 'china',
    gameRunning: false,
    gameInterval: null
};

// Initialize game
function initGame() {
    console.log('Game initialized');
    updateAllDisplays();
    
    // Set current date
    const dateElement = document.getElementById('gameDate');
    if (dateElement) {
        dateElement.textContent = formatDate();
    }
    
    // Select default country
    selectCountry('china');
}

// Show different screens
window.showScreen = function(screenId) {
    console.log('Showing screen:', screenId);
    
    // Hide all screens
    const menuScreens = document.querySelectorAll('.menu-screen');
    const gameScreens = document.querySelectorAll('.game-screen');
    
    menuScreens.forEach(screen => {
        screen.classList.add('hidden');
    });
    
    gameScreens.forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show selected screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        gameState.currentScreen = screenId;
    } else {
        console.error('Screen not found:', screenId);
    }
}

// Select disease type
window.selectDisease = function(type) {
    console.log('Selected disease:', type);
    gameState.disease.type = type;
    showScreen('difficultySelect');
}

// Select difficulty
window.selectDifficulty = function(difficulty) {
    console.log('Selected difficulty:', difficulty);
    
    // Apply difficulty modifiers
    switch(difficulty) {
        case 'easy':
            gameState.disease.dna = 100;
            break;
        case 'medium':
            gameState.disease.dna = 50;
            gameState.world.cureProgress = 2;
            break;
        case 'hard':
            gameState.disease.dna = 25;
            gameState.world.cureProgress = 5;
            break;
    }
    showScreen('nameDisease');
}

// Start game
window.startGame = function() {
    console.log('Starting game');
    
    const diseaseNameInput = document.getElementById('diseaseName');
    if (diseaseNameInput && diseaseNameInput.value) {
        gameState.disease.name = diseaseNameInput.value;
    }
    
    // Initialize game state
    gameState.gameRunning = true;
    gameState.gameTime = 0;
    
    // Start with infection in origin country
    const origin = gameState.disease.origin;
    gameState.countries[origin].infected = 1000;
    gameState.world.totalInfected = 1000;
    
    // Update displays
    const diseaseNameDisplay = document.getElementById('diseaseNameDisplay');
    if (diseaseNameDisplay) {
        diseaseNameDisplay.textContent = gameState.disease.name;
    }
    
    // Show game screen
    showScreen('gameScreen');
    
    // Clear existing interval if any
    if (gameState.gameInterval) {
        clearInterval(gameState.gameInterval);
    }
    
    // Start game loop
    gameState.gameInterval = setInterval(() => {
        if (!gameState.gameRunning) return;
        
        gameState.gameTime++;
        
        // Update date
        const dateElement = document.getElementById('gameDate');
        if (dateElement) {
            dateElement.textContent = formatDate();
        }
        
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
    const deathRate = gameState.world.totalDead / gameState.world.totalPopulation;
    const infectionRate = gameState.world.totalInfected / gameState.world.totalPopulation;
    
    gameState.world.cureProgress += (infectionRate * 0.1 + deathRate * 0.2);
    gameState.world.cureProgress = Math.min(gameState.world.cureProgress, 100);
}

// Check for random events
function checkEvents() {
    if (Math.random() < 0.001) {
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
window.purchaseUpgrade = function(upgradeId) {
    console.log('Purchasing upgrade:', upgradeId);
    
    const upgrade = gameState.upgrades[upgradeId];
    if (!upgrade) {
        console.error('Upgrade not found:', upgradeId);
        return;
    }
    
    if (upgrade.purchased) {
        addNews(`❌ ${upgrade.name} уже куплен`);
        return;
    }
    
    if (gameState.disease.dna < upgrade.cost) {
        addNews(`❌ Недостаточно ДНК для ${upgrade.name}`);
        return;
    }
    
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
    addNews(`✅ Эволюция: ${upgrade.name} (${upgrade.cost} ДНК)`);
    
    // Update displays
    updateAllDisplays();
    
    // Visual feedback
    const upgradeElement = event?.target?.closest('.upgrade-item');
    if (upgradeElement) {
        upgradeElement.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
            upgradeElement.style.backgroundColor = '';
        }, 200);
    }
}

// Select country on map
window.selectCountry = function(countryId) {
    console.log('Selected country:', countryId);
    
    gameState.selectedCountry = countryId;
    updateCountryInfo();
    
    // Highlight selected country
    document.querySelectorAll('.country').forEach(c => {
        c.classList.remove('selected');
        c.style.stroke = '#4ecdc4';
        c.style.strokeWidth = '1';
    });
    
    const selectedElement = document.getElementById(`country-${countryId}`);
    if (selectedElement) {
        selectedElement.classList.add('selected');
        selectedElement.style.stroke = '#ff6b6b';
        selectedElement.style.strokeWidth = '3';
    }
}

// Update country info display
function updateCountryInfo() {
    const country = gameState.countries[gameState.selectedCountry];
    if (!country) return;
    
    const nameElement = document.getElementById('selectedCountryName');
    const popElement = document.getElementById('countryPopulation');
    const infElement = document.getElementById('countryInfected');
    const deadElement = document.getElementById('countryDead');
    const progressElement = document.getElementById('countryInfectionProgress');
    
    if (nameElement) nameElement.textContent = country.name;
    if (popElement) popElement.textContent = formatNumber(country.population);
    if (infElement) infElement.textContent = formatNumber(country.infected);
    if (deadElement) deadElement.textContent = formatNumber(country.dead);
    
    if (progressElement) {
        const infectionRate = ((country.infected + country.dead) / country.population) * 100;
        progressElement.style.width = infectionRate + '%';
    }
}

// Show game tab
window.showGameTab = function(tab) {
    console.log('Showing game tab:', tab);
    
    // Update tab buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the clicked button
    const buttons = document.querySelectorAll('.nav-btn');
    for (let btn of buttons) {
        if (btn.textContent.toLowerCase().includes(tab) || 
            (tab === 'world' && btn.textContent === 'Мир') ||
            (tab === 'disease' && btn.textContent === 'Болезнь') ||
            (tab === 'news' && btn.textContent === 'News') ||
            (tab === 'cure' && btn.textContent === 'Лекарство')) {
            btn.classList.add('active');
        }
    }
    
    // Show selected tab
    document.querySelectorAll('.panel-tab').forEach(tabEl => {
        tabEl.classList.add('hidden');
    });
    
    const targetTab = document.getElementById(`tab-${tab}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
}

// Show evolution tree tab
window.showTreeTab = function(tab) {
    console.log('Showing tree tab:', tab);
    
    // Update tree tabs
    document.querySelectorAll('.tree-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    // Find and activate the clicked tab
    const tabs = document.querySelectorAll('.tree-tab');
    for (let t of tabs) {
        if (t.textContent.toLowerCase().includes(tab)) {
            t.classList.add('active');
        }
    }
    
    // Show selected tree content
    document.querySelectorAll('.tree-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const targetContent = document.getElementById(`tree-${tab}`);
    if (targetContent) {
        targetContent.classList.remove('hidden');
    }
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
    const infectedTotal = document.getElementById('infectedTotal');
    const deadTotal = document.getElementById('deadTotal');
    const dnaAmount = document.getElementById('dnaAmount');
    
    if (infectedTotal) infectedTotal.textContent = formatNumber(gameState.world.totalInfected);
    if (deadTotal) deadTotal.textContent = formatNumber(gameState.world.totalDead);
    if (dnaAmount) dnaAmount.textContent = gameState.disease.dna;
    
    // World stats
    const healthy = gameState.world.totalPopulation - gameState.world.totalInfected - gameState.world.totalDead;
    const healthyWorld = document.getElementById('healthyWorld');
    const infectedWorld = document.getElementById('infectedWorld');
    const deadWorld = document.getElementById('deadWorld');
    
    if (healthyWorld) healthyWorld.textContent = formatNumber(healthy);
    if (infectedWorld) infectedWorld.textContent = formatNumber(gameState.world.totalInfected);
    if (deadWorld) deadWorld.textContent = formatNumber(gameState.world.totalDead);
    
    // Cure progress
    const cureProgress = document.getElementById('cureProgress');
    const cureProgressDetail = document.getElementById('cureProgressDetail');
    const curePercent = document.getElementById('curePercent');
    const cureStatus = document.getElementById('cureStatus');
    const cureTime = document.getElementById('cureTime');
    
    if (cureProgress) cureProgress.style.width = gameState.world.cureProgress + '%';
    if (cureProgressDetail) cureProgressDetail.style.width = gameState.world.cureProgress + '%';
    if (curePercent) curePercent.textContent = Math.floor(gameState.world.cureProgress) + '%';
    
    if (cureStatus) {
        if (gameState.world.cureProgress < 1) {
            cureStatus.textContent = `${gameState.disease.name} не замечена`;
        } else {
            cureStatus.textContent = `Лекарство в разработке (${Math.floor(gameState.world.cureProgress)}%)`;
        }
    }
    
    if (cureTime) {
        const yearsLeft = Math.max(1, Math.floor(10 - gameState.world.cureProgress / 10));
        cureTime.textContent = `Лекарство появится через: ${yearsLeft} ${getYearWord(yearsLeft)}`;
    }
    
    // Disease stats
    const infectivityBar = document.getElementById('infectivityBar');
    const severityBar = document.getElementById('severityBar');
    const lethalityBar = document.getElementById('lethalityBar');
    
    if (infectivityBar) infectivityBar.style.width = Math.min(gameState.disease.infectivity, 100) + '%';
    if (severityBar) severityBar.style.width = Math.min(gameState.disease.severity, 100) + '%';
    if (lethalityBar) lethalityBar.style.width = Math.min(gameState.disease.lethality, 100) + '%';
    
    // Update map colors
    updateMapColors();
    
    // Update selected country info
    updateCountryInfo();
    
    // Update today's stats
    updateTodayStats();
}

// Update today's stats
function updateTodayStats() {
    const todayInfected = document.getElementById('todayInfected');
    const todayDead = document.getElementById('todayDead');
    
    if (todayInfected) {
        todayInfected.textContent = formatNumber(Math.floor(gameState.world.totalInfected / 1000));
    }
    if (todayDead) {
        todayDead.textContent = formatNumber(Math.floor(gameState.world.totalDead / 100));
    }
}

// Update map colors based on infection
function updateMapColors() {
    for (let countryId in gameState.countries) {
        const country = gameState.countries[countryId];
        const element = document.getElementById(`country-${countryId}`);
        if (element) {
            const infectionRate = (country.infected + country.dead) / country.population;
            if (infectionRate > 0.5) {
                element.style.fill = '#ff6b6b';
            } else if (infectionRate > 0.1) {
                element.style.fill = '#ff9f9f';
            } else if (infectionRate > 0) {
                element.style.fill = '#ffd1d1';
            } else {
                element.style.fill = '#2a3a5a';
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
    return `${date.getDate().toString().padStart(2, '0')} ${date.toLocaleString('ru', { month: 'short' })} ${date.getFullYear()}`;
}

// Get year word (год/года/лет)
function getYearWord(years) {
    if (years % 10 === 1 && years % 100 !== 11) return 'год';
    if ([2,3,4].includes(years % 10) && ![12,13,14].includes(years % 100)) return 'года';
    return 'лет';
}

// Format large numbers
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Reset game
window.resetGame = function() {
    console.log('Resetting game');
    
    // Clear interval
    if (gameState.gameInterval) {
        clearInterval(gameState.gameInterval);
    }
    
    // Reload page
    location.reload();
}

// Add click event listeners to all buttons
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, adding event listeners');
    
    initGame();
    
    // Add click listeners to all buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function(e) {
            console.log('Button clicked:', this.textContent);
            e.stopPropagation();
        });
    });
    
    // Add click listeners to disease cards
    document.querySelectorAll('.disease-card').forEach(card => {
        card.addEventListener('click', function() {
            const type = this.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (type) selectDisease(type);
        });
    });
    
    // Add click listeners to difficulty cards
    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.addEventListener('click', function() {
            const difficulty = this.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (difficulty) selectDifficulty(difficulty);
        });
    });
    
    // Add click listeners to nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.textContent.toLowerCase();
            if (text.includes('мир')) showGameTab('world');
            else if (text.includes('болезнь')) showGameTab('disease');
            else if (text.includes('news')) showGameTab('news');
            else if (text.includes('лекарство')) showGameTab('cure');
        });
    });
    
    // Add click listeners to tree tabs
    document.querySelectorAll('.tree-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const text = this.textContent.toLowerCase();
            if (text.includes('передача')) showTreeTab('transmission');
            else if (text.includes('симптомы')) showTreeTab('symptoms');
            else if (text.includes('способности')) showTreeTab('abilities');
        });
    });
    
    // Add click listeners to upgrade items
    document.querySelectorAll('.upgrade-item').forEach(item => {
        item.addEventListener('click', function() {
            const onclick = this.getAttribute('onclick');
            if (onclick) {
                const match = onclick.match(/'([^']+)'/);
                if (match) {
                    purchaseUpgrade(match[1]);
                }
            }
        });
    });
    
    // Add click listeners to country paths
    document.querySelectorAll('.country').forEach(country => {
        country.addEventListener('click', function() {
            const id = this.id.replace('country-', '');
            selectCountry(id);
        });
    });
});
