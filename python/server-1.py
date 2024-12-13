from flask import Flask, request, jsonify
import cv2
import numpy as np
from ultralytics import YOLO
import base64
from flask_cors import CORS

app = Flask(__name__)

# Enable CORS
CORS(app)

# Carregar o modelo YOLO
model = YOLO("last.pt")


def adjust_exposure(image, exposure_value):
    """
    Aplica um filtro de exposição em uma imagem usando OpenCV.

    Args:
    - image: Imagem original em formato OpenCV (numpy array).
    - exposure_value: Valor da exposição a ser ajustado.

    Returns:
    - Imagem processada em formato OpenCV (numpy array).
    """

    return cv2.convertScaleAbs(image, alpha=exposure_value, beta=0)


@app.route("/detect_eggs", methods=["POST"])
def detect_eggs():
    try:
        # Receber a imagem enviada no corpo da solicitação POST
        image_file = request.files["image"]
        image = cv2.imdecode(
            np.frombuffer(image_file.read(), np.uint8), cv2.IMREAD_COLOR
        )

        # Ajustar a exposição da imagem
        exposure_value = 2.5
        adjusted_image = adjust_exposure(image, exposure_value)

        # Detectar objetos na imagem
        results = model(adjusted_image)
        boxes = results[0].boxes.xyxy.cpu().numpy()  # Corrigir acesso aos resultados
        eggs_count = len(boxes)

        # Desenhar caixas delimitadoras nos objetos detectados
        for box in boxes:
            x1, y1, x2, y2 = map(int, box[:4])
            cv2.rectangle(adjusted_image, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # Converter a imagem resultante para base64
        _, buffer = cv2.imencode(".jpg", adjusted_image)
        image_base64 = base64.b64encode(buffer).decode("utf-8")

        response = {"image": image_base64, "eggs_count": eggs_count}
    except Exception as e:
        response = {"error": str(e)}

    return jsonify(response)


if __name__ == "__main__":
    app.run(debug=True)
