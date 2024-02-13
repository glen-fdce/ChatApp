import { Router, Request, Response, NextFunction } from 'express';
import { SearchIndexClient, SearchClient, AzureKeyCredential, odata } from '@azure/search-documents';
import { OpenAIClient, ChatRequestMessage } from '@azure/openai';

export const chatRoute = Router();

const searchEndpoint = process.env.SEARCH_API_ENDPOINT || "";
const searchApiKey = process.env.SEARCH_API_KEY || "";
const searchIndexName = process.env.SEARCH_INDEX_NAME || "";

const azureOpenAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
const azureOpenAiApiKey = process.env.AZURE_OPENAI_API_KEY || "";
const azureOpenAiChatModel = process.env.AZURE_OPENAI_MODEL_CHAT || "";
const azureOpenAiModelEmbeddings = process.env.AZURE_OPENAI_MODEL_EMBEDDINGS || "";

chatRoute.post("/", async(req: Request, res: Response, next: NextFunction) => {

    const aiClient = new OpenAIClient(azureOpenAiEndpoint, new AzureKeyCredential(azureOpenAiApiKey));
    const embedding =  await aiClient.getEmbeddings(azureOpenAiModelEmbeddings, [req.body.question]);

    // search AI Search. Use the question and embedding
    const searchClient = new SearchClient<SearchIndexClient>(searchEndpoint, searchIndexName, new AzureKeyCredential(searchApiKey));
    const searchResults = await searchClient.search(req.body.question, { top: 5 });
    
    // text of results to string
    const question = req.body.question;
    const conversation: ChatRequestMessage[] = [{ role: 'system', content: 'You are a super helpful assistant. The only information you know is below: ' + searchResults}, { role: 'user', content: question }];
    const result = await aiClient.getChatCompletions(azureOpenAiChatModel, conversation);
    res.json({ answer: result });
});