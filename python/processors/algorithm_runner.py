from processors.image_processor import ImageProcessor
from algorithms.blind_square import TraditionalAlgorithm
from algorithms.deep_blind_square import DeepAlgorithmV1
from algorithms.slide_square import DeepAlgorithmV2
import numpy as np
import cv2


class AlgorithmRunner:
    def __init__(self, image, algorithm='blind-square-1', square_size=512):
        self.image = image  # in bytes
        self.algorithm = algorithm
        self.square_size = square_size
        self.square_processor = None

        # Read and decode the image
        self.image = np.frombuffer(image.read(), np.uint8)

        if self.algorithm == 'traditional-v1':
            self.image = cv2.imdecode(self.image, cv2.IMREAD_COLOR)
            self.square_processor = TraditionalAlgorithm()
            return;

        elif self.algorithm == 'deep-v1':
            self.image = cv2.imdecode(self.image, cv2.IMREAD_GRAYSCALE)
            self.square_processor = DeepAlgorithmV1()
            return;

        elif self.algorithm == 'deep-v2':
            self.square_size = 256
            self.image = cv2.imdecode(self.image, cv2.IMREAD_COLOR)
            self.square_processor = DeepAlgorithmV2()
            return;
    
        else:
            raise ValueError("Algoritmo desconhecido")

    def execute(self):
        processor = ImageProcessor(
            self.image, self.square_processor.process_square, self.square_size)
        
        processed_squares, total_objects = processor.process_image()
        
        return {
            "total_objects": total_objects,
            "processed_squares": processed_squares,
            "image_dimensions": {"height": processor.img_height, "width": processor.img_width},
            "used_square_size": self.square_size,
        }
