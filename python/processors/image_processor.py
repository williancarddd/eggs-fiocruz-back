import numpy as np

class ImageProcessor:
    def __init__(self, image, square_size=512):
        self.image = image
        self.square_size = square_size
        self.img_height, self.img_width = image.shape[:2]  # Suporte para imagens com qualquer número de canais
        self.num_channels = image.shape[2] if image.ndim == 3 else 1

    def resize_to_fit_grid(self, image):
        """
        Redimensiona a imagem para que sua altura e largura sejam múltiplos do square_size.
        Preenche com zeros (cor preta ou intensidade mínima) se necessário.
        Funciona para imagens com 1, 2 ou 3 canais.
        """
        img_height, img_width = image.shape[:2]
        new_height = img_height + (self.square_size - img_height % self.square_size) % self.square_size
        new_width = img_width + (self.square_size - img_width % self.square_size) % self.square_size

        if image.ndim == 2:  # Grayscale
            resized_image = np.zeros((new_height, new_width), dtype=image.dtype)
            resized_image[:img_height, :img_width] = image
        else:  # Multi-canal
            resized_image = np.zeros((new_height, new_width, self.num_channels), dtype=image.dtype)
            resized_image[:img_height, :img_width, :] = image

        return resized_image

    def divide_image(self):
        """
        Divide a imagem em quadrados de tamanho square_size.
        Funciona para imagens com qualquer número de canais.
        """
        squares = []
        for y in range(0, self.img_height, self.square_size):
            for x in range(0, self.img_width, self.square_size):
                square = self.image[y:y + self.square_size, x:x + self.square_size]
                squares.append((x, y, square))
        return squares

    def reconstruct_image(self, processed_squares):
        """
        Reconstrói a imagem a partir dos quadrados processados.
        Funciona para imagens com qualquer número de canais.
        """
        if self.num_channels == 1:  # Grayscale
            reconstructed_image = np.zeros((self.img_height, self.img_width), dtype=self.image.dtype)
        else:  # Multi-canal
            reconstructed_image = np.zeros((self.img_height, self.img_width, self.num_channels), dtype=self.image.dtype)

        count = 0
        for y in range(0, self.img_height, self.square_size):
            for x in range(0, self.img_width, self.square_size):
                square = processed_squares[count]
                if self.num_channels == 1:  # Grayscale
                    reconstructed_image[y:y + self.square_size, x:x + self.square_size] = square
                else:  # Multi-canal
                    reconstructed_image[y:y + self.square_size, x:x + self.square_size, :] = square
                count += 1
        return reconstructed_image
