import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Chat: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = React.useState<any>(null);
    const [activeTab, setActiveTab] = React.useState<'individual' | 'group'>('individual');

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const individualChats = [
        { id: 1, name: "Dr. Martin", lastMessage: "D'accord, merci pour les infos", time: "10:30", unread: 2 },
        { id: 2, name: "Dr. Dubois", lastMessage: "Le dossier est prêt", time: "09:15", unread: 0 },
        { id: 3, name: "Inf. Sophie", lastMessage: "RDV confirmé pour demain", time: "Hier", unread: 1 },
    ];

    const groupChats = [
        { id: 1, name: "Équipe Oncologie", members: 8, lastMessage: "Réunion reportée à 15h", time: "11:00", unread: 5 },
        { id: 2, name: "RCP Poumon", members: 5, lastMessage: "Nouveau cas à discuter", time: "Hier", unread: 0 },
        { id: 3, name: "Staff Chirurgie", members: 12, lastMessage: "Planning mis à jour", time: "Lun", unread: 3 },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
            <div className="flex h-screen">
                <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
                    <div className="p-4 border-b border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                            <Link
                                to="/"
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                            >
                                <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <h2 className="text-xl font-bold text-white">Messagerie</h2>
                        </div>

                        <div className="flex bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('individual')}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'individual' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Individuel
                            </button>
                            <button
                                onClick={() => setActiveTab('group')}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'group' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Groupes
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'individual' ? (
                            <div className="p-2">
                                {individualChats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        className="w-full p-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-3 text-left"
                                    >
                                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-white">{chat.name}</span>
                                                <span className="text-xs text-slate-500">{chat.time}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 truncate">{chat.lastMessage}</p>
                                        </div>
                                        {chat.unread > 0 && (
                                            <span className="w-5 h-5 bg-teal-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                                                {chat.unread}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-2">
                                {groupChats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        className="w-full p-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-3 text-left"
                                    >
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-white">{chat.name}</span>
                                                <span className="text-xs text-slate-500">{chat.time}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 truncate">{chat.lastMessage}</p>
                                            <p className="text-xs text-slate-500">{chat.members} membres</p>
                                        </div>
                                        {chat.unread > 0 && (
                                            <span className="w-5 h-5 bg-blue-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                                                {chat.unread}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-800">
                        <button className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nouvelle conversation
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center bg-slate-950">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Sélectionnez une conversation</h3>
                        <p className="text-slate-400">Choisissez une conversation dans la liste pour commencer à discuter</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
