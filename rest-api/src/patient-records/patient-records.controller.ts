import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PatientRecordsService } from './patient-records.service';
import { CreatePatientRecordDto, UpdatePatientRecordDto } from './dto/patient-record.dto';

@Controller('patient-records')
export class PatientRecordsController {
  constructor(private readonly patientRecordsService: PatientRecordsService) {}

  @Get()
  async getAllPatientRecords() {
    return await this.patientRecordsService.getAll();
  }

  @Get(':id')
  async getPatientRecord(@Param('id') id: string) {
    return await this.patientRecordsService.findById(id);
  }

  @Post()
  async createPatientRecord(@Body() createPatientRecordDto: CreatePatientRecordDto) {
    try {
      return await this.patientRecordsService.create(createPatientRecordDto);
    } catch (error) {
      throw new HttpException('Failed to create patient record', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  async updatePatientRecord(@Param('id') id: string, @Body() updatePatientRecordDto: UpdatePatientRecordDto) {
    try {
      return await this.patientRecordsService.update(id, updatePatientRecordDto);
    } catch (error) {
      throw new HttpException('Failed to update patient record', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deletePatientRecord(@Param('id') id: string) {
    try {
      return await this.patientRecordsService.deleteById(id);
    } catch (error) {
      throw new HttpException('Failed to delete patient record', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
