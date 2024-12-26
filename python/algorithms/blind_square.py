from .base_algorithm import BaseAlgorithm
import cv2
import numpy as np


class BlindSquareProcessorAlgorithm(BaseAlgorithm):
    def __init__(self, square):
        self.square = square

    def adjust_exposure(self):
        """Ajusta a exposição e contraste usando CLAHE."""
        hsv = cv2.cvtColor(self.square, cv2.COLOR_BGR2HSV)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        hsv[:, :, 2] = clahe.apply(hsv[:, :, 2])
        self.square = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    def increase_brightness_contrast(self, alpha=1.0, beta=0):
        """Aumenta o brilho e o contraste da imagem."""
        self.square = cv2.convertScaleAbs(self.square, alpha=alpha, beta=beta)

    def remove_noise(self):
        """Remove ruídos usando filtro de médias não locais."""
        self.square = cv2.fastNlMeansDenoisingColored(
            self.square, None, 10, 10, 7, 21)

    def remove_granular_noise(self):
        """Remove ruídos granulares usando filtro bilateral."""
        self.square = cv2.bilateralFilter(self.square, 15, 75, 75)

    def clean_mask(self, mask):
        """Realiza operações morfológicas para limpar a máscara binária."""
        kernel = np.ones((5, 5), np.uint8)
        cleaned_mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_OPEN, kernel)
        return cleaned_mask

    def smooth_background(self, kernel_size=7):
        """Suaviza o fundo da imagem usando filtro de mediana."""
        self.square = cv2.medianBlur(self.square, kernel_size)

    def subtract_background(self):
        """Subtrai o fundo suavizado da imagem original para realçar detalhes."""
        smoothed_image = self.square.copy()
        self.square = cv2.addWeighted(
            self.square, 1.5, smoothed_image, -0.5, 0)

    def detect_red_objects(self):
        """Detecta objetos vermelhos usando segmentação em HSV."""
        hsv_image = cv2.cvtColor(self.square, cv2.COLOR_BGR2HSV)

        # Intervalos de tons vermelhos
        lower_red1 = np.array([0, 50, 50])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([170, 50, 50])
        upper_red2 = np.array([180, 255, 255])

        # Máscaras para os intervalos
        mask1 = cv2.inRange(hsv_image, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv_image, lower_red2, upper_red2)

        return cv2.bitwise_or(mask1, mask2)

    def count_objects_in_square(self):
        """Conta objetos vermelhos em um quadrado e retorna a imagem com contornos."""
        mask = self.detect_red_objects()
        cleaned_mask = self.clean_mask(mask)

        # Encontrar contornos na máscara limpa
        contours, _ = cv2.findContours(
            cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Filtrar contornos por área
        min_area = 50
        max_area = 2000
        filtered_contours = [c for c in contours if min_area <
                             cv2.contourArea(c) < max_area]

        # Desenhar contornos na imagem original
        contour_image = self.square.copy()
        cv2.drawContours(contour_image, filtered_contours, -1, (0, 255, 0), 2)

        return len(filtered_contours), contour_image

    def process_square(self):
        """Processa um quadrado para melhorar a detecção de objetos."""
        self.smooth_background(kernel_size=7)
        self.subtract_background()
        self.increase_brightness_contrast(alpha=1.5, beta=40)
        self.adjust_exposure()
        self.remove_noise()
        self.remove_granular_noise()
        return self.count_objects_in_square()
