// Game state
const gameState = {
    dna: 100,
    totalInfected: 0,
    totalDead: 0,
    totalPopulation: 7800000000,
    gameTime: 0,
    gameOver: false,
    winCondition: false,
    countries: {
        china: { population: 1400000000, infected: 0, dead: 0, name: 'Китай' },
        india: { population: 1300000000, infected: 0, dead: 0, name: 'Индия' },
        usa: { population: 331000000, infected: 0, dead: 0, name: 'США' },
        europe: { population: 747000000, infected: 0, dead: 0, name: 'Европа' },
        africa: { population: 1200000000, infected: 0, dead: 0, name: 'Африка' }
    },
    upgrades: {
        transmission: [
            { id: 'air', name: 'Воздушно-капельный', desc: 'Распространение по воздуху', cost: 25, purchased: false, effect: 0.3, requirement: null },
            { id: 'water', name: 'Водный путь', desc: 'Заражение через воду', cost: 30, purchased: false, effect: 0.25, requirement: null },
            { id: 'animal', name: 'Животный перенос', desc: 'Перенос животными', cost: 40, purchased: false, effect: 0.35, requirement: null },
            { id: 'blood', name: 'Кровяной путь', desc: 'Передача через кровь', cost: 50, purchased: false, effect: 0.4, requirement: 'air' }
        ],
        symptoms: [
            { id: 'cough', name: 'Кашель', desc: 'Увеличивает заразность', cost: 20, purchased: false, effect: 0.2, lethality: 0.05, requirement: null },
            { id: 'fever', name: 'Лихорадка', desc: 'Повышает смертность', cost: 30, purchased: false, effect: 0.15, lethality: 0.1, requirement: null },
            { id: 'rash', name: 'Сыпь', desc: 'Умеренные симптомы', cost: 25, purchased: false, effect: 0.1, lethality: 0.08, requirement: 'cough' },
            { id: 'necrosis', name: 'Некроз', desc: 'Высокая смертность', cost: 60, purchased: false, effect: 0.25, lethality: 0.3, requirement: 'fever' }
        ],
        abilities: [
            { id: 'resist_heat', name: 'Термоустойчивость', desc: 'Выживает в жаре', cost: 35, purchased: false, effect: 0.2, requirement: null },
            { id: 'resist_cold', name: 'Хладоустойчивость', desc: 'Выживает в холоде', cost: 35, purchased: false, effect: 0.2, requirement: null },
            { id: 'drug_resist', name: 'Лекарств. устойчивость', desc: 'Сопротивление лечению', cost: 70, purchased: false, effect: 0.4, requirement: 'resist_heat' },
            { id: 'genetic_shift', name: 'Генетический сдвиг', desc: 'Мутация болезни', cost: 100, purchased: false, effect: 0.5, requirement: 'drug_resist' }
        ]
    },
    gameLog: []
};

// DOM elements
const dnaCounter = document.getElementById('dna-counter');
const infectedCounter = document.getElementById('infected-counter');
const deadCounter = document.getElementById('dead-counter');
const healthyCounter = document.getElementById('healthy-counter');
const logMessages = document.getElementById('log-messages');

// Initialize game
function initGame() {
    // Start with infection in China
    gameState.countries.china.infected = 1000;
    gameState.totalInfected = 1000;
    updateStats();
    renderUpgrades();
    addLogMessage('🦠 Инфекция началась в Китае!');
    
    // Start game loop
    setInterval(gameLoop, 1000);
}

// Game loop
function gameLoop() {
    if (gameState.gameOver || gameState.winCondition) return;
    
    gameState.gameTime++;
    
    // Spread infection
    spreadInfection();
    
    // Calculate deaths
    calculateDeaths();
    
    // Generate DNA
    generateDNA();
    
    // Check win/lose conditions
    checkGameConditions();
    
    // Update UI
    updateStats();
    updateCountryDisplays();
}

