import './App.css'
import { Header } from './header/Header'
import { MainSection } from './main-section/MainSection'
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components';

export const App = () => {
  return (
    <>
    <FluentProvider theme={teamsLightTheme}>
        <Header />
        <MainSection />
    </FluentProvider>
    </>
  )
}
