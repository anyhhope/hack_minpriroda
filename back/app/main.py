from flask import Flask, request, jsonify, send_file
import zipfile
import io
import json
from PIL import Image
from flask_cors import CORS
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

yolo_model = YOLO("yolo-first.pt")

@app.route('/')
def home():
    return "Welcome to the Mock Image Metadata API!"

@app.route('/uploadPaths', methods=['POST'])
def upload_path():
    
    return

@app.route('/upload', methods=['POST'])
def upload():
    if 'files' not in request.files:
        return jsonify(error="No files provided"), 400

    files = request.files.getlist('files')
    class_images = {0: [], 1: [], 2: []}
    class_counts = {0: 0, 1: 0, 2: 0}
    metadata = []

    for file in files:
        if file.filename.endswith('.zip'):
            with zipfile.ZipFile(file, 'r') as zip_ref:
                for zip_info in zip_ref.infolist():
                    if not zip_info.filename.endswith('/'):
                        with zip_ref.open(zip_info) as image_file:
                            file_bytes = image_file.read()
                            img = Image.open(io.BytesIO(file_bytes))
                            class_label = detect_img_with_yolo(img)
                            class_images[class_label].append((zip_info.filename, file_bytes))
                            class_counts[class_label] += 1
                            metadata.append({
                                'filename': zip_info.filename,
                                'width': img.width,
                                'height': img.height,
                                'class': class_label
                            })
        else:
            file_bytes = file.read()
            img = Image.open(io.BytesIO(file_bytes))
            class_label = detect_img_with_yolo(img)
            class_images[class_label].append((file.filename, file_bytes))
            class_counts[class_label] += 1
            metadata.append({
                'filename': file.filename,
                'width': img.width,
                'height': img.height,
                'class': class_label
            })

    zip_files = create_zip_files(class_images)
    stats = {
        'numClasses': [class_counts[0], class_counts[1], class_counts[2]]
    }

    combined_zip_buffer = create_combined_zip(zip_files, stats)

    return send_file(
        combined_zip_buffer,
        mimetype='application/zip',
        as_attachment=True,
        download_name='classified_images_with_statistics.zip'
    )


def detect_img_with_yolo(img):
    results = yolo_model([img], device="cpu")
    for res in results:
        return int(res.boxes.cls.mode()[0])  


def create_zip_files(class_images):
    zip_files = {}
    for class_label, images in class_images.items():
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w') as zipf:
            for filename, file_bytes in images:
                zipf.writestr(filename, file_bytes)
        zip_buffer.seek(0)
        zip_files[class_label] = zip_buffer
    return zip_files


def create_combined_zip(zip_files, stats):
    combined_zip_buffer = io.BytesIO()
    with zipfile.ZipFile(combined_zip_buffer, 'w') as combined_zip:

        for class_label, zip_buffer in zip_files.items():
            zip_buffer.seek(0)
            combined_zip.writestr(f'class_{class_label}.zip', zip_buffer.read())
        
        metadata_stats = {
            'stats': stats
        }
        combined_zip.writestr('statistics.json', json.dumps(metadata_stats, indent=4))
    
    combined_zip_buffer.seek(0)
    return combined_zip_buffer

if __name__ == '__main__':
    app.run(debug=True)
    # app.run(host="0.0.0.0", port=5000, debug=False)
