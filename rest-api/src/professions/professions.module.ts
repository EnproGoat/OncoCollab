import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfessionsController } from './professions.controller';
import { ProfessionsService } from './professions.service';
import { Profession, ProfessionSchema } from './schemas/profession.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Profession.name, schema: ProfessionSchema }]),
    ],
    controllers: [ProfessionsController],
    providers: [ProfessionsService],
    exports: [ProfessionsService],
})
export class ProfessionsModule {}
