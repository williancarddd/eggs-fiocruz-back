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

# Primeiro copia apenas o requirements.txt
COPY requirements.txt .

# Instala dependências do Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Remove build-essential após instalar as dependências
RUN apt-get purge -y --auto-remove build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copia o restante do código
COPY . .

ENV NVIDIA_DRIVER_CAPABILITIES compute,utility
ENV NVIDIA_VISIBLE_DEVICES all

# Comando para rodar a aplicação com gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]