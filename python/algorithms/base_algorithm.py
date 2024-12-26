from abc import ABC, abstractmethod

class BaseAlgorithm(ABC):
    @abstractmethod
    def process_square(self, square):
        """Processa um quadrado usando um algoritmo específico."""
        pass
