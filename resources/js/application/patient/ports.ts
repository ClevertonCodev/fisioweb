import type {
    PublicQuestionAnswer,
    PublicQuestionnaireLookup,
    PublicQuestionnaireSubmitResult,
} from '@/domain/patient/questionnaire';
import type { ReminderUnsubscribeResult } from '@/domain/patient/reminder';

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

export interface ReminderUnsubscribeRepository {
    unsubscribe(token: string): Promise<ReminderUnsubscribeResult>;
}