// Spread infection between countries
function spreadInfection() {
    const countries = Object.keys(gameState.countries);
    const transmissionRate = calculateTransmissionRate();
    
    for (let country of countries) {
        const data = gameState.countries[country];
        if (data.infected > 0) {
            // Spread within country
            const newInfections = Math.floor(data.infected * 0.1 * transmissionRate);
            const availablePop = data.population - data.infected - data.dead;
            data.infected = Math.min(data.infected + newInfections, availablePop);
            
            // Spread to other countries
            for (let target of countries) {
                if (target !== country && Math.random() < 0.01 * transmissionRate) {
                    const targetData = gameState.countries[target];
                    if (targetData.infected < targetData.population - targetData.dead) {
                        const spreadAmount = Math.floor(data.infected * 0.001);
                        targetData.infected = Math.min(targetData.infected + spreadAmount, targetData.population - targetData.dead);
                        addLogMessage(`✈️ Инфекция распространилась в ${targetData.name}`);
                    }
                }
            }
        }
    }
    
    // Update total infected
    gameState.totalInfected = Object.values(gameState.countries).reduce((sum, c) => sum + c.infected, 0);
}

// Calculate deaths based on symptoms
function calculateDeaths() {
    const lethality = calculateLethality();
    
    for (let country in gameState.countries) {
        const data = gameState.countries[country];
        if (data.infected > 0) {
            const newDeaths = Math.floor(data.infected * lethality * 0.05);
            data.dead = Math.min(data.dead + newDeaths, data.population);
            data.infected = Math.max(data.infected - newDeaths, 0);
        }
    }
    
    gameState.totalDead = Object.values(gameState.countries).reduce((sum, c) => sum + c.dead, 0);
}

// Generate DNA based on infected population
function generateDNA() {
    const dnaGain = Math.floor(gameState.totalInfected / 1000000) + 1;
    gameState.dna += dnaGain;
}

// Calculate transmission rate based on upgrades
function calculateTransmissionRate() {
    let rate = 1.0;
    
    for (let upgrade of gameState.upgrades.transmission) {
        if (upgrade.purchased) rate += upgrade.effect;
    }
    for (let upgrade of gameState.upgrades.symptoms) {
        if (upgrade.purchased) rate += upgrade.effect;
    }
    for (let upgrade of gameState.upgrades.abilities) {
        if (upgrade.purchased) rate += upgrade.effect * 0.5;
    }
    
    return rate;
}

// Calculate lethality based on symptoms
function calculateLethality() {
    let lethality = 0.01;
    
    for (let upgrade of gameState.upgrades.symptoms) {
        if (upgrade.purchased && upgrade.lethality) {
            lethality += upgrade.lethality;
        }
    }
    
    return Math.min(lethality, 0.95);
}

// Purchase upgrade
function purchaseUpgrade(category, index) {
    if (gameState.gameOver || gameState.winCondition) return;
    
    const upgrade = gameState.upgrades[category][index];
    
    // Check if already purchased
    if (upgrade.purchased) return;
    
    // Check requirement
    if (upgrade.requirement) {
        const required = gameState.upgrades[category].find(u => u.id === upgrade.requirement);
        if (!required || !required.purchased) {
            addLogMessage(`❌ Требуется: ${required.name}`);
            return;
        }
    }
    
    // Check DNA
    if (gameState.dna < upgrade.cost) return;
    
    // Purchase
    gameState.dna -= upgrade.cost;
    upgrade.purchased = true;
    
    addLogMessage(`✅ Куплено: ${upgrade.name}`);
    
    // Special effects for genetic shift
    if (upgrade.id === 'genetic_shift') {
        gameState.dna += 200;
        addLogMessage('🧬 Генетический сдвиг! Получено +200 ДНК');
    }
    
    updateStats();
    renderUpgrades();
}

// Render upgrade buttons
function renderUpgrades() {
    renderCategory('transmission', 'transmission-upgrades');
    renderCategory('symptoms', 'symptoms-upgrades');
    renderCategory('abilities', 'abilities-upgrades');
}

