import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoomsService } from '../rooms/rooms.service';
import { UpdateRoomDto } from './dto/updated-room.dto';

@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) { }

    @Post()
    create(@Body() createRoomDto: any) {
        return this.roomsService.create(createRoomDto);
    };

    @Get()
    findAll() {
        return this.roomsService.findAll();
    };

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.roomsService.findOne(id);
    };

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
        return this.roomsService.update(id, updateRoomDto);
    };

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.roomsService.remove(id);
    };

    @Patch(':id/disable')
    disable(@Param('id') id: string) {
        return this.roomsService.disable(id)
    };

    @Patch(':id/enable')
    enable(@Param('id') id: string) {
        return this.roomsService.enable(id)
    };
}
