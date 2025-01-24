from .base_algorithm import BaseAlgorithm
from ultralytics import solutions
import cv2
import numpy as np
from skimage import io, exposure


class DeepAlgorithmV2(BaseAlgorithm):
    def __init__(self, square_size=256):
        self.square_size = square_size

    def process_image(self, image):
        increased_contrast = exposure.adjust_gamma(image, gamma=1.5)

        return increased_contrast

    def process_square(self, square):

        model_path = './algorithms/models_ai/scanner-model.pt'
        region = [(0, 0), (self.square_size, 0), (self.square_size,
                                                  self.square_size), (0, self.square_size)]
        counter = solutions.ObjectCounter(
            model=model_path, region=region, show=False)

        counted_image = counter.count(np.array(square))
        boxes_list = []
        if len(counter.boxes) > 0:
            boxes_list = counter.boxes.tolist()

        return len(counter.boxes), counted_image, boxes_list
