from .base_algorithm import BaseAlgorithm
import cv2
import numpy as np


class BlindSquareProcessorAlgorithm(BaseAlgorithm):

    def adjust_exposure(self, image):
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        hsv[:, :, 2] = clahe.apply(hsv[:, :, 2])
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    def increase_brightness_contrast(self, image, alpha=1.0, beta=0):
        return cv2.convertScaleAbs(image, alpha=alpha, beta=beta)

    def remove_noise(self, image):
        return cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)

    def remove_granular_noise(self, image):
        return cv2.bilateralFilter(image, 15, 75, 75)

    def clean_mask(self, mask):
        kernel = np.ones((5, 5), np.uint8)
        cleaned_mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_OPEN, kernel)
        return cleaned_mask

    def smooth_background(self, image, kernel_size=7):
        return cv2.medianBlur(image, kernel_size)

    def subtract_background(self, image, smoothed_image):
        return cv2.addWeighted(image, 1.5, smoothed_image, -0.5, 0)


    def detect_red_objects_hsv(self, square):
        """Detecta objetos vermelhos usando segmentação em HSV."""
        hsv_image = cv2.cvtColor(square, cv2.COLOR_BGR2HSV)

        # Intervalos de tons vermelhos
        lower_red1 = np.array([0, 50, 50])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([170, 50, 50])
        upper_red2 = np.array([180, 255, 255])

        # Máscaras para os intervalos
        mask1 = cv2.inRange(hsv_image, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv_image, lower_red2, upper_red2)

        return cv2.bitwise_or(mask1, mask2)

    def count_objects_in_square(self, square):
        mask = self.detect_red_objects_hsv(square)
        cleaned_mask = self.clean_mask(mask)
        
        # Encontrar contornos e desenhá-los na imagem
        contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        min_area = 50   
        max_area = 2000  
        filtered_contours = [c for c in contours if min_area < cv2.contourArea(c) < max_area]
        
        # Desenhar contornos na imagem original
        contour_img = square.copy()
        cv2.drawContours(contour_img, filtered_contours, -1, (0, 255, 0), 2)  # Desenhar em verde
        
        return len(filtered_contours), contour_img  # Retornar o número de ovos e a imagem com contornos

    def process_square(self, square):
        """Processa um quadrado para melhorar a detecção de objetos."""
        smoothed_square = self.smooth_background(square)
        subtracted_square = self.subtract_background(smoothed_square, smoothed_square)
        bright_contrast = self.increase_brightness_contrast(subtracted_square, alpha=1.5, beta=40)
        adjusted = self.adjust_exposure(bright_contrast)
        denoised = self.remove_noise(adjusted)
        denoised_granular = self.remove_granular_noise(denoised)
        return self.count_objects_in_square(denoised_granular)
