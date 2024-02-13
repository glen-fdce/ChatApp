
import { Request } from 'express'
import multer, { FileFilterCallback} from "multer";

export const inMemoryStorage = multer.memoryStorage();

type FileNameCallback = (error: Error | null, filename: string) => void

export const fileFilter = (
    request: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
): void => {
    if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'text/plain'
    ) {
        callback(null, true)
    } else {
        callback(null, false)
    }
}

