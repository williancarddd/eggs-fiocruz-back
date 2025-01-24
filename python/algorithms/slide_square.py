from .base_algorithm import BaseAlgorithm
from ultralytics import YOLO
import cv2
import numpy as np
from skimage import exposure


class DeepAlgorithmV2(BaseAlgorithm):
    def __init__(self, square_size=256):
        self.square_size = square_size
        model_path = './algorithms/models_ai/scanner-model.pt'
        self.model = YOLO(model_path, verbose=False)

    def normalize(self, image):
        increased_contrast = exposure.adjust_gamma(image, gamma=1.5)
        return increased_contrast

    def process_square(self, square):
        # Normalize the image
        normalized = self.normalize(square)

        # Convert to numpy array
        np_image = np.array(normalized)

        # Ensure the image has 3 channels (required by YOLO)
        if len(np_image.shape) == 2:  # Grayscale image
            np_image = cv2.cvtColor(np_image, cv2.COLOR_GRAY2RGB)
        elif np_image.shape[2] == 1:  # Single channel image
            np_image = cv2.cvtColor(np_image, cv2.COLOR_GRAY2RGB)

        # YOLO inference
        results = self.model.predict(np_image)

        # Extract bounding boxes
        boxes_list = []
        for result in results:
            for box in result.boxes:  # Access the boxes from the result
                x1, y1, x2, y2 = box.xyxy[0].tolist()  # Extract coordinates
                confidence = box.conf[0]  # Extract the first value of the confidence score
                label = int(box.cls[0])  # Extract the first value of the class label
                boxes_list.append([x1, y1, x2, y2])
        print(boxes_list)
        return len(boxes_list), 0, boxes_list
