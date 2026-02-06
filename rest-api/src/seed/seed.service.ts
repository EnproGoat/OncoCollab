import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Profession, ProfessionDocument } from '../professions/schemas/profession.schema';
import { Meeting, MeetingDocument } from '../meetings/schemas/meeting.schema';
import { PatientRecord } from '../patient-records/schemas/patient-record.schema';
import * as argon2 from 'argon2';

@Injectable()
export class SeedService implements OnModuleInit {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Profession.name) private professionModel: Model<ProfessionDocument>,
        @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>,
        @InjectModel(PatientRecord.name) private patientRecordModel: Model<PatientRecord>,
    ) {}

    async onModuleInit() {
        console.log('🌱 Vérification des données de démo...');
        await this.seedProfessions();
        await this.seedUsers();
        await this.seedPatientRecords();
        await this.seedMeetings();
        console.log('✅ Données de démo vérifiées/créées');
    }

    private async seedProfessions() {
        const professions = [
            { name: 'Oncologue', description: 'Spécialiste en oncologie', color: '#ef4444' },
            { name: 'Chirurgien', description: 'Chirurgien spécialisé', color: '#3b82f6' },
            { name: 'Radiologue', description: 'Spécialiste en imagerie médicale', color: '#8b5cf6' },
            { name: 'Anatomopathologiste', description: 'Spécialiste en anatomie pathologique', color: '#10b981' },
            { name: 'Radiothérapeute', description: 'Spécialiste en radiothérapie', color: '#f59e0b' },
            { name: 'Infirmier(ère)', description: 'Personnel infirmier', color: '#ec4899' },
            { name: 'Psychologue', description: 'Accompagnement psychologique', color: '#6366f1' },
            { name: 'Médecin généraliste', description: 'Médecin traitant', color: '#14b8a6' },
        ];

        for (const profession of professions) {
            const exists = await this.professionModel.findOne({ name: profession.name });
            if (!exists) {
                await this.professionModel.create(profession);
                console.log(`  ➕ Profession créée: ${profession.name}`);
            }
        }
    }

    private async seedUsers() {
        const oncologueProfession = await this.professionModel.findOne({ name: 'Oncologue' });
        const chirurgienProfession = await this.professionModel.findOne({ name: 'Chirurgien' });
        const radiologueProfession = await this.professionModel.findOne({ name: 'Radiologue' });
        const anatomoPathProfession = await this.professionModel.findOne({ name: 'Anatomopathologiste' });
        const infirmierProfession = await this.professionModel.findOne({ name: 'Infirmier(ère)' });

        // Mettre à jour l'utilisateur cedric@gmail.com s'il existe avec l'ancien schéma
        const cedric = await this.userModel.findOne({ email: 'cedric@gmail.com' });
        if (cedric && !cedric.profession) {
            await this.userModel.updateOne(
                { email: 'cedric@gmail.com' },
                { 
                    $set: { 
                        firstName: 'Cédric',
                        profession: oncologueProfession._id 
                    },
                    $unset: { fistName: 1, job: 1 }
                }
            );
            console.log('  🔄 Utilisateur cedric@gmail.com mis à jour');
        }

        const users = [
            {
                email: 'sophie.martin@oncocollab.fr',
                firstName: 'Sophie',
                lastName: 'Martin',
                profession: chirurgienProfession._id,
                password: await argon2.hash('password123'),
                isAdmin: false
            },
            {
                email: 'jean.dupont@oncocollab.fr',
                firstName: 'Jean',
                lastName: 'Dupont',
                profession: radiologueProfession._id,
                password: await argon2.hash('password123'),
                isAdmin: false
            },
            {
                email: 'marie.lefevre@oncocollab.fr',
                firstName: 'Marie',
                lastName: 'Lefèvre',
                profession: anatomoPathProfession._id,
                password: await argon2.hash('password123'),
                isAdmin: false
            },
            {
                email: 'paul.bernard@oncocollab.fr',
                firstName: 'Paul',
                lastName: 'Bernard',
                profession: infirmierProfession._id,
                password: await argon2.hash('password123'),
                isAdmin: false
            },
            {
                email: 'admin@oncocollab.fr',
                firstName: 'Admin',
                lastName: 'System',
                profession: oncologueProfession._id,
                password: await argon2.hash('admin123'),
                isAdmin: true
            }
        ];

        for (const user of users) {
            const exists = await this.userModel.findOne({ email: user.email });
            if (!exists) {
                await this.userModel.create(user);
                console.log(`  ➕ Utilisateur créé: ${user.email}`);
            }
        }
    }

    private async seedPatientRecords() {
        const patients = [
            {
                firstName: 'Michel',
                lastName: 'Dubois',
                profession: 'Patient',
                dateOfBirth: '1958-03-15',
                gender: 'M',
                diagnosis: 'Cancer du poumon - Stade IIA',
                notes: 'Patient suivi depuis janvier 2026'
            },
            {
                firstName: 'Françoise',
                lastName: 'Lambert',
                profession: 'Patient',
                dateOfBirth: '1965-07-22',
                gender: 'F',
                diagnosis: 'Cancer du sein - Triple négatif',
                notes: 'Chimiothérapie néoadjuvante en cours'
            },
            {
                firstName: 'Robert',
                lastName: 'Moreau',
                profession: 'Patient',
                dateOfBirth: '1972-11-08',
                gender: 'M',
                diagnosis: 'Mélanome - Stade III',
                notes: 'Immunothérapie prévue'
            }
        ];

        const count = await this.patientRecordModel.countDocuments();
        if (count === 0) {
            for (const patient of patients) {
                await this.patientRecordModel.create(patient);
                console.log(`  ➕ Patient créé: ${patient.firstName} ${patient.lastName}`);
            }
        }
    }

    private async seedMeetings() {
        const count = await this.meetingModel.countDocuments();
        if (count > 0) return;

        const users = await this.userModel.find().populate('profession');
        const patients = await this.patientRecordModel.find();

        if (users.length < 2 || patients.length === 0) {
            console.log('  ⚠️ Pas assez de données pour créer des réunions');
            return;
        }

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const meetings = [
            {
                roomId: 'demo-room-001',
                subject: 'RCP - Cas Michel Dubois',
                description: 'Réunion de concertation pluridisciplinaire pour discuter du plan de traitement',
                time: '14:00',
                patient: patients[0]._id,
                participants: users.slice(0, 4).map(u => ({
                    user: u._id,
                    profession: u.profession._id || u.profession,
                    isVisible: true,
                    showProfession: true,
                    formFilled: false
                })),
                roomAdmin: users[0]._id,
                status: 'pending',
                scheduledDate: tomorrow,
                duration: '1h'
            },
            {
                roomId: 'demo-room-002',
                subject: 'Suivi post-opératoire - Mme Lambert',
                description: 'Discussion sur les résultats de l\'intervention et planification de la suite',
                time: '10:30',
                patient: patients[1]?._id || patients[0]._id,
                participants: users.slice(0, 3).map(u => ({
                    user: u._id,
                    profession: u.profession._id || u.profession,
                    isVisible: true,
                    showProfession: true,
                    formFilled: false
                })),
                roomAdmin: users[0]._id,
                status: 'pending',
                scheduledDate: nextWeek,
                duration: '45min'
            }
        ];

        for (const meeting of meetings) {
            await this.meetingModel.create(meeting);
            console.log(`  ➕ Réunion créée: ${meeting.subject}`);
        }
    }
}
