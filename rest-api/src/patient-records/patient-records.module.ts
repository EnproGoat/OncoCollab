import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientRecordsController } from './patient-records.controller';
import { PatientRecordsService } from './patient-records.service';
import { PatientRecord, PatientRecordSchema } from './schemas/patient-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PatientRecord.name, schema: PatientRecordSchema }]),
  ],
  controllers: [PatientRecordsController],
  providers: [PatientRecordsService],
  exports: [PatientRecordsService],
})
export class PatientRecordsModule {}
