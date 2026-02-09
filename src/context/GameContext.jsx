import React, { createContext, useContext, useState, useEffect } from 'react';
import { ITEM_SLOTS } from '../data/items';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    // --- State ---
    const [gold, setGold] = useState(100);
    const [inventory, setInventory] = useState([]);

    // Leveling State
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [statPoints, setStatPoints] = useState(0);

    const [equipment, setEquipment] = useState({
        [ITEM_SLOTS.HEAD]: null,
        [ITEM_SLOTS.ARMOR]: null,
        [ITEM_SLOTS.GLOVES]: null,
        [ITEM_SLOTS.BOOTS]: null,
        [ITEM_SLOTS.MAIN_HAND]: null,
        [ITEM_SLOTS.OFF_HAND]: null,
        [ITEM_SLOTS.RING_1]: null,
        [ITEM_SLOTS.RING_2]: null,
        [ITEM_SLOTS.AMULET]: null,
    });

    // Base Attributes (Raw points allocated)
    const [baseAttributes, setBaseAttributes] = useState({
        str: 10,
        dex: 10,
        vit: 10,
        mag: 10
    });

    // Computed Effects (Final stats used in combat)
    const [playerStats, setPlayerStats] = useState({});

    useEffect(() => {
        calculateStats();
    }, [baseAttributes, equipment, level]);

    // XP / Level Up Logic
    // XP Required = Level * 100 * (Level * 0.5) approx
    const requiredXp = Math.floor(level * 100 * (1 + level * 0.1));

    const gainXp = (amount) => {
        let newXp = xp + amount;
        if (newXp >= requiredXp) {
            // Level Up!
            newXp -= requiredXp;
            setLevel(prev => prev + 1);
            setStatPoints(prev => prev + 5);
            // Recursive check if multiple levels? For simple prototype, one at a time is fine or while loop.
        }
        setXp(newXp);
    };

    const assignStat = (statName) => {
        if (statPoints > 0) {
            setBaseAttributes(prev => ({
                ...prev,
                [statName]: prev[statName] + 1
            }));
            setStatPoints(prev => prev - 1);
        }
    };

    // --- Helper: Stat Calculation Logic ---
    const getDerivedStats = (attributes, equipmentList = {}, options = {}) => {
        const { baseHp = 50, baseMp = 20 } = options;

        let stats = {
            str: attributes.str,
            dex: attributes.dex,
            vit: attributes.vit,
            mag: attributes.mag,
            hp: 0, mp: 0,
            minDmg: 0, maxDmg: 0,
            magicDmgBonus: 0, attackSpeed: 1.0, def: 0,
            // Special Effects
            lifesteal: 0, manasteal: 0, reflect: 0
        };

        // Apply Equipment
        Object.values(equipmentList).forEach(item => {
            if (item && item.stats) {
                if (item.stats.str) stats.str += item.stats.str;
                if (item.stats.dex) stats.dex += item.stats.dex;
                if (item.stats.vit) stats.vit += item.stats.vit;
                if (item.stats.mag) stats.mag += item.stats.mag;
                if (item.stats.def) stats.def += item.stats.def;
                if (item.stats.minDmg) stats.minDmg += item.stats.minDmg;
                if (item.stats.maxDmg) stats.maxDmg += item.stats.maxDmg;

                // Special Effects
                if (item.stats.lifesteal) stats.lifesteal += item.stats.lifesteal;
                if (item.stats.manasteal) stats.manasteal += item.stats.manasteal;
                if (item.stats.reflect) stats.reflect += item.stats.reflect;
            }
        });

        // Formulas
        stats.hp = baseHp + (stats.vit * 5);
        stats.mp = baseMp + (stats.mag * 2);

        // Dmg
        stats.minDmg += stats.str * 1;
        stats.maxDmg += stats.str * 2;
        if (stats.minDmg < 1) stats.minDmg = 1 + stats.str;
        if (stats.maxDmg < 2) stats.maxDmg = 3 + stats.str * 2;

        // Speed
        stats.attackSpeed = 1 + (stats.dex * 0.02);

        // Magic
        stats.magicDmgBonus = stats.mag * 3;

        // Def
        stats.def += Math.floor(stats.dex / 2);

        return stats;
    };

    const calculateStats = () => {
        const stats = getDerivedStats(baseAttributes, equipment);
        setPlayerStats(stats);
    };

    const generateMonsterStats = (mLevel) => {
        // Base 1.5x of Player Init (10) -> 15
        let raw = { str: 15, dex: 15, vit: 15, mag: 15 };

        // Points: 5 per lvl (Assuming Lvl 1 is base, so 0 extra points for lvl 1)
        const points = (mLevel - 1) * 5;

        for (let i = 0; i < points; i++) {
            const r = Math.random();
            if (r < 0.25) raw.str++;
            else if (r < 0.5) raw.dex++;
            else if (r < 0.75) raw.vit++;
            else raw.mag++;
        }

        // Apply formulas with 1.5x Base Constants for HP/MP to match 1.5x Total rule
        // Player Base HP 50 -> Monster Base HP 75. 
        // 75 + (15 * 5) = 150 HP for Lvl 1.
        return getDerivedStats(raw, {}, { baseHp: 75, baseMp: 30 });
    };

    // --- Actions ---
    const addToInventory = (item) => {
        if (inventory.length < 30) {
            setInventory([...inventory, item]);
            return true;
        }
        return false;
    };

    const equipItem = (item, targetSlot = null) => {
        const newInv = inventory.filter(i => i.id !== item.id);
        const slot = targetSlot || item.slot;
        const currentEquip = equipment[slot];

        if (currentEquip) {
            newInv.push(currentEquip);
        }
        setInventory(newInv);
        setEquipment(prev => ({ ...prev, [slot]: item }));
    };

    const unequipItem = (slot) => {
        const item = equipment[slot];
        if (!item) return;

        if (inventory.length < 30) {
            setEquipment(prev => ({ ...prev, [slot]: null }));
            setInventory([...inventory, item]);
        }
    };

    const value = {
        gold, setGold,
        level, xp, requiredXp, gainXp,
        statPoints, assignStat,
        inventory, addToInventory,
        equipment, equipItem, unequipItem,
        playerStats, baseAttributes,
        generateMonsterStats
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};
