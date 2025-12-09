import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    fistName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ required: true })
    job: string;

    @Prop({ default: false })
    isAdmin: boolean;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, default: Date.now })
    createdAt: Date;

    @Prop({ required: true, default: Date.now })
    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
