import { IsString, IsNotEmpty, IsArray, IsMongoId, IsDateString } from 'class-validator';

export class CreateRoomDto {
    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsArray()
    @IsMongoId({ each: true })
    requiredParticipants: string[];

    @IsMongoId()
    @IsNotEmpty()
    roomAdmin: string;

    @IsDateString()
    @IsNotEmpty()
    startedAt: string;

    @IsString()
    @IsNotEmpty()
    duration: string;
}
