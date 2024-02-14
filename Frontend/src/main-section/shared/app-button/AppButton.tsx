import "./AppButton.css"

interface AppButtonProps {
  title: string;
  action: () => void;
  classes?: string;
  disabled?: boolean;
}

export const AppButton = (props: AppButtonProps) => {
  
  const { title, action, classes, disabled } = props;

  return (
    <>
    { !disabled ? (
        <div className={'app-button ' + (classes ? classes + ' ' : '')} onClick={ ( () => action() )}>
          { title }
        </div>
    ) : (
        <div className={'disabled-button' }>
          { title }
        </div>
    )}
    </>
  )
}
