import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsMongoId()
    @IsNotEmpty()
    sender: string;

    @IsMongoId()
    @IsNotEmpty()
    room: string;

    createdAt: Date;
}
