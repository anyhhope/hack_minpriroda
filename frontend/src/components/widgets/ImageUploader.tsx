import React, { useState, useRef } from "react";
import { UploadOutlined, StopOutlined } from "@ant-design/icons";
import { Button, message, Upload } from "antd";
import type { GetProp, UploadFile, UploadProps } from 'antd';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const App: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  async function handleUpload() {
    const formdata = new FormData();
    formdata.append("files", fileList[0] as FileType);

    // const requestOptions = {
    //   method: "POST",
    //   body: formdata,
    //   redirect: "follow"
    // };

    // fetch("http://127.0.0.1:5000/upload", requestOptions)
    //   .then((response) => response.text())
    //   .then((result) => console.log(result))
    //   .catch((error) => console.error(error));

    // // const formData = new FormData();
    // fileList.forEach((file) => {
    //   formData.append("files", file.originFileObj as File);
    // });

    // console.log(formData)
    // console.log(fileList)
    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formdata,
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
    // const formData = new FormData();
    // fileList.forEach((file) => {
    //   formData.append("files[]", file.originFileObj as File);
    // });

    // setUploading(true);
    // abortController.current = new AbortController();

    // fetch("http://your-backend-url/upload", {
    //   method: "POST",
    //   body: formData,
    //   signal: abortController.current.signal,
    // })
    //   .then((response) => response.json())
    //   .then(() => {
    //     setFileList([]);
    //     message.success("Upload successfully.");
    //   })
    //   .catch((error) => {
    //     if (error.name === "AbortError") {
    //       message.warning("Upload canceled.");
    //     } else {
    //       message.error("Upload failed.");
    //     }
    //   })
    //   .finally(() => {
    //     setUploading(false);
    //   });
  }

  const handleCancel = () => {
    if (abortController.current) {
      abortController.current.abort();
      setUploading(false);
    }
  };

  const props: UploadProps = {
    onRemove: (file) => {
      const newFileList = fileList.filter((item) => item.uid !== file.uid);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      if (
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed"
      ) {
        setFileList([file]);
      } else if (file.type.startsWith("image/")) {
        setFileList((prevList) => [...prevList, file]);
      } else {
        message.error("You can only upload image files or a single ZIP file.");
        return false;
      }
      return false;
    },
    fileList,
  };

  return (
    <div
      style={{
        padding: "30px",
        width: "400px",
        border: "2px dashed lightblue",
        borderRadius: "10px",
      }}
    >
      <p style={{ marginBottom: "10px" }}>
        Выберите файлы для загрузки в модель
      </p>
      <p
        style={{
          marginBottom: "15px",
          fontSize: "13px",
          border: "2px solid #AF91C1",
          borderRadius: "10px",
          padding: "8px",
        }}
      >
        {" "}
        Можно загрузить либо несколько изображений, либо один zip-архив
      </p>
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>Выбрать файлы</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0 || uploading}
        loading={uploading}
        style={{ marginTop: 16, marginRight: 8 }}
      >
        {uploading ? "Загрузка" : "Начать загрузку"}
      </Button>
      <Button
        type="default"
        onClick={handleCancel}
        icon={<StopOutlined />}
        style={{ marginTop: 16 }}
        disabled={fileList.length === 0 || !uploading}
      >
        Отменить загрузку
      </Button>
    </div>
  );
};

export default App;
