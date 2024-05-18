import TopBar from "./widgets/TopBar";
import ImageUploader from "./widgets/ImageUploader";
import ModelResult from "./widgets/ModelResult";
import { useState } from "react";
import { IClassRes } from "../models/index";

const MainPage = () => {
  const [classResult, setClassResult] = useState<IClassRes|null>(null);

  const handleUpdateClassRes = (classRes: IClassRes) => {
    setClassResult(classRes);
    console.log('main', classRes)
  };

  return (
    <>
      <TopBar />
      <div style={{marginLeft: '150px', marginTop: '60px', display: 'flex'}}>
        <ImageUploader onClassRes={handleUpdateClassRes}/>
        <ModelResult classRes={classResult}/>
      </div>
    </>
  );
};

export default MainPage;
