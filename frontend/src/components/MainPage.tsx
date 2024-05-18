import TopBar from "./widgets/TopBar";
import ImageUploader from "./widgets/ImageUploader";
import ModelResult from "./widgets/ModelResult";

const MainPage = () => {
  return (
    <>
      <TopBar />
      <div style={{marginLeft: '150px', marginTop: '100px', display: 'flex'}}>
        <ImageUploader />
        <ModelResult />
      </div>
    </>
  );
};

export default MainPage;
