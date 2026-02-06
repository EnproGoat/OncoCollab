import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PatientRecord } from './schemas/patient-record.schema';
import { CreatePatientRecordDto, UpdatePatientRecordDto } from './dto/patient-record.dto';
import { seedPatientRecords } from './seed-data';

@Injectable()
export class PatientRecordsService implements OnModuleInit {
  constructor(
    @InjectModel(PatientRecord.name) private patientRecordModel: Model<PatientRecord>,
  ) {}

  async onModuleInit() {
    const count = await this.patientRecordModel.countDocuments().exec();
    if (count === 0) {
      await this.patientRecordModel.insertMany(seedPatientRecords);
      console.log('✓ Données patient records importées depuis mockData.json');
    }
  }

  async getAll(): Promise<PatientRecord[]> {
    return await this.patientRecordModel.find().exec();
  }

  async findById(id: string): Promise<PatientRecord> {
    return await this.patientRecordModel.findById(id).exec();
  }

  async create(createPatientRecordDto: CreatePatientRecordDto): Promise<PatientRecord> {
    const createdPatientRecord = new this.patientRecordModel(createPatientRecordDto);
    return await createdPatientRecord.save();
  }

  async update(id: string, updatePatientRecordDto: UpdatePatientRecordDto): Promise<PatientRecord> {
    return await this.patientRecordModel.findByIdAndUpdate(
      id,
      { $set: updatePatientRecordDto },
      { new: true },
    ).exec();
  }

  async deleteById(id: string): Promise<any> {
    return await this.patientRecordModel.findByIdAndDelete(id).exec();
  }
}
