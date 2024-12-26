from .base_algorithm import BaseAlgorithm
from ultralytics import solutions
import cv2
import numpy as np

class DeepBlindSquareAlgorithm(BaseAlgorithm):
    def __init__(self, square):
        if not isinstance(square, np.ndarray):
            raise ValueError("A entrada square deve ser um numpy array.")
        self.square = square

    def adjust_exposure(self):
        """INCREASE INTENSITY"""
        self.square = cv2.convertScaleAbs(self.square, alpha=1.5, beta=0)
        self.square = cv2.addWeighted(self.square, 1.5, np.zeros(self.square.shape, self.square.dtype), 0, 0)

    def clahe(self):
        """Contrast Limited Adaptive Histogram Equalization"""
        # Converte para escala de cinza se necessário
        if len(self.square.shape) == 3 and self.square.shape[2] == 3:
            gray_square = cv2.cvtColor(self.square, cv2.COLOR_BGR2GRAY)
        else:
            gray_square = self.square

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(2, 2))
        gray_square = clahe.apply(gray_square)

        # Converte de volta para BGR para compatibilidade com o modelo
        self.square = cv2.cvtColor(gray_square, cv2.COLOR_GRAY2BGR)

    def process_square(self):
        """Processa o quadrado e retorna a contagem de objetos e a imagem anotada."""
        self.adjust_exposure()
        self.clahe()

        # Verifica que a imagem está no formato correto para o modelo
        if len(self.square.shape) != 3 or self.square.shape[2] != 3:
            raise ValueError("A imagem deve estar no formato BGR com 3 canais.")

        model_path = '/best.pt'
        region = [(0, 0), (512, 0), (512, 512), (0, 512)]
        counter = solutions.ObjectCounter(model=model_path, region=region, show=False)

        counter.count(np.array(cv2.cvtColor(self.square, cv2.COLOR_BGR2RGB)))

        return len(counter.boxes), self.square
