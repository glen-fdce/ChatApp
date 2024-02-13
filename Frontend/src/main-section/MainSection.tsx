import './MainSection.css';
import { UploadAndChat } from './upload-and-chat/UploadAndChat';

export const MainSection = () => {

  return (
    <>

     <div className="intro">
        <b>Welcome to DocChat</b>
     </div>

     <UploadAndChat />
    </>
  )
}
