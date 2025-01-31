# Usa uma imagem base da NVIDIA com suporte a CUDA e PyTorch
FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04

# Define o fuso horário para evitar prompts interativos
ENV TZ=Etc/UTC
RUN ln -fs /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# Instala dependências do sistema para OpenCV, Ultralytics e PyTorch com GPU
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-pip python3-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho
WORKDIR /app

# Copia apenas o arquivo de dependências primeiro para otimizar cache
COPY requirements.txt .

# Instala as dependências do Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia o restante do código da aplicação
COPY . .

# Define variáveis de ambiente para compatibilidade com GPUs NVIDIA
ENV NVIDIA_DRIVER_CAPABILITIES compute,utility
ENV NVIDIA_VISIBLE_DEVICES all
ENV CUDA_HOME /usr/local/cuda
ENV TORCH_CUDA_ARCH_LIST="8.6"

# Expondo a porta do Gunicorn
EXPOSE 5000

# Comando para rodar a aplicação com Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
