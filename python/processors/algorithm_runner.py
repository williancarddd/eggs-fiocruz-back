from processors.image_processor import ImageProcessor
from algorithms.blind_square import BlindSquareProcessorAlgorithm
from algorithms.deep_blind_square import DeepBlindSquareAlgorithm
from utils.base64_utils import convert_image_to_base64
import numpy as np
import cv2


class AlgorithmRunner:
    def __init__(self, image, algorithm='blind-square-1', square_size=512):
        self.image = image  # in bytes
        self.algorithm = algorithm
        self.square_size = square_size
        self.square_processor = None

        # convert image to numpy array
        self.image = np.frombuffer(image, np.uint8)

        if self.algorithm == 'blind-square-1':
            self.image = cv2.imdecode(self.image, cv2.IMREAD_COLOR)
            self.square_processor = BlindSquareProcessorAlgorithm()
        elif self.algorithm == 'deep-blind-square':
            self.image = cv2.imdecode(self.image, cv2.IMREAD_GRAYSCALE)
            self.square_processor = DeepBlindSquareAlgorithm()
        else:
            raise ValueError("Algoritmo desconhecido")

    def execute(self):
        processor = ImageProcessor(self.image, self.square_size)
        self.image = processor.resize_to_fit_grid(self.image)
        squares = processor.divide_image()

        total_objects = 0
        processed_squares = []
        reconstructed_squares = []

        for x, y, square in squares:

            (objects_count, counted_image) = self.square_processor.process_square(square)
            total_objects += objects_count

            processed_squares.append({
                "coordinates": {"x": x, "y": y},
                "objects_detected": objects_count,
                "square_base64": convert_image_to_base64(counted_image)
            })

            reconstructed_squares.append(square)

        reconstructed_image = processor.reconstruct_image(
            reconstructed_squares)

        return {
            "total_objects": total_objects,
            "processed_squares": processed_squares,
            "image_dimensions": {"height": processor.img_height, "width": processor.img_width},
            "final_image_base64": convert_image_to_base64(reconstructed_image)
        }
