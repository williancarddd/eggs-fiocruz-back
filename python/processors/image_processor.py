import numpy as np

class ImageProcessor:
    def __init__(self, image, square_size=512):
        self.image = image
        self.square_size = square_size
        self.img_height, self.img_width, _ = image.shape

    def divide_image(self):
        """Divide a imagem em quadrados."""
        squares = []
        for y in range(0, self.img_height, self.square_size):
            for x in range(0, self.img_width, self.square_size):
                square = self.image[y:y + self.square_size, x:x + self.square_size]
                squares.append((x, y, square))
        return squares

    def reconstruct_image(self, processed_squares):
        """Reconstrói a imagem a partir dos quadrados processados."""
        reconstructed_image = np.zeros((self.img_height, self.img_width, 3), dtype=np.uint8)
        count = 0
        for y in range(0, self.img_height, self.square_size):
            for x in range(0, self.img_width, self.square_size):
                reconstructed_image[y:y + self.square_size, x:x + self.square_size] = processed_squares[count]
                count += 1
        return reconstructed_image
