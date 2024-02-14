import './MainSection.css';
import { UploadAndChat } from './upload-and-chat/UploadAndChat';

export const MainSection = () => {

  return (
    <>

     <div className="intro">
        <b>Welcome to DocChat</b> - Ask a question about an English language document in any language.
     </div>

     <UploadAndChat />
    </>
  )
}
