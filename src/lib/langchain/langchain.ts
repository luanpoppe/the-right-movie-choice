import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ModelLangchain } from "./model/model.langchain";
import { PromptLangchain } from "./prompt/prompt.langchain";
import { BaseMessage } from "@langchain/core/messages";
import z from "zod";

interface CallProps {
  model: BaseChatModel;
  prompt: BaseMessage[];
}

type CallWithStructuredOutputProps = CallProps & {
  schema: z.ZodObject;
};

export class Langchain {
  model = new ModelLangchain();

  prompt = new PromptLangchain();

  async call({ model, prompt }: CallProps) {
    const result = await model.invoke(prompt);

    return result.content;
  }

  async callWithStructuredOutput({
    model,
    prompt,
    schema,
  }: CallWithStructuredOutputProps) {
    const structuredLLM = model.withStructuredOutput(schema);
    const result = await structuredLLM.invoke(prompt);

    console.log("result: ", result);

    return result;
  }
}
