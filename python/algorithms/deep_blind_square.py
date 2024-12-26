from .base_algorithm import BaseAlgorithm
from ultralytics import solutions
import cv2
import numpy as np


class DeepBlindSquareAlgorithm(BaseAlgorithm):

    def adjust_exposure(self, square):
        """INCREASE INTENSITY"""
        square = cv2.convertScaleAbs(square, alpha=1.5, beta=0)
        square = cv2.addWeighted(square, 1.5, np.zeros(
            square.shape, square.dtype), 0, 0)
        return square

    def clahe(self, square):
        """Contrast Limited Adaptive Histogram Equalization"""

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(2, 2))
        applyed = clahe.apply(square)
        return applyed

    def process_square(self, square):
        """Processa o quadrado e retorna a contagem de objetos e a imagem anotada."""
        aje = self.adjust_exposure(square)
        clahe = self.clahe(aje)

        model_path = './best.pt'
        region = [(0, 0), (512, 0), (512, 512), (0, 512)]
        counter = solutions.ObjectCounter(
            model=model_path, region=region, show=False)

        image_contend = counter.count(np.array(cv2.cvtColor(clahe, cv2.COLOR_GRAY2RGB)))
      
        return len(counter.boxes), image_contend
