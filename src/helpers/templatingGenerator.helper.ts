import { GuildMember } from "discord.js"

interface ITemplateProvider {
    member?: GuildMember;
}

interface ITemplateTransformer {
    name: string;
    data: string | number | undefined | null;
}

export const getListTemplateTransformer = (data: ITemplateProvider): ITemplateTransformer[] => {
    return [
        {
            name: 'username',
            data: data.member?.user.username
        },
        {
            name: 'userId',
            data: data.member?.user.id
        },
        {
            name: 'userTag',
            data: data.member?.user.tag
        },
        {
            name: 'userCreatedAt',
            data: data.member?.user.createdAt.toDateString()
        },
        {
            name: 'userCreatedAtTimestamp',
            data: data.member?.user.createdTimestamp
        },
    ]
}

export const generatingText = (text: string, data: ITemplateProvider): string => {
    const listTemplate = getListTemplateTransformer(data);

    for (const transformer of listTemplate) {
        if (transformer.data) {
            const regex = new RegExp(`{${transformer.name}}`, "gm")
            text = text.replace(regex, transformer.data.toString());
        }
    }

    return text;
}