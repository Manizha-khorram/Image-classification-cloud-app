from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input, decode_predictions
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the pre-trained MobileNetV2 model
model = MobileNetV2(weights='imagenet')

@app.route('/classify', methods=['POST'])
def classify():
    try:
        print('hello')
        file = request.files['file']
        image = Image.open(file).convert("RGB").resize((224, 224))  # Convert to RGB and resize
        image_array = np.array(image)

        # Preprocess the image to match the model's expected input
        image_array = preprocess_input(image_array)
        image_array = np.expand_dims(image_array, axis=0)  # Add batch dimension

        # Predict the class of the image
        prediction = model.predict(image_array)
        decoded_prediction = decode_predictions(prediction, top=3)  # Get top 3 predictions

        # Format the predictions as a list of (label, description, probability)
        results = [{'label': pred[0], 'description': pred[1], 'probability': float(pred[2])}
                   for pred in decoded_prediction[0]]

        return jsonify({'predictions': results})

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