function renderCategory(category, elementId) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    
    gameState.upgrades[category].forEach((upgrade, index) => {
        const div = document.createElement('div');
        div.className = `upgrade-item ${upgrade.purchased ? 'purchased' : ''}`;
        
        // Check if requirement is met
        if (!upgrade.purchased && upgrade.requirement) {
            const required = gameState.upgrades[category].find(u => u.id === upgrade.requirement);
            if (!required || !required.purchased) {
                div.classList.add('locked');
            }
        }
        
        div.onclick = () => purchaseUpgrade(category, index);
        
        div.innerHTML = `
            <span class="upgrade-name">${upgrade.name}</span>
            <span class="upgrade-desc">${upgrade.desc}</span>
            <span class="upgrade-cost">🧬 ${upgrade.cost} ДНК</span>
            ${upgrade.lethality ? `<span class="upgrade-effect">💀 +${Math.floor(upgrade.lethality * 100)}% смертность</span>` : ''}
            ${upgrade.effect ? `<span class="upgrade-effect">📈 +${Math.floor(upgrade.effect * 100)}% распространение</span>` : ''}
        `;
        
        container.appendChild(div);
    });
}

// Update country displays
function updateCountryDisplays() {
    for (let country in gameState.countries) {
        const data = gameState.countries[country];
        const infectedElement = document.getElementById(`${country}-infected`);
        const progressElement = document.getElementById(`${country}-progress`);
        
        if (infectedElement) {
            infectedElement.textContent = formatNumber(data.infected);
        }
        
        if (progressElement) {
            const infectionRate = (data.infected + data.dead) / data.population * 100;
            progressElement.style.width = `${Math.min(infectionRate, 100)}%`;
        }
    }
}

// Update global stats
function updateStats() {
    const totalHealthy = gameState.totalPopulation - gameState.totalInfected - gameState.totalDead;
    
    dnaCounter.textContent = gameState.dna;
    infectedCounter.textContent = formatNumber(gameState.totalInfected);
    deadCounter.textContent = formatNumber(gameState.totalDead);
    healthyCounter.textContent = formatNumber(totalHealthy);
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

// Add message to game log
function addLogMessage(message) {
    gameState.gameLog.unshift(message);
    if (gameState.gameLog.length > 10) {
        gameState.gameLog.pop();
    }
    
    logMessages.innerHTML = gameState.gameLog.map(msg => 
        `<div class="log-message">${msg}</div>`
    ).join('');
}

// Check game conditions
function checkGameConditions() {
    // Win condition - infect everyone
    if (gameState.totalInfected + gameState.totalDead >= gameState.totalPopulation) {
        gameState.winCondition = true;
        addLogMessage('🏆 ПОБЕДА! Всё человечество заражено или уничтожено!');
    }
    
    // Lose condition - no infected and can't spread
    if (gameState.totalInfected === 0 && gameState.gameTime > 10) {
        gameState.gameOver = true;
        addLogMessage('💔 ПОРАЖЕНИЕ! Инфекция полностью исчезла!');
    }
}

// Reset game
function resetGame() {
    // Reset game state
    gameState.dna = 100;
    gameState.totalInfected = 1000;
    gameState.totalDead = 0;
    gameState.gameTime = 0;
    gameState.gameOver = false;
    gameState.winCondition = false;
    
    // Reset countries
    gameState.countries = {
        china: { population: 1400000000, infected: 1000, dead: 0, name: 'Китай' },
        india: { population: 1300000000, infected: 0, dead: 0, name: 'Индия' },
        usa: { population: 331000000, infected: 0, dead: 0, name: 'США' },
        europe: { population: 747000000, infected: 0, dead: 0, name: 'Европа' },
        africa: { population: 1200000000, infected: 0, dead: 0, name: 'Африка' }
    };
    
    // Reset upgrades
    for (let category in gameState.upgrades) {
        gameState.upgrades[category].forEach(upgrade => {
            upgrade.purchased = false;
        });
    }
    
    // Reset log
    gameState.gameLog = [];
    addLogMessage('🔄 Новая игра началась!');
    
    // Update UI
    updateStats();
    updateCountryDisplays();
    renderUpgrades();
}

// Event listeners
document.getElementById('reset-btn').addEventListener('click', resetGame);

// Start the game
initGame();
