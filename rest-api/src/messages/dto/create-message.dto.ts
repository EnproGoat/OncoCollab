import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsMongoId()
    @IsNotEmpty()
    sender: string;

    @IsString()
    @IsNotEmpty()
    room: string;

    createdAt: Date;
}
