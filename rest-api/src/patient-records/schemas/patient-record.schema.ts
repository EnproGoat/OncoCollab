import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, strict: false })
export class PatientRecord extends Document {
  [key: string]: any;

  @Prop({ required: true })
  profession: string;
}

export const PatientRecordSchema = SchemaFactory.createForClass(PatientRecord);
