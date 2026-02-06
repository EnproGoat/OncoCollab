import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profession, ProfessionDocument } from './schemas/profession.schema';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { UpdateProfessionDto } from './dto/update-profession.dto';

@Injectable()
export class ProfessionsService {
    constructor(
        @InjectModel(Profession.name) private professionModel: Model<ProfessionDocument>,
    ) {}

    async create(createProfessionDto: CreateProfessionDto): Promise<Profession> {
        const existing = await this.professionModel.findOne({ name: createProfessionDto.name });
        if (existing) {
            throw new ConflictException('Cette profession existe déjà');
        }
        const profession = new this.professionModel(createProfessionDto);
        return profession.save();
    }

    async findAll(): Promise<Profession[]> {
        return this.professionModel.find().sort({ name: 1 }).exec();
    }

    async findActive(): Promise<Profession[]> {
        return this.professionModel.find({ isActive: true }).sort({ name: 1 }).exec();
    }

    async findOne(id: string): Promise<Profession> {
        const profession = await this.professionModel.findById(id).exec();
        if (!profession) {
            throw new NotFoundException('Profession non trouvée');
        }
        return profession;
    }

    async update(id: string, updateProfessionDto: UpdateProfessionDto): Promise<Profession> {
        const profession = await this.professionModel
            .findByIdAndUpdate(id, updateProfessionDto, { new: true })
            .exec();
        if (!profession) {
            throw new NotFoundException('Profession non trouvée');
        }
        return profession;
    }

    async remove(id: string): Promise<void> {
        const result = await this.professionModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Profession non trouvée');
        }
    }

    async seed(): Promise<void> {
        const professions = [
            { name: 'Oncologue', description: 'Spécialiste en oncologie', color: '#ef4444' },
            { name: 'Chirurgien', description: 'Chirurgien spécialisé', color: '#3b82f6' },
            { name: 'Radiologue', description: 'Spécialiste en imagerie médicale', color: '#8b5cf6' },
            { name: 'Anatomopathologiste', description: 'Spécialiste en anatomie pathologique', color: '#10b981' },
            { name: 'Radiothérapeute', description: 'Spécialiste en radiothérapie', color: '#f59e0b' },
            { name: 'Infirmier(ère)', description: 'Personnel infirmier', color: '#ec4899' },
            { name: 'Psychologue', description: 'Accompagnement psychologique', color: '#6366f1' },
            { name: 'Médecin généraliste', description: 'Médecin traitant', color: '#14b8a6' },
        ];

        for (const profession of professions) {
            const exists = await this.professionModel.findOne({ name: profession.name });
            if (!exists) {
                await this.professionModel.create(profession);
            }
        }
    }
}
