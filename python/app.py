from flask import Flask, request, jsonify
from processors.algorithm_runner import AlgorithmRunner
import cv2, time, numpy as np

app = Flask(__name__)

@app.route("/process", methods=["POST"])
def process_image():
    try:
        start_time = time.time()
        file = request.files['file']
        algorithm = request.form.get('algorithm')
        contents = file.read()

        if file.mimetype not in ['image/jpeg', 'image/png', 'image/jpg']:
            return jsonify({"error": "Formato de imagem não suportado. Envie um arquivo JPG, JPEG ou PNG."}), 400


        runner = AlgorithmRunner(contents, algorithm)
        result = runner.execute()

        return jsonify({
            "total_eggs": result["total_objects"],
            "squares": result["processed_squares"],
            "final_image": result["final_image_base64"],
            "initial_time": start_time,
            "final_time": time.time(),
            "image_dimensions": result["image_dimensions"]
        })

    except Exception as e:
        return jsonify({"error": f"Falha no processamento da imagem: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
