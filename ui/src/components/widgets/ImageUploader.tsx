import React, { useState, useRef } from "react";
import { UploadOutlined } from "@ant-design/icons";
import { Button, message, Upload } from "antd";
import type { GetProp, UploadFile, UploadProps } from "antd";
import { IClassRes } from "../../models/index";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { API_HOST } from "../../constant";


type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

interface ImageUploaderProps {
  onClassRes: (classRes: IClassRes) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onClassRes }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  async function handleUpload() {
    const formdata = new FormData();
    fileList.forEach((file) => {
      formdata.append("files", file as FileType);
    });

    console.log(fileList)

    setUploading(true);
    abortController.current = new AbortController();

    try {
      const response = await fetch(`${API_HOST}/upload`, {
        method: "POST",
        body: formdata,
        redirect: "follow",
        signal: abortController.current.signal,
      });

      if (response.ok) {
        const blob = await response.blob();
      
        saveAs(blob, "classified_images_with_statistics.zip");
  
        const zip = await JSZip.loadAsync(blob);
        const metadataFile = zip.file("statistics.json");
        if (metadataFile) {
          const metadataContent = await metadataFile.async("string");
          const result = JSON.parse(metadataContent);
          console.log(result);
          onClassRes(result);  
        } 
  
        setFileList([]);
      }
    } catch (error) {
        message.error("Ошибка. Попробуйте снова");
    }
    finally {
      setUploading(false);
    }
  }

  // const handleCancel = () => {
  //   if (abortController.current) {
  //     abortController.current.abort();
  //     setUploading(false);
  //   }
  // };

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
        message.error(
          "Можно загрузить либо несколько изображений, либо один zip-архив"
        );
        return false;
      }
      return false;
    },
    fileList,
  };

  const buttonStyles = {
    marginTop: 16,
    marginRight: 8,
    ...(fileList.length === 0 || uploading ? { color: 'black', backgroundColor: '#f5f5f5', borderColor: '#AF91C1' } : {}),
  };

  return (
    <div
      style={{
        padding: "30px",
        width: "400px",
        border: "2px dashed lightblue",
        borderRadius: "10px",
        minHeight: '100px'
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
        style={buttonStyles}
      >
        {uploading ? "Происходит классификация" : "Начать загрузку"}
      </Button>
      {/* <Button
        type="default"
        onClick={handleCancel}
        icon={<StopOutlined />}
        style={{ marginTop: 16 }}
        disabled={fileList.length === 0 || !uploading}
      >
        Отменить детекцию
      </Button> */}
    </div>
  );
};

export default ImageUploader;
