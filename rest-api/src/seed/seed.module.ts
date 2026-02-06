import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Profession, ProfessionSchema } from '../professions/schemas/profession.schema';
import { Meeting, MeetingSchema } from '../meetings/schemas/meeting.schema';
import { PatientRecord, PatientRecordSchema } from '../patient-records/schemas/patient-record.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Profession.name, schema: ProfessionSchema },
            { name: Meeting.name, schema: MeetingSchema },
            { name: PatientRecord.name, schema: PatientRecordSchema },
        ]),
    ],
    providers: [SeedService],
})
export class SeedModule {}
