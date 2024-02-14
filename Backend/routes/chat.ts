import { Router, Request, Response, NextFunction } from 'express';
import { SearchClient, AzureKeyCredential, odata } from '@azure/search-documents';
import { OpenAIClient, ChatRequestMessage } from '@azure/openai';
import { encoding_for_model } from "@dqbd/tiktoken";

export const chatRoute = Router();

const searchEndpoint = process.env.SEARCH_API_ENDPOINT || "";
const searchApiKey = process.env.SEARCH_API_KEY || "";
const searchIndexName = process.env.SEARCH_INDEX_NAME || "";

const azureOpenAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
const azureOpenAiApiKey = process.env.AZURE_OPENAI_API_KEY || "";
const azureOpenAiChatModel = process.env.AZURE_OPENAI_MODEL_CHAT || "";
const azureOpenAiModelEmbeddings = process.env.AZURE_OPENAI_MODEL_EMBEDDINGS || "";


interface ChatDocument {
    Id?: string | null;
    SessionId?: string | null;
    ChunkId?: number | null;
    FileName?: string | null;
    FileSize?: number | null;
    Text?: string | null;
    Embedding?: Array<number> | null;
}

interface ChatHistoryItem {
    question: string;
    answer: string;
}

const numTokensFromString = (message: string) => {
    const encoder = encoding_for_model("gpt-35-turbo");
    const tokens = encoder.encode(message);
    encoder.free();
    return tokens.length;
}

chatRoute.post("/", async(req: Request, res: Response, next: NextFunction) => {

    const sessionId = req.body.sessionId || "";
    const question = req.body.question || "";
    const history = req.body.history as ChatHistoryItem[] || [];

    if(req.body.question === "" || sessionId === "") {
        return res.status(400).send('Invalid question or session id');
    }

    const aiClient = new OpenAIClient(azureOpenAiEndpoint, new AzureKeyCredential(azureOpenAiApiKey));
    
    const translateConversation: ChatRequestMessage[] = 
        [
            { role: 'system', content: 'Simply repeat the question asked by the user into English. If it is already in English, just repeat it.' },
            { role: 'user', content: question }
        ];

    const questionEnglish = (await aiClient.getChatCompletions(azureOpenAiChatModel, translateConversation)).choices[0].message?.content || "";
    const embedding =  await aiClient.getEmbeddings(azureOpenAiModelEmbeddings, [questionEnglish]);
    const searchClient = new SearchClient<ChatDocument>(searchEndpoint, searchIndexName, new AzureKeyCredential(searchApiKey));
    const searchResults = await searchClient.search(question, {
        top: 20,
        filter: "SessionId eq '" + sessionId + "'",
        select: ["ChunkId", "Text"],
        vectorSearchOptions: {
                queries: [{
                    kind: "vector",
                    fields: ["Embedding"],
                    vector: embedding.data[0].embedding,
                    kNearestNeighborsCount: 20
                }],
        }
    });
    
    let docArray: ChatDocument[] = [];

    let maxToken = 16385 - 50; // model limit is 32k tokens, prompt is ~50 tokens
    history.forEach((item) => {
        maxToken -= numTokensFromString(item.question);
        maxToken -= numTokensFromString(item.answer);
    });

    let currentTokens = 0;
    for await (const result of searchResults.results) {
        if (currentTokens + numTokensFromString(result.document.Text || "") + numTokensFromString(question) > maxToken) {
            break;
        }
        const doc: ChatDocument = { ChunkId: result.document.ChunkId, Text: result.document.Text };
        docArray.push(doc);
        currentTokens += numTokensFromString(result.document.Text || "");
    }

    docArray = docArray.sort((a, b) => (a.ChunkId || 0) - (b.ChunkId || 0));

    let textStr = "";

    docArray.forEach((doc) => {
        textStr += doc.Text + " " || "";
    }); 

    const conversation: ChatRequestMessage[] = 
        [
            { role: 'system', content: 'You are a super helpful assistant. You answer question where possible using the knowledge below. You should answer in the language the user asks their question in: \n\n[KNOWLEDGE START]\n' + textStr + "\n[KNOWLEDGE END]" },
        ];

    history.forEach((item) => {
        conversation.push({ role: 'user', content: item.question });
        conversation.push({ role: 'assistant', content: item.answer });
    });

    conversation.push({ role: 'user', content: question });

    const result = await aiClient.getChatCompletions(azureOpenAiChatModel, conversation);

    res.json({ answer: result.choices[0].message?.content || "No answer found" });

});