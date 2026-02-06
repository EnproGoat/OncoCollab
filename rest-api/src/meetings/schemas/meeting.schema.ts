import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MeetingDocument = HydratedDocument<Meeting>;

@Schema({ timestamps: true })
export class Meeting {
    @Prop({ required: true, unique: true })
    roomId: string;

    @Prop({ required: true })
    subject: string;

    @Prop()
    description: string;

    @Prop({ required: true })
    time: string;

    @Prop({ type: Types.ObjectId, ref: 'PatientRecord', required: true })
    patient: Types.ObjectId;

    @Prop([{
        user: { type: Types.ObjectId, ref: 'User', required: true },
        profession: { type: Types.ObjectId, ref: 'Profession', required: true },
        isVisible: { type: Boolean, default: true },
        showProfession: { type: Boolean, default: true },
        formFilled: { type: Boolean, default: false },
        patientRecord: { type: Types.ObjectId, ref: 'PatientRecord' },
        filledAt: { type: Date },
        joinedAt: { type: Date },
        leftAt: { type: Date }
    }])
    participants: {
        user: Types.ObjectId;
        profession: Types.ObjectId;
        isVisible: boolean;
        showProfession: boolean;
        formFilled: boolean;
        patientRecord?: Types.ObjectId;
        filledAt?: Date;
        joinedAt?: Date;
        leftAt?: Date;
    }[];

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    roomAdmin: Types.ObjectId;

    @Prop({
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    })
    status: string;

    @Prop({ required: true })
    scheduledDate: Date;

    @Prop()
    startedAt: Date;

    @Prop({ required: true })
    duration: string;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
