import './Header.css'

const appName: string = import.meta.env.VITE_APP_NAME;

export const Header = () => {
  return (
    <>
      <div className='container'>
      { appName }
      </div>
    </>
  )
}
