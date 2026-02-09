import React, { useState, useEffect } from 'react';
import MonsterDisplay from './MonsterDisplay';
import SkillPanel from './SkillPanel';
import DiceSlingshot from './DiceSlingshot';
import { useGame } from '../context/GameContext';
import { generateLoot } from '../data/items';

const BattleGame = () => {
    const { playerStats, addToInventory, gold, setGold, gainXp, level, generateMonsterStats } = useGame();

    const [gameState, setGameState] = useState('IDLE'); // IDLE, AIMING, THROWN, RESULT, MONSTER_TURN, VICTORY, GAME_OVER
    const [monsterLevel, setMonsterLevel] = useState(level);

    // Encounter State
    const [isBoss, setIsBoss] = useState(true);
    const [monsters, setMonsters] = useState([]); // Array for mobs

    // Boss Specific State (Legacy support for single boss visual in bar)
    const [bossStats, setBossStats] = useState({ hp: 1000 });
    const [bossHp, setBossHp] = useState(1000);

    const [playerHp, setPlayerHp] = useState(playerStats.hp || 100);
    const [playerMp, setPlayerMp] = useState(playerStats.mp || 50);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [battleLog, setBattleLog] = useState([]);
    const [activeZones, setActiveZones] = useState([]);
    const [lootDropped, setLootDropped] = useState(null);

    // Sync HP/MP when stats change
    useEffect(() => {
        setPlayerHp(playerStats.hp);
        setPlayerMp(playerStats.mp);
    }, [playerStats.hp, playerStats.mp]);

    // Initial Monster Gen
    useEffect(() => {
        if (gameState === 'IDLE' && monsters.length === 0 && bossHp === 1000) {
            spawnEncounter(level);
        }
    }, [level, gameState, monsters.length, bossHp]);

    // Combat Balance State
    const [combatBalance, setCombatBalance] = useState({
        zoneScale: 1.0,
        allowedFaces: [2, 4, 6], // Default 3 faces
        missGuardCount: 3
    });

    // Determine Balance Rules based on Level Difference (Mob - Player)
    const getCombatBalance = (pLvl, mLvl) => {
        const delta = mLvl - pLvl; // Delta = Mob - Player
        let zoneScale = 1.0;
        let count = 3;

        if (delta >= 6) { // Skull (Death)
            zoneScale = 0.1;
            count = 0;
        } else if (delta >= 4) { // Red (Very Hard)
            zoneScale = 0.4;
            count = 1;
        } else if (delta >= 2) { // Yellow (Hard)
            zoneScale = 0.7;
            count = 2;
        } else if (delta >= -1) { // Green (Normal) -1 to +1
            zoneScale = 1.0;
            count = 3;
        } else if (delta >= -3) { // White (Easy) -3 to -2
            zoneScale = 1.5;
            count = 5;
        } else { // Grey (Trivial) <= -4
            zoneScale = 2.0;
            count = 6;
        }

        return { zoneScale, count };
    };

    const generateAllowedFaces = (count) => {
        if (count === 0) return [];
        if (count === 6) return [1, 2, 3, 4, 5, 6];

        // Randomly select 'count' unique faces
        const faces = [1, 2, 3, 4, 5, 6];
        // Fisher-Yates Shuffle
        for (let i = faces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [faces[i], faces[j]] = [faces[j], faces[i]];
        }
        return faces.slice(0, count).sort();
    };

    // Update Balance when Level or Monster Level changes
    useEffect(() => {
        const balance = getCombatBalance(level, monsterLevel);
        const faces = generateAllowedFaces(balance.count);
        setCombatBalance({
            zoneScale: balance.zoneScale,
            allowedFaces: faces,
            missGuardCount: balance.count
        });
    }, [level, monsterLevel]);

    const spawnEncounter = (lvl) => {
        setMonsterLevel(lvl);

        // Logic: Boss every 5 levels or Level 1. Else Mob Pack.
        const isBossEncounter = (lvl === 1 || lvl % 5 === 0);
        setIsBoss(isBossEncounter);

        const baseStats = generateMonsterStats(lvl);

        if (isBossEncounter) {
            setBossStats(baseStats);
            setBossHp(baseStats.hp);
            setMonsters([]); // No mobs
            addLog(`BOSS FIGHT! Level ${lvl} (HP: ${baseStats.hp})`);
        } else {
            // Mob Pack
            const count = Math.floor(Math.random() * 5) + 1; // 1 to 5
            const newMobs = [];
            for (let i = 0; i < count; i++) {
                newMobs.push({
                    id: `mob-${i}-${Date.now()}`,
                    hp: Math.floor(baseStats.hp * 0.6),
                    maxHp: Math.floor(baseStats.hp * 0.6),
                    // Random Position (20-80%)
                    x: 20 + Math.random() * 60,
                    y: 20 + Math.random() * 60,
                    stats: baseStats // They share base stats for dmg/speed
                });
            }
            setMonsters(newMobs);
            setBossHp(0);
            addLog(`Encounter! ${count} Monsters appeared!`);
        }
    };

    const getLevelDiffInfo = (mLevel, pLevel) => {
        const diff = mLevel - pLevel;
        if (diff <= -4) return { color: 'text-gray-500', icon: '⚪', label: 'Grey' };
        if (diff >= -3 && diff <= -2) return { color: 'text-white', icon: '⚪', label: 'White' };
        if (diff >= -1 && diff <= 1) return { color: 'text-green-500', icon: '🟢', label: 'Green' };
        if (diff >= 2 && diff <= 3) return { color: 'text-yellow-500', icon: '🟡', label: 'Yellow' };
        if (diff >= 4 && diff <= 5) return { color: 'text-red-600', icon: '🔴', label: 'Red' };
        if (diff >= 6) return { color: 'text-purple-600 font-extrabold', icon: '💀', label: 'Death' };

        return { color: 'text-white', icon: '' };
    };

    const diffInfo = getLevelDiffInfo(monsterLevel, level);

    const handleSkillSelect = (skill) => {
        if (gameState === 'IDLE' || gameState === 'AIMING') {
            if (skill.cost > playerMp) {
                addLog(`Not enough Mana! (Need ${skill.cost})`);
                return;
            }
            setSelectedSkill(skill);
            setGameState('AIMING');
        }
    };

    // Helper for speed
    const getSpeedMult = () => playerStats.attackSpeed || 1;

    const handleDiceResult = (result, finalPosition) => {
        setGameState('RESULT');

        let baseDmg = (playerStats.minDmg || 1) + Math.floor(Math.random() * ((playerStats.maxDmg || 3) - (playerStats.minDmg || 1)));

        let damage = baseDmg;
        let isMagic = selectedSkill?.cost > 0;

        // Apply Skill Dmg & Cost
        if (selectedSkill) {
            damage += selectedSkill.damage;

            // Consume Mana
            if (isMagic) {
                setPlayerMp(prev => Math.max(0, prev - selectedSkill.cost));
                damage += (playerStats.magicDmgBonus || 0);
            }
        }

        let hitZone = null;
        let isCenterHit = false;

        // Collision Detection
        const diceRadius = 16;

        for (const zone of activeZones) {
            const dx = finalPosition.x - zone.absX;
            const dy = finalPosition.y - zone.absY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Outer Edge Hit
            if (dist < (zone.radius + diceRadius)) {
                hitZone = zone;
                if (dist < zone.radius * 0.5) {
                    isCenterHit = true;
                }
                break;
            }
        }

        // Miss Guard Check
        let isMissGuard = false;
        if (!hitZone) {
            if (combatBalance.allowedFaces.includes(result)) {
                // Miss Guard Activated!
                isMissGuard = true;
                // Basic Damage only (maybe reduced?)
                // User said "Basic Attack Allowed". Usually means 100% or slightly less.
                // Let's count it as a "Graze" hit.
                addLog(`Miss Guard! Dice ${result} saved you!`);
            }
        }

        let currentBossHp = bossHp;
        let currentMonsters = [...monsters];
        let damageDealt = 0;

        if (hitZone || isMissGuard) {
            let msg = "";
            let multiplier = 1.0;

            if (isMissGuard) {
                multiplier = 0.5; // Let's penalize slightly? Or 1.0? 
                // User: "Miss => Basic Attack".
                // Yellow is 100%, Green is 50%.
                // If Miss Guard is better than Green, that's weird.
                // But Miss Guard is LUCK based.
                // Let's set it to 1.0 (Normal) for now, or match Yellow.
                // "Miss even if allows, basic deal goes in". 
                // Let's assume 100% base damage.
                multiplier = 1.0;
                msg += " (MISS GUARD)";
            } else if (hitZone) {
                if (isCenterHit) {
                    multiplier *= 1.2;
                    msg += " (PERFECT +20%)";
                }

                // Zone Multipliers
                if (hitZone.id === 'red') multiplier *= 2.0;
                else if (hitZone.id === 'yellow') multiplier *= 1.0;
                else if (hitZone.id === 'green') multiplier *= 0.5;
            }

            if (isBoss) {
                // Boss Hit Logic (Colors)
                if (hitZone.id === 'green') {
                    if (result >= 4) { multiplier *= 0.7; msg += " [Green 70%]"; }
                } else if (hitZone.id === 'yellow') {
                    if (result >= 4) { multiplier *= 1.2; msg += " [Yellow 120%]"; }
                } else if (hitZone.id === 'red') {
                    if (result >= 4) { multiplier *= 3; msg += " [RED 300%]"; }
                }

                damageDealt = Math.floor(damage * multiplier);
                msg = `HIT ${hitZone.id.toUpperCase()}!` + msg;
                setBossHp(prev => Math.max(0, prev - damageDealt));
                currentBossHp -= damageDealt;

            } else {
                // Mob Pack Hit Logic
                // Find mob by ID
                const mobIndex = currentMonsters.findIndex(m => m.id === hitZone.id);
                if (mobIndex !== -1) {
                    // Standard damage for mobs (maybe small bonus for direct hit?)
                    damageDealt = Math.floor(damage * multiplier);
                    msg = "HIT MOB!";

                    const mob = currentMonsters[mobIndex];
                    mob.hp = Math.max(0, mob.hp - damageDealt);

                    if (mob.hp <= 0) {
                        msg += " (Killed!)";
                        // Remove mob? Or keep as dead visual?
                        // MonsterDisplay handles dead visual.
                    }
                    setMonsters(currentMonsters);
                }
            }

            // Life/Mana Steal
            if (damageDealt > 0) {
                if (playerStats.lifesteal > 0) {
                    const heal = Math.floor(damageDealt * playerStats.lifesteal);
                    if (heal > 0) setPlayerHp(h => Math.min(playerStats.hp, h + heal));
                }
                if (playerStats.manasteal > 0) {
                    const mana = Math.floor(damageDealt * playerStats.manasteal);
                    if (mana > 0) setPlayerMp(m => Math.min(playerStats.mp, m + mana));
                }
            }

            addLog(`${msg} -> ${damageDealt} Dmg!`);

            // Check Win
            if (isBoss) {
                if (currentBossHp <= 0) { handleWin(); return; }
            } else {
                if (currentMonsters.every(m => m.hp <= 0)) { handleWin(); return; }
            }

        } else {
            addLog("Missed!");
        }

        // Turn Logic - Speed affects delay (Player Dex)
        const delay = 1500 / getSpeedMult();

        setTimeout(() => {
            // Check if enemies still alive
            const enemiesAlive = isBoss ? currentBossHp > 0 : currentMonsters.some(m => m.hp > 0);

            if (enemiesAlive) {
                setGameState('MONSTER_TURN');

                // For mobs, maybe multiple attacks? Or just one combined for simplicity?
                // Simplicity: 1 attack from "The Pack" or Boss.
                // Or sum of alive mobs?
                // Let's do: if Boss, 1 big attack. If Mobs, random 1 mob attacks.

                const mStats = isBoss ? bossStats : currentMonsters.find(m => m.hp > 0)?.stats || generateMonsterStats(level);
                const monsterDelay = 1000 / (mStats.attackSpeed || 1);

                setTimeout(() => {
                    // Monster Dmg Calculation
                    const mMin = mStats.minDmg || 5;
                    const mMax = mStats.maxDmg || 10;
                    const rawDmg = mMin + Math.floor(Math.random() * (mMax - mMin));

                    const monDmg = Math.max(0, rawDmg - (playerStats.def || 0));

                    addLog(`${isBoss ? 'Boss' : 'Enemy'} attacks for ${monDmg} dmg!`);
                    const newHp = Math.max(0, playerHp - monDmg);
                    setPlayerHp(newHp);

                    // --- Special Effect: Reflect ---
                    if (playerStats.reflect && monDmg > 0) {
                        const reflected = Math.floor(monDmg * playerStats.reflect); // 1.0 = 100% reflect
                        if (reflected > 0) {
                            addLog(`Reflected ${reflected} dmg!`);
                            if (isBoss) {
                                setBossHp(m => Math.max(0, m - reflected));
                                if (currentBossHp - reflected <= 0) { handleWin(); return; }
                            } else {
                                // Reflect hits random alive mob
                                const targetMob = currentMonsters.find(m => m.hp > 0);
                                if (targetMob) {
                                    targetMob.hp -= reflected;
                                    setMonsters([...currentMonsters]); // Trigger re-render
                                    if (currentMonsters.every(m => m.hp <= 0)) { handleWin(); return; }
                                }
                            }
                        }
                    }

                    if (newHp <= 0) {
                        setGameState('GAME_OVER');
                    } else {
                        setGameState('IDLE');
                        setSelectedSkill(null);
                    }
                }, monsterDelay);
            } else {
                // All enemies dead, but handleWin wasn't called (e.g., reflect killed last one)
                handleWin();
            }
        }, delay);
    };

    const handleWin = () => {
        setGameState('VICTORY');
        const loot = generateLoot(level); // Dropped item scales with player level
        setLootDropped(loot);

        // XP Gain
        const xpGained = 50 * monsterLevel;
        gainXp(xpGained);

        const goldDrop = Math.floor(Math.random() * 50) + (10 * monsterLevel);
        setGold(g => g + goldDrop);
        addLog(`VICTORY! +${xpGained} XP, +${goldDrop} Gold.`);
    };

    const handleClaimLoot = () => {
        if (lootDropped) {
            if (addToInventory(lootDropped)) {
                addLog(`Looted: ${lootDropped.name}`);
            } else {
                addLog("Inventory Full! Discarded Loot.");
            }
        }
        resetGame();
    };

    const resetGame = () => {
        spawnEncounter(level);
        setGameState('IDLE');
        setSelectedSkill(null);
        setLootDropped(null);
    };

    const handleRetry = () => {
        setPlayerHp(playerStats.hp);
        setPlayerMp(playerStats.mp);
        spawnEncounter(level);
        setGameState('IDLE');
        setSelectedSkill(null);
        addLog("Resurrected!");
    };

    const addLog = (msg) => {
        setBattleLog(prev => [msg, ...prev].slice(0, 5));
    };

    const aliveCount = isBoss ? (bossHp > 0 ? 1 : 0) : monsters.filter(m => m.hp > 0).length;

    return (
        <div className="flex flex-col h-full bg-black/50 text-white font-sans select-none relative">
            {/* Top Bar: Monster Info */}
            <div className="flex justify-between items-center p-2 bg-gray-900/80 border-b border-gray-700 z-10 h-14">
                <div className="flex flex-col w-full px-4">
                    <div className="flex justify-between items-end text-xs mb-1">
                        <div className="flex items-center gap-2">
                            {isBoss ? (
                                <span className={`text-lg transition-colors ${diffInfo.color} flex items-center gap-1`}>
                                    {diffInfo.icon} Lv.{monsterLevel} BOSS
                                </span>
                            ) : (
                                <span className="text-lg text-white flex items-center gap-1">
                                    👾 PACK (Lv.{monsterLevel})
                                </span>
                            )}
                        </div>
                        {isBoss ? (
                            <span className="text-gray-400 font-mono">{bossHp}/{bossStats.hp}</span>
                        ) : (
                            <span className="text-gray-400 font-mono">{aliveCount} / {monsters.length} Remaining</span>
                        )}
                    </div>
                    {isBoss ? (
                        <div className="w-full h-3 bg-gray-700 mx-auto rounded-full overflow-hidden border border-gray-600">
                            <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${(bossHp / bossStats.hp) * 100}%` }}></div>
                        </div>
                    ) : (
                        <div className="w-full h-3 bg-gray-700 mx-auto rounded-full overflow-hidden border border-gray-600">
                            {/* Pack Health = Sum of HPs? Or just count? Let's show sum relative to max sum */}
                            <div className="h-full bg-orange-600 transition-all duration-500"
                                style={{
                                    width: `${(monsters.reduce((a, c) => a + c.hp, 0) / monsters.reduce((a, c) => a + c.maxHp, 0)) * 100}%`
                                }}
                            ></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Battle Area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {/* Monster Layer */}
                <MonsterDisplay
                    onZonesUpdate={setActiveZones}
                    gameState={gameState}
                    monsters={monsters}
                    isBoss={isBoss}
                    combatBalance={combatBalance}
                />

                {/* Dice Layer (Overlay) */}
                {gameState === 'AIMING' && selectedSkill && (
                    <DiceSlingshot
                        onThrowComplete={handleDiceResult}
                        zones={activeZones}
                    />
                )}

                {/* Player Status (HP/MP) - Bottom Center */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-1/2 max-w-sm pointer-events-none">
                    {/* HP */}
                    <div className="mb-1">
                        <div className="flex justify-between text-[10px] mb-0.5 text-green-400 font-bold shadow-black drop-shadow-md">
                            <span>HP</span>
                            <span>{playerHp}/{playerStats.hp}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-800 rounded-full border border-gray-600 overflow-hidden shadow-lg">
                            <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300" style={{ width: `${Math.max(0, (playerHp / playerStats.hp) * 100)}%` }}></div>
                        </div>
                    </div>
                    {/* MP */}
                    <div>
                        <div className="flex justify-between text-[10px] mb-0.5 text-blue-400 font-bold shadow-black drop-shadow-md">
                            <span>MP</span>
                            <span>{playerMp}/{playerStats.mp}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full border border-gray-600 overflow-hidden shadow-lg">
                            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300" style={{ width: `${Math.max(0, (playerMp / playerStats.mp) * 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Overlays: Victory / Game Over */}
                {gameState === 'VICTORY' && (
                    <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <h2 className="text-4xl font-extrabold text-yellow-500 mb-4 tracking-widest">VICTORY</h2>
                        {lootDropped && (
                            <div className="bg-gray-800 p-4 rounded border border-yellow-500 mb-8 flex flex-col items-center">
                                <span className="text-sm text-gray-400 mb-2">LOOT DROPPED</span>
                                <div className="text-2xl mb-1">{lootDropped.icon}</div>
                                <div className={`font-bold ${lootDropped.rarity.color}`}>{lootDropped.name}</div>
                            </div>
                        )}
                        <button onClick={handleClaimLoot} className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                            Claim Rewards & Continue
                        </button>
                    </div>
                )}

                {gameState === 'GAME_OVER' && (
                    <div className="absolute inset-0 z-50 bg-red-900/90 flex flex-col items-center justify-center animate-in fade-in duration-500">
                        <h2 className="text-5xl font-extrabold text-white mb-2">YOU DIED</h2>
                        <p className="text-red-200 mb-8">The monster was too strong...</p>
                        <button onClick={handleRetry} className="px-8 py-3 bg-gray-200 hover:bg-white text-red-900 font-bold rounded shadow-lg">
                            Try Again
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Panel: Skills & Log */}
            <div className="h-32 bg-gray-900 border-t border-gray-700 flex relative z-10">
                {/* Battle Log */}
                <div className="w-1/2 p-2 border-r border-gray-700 overflow-y-auto font-mono text-[10px] opacity-80">
                    {battleLog.map((log, i) => (
                        <div key={i} className="mb-0.5 text-yellow-100">&gt; {log}</div>
                    ))}
                </div>

                {/* Skills */}
                <div className="flex-1 p-2 flex justify-center items-center">
                    <SkillPanel onSelect={handleSkillSelect} activeSkill={selectedSkill} />
                </div>
            </div>
        </div>
    );
};

export default BattleGame;
