import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientRecordDto, UpdatePatientRecordDto } from './dto/patient-record.dto';
import { serializePatientRecord } from '../common/serializers/serializers';
import { seedPatientRecords } from './seed-data';

@Injectable()
export class PatientRecordsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.patientRecord.count();
    if (count === 0) {
      for (const record of seedPatientRecords) {
        const { profession, ...dynamicData } = record;
        await this.prisma.patientRecord.create({
          data: { profession, data: dynamicData },
        });
      }
      console.log('✓ Données patient records importées depuis seedData');
    }
  }

  async getAll() {
    const records = await this.prisma.patientRecord.findMany();
    return records.map(serializePatientRecord);
  }

  async findById(id: string) {
    const record = await this.prisma.patientRecord.findUnique({
      where: { id },
    });
    return serializePatientRecord(record);
  }

  async create(createPatientRecordDto: CreatePatientRecordDto) {
    const { profession, ...dynamicData } = createPatientRecordDto;
    const record = await this.prisma.patientRecord.create({
      data: {
        profession: profession || 'Patient',
        data: dynamicData,
      },
    });
    return serializePatientRecord(record);
  }

  async update(id: string, updatePatientRecordDto: UpdatePatientRecordDto) {
    const existing = await this.prisma.patientRecord.findUnique({
      where: { id },
    });
    const { profession, ...dynamicFields } = updatePatientRecordDto;
    const mergedData = {
      ...((existing?.data as object) ?? {}),
      ...dynamicFields,
    };
    const record = await this.prisma.patientRecord.update({
      where: { id },
      data: {
        ...(profession && { profession }),
        data: mergedData,
      },
    });
    return serializePatientRecord(record);
  }

  async deleteById(id: string) {
    return this.prisma.patientRecord.delete({ where: { id } });
  }
}
