import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { ObjectId, Types } from 'mongoose';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Post()
    create(@Body() createMessageDto: any) {
        return this.messagesService.create(createMessageDto);
    }

    @Get()
    findAll() {
        return this.messagesService.findAll();
    }

    @Get('roomMessages/:roomId')
    findByRoom(@Param('roomId') roomId: string) {
        return this.messagesService.findByRoom(new Types.ObjectId(roomId));
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.messagesService.remove(id);
    }
}
