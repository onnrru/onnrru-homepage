import React from 'react';

const skills = [
    { id: 1, name: 'Basic Attack', damage: 0, cost: 0, color: 'bg-gray-600', icon: '⚔️' },
    { id: 2, name: 'Fireball', damage: 15, cost: 5, color: 'bg-red-600', icon: '🔥' },
    { id: 3, name: 'Ice Shard', damage: 12, cost: 8, color: 'bg-blue-500', icon: '❄️' },
    { id: 4, name: 'Meteor Strike', damage: 40, cost: 10, color: 'bg-orange-600', icon: '☄️' }
];

const SkillPanel = ({ onSelect, activeSkill }) => {
    return (
        <div className="grid grid-cols-2 gap-4 w-full max-w-md h-full">
            {skills.map(skill => (
                <button
                    key={skill.id}
                    onClick={() => onSelect(skill)}
                    className={`
                        relative overflow-hidden rounded-xl border-2 transition-all duration-200
                        flex flex-col items-center justify-center p-2
                        ${activeSkill?.id === skill.id
                            ? 'border-yellow-400 scale-95 ring-2 ring-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                            : 'border-gray-600 hover:border-gray-400 hover:-translate-y-1 hover:shadow-lg'}
                        ${skill.color}
                    `}
                >
                    <span className="font-bold text-lg">{skill.name}</span>
                    <div className="flex gap-2 text-xs opacity-90 font-mono mt-1 bg-black/20 px-2 py-0.5 rounded">
                        <span>Dmg: {skill.damage}</span>
                        {skill.cost > 0 && <span className="text-blue-200">MP: {skill.cost}</span>}
                    </div>

                    {/* Glossy effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                </button>
            ))}
        </div>
    );
};

export default SkillPanel;
