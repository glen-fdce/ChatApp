import { useEffect, useRef, useState } from "react"
import { AppButton } from "../shared/app-button/AppButton"
import axios from 'axios';
import "./UploadAndChat.css"

enum UploadStatus {
  NotUploaded,
  Uploading,
  ErrorUploading,
  Uploaded
}

const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL;

export const UploadAndChat = () => {

  const [currentStatus, setCurrentStatus] = useState<UploadStatus>(UploadStatus.NotUploaded);
  const [filename, setFilename] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [question, setQuesion ] = useState<string>("");
  const [answer, setAnswer ] = useState<string>("");


  useEffect(() => {
    setSessionId(localStorage.getItem("SessionID") || "");
    setFilename(localStorage.getItem("FileName") || "");
    if(localStorage.getItem("SessionID")) {
      setCurrentStatus(UploadStatus.Uploaded);
    } else {
      setCurrentStatus(UploadStatus.NotUploaded);
    }
  }, [sessionId, filename, currentStatus]);

  const hiddenFileInput = useRef(null);


  const handleReset = () => {
    localStorage.clear();
    setSessionId("");
    setFilename("");
    setCurrentStatus(UploadStatus.NotUploaded);
  }

  const handleChat = async () => {
    try {
      const result = await axios.post(apiBaseUrl + '/chat',
        {
          sessionId: sessionId,
          question: question
        });

      if (result.data.answer) {
        setAnswer(result.data.answer);
      } else {
        setAnswer("Error getting answer");
      }

    } catch (error) {
      setAnswer("Error getting answer");
    }
  };
  

  const handleClick = () => {
    hiddenFileInput.current &&
      (hiddenFileInput.current as HTMLElement).click();
  }

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {

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
                    <p>Upload a .pdf, .docx or .txt file to begin your chat session.</p>
                  </div>
                  <AppButton title="Upload File" action={ handleClick } />
                  <input
                    type="file"
                    // accept=".pdf, .docx, .txt"
                    onChange={handleChange}
                    ref={hiddenFileInput}
                    style={{display: 'none'}}
                  />
                </div>
              )}

              { currentStatus === UploadStatus.Uploading && (
                <div className="file-upload-box">
                  <div className="file-upload-instructions">
                    <h1>Uploading...</h1>
                    <p>Your file is being uploaded</p>
                  </div>
                </div>
              )}
                
              { currentStatus === UploadStatus.ErrorUploading && (
                <div>
                  <div className="file-upload-instructions">
                    <h1>Error Uploading</h1>
                    <p>Was your file a support type?</p>
                    <ul>
                      <li>.docx</li>
                      <li>.pdf</li>
                      <li>.txt</li>
                    </ul>
                    <AppButton title="Try again" action={ handleReset } />
                  </div>
                </div>
              )}

        
        </div>
    )}

    { currentStatus === UploadStatus.Uploaded && (
      <>
        <div className="file-uploaded">
          <p><b>File Uploaded: </b> {filename}</p>
          <AppButton title="Reset" action={ handleReset } />
        
        <p>Ask a question below.</p>

    
        <textarea placeholder="What is this document about?" style={{ width: '50%' }} onChange={(event) => { setQuesion(event.currentTarget.value)}}>{ question }</textarea>

        <AppButton title="Ask" action={ handleChat } />

        <p>{ answer }</p>

        </div>
      </> 
    )}

    </>

  )

}

