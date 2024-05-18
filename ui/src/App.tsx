import backgroundImg from './assets/deers.png'
import MainPage from './components/MainPage';

const App = () => {
  const backgroundStyle = {
    backgroundImage: `url(${backgroundImg})`,
    backgroundSize: 'cover', 
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    width: '100%',
    height: '100vh', 
  };

  return (
    <div style={backgroundStyle}>
      <MainPage/>
    </div>
  );
}

export default App