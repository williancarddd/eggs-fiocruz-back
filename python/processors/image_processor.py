import numpy as np


class ImageProcessor:
    def __init__(self, image, square_processor, square_size=512):
        """
        Inicializa a classe ImageProcessor.

        :param image: Imagem a ser processada (array numpy).
        :param square_processor: Função que processa cada quadrado e retorna (objects_count, counted_image).
        :param square_size: Tamanho dos quadrados (janelas deslizantes).
        """
        self.image = image
        self.square_processor = square_processor
        self.square_size = square_size

        # get self.img_height, self.img_width
        # check if is 3 or 2 channels
        if len(self.image.shape) == 3:
            self.img_height, self.img_width, _ = self.image.shape
        else:
            self.img_height, self.img_width = self.image.shape

    def process_image(self):
        processed_squares = []
        total_objects = 0

        for y in range(0, self.img_height, self.square_size):
            for x in range(0, self.img_width, self.square_size):
                # Calculate actual square size (avoids padding)
                y_end = min(y + self.square_size, self.img_height)
                x_end = min(x + self.square_size, self.img_width)
                square = self.image[y:y_end, x:x_end]

                # Process square
                objects_count, _, points = self.square_processor(square)
                total_objects += objects_count

                processed_squares.append({
                    "coordinates": {"x": x, "y": y},
                    "points": points,
                    "objects_detected": objects_count
                })

        return processed_squares, total_objects
