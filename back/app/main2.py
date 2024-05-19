from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from PIL import Image
from ultralytics import YOLO
import zipfile
import io
import json
import mimetypes
from fastapi.responses import StreamingResponse
import torch
from tqdm import tqdm
import os
from torch.utils.data import  DataLoader, Dataset
import numpy as np
from torch.nn import functional as F
from torchvision import transforms
import pandas as pd


mimetypes.init()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_model_resnet(path_weights_resnet):
    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
#     model = models.resnet152(pretrained=False)
    with open(path_weights_resnet, 'rb') as f:
        model = torch.load(path_weights_resnet, map_location=device)
    model = model.to(device)
    return model

def get_model_vit(path_weights_vit):
    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'    
    with open(path_weights_vit, 'rb') as f:
        model = torch.load(path_weights_vit, map_location=device)
    model = model.to(device)
    return model

def get_model_effnet(path_weights_effnet):
    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'    
    with open(path_weights_effnet, 'rb') as f:
        model = torch.load(path_weights_effnet, map_location=device)
    model = model.to(device)
    return model

model_yolo = YOLO("yolov8_best.pt", task='detect')
model_resnet = get_model_resnet("resnet_crop_best.pth")
model_vit = get_model_vit("vit_small_model_full.pth")


# templates = Jinja2Templates(directory="./ui")
# app.mount("/assets", StaticFiles(directory="./ui/assets"), "assets")


# @app.get("/{rest_of_path:path}")
# async def react_app(req: Request, rest_of_path: str):
#     mimetypes.add_type("application/javascript", ".js")
#     mimetypes.add_type("text/css", ".css")
#     mimetypes.add_type("image/svg+xml", ".svg")
#     print(f"Rest of path: {rest_of_path}")
#     return templates.TemplateResponse("index.html", {"request": req})


@app.post("/upload")
async def upload(files: List[UploadFile] = []):

    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    class_images = {0: [], 1: [], 2: []}
    class_counts = {0: 0, 1: 0, 2: 0}
    metadata = []

    imagesList = []
    imageByteList = []

    for file in files:
        if file.filename.endswith('.zip'):
            file_bytes = await file.read()  
            with zipfile.ZipFile(io.BytesIO(file_bytes), 'r') as zip_ref:
                for zip_info in zip_ref.infolist():
                    if not zip_info.filename.endswith('/'):
                        with zip_ref.open(zip_info) as image_file:
                            img_bytes = image_file.read()
                            img = Image.open(io.BytesIO(img_bytes))
                            imagesList.append(img)
                            imageByteList.append((zip_info.filename, img_bytes))
                            metadata.append({
                                'filename': zip_info.filename,
                                'width': img.width,
                                'height': img.height,
                            })
        else:
            file_bytes = await file.read()
            img = Image.open(io.BytesIO(file_bytes))
            imagesList.append(img)
            imageByteList.append((file.filename, file_bytes))
            # class_label = detect_img_with_yolo(img)
            # class_images[class_label].append((file.filename, file_bytes))
            # class_counts[class_label] += 1
            metadata.append({
                'filename': file.filename,
                'width': img.width,
                'height': img.height,
                # 'class': class_label
            })

    predicted_results = make_predict(imagesList)
 
    for i, pred_class in enumerate(predicted_results):
        class_images[pred_class].append(imageByteList[i])
        class_counts[pred_class] += 1


    zip_files = create_zip_files(class_images)
    stats = {
        'numClasses': [class_counts[0], class_counts[1], class_counts[2]]
    }

    combined_zip_buffer = create_combined_zip(zip_files, stats)

    return StreamingResponse(
        iter([combined_zip_buffer.getvalue()]),
        media_type='application/x-zip-compressed',
        headers={'Content-Disposition': 'attachment; filename=classified_images_with_statistics.zip'}
    )


def detect_img_with_yolo(img):
    results = model_yolo([img], device="cpu")
    for res in results:
        return int(res.boxes.cls.mode()[0])

def predict_model_yolo_image(model, img_array):
    results = []
    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'    
    with torch.no_grad():
        for image in img_array:
            predict = model(image, save=False, stream=True, verbose=False, device=device)
            for res in predict:
                results.append(res)
    return results

def predict_model_yolo(model, path_data):
    results = []
    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
    with torch.no_grad():
        for photo_name in tqdm(os.listdir(path_data)):
            if photo_name[-3:] == 'csv':
                continue
            predict = model([path_data + '/' + photo_name],
                      save=False, stream=True, verbose=False, device=device)
            for res in predict:
                results.append(res)
    return results

def predict_model_classification(model, dataloader, name=""):
    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
    model.eval()
    pred, pred_path, pred_proba = [], [], []
    for x_batch, x_path in dataloader:
        x_batch = x_batch.to(device)
        if name == "vit":
            outp = model(x_batch).logits
        else:
            outp = model(x_batch)
        proba = F.softmax(outp, dim=1)
        pred_path += list(x_path)
        pred += list(outp.cpu().detach().numpy().argmax(1))
        pred_proba += list(proba.cpu().detach().numpy())
    
    return pred, pred_path, pred_proba

