import { IClassRes } from "../../models/index";
import DeerAnimation from "./DeerAnimation";
import { ILineData } from "../../models/index";
import { useState, useEffect } from "react";
import PieChart from "./PieChart";

const ModelResult = ({ classRes }: { classRes: IClassRes }) => {
  console.log("res", classRes);
  const [pieData, setPieData] = useState<ILineData | null>(null);

  useEffect(() => {
    const lineDataObg: ILineData = {
      labels: [],
      data: [],
    };

    if (classRes) {
      lineDataObg.labels = ["Класс: Кабарга", "Класс: Косуля", "Класс: Олень"];
      lineDataObg.data = classRes.stats.numClasses;
      setPieData(lineDataObg);
      console.log(pieData);
    }
  }, [classRes]);

  return (
    <div style={{ width: "700px", margin: "40px" }}>
      <h2>
        Добро пожаловать<br></br> в сервис классификации парнокопытных
      </h2>
      {classRes ? (
        <>
          <div>
            {pieData && (
              <PieChart
                lineData={pieData}
                dataTitle={"Количество изображений каждого класса"}
              />
            )}
          </div>
        </>
      ) : (
        <>
          <p style={{ marginTop: "20px", marginBottom: "30px" }}>
            Здесь будут отображаться результаты классификации
          </p>
          <div style={{ position: "relative", width: "400px", height: "60px" }}>
            <DeerAnimation startPosition={10} />
          </div>
          <div style={{ position: "relative", width: "400px", height: "60px" }}>
            <DeerAnimation startPosition={50} />
          </div>
          <div style={{ position: "relative", width: "400px", height: "60px" }}>
            <DeerAnimation startPosition={0} />
          </div>
        </>
      )}
    </div>
  );
};

export default ModelResult;
