from processors.image_processor import ImageProcessor
from algorithms.blind_square import BlindSquareProcessorAlgorithm
from algorithms.deep_blind_square import DeepBlindSquareAlgorithm
from utils.base64_utils import convert_image_to_base64

class AlgorithmRunner:
    def __init__(self, image, algorithm='blind-square-1', square_size=512):
        self.image = image
        self.algorithm = algorithm
        self.square_size = square_size

    def execute(self):
        processor = ImageProcessor(self.image, self.square_size)
        squares = processor.divide_image()

        total_objects = 0
        processed_squares = []
        reconstructed_squares = []

        for x, y, square in squares:
            if self.algorithm == 'blind-square-1':
                square_processor = BlindSquareProcessorAlgorithm(square)
            elif self.algorithm == 'deep-blind-square':
                square_processor = DeepBlindSquareAlgorithm(square)
            else:
                raise ValueError("Algoritmo desconhecido")

            (objects_count, counted_image) = square_processor.process_square()
            total_objects += objects_count

            processed_squares.append({
                "coordinates": {"x": x, "y": y},
                "objects_detected": objects_count,
                "square_base64": convert_image_to_base64(counted_image)  
            })

            reconstructed_squares.append(square)

        reconstructed_image = processor.reconstruct_image(reconstructed_squares)

        return {
            "total_objects": total_objects,
            "processed_squares": processed_squares,
            "image_dimensions": {"height": processor.img_height, "width": processor.img_width},
            "final_image_base64": convert_image_to_base64(reconstructed_image)
        }