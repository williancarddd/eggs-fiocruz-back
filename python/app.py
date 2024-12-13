import cv2
import numpy as np
from flask import Flask, request, jsonify
import base64
import time

app = Flask(__name__)

# =======================
# Funções de Preprocessamento
# =======================


def adjust_exposure(image):
    """Ajusta a exposição e contraste usando CLAHE."""
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    hsv[:, :, 2] = clahe.apply(hsv[:, :, 2])
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)


def increase_brightness_contrast(image, alpha=1.0, beta=0):
    """Aumenta o brilho e o contraste da imagem."""
    return cv2.convertScaleAbs(image, alpha=alpha, beta=beta)


def remove_noise(image):
    """Remove ruídos usando filtro de médias não locais."""
    return cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)


def remove_granular_noise(image):
    """Remove ruídos granulares usando filtro bilateral."""
    return cv2.bilateralFilter(image, 15, 75, 75)


def clean_mask(mask):
    """Realiza operações morfológicas para limpar a máscara binária."""
    kernel = np.ones((5, 5), np.uint8)
    cleaned_mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_OPEN, kernel)
    return cleaned_mask


def smooth_background(image, kernel_size=7):
    """Suaviza o fundo da imagem usando filtro de mediana."""
    return cv2.medianBlur(image, kernel_size)


def subtract_background(image, smoothed_image):
    """Subtrai o fundo suavizado da imagem original para realçar detalhes."""
    return cv2.addWeighted(image, 1.5, smoothed_image, -0.5, 0)

# =======================
# Funções de Detecção de Objetos
# =======================


def detect_red_objects_hsv(image):
    """Detecta objetos vermelhos usando segmentação em HSV."""
    hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Intervalos de tons vermelhos
    lower_red1 = np.array([0, 50, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 50, 50])
    upper_red2 = np.array([180, 255, 255])

    # Máscaras para os intervalos
    mask1 = cv2.inRange(hsv_image, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv_image, lower_red2, upper_red2)

    return cv2.bitwise_or(mask1, mask2)


def count_objects_in_square(square):
    """Conta objetos vermelhos em um quadrado e retorna a imagem com contornos."""
    mask = detect_red_objects_hsv(square)
    cleaned_mask = clean_mask(mask)

    # Encontrar contornos na máscara limpa
    contours, _ = cv2.findContours(
        cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filtrar contornos por área
    min_area = 50
    max_area = 2000
    filtered_contours = [c for c in contours if min_area <
                         cv2.contourArea(c) < max_area]

    # Desenhar contornos na imagem original
    contour_image = square.copy()
    cv2.drawContours(contour_image, filtered_contours, -1, (0, 255, 0), 2)

    return len(filtered_contours), contour_image

# =======================
# Funções de Processamento de Imagem
# =======================


def process_square(square):
    """Processa um quadrado para melhorar a detecção de objetos."""
    smoothed_square = smooth_background(square, kernel_size=7)
    subtracted_square = subtract_background(smoothed_square, smoothed_square)
    bright_contrast = increase_brightness_contrast(
        subtracted_square, alpha=1.5, beta=40)
    adjusted = adjust_exposure(bright_contrast)
    denoised = remove_noise(adjusted)
    return remove_granular_noise(denoised)


def divide_and_process_image(image, square_size=512):
    """Divide a imagem em quadrados e processa cada um deles."""
    img_height, img_width, _ = image.shape
    total_objects = 0
    processed_squares = []
    reconstructed_squares = []

    for y in range(0, img_height, square_size):
        for x in range(0, img_width, square_size):
            square = image[y:y + square_size, x:x + square_size]
            processed_square = process_square(square)
            num_objects, contour_square = count_objects_in_square(
                processed_square)
            total_objects += num_objects

            # Salvar informações do quadrado processado
            processed_squares.append({
                "coordinates": {"x": x, "y": y},
                "objects_detected": num_objects,
                "square_base64": convert_image_to_base64(contour_square)
            })

            # Guardar quadrado para reconstrução final
            reconstructed_squares.append(contour_square)

    return {
        "total_objects": total_objects,
        "processed_squares": processed_squares,
        "image_dimensions": {"height": img_height, "width": img_width},
        "reconstructed_squares": reconstructed_squares
    }


def reconstruct_image(squares, img_height, img_width, square_size=512):
    """Reconstrói a imagem completa a partir dos quadrados processados."""
    reconstructed_image = np.zeros((img_height, img_width, 3), dtype=np.uint8)
    count = 0
    for y in range(0, img_height, square_size):
        for x in range(0, img_width, square_size):
            reconstructed_image[y:y + square_size,
                                x:x + square_size] = squares[count]
            count += 1
    return reconstructed_image


def convert_image_to_base64(image):
    """Converte uma imagem para base64."""
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')

# =======================
# Mapeamento de Algoritmos
# =======================


def apply_algorithm(image, algorithm):
    """Aplica o algoritmo especificado na imagem."""
    if algorithm == "default":
        return divide_and_process_image(image)
    elif algorithm == "blind-square-1":
        # Substituir pela lógica do algoritmo 2
        return divide_and_process_image(image)
    else:
        raise ValueError("Algoritmo desconhecido")

# =======================
# Endpoint da API
# =======================


@app.route("/process", methods=["POST"])
def process_image():
    """Endpoint principal para processar uma imagem enviada pelo cliente."""
    try:
        start_time = time.time()

        # Ler a imagem enviada no request
        file = request.files['file']
        algorithm = request.form.get(
            'algorithm', 'default')  # Algoritmo padrão
        contents = file.read()

        # Verificar tipo de arquivo suportado
        if file.mimetype not in ['image/jpeg', 'image/png', 'image/jpg']:
            return jsonify({"error": "Formato de imagem não suportado. Envie um arquivo JPG, JPEG ou PNG."}), 400

        # Decodificar a imagem
        npimg = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({"error": "Formato de imagem inválido"}), 422

        # Processar a imagem usando o algoritmo especificado
        try:
            result = apply_algorithm(image, algorithm)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        final_time = time.time()

        # Reconstruir a imagem final
        img_height = result["image_dimensions"]["height"]
        img_width = result["image_dimensions"]["width"]
        reconstructed_image = reconstruct_image(
            result["reconstructed_squares"], img_height, img_width)

        # Converter a imagem final para base64
        final_image_base64 = convert_image_to_base64(reconstructed_image)

        return jsonify({
            "total_eggs": result["total_objects"],
            "squares": result["processed_squares"],
            "final_image": final_image_base64,
            "initial_time": start_time,
            "final_time": final_time,
            "image_dimensions": result["image_dimensions"]
        })
    except Exception as e:
        return jsonify({"error": f"Falha no processamento da imagem: {str(e)}"}), 500

# =======================
# Inicialização do Servidor
# =======================


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
