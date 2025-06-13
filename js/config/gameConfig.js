export const GameConfig = {
    appId: 'sct-global',
    initialCash: 2000,
    initialDays: 30,
    priceMultiplier: { min: 0.4, max: 2 },
    availability: { min: 0, max: 20 },
    boosterPack: {
        basePrice: 250,
        dailyLimit: 3,
        chancePerDay: 0.8
    },
    priceGuideCost: 1000,
    rareCardThreshold: 200,
    leaderboard: {
        size: 10,
        inGameSize: 3
    },
    displayCabinetLimit: 3,
    travelEventChance: 0.3,
    commonCardAssets: {
        base_url: 'Images/Common/',
        layers: [
            { folder: 'Background', count: 44 },
            { folder: 'Head', count: 17 },
            { folder: 'Shirt', count: 13 },
            { folder: 'hair', count: 21 },
            { folder: 'Frame', count: 5 }
        ]
    }
};
