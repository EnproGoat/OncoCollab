import { Injectable, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meeting, MeetingDocument } from './schemas/meeting.schema';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MarkFormFilledDto } from './dto/add-patient-record.dto';
import { v4 as uuidv4 } from 'uuid';
import { seedMeetings } from './seed-data';

@Injectable()
export class MeetingsService implements OnModuleInit {
    constructor(
        @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>
    ) {}

    async onModuleInit() {
        const count = await this.meetingModel.countDocuments().exec();
        if (count === 0) {
            console.log('⏳ Initialisation des meetings de démonstration...');
        }
    }

    async create(createMeetingDto: CreateMeetingDto): Promise<Meeting> {
        const meetingData = {
            ...createMeetingDto,
            roomId: uuidv4(),
            participants: createMeetingDto.participants.map(p => ({
                user: new Types.ObjectId(p.user),
                profession: new Types.ObjectId(p.profession),
                isVisible: p.isVisible ?? true,
                showProfession: p.showProfession ?? true,
                formFilled: false
            }))
        };
        const createdMeeting = new this.meetingModel(meetingData);
        return createdMeeting.save();
    }

    async findAll(): Promise<Meeting[]> {
        return this.meetingModel
            .find()
            .populate('patient')
            .populate('participants.user')
            .populate('participants.profession')
            .populate('roomAdmin')
            .exec();
    }

    async findOne(id: string): Promise<Meeting> {
        const meeting = await this.meetingModel
            .findById(id)
            .populate('patient')
            .populate('participants.user')
            .populate('participants.profession')
            .populate('roomAdmin')
            .exec();
        
        if (!meeting) {
            throw new NotFoundException(`Meeting with ID ${id} not found`);
        }
        return meeting;
    }

    async findByRoomId(roomId: string): Promise<Meeting> {
        const meeting = await this.meetingModel
            .findOne({ roomId })
            .populate('patient')
            .populate('participants.user')
            .populate('participants.profession')
            .populate('roomAdmin')
            .exec();
        
        if (!meeting) {
            throw new NotFoundException(`Meeting with roomId ${roomId} not found`);
        }
        return meeting;
    }

    async findByParticipant(participantId: string): Promise<Meeting[]> {
        return this.meetingModel
            .find({ 'participants.user': new Types.ObjectId(participantId) })
            .populate('patient')
            .populate('participants.user')
            .populate('participants.profession')
            .populate('roomAdmin')
            .exec();
    }

    async findPending(): Promise<Meeting[]> {
        return this.meetingModel
            .find({ status: 'pending' })
            .populate('patient')
            .populate('participants.user')
            .populate('participants.profession')
            .populate('roomAdmin')
            .exec();
    }

    async update(id: string, updateMeetingDto: UpdateMeetingDto, requesterId?: string): Promise<Meeting> {
        const meeting = await this.meetingModel.findById(id).exec();
        
        if (!meeting) {
            throw new NotFoundException(`Meeting with ID ${id} not found`);
        }

        if (requesterId && meeting.roomAdmin.toString() !== requesterId) {
            throw new ForbiddenException('Only the room admin can update this meeting');
        }

        let updateData: any = { ...updateMeetingDto };
        
        if (updateMeetingDto.participants) {
            updateData.participants = updateMeetingDto.participants.map(p => {
                const existingParticipant = meeting.participants.find(
                    ep => ep.user.toString() === p.user
                );
                return {
                    user: new Types.ObjectId(p.user),
                    profession: p.profession ? new Types.ObjectId(p.profession) : existingParticipant?.profession,
                    isVisible: p.isVisible ?? existingParticipant?.isVisible ?? true,
                    showProfession: p.showProfession ?? existingParticipant?.showProfession ?? true,
                    formFilled: p.formFilled ?? existingParticipant?.formFilled ?? false,
                    filledAt: existingParticipant?.filledAt,
                    patientRecord: existingParticipant?.patientRecord
                };
            });
        }

        const updatedMeeting = await this.meetingModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .populate('patient')
            .populate('participants.user')
            .populate('participants.profession')
            .populate('roomAdmin')
            .exec();
        
        return updatedMeeting;
    }

    async remove(id: string): Promise<Meeting> {
        const deletedMeeting = await this.meetingModel.findByIdAndDelete(id).exec();
        if (!deletedMeeting) {
            throw new NotFoundException(`Meeting with ID ${id} not found`);
        }
        return deletedMeeting;
    }

