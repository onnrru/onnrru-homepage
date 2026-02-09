export const ITEM_SLOTS = {
    HEAD: 'head',
    ARMOR: 'armor',
    GLOVES: 'gloves',
    BOOTS: 'boots',
    MAIN_HAND: 'mainHand',
    OFF_HAND: 'offHand',
    RING_1: 'ring1',
    RING_2: 'ring2',
    AMULET: 'amulet'
};

export const RARITY = {
    NORMAL: { name: 'Normal', color: 'text-white', multiplier: 1, statCount: 1, range: [1, 2] },
    MAGIC: { name: 'Magic', color: 'text-blue-400', multiplier: 1.5, statCount: 2, range: [2, 4] },
    RARE: { name: 'Rare', color: 'text-yellow-400', multiplier: 2.0, statCount: 3, range: [3, 6] },
    UNIQUE: { name: 'Unique', color: 'text-amber-600', multiplier: 3.5, statCount: 3, range: [6, 8] } // Orange
};

const BASE_ITEMS = {
    [ITEM_SLOTS.MAIN_HAND]: [
        { name: 'Short Sword', minDmg: 2, maxDmg: 5, icon: '⚔️' },
        { name: 'Axe', minDmg: 4, maxDmg: 7, icon: '🪓' },
        { name: 'Wand', minDmg: 1, maxDmg: 8, icon: '🪄' }
    ],
    [ITEM_SLOTS.ARMOR]: [
        { name: 'Leather Armor', def: 5, icon: '👕' },
        { name: 'Chain Mail', def: 10, icon: '🛡️' },
        { name: 'Robes', def: 3, mag: 5, icon: '👘' }
    ],
    [ITEM_SLOTS.HEAD]: [
        { name: 'Cap', def: 2, icon: '🧢' },
        { name: 'Helm', def: 5, icon: '⛑️' }
    ],
    [ITEM_SLOTS.GLOVES]: [
        { name: 'Leather Gloves', def: 1, icon: '🧤' }
    ],
    [ITEM_SLOTS.BOOTS]: [
        { name: 'Boots', def: 1, icon: '👢' }
    ],
    [ITEM_SLOTS.RING_1]: [
        { name: 'Ring', icon: '💍' }
    ],
    [ITEM_SLOTS.AMULET]: [
        { name: 'Amulet', icon: '🧿' }
    ]
};

const STAT_TYPES = ['str', 'dex', 'vit', 'mag', 'atk', 'def'];

export const STAT_LABELS = {
    str: 'Strength',
    dex: 'Dexterity',
    vit: 'Vitality',
    mag: 'Magic',
    atk: 'Attack',
    def: 'Defense',
    hp: 'HP',
    mp: 'MP',
    minDmg: 'Min Dmg',
    maxDmg: 'Max Dmg',
    lifesteal: 'Life Steal',
    manasteal: 'Mana Steal',
    reflect: 'Thorns'
};

export const SPECIAL_EFFECTS = [
    { id: 'lifesteal', name: 'Life Steal', val: 0.1, desc: 'Heals 10% of Dmg' },
    { id: 'manasteal', name: 'Mana Steal', val: 0.1, desc: 'Restores 10% of Dmg as MP' },
    { id: 'reflect', name: 'Thorns', val: 1.0, desc: 'Reflects 100% incoming dmg' }
];

export const formatStat = (key, value) => {
    if (key === 'lifesteal' || key === 'manasteal' || key === 'reflect') {
        return `${Math.round(value * 100)}%`;
    }
    return `+${value}`;
};

export const generateLoot = (level = 1) => {
    // 1. Pick Rarity based on strict probability
    // White 50%, Blue 30%, Yellow 10%, Orange 2%. Total 92%.
    // If roll > 92, check Junk? Or just rescale? 
    // Let's assume user wants these RATIOS. 
    // 50+30+10+2 = 92.
    // Normalized to 100%: White ~54%, Blue ~32.6%, Yellow ~10.8%, Orange ~2.1%.
    // We'll stick to raw rolls: 0-50 White, 50-80 Blue, 80-90 Yellow, 90-92 Orange, 92-100 Nothing.

    const roll = Math.random() * 100;

    let rarity;
    if (roll < 50) rarity = RARITY.NORMAL;
    else if (roll < 80) rarity = RARITY.MAGIC;
    else if (roll < 90) rarity = RARITY.RARE;
    else if (roll < 92) rarity = RARITY.UNIQUE;
    else return null; // 8% chance of no drop (or junk)

    // 2. Pick Slot & Base
    const slots = Object.keys(BASE_ITEMS);
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const bases = BASE_ITEMS[slot];
    const base = bases[Math.floor(Math.random() * bases.length)];

    // 3. Generate Stats
    let stats = { ...base }; // Start with base stats

    // Determine number of stat lines
    // Normal: 1 stat. Magic: 2 stats. Rare/Unique: 3 stats.
    const statLines = rarity.statCount;

    // Determine Total Stat Sum (random between range[0] and range[1])
    const totalSum = Math.floor(Math.random() * (rarity.range[1] - rarity.range[0] + 1)) + rarity.range[0];

    // Distribute totalSum across statLines
    // Simple distribution: pick random stats and add 1 until sum reached.
    for (let i = 0; i < totalSum; i++) {
        const stat = STAT_TYPES[Math.floor(Math.random() * STAT_TYPES.length)];
        stats[stat] = (stats[stat] || 0) + 1;
    }

    // 4. Special Effects (Orange Only)
    let specialName = "";
    if (rarity === RARITY.UNIQUE) {
        // Pick 1 special effect
        const effect = SPECIAL_EFFECTS[Math.floor(Math.random() * SPECIAL_EFFECTS.length)];
        stats[effect.id] = effect.val;
        specialName = ` [${effect.name}]`;
    }

    // 5. Name Generation
    let namePrefix = "";
    if (rarity !== RARITY.NORMAL) {
        // Simple prefix based on highest stat
        const topStat = Object.keys(stats).filter(k => STAT_TYPES.includes(k)).sort((a, b) => stats[b] - stats[a])[0];
        if (topStat) namePrefix = topStat.toUpperCase() + " ";
    }

    return {
        id: Math.random().toString(36).substr(2, 9),
        baseName: base.name,
        name: `${rarity.name} ${base.name}${specialName}`, // Simplified naming for now
        slot: slot,
        rarity: rarity,
        stats: stats,
        icon: base.icon,
        value: totalSum * 10
    };
};