def crop_photo_inplace(results_from_model_yolo, padding_percent=0.4):
    for i, result in enumerate(results_from_model_yolo):
        area_detect, box_detect = 0, []
        for box in result.boxes.xyxy:
            x1, y1, x2, y2 = box
            if (x2 - x1) * (y2 - y1) > area_detect:
                box_detect = box
        if len(box_detect):
            x1, y1, x2, y2 = map(int, box_detect)
            if padding_percent > 0:
                pad_x, pad_y = (x2 - x1) * padding_percent / 2, (y2 - y1) * padding_percent / 2
                x1 = max(0, x1 - pad_x)
                x2 = min(result.orig_img.shape[1], x2 + pad_x)
                y1 = max(0, y1 - pad_y)
                y2 = min(result.orig_img.shape[0], y2 + pad_y)
                x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
            results_from_model_yolo[i].orig_img = result.orig_img[y1:y2, x1:x2]
    return results_from_model_yolo 


class TestDataset(Dataset):
    def __init__(self, result, transform=None):
        self.result = result
        self.transform = transform

    def __len__(self):
        return len(self.result)

    def __getitem__(self, idx):
        if torch.is_tensor(idx):
            idx = idx.tolist()
            
        img_name = self.result[idx].orig_img
        path = self.result[idx].path
        
        if self.transform:
            img_name = self.transform(img_name)

        return img_name, path
    
def yolo_step(data):
    if isinstance(data, str):
        res = predict_model_yolo(model_yolo, data)
    else:
        res = predict_model_yolo_image(model_yolo, data)
    crop_photo_inplace(res, 0.8)
    return res
    
def resnet_step(dataloader):
    predict, path, proba = predict_model_classification(model_resnet, dataloader)
    return predict, path, proba

def vit_step(dataloader):
    predict, path, proba = predict_model_classification(model_vit, dataloader, name='vit')
    return predict, path, proba

def effnet_step(path_effnet, dataloader):
    model_effnet = get_model_effnet(path_effnet)
    predict, path, proba = predict_model_classification(model_effnet, dataloader)
    return predict, path, proba

def make_mean(result):
    col = result.columns
    proba_col = col[col.str.startswith('proba')]
    
    def mean_proba(row):
        return row[proba_col].mean()
    result['mean_proba'] = result.apply(mean_proba,axis=1)
    result['pred_mean'] = result['mean_proba'].map(lambda x: x.argmax())
    
    return result

def make_predict(data,         # путь до папки с фото или фото
                 path_resnet=None,
                 path_vit=None,
                 path_effnet=None):
    
    data_transforms = transforms.Compose([
        transforms.ToTensor(),
        transforms.Resize((224, 224)),
    ])
    
    result = yolo_step(data)
    test_dataset = TestDataset(result, data_transforms)
    test_daloader = DataLoader(test_dataset, batch_size=4, shuffle=False)
    
    predict = pd.DataFrame()
    predict['pred_yolo'] = [photo.boxes.cls.mode()[0].item() if photo.boxes.cls.numel() != 0 else np.nan for photo in result]
                   

    predict_resnet, path_resnet, proba_resnet = resnet_step(test_daloader)
    predict['pred_resnet'] = predict_resnet
    predict['path_resnet'] = path_resnet
    predict['proba_resnet'] = proba_resnet
    

    predict_vit, path_vit, proba_vit = vit_step(test_daloader)
    predict['pred_vit'] = predict_vit
    predict['path_vit'] = path_vit
    predict['proba_vit'] = proba_vit
        
    if path_effnet:
        predict_effnet, path_effnet, proba_effnet = effnet_step(path_effnet, test_daloader)
        predict['pred_effnet'] = predict_effnet
        predict['path_effnet'] = path_effnet
        predict['proba_effnet'] = proba_effnet
        
    predict = make_mean(predict)
    
    return predict['pred_mean'].values


def create_zip_files(class_images):
    zip_files = {}
    for class_label, images in class_images.items():
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w") as zipf:
            for filename, file_bytes in images:
                zipf.writestr(filename, file_bytes)
        zip_buffer.seek(0)
        zip_files[class_label] = zip_buffer
    return zip_files


def create_combined_zip(zip_files, stats):
    combined_zip_buffer = io.BytesIO()
    with zipfile.ZipFile(combined_zip_buffer, "w") as combined_zip:

        for class_label, zip_buffer in zip_files.items():
            zip_buffer.seek(0)
            combined_zip.writestr(f"class_{class_label}.zip", zip_buffer.read())

        metadata_stats = {
            # 'metadata': metadata,
            "stats": stats
        }
        combined_zip.writestr("statistics.json", json.dumps(metadata_stats, indent=4))

    combined_zip_buffer.seek(0)
    return combined_zip_buffer


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
    