    async markFormFilled(meetingId: string, markFormFilledDto: MarkFormFilledDto): Promise<Meeting> {
        const meeting = await this.meetingModel.findById(meetingId).exec();
        if (!meeting) {
            throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
        }

        const participantIndex = meeting.participants.findIndex(
            p => p.user.toString() === markFormFilledDto.participantId
        );

        if (participantIndex === -1) {
            throw new NotFoundException(`Participant not found in this meeting`);
        }

        meeting.participants[participantIndex].formFilled = true;
        meeting.participants[participantIndex].patientRecord = new Types.ObjectId(markFormFilledDto.patientRecordId);
        meeting.participants[participantIndex].filledAt = new Date();

        return meeting.save();
    }

    async getPatientForMeeting(meetingId: string): Promise<any> {
        const meeting = await this.meetingModel
            .findById(meetingId)
            .populate('patient')
            .exec();

        if (!meeting) {
            throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
        }

        return meeting.patient;
    }

    async getParticipantsStatus(meetingId: string): Promise<any[]> {
        const meeting = await this.meetingModel
            .findById(meetingId)
            .populate('participants.user')
            .populate('participants.profession')
            .populate('participants.patientRecord')
            .exec();

        if (!meeting) {
            throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
        }

        return meeting.participants;
    }

    async getPatientRecordsForMeeting(meetingId: string): Promise<any[]> {
        const meeting = await this.meetingModel
            .findById(meetingId)
            .populate('participants.user')
            .populate('participants.profession')
            .populate('participants.patientRecord')
            .exec();

        if (!meeting) {
            throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
        }

        return meeting.participants
            .filter(p => p.formFilled && p.patientRecord)
            .map(p => ({
                user: p.user,
                profession: p.profession,
                patientRecord: p.patientRecord,
                filledAt: p.filledAt
            }));
    }

    async startMeeting(id: string): Promise<Meeting> {
        const meeting = await this.meetingModel.findById(id).exec();
        if (!meeting) {
            throw new NotFoundException(`Meeting with ID ${id} not found`);
        }

        meeting.status = 'in-progress';
        meeting.startedAt = new Date();
        return meeting.save();
    }

    async completeMeeting(id: string): Promise<Meeting> {
        return this.meetingModel
            .findByIdAndUpdate(id, { status: 'completed' }, { new: true })
            .populate('patient')
            .populate('participants.user')
            .populate('participants.profession')
            .exec();
    }

    async cancelMeeting(id: string): Promise<Meeting> {
        return this.meetingModel
            .findByIdAndUpdate(id, { status: 'cancelled' }, { new: true })
            .populate('patient')
            .populate('participants.user')
            .populate('participants.profession')
            .exec();
    }

    async addParticipant(meetingId: string, participantId: string, professionId: string): Promise<Meeting> {
        const meeting = await this.meetingModel.findById(meetingId).exec();
        if (!meeting) {
            throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
        }

        const alreadyExists = meeting.participants.some(
            p => p.user.toString() === participantId
        );

        if (!alreadyExists) {
            meeting.participants.push({
                user: new Types.ObjectId(participantId),
                profession: new Types.ObjectId(professionId),
                isVisible: true,
                showProfession: true,
                formFilled: false
            });
            await meeting.save();
        }

        return this.findOne(meetingId);
    }

    async removeParticipant(meetingId: string, participantId: string): Promise<Meeting> {
        const meeting = await this.meetingModel.findById(meetingId).exec();
        if (!meeting) {
            throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
        }

        meeting.participants = meeting.participants.filter(
            p => p.user.toString() !== participantId
        );

        await meeting.save();
        return this.findOne(meetingId);
    }

    async updateParticipantVisibility(
        meetingId: string, 
        participantId: string, 
        isVisible: boolean, 
        showProfession?: boolean
    ): Promise<Meeting> {
        const meeting = await this.meetingModel.findById(meetingId).exec();
        if (!meeting) {
            throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
        }

        const participantIndex = meeting.participants.findIndex(
            p => p.user.toString() === participantId
        );

        if (participantIndex === -1) {
            throw new NotFoundException(`Participant not found in this meeting`);
        }

        meeting.participants[participantIndex].isVisible = isVisible;
        if (showProfession !== undefined) {
            meeting.participants[participantIndex].showProfession = showProfession;
        }

        await meeting.save();
        return this.findOne(meetingId);
    }
}
