import React, { useState } from 'react';
import { useAuth } from '../contexts/FirebaseContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  AlertCircle,
  Layout
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { InterfaceProfile } from '../types';

interface TodoListProps {
  profile: InterfaceProfile;
}

export default function TodoList({ profile }: TodoListProps) {
  const { tasks, addTask, toggleTask, deleteTask } = useAuth();
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    await addTask(newTask, dueDate || null);
    setNewTask('');
    setDueDate('');
    setIsAdding(false);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && !b.dueDate) return -1;
    if (a.dueDate && b.dueDate) return a.dueDate.seconds - b.dueDate.seconds;
    return b.createdAt.seconds - a.createdAt.seconds;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Layout size={20} className="text-indigo-500" />
          <h3 className="text-xl font-black tracking-tighter uppercase italic" style={{ color: profile.text }}>
            Tactical <span style={{ color: profile.borderA }}>Checklist</span>
          </h3>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          style={{ color: profile.borderA }}
        >
          <Plus size={20} className={isAdding ? 'rotate-45' : ''} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl border glass space-y-4 mb-6" style={{ borderColor: `${profile.borderA}22`, background: `${profile.borderA}05` }}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block" style={{ color: profile.text }}>Task Description</label>
                <input 
                  type="text" 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Define mission objective..."
                  className="w-full bg-black/40 border rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                  style={{ color: profile.text, borderColor: `${profile.borderA}11` }}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block" style={{ color: profile.text }}>Due Date (Optional)</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-black/40 border rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 transition-all pr-10"
                    style={{ color: profile.text, borderColor: `${profile.borderA}11`, colorScheme: 'dark' }}
                  />
                  <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30" style={{ color: profile.borderA }} />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all hover:brightness-110"
                style={{ backgroundColor: profile.borderA, color: '#000' }}
              >
                Assemble Task
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 space-y-4 opacity-30">
            <CheckCircle2 size={40} className="mx-auto" style={{ color: profile.borderA }} />
            <p className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: profile.text }}>Clear of all mission objectives</p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const date = task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000) : null;
            const isOverdue = date && isPast(date) && !isToday(date) && !task.completed;
            
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-2xl border glass flex items-center justify-between group transition-all ${task.completed ? 'opacity-50' : ''}`}
                style={{ 
                  borderColor: isOverdue ? '#ef444444' : `${profile.borderA}11`,
                  background: isOverdue ? 'rgba(239, 68, 68, 0.02)' : 'transparent'
                }}
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <button 
                    onClick={() => toggleTask(task.id!, !task.completed)}
                    className="transition-transform active:scale-95"
                    style={{ color: task.completed ? '#4D00FF' : profile.borderA }}
                  >
                    {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} className="opacity-30 group-hover:opacity-100" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate transition-all ${task.completed ? 'line-through text-gray-500' : ''}`} style={{ color: profile.text }}>
                      {task.title}
                    </p>
                    {date && (
                      <div className="flex items-center space-x-1.5 mt-1">
                        <Calendar size={10} className={isOverdue ? 'text-red-500' : 'text-gray-500'} />
                        <span className={`text-[9px] font-mono uppercase tracking-tighter ${isOverdue ? 'text-red-500 font-black' : 'text-gray-500'}`}>
                          {isOverdue ? 'OVERDUE' : 'DUE'}: {format(date, 'MMM dd, yyyy')}
                        </span>
                        {isOverdue && <AlertCircle size={10} className="text-red-500 " />}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => deleteTask(task.id!)}
                  className="p-2 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
