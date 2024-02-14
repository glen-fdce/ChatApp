import { useEffect, useRef, useState } from "react"
import { AppButton } from "../shared/app-button/AppButton"
import axios from 'axios';
import "./UploadAndChat.css"
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
} from "@fluentui/react-components";

enum UploadStatus {
  NotUploaded,
  Uploading,
  ErrorUploading,
  Uploaded
}

interface Answer {
  question: string;
  answer: string;
}

const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL;

export const UploadAndChat = () => {

  const [currentStatus, setCurrentStatus] = useState<UploadStatus>(UploadStatus.NotUploaded);
  const [filename, setFilename] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [question, setQuesion ] = useState<string>("");
  const [answers, setAnswers ] = useState<Answer[]>([]);
  const [fetchingAnswers, setFetchingAnswers] = useState<boolean>(false);


  useEffect(() => {
    setSessionId(localStorage.getItem("SessionID") || "");
    setFilename(localStorage.getItem("FileName") || "");
    if(localStorage.getItem("SessionID")) {
      setCurrentStatus(UploadStatus.Uploaded);
    } 
  }, [sessionId, filename, currentStatus]);


  const [resetDialogOpen, setResetDialogOpen] = useState<boolean>(false);

  const hiddenFileInput = useRef(null);

  const handleReset = () => {
    localStorage.clear();
    setSessionId("");
    setFilename("");
    setAnswers([]);
    setCurrentStatus(UploadStatus.NotUploaded);
  }

  const handleChat = async () => {
    try {
      setFetchingAnswers(true);
      const result = await axios.post(apiBaseUrl + '/chat',
        {
          sessionId: sessionId,
          question: question,
          history: answers
        });
      setFetchingAnswers(false);
      setQuesion("");

      if (result.data.answer) {
        setAnswers([{ question, answer: result.data.answer }, ...answers]);
      } else {
        setAnswers([{ question, answer: "Error whilst getting an answer"}, ...answers,]);
      }

    } catch (error) {
        setAnswers([{ question, answer: "Error whilst getting an answer" }, ...answers]);
    }
  };
  

  const handleClick = () => {
    hiddenFileInput.current &&
      (hiddenFileInput.current as HTMLElement).click();
  }

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {

    setCurrentStatus(UploadStatus.NotUploaded);

    if (event.target.files) {
      setCurrentStatus(UploadStatus.Uploading);
    } else {
      return;
    }

    const formData = new FormData();
    formData.append('document', event.target.files[0] as File);
  
    try {
      const result = await axios.post(apiBaseUrl + '/files/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });

      if (result.data.sessionId) {
        localStorage.setItem("SessionID", result.data.sessionId);
        localStorage.setItem("FileName", event.target.files[0].name);
        setFilename(event.target.files[0].name);
        setSessionId(result.data.sessionId);
        setCurrentStatus(UploadStatus.Uploaded);
      } else {
        setCurrentStatus(UploadStatus.ErrorUploading);
      }

    } catch (error) {
      setCurrentStatus(UploadStatus.ErrorUploading);
    }

  }

  return (
    <>

    { sessionId === "" && (
  
        <div className="file-upload-container">
              { currentStatus === UploadStatus.NotUploaded && (
                <div className="file-upload-box">
                  <div className="file-upload-instructions">
                    <h1>No file uploaded</h1>
                    <p>Upload a PDF file to begin your chat session.</p>
                  </div>
                  <AppButton title="Upload PDF" action={ handleClick } />
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleChange}
                    ref={hiddenFileInput}
                    style={{display: 'none'}}
                  />
                </div>
              )}

              { currentStatus === UploadStatus.Uploading && (
                <div className="file-upload-box">
                  <div className="file-upload-instructions">
                    <h1>⌛️ Uploading...</h1>
                    <p>Your file is being uploaded. This normally takes a couple of minutes.</p>
                  </div>
                </div>
              )}
                
              { currentStatus === UploadStatus.ErrorUploading && (
                <div>
                  <div className="file-upload-instructions">
                    <h1>😭 Error Uploading</h1>
                    <p>Was your file a supported PDF file?</p>
                    <AppButton title="Try again" action={ handleReset } />
                  </div>
                </div>
              )}
        </div>
    )}

    { currentStatus === UploadStatus.Uploaded && (
      <>
        <div className="file-uploaded">

          <span>File uploaded 😃 Now ask a question about <i>{filename}</i>. Follow-up questions are supported.</span>
          <label htmlFor="questionField">Question:-</label>
          <textarea
            id="questionField"
            placeholder="eg. What is this document about?"
            disabled={fetchingAnswers}
            value={question}
            onChange={(event) => { setQuesion(event.currentTarget.value)}} />

          <div className="btn-group">
            <AppButton title="Reset" action={ () => { setResetDialogOpen(true) } } classes="reset" disabled={ fetchingAnswers} />
            <AppButton title="Ask" action={ handleChat } classes="darkgreen" disabled={ fetchingAnswers } />
          </div>

          { fetchingAnswers && (
            <div className="fetching-answers">
              <h2>One moment. Fetching answers...</h2>
            </div>
          )}

          { answers.map((answer, index) => {
            return (
              <div key={index} className="answer">
                <p><b>Q. { answer.question }</b></p>
                <p>A. { answer.answer }</p>
              </div>
            )
          })}

        </div>
      </> 
    )}


    <Dialog modalType="modal" open={resetDialogOpen}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Are you done with this file?</DialogTitle>
              <DialogContent style={{ marginBottom: '20px' }}>
                Resetting will clear the current file and all chat history. Are you sure you want to reset?
              </DialogContent>
              <DialogActions>
                <AppButton title="Cancel" action={ () => setResetDialogOpen(false) } classes="maroon" />
                <AppButton title="Yes, reset!" action={ () => { setResetDialogOpen(false); handleReset() }} />
              </DialogActions>
            </DialogBody>
          </DialogSurface>
    </Dialog>
  </>
  )
}

