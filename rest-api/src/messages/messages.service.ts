import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
    constructor(@InjectModel(Message.name) private messageModel: Model<Message>) { }

    create(createMessageDto: CreateMessageDto) {
        const createdMessage = new this.messageModel(createMessageDto);
        return createdMessage.save();
    }

    findAll() {
        // à faire si on veut un panel admin
        return;
    }

    async findByRoom(roomId: string): Promise<Message[]> {
        return this.messageModel.find({ room: roomId }).sort({ createdAt: 1 }).exec();
    }

    remove(id: string) {
        // à faire si on veut un panel admin
        return;
    }
}
