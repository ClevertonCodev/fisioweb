import type {
    PublicQuestionAnswer,
    PublicQuestionnaireLookup,
    PublicQuestionnaireSubmitResult,
} from '@/domain/patient/questionnaire';

export interface PublicQuestionnaireAnswerWriteDto {
    questionId: number;
    answer: PublicQuestionAnswer;
}

export interface PublicQuestionnairesRepository {
    findByToken(token: string): Promise<PublicQuestionnaireLookup>;
    submitAnswers(
        token: string,
        answers: PublicQuestionnaireAnswerWriteDto[],
    ): Promise<PublicQuestionnaireSubmitResult>;
}
