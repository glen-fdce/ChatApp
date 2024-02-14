import './MainSection.css';
import { UploadAndChat } from './upload-and-chat/UploadAndChat';

const appName: string = import.meta.env.VITE_APP_NAME;

export const MainSection = () => {

  return (
    <>

     <div className="intro">
        <b>Welcome to { appName }</b> - Ask a question about an English language document in any language.
     </div>

     <UploadAndChat />
    </>
  )
}
