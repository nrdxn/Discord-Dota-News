export type ChangeEnablingDtoTypes = 'Post' | 'Comments' | 'Webhook'

export interface ChangeEnablingDto {
    readonly guildId: string;
    readonly type: ChangeEnablingDtoTypes
}
