# Use uma imagem base do Python com Slim para reduzir tamanho
FROM python:3.9-slim

# Instala dependências do sistema para o OpenCV e Ultralytics
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho
WORKDIR /app

# Copia o arquivo requirements.txt para o contêiner
COPY requirements.txt .

# Instala dependências do Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação para o contêiner
COPY . .

# Define variáveis de ambiente para melhorar o desempenho
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Comando para rodar a aplicação com gunicorn
CMD ["gunicorn", "-w", "3", "-b", "0.0.0.0:5000", "--timeout", "300", "--threads", "2", "app:app"]
