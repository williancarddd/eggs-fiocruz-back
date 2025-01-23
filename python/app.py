from flask import Flask, request, jsonify
from processors.algorithm_runner import AlgorithmRunner
import cv2
import time
import numpy as np

app = Flask(__name__)

@app.route("/process", methods=["POST"])
def process_image():
    try:
        start_time = time.time()
        file = request.files['file']
        algorithm = request.form.get('algorithm', 'deep-v2')
      
        if file.mimetype not in ['image/jpeg', 'image/png', 'image/jpg']:
            return jsonify({"error": "Formato de imagem não suportado. Envie um arquivo JPG, JPEG ou PNG."}), 400

        # Pass decoded image to AlgorithmRunner
        runner = AlgorithmRunner(file, algorithm)
        result = runner.execute()
    
        return jsonify({
            **result,
            "initial_time": start_time,
            "final_time": time.time(),
        })

    except Exception as e:
        return jsonify({"error": f"Falha no processamento da imagem: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


'''
curl -X POST -F "file=@/home/ultralytics/Downloads/lena.jpg" -F "algorithm=deep-blind-square" http://localhost:5000/process
'''