import { IsMongoId, IsNotEmpty } from 'class-validator';

export class MarkFormFilledDto {
    @IsMongoId()
    @IsNotEmpty()
    participantId: string;

    @IsMongoId()
    @IsNotEmpty()
    patientRecordId: string;
}
