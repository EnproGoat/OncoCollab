import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProfessionDocument = HydratedDocument<Profession>;

@Schema({ timestamps: true })
export class Profession {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ default: '#6366f1' })
    color: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const ProfessionSchema = SchemaFactory.createForClass(Profession);
