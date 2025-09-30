import { ChatHistoryEntity } from "@/entities/chat-history.entity";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  BaseMessagePromptTemplateLike,
  ChatPromptTemplate,
} from "@langchain/core/prompts";
import { InputValues } from "@langchain/core/utils/types";

interface PromptLangchainCreateWithParamsProps<T> {
  userMessage: string;
  systemMessage?: string;
  inputVariables: T;
}

interface PromptLangchainCreateProps {
  userMessage: string;
  systemaMessage?: string;
}

export class PromptLangchain {
  create({
    userMessage,
    systemaMessage,
  }: PromptLangchainCreateProps): BaseMessage[] {
    const messages = [];

    if (systemaMessage) messages.push(new SystemMessage(systemaMessage));

    messages.push(new HumanMessage(userMessage));

    return messages;
  }

  async createWithParams<T extends InputValues>({
    userMessage,
    inputVariables,
    systemMessage,
  }: PromptLangchainCreateWithParamsProps<T>) {
    const messages: BaseMessagePromptTemplateLike[] = [];

    if (systemMessage) messages.push(["system", systemMessage]);

    messages.push(["user", userMessage]);

    const promptTemplate = ChatPromptTemplate.fromMessages<T>(messages);
    const promptWithParams = await promptTemplate.invoke(inputVariables);

    return promptWithParams.toChatMessages();
  }

  createChatHistory(userMessage: string, { chatHistory }: ChatHistoryEntity) {
    const messages: BaseMessagePromptTemplateLike[] = [];

    messages.push(...chatHistory);

    messages.push(["user", userMessage]);

    return messages;
  }
}
