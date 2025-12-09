import React from 'react';


const meetings = [
    {
        id: 1,
        patientName: "Jean Dupont",
        subject: "RCP Post-opératoire",
        formFilled: true,
        time: "14:00"
    },
    {
        id: 2,
        patientName: "Marie Durant",
        subject: "Validation protocole chimio",
        formFilled: false,
        time: "14:30"
    },
    {
        id: 3,
        patientName: "Pierre Kowalski",
        subject: "Suivi évolution",
        formFilled: true,
        time: "15:00"
    }
];

interface DashboardProps {
    onJoinMeeting: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onJoinMeeting }) => {
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const displayUser = user || {
        fistName: "FIRSTNAME NOT FOUND",
        lastName: "LASTNAME NOT FOUND",
        job: "JOB NOT FOUND"
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <div className="flex items-center gap-4 mb-12 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 w-fit backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-teal-500/50 shadow-lg shadow-teal-500/20 flex items-center justify-center bg-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">{displayUser.fistName} {displayUser.lastName}</h1>
                    <p className="text-teal-400 text-sm font-medium">({displayUser.job})</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <span className="w-2 h-8 bg-teal-500 rounded-full inline-block"></span>
                    Réunions en attente
                </h2>

                <div className="grid gap-6">
                    {meetings.map((meeting) => (
                        <div
                            key={meeting.id}
                            className="group bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-teal-500/50 transition-all duration-300 shadow-lg hover:shadow-teal-500/10"
                        >
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700 font-mono">
                                            {meeting.time}
                                        </span>
                                        <h3 className="text-xl font-semibold text-white group-hover:text-teal-400 transition-colors">
                                            {meeting.patientName}
                                        </h3>
                                    </div>
                                    <p className="text-slate-400 text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                        {meeting.subject}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg border border-slate-700 transition-all flex items-center gap-2">
                                        <span>📄</span> Dossier Patient
                                    </button>

                                    {meeting.formFilled ? (
                                        <div className="px-4 py-2 bg-teal-500/10 text-teal-400 text-sm rounded-lg border border-teal-500/20 flex items-center gap-2">
                                            <span>✅</span> Pré-requis réalisé
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 bg-amber-500/10 text-amber-400 text-sm rounded-lg border border-amber-500/20 flex items-center gap-2">
                                            <span>⚠️</span> Pré-requis manquant
                                        </div>
                                    )}

                                    <button
                                        onClick={onJoinMeeting}
                                        className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg shadow-lg shadow-teal-900/20 hover:shadow-teal-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        Rejoindre
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
