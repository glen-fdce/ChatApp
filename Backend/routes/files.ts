import { Router, Request, Response, NextFunction } from 'express';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import { OpenAIClient } from '@azure/openai';

export const filesRoute  = Router();

const searchEndpoint = process.env.SEARCH_API_ENDPOINT || "";
const searchApiKey = process.env.SEARCH_API_KEY || "";
const searchIndexName = process.env.SEARCH_INDEX_NAME || "";

const azureOpenAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
const azureOpenAiApiKey = process.env.AZURE_OPENAI_API_KEY || "";
const azureOpenAiModelEmbeddings = process.env.AZURE_OPENAI_MODEL_EMBEDDINGS || "";


filesRoute.post("/upload", async(req: Request, res: Response, next: NextFunction) => {

    if(req.files === undefined || req.files.length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    try {
        const fileName = (req.files as Express.Multer.File[])[0].originalname;
        const fileSize = (req.files as Express.Multer.File[])[0].size;
        const pdfBuffer = (req.files as Express.Multer.File[])[0].buffer;
        const pp = await pdfParse(pdfBuffer);
        const text = pp.text;
        const softChunkLimitChars = 1000;
        const hardChunkLimitChars = 1050;

        const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
        let chunkedTexts = [];
        let currentChunk = '';

        sentences.forEach(sentence => {
            if ((currentChunk + sentence).length > softChunkLimitChars) {
                if (currentChunk.length < softChunkLimitChars) {
                    if ((currentChunk + sentence).length <= hardChunkLimitChars) {
                        currentChunk += ' ' + sentence;
                        chunkedTexts.push(currentChunk.trim());
                        currentChunk = '';
                    } else {
                        chunkedTexts.push(currentChunk.trim());
                        currentChunk = sentence;
                    }
                } else {
                    chunkedTexts.push(currentChunk.trim());
                    currentChunk = sentence;
                }
            } else {
                currentChunk += ' ' + sentence;
            }
        });

        if (currentChunk) {
            chunkedTexts.push(currentChunk.trim());
        }

        const searchClient = new SearchClient( searchEndpoint, searchIndexName, new AzureKeyCredential(searchApiKey));
        const aiClient = new OpenAIClient(azureOpenAiEndpoint, new AzureKeyCredential(azureOpenAiApiKey));
        const SessionId = uuidv4();

        for (const [index, chunk] of chunkedTexts.entries()) {
                const embedding =  await aiClient.getEmbeddings(azureOpenAiModelEmbeddings, [chunk]);
                const Id = Buffer.from(uuidv4()).toString('base64');
                await searchClient.uploadDocuments([
                    {
                        "@search.action": "upload",
                        Id,
                        SessionId,
                        ChunkId: (index+1).toString(),
                        FileName: fileName,
                        FileSize: fileSize,
                        Text: chunk,
                        Embedding: embedding.data[0].embedding
                    }
                ]);
        }

        res.json({ uploaded: true, sessionId: SessionId });

    } catch (error) {
        console.log(error);
        res.status(500).send('Error uploading file');
    }
    
});