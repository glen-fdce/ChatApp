import "./AppButton.css"

interface AppButtonProps {
  title: string;
  action: () => void;
}

export const AppButton = (props: AppButtonProps) => {
  
  const { title, action } = props;

  return (
    <div className="app-button" onClick={ () => action() }>
      { title }
    </div>
  )

}
