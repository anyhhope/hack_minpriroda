from flask import Flask, request, jsonify
from PIL import Image
import zipfile
import io
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 

@app.route('/')
def home():
    return "Welcome to the Mock Image Metadata API!"

@app.route('/upload', methods=['POST'])
def upload():
    if 'files' not in request.files:
        return jsonify(error="No files provided"), 400

    files = request.files.getlist('files')
    metadata = []

    for file in files:
        if file.filename.endswith('.zip'):
            with zipfile.ZipFile(file, 'r') as zip_ref:
                for zip_info in zip_ref.infolist():
                    if not zip_info.filename.endswith('/'):
                        with zip_ref.open(zip_info) as image_file:
                            img = Image.open(io.BytesIO(image_file.read()))
                            metadata.append({
                                'filename': zip_info.filename,
                                'width': img.width,
                                'height': img.height
                            })
        else:
            img = Image.open(file.stream)
            metadata.append({
                'filename': file.filename,
                'width': img.width,
                'height': img.height
            })

    return jsonify(metadata)

if __name__ == '__main__':
    app.run(debug=True)