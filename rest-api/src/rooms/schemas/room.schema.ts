import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoomDocument = HydratedDocument<Room>;

@Schema()
export class Room {
    @Prop({ required: true })
    roomId: string;

    @Prop({ required: true })
    subject: string;

    @Prop([{ type: Types.ObjectId, ref: 'User' }])
    requiredParticipants: Types.ObjectId[];

    @Prop([{ type: Types.ObjectId, ref: 'User' }])
    roomAdmin: Types.ObjectId;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ required: true })
    startedAt: Date;

    @Prop({ required: true })
    duration: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
