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
        """
        Percorre a imagem usando janelas deslizantes e retorna um vetor com as informações de coordenadas
        e a contagem de objetos detectados em cada quadrado.

        :return: Lista de dicionários com as informações de cada quadrado processado.
        """
        
        img_height, img_width = self.img_height, self.img_width
        processed_squares = []
        total_objects = 0

        # Calcula os novos tamanhos com preenchimento
        new_height = int(np.ceil(img_height / self.square_size) * self.square_size)
        new_width = int(np.ceil(img_width / self.square_size) * self.square_size)
        
        # Preenche a imagem com zeros
        if len(self.image.shape) == 3:  # Imagem com 3 canais (RGB)
            self.image = np.pad(
                self.image,
                ((0, new_height - img_height), (0, new_width - img_width), (0, 0)),
                mode='constant'
            )
        else:  # Imagem com 1 canal (grayscale)
            self.image = np.pad(
                self.image,
                ((0, new_height - img_height), (0, new_width - img_width)),
                mode='constant'
            )

        # Percorre a imagem com janelas deslizantes
        for y in range(0, new_height, self.square_size):
            for x in range(0, new_width, self.square_size):
                # Extrai a janela
                square = self.image[y:y + self.square_size, x:x + self.square_size]
                # Processa a janela usando a função fornecida
                objects_count, counted_image, points = self.square_processor(square)
                total_objects += objects_count

                # Adiciona o resultado ao vetor
                processed_squares.append({
                    "coordinates": {"x": x, "y": y},
                    "points": points,
                    "objects_detected": objects_count
                })

        return processed_squares, total_objects
