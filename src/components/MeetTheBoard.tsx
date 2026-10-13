import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import BoardLoginTerminal from './BoardLoginTerminal';
import BoardMemberPortal from './BoardMemberPortal';
import { PUBLIC_LEADERS } from '../content/leadershipPublic';

const boardMembers = PUBLIC_LEADERS.map((leader, index) => ({
  id: index + 1,
  name: leader.boardLoginName || leader.displayName,
  position: leader.roleLine ? `${leader.jobTitle} · ${leader.roleLine}` : leader.jobTitle,
  image: leader.imageUrl,
}));

export default function MeetTheBoard() {
  const [selectedMember, setSelectedMember] = useState<(typeof boardMembers)[0] | null>(null);
  const [authenticatedMember, setAuthenticatedMember] = useState<(typeof boardMembers)[0] | null>(null);

  if (authenticatedMember) {
    return <BoardMemberPortal member={authenticatedMember} onClose={() => setAuthenticatedMember(null)} />;
  }

  return (
    <div className="w-full h-full flex flex-col p-6">
      <div className="mb-8 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl backdrop-blur-xl">
        <h2 className="text-2xl font-black uppercase tracking-widest text-indigo-400 mb-2">Executive Board</h2>
        <p className="text-white/60 font-mono text-sm tracking-widest">
          Select a board member to authenticate and access the terminal. Public bios:{' '}
          <a href="/meet-the-board" className="text-[#00E5FF] hover:underline">
            /meet-the-board
          </a>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {boardMembers.map((member) => (
          <div
            key={member.id}
            onClick={() => setSelectedMember(member)}
            className="p-6 bg-black/40 border border-white/10 rounded-3xl hover:border-indigo-500/50 hover:bg-white/5 transition-all cursor-pointer group flex flex-col items-center shadow-lg hover:shadow-indigo-500/20"
          >
            <div className="w-32 h-32 rounded-2xl overflow-hidden mb-6 border-2 border-white/20 group-hover:border-indigo-500 transition-colors">
              {member.image ? (
                <img
                  src={member.image}
                  referrerPolicy="no-referrer"
                  alt={member.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              ) : (
                <div className="w-full h-full bg-[#111] flex items-center justify-center">
                  <span className="text-3xl text-white/20 font-black uppercase">{member.name.substring(0, 2)}</span>
                </div>
              )}
            </div>
            <h3 className="text-white text-xl font-black uppercase tracking-widest text-center">{member.name}</h3>
            <p className="text-indigo-400 font-mono text-xs mt-2 uppercase tracking-[0.2em] text-center">{member.position}</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedMember && (
          <BoardLoginTerminal
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            onSuccess={(member) => {
              setSelectedMember(null);
              setAuthenticatedMember(member);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
