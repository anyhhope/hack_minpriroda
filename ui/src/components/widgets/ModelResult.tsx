import { IClassRes } from "../../models/index";
import DeerAnimation from "./DeerAnimation";

const ModelResult = ({ classRes }: { classRes: IClassRes|null }) => {
  console.log("res", classRes);

  return (
    <div style={{ width: "700px", margin: "40px" }}>
      <h2>
        Добро пожаловать<br></br> в сервис классификации парнокопытных
      </h2>
      {classRes ? (
        <>{String(classRes.stats)}</>
      ) : (
        <>
          <p style={{ marginTop: "20px", marginBottom: "30px" }}>
            Здесь будут отображаться результаты классификации
          </p>
          <div style={{position: 'relative', width: '400px', height: '60px'}}>
            <DeerAnimation startPosition={10}/>
          </div>
          <div style={{position: 'relative', width: '400px', height: '60px'}}>
            <DeerAnimation startPosition={50}/>
          </div>
          <div style={{position: 'relative', width: '400px', height: '60px'}}>
            <DeerAnimation startPosition={0}/>
          </div>
        </>
      )}
    </div>
  );
};

export default ModelResult;
