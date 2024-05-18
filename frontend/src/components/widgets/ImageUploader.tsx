import { useState } from 'react';
import { ipcRenderer } from 'electron';

const ImageUploader = () => {
  const [images, setImages] = useState([]);

  const handleUploadClick = async () => {
    const filePaths = await ipcRenderer.invoke('select-files');
    setImages(filePaths);
  };

  return (
    <div className="image-uploader">
      <h1>Image Uploader</h1>
      <button onClick={handleUploadClick}>Upload Images</button>
      <div className="image-container">
        {images.map((image, index) => (
          <div key={index} className="image-wrapper">
            <img src={`file://${image}`} alt={`img-${index}`} className="image" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUploader;
