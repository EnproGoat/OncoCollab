import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/updated-room.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomsService {
    constructor(@InjectModel(Room.name) private roomModel: Model<Room>) { }

    async create(createRoomDto: CreateRoomDto): Promise<Room> {
        const roomData = {
            ...createRoomDto,
            roomId: uuidv4(),
        };
        const createdRoom = new this.roomModel(roomData);
        return createdRoom.save();
    }

    findAll() {
        // à faire si on veut un panel admin de l'app
        return;
    }

    async findOne(id: string): Promise<Room> {
        return this.roomModel.findById(id).exec();
    }

    update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
        return this.roomModel.findByIdAndUpdate(id, updateRoomDto, { new: true }).exec();
    }

    remove(id: string): Promise<Room> {
        return this.roomModel.findByIdAndDelete(id).exec();
    }

    disable(id: string): Promise<Room> {
        return this.roomModel.findByIdAndUpdate(id, { active: false }, { new: false })
    }

    enable(id: string): Promise<Room> {
        return this.roomModel.findByIdAndUpdate(id, { active: true }, { new: false })
    }
}
