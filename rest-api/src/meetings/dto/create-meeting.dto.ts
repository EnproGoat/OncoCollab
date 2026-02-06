import { IsString, IsNotEmpty, IsArray, IsMongoId, IsOptional, IsDateString, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class ParticipantDto {
    @IsMongoId()
    @IsNotEmpty()
    user: string;

    @IsMongoId()
    @IsNotEmpty()
    profession: string;

    @IsBoolean()
    @IsOptional()
    isVisible?: boolean;

    @IsBoolean()
    @IsOptional()
    showProfession?: boolean;
}

export class CreateMeetingDto {
    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    time: string;

    @IsMongoId()
    @IsNotEmpty()
    patient: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ParticipantDto)
    participants: ParticipantDto[];

    @IsMongoId()
    @IsNotEmpty()
    roomAdmin: string;

    @IsDateString()
    @IsNotEmpty()
    scheduledDate: string;

    @IsString()
    @IsNotEmpty()
    duration: string;
}
