import { IsString, IsArray, IsMongoId, IsOptional, IsDateString, IsEnum, ValidateNested, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateParticipantDto {
    @IsMongoId()
    @IsNotEmpty()
    user: string;

    @IsMongoId()
    @IsOptional()
    profession?: string;

    @IsBoolean()
    @IsOptional()
    isVisible?: boolean;

    @IsBoolean()
    @IsOptional()
    showProfession?: boolean;

    @IsBoolean()
    @IsOptional()
    formFilled?: boolean;
}

export class UpdateMeetingDto {
    @IsString()
    @IsOptional()
    subject?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    time?: string;

    @IsMongoId()
    @IsOptional()
    patient?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateParticipantDto)
    @IsOptional()
    participants?: UpdateParticipantDto[];

    @IsMongoId()
    @IsOptional()
    roomAdmin?: string;

    @IsEnum(['pending', 'in-progress', 'completed', 'cancelled'])
    @IsOptional()
    status?: string;

    @IsDateString()
    @IsOptional()
    scheduledDate?: string;

    @IsDateString()
    @IsOptional()
    startedAt?: string;

    @IsString()
    @IsOptional()
    duration?: string;
}
